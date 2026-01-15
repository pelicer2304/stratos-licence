import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatSupabaseError } from '../lib/supabaseError';
import type { Database, Json } from '../types/database';

export interface License {
  id: string;
  client_name: string;
  mt5_login: number;
  status: 'active' | 'expiring' | 'blocked';
  expires_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
  brokers?: Array<{
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  }>;
}

export interface LicenseFilters {
  search?: string;
  status?: string;
  brokerIds?: string[];
}

export function useLicenses(filters?: LicenseFilters) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeLicenseRow = (row: unknown): License => {
    const obj = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};

    const rawLogin =
      obj['mt5_login'] ?? obj['login'] ?? obj['mt5'] ?? obj['mt_login'] ?? obj['mt5Login'];

    const loginNumber =
      typeof rawLogin === 'number'
        ? rawLogin
        : typeof rawLogin === 'string'
          ? Number(rawLogin)
          : Number.NaN;

    const brokersValue = obj['brokers'];

    return {
      id: String(obj['id'] ?? ''),
      client_name: String(
        obj['client_name'] ?? obj['client'] ?? obj['customer_name'] ?? obj['name'] ?? ''
      ),
      mt5_login: Number.isFinite(loginNumber) ? loginNumber : 0,
      status: (obj['status'] ?? 'active') as License['status'],
      expires_at: String(obj['expires_at'] ?? obj['expires'] ?? obj['expiresAt'] ?? ''),
      notes: String(obj['notes'] ?? ''),
      created_at: String(obj['created_at'] ?? ''),
      updated_at: String(obj['updated_at'] ?? ''),
      brokers: Array.isArray(brokersValue) ? (brokersValue as License['brokers']) : [],
    };
  };

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('v_licenses_with_brokers')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      let filteredData = (data || []).map(normalizeLicenseRow);

      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filteredData = filteredData.filter(
          license =>
            String(license.client_name || '').toLowerCase().includes(search) ||
            String(license.mt5_login || '').includes(search)
        );
      }

      if (filters?.status && filters.status !== 'all') {
        filteredData = filteredData.filter(license => license.status === filters.status);
      }

      if (filters?.brokerIds && filters.brokerIds.length > 0) {
        filteredData = filteredData.filter(license => {
          const brokers = Array.isArray(license.brokers) ? license.brokers : [];
          return brokers.some(broker => filters.brokerIds!.includes(broker.id));
        });
      }

      setLicenses(filteredData);
    } catch (err) {
      setError(formatSupabaseError(err, 'Erro ao carregar licenças'));
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [filters?.search, filters?.status, filters?.brokerIds?.join(',')]);

  return { licenses, loading, error, refetch: fetchLicenses };
}

export async function createLicense(data: {
  client_name: string;
  mt5_login: number;
  status: 'active' | 'expiring' | 'blocked';
  expires_at: string;
  notes: string;
  broker_ids: string[];
}) {
  const { broker_ids, ...licenseData } = data;

  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .insert(licenseData)
    .select()
    .single();

  if (licenseError) throw new Error(formatSupabaseError(licenseError, 'Erro ao criar licença'));

  if (broker_ids && broker_ids.length > 0) {
    const licenseBrokers = broker_ids.map(brokerId => ({
      license_id: license.id,
      broker_id: brokerId,
    }));

    const { error: linkError } = await supabase
      .from('license_brokers')
      .insert(licenseBrokers);

    if (linkError) throw new Error(formatSupabaseError(linkError, 'Erro ao vincular corretoras'));
  }

  await logAudit('license.create', 'license', license.id, {
    client_name: data.client_name,
    mt5_login: data.mt5_login,
  });

  return license;
}

export async function updateLicense(
  id: string,
  data: {
    client_name: string;
    mt5_login: number;
    status: 'active' | 'expiring' | 'blocked';
    expires_at: string;
    notes: string;
    broker_ids: string[];
  }
) {
  const { broker_ids, ...licenseData } = data;

  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .update(licenseData)
    .eq('id', id)
    .select()
    .single();

  if (licenseError) throw new Error(formatSupabaseError(licenseError, 'Erro ao atualizar licença'));

  const { error: deleteError } = await supabase
    .from('license_brokers')
    .delete()
    .eq('license_id', id);

  if (deleteError) throw new Error(formatSupabaseError(deleteError, 'Erro ao atualizar vínculos'));

  if (broker_ids && broker_ids.length > 0) {
    const licenseBrokers = broker_ids.map(brokerId => ({
      license_id: id,
      broker_id: brokerId,
    }));

    const { error: linkError } = await supabase
      .from('license_brokers')
      .insert(licenseBrokers);

    if (linkError) throw new Error(formatSupabaseError(linkError, 'Erro ao vincular corretoras'));
  }

  await logAudit('license.update', 'license', id, {
    client_name: data.client_name,
    mt5_login: data.mt5_login,
  });

  return license;
}

export async function deleteLicense(id: string) {
  const { error } = await supabase.from('licenses').delete().eq('id', id);

  if (error) throw new Error(formatSupabaseError(error, 'Erro ao excluir licença'));

  await logAudit('license.delete', 'license', id, {});
}

let auditLoggingEnabled = true;

type PostgrestErrorLike = {
  code?: string;
  message?: string;
};

async function logAudit(action: string, entity: string, entityId: string, meta: Record<string, unknown>) {
  if (!auditLoggingEnabled) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

  const basePayload: AuditLogInsert = {
    action,
    entity,
    entity_id: entityId,
    meta: meta as Json,
    user_id: user?.id ?? null,
  };

  const { error } = await supabase.from('audit_logs').insert(basePayload);

  if (error) {
    console.warn('Audit log insert failed:', error);
    const code = (error as PostgrestErrorLike)?.code;

    if (code === '23502' && String((error as PostgrestErrorLike)?.message || '').includes('table_name')) {
      const retryPayload = ({ ...basePayload, table_name: entity } as unknown) as AuditLogInsert;
      const { error: retryError } = await supabase.from('audit_logs').insert(retryPayload);
      if (!retryError) return;
      console.warn('Audit log retry failed:', retryError);
    }

    if (code === '42P01' || code === '42703' || code === 'PGRST204' || code === '23502') {
      auditLoggingEnabled = false;
    }
  }
}
