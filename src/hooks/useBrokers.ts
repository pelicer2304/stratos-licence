import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatSupabaseError } from '../lib/supabaseError';
import type { Database, Json } from '../types/database';

export interface Broker {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerServer {
  id: string;
  broker_id: string;
  server: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type BrokerServerRow = {
  id: string;
  broker_id: string;
  server: string | null;
  server_name?: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
};

type PostgrestErrorLike = {
  code?: string;
  message?: string;
};

function normalizeBrokerServer(row: BrokerServerRow): BrokerServer {
  return {
    id: row.id,
    broker_id: row.broker_id,
    server: row.server ?? row.server_name ?? '',
    is_active: !!row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function shouldRetryWithServerNameColumn(err: unknown) {
  const e = err as PostgrestErrorLike;
  const code = String(e.code ?? '');
  const message = String(e.message ?? '');
  return (
    (code === '23502' && message.includes('server_name')) ||
    (code === '42703' && message.toLowerCase().includes('server')) ||
    (code === 'PGRST204' && message.toLowerCase().includes('server'))
  );
}

function shouldRetryOmittingUnknownColumn(err: unknown, column: 'server' | 'server_name') {
  const e = err as PostgrestErrorLike;
  const code = String(e.code ?? '');
  const message = String(e.message ?? '');

  if (code !== '42703' && code !== 'PGRST204') return false;

  const needle = column === 'server' ? 'server' : 'server_name';
  return message.toLowerCase().includes(needle);
}

export interface BrokerWithServers extends Broker {
  servers?: BrokerServer[];
  server_count?: number;
}

export function useBrokers() {
  const [brokers, setBrokers] = useState<BrokerWithServers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: brokersData, error: brokersError } = await supabase
        .from('brokers')
        .select('*')
        .order('created_at', { ascending: false });

      if (brokersError) throw brokersError;

      const { data: serversData, error: serversError } = await supabase
        .from('broker_servers')
        .select('*');

      if (serversError) throw serversError;

      const normalizedServers = ((serversData || []) as BrokerServerRow[]).map(normalizeBrokerServer);

      const brokersWithServers = (brokersData || []).map(broker => {
        const servers = normalizedServers.filter(s => s.broker_id === broker.id);
        return {
          ...broker,
          servers,
          server_count: servers.length,
        };
      });

      setBrokers(brokersWithServers);
    } catch (err) {
      setError(formatSupabaseError(err, 'Erro ao carregar corretoras'));
      console.error('Error fetching brokers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  return { brokers, loading, error, refetch: fetchBrokers };
}

export async function createBroker(data: {
  name: string;
  slug: string;
  is_active: boolean;
  notes: string;
}) {
  const { data: broker, error } = await supabase
    .from('brokers')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Erro ao criar corretora'));

  await logAudit('broker.create', 'broker', broker.id, { name: data.name });

  return broker;
}

export async function updateBroker(
  id: string,
  data: {
    name: string;
    slug: string;
    is_active: boolean;
    notes: string;
  }
) {
  const { data: broker, error } = await supabase
    .from('brokers')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Erro ao atualizar corretora'));

  await logAudit('broker.update', 'broker', id, { name: data.name });

  return broker;
}

export async function deleteBroker(id: string) {
  const { error } = await supabase.from('brokers').delete().eq('id', id);

  if (error) throw new Error(formatSupabaseError(error, 'Erro ao excluir corretora'));

  await logAudit('broker.delete', 'broker', id, {});
}

export async function addBrokerServer(brokerId: string, server: string) {
  // Try both columns first (some DBs enforce both NOT NULL).
  let { data, error } = await supabase
    .from('broker_servers')
    .insert({
      broker_id: brokerId,
      server,
      server_name: server,
      is_active: true,
    })
    .select()
    .single();

  // If a column doesn't exist in this schema, retry without it.
  if (error && shouldRetryOmittingUnknownColumn(error, 'server_name')) {
    ({ data, error } = await supabase
      .from('broker_servers')
      .insert({ broker_id: brokerId, server, is_active: true })
      .select()
      .single());
  } else if (error && shouldRetryOmittingUnknownColumn(error, 'server')) {
    ({ data, error } = await supabase
      .from('broker_servers')
      .insert({ broker_id: brokerId, server_name: server, is_active: true })
      .select()
      .single());
  } else if (error && shouldRetryWithServerNameColumn(error)) {
    // Legacy/constraint-based fallback.
    ({ data, error } = await supabase
      .from('broker_servers')
      .insert({ broker_id: brokerId, server_name: server, is_active: true })
      .select()
      .single());
  }

  if (error) throw new Error(formatSupabaseError(error, 'Erro ao adicionar servidor'));

  if (!data) throw new Error('Erro ao adicionar servidor');

  await logAudit('broker_server.create', 'broker', brokerId, { server });

  return normalizeBrokerServer(data);
}

export async function updateBrokerServer(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('broker_servers')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Erro ao atualizar servidor'));
  return normalizeBrokerServer(data);
}

export async function deleteBrokerServer(id: string) {
  const { error } = await supabase.from('broker_servers').delete().eq('id', id);
  if (error) throw new Error(formatSupabaseError(error, 'Erro ao excluir servidor'));
}

export async function bulkAddBrokerServers(brokerId: string, servers: string[]) {
  const bothObjects = servers.map(server => ({
    broker_id: brokerId,
    server,
    server_name: server,
    is_active: true,
  }));

  let { data, error } = await supabase
    .from('broker_servers')
    .insert(bothObjects)
    .select();

  if (error && shouldRetryOmittingUnknownColumn(error, 'server_name')) {
    const serverOnly = servers.map(server => ({ broker_id: brokerId, server, is_active: true }));
    ({ data, error } = await supabase.from('broker_servers').insert(serverOnly).select());
  } else if (error && shouldRetryOmittingUnknownColumn(error, 'server')) {
    const serverNameOnly = servers.map(server => ({
      broker_id: brokerId,
      server_name: server,
      is_active: true,
    }));
    ({ data, error } = await supabase.from('broker_servers').insert(serverNameOnly).select());
  } else if (error && shouldRetryWithServerNameColumn(error)) {
    const retryObjects = servers.map(server => ({
      broker_id: brokerId,
      server_name: server,
      is_active: true,
    }));

    ({ data, error } = await supabase
      .from('broker_servers')
      .insert(retryObjects)
      .select());
  }

  if (error) throw new Error(formatSupabaseError(error, 'Erro ao importar servidores'));

  await logAudit('broker_server.bulk_create', 'broker', brokerId, {
    count: servers.length,
  });

  return ((data || []) as BrokerServerRow[]).map(normalizeBrokerServer);
}

let auditLoggingEnabled = true;

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
    // Don't block the main flow because of audit issues.
    console.warn('Audit log insert failed:', error);

    const code = (error as PostgrestErrorLike)?.code;

    // Some older schemas require table_name NOT NULL.
    if (code === '23502' && String((error as PostgrestErrorLike)?.message || '').includes('table_name')) {
      const retryPayload = ({ ...basePayload, table_name: entity } as unknown) as AuditLogInsert;
      const { error: retryError } = await supabase.from('audit_logs').insert(retryPayload);
      if (!retryError) return;
      console.warn('Audit log retry failed:', retryError);
    }

    // Common "schema not ready" / "missing column/table" / constraint codes.
    if (code === '42P01' || code === '42703' || code === 'PGRST204' || code === '23502') {
      auditLoggingEnabled = false;
    }
  }
}
