# Solução: Licenciamento via Arquivo Local

## Problema
MT5 bloqueia WebRequest com erro 4014 mesmo com URLs na lista permitida.

## Solução
Usar arquivo de configuração local que o sistema gera após validação bem-sucedida.

## Fluxo
1. Usuário recebe arquivo `stratus_license.dat` junto com o indicador
2. Arquivo contém: license_key, mt5_login, server, expires_at (criptografado)
3. Indicador lê arquivo no OnInit() e valida localmente
4. Sistema web gera arquivo após validação via Postman/API

## Vantagens
- Sem dependência de WebRequest
- Funciona offline após primeira validação
- Arquivo pode ser renovado facilmente
- Mais rápido (sem latência de rede)

## Implementação
- Arquivo em: MQL5/Files/stratus_license.dat
- Formato: Base64 de JSON criptografado simples
- Validação: decode + check expiration + check login/server
