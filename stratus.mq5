//+------------------------------------------------------------------+
//| SoopAlgo - Premium Targets (MT5)                                 |
//| Versão com JSON + STAGES + TEMA/LOGO                             |
//| Base: script TV "SoopAlgo v6" (conversão livre p/ MQL5)          |
//+------------------------------------------------------------------+
#property strict
#property indicator_chart_window
#property indicator_plots   4
#property indicator_buffers 4

//--- Plot 0: BUY arrows
#property indicator_type1   DRAW_ARROW
#property indicator_color1  clrLime
#property indicator_width1  2

//--- Plot 1: SELL arrows
#property indicator_type2   DRAW_ARROW
#property indicator_color2  clrRed
#property indicator_width2  2

//--- Plot 2: SuperTrend UP
#property indicator_type3   DRAW_LINE
#property indicator_color3  clrDodgerBlue
#property indicator_width3  1

//--- Plot 3: SuperTrend DOWN
#property indicator_type4   DRAW_LINE
#property indicator_color4  clrMagenta
#property indicator_width4  1

//+------------------------------------------------------------------+
//  INPUTS
//+------------------------------------------------------------------+

//--- Grupo Trend (SuperTrend)
input string   InpGroupTrend      = "===== SoopAlgo Trend =====";
input int      InpATRPeriod       = 10;      // ATR Period
input double   InpATRMult         = 3.0;     // ATR Multiplier
input bool     InpUseATR          = true;    // true = iATR (Wilder), false = SMA(TR)

// Fonte para o SuperTrend
enum ENUM_ST_SOURCE
  {
   ST_SRC_CLOSE = 0,  // fechamento
   ST_SRC_HL2,        // (High+Low)/2
   ST_SRC_HLC3,       // (High+Low+Close)/3
   ST_SRC_OHLC4       // (Open+High+Low+Close)/4
  };
input ENUM_ST_SOURCE InpSTSource  = ST_SRC_HL2;

//--- Grupo UI
input string   InpGroupUI         = "===== SoopAlgo UI =====";
input bool     InpShowSignals     = true;    // mostrar setas BUY/SELL?
input bool     InpHighlight       = true;    // (não usado totalmente, mantido p/ compat)

//--- Grupo Stages
input string   InpGroupStages     = "===== STAGES SETTINGS =====";
input bool     InpEnableStages    = true;   // usar sistema de stages?
input double   InpTPMultiplier    = 1.0;    // TP = ATR * multiplicador
input int      InpTargetATRLen    = 50;     // ATR p/ TP/SL
input double   InpConfirmTolPips  = 5.0;    // tolerância para CONFIRMED (pips)
input int      InpExecDelaySeconds= 5;      // delay para EXECUTED (segundos)
input bool     InpShowTPSL        = true;   // desenhar linhas TP/SL?

//--- Cores (o MT5 não tem transparência, então é aproximado)
input color    InpColorBuy        = clrDodgerBlue;
input color    InpColorSell       = clrMagenta;
input color    InpColorT1         = C'8,153,129';   // #089981 aprox.
input color    InpColorT2         = C'242,54,69';   // #f23645 aprox.
input color    InpColorReached    = clrSilver;
input color    InpColorSLLine     = clrPink;        // linha do SL
input color    InpColorTPLine     = clrLimeGreen;   // linha do TP (T2)

//--- JSON QUEUE (grava arquivos para EA ler)
input string   InpGroupAPI        = "===== JSON QUEUE =====";
input bool     EnableQueue        = true;   // grava arquivos JSON?
input string   QueuePrefix        = "mpq_soop_";

//--- THEME / LOGO
input string   InpGroupTheme      = "===== TEMA / LOGO =====";
input bool     ApplyTheme         = false;
input color    ThemeBg            = clrBlack;
input color    ThemeBull          = clrLime;
input color    ThemeBear          = clrRed;
input bool     HideGrid           = true;
input bool     HideVolumes        = true;
input bool     HidePeriodSep      = true;
input string   LogoFile           = "\\Images\\dl.bmp";
input int      LogoX              = 10;
input int      LogoY              = 80;

//--- TARGETS SETTINGS
input string   InpGroupTargets    = "===== TARGETS SETTINGS =====";
input bool     InpEnableTargets   = true;
input bool     InpWaitUntilHit    = false;
input double   InpT1Dist          = 1.0;  // T1 = ATR * multiplicador
input double   InpT2Dist          = 2.0;  // T2 = ATR * multiplicador
input double   InpT1SLTrail       = 0.90; // 0.90 = SL fica 10% antes do T1 (entre entrada e T1)



//+------------------------------------------------------------------+
//  BUFFERS
//+------------------------------------------------------------------+
double BuyBuffer[];      // setas de compra
double SellBuffer[];     // setas de venda
double ST_UpBuffer[];    // linha SuperTrend em tendência de alta
double ST_DnBuffer[];    // linha SuperTrend em tendência de baixa

//+------------------------------------------------------------------+
//  VARIÁVEIS GLOBAIS
//+------------------------------------------------------------------+

// handles ATR
int hATR_Main   = -1;   // ATR p/ SuperTrend
int hATR_Target = -1;   // ATR p/ Targets

// arrays auxiliares p/ SuperTrend
double g_up[];          // banda superior (na prática linha de baixo no bull)
double g_dn[];          // banda inferior
int    g_trend[];       // 1 = alta, -1 = baixa

// Linhas TP/SL
string TPLineName = "SA_TP_Line";
string SLLineName = "SA_SL_Line";

// para não recriar sinal duplicado no mesmo candle
datetime lastBuySignalTime  = 0;
datetime lastSellSignalTime = 0;

// ESTATÍSTICAS
int totalGAIN    = 0;  // Targets atingidos
int totalLOSS    = 0;  // Targets perdidos
int totalSignals = 0;

//--- STAGES / JSON (igual MB_BLACK)
enum ENUM_SA_STAGE
  {
   SA_STAGE_PRE = 0,
   SA_STAGE_CONFIRMED,
   SA_STAGE_EXECUTED,
   SA_STAGE_CLOSED,
   SA_STAGE_T1_HIT,
   SA_STAGE_T2_HIT,
   SA_STAGE_STOP
  };

struct SignalStages
  {
   string         id;
   string         side;           // "buy" / "sell"
   ENUM_SA_STAGE  stage;
   bool           active;
   datetime       pre_time;
   datetime       confirmed_time;
   datetime       executed_time;
   datetime       closed_time;
   double         entry_price;
   double         sl_price;
   double         tp_price;
   double         execution_price;
   double         close_price;
   double         result_pips;
   bool           is_win;
   double         atr_value;
  };

SignalStages currentSignal;

//--- TARGETS (variáveis globais)
bool   LongActive1=false, LongActive2=false;
bool   ShortActive1=false, ShortActive2=false;
bool   LongReached1=false, LongReached2=false;
bool   ShortReached1=false, ShortReached2=false;
double LongVal1=0, LongVal2=0;
double ShortVal1=0, ShortVal2=0;

// flags de stop antes/depois de T1/T2
bool   LongStopped=false;
bool   ShortStopped=false;

// nomes de objetos de linha/label
string LongLine1Name="SA_Long_T1", LongLbl1Name="SA_Long_T1_Lbl";
string LongLine2Name="SA_Long_T2", LongLbl2Name="SA_Long_T2_Lbl";
string ShortLine1Name="SA_Short_T1", ShortLbl1Name="SA_Short_T1_Lbl";
string ShortLine2Name="SA_Short_T2", ShortLbl2Name="SA_Short_T2_Lbl";

//--- Estruturas de sinal para JSON
struct SignalData
  {
   bool     active;
   string   side;
   datetime time;
   double   entry;
   double   sl;
   double   t1;
   double   t2;
   string   id;
  };

SignalData longSig, shortSig;

//--- Licença
bool g_isLicensed = false;
string g_licenseReason = "";
datetime g_lastFileCheck = 0;



//+------------------------------------------------------------------+
//  FUNÇÕES AUXILIARES
//+------------------------------------------------------------------+

string JSONGetString(const string &json, const string &key)
  {
   string search = "\"" +key+"\":";
   int pos = StringFind(json, search);
   if(pos < 0) return "";
   
   int start = pos + StringLen(search);
   while(start < StringLen(json) && (json[start] == ' ' || json[start] == '\t'))
      start++;
   
   if(start >= StringLen(json)) return "";
   if(json[start] == 'n') return "";
   if(json[start] != '\"') return "";
   start++;
   
   int end = StringFind(json, "\"", start);
   if(end < 0) return "";
   
   return StringSubstr(json, start, end - start);
  }

bool JSONGetBool(const string &json, const string &key)
  {
   string search = "\"" +key+"\":";
   int pos = StringFind(json, search);
   if(pos < 0) return false;
   
   int start = pos + StringLen(search);
   while(start < StringLen(json) && (json[start] == ' ' || json[start] == '\t'))
      start++;
   
   if(start >= StringLen(json)) return false;
   if(StringSubstr(json, start, 4) == "true") return true;
   return false;
  }

bool ReadLicenseStateFromFile()
  {
   string filename = "soopalgo_license_state.json";
   
   int h = FileOpen(filename, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h == INVALID_HANDLE)
     {
      g_licenseReason = "EA_NOT_RUNNING";
      return false;
     }
   
   string json = "";
   while(!FileIsEnding(h))
     {
      json += FileReadString(h);
     }
   FileClose(h);
   
   bool ok = JSONGetBool(json, "ok");
   string reason = JSONGetString(json, "reason");
   
   if(!ok)
     {
      g_licenseReason = (StringLen(reason) > 0) ? reason : "INVALID";
      return false;
     }
   
   g_licenseReason = "";
   return true;
  }

void SetLicenseOverlay(string msg)
  {
   string objName = "SA_LicenseOverlay";
   
   if(ObjectFind(0, objName) < 0)
     {
      ObjectCreate(0, objName, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, objName, OBJPROP_CORNER, 0);
      ObjectSetInteger(0, objName, OBJPROP_XDISTANCE, 10);
      ObjectSetInteger(0, objName, OBJPROP_YDISTANCE, 30);
      ObjectSetInteger(0, objName, OBJPROP_FONTSIZE, 12);
      ObjectSetInteger(0, objName, OBJPROP_COLOR, clrRed);
     }
   
   ObjectSetString(0, objName, OBJPROP_TEXT, msg);
  }

double ToPips(double price_diff)
  {
   double point = _Point;
   if(_Digits == 3 || _Digits == 5)
      return price_diff / (point * 10);
   return price_diff / point;
  }

string GenerateSignalID(string side, datetime t)
  {
   return side + "_" + IntegerToString(t);
  }

void SendSignalEvent(SignalData &sig, ENUM_SA_STAGE stage, int target, double pips, bool win)
  {
   // Placeholder
  }

void DrawTPSL(double tp, double sl)
  {
   if(!InpShowTPSL) return;
   
   if(ObjectFind(0, TPLineName) < 0)
      ObjectCreate(0, TPLineName, OBJ_HLINE, 0, 0, tp);
   else
      ObjectSetDouble(0, TPLineName, OBJPROP_PRICE, tp);
   ObjectSetInteger(0, TPLineName, OBJPROP_COLOR, InpColorTPLine);
   ObjectSetInteger(0, TPLineName, OBJPROP_STYLE, STYLE_DOT);
   
   if(ObjectFind(0, SLLineName) < 0)
      ObjectCreate(0, SLLineName, OBJ_HLINE, 0, 0, sl);
   else
      ObjectSetDouble(0, SLLineName, OBJPROP_PRICE, sl);
   ObjectSetInteger(0, SLLineName, OBJPROP_COLOR, InpColorSLLine);
   ObjectSetInteger(0, SLLineName, OBJPROP_STYLE, STYLE_DOT);
  }

void UpdateStatsPanel()
  {
   string objName = "SA_StatsPanel";
   if(ObjectFind(0, objName) < 0)
     {
      ObjectCreate(0, objName, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, objName, OBJPROP_CORNER, 1);
      ObjectSetInteger(0, objName, OBJPROP_XDISTANCE, 10);
      ObjectSetInteger(0, objName, OBJPROP_YDISTANCE, 30);
      ObjectSetInteger(0, objName, OBJPROP_FONTSIZE, 10);
      ObjectSetInteger(0, objName, OBJPROP_COLOR, clrWhite);
     }
   
   string text = "Signals: " + IntegerToString(totalSignals);
   text += " | Gain: " + IntegerToString(totalGAIN);
   text += " | Loss: " + IntegerToString(totalLOSS);
   ObjectSetString(0, objName, OBJPROP_TEXT, text);
  }

void CreateTarget(string lineName, string lblName, double price, color clr, string txt)
  {
   if(ObjectFind(0, lineName) < 0)
      ObjectCreate(0, lineName, OBJ_HLINE, 0, 0, price);
   else
      ObjectSetDouble(0, lineName, OBJPROP_PRICE, price);
   ObjectSetInteger(0, lineName, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, lineName, OBJPROP_STYLE, STYLE_DASH);
   
   if(ObjectFind(0, lblName) < 0)
     {
      ObjectCreate(0, lblName, OBJ_TEXT, 0, TimeCurrent(), price);
      ObjectSetString(0, lblName, OBJPROP_TEXT, "T" + txt);
      ObjectSetInteger(0, lblName, OBJPROP_COLOR, clr);
     }
  }

void DeleteTarget(string lineName, string lblName)
  {
   ObjectDelete(0, lineName);
   ObjectDelete(0, lblName);
  }

void MarkReached(string lineName, string lblName, double price)
  {
   ObjectSetInteger(0, lineName, OBJPROP_COLOR, InpColorReached);
   ObjectSetInteger(0, lblName, OBJPROP_COLOR, InpColorReached);
  }

double GetTargetDistance(double multiplier, double refPrice)
  {
   double atrBuf[];
   ArraySetAsSeries(atrBuf, true);
   if(CopyBuffer(hATR_Target, 0, 0, 1, atrBuf) <= 0)
      return 0.0;
   return atrBuf[0] * multiplier;
  }

void ApplyChartTheme()
  {
   ChartSetInteger(0,CHART_COLOR_BACKGROUND,ThemeBg);
   ChartSetInteger(0,CHART_COLOR_FOREGROUND,clrWhite);
   ChartSetInteger(0,CHART_COLOR_GRID,C'30,30,30');
   ChartSetInteger(0,CHART_COLOR_CHART_UP,ThemeBull);
   ChartSetInteger(0,CHART_COLOR_CHART_DOWN,ThemeBear);
   ChartSetInteger(0,CHART_COLOR_CANDLE_BULL,ThemeBull);
   ChartSetInteger(0,CHART_COLOR_CANDLE_BEAR,ThemeBear);
   if(HideGrid) ChartSetInteger(0,CHART_SHOW_GRID,false);
   if(HideVolumes) ChartSetInteger(0,CHART_SHOW_VOLUMES,false);
   if(HidePeriodSep) ChartSetInteger(0,CHART_SHOW_PERIOD_SEP,false);
  }

double STSourcePrice(int i, const double &o[], const double &h[], const double &l[], const double &c[])
  {
   switch(InpSTSource)
     {
      case ST_SRC_CLOSE: return c[i];
      case ST_SRC_HL2: return (h[i]+l[i])/2.0;
      case ST_SRC_HLC3: return (h[i]+l[i]+c[i])/3.0;
      case ST_SRC_OHLC4: return (o[i]+h[i]+l[i]+c[i])/4.0;
     }
   return c[i];
  }

//+------------------------------------------------------------------+
//  OnInit
//+------------------------------------------------------------------+
int OnInit()
  {
   g_isLicensed = ReadLicenseStateFromFile();
   
   if(!g_isLicensed)
     {
      string msg = "❌ LICENÇA INVÁLIDA";
      if(g_licenseReason == "EA_NOT_RUNNING")
         msg += "\nAnexe o EA SoopAlgo_LicenseBridgeEA";
      else
         msg += "\n" + g_licenseReason;
      
      SetLicenseOverlay(msg);
      Print("[INDICATOR] ", msg);
     }
   else
     {
      ObjectDelete(0, "SA_LicenseOverlay");
     }
   
   IndicatorSetString(INDICATOR_SHORTNAME,"SoopAlgo MT5");

   //--- buffers
   SetIndexBuffer(0,BuyBuffer,INDICATOR_DATA);
   SetIndexBuffer(1,SellBuffer,INDICATOR_DATA);
   SetIndexBuffer(2,ST_UpBuffer,INDICATOR_DATA);
   SetIndexBuffer(3,ST_DnBuffer,INDICATOR_DATA);

   ArraySetAsSeries(BuyBuffer,true);
   ArraySetAsSeries(SellBuffer,true);
   ArraySetAsSeries(ST_UpBuffer,true);
   ArraySetAsSeries(ST_DnBuffer,true);

   PlotIndexSetInteger(0,PLOT_ARROW,233);   // seta pra cima
   PlotIndexSetInteger(1,PLOT_ARROW,234);   // seta pra baixo
   PlotIndexSetDouble (0,PLOT_EMPTY_VALUE,EMPTY_VALUE);
   PlotIndexSetDouble (1,PLOT_EMPTY_VALUE,EMPTY_VALUE);
   PlotIndexSetDouble (2,PLOT_EMPTY_VALUE,EMPTY_VALUE);
   PlotIndexSetDouble (3,PLOT_EMPTY_VALUE,EMPTY_VALUE);

   //--- ATRs
   hATR_Main   = iATR(_Symbol,_Period,InpATRPeriod);
   hATR_Target = iATR(_Symbol,_Period,InpTargetATRLen);

   if(hATR_Main<0 || hATR_Target<0)
     {
      Print("Erro ao criar handle ATR");
      return(INIT_FAILED);
     }

   ArrayResize(g_up,0);
   ArrayResize(g_dn,0);
   ArrayResize(g_trend,0);

   // init do sinal atual
   currentSignal.active = false;
   currentSignal.stage  = SA_STAGE_PRE;

   // init sinais de targets
   longSig.active  = false;
   shortSig.active = false;
   LongStopped     = false;
   ShortStopped    = false;

   Print("=====================================");
   Print("🎯 SoopAlgo STAGES v1.0");
   Print("TP: ",InpTPMultiplier,"x ATR | SL: SuperTrend");
   Print("Stages: PRE → CONFIRMED → EXECUTED → CLOSED");
   Print("=====================================");

   // Limpar targets antigos
   DeleteTarget(LongLine1Name,LongLbl1Name);
   DeleteTarget(LongLine2Name,LongLbl2Name);
   DeleteTarget(ShortLine1Name,ShortLbl1Name);
   DeleteTarget(ShortLine2Name,ShortLbl2Name);

   if(ObjectFind(0,"SA_Logo")>=0)
      ObjectDelete(0,"SA_Logo");
   if(ObjectCreate(0,"SA_Logo",OBJ_BITMAP_LABEL,0,0,0))
     {
      ObjectSetString (0,"SA_Logo",OBJPROP_BMPFILE,LogoFile);
      ObjectSetInteger(0,"SA_Logo",OBJPROP_CORNER,CORNER_LEFT_UPPER);
      ObjectSetInteger(0,"SA_Logo",OBJPROP_XDISTANCE,LogoX);
      ObjectSetInteger(0,"SA_Logo",OBJPROP_YDISTANCE,LogoY);
      ObjectSetInteger(0,"SA_Logo",OBJPROP_BACK,true);
      ObjectSetInteger(0,"SA_Logo",OBJPROP_HIDDEN,true);
      ObjectSetInteger(0,"SA_Logo",OBJPROP_SELECTABLE,false);
      ObjectSetInteger(0,"SA_Logo",OBJPROP_ZORDER,100);
     }

   if(ApplyTheme)
      ApplyChartTheme();

   // === LICENCIAMENTO ===


   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//  OnDeinit
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   ObjectDelete(0, "SA_LicenseOverlay");
   
   // apagar objetos
   if(ObjectFind(0,TPLineName)>=0) ObjectDelete(0,TPLineName);
   if(ObjectFind(0,SLLineName)>=0) ObjectDelete(0,SLLineName);

   DeleteTarget(LongLine1Name,LongLbl1Name);
   DeleteTarget(LongLine2Name,LongLbl2Name);
   DeleteTarget(ShortLine1Name,ShortLbl1Name);
   DeleteTarget(ShortLine2Name,ShortLbl2Name);

   if(ObjectFind(0,"SA_StatsPanel")>=0)
      ObjectDelete(0,"SA_StatsPanel");

   if(ObjectFind(0,"SA_Logo")>=0)
      ObjectDelete(0,"SA_Logo");
  }

//+------------------------------------------------------------------+
//  OnCalculate
//+------------------------------------------------------------------+
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
  {
   if(rates_total<InpATRPeriod+5)
      return 0;

   ArraySetAsSeries(time,true);
   ArraySetAsSeries(open,true);
   ArraySetAsSeries(high,true);
   ArraySetAsSeries(low,true);
   ArraySetAsSeries(close,true);

   if(TimeCurrent() - g_lastFileCheck > 5)
     {
      g_lastFileCheck = TimeCurrent();
      g_isLicensed = ReadLicenseStateFromFile();
      
      if(!g_isLicensed)
        {
         string msg = "❌ LICENÇA INVÁLIDA";
         if(g_licenseReason == "EA_NOT_RUNNING")
            msg += "\nAnexe o EA SoopAlgo_LicenseBridgeEA";
         else
            msg += "\n" + g_licenseReason;
         
         SetLicenseOverlay(msg);
        }
      else
        {
         ObjectDelete(0, "SA_LicenseOverlay");
        }
     }
   
   if(!g_isLicensed)
     {
      ArrayInitialize(BuyBuffer, EMPTY_VALUE);
      ArrayInitialize(SellBuffer, EMPTY_VALUE);
      ArrayInitialize(ST_UpBuffer, EMPTY_VALUE);
      ArrayInitialize(ST_DnBuffer, EMPTY_VALUE);
      return rates_total;
     }

   //--- ATR principal / TR
   static double atrMain[];
   static double tr[];
   if(ArraySize(atrMain)<rates_total)
     {
      ArrayResize(atrMain,rates_total);
      ArrayResize(tr,rates_total);
      ArraySetAsSeries(atrMain,true);
      ArraySetAsSeries(tr,true);
     }

   if(InpUseATR)
     {
      // usa iATR (Wilder)
      if(CopyBuffer(hATR_Main,0,0,rates_total,atrMain)<=0)
         return prev_calculated;
     }
   else
     {
      // TR
      for(int i=rates_total-1;i>=0;i--)
        {
         if(i==rates_total-1)
            tr[i]=high[i]-low[i];
         else
            tr[i]=MathMax(high[i]-low[i],
                          MathMax(MathAbs(high[i]-close[i+1]),
                                  MathAbs(low[i]-close[i+1])));
        }
      // SMA(TR, n)
      for(int i=rates_total-1;i>=0;i--)
        {
         double sum=0.0;
         int    cnt=0;
         for(int j=0;j<InpATRPeriod && (i+j)<rates_total;j++)
           {
            sum+=tr[i+j];
            cnt++;
           }
         atrMain[i]=(cnt>0)?sum/cnt:0.0;
        }
     }

   //--- garantir tamanho dos arrays internos
   if(ArraySize(g_up)<rates_total)
     {
      ArrayResize(g_up,rates_total);
      ArrayResize(g_dn,rates_total);
      ArrayResize(g_trend,rates_total);
      ArraySetAsSeries(g_up,true);
      ArraySetAsSeries(g_dn,true);
      ArraySetAsSeries(g_trend,true);
     }

   //--- SuperTrend (processar do mais antigo para o mais recente)
   for(int i=rates_total-1;i>=0;i--)
     {
      double src = STSourcePrice(i,open,high,low,close);
      double atr = atrMain[i];

      if(i==rates_total-1)
        {
         g_up[i]=src - InpATRMult*atr;
         g_dn[i]=src + InpATRMult*atr;
         g_trend[i]=1;
        }
      else
        {
         double up  = src - InpATRMult*atr;
         double up1 = g_up[i+1];
         if(close[i+1]>up1)
            up = MathMax(up,up1);

         double dn  = src + InpATRMult*atr;
         double dn1 = g_dn[i+1];
         if(close[i+1]<dn1)
            dn = MathMin(dn,dn1);

         g_up[i]=up;
         g_dn[i]=dn;

         int trendPrev = g_trend[i+1];
         int trendCurr = trendPrev;

         if(trendPrev==-1 && close[i]>dn1)
            trendCurr=1;
         else if(trendPrev==1 && close[i]<up1)
            trendCurr=-1;

         g_trend[i]=trendCurr;
        }

      // desenhar SuperTrend
      if(g_trend[i]==1)
        {
         ST_UpBuffer[i]=g_up[i];
         ST_DnBuffer[i]=EMPTY_VALUE;
        }
      else
        {
         ST_UpBuffer[i]=EMPTY_VALUE;
         ST_DnBuffer[i]=g_dn[i];
        }
     }

   //--- DESENHAR SETAS HISTÓRICAS (não repinta)
   if(InpShowSignals)
     {
      // limpa apenas as setas
      for(int i=rates_total-1; i>=0; i--)
        {
         BuyBuffer[i]  = EMPTY_VALUE;
         SellBuffer[i] = EMPTY_VALUE;
        }

      // percorre todas as barras fechadas (deixa i=0 para barra atual)
      for(int i=rates_total-2; i>=1; i--)
        {
         int trendCurr = g_trend[i];
         int trendPrev = g_trend[i+1];

         bool buySigBar  = (trendCurr==1  && trendPrev==-1);
         bool sellSigBar = (trendCurr==-1 && trendPrev== 1);

         if(buySigBar)
            BuyBuffer[i]  = low[i]  - 2*_Point;

         if(sellSigBar)
            SellBuffer[i] = high[i] + 2*_Point;
        }
     }

   //--- sinais apenas na barra fechada (shift = 1) para lógica de targets/JSON
   if(rates_total<3)
      return rates_total;

   int shift      = 1;
   int trendCurr  = g_trend[shift];
   int trendPrev  = g_trend[shift+1];

   bool buySignal  = (trendCurr==1  && trendPrev==-1);
   bool sellSignal = (trendCurr==-1 && trendPrev== 1);

   //--- TARGETS ----------------------------------------------------
   if(InpEnableTargets)
     {
      double entryPrice = close[shift];

      // NOVO BUY
      if(buySignal && time[shift]!=lastBuySignalTime)
        {
         bool canCreate = !InpWaitUntilHit ||
                          ((!LongActive1 || LongReached1) &&
                           (!LongActive2 || LongReached2));

         if(canCreate)
           {
            // Se havia long ativo com target pendente => STOP (LOSS técnico)
            if(longSig.active &&
               ((LongActive1 && !LongReached1) || (LongActive2 && !LongReached2)))
              {
               double lossPips = 0.0;
               if(longSig.sl>0.0)
                 {
                  double diff = MathAbs(longSig.entry - longSig.sl);
                  lossPips = ToPips(diff);
                 }
               SendSignalEvent(longSig,SA_STAGE_STOP,0,-lossPips,false);
              }

            // Contagem interna de LOSS para stats
            if(LongActive1 && !LongReached1) totalLOSS++;
            if(LongActive2 && !LongReached2) totalLOSS++;

            // limpar antigos
            DeleteTarget(LongLine1Name,LongLbl1Name);
            DeleteTarget(LongLine2Name,LongLbl2Name);
            LongReached1=false;
            LongReached2=false;
            LongActive1=false;
            LongActive2=false;
            LongStopped = false;

            double d1 = GetTargetDistance(InpT1Dist,entryPrice);
            double d2 = GetTargetDistance(InpT2Dist,entryPrice);

            LongVal1 = entryPrice + d1;
            LongVal2 = entryPrice + d2;

            CreateTarget(LongLine1Name,LongLbl1Name,LongVal1,InpColorT1,"1");
            CreateTarget(LongLine2Name,LongLbl2Name,LongVal2,InpColorT2,"2");

            LongActive1=true;
            LongActive2=true;
            lastBuySignalTime = time[shift];
            totalSignals++;

            // Registrar novo sinal long para JSON
            longSig.active = true;
            longSig.side   = "buy";
            longSig.time   = time[shift];
            longSig.entry  = entryPrice;

            double slPrice = g_up[shift]; // linha do ST de alta
            // fallback se algo der errado
            if(slPrice<=0 || slPrice>=entryPrice)
               slPrice = entryPrice - (d1>0.0 ? d1 : GetTargetDistance(InpT1Dist,entryPrice));

            longSig.sl = slPrice;
            longSig.t1 = LongVal1;
            longSig.t2 = LongVal2;
            longSig.id = GenerateSignalID("buy",longSig.time);

            // desenha TP/SL (TP = T2)
            DrawTPSL(LongVal2,longSig.sl);

            // evento PRE
            SendSignalEvent(longSig,SA_STAGE_PRE,0,0.0,false);
           }
        }

      // NOVO SELL
      if(sellSignal && time[shift]!=lastSellSignalTime)
        {
         bool canCreate = !InpWaitUntilHit ||
                          ((!ShortActive1 || ShortReached1) &&
                           (!ShortActive2 || ShortReached2));

         if(canCreate)
           {
            // Se havia short ativo com target pendente => STOP (LOSS técnico)
            if(shortSig.active &&
               ((ShortActive1 && !ShortReached1) || (ShortActive2 && !ShortReached2)))
              {
               double lossPips = 0.0;
               if(shortSig.sl>0.0)
                 {
                  double diff = MathAbs(shortSig.sl - shortSig.entry);
                  lossPips = ToPips(diff);
                 }
               SendSignalEvent(shortSig,SA_STAGE_STOP,0,-lossPips,false);
              }

            // Contagem interna de LOSS
            if(ShortActive1 && !ShortReached1) totalLOSS++;
            if(ShortActive2 && !ShortReached2) totalLOSS++;

            // limpar antigos
            DeleteTarget(ShortLine1Name,ShortLbl1Name);
            DeleteTarget(ShortLine2Name,ShortLbl2Name);
            ShortReached1=false;
            ShortReached2=false;
            ShortActive1=false;
            ShortActive2=false;
            ShortStopped = false;

            double d1 = GetTargetDistance(InpT1Dist,entryPrice);
            double d2 = GetTargetDistance(InpT2Dist,entryPrice);

            ShortVal1 = entryPrice - d1;
            ShortVal2 = entryPrice - d2;

            CreateTarget(ShortLine1Name,ShortLbl1Name,ShortVal1,InpColorT1,"1");
            CreateTarget(ShortLine2Name,ShortLbl2Name,ShortVal2,InpColorT2,"2");

            ShortActive1=true;
            ShortActive2=true;
            lastSellSignalTime = time[shift];
            totalSignals++;

            // Registrar novo sinal short para JSON
            shortSig.active = true;
            shortSig.side   = "sell";
            shortSig.time   = time[shift];
            shortSig.entry  = entryPrice;

            double slPrice = g_dn[shift]; // linha ST de baixa
            if(slPrice<=0 || slPrice<=entryPrice)
               slPrice = entryPrice + (d1>0.0 ? d1 : GetTargetDistance(InpT1Dist,entryPrice));

            shortSig.sl = slPrice;
            shortSig.t1 = ShortVal1;
            shortSig.t2 = ShortVal2;
            shortSig.id = GenerateSignalID("sell",shortSig.time);

            // desenha TP/SL (TP = T2)
            DrawTPSL(ShortVal2,shortSig.sl);

            // evento PRE
            SendSignalEvent(shortSig,SA_STAGE_PRE,0,0.0,false);
           }
        }

      //--- checar se targets foram atingidos (preço atual)
      double hi = high[0];
      double lo = low[0];

      // LONG T1
      if(LongActive1 && !LongReached1 && hi>=LongVal1)
        {
         LongReached1=true;
         MarkReached(LongLine1Name,LongLbl1Name,LongVal1);
         totalGAIN++;

         if(longSig.active)
           {
            double diff = MathAbs(LongVal1 - longSig.entry);
            double pips = ToPips(diff);

            // mover SL para perto de T1 (trailing)
            double ratio = InpT1SLTrail;
            if(ratio<0.0) ratio = 0.0;
            if(ratio>1.0) ratio = 1.0;
            double dist = LongVal1 - longSig.entry;
            double newSL = longSig.entry + dist * ratio;
            if(newSL<longSig.entry) newSL = longSig.entry; // garante não ficar abaixo da entrada
            longSig.sl = newSL;

            // atualizar linha de SL/TP (TP continua T2)
            DrawTPSL(LongVal2,longSig.sl);

            // evento T1_HIT (win parcial)
            SendSignalEvent(longSig,SA_STAGE_T1_HIT,1,pips,true);
           }
        }

      // LONG T2 -> CLOSED WIN
      if(LongActive2 && !LongReached2 && hi>=LongVal2)
        {
         LongReached2=true;
         MarkReached(LongLine2Name,LongLbl2Name,LongVal2);
         totalGAIN++;

         if(longSig.active)
           {
            double diff = MathAbs(LongVal2 - longSig.entry);
            double pips = ToPips(diff);

            // evento CLOSED final (T2)
            SendSignalEvent(longSig,SA_STAGE_CLOSED,2,pips,true);

            LongActive1   = false;
            LongActive2   = false;
            LongReached1  = false;
            LongReached2  = false;
            LongStopped   = false;
            longSig.active= false;
           }
        }

      // SHORT T1
      if(ShortActive1 && !ShortReached1 && lo<=ShortVal1)
        {
         ShortReached1=true;
         MarkReached(ShortLine1Name,ShortLbl1Name,ShortVal1);
         totalGAIN++;

         if(shortSig.active)
           {
            double diff = MathAbs(ShortVal1 - shortSig.entry);
            double pips = ToPips(diff);

            // mover SL para perto de T1 (trailing) - abaixo da entrada
            double ratio = InpT1SLTrail;
            if(ratio<0.0) ratio = 0.0;
            if(ratio>1.0) ratio = 1.0;
            double dist = shortSig.entry - ShortVal1;
            double newSL = shortSig.entry - dist * ratio;
            if(newSL>shortSig.entry) newSL = shortSig.entry; // garante não ficar acima da entrada
            shortSig.sl = newSL;

            // atualizar linha de SL/TP (TP continua T2)
            DrawTPSL(ShortVal2,shortSig.sl);

            // evento T1_HIT
            SendSignalEvent(shortSig,SA_STAGE_T1_HIT,1,pips,true);
           }
        }

      // SHORT T2 -> CLOSED WIN
      if(ShortActive2 && !ShortReached2 && lo<=ShortVal2)
        {
         ShortReached2=true;
         MarkReached(ShortLine2Name,ShortLbl2Name,ShortVal2);
         totalGAIN++;

         if(shortSig.active)
           {
            double diff = MathAbs(ShortVal2 - shortSig.entry);
            double pips = ToPips(diff);

            // evento CLOSED final (T2)
            SendSignalEvent(shortSig,SA_STAGE_CLOSED,2,pips,true);

            ShortActive1    = false;
            ShortActive2    = false;
            ShortReached1   = false;
            ShortReached2   = false;
            ShortStopped    = false;
            shortSig.active = false;
           }
        }

      //--- LONG: Stop Loss ANTES de T1/T2 -> CLOSED com loss
      if(longSig.active &&
         !LongStopped &&
         !LongReached1 && !LongReached2 &&
         lo <= longSig.sl)                    // preço atual bateu SL
        {
         LongStopped = true;
         totalLOSS++;

         double diff = MathAbs(longSig.entry - longSig.sl);
         double pips = ToPips(diff);

         // CLOSED com loss (antes de T1)
         SendSignalEvent(longSig, SA_STAGE_CLOSED, 0, -pips, false);

         LongActive1    = false;
         LongActive2    = false;
         LongReached1   = false;
         LongReached2   = false;
         longSig.active = false;
        }

      //--- LONG: Stop Loss DEPOIS de T1 e ANTES de T2 -> CLOSED com win parcial
      if(longSig.active &&
         !LongStopped &&
         LongReached1 && !LongReached2 &&
         lo <= longSig.sl)                    // preço atual bateu SL (já puxado pra região do T1)
        {
         LongStopped = true;

         double profitPriceDiff = longSig.sl - longSig.entry; // deve ser >=0
         double pips = ToPips(profitPriceDiff);
         bool   win  = (pips>=0.0);

         SendSignalEvent(longSig, SA_STAGE_CLOSED, 1, pips, win);

         LongActive1    = false;
         LongActive2    = false;
         LongReached1   = false;
         LongReached2   = false;
         longSig.active = false;
        }

      //--- SHORT: Stop Loss ANTES de T1/T2 -> CLOSED com loss
      if(shortSig.active &&
         !ShortStopped &&
         !ShortReached1 && !ShortReached2 &&
         hi >= shortSig.sl)                     // preço atual bateu SL
        {
         ShortStopped = true;
         totalLOSS++;

         double diff = MathAbs(shortSig.sl - shortSig.entry);
         double pips = ToPips(diff);

         SendSignalEvent(shortSig, SA_STAGE_CLOSED, 0, -pips, false);

         ShortActive1    = false;
         ShortActive2    = false;
         ShortReached1   = false;
         ShortReached2   = false;
         shortSig.active = false;
        }

      //--- SHORT: Stop Loss DEPOIS de T1 e ANTES de T2 -> CLOSED com win parcial
      if(shortSig.active &&
         !ShortStopped &&
         ShortReached1 && !ShortReached2 &&
         hi >= shortSig.sl)                     // preço atual bateu SL (já puxado pra região do T1)
        {
         ShortStopped = true;

         double profitPriceDiff = shortSig.entry - shortSig.sl; // deve ser >=0
         double pips = ToPips(profitPriceDiff);
         bool   win  = (pips>=0.0);

         SendSignalEvent(shortSig, SA_STAGE_CLOSED, 1, pips, win);

         ShortActive1    = false;
         ShortActive2    = false;
         ShortReached1   = false;
         ShortReached2   = false;
         shortSig.active = false;
        }
     }

   // PAINEL DE ESTATÍSTICAS
   UpdateStatsPanel();

   return(rates_total);
  }

//+------------------------------------------------------------------+
