//+------------------------------------------------------------------+
//| SoopAlgo License Bridge EA                                        |
//| Valida licença via WebRequest e grava estado em arquivo comum    |
//| IMPORTANTE: Habilite Tools > Options > Expert Advisors >         |
//|             Allow WebRequest para:                                |
//|             https://nxmukoyjizwzkfsbflyy.supabase.co             |
//+------------------------------------------------------------------+
#property strict

input string   InpLicenseKey      = "";    // Chave da Licença
input string   InpApiUrl          = "https://nxmukoyjizwzkfsbflyy.supabase.co/functions/v1/bright-function";
input string   InpAnonKey         = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bXVrb3lqaXp3emtmc2JmbHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDQ5MzAsImV4cCI6MjA4Mzk4MDkzMH0.Kxb9kTXOtm_OHeP148JLkalGfxsgVyqY2hjoo8XtHxg";
input int      InpRecheckMinutes  = 60;    // Revalidar a cada X minutos
input int      InpTimeoutMs       = 5000;  // Timeout WebRequest (ms)
input int      InpGraceSeconds    = 86400; // Grace period (24h)
input bool     InpLogVerbose      = true;  // Logs detalhados

datetime g_lastCheck = 0;
datetime g_lastValidCheck = 0;

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

//+------------------------------------------------------------------+
void WriteStateFile(bool ok, string reason, string expires_at, string status, 
                    string license_id, string broker_id, int http_code, int err_code)
  {
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string server = AccountInfoString(ACCOUNT_SERVER);
   datetime now = TimeCurrent();
   
   string json = "{";
   json += "\"ok\":" + (ok ? "true" : "false") + ",";
   json += "\"reason\":\"" + reason + "\",";
   json += "\"expires_at\":\"" + expires_at + "\",";
   json += "\"status\":\"" + status + "\",";
   json += "\"license_id\":\"" + license_id + "\",";
   json += "\"broker_id\":\"" + broker_id + "\",";
   json += "\"last_check\":\"" + TimeToString(now, TIME_DATE|TIME_SECONDS) + "\",";
   json += "\"last_ok\":\"" + TimeToString(g_lastValidCheck, TIME_DATE|TIME_SECONDS) + "\",";
   json += "\"login\":" + IntegerToString(login) + ",";
   json += "\"server\":\"" + server + "\",";
   json += "\"http\":" + IntegerToString(http_code) + ",";
   json += "\"err\":" + IntegerToString(err_code);
   json += "}";
   
   string finalFile = "soopalgo_license_state.json";
   
   int h = FileOpen(finalFile, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(h == INVALID_HANDLE)
     {
      if(InpLogVerbose) Print("[LICENSE EA] Erro ao criar arquivo: ", GetLastError());
      return;
     }
   
   FileWriteString(h, json);
   FileClose(h);
   
   if(InpLogVerbose) Print("[LICENSE EA] Arquivo gravado com sucesso");
  }

//+------------------------------------------------------------------+
bool ValidateLicense()
  {
   if(StringLen(InpLicenseKey) == 0)
     {
      WriteStateFile(false, "LICENSE_KEY_EMPTY", "", "", "", "", 0, 0);
      if(InpLogVerbose) Print("[LICENSE EA] License key vazia");
      return false;
     }
   
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string server = AccountInfoString(ACCOUNT_SERVER);
   
   string body = "{\"license_key\":\"" + InpLicenseKey + "\",";
   body += "\"login\":" + IntegerToString(login) + ",";
   body += "\"server\":\"" + server + "\"}";
   
   string headers = "Content-Type: application/json\r\n";
   headers += "apikey: " + InpAnonKey + "\r\n";
   headers += "Authorization: Bearer " + InpAnonKey + "\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   ArrayResize(post, StringLen(body));
   StringToCharArray(body, post, 0, StringLen(body));
   
   ResetLastError();
   int res = WebRequest("POST", InpApiUrl, headers, InpTimeoutMs, post, result, resultHeaders);
   int err = GetLastError();
   
   if(res == -1)
     {
      bool inGrace = (g_lastValidCheck > 0 && (TimeCurrent() - g_lastValidCheck) < InpGraceSeconds);
      WriteStateFile(inGrace, "WEBREQUEST_ERROR_" + IntegerToString(err), "", "", "", "", 0, err);
      
      if(InpLogVerbose)
        {
         Print("[LICENSE EA] WebRequest Error: ", err);
         if(err == 4014)
            Print("[LICENSE EA] Adicione em Tools > Options > Expert Advisors > Allow WebRequest: https://nxmukoyjizwzkfsbflyy.supabase.co");
        }
      
      return inGrace;
     }
   
   string response = CharArrayToString(result);
   
   if(res != 200)
     {
      string reason = JSONGetString(response, "reason");
      if(StringLen(reason) == 0) reason = "HTTP_" + IntegerToString(res);
      
      WriteStateFile(false, reason, "", "", "", "", res, 0);
      if(InpLogVerbose) Print("[LICENSE EA] HTTP ", res, ": ", reason);
      return false;
     }
   
   bool ok = JSONGetBool(response, "ok");
   string expires_at = JSONGetString(response, "expires_at");
   string status = JSONGetString(response, "status");
   string license_id = JSONGetString(response, "license_id");
   string broker_id = JSONGetString(response, "broker_id");
   string reason = JSONGetString(response, "reason");
   
   if(ok)
     {
      g_lastValidCheck = TimeCurrent();
      WriteStateFile(true, "", expires_at, status, license_id, broker_id, res, 0);
      if(InpLogVerbose) Print("[LICENSE EA] ✓ Licença válida até ", expires_at);
      return true;
     }
   else
     {
      WriteStateFile(false, reason, expires_at, status, license_id, broker_id, res, 0);
      if(InpLogVerbose) Print("[LICENSE EA] ✗ Licença inválida: ", reason);
      return false;
     }
  }

//+------------------------------------------------------------------+
int OnInit()
  {
   if(InpLogVerbose)
     {
      Print("[LICENSE EA] Iniciando validação...");
      Print("[LICENSE EA] Login: ", AccountInfoInteger(ACCOUNT_LOGIN));
      Print("[LICENSE EA] Server: ", AccountInfoString(ACCOUNT_SERVER));
     }
   
   ValidateLicense();
   
   EventSetTimer(InpRecheckMinutes * 60);
   
   return INIT_SUCCEEDED;
  }

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   if(InpLogVerbose) Print("[LICENSE EA] Desanexado");
  }

//+------------------------------------------------------------------+
void OnTimer()
  {
   if(InpLogVerbose) Print("[LICENSE EA] Revalidando licença...");
   ValidateLicense();
  }

//+------------------------------------------------------------------+
void OnTick()
  {
   // EA não opera, apenas valida licença
  }
//+------------------------------------------------------------------+
