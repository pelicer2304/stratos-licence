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
