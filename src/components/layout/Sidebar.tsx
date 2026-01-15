import { Home, Key, Building2, Server, Users, FileText, Settings, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Visão Geral', icon: Home },
  { id: 'licenses', label: 'Licenças', icon: Key },
  { id: 'brokers', label: 'Corretoras', icon: Building2 },
  { id: 'servers', label: 'Servidores', icon: Server },
  { id: 'clients', label: 'Clientes', icon: Users, badge: 'Em breve' },
  { id: 'logs', label: 'Logs', icon: FileText, badge: 'Em breve' },
  { id: 'settings', label: 'Configurações', icon: Settings, badge: 'Em breve' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-bg-primary/95 backdrop-blur-xl border-r border-border-subtle z-40">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <img 
              src="/logo_rosto_branco_transparente.png" 
              alt="Logo" 
              className="w-50 h-30 object-contain"
            />
            
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isDisabled = item.badge === 'Em breve';

            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onNavigate(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                disabled={isDisabled}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? 'bg-primary/10 border border-primary/30 text-primary shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                    : isDisabled
                    ? 'text-text-muted cursor-not-allowed'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }
                  ${hoveredItem === item.id && !isDisabled && !isActive ? 'translate-x-1' : ''}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-surface-elevated text-text-muted border border-border-default">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-1">Dica profissional</p>
            <p className="text-xs text-text-muted">Use filtros rápidos para encontrar licenças específicas</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
