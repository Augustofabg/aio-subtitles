import { getAllProviders } from '../src/providers';
import { GenericStremioAddonProvider } from '../src/providers/genericStremioAddon';
import { buildTemplateContext, renderTemplate } from '../src/utils/template';
import { RawSubtitleItem } from '../src/types/provider';

console.log('🧪 Iniciando testes de validação de provedores e prevenção do bug "Desconhecido"...');

// 1. Validate all registered built-in providers
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

// 2. Validate GenericStremioAddonProvider with custom imported manifests
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

// 3. Test mock item normalization and template rendering
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

console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO! Nenhum provedor reporta "Desconhecido".');
process.exit(0);
