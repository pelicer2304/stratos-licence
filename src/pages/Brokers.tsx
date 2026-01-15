import { useState, useEffect } from 'react';
import { Building2, Search, Plus, Edit, Server, Trash2, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { BrokerFormModal } from '../components/brokers/BrokerFormModal';
import { ServersModal } from '../components/brokers/ServersModal';
import { useBrokers, createBroker, updateBroker, deleteBroker } from '../hooks/useBrokers';
import { useToast } from '../contexts/ToastContext';
import { formatSupabaseError } from '../lib/supabaseError';
import type { BrokerFormData } from '../components/brokers/BrokerFormModal';
import type { BrokerWithServers } from '../hooks/useBrokers';

export function Brokers() {
  const { brokers, loading, error, refetch } = useBrokers();
  const toast = useToast();
  const [filteredBrokers, setFilteredBrokers] = useState<BrokerWithServers[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [showServersModal, setShowServersModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerWithServers | null>(null);
  const [stats, setStats] = useState({
    totalBrokers: 0,
    totalServers: 0,
    activeBrokers: 0,
  });

  useEffect(() => {
    if (brokers.length > 0) {
      const totalServers = brokers.reduce((sum, b) => sum + (b.server_count || 0), 0);
      const activeBrokers = brokers.filter(b => b.is_active).length;

      setStats({
        totalBrokers: brokers.length,
        totalServers,
        activeBrokers,
      });
    }
  }, [brokers]);

  useEffect(() => {
    filterAndSortBrokers();
  }, [brokers, searchQuery, statusFilter, sortBy]);

  const filterAndSortBrokers = () => {
    let filtered = [...brokers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        broker =>
          broker.name.toLowerCase().includes(query) ||
          broker.slug.toLowerCase().includes(query) ||
          broker.servers?.some(s => s.server.toLowerCase().includes(query))
      );
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(b => b.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(b => !b.is_active);
    }

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    setFilteredBrokers(filtered);
  };

  const handleCreateBroker = async (data: BrokerFormData) => {
    try {
      const created = await createBroker(data);
      toast.success('Corretora criada com sucesso! Agora cadastre os servidores.');
      refetch();

      setSelectedBroker({
        ...(created as BrokerWithServers),
        servers: [],
        server_count: 0,
      });
      setShowServersModal(true);
    } catch (err) {
      toast.error(formatSupabaseError(err, 'Erro ao criar corretora'));
      throw err;
    }
  };

  const handleUpdateBroker = async (data: BrokerFormData) => {
    if (!selectedBroker) return;

    try {
      await updateBroker(selectedBroker.id, data);
      toast.success('Corretora atualizada com sucesso!');
      refetch();
    } catch (err) {
      toast.error(formatSupabaseError(err, 'Erro ao atualizar corretora'));
      throw err;
    }
  };

  const handleDeleteBroker = async (brokerId: string, brokerName: string) => {
    if (
      !confirm(
        `Deseja realmente excluir "${brokerName}"? Todos os servidores associados serão removidos.`
      )
    ) {
      return;
    }

    try {
      await deleteBroker(brokerId);
      toast.success('Corretora excluída com sucesso!');
      refetch();
    } catch (err) {
      toast.error(formatSupabaseError(err, 'Erro ao excluir corretora'));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button onClick={refetch}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-success-bg rounded-xl border border-border-subtle">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Corretoras</h1>
            <p className="text-sm text-text-secondary">Gerencie corretoras e servidores MT5</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total de Corretoras</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{stats.totalBrokers}</p>
            </div>
            <div className="p-3 bg-bg-primary/40 rounded-xl border border-border-subtle">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total de Servidores</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{stats.totalServers}</p>
            </div>
            <div className="p-3 bg-bg-primary/40 rounded-xl border border-border-subtle">
              <Server className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Corretoras Ativas</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{stats.activeBrokers}</p>
            </div>
            <div className="p-3 bg-success-bg rounded-xl border border-border-subtle">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar corretoras ou servidores..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary/50 transition-all"
              />
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedBroker(null);
                setShowBrokerModal(true);
              }}
            >
              <Plus className="w-5 h-5" />
              Nova Corretora
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos os Status' },
                { value: 'active', label: 'Ativas' },
                { value: 'inactive', label: 'Inativas' },
              ]}
            />
            <Select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              options={[
                { value: 'recent', label: 'Mais Recentes' },
                { value: 'name', label: 'Nome A-Z' },
              ]}
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-border-default border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : filteredBrokers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">Nenhuma corretora encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Corretora
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Servidores
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Atualizado em
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrokers.map(broker => (
                    <tr
                      key={broker.id}
                      className="border-b border-border-default/30 hover:bg-surface-elevated/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-text-primary">{broker.name}</p>
                          <p className="text-sm text-text-muted">{broker.slug}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={broker.is_active ? 'success' : 'secondary'}>
                          {broker.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary font-medium">
                            {broker.server_count || 0}
                          </span>
                          {broker.servers && broker.servers.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {broker.servers.slice(0, 2).map((srv, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs bg-bg-primary/40 text-text-secondary rounded-lg font-mono border border-border-subtle"
                                >
                                  {srv.server}
                                </span>
                              ))}
                              {broker.servers.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-bg-primary/40 text-text-secondary rounded-lg border border-border-subtle">
                                  +{broker.servers.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-text-secondary">{formatDate(broker.updated_at)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBroker(broker);
                              setShowBrokerModal(true);
                            }}
                            className="p-2 rounded-lg bg-bg-primary/40 hover:bg-surface-elevated text-text-secondary hover:text-primary transition-colors border border-border-subtle"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBroker(broker);
                              setShowServersModal(true);
                            }}
                            className="p-2 rounded-lg bg-bg-primary/40 hover:bg-surface-elevated text-text-secondary hover:text-primary transition-colors border border-border-subtle"
                            title="Gerenciar Servidores"
                          >
                            <Server className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBroker(broker.id, broker.name)}
                            className="p-2 rounded-lg bg-bg-primary/40 hover:bg-danger-bg text-text-secondary hover:text-danger transition-colors border border-border-subtle"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <BrokerFormModal
        isOpen={showBrokerModal}
        onClose={() => {
          setShowBrokerModal(false);
          setSelectedBroker(null);
        }}
        onSubmit={selectedBroker ? handleUpdateBroker : handleCreateBroker}
        broker={selectedBroker}
        onManageServers={() => {
          if (!selectedBroker) return;
          setShowBrokerModal(false);
          setShowServersModal(true);
        }}
      />

      <ServersModal
        isOpen={showServersModal}
        onClose={() => {
          setShowServersModal(false);
          setSelectedBroker(null);
        }}
        broker={selectedBroker}
        onUpdate={refetch}
      />
    </div>
  );
}
