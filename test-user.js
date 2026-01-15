import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
  console.error('   Create a .env file locally (it is gitignored) or export env vars before running.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

if (!email || !password) {
  console.error('❌ Missing env vars: TEST_USER_EMAIL and/or TEST_USER_PASSWORD');
  console.error('   Example: TEST_USER_EMAIL="you@example.com" TEST_USER_PASSWORD="..." node test-user.js');
  process.exit(1);
}

console.log('🔐 Testando usuário:', email);
console.log('');

async function testUser() {
  try {
    // Teste 1: Tentar fazer login
    console.log('1️⃣ Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('   User ID:', loginData.user.id);
    console.log('   Email:', loginData.user.email);

    // Teste 2: Verificar se é admin
    console.log('\n2️⃣ Verificando status de admin...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', loginData.user.id)
      .maybeSingle();

    if (adminError) {
      console.log('❌ Erro ao verificar admin:', adminError.message);
    } else if (!adminData) {
      console.log('⚠️  Usuário NÃO é admin ainda');
      console.log('\n📝 Execute este SQL no Supabase para torná-lo admin:');
      console.log('');
      console.log(`INSERT INTO admin_users (user_id, email) VALUES ('${loginData.user.id}', '${email}');`);
    } else {
      console.log('✅ Usuário JÁ É ADMIN!');
      console.log('   Cadastrado em:', new Date(adminData.created_at).toLocaleString('pt-BR'));
    }

    // Teste 3: Testar acesso às tabelas
    console.log('\n3️⃣ Testando acesso às tabelas...');
    
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('*');
    
    if (brokersError) {
      console.log('❌ Erro ao acessar brokers:', brokersError.message);
    } else {
      console.log('✅ Acesso a brokers OK');
    }

    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('*');
    
    if (licensesError) {
      console.log('❌ Erro ao acessar licenses:', licensesError.message);
    } else {
      console.log('✅ Acesso a licenses OK');
    }

    console.log('\n✅ Todos os testes concluídos!');
    
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testUser();
