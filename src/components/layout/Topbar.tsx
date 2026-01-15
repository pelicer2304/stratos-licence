import { Search, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export function Topbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-bg-primary/95 backdrop-blur-xl border-b border-border-subtle z-30">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar licenças, clientes..."
              className="w-full pl-12 pr-4 py-2.5 bg-bg-secondary border border-border-default rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary-glow transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-6">
          <button className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full shadow-[0_0_8px_rgba(248,113,113,0.6)]"></span>
          </button>

          <div className="h-8 w-px bg-border-subtle"></div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-elevated rounded-lg border border-border-default">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.25)]">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-text-muted">Administrador</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="!p-2"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
