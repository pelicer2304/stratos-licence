# Setup do Admin

Para configurar um usuário admin no sistema, siga os passos abaixo:

## 1. Criar um usuário no Supabase Auth

Acesse o painel do Supabase > Authentication > Users e crie um novo usuário com email e senha.

Ou use o SQL abaixo (substitua o email e senha):

```sql
-- Nota: Este método cria um usuário diretamente no banco.
-- É melhor criar via painel do Supabase ou via API de signup.
```

## 2. Adicionar o usuário à tabela admin_users

Depois de criar o usuário via painel do Supabase, pegue o UUID do usuário e execute:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email real do usuário
INSERT INTO admin_users (user_id, email)
SELECT id, email
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id) DO NOTHING;
```

## 3. Verificar se o usuário é admin

```sql
SELECT * FROM admin_users;
```

## Alternativa: Script automático

Se você quiser adicionar todos os usuários existentes como admins (útil para desenvolvimento):

```sql
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

## Remoção de admin

Para remover um usuário admin:

```sql
DELETE FROM admin_users
WHERE email = 'usuario@exemplo.com';
```
