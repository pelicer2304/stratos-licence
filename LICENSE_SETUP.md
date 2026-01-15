# Sistema de Licenciamento - Instruções de Deploy

## 1. Deploy da Edge Function

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref nxmukoyjizwzkfsbflyy

# Deploy da função
supabase functions deploy validate_license
```

## 2. Executar Migration

No SQL Editor do Supabase (https://nxmukoyjizwzkfsbflyy.supabase.co):

```sql
-- Executar o conteúdo de: supabase/migrations/20260116000000_add_license_key_fields.sql
```

## 3. Configurar MT5

### 3.1 Liberar WebRequest
No MT5: Tools > Options > Expert Advisors > Allow WebRequest for listed URL:
```
https://nxmukoyjizwzkfsbflyy.supabase.co
```

### 3.2 Configurar Inputs do Indicador
- **InpLicenseKey**: Chave da licença (ex: "ABC-123-XYZ")
- **InpApiUrl**: `https://nxmukoyjizwzkfsbflyy.supabase.co/functions/v1/validate_license`
- **InpAnonKey**: Sua anon key do Supabase
- **InpRecheckMinutes**: 60 (revalidar a cada 1 hora)
- **InpFailHard**: false (continua funcionando se API cair temporariamente)

## 4. Criar Licença no Sistema

Via interface web ou SQL:

```sql
-- 1. Criar licença
INSERT INTO licenses (client_name, mt5_login, status, expires_at, license_key, notes)
VALUES ('Cliente Teste', 12345678, 'active', '2026-12-31', 'ABC-123-XYZ', 'Licença de teste');

-- 2. Pegar ID da licença
SELECT id FROM licenses WHERE license_key = 'ABC-123-XYZ';

-- 3. Criar broker (se não existir)
INSERT INTO brokers (name, slug, is_active) 
VALUES ('ICMarkets', 'icmarkets', true)
RETURNING id;

-- 4. Criar servidor (se não existir)
INSERT INTO broker_servers (broker_id, server, is_active)
VALUES ('<broker_id>', 'ICMarketsSC-Live', true);

-- 5. Vincular licença ao broker
INSERT INTO license_brokers (license_id, broker_id)
VALUES ('<license_id>', '<broker_id>');
```

## 5. Testar

1. Compilar o indicador stratus_licensed.mq5
2. Adicionar ao gráfico
3. Verificar no log do MT5:
   - `[LICENSE] Validating...`
   - `[LICENSE] ✅ Valid - Expires: 2026-12-31`
   
4. Se inválido, verá:
   - `[LICENSE] ❌ Invalid: EXPIRED` (ou outro motivo)
   - Overlay no gráfico: "LICENÇA INVÁLIDA"

## 6. Monitorar Validações

```sql
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
```

## Códigos de Erro

- **MISSING_PARAMS**: Faltam parâmetros (license_key, login ou server)
- **INVALID_KEY**: Chave de licença não encontrada
- **INACTIVE**: Licença com status diferente de 'active'
- **EXPIRED**: Licença expirada
- **INVALID_LOGIN**: MT5 login não corresponde ao cadastrado
- **SERVER_NOT_FOUND**: Servidor MT5 não cadastrado no sistema
- **BROKER_NOT_ALLOWED**: Broker não permitido para esta licença
- **SERVER_ERROR**: Erro interno do servidor

## Segurança

✅ Anon key é segura para uso no indicador (somente leitura via Edge Function)
✅ Service role key fica APENAS no servidor (Edge Function)
✅ RLS protege todas as tabelas
✅ Validações são logadas para auditoria
