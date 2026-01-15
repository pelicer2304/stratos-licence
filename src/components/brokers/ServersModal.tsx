import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Trash2, Plus, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import {
  addBrokerServer,
  updateBrokerServer,
  deleteBrokerServer,
  bulkAddBrokerServers,
} from '../../hooks/useBrokers';

interface ServersModalProps {
  isOpen: boolean;
  onClose: () => void;
  broker: {
    id: string;
    name: string;
  } | null;
  onUpdate: () => void;
}

interface Server {
  id: string;
  server: string;
  is_active: boolean;
}

type BrokerServerRow = {
  id: string;
  server: string | null;
  server_name?: string | null;
  is_active: boolean | null;
};

function normalizeServerRow(row: BrokerServerRow): Server {
  return {
    id: row.id,
    server: row.server ?? row.server_name ?? '',
    is_active: !!row.is_active,
  };
}

export function ServersModal({ isOpen, onClose, broker, onUpdate }: ServersModalProps) {
  const toast = useToast();
  const [servers, setServers] = useState<Server[]>([]);
  const [newServer, setNewServer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bulkServers, setBulkServers] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (broker && isOpen) {
      loadServers();
    }
  }, [broker, isOpen]);

  const loadServers = async () => {
    if (!broker) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('broker_servers')
        .select('*')
        .eq('broker_id', broker.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers((data || []).map(normalizeServerRow));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar servidores');
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = async () => {
    if (!broker || !newServer.trim()) return;

    setLoading(true);
    try {
      await addBrokerServer(broker.id, newServer.trim());
      toast.success('Servidor adicionado com sucesso!');
      setNewServer('');
      setShowCreateModal(false);
      await loadServers();
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!broker || !bulkServers.trim()) return;

    setLoading(true);
    try {
      const serverList = bulkServers
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const uniqueServers = [...new Set(serverList)];

      await bulkAddBrokerServers(broker.id, uniqueServers);
      toast.success(`${uniqueServers.length} servidor(es) importado(s) com sucesso!`);
      setBulkServers('');
      setShowBulkImport(false);
      await loadServers();
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao importar servidores');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServer = async (serverId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      await updateBrokerServer(serverId, !currentStatus);
      toast.success('Servidor atualizado com sucesso!');
      await loadServers();
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('Deseja realmente remover este servidor?')) return;

    setLoading(true);
    try {
      await deleteBrokerServer(serverId);
      toast.success('Servidor removido com sucesso!');
      await loadServers();
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Servidores — ${broker?.name || ''}`}
      size="large"
    >
      <div className="space-y-6">
        {!showBulkImport ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex-1">
              <Input
                placeholder="Buscar servidor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(true)}
              disabled={loading || !broker}
            >
              <Plus className="w-4 h-4" />
              Cadastrar servidor
            </Button>
            <Button variant="secondary" onClick={() => setShowBulkImport(true)} disabled={loading || !broker}>
              <Upload className="w-4 h-4" />
              Importar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary">
              Importar Lista de Servidores
            </label>
            <textarea
              value={bulkServers}
              onChange={e => setBulkServers(e.target.value)}
              placeholder="Cole os servidores aqui, um por linha..."
              className="w-full px-4 py-3 bg-bg-primary border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary/50 transition-all resize-none"
              rows={6}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowBulkImport(false);
                  setBulkServers('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkImport}
                disabled={loading || !bulkServers.trim()}
                className="flex-1"
              >
                Importar
              </Button>
            </div>
          </div>
        )}

        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewServer('');
          }}
          title="Cadastrar Servidor"
          zIndex={220}
        >
          <div className="space-y-4">
            <Input
              label="Nome do servidor MT5"
              placeholder="Ex: MetaQuotes-Demo"
              value={newServer}
              onChange={e => setNewServer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddServer()}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewServer('');
                }}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAddServer}
                className="flex-1"
                disabled={loading || !newServer.trim()}
              >
                Salvar
              </Button>
            </div>
          </div>
        </Modal>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {servers.length === 0 ? (
            <div className="text-center py-12 text-text-muted">Nenhum servidor cadastrado</div>
          ) : (
            servers
              .filter(server => {
                if (!searchQuery.trim()) return true;
                return server.server.toLowerCase().includes(searchQuery.trim().toLowerCase());
              })
              .map(server => (
              <div
                key={server.id}
                className="flex items-center justify-between p-3 bg-surface-elevated/30 border border-border-subtle rounded-lg hover:bg-surface-elevated/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <code className="text-sm text-text-secondary font-mono">{server.server}</code>
                  <Badge variant={server.is_active ? 'success' : 'secondary'}>
                    {server.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleServer(server.id, server.is_active)}
                    className="px-3 py-1 text-xs rounded-lg bg-bg-primary/40 hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors border border-border-subtle"
                    disabled={loading}
                  >
                    {server.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDeleteServer(server.id)}
                    className="p-2 rounded-lg bg-bg-primary/40 hover:bg-danger-bg text-text-secondary hover:text-danger transition-colors border border-border-subtle"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              ))
          )}
        </div>
      </div>
    </Modal>
  );
}
