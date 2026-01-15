# Arquitetura de Licenciamento: EA + Indicador

## Problema Resolvido
MT5 não permite WebRequest em indicadores (erro 4014). Solução: EA faz validação e grava estado em arquivo comum.

## Arquivos

### 1. SoopAlgo_LicenseBridgeEA.mq5
**Expert Advisor** que valida licença via WebRequest.

**Responsabilidades:**
- Chama Supabase Edge Function via WebRequest
- Valida license_key + mt5_login + server
- Grava resultado em arquivo comum: `soopalgo_license_state.json`
- Revalida automaticamente a cada X minutos
- Aplica grace period de 24h em caso de erro de rede

**Inputs:**
- `InpLicenseKey`: Chave fornecida ao cliente
- `InpApiUrl`: URL do Edge Function
- `InpAnonKey`: Anon key do Supabase
- `InpRecheckMinutes`: Intervalo de revalidação (padrão: 60min)
- `InpTimeoutMs`: Timeout WebRequest (padrão: 5000ms)
- `InpGraceSeconds`: Grace period (padrão: 86400s = 24h)
- `InpLogVerbose`: Logs detalhados (padrão: true)

**Arquivo Gerado:**
```json
{
  "ok": true/false,
  "reason": "string",
  "expires_at": "2026-02-13T19:11:52...",
  "status": "active",
  "license_id": "uuid",
  "broker_id": "uuid",
  "last_check": "2026.01.14 17:00:00",
  "last_ok": "2026.01.14 17:00:00",
  "login": 5043865637,
  "server": "MetaQuotes-Demo",
  "http": 200,
  "err": 0
}
```

### 2. stratus_refactored.mq5
**Indicador** que lê estado de licença do arquivo.

**Mudanças:**
- ❌ Removido: Todos inputs de licenciamento
- ❌ Removido: Funções ValidateLicense() com WebRequest
- ❌ Removido: Headers HTTP, body JSON, chamadas WebRequest
- ✅ Adicionado: ReadLicenseStateFromFile()
- ✅ Adicionado: Verificação a cada 5s no OnCalculate
- ✅ Mantido: Overlay de erro se não licenciado
- ✅ Mantido: Toda lógica de sinais/targets

**Comportamento:**
- OnInit: Lê arquivo uma vez
- OnCalculate: Relê a cada 5 segundos
- Se arquivo não existe: Mostra "Anexe o EA SoopAlgo_LicenseBridgeEA"
- Se ok=false: Mostra reason do arquivo
- Se ok=true: Opera normalmente

## Setup do Cliente

### Passo 1: Habilitar WebRequest
1. Tools > Options > Expert Advisors
2. Marcar "Allow WebRequest for listed URL"
3. Adicionar: `https://nxmukoyjizwzkfsbflyy.supabase.co`
4. OK

### Passo 2: Anexar EA
1. Arrastar `SoopAlgo_LicenseBridgeEA` para qualquer gráfico
2. Na janela de inputs, colar a license_key fornecida
3. Deixar outros inputs com valores padrão
4. OK

### Passo 3: Anexar Indicador
1. Arrastar `stratus_refactored` para qualquer gráfico/timeframe
2. Configurar inputs de sinais/targets conforme desejado
3. OK

### Passo 4: Verificar
- EA deve logar: `[LICENSE EA] ✓ Licença válida até ...`
- Indicador deve operar normalmente
- Se erro: Verificar logs do EA

## Vantagens

1. **Funciona**: WebRequest permitido em EAs
2. **Simples**: Cliente anexa EA uma vez, indicador funciona em todos os gráficos
3. **Offline**: Após validação, funciona 24h sem rede (grace period)
4. **Escalável**: Múltiplos indicadores podem ler o mesmo arquivo
5. **Seguro**: Arquivo em FILE_COMMON, não pode ser editado facilmente

## Fluxo de Validação

```
[Cliente anexa EA]
     ↓
[EA: OnInit() → ValidateLicense()]
     ↓
[WebRequest POST → Supabase Edge Function]
     ↓
[Resposta: {ok:true, expires_at:...}]
     ↓
[EA grava: soopalgo_license_state.json]
     ↓
[Indicador lê arquivo a cada 5s]
     ↓
[Se ok=true: Opera | Se ok=false: Bloqueia]
     ↓
[EA revalida a cada 60min (timer)]
```

## Troubleshooting

### Indicador mostra "EA não está rodando"
- Verificar se EA está anexado em algum gráfico
- Verificar se EA não foi removido/desabilitado
- Verificar logs do EA

### EA mostra "WebRequest Error: 4014"
- Verificar se URL está na lista Allow WebRequest
- Reiniciar MT5 após adicionar URL
- Verificar se não há typo na URL

### EA mostra "HTTP 400/401/403"
- Verificar se license_key está correta
- Verificar se login/server estão corretos
- Verificar logs do Supabase Edge Function

### EA mostra "Licença inválida"
- Licença pode estar expirada
- Licença pode estar bloqueada
- Broker/server pode não estar autorizado
- Verificar no painel web do LicenseHub

## Compilação

```bash
# Compilar EA
MetaEditor > File > Open > SoopAlgo_LicenseBridgeEA.mq5 > Compile

# Compilar Indicador
MetaEditor > File > Open > stratus_refactored.mq5 > Compile
```

## Distribuição

Enviar ao cliente:
1. `SoopAlgo_LicenseBridgeEA.ex5` (compilado)
2. `stratus_refactored.ex5` (compilado)
3. `LICENSE_KEY.txt` (chave única do cliente)
4. `SETUP.pdf` (instruções de instalação)

Cliente instala:
1. Copiar .ex5 para `MQL5/Experts/` (EA) e `MQL5/Indicators/` (indicador)
2. Seguir Passo 1-4 do Setup
