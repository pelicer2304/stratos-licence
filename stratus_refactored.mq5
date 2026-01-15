//+------------------------------------------------------------------+
//| SoopAlgo - Premium Targets (MT5)                                 |
//| IMPORTANTE: Anexe o EA "SoopAlgo_LicenseBridgeEA" em pelo menos |
//|             1 gráfico para manter validação de licença ativa     |
//+------------------------------------------------------------------+
#property strict
#property indicator_chart_window
#property indicator_plots   4
#property indicator_buffers 4

#property indicator_type1   DRAW_ARROW
#property indicator_color1  clrLime
#property indicator_width1  2

#property indicator_type2   DRAW_ARROW
#property indicator_color2  clrRed
#property indicator_width2  2

#property indicator_type3   DRAW_LINE
#property indicator_color3  clrDodgerBlue
#property indicator_width3  1

#property indicator_type4   DRAW_LINE
#property indicator_color4  clrMagenta
#property indicator_width4  1

//+------------------------------------------------------------------+
//  INPUTS
//+------------------------------------------------------------------+

input string   InpGroupTrend      = "===== SoopAlgo Trend =====";
input int      InpATRPeriod       = 10;
input double   InpATRMult         = 3.0;
input bool     InpUseATR          = true;

enum ENUM_ST_SOURCE
  {
   ST_SRC_CLOSE = 0,
   ST_SRC_HL2,
   ST_SRC_HLC3,
   ST_SRC_OHLC4
  };
input ENUM_ST_SOURCE InpSTSource  = ST_SRC_HL2;

input string   InpGroupUI         = "===== SoopAlgo UI =====";
input bool     InpShowSignals     = true;
input bool     InpHighlight       = true;

input string   InpGroupStages     = "===== STAGES SETTINGS =====";
input bool     InpEnableStages    = true;
input double   InpTPMultiplier    = 1.0;
input int      InpTargetATRLen    = 50;
input double   InpConfirmTolPips  = 5.0;
input int      InpExecDelaySeconds= 5;
input bool     InpShowTPSL        = true;

input color    InpColorBuy        = clrDodgerBlue;
input color    InpColorSell       = clrMagenta;
input color    InpColorT1         = C'8,153,129';
input color    InpColorT2         = C'242,54,69';
input color    InpColorReached    = clrSilver;
input color    InpColorSLLine     = clrPink;
input color    InpColorTPLine     = clrLimeGreen;

input string   InpGroupAPI        = "===== JSON QUEUE =====";
input bool     EnableQueue        = true;
input string   QueuePrefix        = "mpq_soop_";

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

input string   InpGroupTargets    = "===== TARGETS SETTINGS =====";
input bool     InpEnableTargets   = true;
input bool     InpWaitUntilHit    = false;
input double   InpT1Dist          = 1.0;
input double   InpT2Dist          = 2.0;
input double   InpT1SLTrail       = 0.90;

//+------------------------------------------------------------------+
//  BUFFERS
//+------------------------------------------------------------------+
double BuyBuffer[];
double SellBuffer[];
double ST_UpBuffer[];
double ST_DnBuffer[];

//+------------------------------------------------------------------+
//  VARIÁVEIS GLOBAIS
//+------------------------------------------------------------------+

int hATR_Main   = -1;
int hATR_Target = -1;

double g_up[];
double g_dn[];
int    g_trend[];

string TPLineName = "SA_TP_Line";
string SLLineName = "SA_SL_Line";

datetime lastBuySignalTime  = 0;
datetime lastSellSignalTime = 0;

int totalGAIN    = 0;
int totalLOSS    = 0;
int totalSignals = 0;

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
   string         side;
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

bool   LongActive1=false, LongActive2=false;
bool   ShortActive1=false, ShortActive2=false;
bool   LongReached1=false, LongReached2=false;
bool   ShortReached1=false, ShortReached2=false;
double LongVal1=0, LongVal2=0;
double ShortVal1=0, ShortVal2=0;

bool   LongStopped=false;
bool   ShortStopped=false;

string LongLine1Name="SA_Long_T1", LongLbl1Name="SA_Long_T1_Lbl";
string LongLine2Name="SA_Long_T2", LongLbl2Name="SA_Long_T2_Lbl";
string ShortLine1Name="SA_Short_T1", ShortLbl1Name="SA_Short_T1_Lbl";
string ShortLine2Name="SA_Short_T2", ShortLbl2Name="SA_Short_T2_Lbl";

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
//  FUNÇÕES DE LICENCIAMENTO (LEITURA DE ARQUIVO)
//+------------------------------------------------------------------+

string JSONGetString(const string &json, const string &key)
  {
   string search = "\""+key+"\":";
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
   string search = "\""+key+"\":";
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
      g_licenseReason = "LICENSE_EA_NOT_RUNNING_OR_FILE_MISSING";
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
      g_licenseReason = (StringLen(reason) > 0) ? reason : "LICENSE_INVALID";
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

//+------------------------------------------------------------------+
//  OnInit
//+------------------------------------------------------------------+
int OnInit()
  {
   // Verificar licença
   g_isLicensed = ReadLicenseStateFromFile();
   
   if(!g_isLicensed)
     {
      string msg = "❌ LICENÇA INVÁLIDA";
      if(g_licenseReason == "LICENSE_EA_NOT_RUNNING_OR_FILE_MISSING")
         msg += "\\nAnexe o EA SoopAlgo_LicenseBridgeEA";
      else
         msg += "\\n" + g_licenseReason;
      
      SetLicenseOverlay(msg);
      Print("[INDICATOR] ", msg);
      return INIT_SUCCEEDED; // Não falha, mas não opera
     }
   
   ObjectDelete(0, "SA_LicenseOverlay");
   
   // Buffers
   SetIndexBuffer(0, BuyBuffer, INDICATOR_DATA);
   SetIndexBuffer(1, SellBuffer, INDICATOR_DATA);
   SetIndexBuffer(2, ST_UpBuffer, INDICATOR_DATA);
   SetIndexBuffer(3, ST_DnBuffer, INDICATOR_DATA);
   
   PlotIndexSetInteger(0, PLOT_ARROW, 233);
   PlotIndexSetInteger(1, PLOT_ARROW, 234);
   
   ArraySetAsSeries(BuyBuffer, true);
   ArraySetAsSeries(SellBuffer, true);
   ArraySetAsSeries(ST_UpBuffer, true);
   ArraySetAsSeries(ST_DnBuffer, true);
   
   // ATR
   hATR_Main = iATR(_Symbol, _Period, InpATRPeriod);
   hATR_Target = iATR(_Symbol, _Period, InpTargetATRLen);
   
   if(hATR_Main == INVALID_HANDLE || hATR_Target == INVALID_HANDLE)
     {
      Print("[INDICATOR] Erro ao criar ATR");
      return INIT_FAILED;
     }
   
   // Arrays SuperTrend
   ArrayResize(g_up, 1000);
   ArrayResize(g_dn, 1000);
   ArrayResize(g_trend, 1000);
   ArraySetAsSeries(g_up, true);
   ArraySetAsSeries(g_dn, true);
   ArraySetAsSeries(g_trend, true);
   
   // Tema
   if(ApplyTheme)
     {
      ChartSetInteger(0, CHART_COLOR_BACKGROUND, ThemeBg);
      ChartSetInteger(0, CHART_COLOR_FOREGROUND, clrWhite);
      ChartSetInteger(0, CHART_COLOR_GRID, C'30,30,30');
      ChartSetInteger(0, CHART_COLOR_CHART_UP, ThemeBull);
      ChartSetInteger(0, CHART_COLOR_CHART_DOWN, ThemeBear);
      ChartSetInteger(0, CHART_COLOR_CANDLE_BULL, ThemeBull);
      ChartSetInteger(0, CHART_COLOR_CANDLE_BEAR, ThemeBear);
      
      if(HideGrid) ChartSetInteger(0, CHART_SHOW_GRID, false);
      if(HideVolumes) ChartSetInteger(0, CHART_SHOW_VOLUMES, false);
      if(HidePeriodSep) ChartSetInteger(0, CHART_SHOW_PERIOD_SEP, false);
     }
   
   // Logo
   if(StringLen(LogoFile) > 0)
     {
      string logoName = "SA_Logo";
      if(ObjectFind(0, logoName) < 0)
        {
         ObjectCreate(0, logoName, OBJ_BITMAP_LABEL, 0, 0, 0);
         ObjectSetInteger(0, logoName, OBJPROP_CORNER, 0);
         ObjectSetInteger(0, logoName, OBJPROP_XDISTANCE, LogoX);
         ObjectSetInteger(0, logoName, OBJPROP_YDISTANCE, LogoY);
         ObjectSetString(0, logoName, OBJPROP_BMPFILE, LogoFile);
        }
     }
   
   return INIT_SUCCEEDED;
  }

//+------------------------------------------------------------------+
//  OnDeinit
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   if(hATR_Main != INVALID_HANDLE) IndicatorRelease(hATR_Main);
   if(hATR_Target != INVALID_HANDLE) IndicatorRelease(hATR_Target);
   
   ObjectDelete(0, TPLineName);
   ObjectDelete(0, SLLineName);
   ObjectDelete(0, "SA_LicenseOverlay");
   
   // Limpar targets
   ObjectDelete(0, LongLine1Name);
   ObjectDelete(0, LongLbl1Name);
   ObjectDelete(0, LongLine2Name);
   ObjectDelete(0, LongLbl2Name);
   ObjectDelete(0, ShortLine1Name);
   ObjectDelete(0, ShortLbl1Name);
   ObjectDelete(0, ShortLine2Name);
   ObjectDelete(0, ShortLbl2Name);
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
   // Revalidar licença a cada 5 segundos
   if(TimeCurrent() - g_lastFileCheck > 5)
     {
      g_lastFileCheck = TimeCurrent();
      g_isLicensed = ReadLicenseStateFromFile();
      
      if(!g_isLicensed)
        {
         string msg = "❌ LICENÇA INVÁLIDA";
         if(g_licenseReason == "LICENSE_EA_NOT_RUNNING_OR_FILE_MISSING")
            msg += "\\nAnexe o EA SoopAlgo_LicenseBridgeEA";
         else
            msg += "\\n" + g_licenseReason;
         
         SetLicenseOverlay(msg);
        }
      else
        {
         ObjectDelete(0, "SA_LicenseOverlay");
        }
     }
   
   // Se não licenciado, limpar buffers e retornar
   if(!g_isLicensed)
     {
      ArrayInitialize(BuyBuffer, EMPTY_VALUE);
      ArrayInitialize(SellBuffer, EMPTY_VALUE);
      ArrayInitialize(ST_UpBuffer, EMPTY_VALUE);
      ArrayInitialize(ST_DnBuffer, EMPTY_VALUE);
      return 0;
     }
   
   // LÓGICA DO INDICADOR CONTINUA AQUI...
   // (Manter toda lógica existente de SuperTrend, Sinais, Targets, etc)
   
   ArraySetAsSeries(time, true);
   ArraySetAsSeries(open, true);
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   ArraySetAsSeries(close, true);
   
   if(rates_total < InpATRPeriod + 10) return 0;
   
   int limit = rates_total - prev_calculated;
   if(limit > rates_total - InpATRPeriod - 10)
      limit = rates_total - InpATRPeriod - 10;
   if(limit < 1) limit = 1;
   
   double atrBuf[];
   ArraySetAsSeries(atrBuf, true);
   if(CopyBuffer(hATR_Main, 0, 0, limit + 10, atrBuf) <= 0)
      return prev_calculated;
   
   // SuperTrend calculation
   for(int i = limit - 1; i >= 0; i--)
     {
      double src = 0;
      switch(InpSTSource)
        {
         case ST_SRC_CLOSE: src = close[i]; break;
         case ST_SRC_HL2:   src = (high[i] + low[i]) / 2.0; break;
         case ST_SRC_HLC3:  src = (high[i] + low[i] + close[i]) / 3.0; break;
         case ST_SRC_OHLC4: src = (open[i] + high[i] + low[i] + close[i]) / 4.0; break;
        }
      
      double atr_val = atrBuf[i];
      double hl2 = (high[i] + low[i]) / 2.0;
      
      double up_tmp = hl2 - InpATRMult * atr_val;
      double dn_tmp = hl2 + InpATRMult * atr_val;
      
      if(i < rates_total - 1)
        {
         if(up_tmp < g_up[i+1] || close[i+1] < g_up[i+1])
            g_up[i] = up_tmp;
         else
            g_up[i] = g_up[i+1];
         
         if(dn_tmp > g_dn[i+1] || close[i+1] > g_dn[i+1])
            g_dn[i] = dn_tmp;
         else
            g_dn[i] = g_dn[i+1];
        }
      else
        {
         g_up[i] = up_tmp;
         g_dn[i] = dn_tmp;
        }
      
      if(i < rates_total - 1)
        {
         if(g_trend[i+1] == 1)
           {
            if(close[i] < g_up[i])
               g_trend[i] = -1;
            else
               g_trend[i] = 1;
           }
         else
           {
            if(close[i] > g_dn[i])
               g_trend[i] = 1;
            else
               g_trend[i] = -1;
           }
        }
      else
        {
         g_trend[i] = (close[i] > dn_tmp) ? 1 : -1;
        }
      
      if(g_trend[i] == 1)
        {
         ST_UpBuffer[i] = g_up[i];
         ST_DnBuffer[i] = EMPTY_VALUE;
        }
      else
        {
         ST_UpBuffer[i] = EMPTY_VALUE;
         ST_DnBuffer[i] = g_dn[i];
        }
      
      BuyBuffer[i] = EMPTY_VALUE;
      SellBuffer[i] = EMPTY_VALUE;
      
      if(i < rates_total - 1 && InpShowSignals)
        {
         if(g_trend[i] == 1 && g_trend[i+1] == -1)
           {
            if(time[i] != lastBuySignalTime)
              {
               BuyBuffer[i] = low[i] - 10 * _Point;
               lastBuySignalTime = time[i];
              }
           }
         else if(g_trend[i] == -1 && g_trend[i+1] == 1)
           {
            if(time[i] != lastSellSignalTime)
              {
               SellBuffer[i] = high[i] + 10 * _Point;
               lastSellSignalTime = time[i];
              }
           }
        }
     }
   
   return rates_total;
  }
//+------------------------------------------------------------------+
