# ✅ Correções Aplicadas ao Sistema de Licenciamento

## Mudanças Implementadas

### 1. ✅ Formato Correto do Login (64-bit)
**Antes:** `%d` (truncava valores grandes)
**Depois:** `%I64d` (suporta ACCOUNT_LOGIN completo)

```mql5
string jsonBody = StringFormat(
   "{\"license_key\":\"%s\",\"login\":%I64d,\"server\":\"%s\"}",
   InpLicenseKey,
   login,  // long (64-bit)
   server
);
```

### 2. ✅ Tratamento Completo de WebRequest

**Erro -1 (WebRequest falhou):**
- Captura `GetLastError()`
- Define `g_licenseReason = "WEBREQUEST_ERROR_<err>"`
- Imprime instruções para liberar URL
- Aplica grace period (24h)

**HTTP != 200:**
- Define `g_licenseReason = "HTTP_<status>"`
- Loga status e body
- Retorna false SEM tentar parse
- Aplica grace period (24h)

### 3. ✅ Parser JSON Melhorado

**JSONGetBool:**
- Aceita espaços: `"ok": true` ou `"ok":true`
- Trim de espaços e tabs antes do valor

**JSONGetString:**
- Tolera `null`: `"expires_at": null` retorna `""`
- Não quebra se campo for null
- Trim de espaços antes do valor

### 4. ✅ Grace Period (24 horas)

**Lógica:**
- Se última validação OK < 24h atrás E revalidação falha por erro de rede/HTTP
- Mantém `g_isLicensed = true`
- Registra warning no log (apenas na primeira falha)
- Se > 24h sem validação OK: bloqueia

**Variáveis:**
```mql5
datetime g_lastValidCheck = 0;  // Última validação bem-sucedida
bool g_lastCheckSuccess = false; // Evita spam de logs
```

### 5. ✅ OnTimer Otimizado

**OnInit:**
```mql5
if(InpRecheckMinutes > 0)
   EventSetTimer(InpRecheckMinutes * 60);
```

**OnTimer:**
- Detecta transição de estado (OK→FAIL ou FAIL→OK)
- Atualiza overlay apenas quando muda
- Evita spam de logs

**OnDeinit:**
```mql5
EventKillTimer();
SetLicenseOverlay("");
```

### 6. ✅ Segurança e UX

**Overlay:**
- Discreto (fonte 14 ao invés de 16)
- Não selecionável: `OBJPROP_SELECTABLE = false`
- Hidden: `OBJPROP_HIDDEN = true`
- Background: `OBJPROP_BACK = true`

**WebRequest:**
- Timeout: 5000ms (não trava terminal)

**Logs:**
- Detalhes apenas na primeira falha
- Transições de estado sempre logadas
- Sem spam em revalidações

## Fluxo de Validação

```
OnInit/OnTimer
    ↓
ValidateLicense()
    ↓
WebRequest POST
    ├─ res == -1 (erro rede)
    │   ├─ lastValidCheck < 24h? → return true (grace)
    │   └─ else → return false (bloqueia)
    │
    ├─ res != 200 (HTTP error)
    │   ├─ lastValidCheck < 24h? → return true (grace)
    │   └─ else → return false (bloqueia)
    │
    └─ res == 200
        ├─ Parse JSON
        ├─ ok == true?
        │   ├─ Yes → g_lastValidCheck = now, return true
        │   └─ No → return false
        └─ Update g_licenseReason
```

## Exemplo de Logs

### Primeira Validação (Sucesso)
```
=====================================
🔐 Validando Licença...
[LICENSE] Login: 12345678901234 | Server: ICMarketsSC-Live
[LICENSE] ✅ Valid
[LICENSE] Expires: 2026-12-31
=====================================
```

### Revalidação com Erro de Rede (Grace Period)
```
[LICENSE] ⚠️ WebRequest Error: 4060 (grace period active)
[LICENSE] Adicione em Tools > Options > Expert Advisors > Allow WebRequest:
[LICENSE] https://nxmukoyjizwzkfsbflyy.supabase.co
```

### Revalidação após 24h sem Sucesso (Bloqueia)
```
[LICENSE] ❌ WebRequest Error: 4060
[LICENSE] Adicione em Tools > Options > Expert Advisors > Allow WebRequest:
[LICENSE] https://nxmukoyjizwzkfsbflyy.supabase.co
```

### HTTP Error com Grace Period
```
[LICENSE] ⚠️ HTTP 500: {"error":"Internal Server Error"} (grace period active)
```

### Licença Inválida (Backend)
```
[LICENSE] ❌ Invalid: EXPIRED
```

## Variáveis de Estado

```mql5
bool g_isLicensed = false;          // Estado atual da licença
datetime g_lastCheck = 0;            // Última tentativa de validação
datetime g_lastValidCheck = 0;       // Última validação bem-sucedida
string g_licenseReason = "";         // Motivo da falha
string g_licenseExpires = "";        // Data de expiração
bool g_lastCheckSuccess = false;     // Evita spam de logs
```

## Códigos de Erro

| Código | Descrição | Grace Period |
|--------|-----------|--------------|
| `LICENSE_KEY_EMPTY` | Chave vazia | Não |
| `WEBREQUEST_ERROR_<err>` | Erro de rede | Sim (24h) |
| `HTTP_<status>` | HTTP != 200 | Sim (24h) |
| `EXPIRED` | Licença expirada | Não |
| `INVALID_KEY` | Chave inválida | Não |
| `BROKER_NOT_ALLOWED` | Broker não permitido | Não |
| `SERVER_NOT_FOUND` | Servidor não cadastrado | Não |

## Testes Recomendados

1. **Licença válida**: Deve funcionar normal
2. **Licença inválida**: Overlay + sem sinais
3. **Erro de rede**: Grace period 24h
4. **HTTP 500**: Grace period 24h
5. **Após 24h sem sucesso**: Bloqueia
6. **Revalidação OK→FAIL**: Log + overlay
7. **Revalidação FAIL→OK**: Log + remove overlay

Sistema robusto e pronto para produção! 🚀
