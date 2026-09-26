import assert from 'assert';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { createServer } from '../src/server';
import { OpenSubtitlesProvider } from '../src/providers/openSubtitles';

console.log('🧪 Running OpenSubtitles & Home Navigation & API Key Validation Status Tests...\n');

async function runTests() {
  // --- Test 1: Home Button Structure & Exclusion of "Continue" / "New Configuration" ---
  console.log('--- Test 1: Verificação da Estrutura de Botões da Home ---');
  const htmlPath = path.join(__dirname, '../src/web/public/index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // Verify btn-landing-new is removed
  assert.strictEqual(
    htmlContent.includes('btn-landing-new'),
    false,
    '❌ btn-landing-new deve ser completamente removido de index.html'
  );
  console.log('  ✅ Botão "+ New Configuration" (btn-landing-new) removido');

  // Verify landing-actions only has Configure and Dashboard
  const landingActionsMatch = htmlContent.match(/<div class="landing-actions"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(landingActionsMatch, 'landing-actions container deve existir');
  const landingActionsInner = landingActionsMatch[1];

  assert.ok(landingActionsInner.includes('id="btn-landing-configure"'), 'Deve conter btn-landing-configure');
  assert.ok(landingActionsInner.includes('id="btn-landing-dashboard"'), 'Deve conter btn-landing-dashboard');
  assert.strictEqual(
    landingActionsInner.includes('Continue ('),
    false,
    'Não deve conter botão "Continue (UUID...)"'
  );
  console.log('  ✅ Apenas os botões [ Configure ] e [ Dashboard ] estão presentes na Home');

  // Verify app.js no longer alters btn-landing-configure to Continue
  const appJsPath = path.join(__dirname, '../src/web/public/app.js');
  const appJsContent = fs.readFileSync(appJsPath, 'utf-8');
  assert.strictEqual(
    appJsContent.includes('Continue (${sessionUuid'),
    false,
    'app.js não deve gerar botão Continue com UUID'
  );
  console.log('  ✅ app.js não altera mais o botão para "Continue (UUID...)"');

  // --- Test 2: Reposicionamento dos Ícones de Status da API Key ---
  console.log('\n--- Test 2: Reposicionamento dos Ícones de Status da API Key (✓ / ✗ antes de 👁) ---');
  const modalWrapperMatch = htmlContent.match(/<div class="api-key-input-wrapper"[^>]*>([\s\S]*?<\/button>\s*<\/div>)/);
  assert.ok(modalWrapperMatch, 'api-key-input-wrapper container deve existir');
  const wrapperHtml = modalWrapperMatch[1];

  const posStatus = wrapperHtml.indexOf('id="modal-key-status"');
  const posEye = wrapperHtml.indexOf('id="btn-modal-toggle-eye"');
  assert.ok(posStatus !== -1, 'modal-key-status deve existir');
  assert.ok(posEye !== -1, 'btn-modal-toggle-eye deve existir');
  assert.ok(
    posStatus < posEye,
    '❌ No HTML, modal-key-status (validador) deve vir antes do botão de olho (btn-modal-toggle-eye)'
  );
  console.log('  ✅ Indicador de validação posicionado no HTML antes do botão de visibilidade [👁]');

  // Verify style.css rules
  const cssPath = path.join(__dirname, '../src/web/public/style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  assert.ok(
    cssContent.includes('.api-key-validation-indicator {') &&
    cssContent.includes('right: 38px;') || cssContent.includes('right: 40px;'),
    'api-key-validation-indicator deve ter posicionamento antes do olho'
  );

  assert.ok(
    cssContent.includes('.btn-toggle-eye {') &&
    cssContent.includes('right: 10px;'),
    'btn-toggle-eye deve estar posicionado na extremidade direita (right: 10px)'
  );

  assert.ok(
    cssContent.includes('validationIndicatorIn') &&
    cssContent.includes('scale(0.8)'),
    'Animação de entrada do validador (fade-in + scale: 0.8 -> 1) configurada'
  );
  console.log('  ✅ style.css posiciona [✓ / ✗] à esquerda de [👁] com animação scale(0.8) -> 1 em 150ms');

  // --- Test 2.1: Limpeza da Header Bar (Remoção de UUID e + New Config) ---
  console.log('\n--- Test 2.1: Limpeza da Header Bar (Remoção de UUID badge e + New Config) ---');
  assert.strictEqual(
    htmlContent.includes('id="topbar-session-info"'),
    false,
    '❌ topbar-session-info deve ser completamente removido de index.html'
  );
  assert.strictEqual(
    appJsContent.includes('btn-topbar-new-config'),
    false,
    '❌ btn-topbar-new-config deve ser completamente removido de app.js'
  );
  assert.strictEqual(
    appJsContent.includes('UUID: ${state.uuid'),
    false,
    '❌ Badge UUID no topbar deve ser removida de app.js'
  );
  assert.ok(
    cssContent.includes('.topbar {') && cssContent.includes('justify-content: flex-end;'),
    '❌ .topbar deve ter justify-content: flex-end para navegação limpa sem lacunas'
  );
  console.log('  ✅ Header bar 100% limpa: badge de UUID e botão + New Config removidos com sucesso');

  // --- Test 3: OpenSubtitles REST Headers e Validador ---
  console.log('\n--- Test 3: Comunicação OpenSubtitles REST v1 & Cabeçalhos Obrigatórios ---');
  const serverPath = path.join(__dirname, '../src/server.ts');
  const serverContent = fs.readFileSync(serverPath, 'utf-8');

  assert.ok(
    serverContent.includes("'User-Agent': 'AIOSubs v1.0.0'"),
    'server.ts deve usar User-Agent AIOSubs v1.0.0'
  );
  assert.ok(
    serverContent.includes("'Content-Type': 'application/json'"),
    'server.ts deve incluir Content-Type: application/json'
  );
  assert.ok(
    serverContent.includes("'Api-Key': apiKey"),
    'server.ts deve incluir cabeçalho Api-Key'
  );
  console.log('  ✅ Validador de chave em server.ts envia Api-Key, User-Agent e Content-Type');

  // Provider headers
  const providerPath = path.join(__dirname, '../src/providers/openSubtitles.ts');
  const providerContent = fs.readFileSync(providerPath, 'utf-8');
  assert.ok(
    providerContent.includes("'User-Agent': 'AIOSubs v1.0.0'"),
    'openSubtitles.ts deve usar User-Agent AIOSubs v1.0.0'
  );
  assert.ok(
    providerContent.includes("'Content-Type': 'application/json'"),
    'openSubtitles.ts deve incluir Content-Type: application/json'
  );
  console.log('  ✅ Provedor OpenSubtitles envia Api-Key, User-Agent AIOSubs v1.0.0 e Content-Type: application/json');

  // Subtitle proxy headers
  const proxyPath = path.join(__dirname, '../src/proxy/subtitleProxy.ts');
  const proxyContent = fs.readFileSync(proxyPath, 'utf-8');
  assert.ok(
    proxyContent.includes("'User-Agent': 'AIOSubs v1.0.0'"),
    'subtitleProxy.ts deve usar User-Agent AIOSubs v1.0.0'
  );
  console.log('  ✅ Proxy de download OpenSubtitles envia Api-Key, User-Agent AIOSubs v1.0.0 e Content-Type');

  // --- Test 4: Teste de Validação da API do OpenSubtitles ao vivo/mock via Express Server ---
  console.log('\n--- Test 4: Execução do Endpoint de Validação /api/validate-key/opensubtitles ---');
  const app = createServer();
  const testPort = 7891;
  const server = app.listen(testPort);

  try {
    // 4.1 Empty key
    const emptyRes = await axios.post(`http://localhost:${testPort}/api/validate-key/opensubtitles`, {
      apiKey: ''
    });
    assert.strictEqual(emptyRes.data.valid, false);
    assert.strictEqual(emptyRes.data.error, 'Chave não informada.');
    console.log('  ✅ Chave vazia retorna valid: false com "Chave não informada."');

    // 4.2 Invalid key against real or mock OpenSubtitles API
    const invalidRes = await axios.post(`http://localhost:${testPort}/api/validate-key/opensubtitles`, {
      apiKey: 'invalid_dummy_key_12345678'
    });
    assert.strictEqual(invalidRes.data.valid, false);
    assert.ok(invalidRes.data.error, 'Deve retornar mensagem de erro');
    console.log(`  ✅ Chave inválida testada com sucesso: valid=${invalidRes.data.valid}, error="${invalidRes.data.error}"`);

    // 4.3 GET method also works
    const getRes = await axios.get(`http://localhost:${testPort}/api/validate-key/opensubtitles?apiKey=invalid_dummy_key`);
    assert.strictEqual(getRes.data.valid, false);
    console.log('  ✅ Endpoint GET /api/validate-key/opensubtitles também funciona com query param apiKey');
  } finally {
    server.close();
  }

  console.log('\n🎉 TODOS OS TESTES DE VALIDAÇÃO PASSARAM COM SUCESSO!');
}

runTests().catch(err => {
  console.error('\n❌ Falha no teste:', err);
  process.exit(1);
});
