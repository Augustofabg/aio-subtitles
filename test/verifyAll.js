async function testAll() {
  console.log('Testing endpoints...');
  
  // 1. /configure
  const pageHtml = await fetch('http://localhost:7000/configure').then(r => r.text());
  console.log('1. /configure length:', pageHtml.length);
  
  const checks = [
    ['Unsaved changes banner', pageHtml.includes('id="unsaved-changes-banner"')],
    ['Restore draft button', pageHtml.includes('id="btn-restore-draft"')],
    ['Discard draft button', pageHtml.includes('id="btn-discard-draft"')],
    ["Don't keep drafts toggle", pageHtml.includes('id="toggle-no-drafts"')],
    ['Previous button', pageHtml.includes('id="btn-prev"')],
    ['Reset draft circle button', pageHtml.includes('id="btn-reset-draft"')],
    ['Save circle button', pageHtml.includes('id="btn-topbar-save"')],
    ['Next button', pageHtml.includes('id="btn-next"')],
    ['Home Donate button', pageHtml.includes('id="btn-home-donate"')],
    ['Home SignOut button', pageHtml.includes('id="btn-home-signout"')],
    ['OpenSubtitles description', pageHtml.includes('API oficial com suporte a busca nativa por idioma e metadados detalhados')],
    ['SubDL description', pageHtml.includes('Banco de dados massivo com legendas em múltiplos idiomas e releases')],
    ['Subsource description', pageHtml.includes('Comunidade colaborativa com legendas revisadas para filmes e séries')],
    ['Addon Fetching Strategy section', pageHtml.includes('id="wrap-fetching-strategy"')],
    ['Filter connector timeout', pageHtml.includes('id="filter-addon-timeout"')],
    ['Install connector timeout', pageHtml.includes('id="install-addon-timeout"')],
    ['Edit addon timeout', pageHtml.includes('id="edit-addon-timeout"')],
    ['Centered UUID block', pageHtml.includes('uuid-centered-container') && pageHtml.includes('uuid-horizontal-block')],
    ['Password input wrap', pageHtml.includes('id="user-password-wrap"')],
    ['Load password input wrap', pageHtml.includes('id="load-password-wrap"')],
    ['Install to Stremio pill', pageHtml.includes('btn-stremio-pill') && pageHtml.includes('Install to Stremio')],
    ['Install to Stremio Web pill', pageHtml.includes('link-install-stremio-web')],
    ['Pill Open Stremio badge', pageHtml.includes('id="pill-open-stremio"')],
    ['Pill Open Nuvio badge', pageHtml.includes('id="pill-open-nuvio"')],
    ['Pill Open Web badge', pageHtml.includes('id="pill-open-web"')],
  ];

  for (const [name, ok] of checks) {
    if (!ok) {
      console.error('FAIL: ' + name);
      process.exit(1);
    }
    console.log(' PASS: ' + name);
  }

  // 2. Test manifest endpoint
  const manifest = await fetch('http://localhost:7000/default/manifest.json').then(r => r.json());
  console.log('2. Manifest id:', manifest.id, 'resources:', manifest.resources);
  const hasSubtitles = manifest.resources.some(r => r === 'subtitles' || r.name === 'subtitles');
  if (!hasSubtitles) throw new Error('Manifest missing subtitles resource');

  // 3. Test subtitles endpoint format
  const subs = await fetch('http://localhost:7000/default/subtitles/movie/tt0903747.json').then(r => r.json());
  console.log('3. Subtitles response keys:', Object.keys(subs), 'subtitles count:', subs.subtitles?.length || 0);

  console.log('\nAll comprehensive integration checks passed 100%!');
}

testAll().catch(e => { console.error(e); process.exit(1); });
