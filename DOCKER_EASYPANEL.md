# Deploy no EasyPanel (Docker Compose)

Este projeto é um frontend Vite/React. As variáveis `VITE_*` são **embutidas no build** (comportamento padrão do Vite).

## 1) Configure variáveis no EasyPanel

Defina no serviço (Environment/Build Args):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use os valores do seu projeto Supabase (NUNCA commitar secrets).

## 2) Suba com docker-compose

O arquivo `docker-compose.yml` já está pronto.

- Porta interna do container: `80`
- No compose local, mapeei `8080:80`.

No EasyPanel, normalmente você só precisa expor a porta `80` do serviço.

## 3) Rebuild quando mudar env

Como `VITE_*` entra no build, ao alterar `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, você precisa **rebuildar** a imagem.

## Local (opcional)

```bash
cp .env.example .env
# preencha as variáveis

docker compose up --build
# abre http://localhost:8080
```
