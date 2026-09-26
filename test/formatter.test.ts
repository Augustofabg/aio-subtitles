import {
  formatSubtitleItem,
  interpolateVariables,
  sanitizeSubtitleId,
  renderPreview,
  extractSubtitleVariables,
  getLanguageDisplayName
} from '../src/core/formatter';
import { RawSubtitleItem } from '../src/types/provider';
import { FormatterConfig } from '../src/types/config';

async function runFormatterTests() {
  console.log('🧪 Iniciando Testes Unitários do Módulo Formatter...\n');
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

  // Sample raw subtitle item simulating a community addon response seen in Nuvio
  const sampleCommunityItem: RawSubtitleItem = {
    id: 'com.community.stremio-subtitles-subsync-01',
    provider: 'community.subsync',
    providerName: 'Community Subsync',
    url: 'https://example.com/subs/test.srt',
    lang: 'pob',
    release: 'Inception.2010.1080p.BluRay.x264.srt',
    format: 'srt',
    fps: 23.976,
    rawMetadata: {
      delay: 0,
      file: 'Inception.2010.1080p.BluRay.x264.srt'
    }
  };

  // 1. Test variable extraction
  console.log('--- 1. Extração de Variáveis ---');
  const vars = extractSubtitleVariables(sampleCommunityItem);
  assert(vars['addon.name'] === 'Community Subsync', '{addon.name} extraído corretamente');
  assert(vars['sub.lang'] === 'Português (Brasil)', '{sub.lang} normalizado para nome nativo legível');
  assert(vars['sub.filename'] === 'Inception.2010.1080p.BluRay.x264.srt', '{sub.filename} extraído corretamente');
  assert(vars['sub.fps'] === '23.976 fps', '{sub.fps} formatado com unidade');
  assert(vars['sub.format'] === 'SRT', '{sub.format} em maiúsculas');
  assert(vars['sub.delay'] === '0ms', '{sub.delay} extraído corretamente');

  // 2. Test template interpolation
  console.log('\n--- 2. Interpolação de Templates ---');
  const interpolated = interpolateVariables('{addon.name} • {sub.format} • {sub.fps}', vars);
  assert(interpolated === 'Community Subsync • SRT • 23.976 fps', 'Interpolação de múltiplas variáveis funciona');

  const emptyClean = interpolateVariables('', vars);
  assert(emptyClean === '', 'Template vazio resulta em string vazia');

  // 3. Test Preset "Clean / Default"
  console.log('\n--- 3. Preset "Clean / Default" (Solução do problema do Nuvio) ---');
  const cleanConfig: FormatterConfig = {
    preset: 'clean',
    nameTemplate: '{sub.lang}',
    descriptionTemplate: ''
  };

  const cleanResult = formatSubtitleItem(sampleCommunityItem, cleanConfig, 0);
  assert(cleanResult.description === undefined, 'No preset Clean, a propriedade description é suprimida do payload');
  assert(cleanResult.label === '', 'No preset Clean, label é vazio para evitar que o Nuvio mostre linhas secundárias');
  assert(!cleanResult.id.includes('community') && !cleanResult.id.includes('stremio-subtitles'), 'ID técnico com.community... é purgado e sanitizado');
  assert(cleanResult.title === 'Português (Brasil)', 'Nome da legenda é exibido limpo');

  // 4. Test Preset "Detailed"
  console.log('\n--- 4. Preset "Detailed" ---');
  const detailedConfig: FormatterConfig = {
    preset: 'detailed',
    nameTemplate: '{sub.lang}',
    descriptionTemplate: '{addon.name} • {sub.format}'
  };

  const detailedResult = formatSubtitleItem(sampleCommunityItem, detailedConfig, 0);
  assert(detailedResult.description === 'Community Subsync • SRT', 'Description formatada com metadados úteis');
  assert(detailedResult.label === 'Community Subsync • SRT', 'Label formatada com metadados úteis (Stremio PR #947)');
  assert(detailedResult.id === 'Community Subsync • SRT', 'ID mapeado para o texto formatado para clientes como Nuvio');
  assert(detailedResult.title === 'Português (Brasil)', 'Title exibe o idioma');

  // 5. Test Preset "Custom"
  console.log('\n--- 5. Preset "Custom" ---');
  const customConfig: FormatterConfig = {
    preset: 'custom',
    nameTemplate: '[{sub.format}] {sub.lang}',
    descriptionTemplate: '{sub.filename} ({sub.fps})'
  };

  const customResult = formatSubtitleItem(sampleCommunityItem, customConfig, 0);
  assert(customResult.title === '[SRT] Português (Brasil)', 'Title personalizado com formato e idioma');
  assert(customResult.description === 'Inception.2010.1080p.BluRay.x264.srt (23.976 fps)', 'Description personalizada com filename e fps');
  assert(customResult.label === 'Inception.2010.1080p.BluRay.x264.srt (23.976 fps)', 'Label personalizada com filename e fps');
  assert(customResult.id === 'Inception.2010.1080p.BluRay.x264.srt (23.976 fps)', 'ID mapeado para a descrição personalizada no Nuvio');

  // 6. Test Live Preview simulation helper
  console.log('\n--- 6. Simulação de Preview em Tempo Real ---');
  const preview = renderPreview('{sub.lang}', '{addon.name} • {sub.format}');
  assert(preview.title === 'Português (Brasil)', 'Preview title reflete Português (Brasil)');
  assert(preview.description === 'AIOSubs • SRT', 'Preview description reflete AIOSubs • SRT');

  const previewClean = renderPreview('{sub.lang}', '');
  assert(previewClean.description === '', 'Preview limpo não exibe descrição secundária');

  console.log(`\n========================================`);
  console.log(`TOTAL DE TESTES DO FORMATTER: ${passed + failed}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runFormatterTests().catch(err => {
  console.error('Erro nos testes do formatter:', err);
  process.exit(1);
});
