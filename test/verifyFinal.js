const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'web', 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'dist', 'web', 'public', 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'dist', 'web', 'public', 'app.js'), 'utf8');

const checks = [
  ['No Load Config in topbar', !html.includes('id="btn-open-load-modal"')],
  ['Install Backup Export button exists', html.includes('id="btn-export-backup"')],
  ['Install Backup Import button exists', html.includes('id="btn-import-backup"')],
  ['Install 2-column layout exists', html.includes('install-two-cols-row')],
  ['Install left-aligned UUID exists', html.includes('uuid-left-container')],
  ['Stremio webp image used in install', html.includes('https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/stremio.webp')],
  ['Edit Custom Addon modal title', html.includes('Edit Custom')],
  ['Addon resources chips container exists', html.includes('id="edit-addon-resources-chips"')],
  ['Addon external config button exists', html.includes('id="btn-addon-external-config"')],
  ['No timeout box in filters', !html.includes('id="filter-addon-timeout"')],
  ['Unsaved banner slide animations in CSS', css.includes('bannerSlideDown') && css.includes('bannerSlideUp')],
  ['Unsaved banner purple dot in CSS', css.includes('.unsaved-dot') && css.includes('#7c5cff')],
  ['Equal pill navigation buttons in CSS', css.includes('.btn-pill-nav') && css.includes('min-width: 96px')],
  ['Modal scale-in 0.96 in CSS', css.includes('transform: scale(0.96)')],
  ['QR code API endpoint integrated in app.js', js.includes('/api/qrcode?text=')],
  ['Backup export handler integrated in app.js', js.includes('btn-export-backup')],
  ['Backup import handler integrated in app.js', js.includes('btn-import-backup')]
];

let allPassed = true;
checks.forEach(([desc, passed]) => {
  console.log((passed ? '✅' : '❌') + ' ' + desc);
  if (!passed) allPassed = false;
});

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\n🌟 ALL INTEGRATION CHECKS PASSED PERFECTLY!');
}
