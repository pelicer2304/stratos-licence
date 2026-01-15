import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { MultiSelect } from '../ui/MultiSelect';

const licenseSchema = z.object({
  client_name: z.string().min(1, 'Nome do cliente é obrigatório'),
  mt5_login: z.coerce.number().int().positive('Login MT5 deve ser um número positivo'),
  status: z.enum(['active', 'expiring', 'blocked']),
  expires_at: z.string().min(1, 'Data de expiração é obrigatória'),
  broker_ids: z.array(z.string()).min(1, 'Selecione pelo menos uma corretora'),
  notes: z.string(),
});

export type LicenseFormData = z.infer<typeof licenseSchema>;

interface LicenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LicenseFormData) => Promise<void>;
  license?: {
    id: string;
    client_name: string;
    mt5_login: number;
    status: string;
    expires_at: string;
    notes: string;
    brokers?: Array<{ id: string }>;
  } | null;
  brokerOptions: Array<{ value: string; label: string }>;
}

export function LicenseFormModal({
  isOpen,
  onClose,
  onSubmit,
  license,
  brokerOptions,
}: LicenseFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LicenseFormData>({
    resolver: zodResolver(licenseSchema) as unknown as Resolver<LicenseFormData>,
    defaultValues: {
      client_name: '',
      mt5_login: 0,
      status: 'active',
      expires_at: '',
      broker_ids: [],
      notes: '',
    },
  });

  const selectedBrokerIds = watch('broker_ids');

  const toDateInputValue = (value: string) => {
    // Accepts 'YYYY-MM-DD' or ISO timestamps and normalizes to 'YYYY-MM-DD'.
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return String(value).slice(0, 10);
  };

  useEffect(() => {
    if (license) {
      reset({
        client_name: license.client_name,
        mt5_login: license.mt5_login,
        status: license.status as 'active' | 'expiring' | 'blocked',
        expires_at: toDateInputValue(license.expires_at),
        broker_ids: license.brokers?.map(b => b.id) || [],
        notes: license.notes || '',
      });
    } else {
      reset({
        client_name: '',
        mt5_login: 0,
        status: 'active',
        expires_at: '',
        broker_ids: [],
        notes: '',
      });
    }
  }, [license, isOpen, reset]);

  const handleFormSubmit = async (data: LicenseFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={license ? 'Editar Licença' : 'Nova Licença'}
      size="large"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Nome do Cliente"
              {...register('client_name')}
              placeholder="Ex: João Silva"
              error={errors.client_name?.message}
            />
          </div>

          <Input
            label="Login MT5"
            type="number"
            {...register('mt5_login', { valueAsNumber: true })}
            placeholder="Ex: 12345678"
            error={errors.mt5_login?.message}
          />

          <Input
            label="Data de Expiração"
            type="date"
            {...register('expires_at')}
            error={errors.expires_at?.message}
          />

          <Select
            label="Status"
            {...register('status')}
            options={[
              { value: 'active', label: 'Ativa' },
              { value: 'expiring', label: 'Expirando' },
              { value: 'blocked', label: 'Bloqueada' },
            ]}
            error={errors.status?.message}
          />

          <div>
            <MultiSelect
              label="Corretoras Permitidas"
              options={brokerOptions}
              value={selectedBrokerIds}
              onChange={values => setValue('broker_ids', values, { shouldValidate: true })}
              placeholder="Selecione as corretoras..."
            />
            {errors.broker_ids && (
              <p className="mt-1 text-sm text-danger">{errors.broker_ids.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Observações</label>
          <textarea
            {...register('notes')}
            placeholder="Notas sobre a licença..."
            className="w-full px-4 py-3 bg-bg-primary border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary/50 transition-all resize-none"
            rows={4}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
