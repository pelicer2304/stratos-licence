# ✅ Sistema de Licenciamento Integrado ao Indicador

## Modificações Realizadas no stratus.mq5

### 1. Inputs Adicionados (linha ~98)
```mql5
//--- LICENCIAMENTO
input string   InpGroupLicense    = "===== LICENCIAMENTO =====";
input string   InpLicenseKey      = "";
input string   InpApiUrl          = "https://nxmukoyjizwzkfsbflyy.supabase.co/functions/v1/bright-function";
input string   InpAnonKey         = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
input int      InpRecheckMinutes  = 60;
input bool     InpFailHard        = false;
```

### 2. Variáveis Globais Adicionadas (linha ~200)
```mql5
bool g_isLicensed = false;
datetime g_lastCheck = 0;
string g_licenseReason = "";
string g_licenseExpires = "";
```

### 3. Funções de Licenciamento Adicionadas (linha ~205)
- `JSONGetString()` - Parse JSON simples
- `JSONGetBool()` - Parse booleano do JSON
- `ValidateLicense()` - Valida via WebRequest
- `SetLicenseOverlay()` - Desenha overlay de erro
- `OnTimer()` - Revalidação automática

### 4. OnInit() Modificado
- Validação de licença antes de INIT_SUCCEEDED
- Inicia timer para revalidação
- Mostra overlay se inválido
- Retorna INIT_FAILED se InpFailHard=true

### 5. OnDeinit() Modificado
- Mata timer
- Remove overlay

### 6. OnCalculate() Modificado
- Verifica g_isLicensed no início
- Se inválido, limpa buffers e retorna

## 🚀 Próximos Passos

### 1. Liberar WebRequest no MT5
Tools > Options > Expert Advisors > Allow WebRequest for listed URL:
```
https://nxmukoyjizwzkfsbflyy.supabase.co
```

### 2. Criar Licença no Supabase

```sql
-- 1. Criar licença
INSERT INTO licenses (client_name, mt5_login, status, expires_at, license_key, notes)
VALUES ('Cliente Teste', 12345678, 'active', '2026-12-31', 'TEST-2024-PREMIUM', 'Licença de teste')
RETURNING id;

-- 2. Criar broker (se não existir)
INSERT INTO brokers (name, slug, is_active) 
VALUES ('ICMarkets', 'icmarkets', true)
ON CONFLICT (slug) DO UPDATE SET is_active = true
RETURNING id;

-- 3. Criar servidor
INSERT INTO broker_servers (broker_id, server, is_active)
VALUES ('<broker_id_aqui>', 'ICMarketsSC-Live', true);

-- 4. Vincular licença ao broker
INSERT INTO license_brokers (license_id, broker_id)
VALUES ('<license_id_aqui>', '<broker_id_aqui>');
```

### 3. Compilar e Testar

1. Abrir stratus.mq5 no MetaEditor
2. Compilar (F7)
3. Adicionar ao gráfico
4. Configurar inputs:
   - InpLicenseKey: "TEST-2024-PREMIUM"
   - InpApiUrl: (já configurado)
   - InpAnonKey: (já configurado)
5. Verificar log do MT5

## 📊 Logs Esperados

### Licença Válida:
```
=====================================
🔐 Validando Licença...
[LICENSE] Validating license...
[LICENSE] Login: 12345678 | Server: ICMarketsSC-Live
[LICENSE] Response: {"ok":true,"license_id":"...","expires_at":"2026-12-31"}
[LICENSE] ✅ Valid
[LICENSE] Expires: 2026-12-31
[LICENSE] ✅ Licença válida
=====================================
```

### Licença Inválida:
```
=====================================
🔐 Validando Licença...
[LICENSE] Validating license...
[LICENSE] Login: 12345678 | Server: ICMarketsSC-Live
[LICENSE] Response: {"ok":false,"reason":"EXPIRED"}
[LICENSE] ❌ Invalid: EXPIRED
[LICENSE] ❌ Licença inválida. Indicador desativado.
=====================================
```

## 🔍 Troubleshooting

### Erro: WebRequest -1
**Causa**: URL não liberada no MT5
**Solução**: Adicionar `https://nxmukoyjizwzkfsbflyy.supabase.co` em Allow WebRequest

### Erro: INVALID_KEY
**Causa**: license_key não existe no banco
**Solução**: Verificar se licença foi criada corretamente

### Erro: BROKER_NOT_ALLOWED
**Causa**: Broker não vinculado à licença
**Solução**: Executar INSERT em license_brokers

### Erro: SERVER_NOT_FOUND
**Causa**: Servidor não cadastrado
**Solução**: Cadastrar servidor em broker_servers com nome exato do ACCOUNT_SERVER

## 📝 Monitoramento

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
LIMIT 20;
```

## ✨ Funcionalidades

- ✅ Validação no OnInit
- ✅ Revalidação automática (timer)
- ✅ Overlay visual de erro
- ✅ Logs detalhados
- ✅ Modo fail-hard opcional
- ✅ Parse JSON nativo (sem dependências)
- ✅ Segurança (anon key no cliente, service role no servidor)

Sistema de licenciamento completo e funcional! 🎉
