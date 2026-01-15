# License Manager - Sistema de Gerenciamento de Licenças MT5

Sistema completo de gerenciamento de licenças MT5 com visual dark navy, glassmorphism e efeitos neon.

## Características Implementadas

### Design
- Tema dark navy com gradientes (#0B1020, #0E1630, #111B3D)
- Glassmorphism com blur e transparência em cards
- Efeitos neon (ciano, roxo, rosa) em elementos interativos
- Bordas arredondadas (14-18px) e sombras profundas
- Microinterações e hover states suaves
- Design responsivo (desktop-first)

### Funcionalidades

#### Login
- Autenticação com email/senha via Supabase
- Card central com glassmorphism e glow
- Validação de credenciais
- Estado de loading

#### Dashboard
- 3 KPIs principais (Licenças Ativas, Expirando, Bloqueadas)
- Gráfico donut mostrando taxa de aprovação
- Gráfico de barras com ativações por servidor
- Gráfico de linha com ativações dos últimos 14 dias
- Tabela com as últimas 10 licenças
- Cards com hover effects e glow

#### Licenças (CRUD Completo)
- Listagem de todas as licenças
- Filtros por status, servidor e busca por texto
- Criação de novas licenças via modal
- Edição de licenças existentes
- Exclusão de licenças
- Badges coloridos por status
- Multiselect para servidores permitidos

### Layout
- Sidebar fixa com navegação
- Topbar com busca, notificações e perfil
- Transições suaves entre páginas
- Ícones do Lucide React

## Como Usar

### 1. Primeiro Acesso

Ao abrir o sistema pela primeira vez, você precisará:

1. **Criar uma conta**: Use a interface de login do Supabase para criar um novo usuário
2. **Popular dados**: Após o login, o sistema detectará que não há dados e mostrará a tela de Setup
3. **Clicar em "Criar Dados de Exemplo"**: Isso criará 30 licenças realistas com:
   - Clientes com nomes brasileiros
   - Logins MT5 aleatórios
   - Diferentes servidores (ICMarkets, XMGlobal, Admiral, FBS, Exness)
   - Status variados (ativo, expirando, bloqueado)
   - Datas de expiração realistas
   - Logs de validação

### 2. Navegação

- **Visão Geral**: Dashboard com métricas e gráficos
- **Licenças**: CRUD completo de licenças
- **Outros itens**: Marcados como "Em breve"

### 3. Gerenciar Licenças

#### Criar Nova Licença
1. Vá para "Licenças"
2. Clique em "Nova Licença"
3. Preencha os campos:
   - Nome do Cliente
   - Login MT5
   - Servidores Permitidos (multi-seleção)
   - Data de Expiração
   - Status
   - Toggle para ativar/desativar
4. Clique em "Criar Licença"

#### Editar Licença
1. Na tabela de licenças, clique no ícone de lápis
2. Modifique os campos desejados
3. Clique em "Salvar Alterações"

#### Filtrar Licenças
- Use a busca para encontrar por nome ou login
- Filtre por status (Ativo, Expirando, Bloqueado)
- Filtre por servidor específico
- Combine múltiplos filtros

### 4. Dashboard

O dashboard mostra:
- Total de licenças ativas com variação percentual
- Licenças que expiram em 7 dias
- Licenças bloqueadas
- Taxa de aprovação em gráfico donut
- Distribuição de ativações por servidor
- Histórico de ativações diárias
- Últimas 10 licenças criadas

## Tecnologias Utilizadas

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Supabase** - Backend (banco de dados + autenticação)
- **Lucide React** - Ícones

## Estrutura do Banco de Dados

### Tabela: licenses
- `id` - UUID (chave primária)
- `client_name` - Nome do cliente
- `mt5_login` - Login da conta MT5
- `allowed_servers` - Array de servidores permitidos
- `expires_at` - Data de expiração
- `status` - Status (active, expiring, blocked)
- `is_active` - Boolean
- `user_id` - Referência ao usuário

### Tabela: validation_logs
- `id` - UUID (chave primária)
- `license_id` - Referência à licença
- `server_name` - Nome do servidor
- `action` - Ação realizada
- `result` - Resultado (success, failed, blocked)
- `ip_address` - Endereço IP
- `created_at` - Data de criação

## Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Usuários só podem ver e modificar suas próprias licenças
- Autenticação via Supabase Auth
- Validação de dados no frontend e backend

## Paleta de Cores

### Backgrounds
- `#0B1020` - Dark navy principal
- `#0E1630` - Navy médio
- `#111B3D` - Navy claro

### Cards
- `#121C3A` com 70-85% opacidade + backdrop blur

### Neon Accents
- Ciano: `#22D3EE`
- Roxo: `#8B5CF6`
- Rosa: `#F43F5E`
- Azul: `#3B82F6`

### Texto
- Primário: `#EAF0FF`
- Secundário: `#A8B3D6`
- Muted: `#6B7AAE`

## Próximos Passos Sugeridos

1. Implementar página de Logs com histórico detalhado
2. Adicionar página de Clientes
3. Criar relatórios exportáveis
4. Adicionar notificações em tempo real
5. Implementar sistema de permissões
6. Adicionar dashboard de estatísticas avançadas
