import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Licenses } from './pages/Licenses';
import { Brokers } from './pages/Brokers';
import { Servers } from './pages/Servers';
import { Layout } from './components/layout/Layout';
import { AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured, supabaseConfigError } from './lib/supabase';

function AppContent() {
  const { user, loading, isAdmin, adminChecked, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('licenses');

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Configuração do Supabase</h1>
            <p className="text-text-secondary mb-4">
              {supabaseConfigError}
            </p>
            <div className="text-sm text-text-muted space-y-2">
              <p>Crie um arquivo <span className="font-mono text-text-secondary">.env</span> na raiz do projeto com:</p>
              <pre className="bg-bg-primary/40 border border-border-subtle rounded-xl p-4 overflow-x-auto text-text-secondary">
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
              </pre>
              <p>Use <span className="font-mono text-text-secondary">.env.example</span> como referência.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || (user && !adminChecked)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-bg-secondary border border-danger/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Acesso Negado</h1>
            <p className="text-text-secondary mb-6">
              Você não tem permissão para acessar esta área. Entre em contato com o administrador.
            </p>
            <button
              onClick={() => signOut()}
              className="w-full px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-primary-glow"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      <div className={currentPage === 'dashboard' ? 'block' : 'hidden'}>
        <Dashboard />
      </div>
      <div className={currentPage === 'licenses' ? 'block' : 'hidden'}>
        <Licenses />
      </div>
      <div className={currentPage === 'brokers' ? 'block' : 'hidden'}>
        <Brokers />
      </div>
      <div className={currentPage === 'servers' ? 'block' : 'hidden'}>
        <Servers />
      </div>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
