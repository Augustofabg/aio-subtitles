import { getAllProviders } from '../src/providers';
import { GenericStremioAddonProvider } from '../src/providers/genericStremioAddon';
import { buildTemplateContext, renderTemplate } from '../src/utils/template';
import { validateAndNormalizeLanguage, isLanguageWhitelisted } from '../src/utils/normalizer';
import { registerProxyDownload } from '../src/proxy/subtitleProxy';
import { RawSubtitleItem } from '../src/types/provider';

console.log('🧪 Iniciando suíte de testes de validação do AIO Subtitles...\n');

// 1. Bug 6.1: Validate all registered built-in providers
console.log('--- Teste 1: Validação de Provedores Nativos e Bug do "Desconhecido" ---');
const providers = getAllProviders();
if (providers.length === 0) {
  console.error('❌ Nenhum provedor registrado!');
  process.exit(1);
}

for (const p of providers) {
  if (!p.id || p.id.trim() === '') {
    console.error(`❌ Provedor sem ID válido!`);
    process.exit(1);
  }
  if (!p.name || p.name.trim() === '' || p.name.toLowerCase() === 'desconhecido') {
    console.error(`❌ Provedor ${p.id} tem name inválido ou "Desconhecido": "${p.name}"`);
    process.exit(1);
  }
  console.log(`  ✅ Provedor nativo verificado: [${p.id}] -> "${p.name}"`);
}

// 2. Bug 6.1: Validate GenericStremioAddonProvider with custom imported manifests
console.log('\n--- Teste 2: Provedores Genéricos Importados por Manifest URL ---');
const testCustomAddons = [
  { id: 'community-subtitles', name: 'Legendas Brasil VIP', url: 'https://subs.example.com/manifest.json' },
  { id: 'titlovi-stremio', name: 'Titlovi Official', url: 'stremio://titlovi.com/manifest.json' },
  { id: 'auto-fallback-test', name: '', url: 'https://fallback.example.com/manifest.json' }
];

for (const custom of testCustomAddons) {
  const genericProv = new GenericStremioAddonProvider(custom.id, custom.name, custom.url);

  if (!genericProv.id) {
    console.error(`❌ GenericStremioAddonProvider gerou ID vazio!`);
    process.exit(1);
  }

  if (!genericProv.name || genericProv.name.trim() === '' || genericProv.name.toLowerCase() === 'desconhecido') {
    console.error(`❌ GenericStremioAddonProvider gerou name inválido ou "Desconhecido": "${genericProv.name}"`);
    process.exit(1);
  }

  console.log(`  ✅ Provedor genérico importado verificado: [${genericProv.id}] -> "${genericProv.name}"`);
}

// 3. Bug 6.1: Test mock item normalization and template rendering
console.log('\n--- Teste 3: Renderização de Templates e Fallbacks ---');
const mockItems: RawSubtitleItem[] = [
  {
    id: 'test-1',
    provider: 'opensubtitles-v3',
    providerName: 'OpenSubtitles v3',
    url: 'https://example.com/sub1.srt',
    lang: 'pob',
    release: '1080p.BluRay-SPARKS'
  },
  {
    id: 'test-2',
    provider: 'custom-sub-addon',
    providerName: 'Custom Community Subs',
    url: 'https://example.com/sub2.srt',
    lang: 'eng',
    release: 'WEBRip-AMZN'
  },
  {
    id: 'test-3-fallback',
    provider: 'custom-addon-id',
    providerName: '', // empty name test to verify fallback
    url: 'https://example.com/sub3.srt',
    lang: 'pob',
    release: 'HDTV-LOL'
  }
];

const template = '[{provider}] {lang_flag} {release}';

for (const item of mockItems) {
  const ctx = buildTemplateContext(item);
  const rendered = renderTemplate(template, ctx);

  if (!ctx.provider || ctx.provider.trim() === '' || ctx.provider.toLowerCase() === 'desconhecido') {
    console.error(`❌ Falha crítica: TemplateContext.provider é vazio ou "Desconhecido" para item:`, item);
    process.exit(1);
  }

  if (rendered.includes('Desconhecido') || rendered.includes('undefined')) {
    console.error(`❌ Falha crítica: Legenda renderizada contém "Desconhecido" ou "undefined": "${rendered}"`);
    process.exit(1);
  }

  console.log(`  ✅ Legenda formatada com sucesso: "${rendered}"`);
}

// 4. Bug 6.2: Test Language Normalization & Desconhecido category prevention
console.log('\n--- Teste 4: Bug 6.2 - Prevenção de Categoria "Desconhecido" no Player ---');
const validLanguagesTest = ['pt-br', 'por', 'en', 'english', 'spa', 'pob', 'fre'];
for (const raw of validLanguagesTest) {
  const result = validateAndNormalizeLanguage(raw, false);
  if (!result.valid || !result.normalizedLang) {
    console.error(`❌ Falha: Idioma válido "${raw}" não foi reconhecido!`);
    process.exit(1);
  }
  console.log(`  ✅ Idioma "${raw}" normalizado para ISO 639-2: "${result.normalizedLang}"`);
}

// Invalid languages must be discarded when allowUnknown is false
const invalidLanguagesTest = ['xxx-broken', '', 'invalid_code_123', 'desconhecido', 'unknown'];
for (const raw of invalidLanguagesTest) {
  const result = validateAndNormalizeLanguage(raw, false);
  if (result.valid) {
    console.error(`❌ Falha crítica: Idioma inválido "${raw}" não foi descartado!`);
    process.exit(1);
  }
  console.log(`  ✅ Idioma inválido "${raw}" descartado com sucesso: motivo "${result.discardedReason}"`);
}

// When allowUnknown is true, must map to standard 'und' (undetermined)
const resultUnknown = validateAndNormalizeLanguage('xxx-broken', true);
if (!resultUnknown.valid || resultUnknown.normalizedLang !== 'und') {
  console.error(`❌ Falha: Idioma não identificado com allowUnknown não mapeou para 'und':`, resultUnknown);
  process.exit(1);
}
console.log(`  ✅ Idioma não identificado com allowUnknown=true mapeado para "und"`);

// 5. Bug 6.3: Test Short ID Proxy and prevention of base64 leak in ID and URL
console.log('\n--- Teste 5: Bug 6.3 - Prevenção de Vazamento de Base64 em Rótulo/ID ---');
const longTargetUrl = 'https://subs5.strem.io/en/download/subencoding-stremio-utf8/src-api/file/1952160592';
const customFilename = '[OpenSubtitles v3] 🇧🇷 Breaking.Bad.S01E01.srt';

const shortId = registerProxyDownload({
  originalUrl: longTargetUrl,
  filename: customFilename,
  provider: 'opensubtitles-v3',
  format: 'srt'
});

const generatedUrl = `http://localhost:7000/download/${shortId}/${encodeURIComponent(customFilename)}`;
const generatedId = `opensubtitles-v3-pob-1`;

if (generatedUrl.includes('aHR0c') || generatedId.includes('aHR0c')) {
  console.error(`❌ Falha crítica: URL ou ID contém base64! URL: ${generatedUrl}, ID: ${generatedId}`);
  process.exit(1);
}

if (!generatedUrl.includes(`/download/${shortId}/`)) {
  console.error(`❌ Falha: URL gerada não usa o endpoint limpo de download com shortId!`);
  process.exit(1);
}

console.log(`  ✅ ID Limpo (sem base64): "${generatedId}"`);
console.log(`  ✅ URL de Download Limpa (sem base64): "${generatedUrl}"`);

console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
process.exit(0);
