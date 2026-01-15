# LicenseHub - Refatoração Completa

Sistema de gerenciamento de licenças MT5 totalmente integrado com Supabase.

## O que foi implementado

### 1. Banco de Dados (Supabase)

**Tabelas criadas:**
- `brokers` - Catálogo de corretoras MT5
- `broker_servers` - Servidores MT5 de cada corretora
- `licenses` - Licenças com mt5_login (bigint, único)
- `license_brokers` - Relacionamento N:N entre licenças e corretoras
- `admin_users` - Controle de acesso admin
- `audit_logs` - Registro de todas as ações no sistema
- `validation_logs` - Logs de validação de licenças

**Views:**
- `v_licenses_with_brokers` - Licenças com brokers agregados em JSON

**RLS (Row Level Security):**
- Todas as tabelas protegidas por RLS
- Função `is_admin()` para verificar permissões
- Apenas usuários na tabela `admin_users` podem acessar dados

### 2. Frontend

**Dependências adicionadas:**
- `zod` - Validação de schemas
- `react-hook-form` - Gerenciamento de formulários
- `@hookform/resolvers` - Integração zod + react-hook-form

**Hooks personalizados:**
- `useBrokers()` - Gerenciamento de corretoras
- `useLicenses()` - Gerenciamento de licenças com filtros
- `useAdmin()` - Verificação de permissões admin

**Serviços/Funções:**
- `createBroker()`, `updateBroker()`, `deleteBroker()`
- `addBrokerServer()`, `updateBrokerServer()`, `deleteBrokerServer()`, `bulkAddBrokerServers()`
- `createLicense()`, `updateLicense()`, `deleteLicense()`

**Contextos:**
- `AuthContext` - Autenticação + verificação de admin
- `ToastContext` - Sistema de notificações

**Componentes:**
- `BrokerFormModal` - Modal para criar/editar corretoras
- `ServersModal` - Gerenciamento de servidores MT5
- `LicenseFormModal` - Formulário de licença com validação (zod + react-hook-form)
- `ToastProvider` - Sistema de notificações toast

**Páginas refatoradas:**
- `/licenses` - Lista com filtros (busca, status, servidores)
- `/brokers` - CRUD completo de corretoras e servidores

### 3. Funcionalidades

**Licenças:**
- Criar/editar com validação
- mt5_login único e obrigatório
- Multi-select de servidores permitidos
- Status: ativa, expirando, bloqueada
- Filtros: busca, status, servidores
- Indicador de dias até expiração

**Corretoras:**
- CRUD completo
- Gerenciamento de servidores MT5
- Importação em lote de servidores
- Ativar/desativar servidores

**Segurança:**
- Guard de rota para admin
- Tela de "Acesso Negado" para não-admins
- RLS em todas as tabelas
- Audit logs automáticos

**UX/UI:**
- Loading states
- Empty states
- Toasts de sucesso/erro
- Validação em tempo real
- Confirmação antes de excluir

## Setup

### 1. Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 2. Configurar Admin

1. Crie um usuário via Supabase Dashboard (Authentication > Users)
2. Execute o SQL para torná-lo admin:

```sql
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users
WHERE email = 'seu-email@example.com';
```

Ver arquivo `SETUP_ADMIN.md` para mais detalhes.

### 3. Instalar e Executar

```bash
npm install
npm run dev
```

### 4. Popular com Dados de Exemplo (Opcional)

Os dados mockados de corretoras já foram inseridos. Para adicionar mais:

```sql
INSERT INTO brokers (name, slug, is_active, notes) VALUES
  ('Nome Corretora', 'slug-corretora', true, 'Notas opcionais');
```

## Estrutura do Código

```
src/
├── components/
│   ├── brokers/
│   │   ├── BrokerFormModal.tsx
│   │   └── ServersModal.tsx
│   ├── licenses/
│   │   └── LicenseFormModal.tsx
│   ├── layout/
│   └── ui/
├── contexts/
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
├── hooks/
│   ├── useAdmin.ts
│   ├── useBrokers.ts
│   └── useLicenses.ts
├── lib/
│   └── supabase.ts
└── pages/
    ├── Brokers.tsx
    ├── Dashboard.tsx
    ├── Licenses.tsx
    └── Login.tsx
```

## Diferenças do Sistema Anterior

### Removido
- ❌ Dados mockados
- ❌ `allowed_servers` como array de strings
- ❌ Campo `is_active` na licença (redundante com status)
- ❌ Campo `user_id` (agora é sistema admin)
- ❌ Página de Setup

### Adicionado
- ✅ Sistema de admin com RLS
- ✅ Tabela `license_brokers` (N:N)
- ✅ Validação com zod
- ✅ Audit logs
- ✅ Toast notifications
- ✅ mt5_login como bigint
- ✅ Formulários com react-hook-form
- ✅ View agregada para queries otimizadas

## Próximos Passos

1. **Dashboard**: Implementar gráficos e estatísticas
2. **Validation Logs**: Criar página para visualizar logs de validação
3. **Audit Logs**: Criar página para visualizar auditoria
4. **API/Webhook**: Criar Edge Function para validação externa de licenças
5. **Exportação**: Adicionar exportação de licenças (CSV/Excel)

## Notas Importantes

- **mt5_login** é único no sistema - não pode haver duplicatas
- **Apenas admins** podem acessar o sistema
- **Todas as ações** geram logs de auditoria
- **RLS** está ativo - dados não podem ser acessados sem autenticação + admin
- **Brokers inativos** não aparecem no multi-select de licenças
