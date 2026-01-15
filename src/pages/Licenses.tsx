import { useState, useMemo } from 'react';
import { Key, Search, Plus, Edit, Trash2, TrendingUp, Clock, Ban } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { MultiSelect } from '../components/ui/MultiSelect';
import { LicenseFormModal, LicenseFormData } from '../components/licenses/LicenseFormModal';
import { useLicenses, createLicense, updateLicense, deleteLicense } from '../hooks/useLicenses';
import { useBrokers } from '../hooks/useBrokers';
import { useToast } from '../contexts/ToastContext';
import { formatSupabaseError } from '../lib/supabaseError';
import type { License } from '../hooks/useLicenses';

export function Licenses() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBrokerIds, setSelectedBrokerIds] = useState<string[]>([]);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const { licenses, loading, error, refetch } = useLicenses({
    search: searchQuery,
    status: statusFilter,
    brokerIds: selectedBrokerIds,
  });

  const { brokers } = useBrokers();

  const brokerOptions = useMemo(() => {
    return brokers
      .filter(b => b.is_active)
      .map(b => ({
        value: b.id,
        label: b.name,
      }));
  }, [brokers]);

  const stats = useMemo(() => {
    const total = licenses.length;
    const active = licenses.filter(l => l.status === 'active').length;
    const expiring = licenses.filter(l => l.status === 'expiring').length;
    const blocked = licenses.filter(l => l.status === 'blocked').length;

    return { total, active, expiring, blocked };
  }, [licenses]);

  const handleCreateLicense = async (data: LicenseFormData) => {
    try {
      await createLicense(data);
      toast.success('Licença criada com sucesso!');
      refetch();
    } catch (err) {
      toast.error(formatSupabaseError(err, 'Erro ao criar licença'));
      throw err;
    }
  };

  const handleUpdateLicense = async (data: LicenseFormData) => {
    if (!selectedLicense) return;

    try {
      await updateLicense(selectedLicense.id, data);
      toast.success('Licença atualizada com sucesso!');
      refetch();
    } catch (err) {
      toast.error(formatSupabaseError(err, 'Erro ao atualizar licença'));
      throw err;
    }
  };

  const handleDeleteLicense = async (licenseId: string, clientName: string) => {
    if (!confirm(`Deseja realmente excluir a licença de "${clientName}"?`)) {
      return;
    }

    try {
      await deleteLicense(licenseId);
      toast.success('Licença excluída com sucesso!');
      refetch();
    } catch (err) {
      toast.error(formatSupabaseError(err, 'Erro ao excluir licença'));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiration = (expiresAt: string) => {
    const today = new Date();
    const expirationDate = new Date(expiresAt);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <Key className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Licenças</h1>
            <p className="text-sm text-text-secondary">Gerencie todas as licenças MT5</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-bg-primary/40 rounded-xl border border-border-subtle">
              <Key className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Ativas</p>
              <p className="text-2xl font-bold text-success mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-success-bg rounded-xl border border-border-subtle">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Expirando</p>
              <p className="text-2xl font-bold text-warning mt-1">{stats.expiring}</p>
            </div>
            <div className="p-3 bg-warning-bg rounded-xl border border-border-subtle">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Bloqueadas</p>
              <p className="text-2xl font-bold text-danger mt-1">{stats.blocked}</p>
            </div>
            <div className="p-3 bg-danger-bg rounded-xl border border-border-subtle">
              <Ban className="w-6 h-6 text-danger" />
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
                placeholder="Buscar licenças, clientes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary/50 transition-all"
              />
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedLicense(null);
                setShowLicenseModal(true);
              }}
            >
              <Plus className="w-5 h-5" />
              Nova Licença
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos os Status' },
                { value: 'active', label: 'Ativas' },
                { value: 'expiring', label: 'Expirando' },
                { value: 'blocked', label: 'Bloqueadas' },
              ]}
            />

            <MultiSelect
              options={brokerOptions}
              value={selectedBrokerIds}
              onChange={setSelectedBrokerIds}
              placeholder="Filtrar por servidores..."
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-border-default border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary mb-2">Nenhuma licença encontrada</p>
              <p className="text-sm text-text-muted">Crie sua primeira licença para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Login MT5
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Servidores
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      Expira em
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map(license => {
                    const daysUntilExpiration = getDaysUntilExpiration(license.expires_at);
                    const brokersList = Array.isArray(license.brokers) ? license.brokers : [];

                    return (
                      <tr
                        key={license.id}
                        className="border-b border-border-default/30 hover:bg-surface-elevated/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="font-medium text-text-primary">{license.client_name}</p>
                        </td>
                        <td className="py-4 px-4">
                          <code className="text-sm text-text-secondary bg-surface-elevated/50 px-2 py-1 rounded font-mono">
                            {license.mt5_login}
                          </code>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-1 flex-wrap max-w-xs">
                            {brokersList.slice(0, 2).map(broker => (
                              <span
                                key={broker.id}
                                className="px-2 py-1 text-xs bg-bg-primary/40 text-text-secondary rounded-lg border border-border-subtle"
                              >
                                {broker.name}
                              </span>
                            ))}
                            {brokersList.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-bg-primary/40 text-text-secondary rounded-lg border border-border-subtle">
                                +{brokersList.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              license.status === 'active'
                                ? 'active'
                                : license.status === 'expiring'
                                ? 'expiring'
                                : 'blocked'
                            }
                          >
                            {license.status === 'active'
                              ? 'Ativa'
                              : license.status === 'expiring'
                              ? 'Expirando'
                              : 'Bloqueada'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm text-text-secondary">{formatDate(license.expires_at)}</p>
                            {daysUntilExpiration >= 0 && (
                              <p
                                className={`text-xs ${
                                  daysUntilExpiration <= 7
                                    ? 'text-danger'
                                    : daysUntilExpiration <= 30
                                    ? 'text-warning'
                                    : 'text-text-muted'
                                }`}
                              >
                                {daysUntilExpiration === 0
                                  ? 'Expira hoje'
                                  : `${daysUntilExpiration} dias`}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedLicense(license);
                                setShowLicenseModal(true);
                              }}
                              className="p-2 rounded-lg bg-bg-primary/40 hover:bg-surface-elevated text-text-secondary hover:text-primary transition-colors border border-border-subtle"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLicense(license.id, license.client_name)}
                              className="p-2 rounded-lg bg-bg-primary/40 hover:bg-danger-bg text-text-secondary hover:text-danger transition-colors border border-border-subtle"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <LicenseFormModal
        isOpen={showLicenseModal}
        onClose={() => {
          setShowLicenseModal(false);
          setSelectedLicense(null);
        }}
        onSubmit={selectedLicense ? handleUpdateLicense : handleCreateLicense}
        license={selectedLicense}
        brokerOptions={brokerOptions}
      />
    </div>
  );
}
