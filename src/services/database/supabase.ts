import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../../config/env';
import { Logger } from '../../utils/logger';

export interface UserConfigRow {
  uuid: string;
  config: Record<string, any>;
  created_at?: string;
}

let supabaseClient: SupabaseClient | null = null;
let isInitialized = false;

export function getSupabaseCredentials(): { url: string; key: string } {
  const url = (process.env.SUPABASE_URL || ENV.SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ENV.SUPABASE_KEY ||
    ''
  ).trim();
  return { url, key };
}

export function isSupabaseAvailable(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

export function initSupabaseClient(): SupabaseClient | null {
  if (isInitialized && supabaseClient) {
    return supabaseClient;
  }

  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    if (!isInitialized) {
      console.log('[Supabase] SUPABASE_URL / SUPABASE_KEY não configuradas. Operando com armazenamento local/memória para desenvolvimento.');
      Logger.warn('[Supabase] Credentials not set. Running in local fallback mode.');
      isInitialized = true;
    }
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    isInitialized = true;
    console.log(`[Supabase] Cliente inicializado com sucesso para: ${url}`);
    Logger.info(`[Supabase] Cloud database client connected to ${url}`);
    return supabaseClient;
  } catch (err: any) {
    console.error('[Supabase] Falha ao inicializar cliente Supabase:', err?.message || err);
    Logger.error('[Supabase] Failed to initialize client', err);
    isInitialized = true;
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseClient) {
    return initSupabaseClient();
  }
  return supabaseClient;
}

/**
 * Salvar / Atualizar Configuração (upsert na tabela users_config)
 * Estrutura da tabela:
 * - uuid (text, primary key)
 * - config (jsonb)
 * - created_at (timestamp)
 */
export async function upsertUserConfigToSupabase(
  uuid: string,
  configData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  const cleanUuid = String(uuid).trim().toLowerCase();

  try {
    const payload: UserConfigRow = {
      uuid: cleanUuid,
      config: configData
    };

    const { error } = await client
      .from('users_config')
      .upsert(payload, { onConflict: 'uuid' });

    if (error) {
      console.error(`[Supabase] Erro ao gravar dados para o UUID ${cleanUuid}:`, error.message);
      Logger.error(`[Supabase] Upsert failed for UUID ${cleanUuid}`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase] Resultado da gravação: SUCESSO (upsert no Supabase users_config para ${cleanUuid})`);
    return { success: true };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[Supabase] Exceção inesperada na gravação do UUID ${cleanUuid}:`, msg);
    Logger.error(`[Supabase] Unexpected exception in upsert for UUID ${cleanUuid}`, err);
    return { success: false, error: msg };
  }
}

/**
 * Buscar Configuração por UUID na tabela users_config
 */
export async function fetchUserConfigFromSupabase(
  uuid: string
): Promise<{ success: boolean; config?: Record<string, any>; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  const cleanUuid = String(uuid).trim().toLowerCase();

  try {
    const { data, error } = await client
      .from('users_config')
      .select('config')
      .eq('uuid', cleanUuid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return { success: false, error: 'UUID não encontrado' };
      }
      console.error(`[Supabase] Erro ao consultar UUID ${cleanUuid}:`, error.message);
      Logger.warn(`[Supabase] Query error for UUID ${cleanUuid}: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data || !data.config) {
      return { success: false, error: 'Registro vazio' };
    }

    const configObj = typeof data.config === 'string' ? JSON.parse(data.config) : data.config;
    return { success: true, config: configObj };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[Supabase] Exceção na busca do UUID ${cleanUuid}:`, msg);
    Logger.warn(`[Supabase] Exception querying UUID ${cleanUuid}: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Buscar Todas as Configurações (usado para aquecimento de cache em memória no arranque)
 */
export async function fetchAllUserConfigsFromSupabase(): Promise<
  Array<{ uuid: string; config: Record<string, any>; created_at?: string }>
> {
  const client = getSupabase();
  if (!client) {
    return [];
  }

  try {
    const { data, error } = await client
      .from('users_config')
      .select('uuid, config, created_at');

    if (error) {
      console.warn(`[Supabase] Aviso ao pré-carregar configurações: ${error.message}`);
      Logger.warn(`[Supabase] Failed to fetch all configs for warmup: ${error.message}`);
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((row: any) => ({
      uuid: String(row.uuid).toLowerCase(),
      config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
      created_at: row.created_at
    }));
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[Supabase] Exceção ao pré-carregar configurações: ${msg}`);
    Logger.warn(`[Supabase] Exception fetching all configs: ${msg}`);
    return [];
  }
}
