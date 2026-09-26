const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:7000';

async function testAll() {
  console.log('🔍 Executando Bateria de Testes de Validação UI / Fluxos / Autenticação...');
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

  // 1. Test HTML routes
  console.log('\n--- 1. Teste de Rotas SPA (/ , /configure , /dashboard) ---');
  try {
    const resRoot = await axios.get(`${BASE_URL}/`);
    assert(resRoot.status === 200, 'GET / retorna status 200');
    assert(resRoot.data.includes('id="view-landing"'), 'GET / contém id="view-landing"');

    const resConfig = await axios.get(`${BASE_URL}/configure`);
    assert(resConfig.status === 200, 'GET /configure retorna status 200');

    const resDashboard = await axios.get(`${BASE_URL}/dashboard`);
    assert(resDashboard.status === 200, 'GET /dashboard retorna status 200');

    // Test asset serving
    const resLogo = await axios.get(`${BASE_URL}/assets/AIOsubs_logo_wordmark.png`);
    assert(resLogo.status === 200 && resLogo.headers['content-type']?.includes('image/png'), 'GET /assets/AIOsubs_logo_wordmark.png retorna 200 (sem erro 404)');
  } catch (err) {
    assert(false, `Falha ao testar rotas SPA / Assets: ${err.message}`);
  }

  // 2. Test Landing Page Elements in HTML
  console.log('\n--- 2. Verificação de Elementos da Tela Inicial (Landing Page) ---');
  const htmlPath = path.join(__dirname, '..', 'dist', 'web', 'public', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert(html.includes('id="landing-title">AIOSubs<'), 'Título da Landing Page é "AIOSubs"');
  assert(!html.includes('Gravity'), 'Nenhuma menção a "Gravity" presente no HTML');
  assert(html.includes('/assets/AIOsubs_logo_wordmark.png'), 'Logo oficial AIOsubs_logo_wordmark.png referenciado no HTML');
  assert(html.includes('id="home-logo-img"') && html.includes('alt="AIOSubs Logo"'), 'Área 1: Logo oficial no Addon Logo da Home com fallback');
  assert(html.includes('id="sidebar-brand-img"'), 'Área 2: Logo oficial no container de marca da sidebar');
  assert(html.includes('id="btn-landing-configure"'), 'Botão [ Configure ] presente na Landing Page');
  assert(html.includes('id="btn-landing-dashboard"'), 'Botão [ Dashboard ] presente na Landing Page');
  assert(!html.includes('>Documentation<'), 'Botão "Documentation" completamente ausente');
  assert(!html.includes('btn-home-donate'), 'Botão "Donate" completamente ausente');
  assert(!html.includes('btn-home-header-save'), 'Botão "Save" retangular/pílula completamente removido da Home');
  assert(!html.includes('btn-circle-nav'), 'Botões circulares flutuantes/cabeçalho completamente removidos');
  assert(!html.includes('id="btn-topbar-save"'), 'Botão Save circular de topo completamente removido');
  assert(!html.includes('id="unsaved-changes-banner"'), 'Barra "Unsaved changes / Restore" completamente removida do HTML');

  // 3. Test Dashboard Login Modal
  console.log('\n--- 3. Verificação do Modal de Login (Dashboard) ---');
  assert(html.includes('id="modal-dashboard-login"'), 'Modal de login #modal-dashboard-login presente');
  assert(html.includes('id="dashboard-input-uuid"'), 'Campo UUID presente no modal de login');
  assert(html.includes('id="dashboard-input-password"'), 'Campo Password presente no modal de login');
  assert(html.includes('id="btn-toggle-dashboard-eye"'), 'Toggle de mostrar/ocultar senha presente no modal');
  assert(html.includes('id="btn-submit-dashboard-login"'), 'Botão "Sign In" presente no modal');

  // 4. Test Create Configuration (Estado A) vs Save Configuration (Estado B)
  console.log('\n--- 4. Verificação dos Blocos Create Configuration e Save Configuration ---');
  assert(html.includes('id="card-create-configuration"'), 'Bloco #card-create-configuration (Estado A) presente');
  assert(html.includes('id="create-input-password"'), 'Campo Password no bloco Create Configuration');
  assert(html.includes('id="create-input-confirm-password"'), 'Campo Confirm Password no bloco Create Configuration');
  assert(html.includes('id="check-create-remember-me"'), 'Checkbox Remember Me presente no bloco Create Configuration');
  assert(html.includes('id="btn-create-config"'), 'Botão Create presente no bloco Create Configuration');
  assert(html.includes('id="card-save-configuration"'), 'Bloco #card-save-configuration (Estado B) presente');
  assert(html.includes('id="display-user-uuid"'), 'Exibição de UUID no bloco Save Configuration');
  assert(html.includes('id="btn-copy-uuid"'), 'Botão de cópia de UUID presente');

  // 5. Test Sign Out Confirmation Modal
  console.log('\n--- 5. Verificação do Modal de Sign Out ---');
  assert(html.includes('id="modal-signout-confirm"'), 'Modal de confirmação #modal-signout-confirm presente');
  assert(html.includes('Are you sure you want to sign out?'), 'Texto "Are you sure you want to sign out?" presente');
  assert(html.includes('id="check-signout-all-devices"'), 'Checkbox "Sign out on all devices" presente');
  assert(html.includes('id="btn-confirm-signout"'), 'Botão [ Confirm ] presente no modal');
  assert(html.includes('id="btn-cancel-signout"'), 'Botão [ Cancel ] presente no modal');
  assert(html.includes('id="btn-home-signout"'), 'Botão Sign Out presente no sidebar footer');

  // 6. Test CSS Animations & Transitions
  console.log('\n--- 6. Verificação de Animações e Transições no CSS ---');
  const cssPath = path.join(__dirname, '..', 'dist', 'web', 'public', 'style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert(css.includes('@keyframes pageSlideUpIn') && css.includes('translateY(12px)'), 'Animação de subida vertical de abas (translateY 12px -> 0) implementada');
  assert(css.includes('220ms cubic-bezier(0.16, 1, 0.3, 1)'), 'Duração de 220ms e curva cubic-bezier(0.16, 1, 0.3, 1) implementada');
  assert(css.includes('scale(0.97)'), 'Escala inicial de modais scale(0.97) implementada');
  assert(css.includes('@keyframes filterPaneEnter') && css.includes('translateY(12px)'), 'Transição vertical suave de abas de filtros implementada');
  assert(css.includes('@keyframes tagEnter') && css.includes('@keyframes tagExit'), 'Animações de entrada e saída na Whitelist implementadas');
  assert(css.includes('.modal-backdrop.closing') && css.includes('120ms'), 'Duração de saída de 120ms para modais implementada');
  assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'Suporte a prefers-reduced-motion implementado');

  // 7. Test Backend Authentication & Creation Workflow
  console.log('\n--- 7. Teste de Fluxo de Criação e Login no Backend ---');
  const testUuid = 'b1b2b3b4-1111-4222-8333-123456789abc';
  const testPass = 'minhasenhaforte123';

  // Save new config
  const saveRes = await axios.post(`${BASE_URL}/api/config/save`, {
    uuid: testUuid,
    password: testPass,
    config: {
      instanceName: 'AIOSubs',
      providers: { opensubtitles: { enabled: false, apiKey: '' } },
      languages: ['pob', 'eng']
    }
  });
  assert(saveRes.status === 200 && saveRes.data.success, 'Criação/salvamento com UUID e senha bem-sucedido');

  // Load config with correct password
  const loadRes = await axios.post(`${BASE_URL}/api/config/load`, {
    uuid: testUuid,
    password: testPass
  });
  assert(loadRes.status === 200 && loadRes.data.success && loadRes.data.uuid === testUuid, 'Autenticação de Dashboard com UUID e senha corretos funcionou com sucesso');

  // Load config with wrong password
  try {
    await axios.post(`${BASE_URL}/api/config/load`, {
      uuid: testUuid,
      password: 'senha-errada'
    });
    assert(false, 'Deveria falhar com senha incorreta');
  } catch (err) {
    assert(err.response && err.response.status === 401, 'Falha segura (401) com senha incorreta');
  }

  // Check manifest generated for that UUID
  const manifestRes = await axios.get(`${BASE_URL}/${testUuid}/manifest.json`);
  assert(manifestRes.status === 200 && manifestRes.data.id, 'Manifest recuperado com sucesso para o UUID criado');

  console.log(`\n========================================`);
  console.log(`TOTAL DE TESTES: ${passed + failed}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testAll().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
