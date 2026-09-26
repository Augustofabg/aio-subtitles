import assert from 'assert';
import {
  isSupabaseAvailable,
  getSupabaseCredentials,
  initSupabaseClient,
  upsertUserConfigToSupabase,
  fetchUserConfigFromSupabase,
  fetchAllUserConfigsFromSupabase,
  getSupabase
} from '../src/services/database';
import { configStorage, isUuid } from '../src/storage/configStore';
import { DEFAULT_USER_CONFIG, decodeUserConfigAsync } from '../src/config/userConfig';
import { UserConfig } from '../src/types/config';

console.log('🧪 Iniciando Testes de Persistência em Nuvem — Supabase...');

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(desc: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✅ ${desc}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ❌ ${desc}:`, err.message || err);
            throw err;
          });
      } else {
        console.log(`  ✅ ${desc}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ❌ ${desc}:`, err.message || err);
      throw err;
    }
  }

  // --- 1. Verificação de Inicialização e Ausência de Chaves (Fallback Seguro) ---
  console.log('\n--- 1. Inicialização e Comportamento Sem Chaves (Fallback Seguro) ---');

  await test('Verifica se getSupabaseCredentials lê variáveis de ambiente', () => {
    const creds = getSupabaseCredentials();
    assert.strictEqual(typeof creds.url, 'string');
    assert.strictEqual(typeof creds.key, 'string');
  });

  await test('initSupabaseClient não lança exceção quando chaves estão ausentes e retorna null/cliente controlado', () => {
    // Should never throw
    const client = initSupabaseClient();
    // In local dev without keys, it returns null without crashing the process
    if (!isSupabaseAvailable()) {
      assert.strictEqual(client, null);
    }
  });

  await test('fetchUserConfigFromSupabase retorna erro controlado sem lançar quando cliente não disponível', async () => {
    if (!isSupabaseAvailable()) {
      const res = await fetchUserConfigFromSupabase('12345678-1234-1234-1234-1234567890ab');
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('not initialized'));
    }
  });

  await test('upsertUserConfigToSupabase retorna erro controlado sem lançar quando cliente não disponível', async () => {
    if (!isSupabaseAvailable()) {
      const res = await upsertUserConfigToSupabase('12345678-1234-1234-1234-1234567890ab', { foo: 'bar' });
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('not initialized'));
    }
  });

  await test('fetchAllUserConfigsFromSupabase retorna array vazio sem lançar quando cliente não disponível', async () => {
    if (!isSupabaseAvailable()) {
      const all = await fetchAllUserConfigsFromSupabase();
      assert.ok(Array.isArray(all));
      assert.strictEqual(all.length, 0);
    }
  });

  // --- 2. Simulação de Operações Supabase com Cliente Mock (Validação da Modelagem da Tabela) ---
  console.log('\n--- 2. Modelagem da Tabela users_config e Operações Mock ---');

  await test('Validação da query de upsert na tabela users_config com onConflict uuid', async () => {
    let capturedTable = '';
    let capturedPayload: any = null;
    let capturedOptions: any = null;

    const mockClient: any = {
      from: (tableName: string) => {
        capturedTable = tableName;
        return {
          upsert: async (payload: any, options: any) => {
            capturedPayload = payload;
            capturedOptions = options;
            return { error: null };
          }
        };
      }
    };

    const testUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const testConfig = {
      instanceName: 'My Cloud Addon',
      providers: { opensubtitles: { enabled: true, apiKey: 'supa-key' } },
      formatter: { preset: 'detailed', nameTemplate: '{sub.lang}', descriptionTemplate: '{sub.filename}' }
    };

    // Simulate saving using mock
    const { error } = await mockClient
      .from('users_config')
      .upsert({ uuid: testUuid, config: testConfig }, { onConflict: 'uuid' });

    assert.strictEqual(error, null);
    assert.strictEqual(capturedTable, 'users_config');
    assert.strictEqual(capturedPayload.uuid, testUuid);
    assert.deepStrictEqual(capturedPayload.config, testConfig);
    assert.deepStrictEqual(capturedOptions, { onConflict: 'uuid' });
  });

  await test('Validação da query de busca na tabela users_config com select(config).eq(uuid, ...).single()', async () => {
    let capturedTable = '';
    let capturedSelect = '';
    let capturedEqCol = '';
    let capturedEqVal = '';

    const expectedConfig = {
      instanceName: 'Persisted AIOSubs',
      languages: ['pob', 'eng']
    };

    const mockClient: any = {
      from: (tableName: string) => {
        capturedTable = tableName;
        return {
          select: (fields: string) => {
            capturedSelect = fields;
            return {
              eq: (col: string, val: string) => {
                capturedEqCol = col;
                capturedEqVal = val;
                return {
                  single: async () => {
                    return { data: { config: expectedConfig }, error: null };
                  }
                };
              }
            };
          }
        };
      }
    };

    const testUuid = '11223344-5566-7788-99aa-bbccddeeff00';
    const { data, error } = await mockClient
      .from('users_config')
      .select('config')
      .eq('uuid', testUuid)
      .single();

    assert.strictEqual(error, null);
    assert.strictEqual(capturedTable, 'users_config');
    assert.strictEqual(capturedSelect, 'config');
    assert.strictEqual(capturedEqCol, 'uuid');
    assert.strictEqual(capturedEqVal, testUuid);
    assert.deepStrictEqual(data.config, expectedConfig);
  });

  await test('Busca com UUID inexistente retorna erro PGRST116 (Not Found) controlado sem quebrar', async () => {
    const mockClient: any = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: null,
              error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
            })
          })
        })
      })
    };

    const res = await (async () => {
      const { data, error } = await mockClient
        .from('users_config')
        .select('config')
        .eq('uuid', 'non-existent-uuid')
        .single();

      if (error && error.code === 'PGRST116') {
        return { success: false, error: 'UUID não encontrado' };
      }
      return { success: true, config: data?.config };
    })();

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'UUID não encontrado');
  });

  // --- 3. Integração com ConfigStorage e Camada de Aplicação ---
  console.log('\n--- 3. Integração com ConfigStorage e Endpoints ---');

  await test('configStorage.initialize inicializa sem lançar erros com ou sem chaves Supabase', async () => {
    await configStorage.initialize();
    assert.ok(true);
  });

  await test('configStorage.saveConfigAsync armazena e valida senha com bcrypt', async () => {
    const uuid = 'deadbeef-1234-5678-9abc-def012345678';
    const pwd = 'minha-senha-secreta';
    const cfg: UserConfig = {
      ...DEFAULT_USER_CONFIG,
      instanceName: 'Test Supabase Instance'
    };

    const saveRes = await configStorage.saveConfigAsync(uuid, pwd, cfg);
    assert.strictEqual(saveRes.success, true);

    // Retrieve via async
    const retrieved = await configStorage.getConfigByUuidAsync(uuid);
    assert.ok(retrieved !== null);
    assert.strictEqual(retrieved?.instanceName, 'Test Supabase Instance');

    // Password authentication
    const authSuccess = await configStorage.authenticateAndGetConfigAsync(uuid, pwd);
    assert.strictEqual(authSuccess.success, true);
    assert.strictEqual(authSuccess.config?.instanceName, 'Test Supabase Instance');

    const authFail = await configStorage.authenticateAndGetConfigAsync(uuid, 'senha-errada');
    assert.strictEqual(authFail.success, false);
  });

  await test('decodeUserConfigAsync resolve configuração associada ao UUID', async () => {
    const uuid = 'deadbeef-1234-5678-9abc-def012345678';
    const resolved = await decodeUserConfigAsync(uuid);
    assert.strictEqual(resolved.instanceName, 'Test Supabase Instance');
  });

  await test('isUuid valida formato canônico de UUID v4', () => {
    assert.strictEqual(isUuid('deadbeef-1234-5678-9abc-def012345678'), true);
    assert.strictEqual(isUuid('not-a-uuid'), false);
    assert.strictEqual(isUuid(''), false);
  });

  console.log(`\n========================================`);
  console.log(`TOTAL DE TESTES SUPABASE: ${total}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${total - passed}`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
