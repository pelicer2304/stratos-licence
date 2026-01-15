import { useState, useEffect, FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface BrokerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BrokerFormData) => Promise<void>;
  onManageServers?: () => void;
  broker?: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    notes: string;
    server_count?: number;
  } | null;
}

export interface BrokerFormData {
  name: string;
  slug: string;
  is_active: boolean;
  notes: string;
}

export function BrokerFormModal({ isOpen, onClose, onSubmit, onManageServers, broker }: BrokerFormModalProps) {
  const [formData, setFormData] = useState<BrokerFormData>({
    name: '',
    slug: '',
    is_active: true,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (broker) {
      setFormData({
        name: broker.name,
        slug: broker.slug,
        is_active: broker.is_active,
        notes: broker.notes || '',
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        is_active: true,
        notes: '',
      });
    }
    setError('');
  }, [broker, isOpen]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.name)
        ? generateSlug(value)
        : prev.slug
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar corretora');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={broker ? 'Editar Corretora' : 'Nova Corretora'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: XP Investimentos"
          required
        />

        <Input
          label="Slug"
          value={formData.slug}
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          placeholder="Ex: xp-investimentos"
          hint="Deixe vazio para gerar automaticamente"
        />

        <Select
          label="Status"
          value={formData.is_active ? 'active' : 'inactive'}
          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
          options={[
            { value: 'active', label: 'Ativa' },
            { value: 'inactive', label: 'Inativa' },
          ]}
        />

        {broker?.id && onManageServers && (
          <div className="p-4 rounded-xl bg-bg-primary/30 border border-border-subtle">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Servidores vinculados</p>
                <p className="text-xs text-text-muted">
                  {typeof broker.server_count === 'number'
                    ? `${broker.server_count} servidor(es)`
                    : 'Gerencie os servidores desta corretora'}
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={onManageServers} disabled={loading}>
                Gerenciar servidores
              </Button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Observações
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notas sobre a corretora..."
            className="w-full px-4 py-3 bg-bg-primary border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary/50 transition-all resize-none"
            rows={4}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger-bg border border-border-subtle text-danger text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
