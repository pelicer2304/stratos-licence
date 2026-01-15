import { useEffect, useMemo, useState } from 'react';
import { Server, Plus, Upload, Trash2, Power } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { formatSupabaseError } from '../lib/supabaseError';

type BrokerRow = {
  id: string;
  name: string;
  is_active: boolean;
};

type ServerRow = {
  id: string;
  broker_id: string;
  server?: string;
  server_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PostgrestErrorLike = {
  code?: string;
  message?: string;
};

type ServerWithBroker = ServerRow & {
  server: string;
  broker_name: string;
  broker_active: boolean;
};

export function Servers() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<BrokerRow[]>([]);
  const [servers, setServers] = useState<ServerWithBroker[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [brokerFilter, setBrokerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [newBrokerId, setNewBrokerId] = useState('');
  const [newServer, setNewServer] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkBrokerId, setBulkBrokerId] = useState('');
  const [bulkServers, setBulkServers] = useState('');
  const [saving, setSaving] = useState(false);

  const shouldRetryWithServerNameColumn = (err: unknown) => {
    const e = err as PostgrestErrorLike;
    const code = String(e.code ?? '');
    const message = String(e.message ?? '');
    return (
      (code === '23502' && message.includes('server_name')) ||
      (code === '42703' && message.toLowerCase().includes('server')) ||
      (code === 'PGRST204' && message.toLowerCase().includes('server'))
    );
  };

  const shouldRetryOmittingUnknownColumn = (err: unknown, column: 'server' | 'server_name') => {
    const e = err as PostgrestErrorLike;
    const code = String(e.code ?? '');
    const message = String(e.message ?? '');

    if (code !== '42703' && code !== 'PGRST204') return false;

    const needle = column === 'server' ? 'server' : 'server_name';
    return message.toLowerCase().includes(needle);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: brokersData, error: brokersError } = await supabase
        .from('brokers')
        .select('id,name,is_active')
        .order('name', { ascending: true });

      if (brokersError) throw brokersError;

      const { data: serversData, error: serversError } = await supabase
        .from('broker_servers')
        .select('*')
        .order('created_at', { ascending: false });

      if (serversError) throw serversError;

      const brokersList = (brokersData || []) as BrokerRow[];
      const brokerById = new Map(brokersList.map(b => [b.id, b] as const));

      const merged = ((serversData || []) as ServerRow[]).map(s => {
        const normalizedServer = s.server ?? s.server_name ?? '';
        const broker = brokerById.get(s.broker_id);
        return {
          ...s,
          server: normalizedServer,
          broker_name: broker?.name ?? '—',
          broker_active: broker?.is_active ?? false,
        };
      });

      setBrokers(brokersList);
      setServers(merged);

      if (!newBrokerId && brokersList.length > 0) {
        setNewBrokerId(brokersList[0].id);
      }
      if (!bulkBrokerId && brokersList.length > 0) {
        setBulkBrokerId(brokersList[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar servidores:', err);
      toast.error(formatSupabaseError(err, 'Erro ao carregar servidores'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brokerOptions = useMemo(() => {
    return brokers.map(b => ({ value: b.id, label: `${b.name}${b.is_active ? '' : ' (inativa)'}` }));
  }, [brokers]);

  const filteredServers = useMemo(() => {
    let list = [...servers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s => s.server.toLowerCase().includes(q) || s.broker_name.toLowerCase().includes(q)
      );
    }

    if (brokerFilter !== 'all') {
      list = list.filter(s => s.broker_id === brokerFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter(s => (statusFilter === 'active' ? s.is_active : !s.is_active));
    }

    return list;
  }, [servers, searchQuery, brokerFilter, statusFilter]);

  const handleCreateServer = async () => {
    if (!newBrokerId) {
      toast.error('Selecione uma corretora');
      return;
    }
    if (!newServer.trim()) {
      toast.error('Digite o nome do servidor');
      return;
    }

    try {
      setSaving(true);
      const serverValue = newServer.trim();

      // Try sending both fields first (some DBs enforce both NOT NULL).
      let { error } = await supabase.from('broker_servers').insert({
        broker_id: newBrokerId,
        server: serverValue,
        server_name: serverValue,
        is_active: true,
      });

      // If a column doesn't exist in this schema, retry without it.
      if (error && shouldRetryOmittingUnknownColumn(error, 'server_name')) {
        ({ error } = await supabase.from('broker_servers').insert({
          broker_id: newBrokerId,
          server: serverValue,
          is_active: true,
        }));
      } else if (error && shouldRetryOmittingUnknownColumn(error, 'server')) {
        ({ error } = await supabase.from('broker_servers').insert({
          broker_id: newBrokerId,
          server_name: serverValue,
          is_active: true,
        }));
      } else if (error && shouldRetryWithServerNameColumn(error)) {
        // Legacy/constraint-based fallback: ensure server_name is provided.
        ({ error } = await supabase.from('broker_servers').insert({
          broker_id: newBrokerId,
          server_name: serverValue,
          is_active: true,
        }));
      }

      if (error) throw error;

      toast.success('Servidor cadastrado com sucesso!');
      setNewServer('');
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      setSaving(true);
      const { error } = await supabase.from('broker_servers').update({ is_active: !current }).eq('id', id);
      if (error) throw error;
      toast.success('Servidor atualizado com sucesso!');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este servidor?')) return;

    try {
      setSaving(true);
      const { error } = await supabase.from('broker_servers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Servidor removido com sucesso!');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkBrokerId) {
      toast.error('Selecione uma corretora');
      return;
    }

    const list = bulkServers
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const unique = [...new Set(list)];

    if (unique.length === 0) {
      toast.error('Cole pelo menos um servidor');
      return;
    }

    try {
      setSaving(true);
      const payload = unique.map(server => ({ broker_id: bulkBrokerId, server, is_active: true }));

      const bothPayload = unique.map(server => ({
        broker_id: bulkBrokerId,
        server,
        server_name: server,
        is_active: true,
      }));

      let { error } = await supabase.from('broker_servers').insert(bothPayload);

      if (error && shouldRetryOmittingUnknownColumn(error, 'server_name')) {
        ({ error } = await supabase.from('broker_servers').insert(payload));
      } else if (error && shouldRetryOmittingUnknownColumn(error, 'server')) {
        const retryPayload = unique.map(server => ({
          broker_id: bulkBrokerId,
          server_name: server,
          is_active: true,
        }));
        ({ error } = await supabase.from('broker_servers').insert(retryPayload));
      } else if (error && shouldRetryWithServerNameColumn(error)) {
        const retryPayload = unique.map(server => ({
          broker_id: bulkBrokerId,
          server_name: server,
          is_active: true,
        }));
        ({ error } = await supabase.from('broker_servers').insert(retryPayload));
      }

      if (error) throw error;

      toast.success(`${unique.length} servidor(es) importado(s) com sucesso!`);
      setBulkServers('');
      setShowBulkImport(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao importar servidores');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-success-bg rounded-xl border border-border-subtle">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Servidores</h1>
            <p className="text-sm text-text-secondary">Cadastre e gerencie servidores MT5 por corretora</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            disabled={loading || brokers.length === 0}
          >
            <Plus className="w-5 h-5" />
            Cadastrar Servidor
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowBulkImport(true)}
            disabled={loading || brokers.length === 0}
          >
            <Upload className="w-5 h-5" />
            Importar em Massa
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setNewServer('');
            }}
            title="Cadastrar Servidor"
          >
            <div className="space-y-4">
              <Select
                label="Corretora"
                value={newBrokerId}
                onChange={e => setNewBrokerId(e.target.value)}
                options={brokerOptions}
              />

              <Input
                label="Nome do servidor MT5"
                value={newServer}
                onChange={e => setNewServer(e.target.value)}
                placeholder="Ex: MetaQuotes-Demo"
                onKeyDown={e => e.key === 'Enter' && handleCreateServer()}
              />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewServer('');
                  }}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateServer}
                  className="flex-1"
                  disabled={saving || loading}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </Modal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por servidor ou corretora..."
            />
            <Select
              value={brokerFilter}
              onChange={e => setBrokerFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todas as corretoras' },
                ...brokerOptions,
              ]}
            />
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              options={[
                { value: 'all', label: 'Todos os status' },
                { value: 'active', label: 'Ativos' },
                { value: 'inactive', label: 'Inativos' },
              ]}
            />
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-2 border-border-default border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="text-center py-10 text-text-muted">Nenhum servidor encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Servidor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Corretora</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServers.map(s => (
                    <tr
                      key={s.id}
                      className="border-b border-border-default/30 hover:bg-surface-elevated/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <code className="text-sm text-text-secondary bg-bg-primary/40 px-2 py-1 rounded font-mono border border-border-subtle">
                          {s.server}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-text-primary font-medium">{s.broker_name}</span>
                          {!s.broker_active && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-danger-bg text-danger border border-border-subtle">
                              corretora inativa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={s.is_active ? 'success' : 'secondary'}>
                          {s.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(s.id, s.is_active)}
                            className="p-2 rounded-lg bg-bg-primary/40 hover:bg-surface-elevated text-text-secondary hover:text-primary transition-colors border border-border-subtle"
                            title={s.is_active ? 'Desativar' : 'Ativar'}
                            disabled={saving}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 rounded-lg bg-bg-primary/40 hover:bg-danger-bg text-text-secondary hover:text-danger transition-colors border border-border-subtle"
                            title="Excluir"
                            disabled={saving}
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

      <Modal isOpen={showBulkImport} onClose={() => setShowBulkImport(false)} title="Importar servidores" size="large">
        <div className="space-y-4">
          <Select value={bulkBrokerId} onChange={e => setBulkBrokerId(e.target.value)} options={brokerOptions} />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Lista (um por linha)</label>
            <textarea
              value={bulkServers}
              onChange={e => setBulkServers(e.target.value)}
              placeholder="Cole os servidores aqui, um por linha..."
              className="w-full px-4 py-3 bg-bg-primary border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary/50 transition-all resize-none"
              rows={8}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowBulkImport(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleBulkImport} disabled={saving}>
              Importar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
