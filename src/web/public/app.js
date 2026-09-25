// State
const state = {
  providers: [
    { id: 'opensubtitles-rest', name: 'OpenSubtitles REST', description: 'API oficial v1 com suporte a busca nativa por idioma e metadados detalhados', requiresApiKey: true, defaultEnabled: true },
    { id: 'subdl', name: 'SubDL', description: 'Banco de dados massivo com legendas em múltiplos idiomas e releases', requiresApiKey: false, defaultEnabled: true },
    { id: 'opensubtitles-v3', name: 'OpenSubtitles v3', description: 'Endpoint clássico do Stremio (filtrado após recebimento na sua whitelist)', requiresApiKey: false, defaultEnabled: true },
    { id: 'subsource', name: 'Subsource', description: 'Comunidade colaborativa com legendas revisadas para filmes e séries', requiresApiKey: false, defaultEnabled: true },
    { id: 'addic7ed', name: 'Addic7ed', description: 'Especializado em episódios e lançamentos rápidos de séries de TV', requiresApiKey: false, defaultEnabled: true }
  ],
  languagesList: [],
  config: {
    providers: {
      'opensubtitles-v3': { enabled: true },
      'opensubtitles-rest': { enabled: true, apiKey: '' },
      'subdl': { enabled: true, apiKey: '' },
      'subsource': { enabled: true },
      'addic7ed': { enabled: true }
    },
    providerPriority: ['opensubtitles-rest', 'subdl', 'opensubtitles-v3', 'subsource', 'addic7ed'],
    languages: ['pob', 'por', 'eng'],
    languageRemap: {
      'por': 'pob',
      'pt-br': 'pob',
      'pt': 'pob',
      'pt-pt': 'por'
    },
    namingTemplate: '[{provider}] {lang_flag} {release} {hi}',
    providerTimeoutMs: 6000,
    deduplication: true,
    proxySubtitles: true,
    cacheTtlMinutes: 30,
    customAddons: []
  }
};

// DOM Elements
const providersListEl = document.getElementById('providers-list');
const priorityListEl = document.getElementById('priority-list');
const manifestImportInput = document.getElementById('manifest-import-input');
const btnImportAddon = document.getElementById('btn-import-addon');
const btnImportText = document.getElementById('btn-import-text');
const importFeedbackBox = document.getElementById('import-feedback-box');
const customAddonsListEl = document.getElementById('custom-addons-list');
const selectedLanguagesTagsEl = document.getElementById('selected-languages-tags');
const languagesPickerEl = document.getElementById('languages-picker');
const langSearchInput = document.getElementById('lang-search');
const remapContainerEl = document.getElementById('remap-rules-container');
const btnAddRemap = document.getElementById('btn-add-remap');
const btnResetRemap = document.getElementById('btn-reset-remap');
const templateInput = document.getElementById('template-input');
const timeoutSlider = document.getElementById('timeout-slider');
const timeoutValEl = document.getElementById('timeout-val');
const dedupToggle = document.getElementById('dedup-toggle');
const proxyToggle = document.getElementById('proxy-subtitles-toggle');
const allowUnknownLangToggle = document.getElementById('allow-unknown-lang-toggle');
const mockupSubList = document.getElementById('mockup-sub-list');
const btnGenerate = document.getElementById('btn-generate');
const manifestUrlInput = document.getElementById('manifest-url-input');
const btnCopyUrl = document.getElementById('btn-copy-url');
const copyTooltip = document.getElementById('copy-tooltip');
const btnInstallStremio = document.getElementById('btn-install-stremio');
const btnStremioWeb = document.getElementById('btn-stremio-web');
const qrCanvas = document.getElementById('qr-code-canvas');

// Base64URL encode/decode helpers
function base64UrlEncode(obj) {
  const json = JSON.stringify(obj);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json);
  } catch (err) {
    console.warn('Failed to parse config from URL:', err);
    return null;
  }
}

// Initialize Application
async function initApp() {
  // Check if config is present in URL path: /:config/configure or ?config=...
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let encodedFromUrl = null;
  if (pathParts.length >= 2 && pathParts[pathParts.length - 1] === 'configure') {
    encodedFromUrl = pathParts[0];
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    encodedFromUrl = urlParams.get('config');
  }

  if (encodedFromUrl) {
    const decoded = base64UrlDecode(encodedFromUrl);
    if (decoded) {
      state.config = { ...state.config, ...decoded };
    }
  }

  // Fetch languages list from API
  try {
    const res = await fetch('/api/languages');
    const data = await res.json();
    if (data && data.languages) {
      state.languagesList = data.languages;
    }
  } catch {
    state.languagesList = [
      { code: 'pob', name: 'Portuguese (Brazil)', flag: '🇧🇷', iso639_1: 'pt' },
      { code: 'por', name: 'Portuguese (Portugal)', flag: '🇵🇹', iso639_1: 'pt' },
      { code: 'eng', name: 'English', flag: '🇺🇸', iso639_1: 'en' },
      { code: 'spa', name: 'Spanish', flag: '🇪🇸', iso639_1: 'es' },
      { code: 'fra', name: 'French', flag: '🇫🇷', iso639_1: 'fr' },
      { code: 'deu', name: 'German', flag: '🇩🇪', iso639_1: 'de' },
      { code: 'ita', name: 'Italian', flag: '🇮🇹', iso639_1: 'it' },
      { code: 'jpn', name: 'Japanese', flag: '🇯🇵', iso639_1: 'ja' },
      { code: 'kor', name: 'Korean', flag: '🇰🇷', iso639_1: 'ko' }
    ];
  }

  renderProviders();
  renderCustomAddons();
  renderLanguages();
  if (allowUnknownLangToggle) {
    allowUnknownLangToggle.checked = Boolean(state.config.allowUnknownLanguages);
  }
  renderRemapRules();
  renderPriorityList();
  setupEventListeners();
  updateLivePreview();
  generateManifestUrl();
}

// 1.1 Render Custom Addons
function renderCustomAddons() {
  customAddonsListEl.innerHTML = '';
  if (!Array.isArray(state.config.customAddons) || state.config.customAddons.length === 0) {
    customAddonsListEl.innerHTML = '<div style="color:var(--text-dim);font-size:0.82rem;padding:6px 0;">Nenhum addon externo importado ainda. Cole uma URL acima para adicionar!</div>';
    return;
  }

  state.config.customAddons.forEach((addon, idx) => {
    const isEnabled = addon.enabled !== false;
    const card = document.createElement('div');
    card.className = 'custom-addon-card';
    card.innerHTML = `
      <div class="custom-addon-info">
        <div class="custom-addon-name-row">
          <span class="custom-addon-name">${addon.name}</span>
          <span class="badge-manifest-name" title="Nome verificado no manifest oficial">Lido do Manifest: ${addon.name}</span>
        </div>
        <div class="custom-addon-url-wrap">
          <span class="custom-addon-url" title="${addon.manifestUrl}">${addon.manifestUrl}</span>
          <button type="button" class="btn-copy-addon-url" title="Copiar URL completa do manifest">Copiar URL</button>
        </div>
      </div>
      <div class="custom-addon-actions">
        <div class="toggle-wrap">
          <input type="checkbox" id="custom-addon-toggle-${idx}" ${isEnabled ? 'checked' : ''}>
          <label for="custom-addon-toggle-${idx}" class="toggle-slider"></label>
        </div>
        <button type="button" class="btn-remove-addon" title="Remover este addon">&times; Remover</button>
      </div>
    `;

    // Copy URL
    const copyUrlBtn = card.querySelector('.btn-copy-addon-url');
    copyUrlBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(addon.manifestUrl).then(() => {
        copyUrlBtn.textContent = 'Copiado!';
        copyUrlBtn.style.color = '#10b981';
        setTimeout(() => {
          copyUrlBtn.textContent = 'Copiar URL';
          copyUrlBtn.style.color = '';
        }, 1500);
      });
    });

    // Toggle
    card.querySelector(`#custom-addon-toggle-${idx}`).addEventListener('change', (e) => {
      addon.enabled = e.target.checked;
      updateLivePreview();
      generateManifestUrl();
    });

    // Remove
    card.querySelector('.btn-remove-addon').addEventListener('click', () => {
      state.config.customAddons = state.config.customAddons.filter((_, i) => i !== idx);
      state.config.providerPriority = state.config.providerPriority.filter(id => id !== addon.id);
      renderCustomAddons();
      renderPriorityList();
      updateLivePreview();
      generateManifestUrl();
    });

    customAddonsListEl.appendChild(card);
  });
}

// Import Custom Addon from Manifest URL
async function handleImportAddon() {
  const url = manifestImportInput.value.trim();
  if (!url) {
    showImportFeedback('Por favor, informe a URL do manifest.json', 'error');
    return;
  }

  btnImportAddon.disabled = true;
  btnImportText.textContent = 'Validando...';
  importFeedbackBox.style.display = 'none';

  try {
    const res = await fetch('/api/manifest/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();

    if (!res.ok || !data.valid) {
      showImportFeedback(data.error || 'Erro ao validar o manifest do addon', 'error');
      return;
    }

    // Check if already imported
    if (state.config.customAddons.some(a => a.manifestUrl === data.manifestUrl || a.id === data.id)) {
      showImportFeedback(`O addon "${data.name}" já está na sua lista!`, 'error');
      return;
    }

    // Add to config (guarantee non-empty name from manifest!)
    const newAddon = {
      id: data.id,
      name: data.name,
      manifestUrl: data.manifestUrl,
      enabled: true
    };

    state.config.customAddons.push(newAddon);
    if (!state.config.providerPriority.includes(newAddon.id)) {
      state.config.providerPriority.push(newAddon.id);
    }

    manifestImportInput.value = '';
    showImportFeedback(`✅ Addon "${data.name}" importado e verificado com sucesso!`, 'success');

    renderCustomAddons();
    renderPriorityList();
    updateLivePreview();
    generateManifestUrl();
  } catch (err) {
    showImportFeedback(`Falha na conexão: ${err.message}`, 'error');
  } finally {
    btnImportAddon.disabled = false;
    btnImportText.textContent = '+ Adicionar Addon';
  }
}

function showImportFeedback(msg, type) {
  importFeedbackBox.textContent = msg;
  importFeedbackBox.className = `import-feedback ${type}`;
  importFeedbackBox.style.display = 'block';
}

// 1. Render Providers
function renderProviders() {
  providersListEl.innerHTML = '';
  state.providers.forEach(p => {
    const pConfig = state.config.providers[p.id] || { enabled: p.defaultEnabled };
    const isEnabled = pConfig.enabled !== false;
    const apiKey = pConfig.apiKey || '';

    const el = document.createElement('div');
    el.className = 'provider-item';
    el.innerHTML = `
      <div class="provider-header">
        <div class="provider-title-wrap">
          <span class="provider-name">${p.name}</span>
          <span class="provider-tag ${p.requiresApiKey ? 'auth' : ''}">${p.requiresApiKey ? 'Requer API Key' : 'Público'}</span>
        </div>
        <div class="toggle-wrap">
          <input type="checkbox" id="prov-toggle-${p.id}" ${isEnabled ? 'checked' : ''} data-prov-id="${p.id}">
          <label for="prov-toggle-${p.id}" class="toggle-slider"></label>
        </div>
      </div>
      <p class="provider-desc">${p.description}</p>
      ${p.requiresApiKey ? `
        <div class="provider-api-key-box" style="${isEnabled ? '' : 'display:none;'}">
          <label for="prov-key-${p.id}">Sua API Key do ${p.name}:</label>
          <div class="password-input-wrap">
            <input type="password" id="prov-key-${p.id}" value="${apiKey}" placeholder="Insira sua chave de API..." data-prov-id="${p.id}">
            <button type="button" class="password-toggle-btn" title="Mostrar/ocultar senha">👁️</button>
          </div>
        </div>
      ` : ''}
    `;

    // Toggle event
    const toggle = el.querySelector(`#prov-toggle-${p.id}`);
    toggle.addEventListener('change', (e) => {
      if (!state.config.providers[p.id]) state.config.providers[p.id] = {};
      state.config.providers[p.id].enabled = e.target.checked;
      const keyBox = el.querySelector('.provider-api-key-box');
      if (keyBox) keyBox.style.display = e.target.checked ? '' : 'none';
      updateLivePreview();
      generateManifestUrl();
    });

    // API Key input
    const keyInput = el.querySelector(`#prov-key-${p.id}`);
    if (keyInput) {
      keyInput.addEventListener('input', (e) => {
        if (!state.config.providers[p.id]) state.config.providers[p.id] = {};
        state.config.providers[p.id].apiKey = e.target.value.trim();
        generateManifestUrl();
      });

      const passToggle = el.querySelector('.password-toggle-btn');
      passToggle.addEventListener('click', () => {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      });
    }

    providersListEl.appendChild(el);
  });
}

// 2. Render Languages Whitelist
function renderLanguages() {
  // Render Selected Tags
  selectedLanguagesTagsEl.innerHTML = '';
  state.config.languages.forEach(code => {
    const lang = state.languagesList.find(l => l.code === code) || { code, name: code.toUpperCase(), flag: '🌐' };
    const tag = document.createElement('span');
    tag.className = 'lang-tag';
    tag.innerHTML = `
      <span>${lang.flag}</span>
      <span>${lang.name} (${lang.code})</span>
      <span class="lang-tag-close" data-code="${code}">&times;</span>
    `;
    tag.querySelector('.lang-tag-close').addEventListener('click', () => {
      toggleLanguage(code, false);
    });
    selectedLanguagesTagsEl.appendChild(tag);
  });

  // Render Checkbox dropdown
  renderLanguagesDropdown();
}

function renderLanguagesDropdown(searchTerm = '') {
  languagesPickerEl.innerHTML = '';
  const search = searchTerm.toLowerCase();

  const filtered = state.languagesList.filter(l =>
    l.name.toLowerCase().includes(search) ||
    l.code.toLowerCase().includes(search) ||
    (l.nativeName && l.nativeName.toLowerCase().includes(search))
  );

  filtered.forEach(lang => {
    const isChecked = state.config.languages.includes(lang.code);
    const label = document.createElement('label');
    label.className = 'lang-checkbox-label';
    label.innerHTML = `
      <input type="checkbox" value="${lang.code}" ${isChecked ? 'checked' : ''}>
      <span>${lang.flag}</span>
      <span>${lang.name} <small style="color:var(--text-dim);">(${lang.code})</small></span>
    `;

    label.querySelector('input').addEventListener('change', (e) => {
      toggleLanguage(lang.code, e.target.checked);
    });

    languagesPickerEl.appendChild(label);
  });
}

function toggleLanguage(code, add) {
  if (add) {
    if (!state.config.languages.includes(code)) {
      state.config.languages.push(code);
    }
  } else {
    state.config.languages = state.config.languages.filter(c => c !== code);
  }
  renderLanguages();
  updateLivePreview();
  generateManifestUrl();
}

// 3. Render Language Code Remapping (Problem #2)
function renderRemapRules() {
  remapContainerEl.innerHTML = '';
  const entries = Object.entries(state.config.languageRemap);

  if (entries.length === 0) {
    remapContainerEl.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:6px 0;">Nenhuma regra ativa (códigos não serão remapeados).</div>';
    return;
  }

  entries.forEach(([from, to], idx) => {
    const row = document.createElement('div');
    row.className = 'remap-row';
    row.innerHTML = `
      <input type="text" class="remap-input remap-from" value="${from}" placeholder="De (ex: por, pt-br)">
      <span class="remap-arrow">&rarr;</span>
      <input type="text" class="remap-input remap-to" value="${to}" placeholder="Para (ex: pob)">
      <button type="button" class="remap-delete-btn" title="Remover regra">&times;</button>
    `;

    const fromInput = row.querySelector('.remap-from');
    const toInput = row.querySelector('.remap-to');
    const deleteBtn = row.querySelector('.remap-delete-btn');

    fromInput.addEventListener('input', () => updateRemapRulesFromDOM());
    toInput.addEventListener('input', () => updateRemapRulesFromDOM());
    deleteBtn.addEventListener('click', () => {
      row.remove();
      updateRemapRulesFromDOM();
    });

    remapContainerEl.appendChild(row);
  });
}

function updateRemapRulesFromDOM() {
  const newMap = {};
  const rows = remapContainerEl.querySelectorAll('.remap-row');
  rows.forEach(r => {
    const from = r.querySelector('.remap-from').value.trim().toLowerCase();
    const to = r.querySelector('.remap-to').value.trim().toLowerCase();
    if (from && to) {
      newMap[from] = to;
    }
  });
  state.config.languageRemap = newMap;
  updateLivePreview();
  generateManifestUrl();
}

// 4. Render Provider Priority List
function renderPriorityList() {
  priorityListEl.innerHTML = '';
  state.config.providerPriority.forEach((id, idx) => {
    const customFound = (state.config.customAddons || []).find(a => a.id === id);
    const provider = state.providers.find(p => p.id === id) || (customFound ? { name: customFound.name, isCustom: true } : { name: id });
    const item = document.createElement('div');
    item.className = 'priority-item';
    item.innerHTML = `
      <div class="priority-item-left">
        <span class="priority-order-badge">${idx + 1}</span>
        <span>${provider.name}</span>
        ${customFound ? '<span class="badge-manifest-name" style="font-size:0.68rem;padding:1px 6px;">Addon Externo</span>' : ''}
      </div>
      <div class="priority-btns">
        <button type="button" class="priority-btn btn-up" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Subir prioridade">&uarr;</button>
        <button type="button" class="priority-btn btn-down" ${idx === state.config.providerPriority.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="Descer prioridade">&darr;</button>
      </div>
    `;

    item.querySelector('.btn-up').addEventListener('click', () => {
      if (idx > 0) {
        const temp = state.config.providerPriority[idx - 1];
        state.config.providerPriority[idx - 1] = state.config.providerPriority[idx];
        state.config.providerPriority[idx] = temp;
        renderPriorityList();
        updateLivePreview();
        generateManifestUrl();
      }
    });

    item.querySelector('.btn-down').addEventListener('click', () => {
      if (idx < state.config.providerPriority.length - 1) {
        const temp = state.config.providerPriority[idx + 1];
        state.config.providerPriority[idx + 1] = state.config.providerPriority[idx];
        state.config.providerPriority[idx] = temp;
        renderPriorityList();
        updateLivePreview();
        generateManifestUrl();
      }
    });

    priorityListEl.appendChild(item);
  });
}

// 5. Update Live Preview of Subtitles in Stremio Mockup
function updateLivePreview() {
  const template = templateInput.value || '[{provider}] {lang_flag} {release} {hi}';

  const mockData = [
    { provider: 'OpenSubtitles', lang: 'POB', lang_flag: '🇧🇷', release: '1080p.BluRay.x264-SPARKS', hi: '[CC]', format: 'SRT', fps: '23.976fps' },
    { provider: 'SubDL', lang: 'POB', lang_flag: '🇧🇷', release: '2160p.UHD.HDR.WEB-DL.DDP5.1', hi: '', format: 'SRT', fps: '24fps' }
  ];

  if (state.config.customAddons && state.config.customAddons.length > 0) {
    const customFirst = state.config.customAddons[0];
    mockData.push({
      provider: customFirst.name,
      lang: 'POB',
      lang_flag: '🇧🇷',
      release: '1080p.WEB-DL.Dual',
      hi: '[CC]',
      format: 'SRT',
      fps: '23.976fps'
    });
  } else {
    mockData.push({ provider: 'Subsource', lang: 'POB', lang_flag: '🇧🇷', release: '720p.HDTV.x264-AVS', hi: '[CC]', format: 'SRT', fps: '25fps' });
  }

  mockupSubList.innerHTML = '';
  mockData.forEach(item => {
    let rendered = template
      .replace(/\{provider\}/gi, item.provider)
      .replace(/\{lang_flag\}/gi, item.lang_flag)
      .replace(/\{lang\}/gi, item.lang)
      .replace(/\{release\}/gi, item.release)
      .replace(/\{hi\}/gi, item.hi)
      .replace(/\{format\}/gi, item.format)
      .replace(/\{fps\}/gi, item.fps)
      .replace(/\[\s*\]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const row = document.createElement('div');
    row.className = 'mockup-item';
    row.innerHTML = `
      <span class="mockup-item-icon">💬</span>
      <span class="mockup-item-text" title="${rendered}">${rendered}</span>
    `;
    mockupSubList.appendChild(row);
  });
}

// 6. Generate Manifest URL and Links
function generateManifestUrl() {
  state.config.namingTemplate = templateInput.value.trim();
  state.config.providerTimeoutMs = parseInt(timeoutSlider.value, 10);
  state.config.deduplication = dedupToggle.checked;
  state.config.proxySubtitles = proxyToggle.checked;
  state.config.allowUnknownLanguages = allowUnknownLangToggle ? allowUnknownLangToggle.checked : false;

  const encoded = base64UrlEncode(state.config);
  const host = window.location.host;
  const protocol = window.location.protocol;
  const manifestUrl = `${protocol}//${host}/${encoded}/manifest.json`;

  manifestUrlInput.value = manifestUrl;

  // Stremio deep link protocol: stremio://
  const cleanHost = host;
  btnInstallStremio.href = `stremio://${cleanHost}/${encoded}/manifest.json`;

  // Stremio Web link
  btnStremioWeb.href = `https://web.stremio.com/#/discover?addon=${encodeURIComponent(manifestUrl)}`;

  // Generate QR Code for Nuvio / Stremio Mobile
  if (window.QRCode && qrCanvas) {
    QRCode.toCanvas(qrCanvas, manifestUrl, {
      width: 150,
      margin: 1,
      color: {
        dark: '#0b0f19',
        light: '#ffffff'
      }
    }, function (error) {
      if (error) console.error('QR code error:', error);
    });
  }
}

// 7. Setup Event Listeners
function setupEventListeners() {
  // Import custom addon
  btnImportAddon.addEventListener('click', handleImportAddon);
  manifestImportInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleImportAddon();
  });

  // Search languages
  langSearchInput.addEventListener('input', (e) => {
    renderLanguagesDropdown(e.target.value);
  });

  // Presets
  document.querySelectorAll('.chip-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      if (preset === 'pt-en') state.config.languages = ['pob', 'por', 'eng'];
      if (preset === 'only-pt') state.config.languages = ['pob', 'por'];
      if (preset === 'popular') state.config.languages = ['pob', 'por', 'eng', 'spa'];
      renderLanguages();
      updateLivePreview();
      generateManifestUrl();
    });
  });

  // Add remap rule
  btnAddRemap.addEventListener('click', () => {
    state.config.languageRemap['novo'] = 'pob';
    renderRemapRules();
  });

  // Reset remap rules
  btnResetRemap.addEventListener('click', () => {
    state.config.languageRemap = {
      'por': 'pob',
      'pt-br': 'pob',
      'pt': 'pob',
      'pt-pt': 'por'
    };
    renderRemapRules();
    updateLivePreview();
    generateManifestUrl();
  });

  // Template input
  templateInput.addEventListener('input', () => {
    updateLivePreview();
    generateManifestUrl();
  });

  // Variable chip clicks
  document.querySelectorAll('.chip-var').forEach(chip => {
    chip.addEventListener('click', () => {
      const variable = chip.getAttribute('data-var');
      templateInput.value += ` ${variable}`;
      updateLivePreview();
      generateManifestUrl();
    });
  });

  // Timeout slider
  timeoutSlider.addEventListener('input', (e) => {
    timeoutValEl.textContent = e.target.value;
    generateManifestUrl();
  });

  // Deduplication toggle
  dedupToggle.addEventListener('change', () => {
    generateManifestUrl();
  });

  // Proxy toggle
  proxyToggle.addEventListener('change', () => {
    generateManifestUrl();
  });

  // Unknown languages toggle
  if (allowUnknownLangToggle) {
    allowUnknownLangToggle.addEventListener('change', () => {
      generateManifestUrl();
    });
  }

  // Generate button
  btnGenerate.addEventListener('click', () => {
    generateManifestUrl();
    btnGenerate.classList.add('btn-stremio');
    setTimeout(() => btnGenerate.classList.remove('btn-stremio'), 300);
  });

  // Copy button
  btnCopyUrl.addEventListener('click', () => {
    navigator.clipboard.writeText(manifestUrlInput.value).then(() => {
      copyTooltip.textContent = 'Copiado!';
      btnCopyUrl.style.color = '#10b981';
      setTimeout(() => {
        copyTooltip.textContent = 'Copiar';
        btnCopyUrl.style.color = '';
      }, 2000);
    });
  });
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
