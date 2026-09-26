const axios = require('axios');

const BASE_URL = 'http://localhost:7000';

async function testSessionAndPersistence() {
  console.log('🧪 Iniciando Teste de Validação de Persistência e Imutabilidade do UUID...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FALHA: ${message}`);
      failed++;
    }
  }

  const sessionUuid = 'b2c3d4e5-6789-4abc-def0-1234567890ab';
  const sessionPassword = 'MySecretSessionPass!@1';

  // 1. Initial creation
  console.log('--- 1. Criação inicial com UUID específico ---');
  try {
    const res = await axios.post(`${BASE_URL}/api/config/save`, {
      uuid: sessionUuid,
      password: sessionPassword,
      config: {
        instanceName: 'AIOSubs Initial Session',
        instanceDesc: 'Initial Session Description',
        providers: {
          opensubtitles: { enabled: true, apiKey: 'test-key-1' }
        },
        languages: ['eng', 'por']
      }
    });
    assert(res.status === 200 && res.data.success, 'Criação inicial respondeu 200 com success: true');
    assert(res.data.uuid === sessionUuid, 'UUID retornado é idêntico ao solicitado');
    assert(res.data.manifestUrl && res.data.manifestUrl.includes(sessionUuid), 'manifestUrl contém o UUID imutável');
  } catch (err) {
    assert(false, `Falha na criação inicial: ${err.message}`);
  }

  // 2. Query saved configuration
  console.log('\n--- 2. Carregamento e Verificação de Dados Salvos ---');
  try {
    const loadRes = await axios.post(`${BASE_URL}/api/config/load`, {
      uuid: sessionUuid,
      password: sessionPassword
    });
    assert(loadRes.status === 200 && loadRes.data.success, 'POST /api/config/load respondeu 200 com sucesso');
    assert(loadRes.data.config.instanceName === 'AIOSubs Initial Session', 'instanceName recuperado intacto');
    assert(loadRes.data.config.languages.includes('por'), 'Idiomas configurados recuperados intactos');
  } catch (err) {
    assert(false, `Falha ao carregar configuração: ${err.message}`);
  }

  // 3. Update configuration via POST /api/save without changing UUID
  console.log('\n--- 3. Atualização via POST /api/save (Garantia de Imutabilidade) ---');
  try {
    const updateRes = await axios.post(`${BASE_URL}/api/save`, {
      uuid: sessionUuid,
      password: sessionPassword,
      config: {
        instanceName: 'AIOSubs Updated Session Preserved',
        instanceDesc: 'Updated Description',
        providers: {
          opensubtitles: { enabled: true, apiKey: 'test-key-1' },
          subdl: { enabled: true, apiKey: 'subdl-key-2' }
        },
        languages: ['eng', 'por', 'spa']
      }
    });
    assert(updateRes.status === 200 && updateRes.data.success, 'POST /api/save atualizou com status 200');
    assert(updateRes.data.uuid === sessionUuid, 'UUID permanece estritamente o mesmo após salvar');

    // Verify manifest
    const manifest = await axios.get(`${BASE_URL}/${sessionUuid}/manifest.json`);
    assert(manifest.data.name === 'AIOSubs Updated Session Preserved', 'Manifest público reflete o novo nome salvo');
  } catch (err) {
    assert(false, `Falha na atualização via /api/save: ${err.message}`);
  }

  // 4. Update via PUT /api/config/:uuid
  console.log('\n--- 4. Atualização via PUT /api/config/:uuid ---');
  try {
    const putRes = await axios.put(`${BASE_URL}/api/config/${sessionUuid}`, {
      password: sessionPassword,
      config: {
        instanceName: 'AIOSubs Updated via PUT',
        instanceDesc: 'Updated Description PUT',
        providers: {},
        languages: ['eng']
      }
    });
    assert(putRes.status === 200 && putRes.data.success, 'PUT /api/config/:uuid atualizou com status 200');

    const manifest2 = await axios.get(`${BASE_URL}/${sessionUuid}/manifest.json`);
    assert(manifest2.data.name === 'AIOSubs Updated via PUT', 'Manifest público reflete alteração via PUT');
  } catch (err) {
    assert(false, `Falha no PUT /api/config/:uuid: ${err.message}`);
  }

  // 5. Test rejection of wrong password
  console.log('\n--- 5. Teste de Rejeição de Senha Incorreta ---');
  try {
    await axios.post(`${BASE_URL}/api/config/save`, {
      uuid: sessionUuid,
      password: 'WrongPassword!',
      config: { instanceName: 'Hacked' }
    });
    assert(false, 'Deveria ter rejeitado senha incorreta');
  } catch (err) {
    assert(err.response?.status === 401, 'Retornou HTTP 401 ao tentar salvar com senha incorreta');
  }

  // 6. Test rejection of invalid UUID
  console.log('\n--- 6. Teste de Validação de UUID ---');
  try {
    await axios.post(`${BASE_URL}/api/config/save`, {
      uuid: 'not-a-valid-uuid',
      password: sessionPassword,
      config: {}
    });
    assert(false, 'Deveria ter rejeitado UUID inválido');
  } catch (err) {
    assert(err.response?.status === 400, 'Retornou HTTP 400 para UUID com formato inválido');
  }

  console.log(`\n========================================`);
  console.log(`TOTAL DE TESTES DE SESSÃO & PERSISTÊNCIA: ${passed + failed}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testSessionAndPersistence().catch(err => {
  console.error('Erro nos testes:', err);
  process.exit(1);
});
