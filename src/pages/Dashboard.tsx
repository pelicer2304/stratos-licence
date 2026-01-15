import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DonutChart } from '../components/charts/DonutChart';
import { BarChart } from '../components/charts/BarChart';
import { LineChart } from '../components/charts/LineChart';
import { Key, Clock, ShieldAlert, Eye, Pencil, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type LicenseRow = Database['public']['Views']['v_licenses_with_brokers']['Row'];

export function Dashboard() {
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('v_licenses_with_brokers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error('Erro ao carregar licenças:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    active: licenses.filter(l => l.status === 'active').length,
    expiring: licenses.filter(l => l.status === 'expiring').length,
    blocked: licenses.filter(l => l.status === 'blocked').length,
  };

  const serverData = [
    { label: 'ICMarketsSC-Live', value: 8, color: 'rgba(0,177,117,0.95)' },
    { label: 'XMGlobal-Real 12', value: 6, color: 'rgba(0,177,117,0.78)' },
    { label: 'Admiral-MT5', value: 5, color: 'rgba(0,177,117,0.62)' },
    { label: 'FBS-Real', value: 4, color: 'rgba(0,177,117,0.48)' },
  ];

  const dailyActivations = [12, 18, 15, 22, 19, 25, 28, 24, 30, 27, 32, 29, 35, 31];
  const dailyLabels = ['Seg', '', '', '', 'Sex', '', '', '', 'Seg', '', '', '', 'Sex', 'Hoje'];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expirada';
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays <= 7) return `${diffDays} dias`;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-border-default border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Visão Geral</h1>
        <p className="text-text-secondary">Acompanhe suas licenças e métricas em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success-bg rounded-xl border border-border-subtle">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-success text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>+12%</span>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-1">Licenças Ativas</p>
          <p className="text-4xl font-bold text-text-primary">{stats.active}</p>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-warning-bg rounded-xl border border-border-subtle">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-sm font-medium">
              <TrendingDown className="w-4 h-4" />
              <span>-5%</span>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-1">Expiram em 7 dias</p>
          <p className="text-4xl font-bold text-text-primary">{stats.expiring}</p>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-danger-bg rounded-xl border border-border-subtle">
              <ShieldAlert className="w-6 h-6 text-danger" />
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-1">Bloqueadas</p>
          <p className="text-4xl font-bold text-text-primary">{stats.blocked}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center justify-center">
          <DonutChart
            percentage={Math.round((stats.active / (licenses.length || 1)) * 100)}
            label="Taxa de Aprovação"
            color="#00B175"
          />
        </Card>

        <Card className="p-6">
          <BarChart
            data={serverData}
            title="Ativações por Servidor"
          />
        </Card>

        <Card className="p-6">
          <LineChart
            data={dailyActivations}
            labels={dailyLabels}
            title="Ativações por Dia"
            color="#00B175"
          />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-xl font-semibold text-text-primary">Últimas Licenças</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-primary/30">
                <th className="text-left p-4 text-sm font-semibold text-text-secondary">Cliente</th>
                <th className="text-left p-4 text-sm font-semibold text-text-secondary">Login MT5</th>
                <th className="text-left p-4 text-sm font-semibold text-text-secondary">Servidor</th>
                <th className="text-left p-4 text-sm font-semibold text-text-secondary">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-text-secondary">Expira em</th>
                <th className="text-left p-4 text-sm font-semibold text-text-secondary">Ações</th>
              </tr>
            </thead>
            <tbody>
              {licenses.slice(0, 10).map((license) => (
                <tr
                  key={license.id}
                  className="border-b border-border-subtle hover:bg-surface-elevated/40 transition-colors"
                >
                  <td className="p-4 text-text-primary font-medium">{license.client_name}</td>
                  <td className="p-4 text-text-secondary font-mono text-sm">{license.mt5_login}</td>
                  <td className="p-4 text-text-secondary text-sm">
                    {Array.isArray(license.brokers) && license.brokers.length > 0
                      ? license.brokers[0].name
                      : 'N/A'}
                    {Array.isArray(license.brokers) && license.brokers.length > 1 && (
                      <span className="ml-1 text-xs text-text-muted">+{license.brokers.length - 1}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={license.status}>
                      {license.status === 'active' ? 'Ativo' : license.status === 'expiring' ? 'Expirando' : 'Bloqueado'}
                    </Badge>
                  </td>
                  <td className="p-4 text-text-secondary text-sm">{formatDate(license.expires_at)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-text-secondary hover:text-primary hover:bg-surface-elevated rounded-lg transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-text-secondary hover:text-primary hover:bg-surface-elevated rounded-lg transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {licenses.length === 0 && (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary mb-2">Nenhuma licença cadastrada</p>
            <p className="text-text-muted text-sm">Comece criando sua primeira licença</p>
          </div>
        )}
      </Card>
    </div>
  );
}
