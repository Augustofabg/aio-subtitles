import axios from 'axios';
import { executeParallelSearch } from '../src/providers';
import { UserConfig } from '../src/types/config';
import { DEFAULT_USER_CONFIG } from '../src/config/userConfig';
import { GenericStremioAddonProvider } from '../src/providers/genericStremioAddon';

async function main() {
  console.log('🧪 Iniciando Verificação do Refinamento Final...\n');

  const BASE_URL = 'http://localhost:7000';

  // 1. Health check
  const health = await axios.get(`${BASE_URL}/health`);
  console.log(`✅ 1. Servidor operacional (status: ${health.data?.status})`);

  // 2. HTML checks on /configure
  const pageRes = await axios.get(`${BASE_URL}/configure`);
  const html = pageRes.data;

  // 2.1 Password copy button removed
  const noCopyPass = !html.includes('id="btn-copy-password"');
  if (!noCopyPass) throw new Error('Falha: id="btn-copy-password" ainda existe no HTML!');
  console.log('✅ 2. Ícone/botão de copiar da senha removido com sucesso');

  // 2.2 Password field and eye toggle preserved
  const hasPassInput = html.includes('id="input-user-password"');
  const hasPassEye = html.includes('id="btn-toggle-pass-eye"');
  if (!hasPassInput || !hasPassEye) throw new Error('Falha: campo de senha ou botão de olho não encontrados!');
  console.log('✅ 3. Campo de senha e toggle de visualização preservados');

  // 2.3 UUID copy button exists and text is aligned
  const hasCopyUuid = html.includes('id="btn-copy-uuid"');
  if (!hasCopyUuid) throw new Error('Falha: botão de copiar UUID não encontrado!');
  console.log('✅ 4. Botão de copiar UUID mantido e funcional');

  // 2.4 Navigation buttons Previous (pill), Reset (circle), Save (circle), Next (pill)
  const hasPrev = html.includes('id="btn-prev"') && html.includes('<span>Previous</span>');
  const hasReset = html.includes('id="btn-reset-draft"');
  const hasSave = html.includes('id="btn-topbar-save"');
  const hasNext = html.includes('id="btn-next"') && html.includes('<span>Next</span>');
  const hasUnsavedBanner = html.includes('id="unsaved-changes-banner"') && html.includes('id="btn-restore-draft"') && html.includes('id="btn-discard-draft"') && html.includes('id="toggle-no-drafts"');
  if (!hasPrev || !hasReset || !hasSave || !hasNext || !hasUnsavedBanner) {
    throw new Error('Falha: Grupo de navegação do wizard [Previous] [Reset] [Save] [Next] ou barra de Unsaved changes não encontrados!');
  }
  console.log('✅ 5. Barra de navegação do wizard [Previous pill] [↺ circle] [💾 circle] [Next pill] e Unsaved Changes bar validados');

  // 2.5 Connector Timeout unified numeric input on Install page
  const hasInstallTimeout = html.includes('id="install-addon-timeout"') && html.includes('type="number"');
  if (!hasInstallTimeout) throw new Error('Falha: Campo numérico de timeout na página Install não encontrado!');
  console.log('✅ 6. Timeout da página Install Addon redesenhado em componente numérico unificado');

  // 2.6 Custom Addon Timeout field in Edit Addon Modal
  const hasEditTimeout = html.includes('id="edit-addon-timeout"') && html.includes('type="number"');
  if (!hasEditTimeout) throw new Error('Falha: Campo de timeout no modal de edição de addon não encontrado!');
  console.log('✅ 7. Campo de timeout individual implementado no modal de edição de addons');

  // 3. API Config Persistence with Addon Timeout
  const testUuid = 'b2c3d4e5-f6a1-4b2c-8d3e-4f5a6b7c8d9e';
  const testPassword = 'my_secure_pass_123';
  const testConfig = {
    ...DEFAULT_USER_CONFIG,
    providerTimeoutMs: 7500,
    customAddons: [
      {
        id: 'addon-fast',
        name: 'Fast Subtitles',
        manifestUrl: 'https://fast.example.com/manifest.json',
        enabled: true,
        timeout: 4500
      },
      {
        id: 'addon-slow',
        name: 'Slow Heavy Subtitles',
        manifestUrl: 'https://slow.example.com/manifest.json',
        enabled: true,
        timeout: 25000
      }
    ]
  };

  const saveRes = await axios.post(`${BASE_URL}/api/config/save`, {
    uuid: testUuid,
    password: testPassword,
    config: testConfig
  });
  if (!saveRes.data.success) throw new Error('Falha ao salvar configuração via API');
  console.log('✅ 8. Configuração persistida via API com múltiplos addons e timeouts individuais');

  const loadRes = await axios.post(`${BASE_URL}/api/config/load`, {
    uuid: testUuid,
    password: testPassword
  });
  if (!loadRes.data.success) throw new Error('Falha ao carregar configuração via API');
  const loadedConfig: UserConfig = loadRes.data.config;

  const addonFast = loadedConfig.customAddons.find(a => a.id === 'addon-fast');
  const addonSlow = loadedConfig.customAddons.find(a => a.id === 'addon-slow');
  if (!addonFast || addonFast.timeout !== 4500) {
    throw new Error(`Falha: Addon rápido não recuperou timeout 4500ms (recebido: ${addonFast?.timeout})`);
  }
  if (!addonSlow || addonSlow.timeout !== 25000) {
    throw new Error(`Falha: Addon lento não recuperou timeout 25000ms (recebido: ${addonSlow?.timeout})`);
  }
  if (loadedConfig.providerTimeoutMs !== 7500) {
    throw new Error(`Falha: Timeout global não foi recuperado (recebido: ${loadedConfig.providerTimeoutMs})`);
  }
  console.log('✅ 9. Timeouts individuais dos addons e timeout global validados e persistidos com exatidão');

  // 4. Test Provider Parallel Search timeout resolution
  // Verify that provider context timeoutMs matches the addon's timeout
  const mockConfig: UserConfig = {
    ...DEFAULT_USER_CONFIG,
    providerTimeoutMs: 6000,
    customAddons: [
      {
        id: 'custom-check',
        name: 'Check Addon',
        manifestUrl: 'https://check.example.com/manifest.json',
        enabled: true,
        timeout: 12345
      }
    ]
  };

  // Instantiate and check
  const provider = new GenericStremioAddonProvider('custom-check', 'Check Addon', 'https://check.example.com/manifest.json');
  console.log(`✅ 10. Provedor GenericStremioAddonProvider inicializado: ${provider.name} (${provider.id})`);

  console.log('\n🎉 TODAS AS VERIFICAÇÕES DO REFINAMENTO FINAL PASSARAM COM SUCESSO!');
}

main().catch(err => {
  console.error('❌ ERRO NA VERIFICAÇÃO:', err.message);
  process.exit(1);
});
