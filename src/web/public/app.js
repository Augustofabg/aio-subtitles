/**
 * AIO Subtitles — Frontend Application SPA
 * Replicating AIOStreams Visual Patterns & Navigation
 */

// =============================================================================
// 1. Default Configuration & Preset Catalogs
// =============================================================================
const DEFAULT_CONFIG = {
  instanceName: 'AIOSubtitles',
  instanceDesc: 'Agregador e organizador de legendas',
  instanceLogo: 'https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png',
  instanceVersion: 'v1.0.0',
  providers: {
    'opensubtitles-rest': { enabled: true, apiKey: '' },
    'subdl': { enabled: true, apiKey: '' },
    'subsource': { enabled: true },
    'addic7ed': { enabled: true }
  },
  customAddons: [],
  addonFetchingStrategy: 'default',
  providerPriority: [
    'opensubtitles-rest',
    'subdl',
    'subsource',
    'addic7ed'
  ],
  languages: ['pob', 'por', 'eng'],
  allowUnknownLanguages: false,
  languageRemap: {
    'por': 'pob',
    'pt-br': 'pob',
    'pt': 'pob',
    'pt-pt': 'por'
  },
  providerTimeoutMs: 6000,
  deduplication: true,
  deduplicationStrategy: 'both',
  cacheTtlMinutes: 30
};

// Popular marketplace subtitle addons
const MARKETPLACE_ADDONS = [
  {
    id: 'opensubtitles-v3',
    name: 'OpenSubtitles v3',
    manifestUrl: 'https://opensubtitles-v3.strem.io/manifest.json',
    logo: 'https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png',
    description: 'Endpoint clássico comunitário do Stremio para OpenSubtitles com milhares de legendas.'
  },
  {
    id: 'legendasdivx',
    name: 'LegendasDivx.pt',
    manifestUrl: 'https://legendasdivx.strem.fun/manifest.json',
    logo: 'https://i.imgur.com/rN9kXyH.png',
    description: 'Maior comunidade portuguesa de legendas para séries e filmes com alta precisão.'
  },
  {
    id: 'podnapisi',
    name: 'Podnapisi',
    manifestUrl: 'https://podnapisi.strem.fun/manifest.json',
    logo: 'https://i.imgur.com/V7e5p8E.png',
    description: 'Base de dados europeia multilíngue para lançamentos de cinema e streaming.'
  },
  {
    id: 'titlovi',
    name: 'Titlovi Official',
    manifestUrl: 'https://titlovi.strem.fun/manifest.json',
    logo: 'https://titlovi.com/Content/images/favicon.ico',
    description: 'Extenso catálogo comunitário para filmes e séries internacionais.'
  }
];

// Supported languages list with flags and names
const FALLBACK_LANGUAGES = [
  { code: 'pob', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'por', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
  { code: 'eng', name: 'English', flag: '🇺🇸' },
  { code: 'spa', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fra', name: 'French', flag: '🇫🇷' },
  { code: 'deu', name: 'German', flag: '🇩🇪' },
  { code: 'ita', name: 'Italian', flag: '🇮🇹' },
  { code: 'jpn', name: 'Japanese', flag: '🇯🇵' },
  { code: 'kor', name: 'Korean', flag: '🇰🇷' },
  { code: 'zho', name: 'Chinese', flag: '🇨🇳' },
  { code: 'rus', name: 'Russian', flag: '🇷🇺' },
  { code: 'ara', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hin', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tur', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pol', name: 'Polish', flag: '🇵🇱' },
  { code: 'nld', name: 'Dutch', flag: '🇳🇱' },
  { code: 'swe', name: 'Swedish', flag: '🇸🇪' },
  { code: 'nor', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'dan', name: 'Danish', flag: '🇩🇰' },
  { code: 'fin', name: 'Finnish', flag: '🇫🇮' },
  { code: 'ell', name: 'Greek', flag: '🇬🇷' },
  { code: 'heb', name: 'Hebrew', flag: '🇮🇱' }
];

// =============================================================================
// 2. Application State
// =============================================================================
const PAGES_ORDER = ['home', 'services', 'addons', 'filters', 'settings'];

const state = {
  activePage: 'home',
  activeSubtab: 'installed',
  config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  initialConfig: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  languagesList: FALLBACK_LANGUAGES,
  draftsEnabled: localStorage.getItem('aiosubtitles_no_drafts') !== 'true'
};

// =============================================================================
// 3. Initialization
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupTopbarActions();
  setupHomeActions();
  setupServicesActions();
  setupAddonsActions();
  setupFiltersActions();
  setupSettingsActions();
  setupModals();

  // Load configuration from URL or draft
  await loadInitialConfiguration();

  // Fetch server languages
  try {
    const res = await fetch('/api/languages');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.languages) && data.languages.length > 0) {
        state.languagesList = data.languages;
      }
    }
  } catch {
    // Keep fallback list
  }

  // Initial render of all views
  renderAll();
  updateUnsavedStatus();
});

// =============================================================================
// 4. Configuration Loading & URL Helpers
// =============================================================================
async function loadInitialConfiguration() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let encodedConfig = null;

  // Path format: /:config/configure or /configure
  if (pathParts.length >= 2 && pathParts[1] === 'configure') {
    encodedConfig = pathParts[0];
  }

  if (encodedConfig && encodedConfig !== 'configure') {
    try {
      const decoded = decodeBase64UrlJson(encodedConfig);
      if (decoded && typeof decoded === 'object') {
        state.config = mergeConfig(state.config, decoded);
        state.initialConfig = JSON.parse(JSON.stringify(state.config));
        showToast('Configuração carregada da URL com sucesso!');
        return;
      }
    } catch (e) {
      console.error('Failed to decode config from URL', e);
    }
  }

  // Load from local draft if enabled
  if (state.draftsEnabled) {
    const savedDraft = localStorage.getItem('aiosubtitles_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        state.config = mergeConfig(state.config, parsed);
        state.initialConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        return;
      } catch (e) {
        console.error('Failed to load draft from localStorage', e);
      }
    }
  }

  // Default clean state
  state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  state.initialConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function mergeConfig(base, incoming) {
  const merged = { ...base, ...incoming };
  if (incoming.providers) {
    merged.providers = { ...base.providers, ...incoming.providers };
  }
  if (incoming.languageRemap) {
    merged.languageRemap = { ...base.languageRemap, ...incoming.languageRemap };
  }
  if (Array.isArray(incoming.customAddons)) {
    merged.customAddons = incoming.customAddons;
  }
  if (Array.isArray(incoming.providerPriority)) {
    merged.providerPriority = incoming.providerPriority;
  }
  if (Array.isArray(incoming.languages)) {
    merged.languages = incoming.languages;
  }
  return merged;
}

function encodeBase64Url(obj) {
  const json = JSON.stringify(obj);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlJson(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const json = decodeURIComponent(escape(atob(base64)));
  return JSON.parse(json);
}

function getFinalManifestUrl() {
  const encoded = encodeBase64Url(state.config);
  const origin = window.location.origin;
  return `${origin}/${encoded}/manifest.json`;
}

// =============================================================================
// 5. Navigation & View Routing
// =============================================================================
function setupNavigation() {
  const navButtons = document.querySelectorAll('.sidebar-nav .nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      navigateToPage(page);
    });
  });
}

function navigateToPage(pageName) {
  if (!PAGES_ORDER.includes(pageName)) return;

  state.activePage = pageName;

  // Update sidebar active buttons
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });

  // Update page view displays
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.toggle('active', view.id === `page-${pageName}`);
  });

  // Re-render specifics
  if (pageName === 'home') renderHomeStats();
  if (pageName === 'addons') renderInstalledAddons();
  if (pageName === 'filters') {
    renderLanguageChips();
    renderRemapTable();
    renderPriorityList();
  }
  if (pageName === 'settings') updateManifestOutput();

  // Scroll to top of content
  const content = document.querySelector('.content-container');
  if (content) content.scrollTop = 0;
}

// =============================================================================
// 6. Topbar & Wizard Controls
// =============================================================================
function setupTopbarActions() {
  // Restore button
  document.getElementById('btn-restore').addEventListener('click', () => {
    state.config = JSON.parse(JSON.stringify(state.initialConfig));
    saveDraft();
    renderAll();
    updateUnsavedStatus();
    showToast('Configuração restaurada!');
  });

  // Discard button
  document.getElementById('btn-discard').addEventListener('click', () => {
    if (confirm('Tem certeza de que deseja descartar todas as alterações e redefinir para o padrão?')) {
      state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      localStorage.removeItem('aiosubtitles_draft');
      renderAll();
      updateUnsavedStatus();
      showToast('Configurações redefinidas para o padrão.');
    }
  });

  // Don't keep drafts toggle
  const draftToggle = document.getElementById('toggle-no-drafts');
  draftToggle.checked = !state.draftsEnabled;
  draftToggle.addEventListener('change', () => {
    state.draftsEnabled = !draftToggle.checked;
    localStorage.setItem('aiosubtitles_no_drafts', draftToggle.checked ? 'true' : 'false');
    if (!state.draftsEnabled) {
      localStorage.removeItem('aiosubtitles_draft');
    } else {
      saveDraft();
    }
  });

  // Previous button
  document.getElementById('btn-prev').addEventListener('click', () => {
    const currentIndex = PAGES_ORDER.indexOf(state.activePage);
    if (currentIndex > 0) {
      navigateToPage(PAGES_ORDER[currentIndex - 1]);
    }
  });

  // Next button
  document.getElementById('btn-next').addEventListener('click', () => {
    const currentIndex = PAGES_ORDER.indexOf(state.activePage);
    if (currentIndex < PAGES_ORDER.length - 1) {
      navigateToPage(PAGES_ORDER[currentIndex + 1]);
    }
  });

  // Topbar Save & Install
  document.getElementById('btn-topbar-save').addEventListener('click', () => {
    commitSaveAndInstall();
  });

  // Sign out (visual)
  document.getElementById('btn-signout').addEventListener('click', () => {
    showToast('Sessão limpa.');
  });
}

function commitSaveAndInstall() {
  state.initialConfig = JSON.parse(JSON.stringify(state.config));
  saveDraft();
  updateUnsavedStatus();
  navigateToPage('settings');
  updateManifestOutput();
  showToast('Configuração salva com sucesso!');
}

function isConfigDirty() {
  return JSON.stringify(state.config) !== JSON.stringify(state.initialConfig);
}

function updateUnsavedStatus() {
  const pill = document.getElementById('status-pill');
  const text = document.getElementById('status-text');
  const dirty = isConfigDirty();

  if (dirty) {
    pill.classList.remove('clean');
    pill.classList.add('dirty');
    text.textContent = 'Unsaved changes';
  } else {
    pill.classList.remove('dirty');
    pill.classList.add('clean');
    text.textContent = 'All changes saved';
  }
}

function markModified() {
  updateUnsavedStatus();
  saveDraft();
}

function saveDraft() {
  if (state.draftsEnabled) {
    localStorage.setItem('aiosubtitles_draft', JSON.stringify(state.config));
  }
}

// =============================================================================
// 7. Page 1: Home (Instance Branding) Actions
// =============================================================================
function setupHomeActions() {
  // Inline edit triggers branding modal
  document.getElementById('btn-edit-instance-name').addEventListener('click', openBrandingModal);
  document.getElementById('btn-edit-instance-desc').addEventListener('click', openBrandingModal);
  document.getElementById('btn-change-logo').addEventListener('click', openBrandingModal);

  document.getElementById('btn-continue-setup').addEventListener('click', () => {
    navigateToPage('services');
  });

  document.getElementById('btn-home-save-install').addEventListener('click', () => {
    commitSaveAndInstall();
  });
}

function renderHome() {
  document.getElementById('home-instance-name').textContent = state.config.instanceName || 'AIOSubtitles';
  document.getElementById('home-instance-desc').textContent = state.config.instanceDesc || 'Agregador e organizador de legendas';
  document.getElementById('home-instance-version').textContent = state.config.instanceVersion || 'v1.0.0';
  document.getElementById('home-logo-img').src = state.config.instanceLogo || 'https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png';
  renderHomeStats();
}

function renderHomeStats() {
  const activeServices = Object.values(state.config.providers).filter(p => p.enabled !== false).length;
  const installedAddons = state.config.customAddons.filter(a => a.enabled !== false).length;
  
  document.getElementById('stat-active-services').textContent = `${activeServices} Ativos`;
  document.getElementById('stat-active-addons').textContent = `${installedAddons} Instalados`;
  document.getElementById('stat-active-langs').textContent = (state.config.languages || []).map(l => l.toUpperCase()).slice(0, 4).join(', ') || 'Todos';

  const dedupStatus = state.config.deduplication
    ? `Ativada (${state.config.deduplicationStrategy === 'hash' ? 'Hash' : state.config.deduplicationStrategy === 'fuzzy' ? 'Fuzzy' : 'Ambos'})`
    : 'Desativada';
  document.getElementById('stat-dedup-status').textContent = dedupStatus;
}

// =============================================================================
// 8. Page 2: Services Actions
// =============================================================================
function setupServicesActions() {
  // OpenSubtitles REST toggle & key
  const osToggle = document.getElementById('svc-toggle-opensubtitles-rest');
  const osKey = document.getElementById('svc-key-opensubtitles-rest');
  osToggle.addEventListener('change', () => {
    state.config.providers['opensubtitles-rest'].enabled = osToggle.checked;
    markModified();
    renderHomeStats();
  });
  osKey.addEventListener('input', () => {
    state.config.providers['opensubtitles-rest'].apiKey = osKey.value.trim();
    markModified();
  });

  // Test OpenSubtitles REST connection
  document.getElementById('btn-test-opensubtitles').addEventListener('click', async () => {
    const key = osKey.value.trim();
    const hint = document.getElementById('hint-opensubtitles-test');
    if (!key) {
      hint.textContent = '❌ Por favor, digite uma API Key antes de testar.';
      hint.style.color = '#ef4444';
      return;
    }

    hint.textContent = '⏳ Testando conexão com OpenSubtitles.com...';
    hint.style.color = '#38bdf8';

    try {
      const res = await fetch('/api/test-connection/opensubtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        hint.textContent = `✅ ${data.message}`;
        hint.style.color = '#34d399';
      } else {
        hint.textContent = `❌ ${data.error || 'Chave de API inválida'}`;
        hint.style.color = '#ef4444';
      }
    } catch (e) {
      hint.textContent = `❌ Erro de rede ao testar: ${e.message}`;
      hint.style.color = '#ef4444';
    }
  });

  // SubDL toggle & key
  const subdlToggle = document.getElementById('svc-toggle-subdl');
  const subdlKey = document.getElementById('svc-key-subdl');
  subdlToggle.addEventListener('change', () => {
    state.config.providers['subdl'].enabled = subdlToggle.checked;
    markModified();
    renderHomeStats();
  });
  subdlKey.addEventListener('input', () => {
    state.config.providers['subdl'].apiKey = subdlKey.value.trim();
    markModified();
  });

  // Subsource toggle
  const subsourceToggle = document.getElementById('svc-toggle-subsource');
  subsourceToggle.addEventListener('change', () => {
    state.config.providers['subsource'].enabled = subsourceToggle.checked;
    markModified();
    renderHomeStats();
  });

  // Addic7ed toggle
  const addic7edToggle = document.getElementById('svc-toggle-addic7ed');
  addic7edToggle.addEventListener('change', () => {
    state.config.providers['addic7ed'].enabled = addic7edToggle.checked;
    markModified();
    renderHomeStats();
  });
}

function renderServices() {
  document.getElementById('svc-toggle-opensubtitles-rest').checked = state.config.providers['opensubtitles-rest']?.enabled !== false;
  document.getElementById('svc-key-opensubtitles-rest').value = state.config.providers['opensubtitles-rest']?.apiKey || '';

  document.getElementById('svc-toggle-subdl').checked = state.config.providers['subdl']?.enabled !== false;
  document.getElementById('svc-key-subdl').value = state.config.providers['subdl']?.apiKey || '';

  document.getElementById('svc-toggle-subsource').checked = state.config.providers['subsource']?.enabled !== false;
  document.getElementById('svc-toggle-addic7ed').checked = state.config.providers['addic7ed']?.enabled !== false;
}

// =============================================================================
// 9. Page 3: Addons Actions (Import & Marketplace)
// =============================================================================
function setupAddonsActions() {
  // Tabs (Installed vs Marketplace)
  const subtabBtns = document.querySelectorAll('.subtab-btn');
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.subtab;
      subtabBtns.forEach(b => b.classList.toggle('active', b.dataset.subtab === tab));
      document.querySelectorAll('.subtab-content').forEach(c => c.classList.toggle('active', c.id === `subtab-${tab}`));
      state.activeSubtab = tab;
      if (tab === 'marketplace') renderMarketplace();
    });
  });

  // Import button
  document.getElementById('btn-import-manifest').addEventListener('click', async () => {
    const input = document.getElementById('input-manifest-url');
    const msg = document.getElementById('import-validation-msg');
    let url = input.value.trim();

    if (!url) {
      msg.textContent = 'Por favor, insira a URL do manifest.json';
      msg.className = 'validation-feedback error';
      return;
    }

    msg.textContent = '⏳ Validando e importando manifest...';
    msg.className = 'validation-feedback';
    msg.style.display = 'block';

    try {
      const res = await fetch('/api/manifest/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        // Add to customAddons
        const exists = state.config.customAddons.find(a => a.manifestUrl === data.manifestUrl);
        if (exists) {
          msg.textContent = `O addon "${data.name}" já está instalado!`;
          msg.className = 'validation-feedback';
          return;
        }

        state.config.customAddons.push({
          id: data.id,
          name: data.name,
          manifestUrl: data.manifestUrl,
          logo: data.logo,
          description: data.description,
          enabled: true
        });

        // Add to priority if not present
        if (!state.config.providerPriority.includes(data.id)) {
          state.config.providerPriority.push(data.id);
        }

        input.value = '';
        msg.textContent = `✅ Addon "${data.name}" adicionado com sucesso!`;
        msg.className = 'validation-feedback success';
        markModified();
        renderInstalledAddons();
        renderHomeStats();
      } else {
        msg.textContent = `❌ ${data.error || 'Erro ao validar o manifest.'}`;
        msg.className = 'validation-feedback error';
      }
    } catch (e) {
      msg.textContent = `❌ Erro de conexão ao validar manifest: ${e.message}`;
      msg.className = 'validation-feedback error';
    }
  });

  // Search installed addons
  document.getElementById('search-installed-addons').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderInstalledAddons(term);
  });

  // Fetching strategy dropdown
  const stratSelect = document.getElementById('select-fetching-strategy');
  stratSelect.addEventListener('change', () => {
    state.config.addonFetchingStrategy = stratSelect.value;
    markModified();
  });
}

function renderInstalledAddons(searchTerm = '') {
  const container = document.getElementById('installed-addons-list');
  const countBadge = document.getElementById('installed-count-badge');
  container.innerHTML = '';

  const addons = state.config.customAddons || [];
  countBadge.textContent = addons.length;

  const filtered = searchTerm
    ? addons.filter(a => a.name.toLowerCase().includes(searchTerm) || a.manifestUrl.toLowerCase().includes(searchTerm))
    : addons;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-addons-hint">
        Nenhum addon externo importado ainda. Cole a URL de manifest acima para adicionar!
      </div>
    `;
    return;
  }

  filtered.forEach(addon => {
    const card = document.createElement('div');
    card.className = 'addon-card-row';
    card.innerHTML = `
      <div class="addon-info-col">
        <div class="addon-icon-box">
          <img src="${addon.logo || 'https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png'}" alt="logo">
        </div>
        <div class="addon-text-meta">
          <div class="addon-name-title">${escapeHtml(addon.name)}</div>
          <div class="addon-url-preview" title="${escapeHtml(addon.manifestUrl)}">${escapeHtml(addon.manifestUrl)}</div>
        </div>
      </div>
      <div class="addon-actions-col">
        <button class="icon-action-btn btn-copy-url" title="Copiar URL completa">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="icon-action-btn btn-edit-addon" title="Configurar addon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        <button class="icon-action-btn danger btn-delete-addon" title="Excluir addon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
        <label class="switch">
          <input type="checkbox" class="toggle-addon-active" ${addon.enabled !== false ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
    `;

    // Copy URL
    card.querySelector('.btn-copy-url').addEventListener('click', () => {
      navigator.clipboard.writeText(addon.manifestUrl);
      showToast('URL copiada para a área de transferência!');
    });

    // Edit addon
    card.querySelector('.btn-edit-addon').addEventListener('click', () => {
      openEditAddonModal(addon);
    });

    // Delete addon
    card.querySelector('.btn-delete-addon').addEventListener('click', () => {
      if (confirm(`Remover "${addon.name}" dos addons instalados?`)) {
        state.config.customAddons = state.config.customAddons.filter(a => a.id !== addon.id);
        state.config.providerPriority = state.config.providerPriority.filter(p => p !== addon.id);
        markModified();
        renderInstalledAddons();
        renderHomeStats();
        showToast(`Addon "${addon.name}" removido.`);
      }
    });

    // Toggle on/off
    card.querySelector('.toggle-addon-active').addEventListener('change', (e) => {
      addon.enabled = e.target.checked;
      markModified();
      renderHomeStats();
    });

    container.appendChild(card);
  });
}

function renderMarketplace() {
  const container = document.getElementById('marketplace-grid');
  container.innerHTML = '';

  MARKETPLACE_ADDONS.forEach(item => {
    const isInstalled = state.config.customAddons.some(a => a.manifestUrl === item.manifestUrl);
    const card = document.createElement('div');
    card.className = 'market-card';
    card.innerHTML = `
      <div class="market-card-top">
        <div class="market-icon">
          <img src="${item.logo}" alt="logo">
        </div>
        <div class="market-info">
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.description)}</p>
        </div>
      </div>
      <div class="market-card-bottom">
        <button class="btn ${isInstalled ? 'btn-outline' : 'btn-primary'} btn-sm btn-install-market" ${isInstalled ? 'disabled' : ''}>
          ${isInstalled ? '✓ Já Instalado' : '+ Adicionar aos Instalados'}
        </button>
      </div>
    `;

    if (!isInstalled) {
      card.querySelector('.btn-install-market').addEventListener('click', () => {
        state.config.customAddons.push({
          id: item.id,
          name: item.name,
          manifestUrl: item.manifestUrl,
          logo: item.logo,
          description: item.description,
          enabled: true
        });

        if (!state.config.providerPriority.includes(item.id)) {
          state.config.providerPriority.push(item.id);
        }

        markModified();
        renderInstalledAddons();
        renderHomeStats();
        renderMarketplace();
        showToast(`Addon "${item.name}" instalado com sucesso!`);
      });
    }

    container.appendChild(card);
  });
}

// =============================================================================
// 10. Page 4: Filters Actions
// =============================================================================
function setupFiltersActions() {
  // Search languages
  document.getElementById('search-languages').addEventListener('input', (e) => {
    renderLanguageChips(e.target.value.toLowerCase());
  });

  // Quick select PT / EN
  document.getElementById('btn-quick-pt-en').addEventListener('click', () => {
    state.config.languages = ['pob', 'por', 'eng'];
    markModified();
    renderLanguageChips();
    renderHomeStats();
  });

  // Clear languages
  document.getElementById('btn-clear-langs').addEventListener('click', () => {
    state.config.languages = [];
    markModified();
    renderLanguageChips();
    renderHomeStats();
  });

  // Add remap rule
  document.getElementById('btn-add-remap').addEventListener('click', () => {
    const fromInput = document.getElementById('input-remap-from');
    const toInput = document.getElementById('input-remap-to');
    const from = fromInput.value.trim().toLowerCase();
    const to = toInput.value.trim().toLowerCase();

    if (!from || !to) {
      showToast('Preencha os dois códigos (De e Para).');
      return;
    }

    state.config.languageRemap[from] = to;
    fromInput.value = '';
    toInput.value = '';
    markModified();
    renderRemapTable();
  });

  // Deduplication toggle
  const dedupToggle = document.getElementById('toggle-deduplication');
  dedupToggle.addEventListener('change', () => {
    state.config.deduplication = dedupToggle.checked;
    markModified();
    renderHomeStats();
  });

  // Deduplication strategy
  const dedupStrategy = document.getElementById('select-dedup-strategy');
  dedupStrategy.addEventListener('change', () => {
    state.config.deduplicationStrategy = dedupStrategy.value;
    markModified();
    renderHomeStats();
  });

  // Timeout slider
  const timeoutSlider = document.getElementById('timeout-slider');
  const timeoutDisplay = document.getElementById('timeout-display');
  timeoutSlider.addEventListener('input', () => {
    const val = Number(timeoutSlider.value);
    state.config.providerTimeoutMs = val;
    timeoutDisplay.textContent = `${val} ms (${(val / 1000).toFixed(1)}s)`;
    markModified();
  });
}

function renderLanguageChips(filterTerm = '') {
  const container = document.getElementById('language-chips-container');
  container.innerHTML = '';

  const list = state.languagesList || FALLBACK_LANGUAGES;
  const filtered = filterTerm
    ? list.filter(l => l.name.toLowerCase().includes(filterTerm) || l.code.toLowerCase().includes(filterTerm))
    : list;

  filtered.forEach(lang => {
    const isSelected = state.config.languages.includes(lang.code);
    const chip = document.createElement('div');
    chip.className = `lang-chip ${isSelected ? 'selected' : ''}`;
    chip.innerHTML = `
      <div class="lang-chip-content">
        <span class="lang-flag">${lang.flag || '🌐'}</span>
        <span>${escapeHtml(lang.name)}</span>
      </div>
      <span class="lang-code-tag">${lang.code.toUpperCase()}</span>
    `;

    chip.addEventListener('click', () => {
      if (isSelected) {
        state.config.languages = state.config.languages.filter(c => c !== lang.code);
      } else {
        state.config.languages.push(lang.code);
      }
      markModified();
      renderLanguageChips(filterTerm);
      renderHomeStats();
    });

    container.appendChild(chip);
  });
}

function renderRemapTable() {
  const tbody = document.getElementById('remap-table-body');
  tbody.innerHTML = '';

  const remapRules = Object.entries(state.config.languageRemap || {});
  if (remapRules.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="color: var(--text-muted); text-align: center; padding: 16px;">Nenhuma regra configurada.</td></tr>`;
    return;
  }

  remapRules.forEach(([from, to]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="code-pill">${escapeHtml(from)}</span></td>
      <td><span class="arrow-symbol">→</span></td>
      <td><span class="code-pill">${escapeHtml(to)}</span></td>
      <td>
        <button class="icon-action-btn danger btn-del-rule" title="Remover regra">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;

    tr.querySelector('.btn-del-rule').addEventListener('click', () => {
      delete state.config.languageRemap[from];
      markModified();
      renderRemapTable();
    });

    tbody.appendChild(tr);
  });
}

function renderPriorityList() {
  const container = document.getElementById('priority-list-container');
  container.innerHTML = '';

  // Consolidate all available providers and addons
  const allAvailable = [];

  // Native providers
  Object.keys(state.config.providers).forEach(id => {
    const provNames = {
      'opensubtitles-rest': 'OpenSubtitles REST',
      'subdl': 'SubDL',
      'subsource': 'Subsource',
      'addic7ed': 'Addic7ed'
    };
    allAvailable.push({ id, name: provNames[id] || id, type: 'Nativo' });
  });

  // Custom addons
  (state.config.customAddons || []).forEach(a => {
    allAvailable.push({ id: a.id, name: a.name, type: 'Addon Externo' });
  });

  // Ensure all are in state.config.providerPriority
  allAvailable.forEach(p => {
    if (!state.config.providerPriority.includes(p.id)) {
      state.config.providerPriority.push(p.id);
    }
  });

  // Sort by providerPriority
  const sorted = state.config.providerPriority
    .map(id => allAvailable.find(a => a.id === id))
    .filter(Boolean);

  sorted.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'priority-item-row';
    row.innerHTML = `
      <div class="priority-left-col">
        <span class="priority-rank-badge">${index + 1}º</span>
        <span class="priority-name">${escapeHtml(item.name)}</span>
        <span class="badge ${item.type === 'Nativo' ? 'badge-success' : 'badge-warning'}">${item.type}</span>
      </div>
      <div class="priority-actions-col">
        <button class="icon-action-btn btn-move-up" ${index === 0 ? 'disabled' : ''} title="Subir prioridade">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
        <button class="icon-action-btn btn-move-down" ${index === sorted.length - 1 ? 'disabled' : ''} title="Descer prioridade">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    `;

    row.querySelector('.btn-move-up').addEventListener('click', () => {
      if (index > 0) {
        const temp = state.config.providerPriority[index];
        state.config.providerPriority[index] = state.config.providerPriority[index - 1];
        state.config.providerPriority[index - 1] = temp;
        markModified();
        renderPriorityList();
      }
    });

    row.querySelector('.btn-move-down').addEventListener('click', () => {
      if (index < sorted.length - 1) {
        const temp = state.config.providerPriority[index];
        state.config.providerPriority[index] = state.config.providerPriority[index + 1];
        state.config.providerPriority[index + 1] = temp;
        markModified();
        renderPriorityList();
      }
    });

    container.appendChild(row);
  });
}

function renderFilters() {
  renderLanguageChips();
  renderRemapTable();
  renderPriorityList();

  document.getElementById('toggle-deduplication').checked = state.config.deduplication !== false;
  document.getElementById('select-dedup-strategy').value = state.config.deduplicationStrategy || 'both';

  const timeoutVal = state.config.providerTimeoutMs || 6000;
  document.getElementById('timeout-slider').value = timeoutVal;
  document.getElementById('timeout-display').textContent = `${timeoutVal} ms (${(timeoutVal / 1000).toFixed(1)}s)`;
}

// =============================================================================
// 11. Page 5: Settings & Installation Actions
// =============================================================================
function setupSettingsActions() {
  // Copy Manifest URL
  document.getElementById('btn-copy-manifest').addEventListener('click', () => {
    const input = document.getElementById('final-manifest-url');
    navigator.clipboard.writeText(input.value);
    showToast('Manifest URL copiada com sucesso!');
  });

  // Open Nuvio QR modal
  document.getElementById('btn-open-nuvio-modal').addEventListener('click', () => {
    openNuvioModal();
  });

  // Cache TTL slider
  const cacheSlider = document.getElementById('cache-ttl-slider');
  const cacheDisplay = document.getElementById('cache-ttl-display');
  cacheSlider.addEventListener('input', () => {
    state.config.cacheTtlMinutes = Number(cacheSlider.value);
    cacheDisplay.textContent = `${cacheSlider.value} minutos`;
    markModified();
  });

  // Export JSON
  document.getElementById('btn-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiosubtitles-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo de configuração exportado!');
  });

  // Import JSON
  const fileInput = document.getElementById('file-input-json');
  document.getElementById('btn-import-json').addEventListener('click', () => {
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        state.config = mergeConfig(state.config, imported);
        markModified();
        renderAll();
        showToast('Configuração importada com sucesso!');
      } catch (err) {
        alert('Arquivo JSON inválido!');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

function updateManifestOutput() {
  const url = getFinalManifestUrl();
  const input = document.getElementById('final-manifest-url');
  const linkStremio = document.getElementById('link-install-stremio');

  input.value = url;
  const stremioDeepLink = url.replace(/^https?:\/\//i, 'stremio://');
  linkStremio.href = stremioDeepLink;
}

// =============================================================================
// 12. Modals (Branding, Nuvio QR, Edit Addon)
// =============================================================================
function setupModals() {
  // Close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    });
  });

  // Done Nuvio
  document.getElementById('btn-done-nuvio').addEventListener('click', () => {
    document.getElementById('modal-nuvio').classList.remove('open');
  });

  // Cancel Branding
  document.getElementById('btn-cancel-branding').addEventListener('click', () => {
    document.getElementById('modal-branding').classList.remove('open');
  });

  // Save Branding
  document.getElementById('btn-save-branding').addEventListener('click', () => {
    state.config.instanceName = document.getElementById('modal-input-name').value.trim() || 'AIOSubtitles';
    state.config.instanceDesc = document.getElementById('modal-input-desc').value.trim() || 'Agregador e organizador de legendas';
    state.config.instanceLogo = document.getElementById('modal-input-logo').value.trim() || 'https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png';
    state.config.instanceVersion = document.getElementById('modal-input-version').value.trim() || 'v1.0.0';

    markModified();
    renderHome();
    document.getElementById('modal-branding').classList.remove('open');
    showToast('Branding da instância atualizado!');
  });

  // Cancel Edit Addon
  document.getElementById('btn-cancel-edit-addon').addEventListener('click', () => {
    document.getElementById('modal-edit-addon').classList.remove('open');
  });

  // Save Edit Addon
  document.getElementById('btn-save-edit-addon').addEventListener('click', () => {
    const id = document.getElementById('edit-addon-id').value;
    const name = document.getElementById('edit-addon-name').value.trim();
    const url = document.getElementById('edit-addon-url').value.trim();

    const target = state.config.customAddons.find(a => a.id === id);
    if (target) {
      target.name = name || target.name;
      target.manifestUrl = url || target.manifestUrl;
      markModified();
      renderInstalledAddons();
      showToast('Addon atualizado!');
    }
    document.getElementById('modal-edit-addon').classList.remove('open');
  });
}

function openBrandingModal() {
  document.getElementById('modal-input-name').value = state.config.instanceName || '';
  document.getElementById('modal-input-desc').value = state.config.instanceDesc || '';
  document.getElementById('modal-input-logo').value = state.config.instanceLogo || '';
  document.getElementById('modal-input-version').value = state.config.instanceVersion || '';
  document.getElementById('modal-branding').classList.add('open');
}

function openEditAddonModal(addon) {
  document.getElementById('edit-addon-id').value = addon.id;
  document.getElementById('edit-addon-name').value = addon.name;
  document.getElementById('edit-addon-url').value = addon.manifestUrl;
  document.getElementById('modal-edit-addon').classList.add('open');
}

function openNuvioModal() {
  const url = getFinalManifestUrl();
  const box = document.getElementById('qr-code-box');
  box.innerHTML = '';

  const canvas = document.createElement('canvas');
  box.appendChild(canvas);

  if (window.QRCode) {
    QRCode.toCanvas(canvas, url, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
  } else {
    box.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">URL: ${escapeHtml(url)}</p>`;
  }

  document.getElementById('modal-nuvio').classList.add('open');
}

// =============================================================================
// 13. Global Render & Utilities
// =============================================================================
function renderAll() {
  renderHome();
  renderServices();
  renderInstalledAddons();
  renderFilters();
  updateManifestOutput();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
