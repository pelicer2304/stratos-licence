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

console.log('🔍 Testando conexão com Supabase...\n');

async function testConnection() {
  try {
    // Teste 1: Verificar tabelas
    console.log('1️⃣ Verificando tabelas...');
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('count');
    
    if (brokersError) {
      console.log('❌ Tabela brokers:', brokersError.message);
    } else {
      console.log('✅ Tabela brokers existe');
    }

    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('count');
    
    if (licensesError) {
      console.log('❌ Tabela licenses:', licensesError.message);
    } else {
      console.log('✅ Tabela licenses existe');
    }

    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('count');
    
    if (adminError) {
      console.log('❌ Tabela admin_users:', adminError.message);
    } else {
      console.log('✅ Tabela admin_users existe');
    }

    // Teste 2: Verificar usuários
    console.log('\n2️⃣ Verificando usuários admin...');
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (adminsError) {
      console.log('❌ Erro ao buscar admins:', adminsError.message);
    } else {
      console.log(`✅ Total de admins: ${admins?.length || 0}`);
      if (admins && admins.length > 0) {
        admins.forEach(admin => {
          console.log(`   - ${admin.email}`);
        });
      } else {
        console.log('⚠️  Nenhum admin cadastrado ainda');
      }
    }

    // Teste 3: Verificar brokers
    console.log('\n3️⃣ Verificando corretoras...');
    const { data: allBrokers, error: allBrokersError } = await supabase
      .from('brokers')
      .select('*');
    
    if (allBrokersError) {
      console.log('❌ Erro ao buscar brokers:', allBrokersError.message);
    } else {
      console.log(`✅ Total de corretoras: ${allBrokers?.length || 0}`);
      if (allBrokers && allBrokers.length > 0) {
        allBrokers.slice(0, 3).forEach(broker => {
          console.log(`   - ${broker.name} (${broker.is_active ? 'Ativa' : 'Inativa'})`);
        });
      }
    }

    // Teste 4: Verificar licenças
    console.log('\n4️⃣ Verificando licenças...');
    const { data: allLicenses, error: allLicensesError } = await supabase
      .from('licenses')
      .select('*');
    
    if (allLicensesError) {
      console.log('❌ Erro ao buscar licenças:', allLicensesError.message);
    } else {
      console.log(`✅ Total de licenças: ${allLicenses?.length || 0}`);
    }

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    if (!admins || admins.length === 0) {
      console.log('   1. Criar um usuário no Supabase Dashboard (Authentication > Users)');
      console.log('   2. Executar SQL para torná-lo admin:');
      console.log('      INSERT INTO admin_users (user_id, email)');
      console.log('      SELECT id, email FROM auth.users WHERE email = \'seu-email@example.com\';');
    } else {
      console.log('   1. Fazer login com um dos emails admin listados acima');
      console.log('   2. Começar a usar o sistema!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testConnection();
