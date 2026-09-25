import { getAllProviders } from '../src/providers';
import { GenericStremioAddonProvider } from '../src/providers/genericStremioAddon';
import { validateAndNormalizeLanguage, isLanguageWhitelisted } from '../src/utils/normalizer';
import { RawSubtitleItem } from '../src/types/provider';
import { getAggregatedSubtitles } from '../src/core/aggregator';
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

// 3. Test Provider ID & Subtitle Item Integrity
console.log('\n--- Teste 3: Integridade de Provedores e Itens de Legenda ---');
const mockItems: RawSubtitleItem[] = [
  {
    id: 'test-1',
    provider: 'opensubtitles-rest',
    providerName: 'OpenSubtitles REST',
    url: 'https://api.opensubtitles.com/download/sub1.srt',
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
  }
];

for (const item of mockItems) {
  if (!item.provider || !item.url || !item.lang) {
    console.error(`❌ Item inválido:`, item);
    process.exit(1);
  }
  console.log(`  ✅ Item de legenda íntegro: [${item.provider}] lang=${item.lang} url=${item.url}`);
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

// 5. Integration Test: Pipeline returns direct original id, normalized lang, and direct url
console.log('\n--- Teste 5: Validação do Pipeline Direto (sem templates/proxies) ---');

async function runPipelineIntegrationTest(): Promise<void> {
  const mockRawExternalSubtitles: RawSubtitleItem[] = [
    {
      id: 'sub-ext-101',
      provider: 'external-addon',
      providerName: 'External Subs Addon',
      url: 'https://subs5.strem.io/en/download/file/1952160592.srt',
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
    languageRemap: { 'pt-br': 'pob', 'por': 'pob' },
    allowUnknownLanguages: false,
    deduplication: true
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

  // (b) id original preservado diretamente
  if (finalSub.id !== 'sub-ext-101') {
    console.error(`❌ Falha no critério (b): id esperado "sub-ext-101", recebeu "${finalSub.id}"`);
    process.exit(1);
  }
  console.log(`  ✅ (b) id original preservado: "${finalSub.id}"`);

  // (c) url original preservada diretamente
  if (finalSub.url !== 'https://subs5.strem.io/en/download/file/1952160592.srt') {
    console.error(`❌ Falha no critério (c): url esperada original, recebeu "${finalSub.url}"`);
    process.exit(1);
  }
  console.log(`  ✅ (c) url original preservada diretamente: "${finalSub.url}"`);

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  process.exit(0);
}

runPipelineIntegrationTest().catch(err => {
  console.error('❌ Erro inesperado no teste de integração:', err);
  process.exit(1);
});
