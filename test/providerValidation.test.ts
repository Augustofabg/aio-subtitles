import { getAllProviders } from '../src/providers';
import { GenericStremioAddonProvider } from '../src/providers/genericStremioAddon';
import { buildTemplateContext, renderTemplate } from '../src/utils/template';
import { validateAndNormalizeLanguage, isLanguageWhitelisted } from '../src/utils/normalizer';
import { registerProxyDownload } from '../src/proxy/subtitleProxy';
import { RawSubtitleItem } from '../src/types/provider';
import { getAggregatedSubtitles, assertCleanSubtitleItem } from '../src/core/aggregator';
import { DEFAULT_USER_CONFIG } from '../src/config/userConfig';
import { UserConfig } from '../src/types/config';
import { globalSubtitleCache } from '../src/utils/cache';

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

// 6. Bug 6.5: Test assertCleanSubtitleItem rejects URLs and >80 chars unspaced strings
console.log('\n--- Teste 6: Bug 6.5 - Validação/Assert contra Vazamento de URL no ID ou Rótulo ---');
// 6a. Clean values should pass
assertCleanSubtitleItem('subdl-pob-1', '[SubDL] 🇧🇷 1080p.BluRay');
console.log('  ✅ assertCleanSubtitleItem aceitou ID e rótulo limpos com sucesso');

// 6b. URL in ID must throw
try {
  assertCleanSubtitleItem('https://external.com/sub/123', '[SubDL] 🇧🇷 1080p');
  console.error('❌ Falha: assertCleanSubtitleItem não barrou URL no ID!');
  process.exit(1);
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.log(`  ✅ assertCleanSubtitleItem barrou com sucesso URL no ID: ${msg}`);
}

// 6c. URL in label must throw
try {
  assertCleanSubtitleItem('subdl-pob-1', 'https://external.com/sub.srt');
  console.error('❌ Falha: assertCleanSubtitleItem não barrou URL no rótulo!');
  process.exit(1);
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.log(`  ✅ assertCleanSubtitleItem barrou com sucesso URL no rótulo: ${msg}`);
}

// 6d. String > 80 chars without spaces must throw
try {
  const longHash = 'a'.repeat(85);
  assertCleanSubtitleItem(longHash, '[SubDL] 🇧🇷 1080p');
  console.error('❌ Falha: assertCleanSubtitleItem não barrou token > 80 caracteres sem espaços!');
  process.exit(1);
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.log(`  ✅ assertCleanSubtitleItem barrou com sucesso token > 80 caracteres sem espaços: ${msg}`);
}

// 7. Bug 6.5 Integration Test:
// Simula uma resposta de conector com lang: "pt-BR" e um id/url originais longos,
// e verifica que a resposta final tem:
// (a) lang normalizado para pob
// (b) id curto e sem substring de URL
// (c) rótulo/nome de arquivo igual ao gerado pelo template configurado, não ao original do conector
console.log('\n--- Teste 7: Bug 6.5 - Teste de Integração de Pipeline Completo ---');

async function runPipelineIntegrationTest(): Promise<void> {
  const mockRawExternalSubtitles: RawSubtitleItem[] = [
    {
      id: 'aHR0cHM6Ly9zdWJzNS5zdHJlbS5pby9lbi9kb3dubG9hZC9zdWJlbmNvZGluZy1zdHJlbWlvLXV0ZjgvZmlsZS8xOTUyMTYwNTky',
      provider: 'external-addon',
      providerName: 'External Subs Addon',
      url: 'https://subs5.strem.io/en/download/subencoding-stremio-utf8/src-api/file/1952160592?token=xyz123abc456&user=999',
      lang: 'pt-BR', // BCP-47 requiring normalization to pob
      release: 'Breaking.Bad.S01E01.720p.HDTV.x264'
    }
  ];

  const testQuery = {
    type: 'series',
    id: 'tt0903747:1:1',
    imdbId: 'tt0903747',
    season: 1,
    episode: 1
  };

  const testUserConfig: UserConfig = {
    ...DEFAULT_USER_CONFIG,
    languages: ['pob', 'eng'], // Whitelist pob
    namingTemplate: '[{provider}] {lang_flag} {release}',
    languageRemap: { 'pt-br': 'pob', 'por': 'pob' },
    allowUnknownLanguages: false,
    deduplication: true,
    proxySubtitles: true
  };

  // Seed the cache with raw subtitle to simulate connector execution
  const enabledIds = Object.keys(testUserConfig.providers).filter(
    id => testUserConfig.providers[id]?.enabled !== false
  );
  const testCacheKey = globalSubtitleCache.generateKey(
    testQuery.id,
    testUserConfig.languages,
    enabledIds,
    testQuery.season,
    testQuery.episode
  );
  globalSubtitleCache.set(testCacheKey, mockRawExternalSubtitles);

  // Execute pipeline
  const testBaseUrl = 'http://localhost:7000';
  const finalResponse = await getAggregatedSubtitles(testQuery, testUserConfig, testBaseUrl);

  if (!finalResponse.subtitles || finalResponse.subtitles.length !== 1) {
    console.error(`❌ Falha: Esperava 1 legenda na resposta final, recebeu ${finalResponse.subtitles?.length}`);
    process.exit(1);
  }

  const finalSub = finalResponse.subtitles[0];

  // (a) lang normalizado para pob
  if (finalSub.lang !== 'pob') {
    console.error(`❌ Falha no critério (a): lang esperado "pob", recebeu "${finalSub.lang}"`);
    process.exit(1);
  }
  console.log(`  ✅ (a) lang normalizado com sucesso para: "${finalSub.lang}"`);

  // (b) id curto e sem substring de URL
  if (finalSub.id.includes('http') || finalSub.id.includes('https') || finalSub.id.length > 50) {
    console.error(`❌ Falha no critério (b): id contém URL ou excede tamanho curto: "${finalSub.id}"`);
    process.exit(1);
  }
  console.log(`  ✅ (b) id curto e sem URL: "${finalSub.id}" (length: ${finalSub.id.length})`);

  // (c) rótulo/nome de arquivo igual ao gerado pelo template configurado, não ao original do conector
  const expectedTemplateLabel = '[External Subs Addon] 🇧🇷 Breaking.Bad.S01E01.720p.HDTV.x264';
  if (finalSub.title !== expectedTemplateLabel || finalSub.file !== `${expectedTemplateLabel}.srt`) {
    console.error(`❌ Falha no critério (c): rótulo não bate com o template!\nEsperado: "${expectedTemplateLabel}"\nRecebido title: "${finalSub.title}"\nRecebido file: "${finalSub.file}"`);
    process.exit(1);
  }
  console.log(`  ✅ (c) rótulo/nome de arquivo igual ao gerado pelo template configurado: "${finalSub.title}"`);

  // Also verify (d) proxy URL points to /download/:idCurto.srt
  if (!finalSub.url.startsWith(`${testBaseUrl}/download/`) || !finalSub.url.endsWith('.srt')) {
    console.error(`❌ Falha no critério proxy: URL não aponta para /download/:idCurto.srt: "${finalSub.url}"`);
    process.exit(1);
  }
  console.log(`  ✅ (d) URL de proxy interna verificada: "${finalSub.url}"`);

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  process.exit(0);
}

runPipelineIntegrationTest().catch(err => {
  console.error('❌ Erro inesperado no teste de integração:', err);
  process.exit(1);
});
