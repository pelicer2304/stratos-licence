# 🔐 Sistema de Licenciamento MT5 - Implementação Completa

## ✅ Arquivos Criados

### 1. Edge Function (Supabase)
📁 `supabase/functions/validate_license/index.ts`
- Valida license_key, mt5_login e server
- Verifica status, expiração e broker permitido
- Registra logs de validação
- Usa service_role key (seguro no servidor)

### 2. Migration SQL
📁 `supabase/migrations/20260116000000_add_license_key_fields.sql`
- Adiciona campo `license_key` na tabela `licenses`
- Adiciona campos necessários em `validation_logs`
- Cria índices para performance

### 3. Código de Licenciamento (MQL5)
📁 `LICENSE_CODE.mq5`
- Funções de validação via WebRequest
- Parse JSON simples (sem dependências)
- Timer para revalidação automática
- Overlay visual para licença inválida

### 4. Documentação
📁 `LICENSE_SETUP.md`
- Instruções completas de deploy
- Como criar licenças
- Como testar
- Códigos de erro

## 🚀 Como Integrar no Indicador

### Passo 1: Adicionar Inputs
Adicione após os inputs existentes no `stratus.mq5`:

```mql5
//--- Grupo Licenciamento
input string   InpGroupLicense    = "===== LICENCIAMENTO =====";
input string   InpLicenseKey      = "";
input string   InpApiUrl          = "https://nxmukoyjizwzkfsbflyy.supabase.co/functions/v1/validate_license";
input string   InpAnonKey         = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // sua anon key
input int      InpRecheckMinutes  = 60;
input bool     InpFailHard        = false;

//--- Variáveis globais
bool g_isLicensed = false;
datetime g_lastCheck = 0;
string g_licenseReason = "";
string g_licenseExpires = "";
```

### Passo 2: Adicionar Funções
Copie as funções do arquivo `LICENSE_CODE.mq5`:
- `JSONGetString()`
- `JSONGetBool()`
- `ValidateLicense()`
- `SetLicenseOverlay()`
- `OnTimer()`

### Passo 3: Modificar OnInit()
Adicione ANTES do `return(INIT_SUCCEEDED)`:

```mql5
   // === LICENCIAMENTO ===
   Print("🔐 Validando Licença...");
   
   g_isLicensed = ValidateLicense();
   g_lastCheck = TimeCurrent();
   
   if(!g_isLicensed)
     {
      string msg = "LICENÇA INVÁLIDA\\n" + g_licenseReason;
      SetLicenseOverlay(msg);
      
      if(InpFailHard)
         return(INIT_FAILED);
     }
   else
     {
      SetLicenseOverlay("");
     }
   
   EventSetTimer(InpRecheckMinutes * 60);
```

### Passo 4: Modificar OnDeinit()
Adicione no início:

```mql5
   EventKillTimer();
   SetLicenseOverlay("");
```

### Passo 5: Modificar OnCalculate()
Adicione logo após os `ArraySetAsSeries`:

```mql5
   // Verificar licença
   if(!g_isLicensed)
     {
      ArrayInitialize(BuyBuffer, EMPTY_VALUE);
      ArrayInitialize(SellBuffer, EMPTY_VALUE);
      ArrayInitialize(ST_UpBuffer, EMPTY_VALUE);
      ArrayInitialize(ST_DnBuffer, EMPTY_VALUE);
      return rates_total;
     }
```

## 📋 Checklist de Deploy

- [ ] 1. Deploy Edge Function no Supabase
- [ ] 2. Executar migration SQL
- [ ] 3. Criar broker e servidor no sistema
- [ ] 4. Criar licença com license_key
- [ ] 5. Vincular licença ao broker
- [ ] 6. Liberar WebRequest no MT5
- [ ] 7. Compilar indicador com código de licenciamento
- [ ] 8. Configurar inputs (license_key, anon_key)
- [ ] 9. Testar no gráfico
- [ ] 10. Verificar logs de validação no Supabase

## 🎯 Fluxo de Validação

```
MT5 Indicator
    ↓ WebRequest POST
Edge Function (validate_license)
    ↓ Query com service_role
Supabase Database
    ├─ licenses (verifica key, status, expires_at)
    ├─ broker_servers (verifica server)
    └─ license_brokers (verifica permissão)
    ↓
validation_logs (registra tentativa)
    ↓ Response JSON
MT5 Indicator
    ├─ ok: true → g_isLicensed = true
    └─ ok: false → mostra overlay + desativa sinais
```

## 🔒 Segurança

✅ **Anon key no indicador**: Segura (só acessa Edge Function pública)
✅ **Service role no servidor**: Nunca exposta ao cliente
✅ **RLS ativo**: Todas as tabelas protegidas
✅ **Logs de auditoria**: Todas as validações registradas
✅ **Validação server-side**: Lógica no servidor, não no cliente

## 📊 Monitoramento

```sql
-- Ver últimas validações
SELECT 
  vl.validation_time,
  vl.status,
  vl.server_name,
  vl.mt5_login,
  l.client_name,
  l.license_key
FROM validation_logs vl
LEFT JOIN licenses l ON l.id = vl.license_id
ORDER BY vl.validation_time DESC
LIMIT 50;

-- Ver licenças ativas
SELECT 
  license_key,
  client_name,
  mt5_login,
  status,
  expires_at,
  (SELECT COUNT(*) FROM license_brokers WHERE license_id = licenses.id) as brokers_count
FROM licenses
WHERE status = 'active'
ORDER BY created_at DESC;
```

## 🆘 Troubleshooting

### Erro: WebRequest -1
- Adicionar URL em Tools > Options > Expert Advisors > Allow WebRequest
- URL: `https://nxmukoyjizwzkfsbflyy.supabase.co`

### Erro: INVALID_KEY
- Verificar se license_key está correto
- Verificar se licença existe no banco

### Erro: BROKER_NOT_ALLOWED
- Criar broker e servidor no sistema
- Vincular licença ao broker via license_brokers

### Erro: SERVER_NOT_FOUND
- Cadastrar servidor em broker_servers
- Nome deve corresponder exatamente ao ACCOUNT_SERVER do MT5

## 📝 Exemplo de Licença Completa

```sql
-- 1. Criar licença
INSERT INTO licenses (client_name, mt5_login, status, expires_at, license_key, notes)
VALUES ('João Silva', 12345678, 'active', '2026-12-31', 'JS-2024-PREMIUM', 'Licença anual')
RETURNING id;

-- 2. Criar/buscar broker
INSERT INTO brokers (name, slug, is_active) 
VALUES ('ICMarkets', 'icmarkets', true)
ON CONFLICT (slug) DO UPDATE SET is_active = true
RETURNING id;

-- 3. Criar servidor
INSERT INTO broker_servers (broker_id, server, is_active)
VALUES ('<broker_id>', 'ICMarketsSC-Live', true);

-- 4. Vincular
INSERT INTO license_brokers (license_id, broker_id)
VALUES ('<license_id>', '<broker_id>');
```

Pronto! Sistema de licenciamento completo e seguro implementado! 🎉
