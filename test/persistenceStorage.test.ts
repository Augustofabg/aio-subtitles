import axios from 'axios';
import { configStorage, isUuid } from '../src/storage/configStore';
import { DEFAULT_USER_CONFIG } from '../src/config/userConfig';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:7000';

async function runPersistenceTests() {
  console.log('🧪 Iniciando Testes de Persistência e Endpoints do AIOSubs...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FALHA: ${message}`);
      failed++;
    }
  }

  // 1. Test POST /create endpoint
  console.log('--- 1. Teste de Endpoints Alternativos (/create, /save, /login) ---');
  const testUuid1 = 'a0000000-0000-4000-8000-000000000001';
  const testPassword1 = 'SecurePass@2026!';

  try {
    const createRes = await axios.post(`${BASE_URL}/create`, {
      uuid: testUuid1,
      password: testPassword1,
      config: {
        ...DEFAULT_USER_CONFIG,
        instanceName: 'Render Persistent Test 1'
      }
    });
    assert(createRes.status === 200 && createRes.data.success, 'POST /create responde com status 200 e success: true');
    assert(createRes.data.manifestUrl && createRes.data.manifestUrl.includes(testUuid1), 'POST /create retorna manifestUrl com UUID');
  } catch (err: any) {
    assert(false, `POST /create falhou: ${err.message}`);
  }

  // 2. Test POST /login endpoint
  try {
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      uuid: testUuid1,
      password: testPassword1
    });
    assert(loginRes.status === 200 && loginRes.data.success, 'POST /login autentica com sucesso');
    assert(loginRes.data.config.instanceName === 'Render Persistent Test 1', 'POST /login recupera as preferências salvas');
  } catch (err: any) {
    assert(false, `POST /login falhou: ${err.message}`);
  }

  // 3. Test POST /login with wrong password
  try {
    await axios.post(`${BASE_URL}/login`, {
      uuid: testUuid1,
      password: 'wrong-password'
    });
    assert(false, 'POST /login deveria rejeitar senha incorreta');
  } catch (err: any) {
    assert(err.response?.status === 401, 'POST /login retorna 401 para senha incorreta');
  }

  // 4. Test POST /save endpoint (update existing UUID)
  try {
    const updateRes = await axios.post(`${BASE_URL}/save`, {
      uuid: testUuid1,
      password: testPassword1,
      config: {
        ...DEFAULT_USER_CONFIG,
        instanceName: 'Render Persistent Updated'
      }
    });
    assert(updateRes.status === 200 && updateRes.data.success, 'POST /save atualiza registro existente com sucesso');

    // Verify updated config via manifest
    const manifestRes = await axios.get(`${BASE_URL}/${testUuid1}/manifest.json`);
    assert(manifestRes.status === 200 && manifestRes.data.name === 'Render Persistent Updated', 'Manifest reflete alteração da configuração salva');
  } catch (err: any) {
    assert(false, `POST /save falhou: ${err.message}`);
  }

  // 5. Test POST /api/config/create alias
  const testUuid2 = 'a0000000-0000-4000-8000-000000000002';
  try {
    const aliasRes = await axios.post(`${BASE_URL}/api/config/create`, {
      uuid: testUuid2,
      password: 'password123',
      config: {
        ...DEFAULT_USER_CONFIG,
        instanceName: 'Alias Create Instance'
      }
    });
    assert(aliasRes.status === 200 && aliasRes.data.success, 'POST /api/config/create (alias) responde com sucesso');
  } catch (err: any) {
    assert(false, `POST /api/config/create falhou: ${err.message}`);
  }

  // 5b. Test POST /api/save alias
  try {
    const apiSaveRes = await axios.post(`${BASE_URL}/api/save`, {
      uuid: testUuid2,
      password: 'password123',
      config: {
        ...DEFAULT_USER_CONFIG,
        instanceName: 'Updated via /api/save'
      }
    });
    assert(apiSaveRes.status === 200 && apiSaveRes.data.success, 'POST /api/save responde com status 200 e success: true');
  } catch (err: any) {
    assert(false, `POST /api/save falhou: ${err.message}`);
  }

  // 5c. Test PUT /api/config/:uuid
  try {
    const putRes = await axios.put(`${BASE_URL}/api/config/${testUuid2}`, {
      password: 'password123',
      config: {
        ...DEFAULT_USER_CONFIG,
        instanceName: 'Updated via PUT /api/config/:uuid'
      }
    });
    assert(putRes.status === 200 && putRes.data.success, 'PUT /api/config/:uuid atualiza configuração com sucesso');

    const manifestPut = await axios.get(`${BASE_URL}/${testUuid2}/manifest.json`);
    assert(manifestPut.data.name === 'Updated via PUT /api/config/:uuid', 'Manifest reflete alteração realizada via PUT');
  } catch (err: any) {
    assert(false, `PUT /api/config/:uuid falhou: ${err.message}`);
  }

  // 6. Test Password Security (Plain text never stored)
  console.log('\n--- 2. Segurança de Senhas (bcrypt) ---');
  const storeFilePath = path.join(__dirname, '..', 'data', 'configurations.json');
  if (fs.existsSync(storeFilePath)) {
    const raw = fs.readFileSync(storeFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    const rec1 = parsed[testUuid1.toLowerCase()];
    assert(Boolean(rec1), 'Registro gravado no arquivo de configuração');
    assert(!raw.includes(testPassword1), 'Senha em texto puro NUNCA aparece no armazenamento');
    assert(rec1?.passwordHash && rec1.passwordHash.startsWith('$2'), 'Hash de senha usa padrão seguro bcrypt ($2a$ ou $2b$)');
  } else {
    console.log('  ℹ️ Arquivo local não utilizado (modo DB ativo)');
  }

  // 7. Test UUID Format Validation
  console.log('\n--- 3. Validação de Formato UUID ---');
  assert(isUuid('51c97db4-03b7-4ec2-875d-e3a755c564b9'), 'UUID válido aceito por isUuid');
  assert(!isUuid('invalid-uuid-string'), 'String comum rejeitada por isUuid');
  assert(!isUuid(''), 'String vazia rejeitada por isUuid');

  console.log(`\n========================================`);
  console.log(`TOTAL DE TESTES DE PERSISTÊNCIA: ${passed + failed}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPersistenceTests().catch(err => {
  console.error('Erro fatal nos testes de persistência:', err);
  process.exit(1);
});
