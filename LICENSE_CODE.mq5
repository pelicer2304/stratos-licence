//+------------------------------------------------------------------+
//| LICENCIAMENTO - Adicionar após os inputs existentes              |
//+------------------------------------------------------------------+

//--- Grupo Licenciamento
input string   InpGroupLicense    = "===== LICENCIAMENTO =====";
input string   InpLicenseKey      = "";                    // Chave da Licença
input string   InpApiUrl          = "https://nxmukoyjizwzkfsbflyy.supabase.co/functions/v1/validate_license";
input string   InpAnonKey         = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bXVrb3lqaXp3emtmc2JmbHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDQ5MzAsImV4cCI6MjA4Mzk4MDkzMH0.Kxb9kTXOtm_OHeP148JLkalGfxsgVyqY2hjoo8XtHxg";
input int      InpRecheckMinutes  = 60;                    // Revalidar a cada X minutos
input bool     InpFailHard        = false;                 // true = INIT_FAILED se inválido

//--- Variáveis globais de licença
bool g_isLicensed = false;
datetime g_lastCheck = 0;
string g_licenseReason = "";
string g_licenseExpires = "";

//+------------------------------------------------------------------+
//| Parse JSON simples (busca campos específicos)                    |
//+------------------------------------------------------------------+
string JSONGetString(const string &json, const string &key)
  {
   string search = "\""+key+"\":\"";
   int pos = StringFind(json, search);
   if(pos < 0) return "";
   
   int start = pos + StringLen(search);
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
   string sub = StringSubstr(json, start, 10);
   
   return (StringFind(sub, "true") >= 0);
  }

//+------------------------------------------------------------------+
//| Validar Licença via WebRequest                                   |
//+------------------------------------------------------------------+
bool ValidateLicense()
  {
   if(StringLen(InpLicenseKey) == 0)
     {
      g_licenseReason = "LICENSE_KEY_EMPTY";
      Print("[LICENSE] ❌ Chave de licença vazia");
      return false;
     }

   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string server = AccountInfoString(ACCOUNT_SERVER);
   
   Print("[LICENSE] Validating license...");
   Print("[LICENSE] Login: ", login, " | Server: ", server);
   
   // Montar JSON
   string jsonBody = StringFormat(
      "{\"license_key\":\"%s\",\"login\":%d,\"server\":\"%s\"}",
      InpLicenseKey,
      login,
      server
   );
   
   // Headers
   string headers = "Content-Type: application/json\r\n";
   headers += "apikey: " + InpAnonKey + "\r\n";
   headers += "Authorization: Bearer " + InpAnonKey + "\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonBody, post, 0, StringLen(jsonBody));
   
   ResetLastError();
   int res = WebRequest(
      "POST",
      InpApiUrl,
      headers,
      5000,  // timeout 5s
      post,
      result,
      resultHeaders
   );
   
   if(res == -1)
     {
      int err = GetLastError();
      g_licenseReason = "WEBREQUEST_ERROR_" + IntegerToString(err);
      Print("[LICENSE] ❌ WebRequest Error: ", err);
      Print("[LICENSE] Certifique-se de adicionar a URL em Tools > Options > Expert Advisors > Allow WebRequest");
      Print("[LICENSE] URL: ", InpApiUrl);
      return false;
     }
   
   string response = CharArrayToString(result);
   Print("[LICENSE] Response: ", response);
   
   // Parse JSON
   bool ok = JSONGetBool(response, "ok");
   string reason = JSONGetString(response, "reason");
   string expires = JSONGetString(response, "expires_at");
   
   g_licenseReason = reason;
   g_licenseExpires = expires;
   
   if(ok)
     {
      Print("[LICENSE] ✅ Valid");
      if(StringLen(expires) > 0)
         Print("[LICENSE] Expires: ", expires);
      return true;
     }
   else
     {
      Print("[LICENSE] ❌ Invalid: ", reason);
      return false;
     }
  }

//+------------------------------------------------------------------+
//| Desenhar overlay de licença inválida                             |
//+------------------------------------------------------------------+
void SetLicenseOverlay(const string text)
  {
   string objName = "LICENSE_OVERLAY";
   
   if(ObjectFind(0, objName) >= 0)
      ObjectDelete(0, objName);
   
   if(StringLen(text) == 0)
      return;
   
   ObjectCreate(0, objName, OBJ_LABEL, 0, 0, 0);
   ObjectSetInteger(0, objName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(0, objName, OBJPROP_XDISTANCE, 150);
   ObjectSetInteger(0, objName, OBJPROP_YDISTANCE, 100);
   ObjectSetInteger(0, objName, OBJPROP_COLOR, clrRed);
   ObjectSetInteger(0, objName, OBJPROP_FONTSIZE, 16);
   ObjectSetString(0, objName, OBJPROP_TEXT, text);
   ObjectSetInteger(0, objName, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, objName, OBJPROP_HIDDEN, true);
  }

//+------------------------------------------------------------------+
//| Timer para revalidação                                            |
//+------------------------------------------------------------------+
void OnTimer()
  {
   datetime now = TimeCurrent();
   
   if(now - g_lastCheck >= InpRecheckMinutes * 60)
     {
      Print("[LICENSE] Revalidating...");
      g_isLicensed = ValidateLicense();
      g_lastCheck = now;
      
      if(!g_isLicensed)
        {
         string msg = "LICENÇA INVÁLIDA\\n" + g_licenseReason;
         SetLicenseOverlay(msg);
         
         // Limpar buffers
         ArrayInitialize(BuyBuffer, EMPTY_VALUE);
         ArrayInitialize(SellBuffer, EMPTY_VALUE);
        }
      else
        {
         SetLicenseOverlay("");
        }
     }
  }

//+------------------------------------------------------------------+
//| MODIFICAÇÕES NO OnInit()                                          |
//| Adicionar ANTES do return(INIT_SUCCEEDED):                       |
//+------------------------------------------------------------------+
/*
   // === LICENCIAMENTO ===
   Print("====================================");
   Print("🔐 Validando Licença...");
   
   g_isLicensed = ValidateLicense();
   g_lastCheck = TimeCurrent();
   
   if(!g_isLicensed)
     {
      string msg = "LICENÇA INVÁLIDA\\n" + g_licenseReason;
      SetLicenseOverlay(msg);
      
      Print("[LICENSE] ❌ Licença inválida. Indicador desativado.");
      
      if(InpFailHard)
        {
         Print("[LICENSE] InpFailHard=true - Retornando INIT_FAILED");
         return(INIT_FAILED);
        }
     }
   else
     {
      Print("[LICENSE] ✅ Licença válida");
      SetLicenseOverlay("");
     }
   
   // Iniciar timer para revalidação
   EventSetTimer(InpRecheckMinutes * 60);
   
   Print("====================================");
*/

//+------------------------------------------------------------------+
//| MODIFICAÇÕES NO OnDeinit()                                        |
//| Adicionar no início:                                             |
//+------------------------------------------------------------------+
/*
   EventKillTimer();
   SetLicenseOverlay("");
*/

//+------------------------------------------------------------------+
//| MODIFICAÇÕES NO OnCalculate()                                     |
//| Adicionar logo no início, após ArraySetAsSeries:                 |
//+------------------------------------------------------------------+
/*
   // Verificar licença
   if(!g_isLicensed)
     {
      // Não gerar sinais/targets
      ArrayInitialize(BuyBuffer, EMPTY_VALUE);
      ArrayInitialize(SellBuffer, EMPTY_VALUE);
      ArrayInitialize(ST_UpBuffer, EMPTY_VALUE);
      ArrayInitialize(ST_DnBuffer, EMPTY_VALUE);
      return rates_total;
     }
*/
