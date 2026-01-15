import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { license_key, login, server } = await req.json()

    if (!license_key || !login || !server) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'MISSING_PARAMS' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar licença
    const { data: license, error: licenseError } = await supabaseAdmin
      .from('licenses')
      .select('id, status, expires_at, mt5_login')
      .eq('license_key', license_key)
      .single()

    if (licenseError || !license) {
      await logValidation(supabaseAdmin, null, 'INVALID_KEY', server, login)
      return new Response(
        JSON.stringify({ ok: false, reason: 'INVALID_KEY' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verificar status
    if (license.status !== 'active') {
      await logValidation(supabaseAdmin, license.id, 'INACTIVE', server, login)
      return new Response(
        JSON.stringify({ ok: false, reason: 'INACTIVE' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Verificar expiração
    if (license.expires_at) {
      const expiresAt = new Date(license.expires_at)
      if (expiresAt < new Date()) {
        await logValidation(supabaseAdmin, license.id, 'EXPIRED', server, login)
        return new Response(
          JSON.stringify({ ok: false, reason: 'EXPIRED', expires_at: license.expires_at }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 4. Verificar MT5 login (se configurado)
    if (license.mt5_login && license.mt5_login !== login) {
      await logValidation(supabaseAdmin, license.id, 'INVALID_LOGIN', server, login)
      return new Response(
        JSON.stringify({ ok: false, reason: 'INVALID_LOGIN' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Buscar broker pelo server name
    const { data: brokerServer } = await supabaseAdmin
      .from('broker_servers')
      .select('broker_id, is_active')
      .ilike('server', server)
      .eq('is_active', true)
      .single()

    if (!brokerServer) {
      await logValidation(supabaseAdmin, license.id, 'SERVER_NOT_FOUND', server, login)
      return new Response(
        JSON.stringify({ ok: false, reason: 'SERVER_NOT_FOUND' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Verificar se licença permite esse broker
    const { data: licenseBroker } = await supabaseAdmin
      .from('license_brokers')
      .select('id')
      .eq('license_id', license.id)
      .eq('broker_id', brokerServer.broker_id)
      .single()

    if (!licenseBroker) {
      await logValidation(supabaseAdmin, license.id, 'BROKER_NOT_ALLOWED', server, login)
      return new Response(
        JSON.stringify({ ok: false, reason: 'BROKER_NOT_ALLOWED' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Sucesso - log e retorno
    await logValidation(supabaseAdmin, license.id, 'SUCCESS', server, login)
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        license_id: license.id,
        expires_at: license.expires_at,
        status: license.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, reason: 'SERVER_ERROR', error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function logValidation(
  supabase: ReturnType<typeof createClient>,
  licenseId: string | null,
  status: string,
  server: string,
  login: number
) {
  try {
    await supabase.from('validation_logs').insert({
      license_id: licenseId,
      validation_time: new Date().toISOString(),
      status: status,
      server_name: server,
      mt5_login: login,
      ip_address: null,
      user_agent: 'MT5-Indicator'
    })
  } catch (e) {
    console.error('Failed to log validation:', e)
  }
}
