/**
 * AIOSubtitles — Frontend Application SPA
 * Following AIOStreams Visual and Logical Standards
 */

// =============================================================================
// =============================================================================
// Material Design Icons Constants (Standardized Icon System)
// =============================================================================
const MDI_ICONS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>',
  check16: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>',
  plus16: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>',
  close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>',
  close16: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>',
  closeSm: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>',
  pencil: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/></svg>',
  copySm: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/></svg>',
  drag: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z"/></svg>',
  arrowUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z"/></svg>',
  arrowDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z"/></svg>',
  arrowRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/></svg>',
  puzzle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5,11H19V7C19,5.89 18.1,5 17,5H13V3.5A2.5,2.5 0 0,0 10.5,1A2.5,2.5 0 0,0 8,3.5V5H4A2,2 0 0,0 2,7V10.8H3.5C5,10.8 6.2,12 6.2,13.5C6.2,15 5,16.2 3.5,16.2H2V20A2,2 0 0,0 4,22H7.8V20.5C7.8,19 9,17.8 10.5,17.8C12,17.8 13.2,19 13.2,20.5V22H17A2,2 0 0,0 19,20V16H20.5A2.5,2.5 0 0,0 23,13.5A2.5,2.5 0 0,0 20.5,11Z"/></svg>'
};

// 1. Default Configuration & Services Metadata
// =============================================================================
const DEFAULT_CONFIG = {
  instanceName: 'AIOSubtitles',
  instanceDesc: 'Agregador e organizador de legendas',
  instanceLogo: 'https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png',
  instanceVersion: 'v1.0.0',
  providers: {
    'opensubtitles': { enabled: false, apiKey: '' },
    'subdl': { enabled: false, apiKey: '' },
    'subsource': { enabled: false, apiKey: '' }
  },
  customAddons: [],
  addonFetchingStrategy: 'default',
  providerPriority: [
    'opensubtitles',
    'subdl',
    'subsource'
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

const SERVICES_META = {
  opensubtitles: {
    id: 'opensubtitles',
    name: 'OpenSubtitles',
    helpText: 'Não tem uma chave? <a href="https://www.opensubtitles.com/users/sign_up" target="_blank" rel="noopener noreferrer">Crie uma conta gratuita no OpenSubtitles.com</a> para obter sua chave.'
  },
  subdl: {
    id: 'subdl',
    name: 'SubDL',
    helpText: 'Não tem uma chave? <a href="https://subdl.com" target="_blank" rel="noopener noreferrer">Crie uma conta gratuita no SubDL</a> para obter sua chave.'
  },
  subsource: {
    id: 'subsource',
    name: 'Subsource',
    helpText: 'Não tem uma chave? <a href="https://subsource.net" target="_blank" rel="noopener noreferrer">Crie uma conta gratuita no Subsource</a> para obter sua chave.'
  }
};

const FALLBACK_LANGUAGES = [
  { code: 'pob', name: 'Portuguese (Brazil)' },
  { code: 'por', name: 'Portuguese (Portugal)' },
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'ita', name: 'Italian' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
  { code: 'zho', name: 'Chinese' },
  { code: 'rus', name: 'Russian' },
  { code: 'ara', name: 'Arabic' },
  { code: 'hin', name: 'Hindi' },
  { code: 'tur', name: 'Turkish' },
  { code: 'pol', name: 'Polish' },
  { code: 'nld', name: 'Dutch' },
  { code: 'swe', name: 'Swedish' },
  { code: 'nor', name: 'Norwegian' },
  { code: 'dan', name: 'Danish' },
  { code: 'fin', name: 'Finnish' },
  { code: 'ell', name: 'Greek' },
  { code: 'heb', name: 'Hebrew' }
];

// =============================================================================
// 2. Application State
// =============================================================================
const PAGES_ORDER = ['home', 'services', 'addons', 'filters', 'install'];

const state = {
  activePage: 'home',
  activeFilterTab: 'whitelist',
  uuid: '',
  password: '',
  config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  lastSavedConfigJson: '',
  languagesList: FALLBACK_LANGUAGES,
  validatedKeys: {}, // { [serviceId]: boolean }
  validationDebounceTimer: null
};

function getNoDraftsSetting() {
  return localStorage.getItem('aiosubtitles_no_drafts') === 'true';
}

function notifyConfigChanged() {
  const isDirty = Boolean(state.lastSavedConfigJson && JSON.stringify(state.config) !== state.lastSavedConfigJson);
  const banner = document.getElementById('unsaved-changes-banner');
  const btnSave = document.getElementById('btn-topbar-save');

  if (banner) {
    if (isDirty) {
      if (banner.style.display === 'none' || banner.classList.contains('banner-leaving')) {
        banner.classList.remove('banner-leaving');
        banner.style.display = 'inline-flex';
      }
    } else {
      if (banner.style.display !== 'none' && !banner.classList.contains('banner-leaving')) {
        banner.classList.add('banner-leaving');
        setTimeout(() => {
          banner.style.display = 'none';
          banner.classList.remove('banner-leaving');
        }, 180);
      }
    }
  }
  if (btnSave) {
    btnSave.classList.toggle('has-unsaved', isDirty);
  }

  if (isDirty) {
    if (!getNoDraftsSetting() && state.uuid) {
      localStorage.setItem(`aiosubtitles_draft_${state.uuid}`, JSON.stringify(state.config));
    }
  } else {
    if (state.uuid) {
      localStorage.removeItem(`aiosubtitles_draft_${state.uuid}`);
    }
  }
}

function setupDynamicPasswordInput(inputId, wrapId, toggleBtnId, showEyeId, hideEyeId, onInputCallback) {
  const input = document.getElementById(inputId);
  const wrap = document.getElementById(wrapId);
  const btn = document.getElementById(toggleBtnId);
  const showEye = document.getElementById(showEyeId);
  const hideEye = document.getElementById(hideEyeId);
  if (!input || !wrap || !btn) return;

  const updateVisibility = () => {
    const hasText = input.value.length > 0;
    wrap.classList.toggle('has-value', hasText);
    btn.style.display = hasText ? 'flex' : 'none';
  };

  input.addEventListener('input', () => {
    updateVisibility();
    if (onInputCallback) onInputCallback(input.value);
  });

  btn.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      if (showEye) showEye.style.display = 'none';
      if (hideEye) hideEye.style.display = 'block';
    } else {
      input.type = 'password';
      if (showEye) showEye.style.display = 'block';
      if (hideEye) hideEye.style.display = 'none';
    }
  });

  updateVisibility();
}

// =============================================================================
// 3. Helper Functions: UUID & Random Password
// =============================================================================
function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateSecurePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let pass = '';
  for (let i = 0; i < 16; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(str) {
  return typeof str === 'string' && UUID_REGEX.test(str.trim());
}

// =============================================================================
// 4. Initialization
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupTopbarActions();
  setupHomeActions();
  setupServicesActions();
  setupAddonsActions();
  setupFiltersActions();
  setupInstallPageActions();
  setupModals();

  await loadInitialConfiguration();

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

  renderAll();
});

// =============================================================================
// 5. Configuration Loading & URL Helpers
// =============================================================================
async function loadInitialConfiguration() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let configParamFromUrl = null;

  if (pathParts.length > 0 && pathParts[0] !== 'configure') {
    configParamFromUrl = pathParts[0];
  }

  // 1. If URL has a UUID
  if (configParamFromUrl && isUuid(configParamFromUrl)) {
    state.uuid = configParamFromUrl.toLowerCase();
    const storedPass = localStorage.getItem(`aiosubtitles_pass_${state.uuid}`) || '';
    if (storedPass) {
      state.password = storedPass;
      try {
        const res = await fetch('/api/config/load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: state.uuid, password: storedPass })
        });
        const data = await res.json();
        if (res.ok && data.success && data.config) {
          applyConfigWithMigration(data.config);
          state.lastSavedConfigJson = JSON.stringify(state.config);
          checkSavedDraft();
          return;
        }
      } catch {
        // Fallback
      }
    } else {
      // UUID in URL but no password in this browser: prompt user to enter password
      state.password = '';
      setTimeout(() => {
        openLoadConfigModal();
      }, 350);
      applyConfigWithMigration(DEFAULT_CONFIG);
      state.lastSavedConfigJson = JSON.stringify(state.config);
      return;
    }
  }

  // 2. Check localStorage for existing UUID
  const localUuid = localStorage.getItem('aiosubtitles_current_uuid');
  if (localUuid && isUuid(localUuid)) {
    state.uuid = localUuid;
    const storedPass = localStorage.getItem(`aiosubtitles_pass_${localUuid}`) || '';
    if (storedPass) {
      state.password = storedPass;
      try {
        const res = await fetch('/api/config/load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: state.uuid, password: storedPass })
        });
        const data = await res.json();
        if (res.ok && data.success && data.config) {
          applyConfigWithMigration(data.config);
          state.lastSavedConfigJson = JSON.stringify(state.config);
          checkSavedDraft();
          return;
        }
      } catch {
        // Fallback
      }
    }
  }

  // 3. Brand new session: generate UUID and Password
  state.uuid = generateUuid();
  state.password = generateSecurePassword();
  localStorage.setItem('aiosubtitles_current_uuid', state.uuid);
  localStorage.setItem(`aiosubtitles_pass_${state.uuid}`, state.password);
  applyConfigWithMigration(DEFAULT_CONFIG);
  state.lastSavedConfigJson = JSON.stringify(state.config);
}

function checkSavedDraft() {
  if (!getNoDraftsSetting() && state.uuid) {
    const draft = localStorage.getItem(`aiosubtitles_draft_${state.uuid}`);
    if (draft && draft !== state.lastSavedConfigJson) {
      notifyConfigChanged();
    }
  }
}

function applyConfigWithMigration(parsed) {
  const merged = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  if (!parsed || typeof parsed !== 'object') {
    state.config = merged;
    return;
  }

  if (parsed.instanceName) merged.instanceName = parsed.instanceName;
  if (parsed.instanceDesc) merged.instanceDesc = parsed.instanceDesc;
  if (parsed.instanceLogo) merged.instanceLogo = parsed.instanceLogo;
  if (parsed.instanceVersion) merged.instanceVersion = parsed.instanceVersion;

  if (parsed.providers && typeof parsed.providers === 'object') {
    for (const [key, val] of Object.entries(parsed.providers)) {
      if (!val || typeof val !== 'object') continue;
      let targetKey = key;
      if (key === 'opensubtitles-rest' || key === 'opensubtitles-v3') {
        targetKey = 'opensubtitles';
      } else if (key === 'addic7ed') {
        continue;
      }
      if (merged.providers[targetKey]) {
        const apiKey = typeof val.apiKey === 'string' ? val.apiKey.trim() : '';
        const hasApiKey = Boolean(apiKey && apiKey.trim() !== '');
        // Rule: service can only be enabled if apiKey exists
        merged.providers[targetKey].enabled = hasApiKey ? (typeof val.enabled === 'boolean' ? val.enabled : false) : false;
        merged.providers[targetKey].apiKey = apiKey;
        if (hasApiKey) {
          state.validatedKeys[targetKey] = true;
        }
      }
    }
  }

  if (Array.isArray(parsed.customAddons)) {
    merged.customAddons = parsed.customAddons.filter(a => a && a.manifestUrl).map(a => ({
      id: a.id || `custom-${Math.random().toString(36).substring(2, 8)}`,
      name: a.name || 'Addon Importado',
      manifestUrl: a.manifestUrl,
      logo: a.logo || '',
      enabled: typeof a.enabled === 'boolean' ? a.enabled : true,
      timeout: typeof a.timeout === 'number' && !isNaN(a.timeout) ? Math.max(1000, Math.min(60000, Math.round(a.timeout))) : 20000,
      resources: Array.isArray(a.resources) ? a.resources : ['subtitles'],
      selectedResources: Array.isArray(a.selectedResources) ? a.selectedResources : ['subtitles'],
      configurable: Boolean(a.configurable),
      configurationURL: a.configurationURL || ''
    }));
  }

  if (Array.isArray(parsed.providerPriority) && parsed.providerPriority.length > 0) {
    const rawPriority = [];
    for (const item of parsed.providerPriority) {
      let mapped = item;
      if (item === 'opensubtitles-rest' || item === 'opensubtitles-v3') {
        mapped = 'opensubtitles';
      }
      if (mapped === 'addic7ed') {
        continue;
      }
      if (!rawPriority.includes(mapped)) {
        rawPriority.push(mapped);
      }
    }
    if (rawPriority.length > 0) {
      merged.providerPriority = rawPriority;
    }
  }

  if (Array.isArray(parsed.languages)) {
    merged.languages = parsed.languages.map(l => String(l).trim().toLowerCase());
  }

  if (typeof parsed.allowUnknownLanguages === 'boolean') {
    merged.allowUnknownLanguages = parsed.allowUnknownLanguages;
  }

  if (parsed.languageRemap && typeof parsed.languageRemap === 'object') {
    merged.languageRemap = { ...parsed.languageRemap };
  }

  if (typeof parsed.providerTimeoutMs === 'number') {
    merged.providerTimeoutMs = parsed.providerTimeoutMs;
  }

  if (typeof parsed.deduplication === 'boolean') {
    merged.deduplication = parsed.deduplication;
  }

  if (parsed.deduplicationStrategy) {
    merged.deduplicationStrategy = parsed.deduplicationStrategy;
  }

  if (typeof parsed.cacheTtlMinutes === 'number') {
    merged.cacheTtlMinutes = parsed.cacheTtlMinutes;
  }

  if (parsed.addonFetchingStrategy) {
    merged.addonFetchingStrategy = parsed.addonFetchingStrategy;
  }

  state.config = merged;
}

// =============================================================================
// 6. Navigation & Topbar
// =============================================================================
function setupNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetPage = item.getAttribute('data-page');
      if (targetPage) {
        navigateToPage(targetPage);
      }
    });
  });

  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  btnPrev?.addEventListener('click', () => {
    const curIdx = PAGES_ORDER.indexOf(state.activePage);
    if (curIdx > 0) {
      navigateToPage(PAGES_ORDER[curIdx - 1]);
    }
  });

  btnNext?.addEventListener('click', () => {
    const curIdx = PAGES_ORDER.indexOf(state.activePage);
    if (curIdx < PAGES_ORDER.length - 1) {
      navigateToPage(PAGES_ORDER[curIdx + 1]);
    }
  });

  document.getElementById('btn-continue-setup')?.addEventListener('click', () => {
    navigateToPage('services');
  });
}

function navigateToPage(pageId) {
  if (!PAGES_ORDER.includes(pageId)) return;
  if (state.activePage === pageId) return;

  const oldIdx = PAGES_ORDER.indexOf(state.activePage);
  const newIdx = PAGES_ORDER.indexOf(pageId);
  const isForward = newIdx >= oldIdx;
  const fadeOutClass = isForward ? 'page-fade-out-left' : 'page-fade-out-right';
  const fadeInClass = isForward ? 'anim-forward' : 'anim-backward';

  const currentView = document.getElementById(`page-${state.activePage}`);
  const targetView = document.getElementById(`page-${pageId}`);

  state.activePage = pageId;

  // Rule 8: Missing Credentials appears ONLY on Services page
  if (pageId !== 'services') {
    hideMissingCredentialsBanner();
  }

  // Update navigation buttons immediately for crisp tactile feedback
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === pageId);
  });

  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if (btnPrev) btnPrev.disabled = newIdx === 0;
  if (btnNext) btnNext.disabled = newIdx === PAGES_ORDER.length - 1;

  if (currentView && currentView !== targetView && currentView.classList.contains('active')) {
    currentView.classList.remove('anim-forward', 'anim-backward', 'page-fade-out-left', 'page-fade-out-right');
    currentView.classList.add(fadeOutClass);

    setTimeout(() => {
      document.querySelectorAll('.page-view').forEach(view => {
        view.classList.remove('page-fade-out-left', 'page-fade-out-right', 'anim-forward', 'anim-backward');
        if (view.id === `page-${pageId}`) {
          view.classList.add('active', fadeInClass);
          setTimeout(() => {
            view.classList.remove('anim-forward', 'anim-backward');
          }, 200);
        } else {
          view.classList.remove('active');
        }
      });

      if (pageId === 'filters') {
        switchFilterTab(state.activeFilterTab || 'whitelist');
      } else if (pageId === 'install') {
        renderInstallPageDetails();
      }
    }, 90);
  } else {
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('page-fade-out-left', 'page-fade-out-right', 'anim-forward', 'anim-backward');
      if (view.id === `page-${pageId}`) {
        view.classList.add('active', fadeInClass);
        setTimeout(() => {
          view.classList.remove('anim-forward', 'anim-backward');
        }, 200);
      } else {
        view.classList.remove('active');
      }
    });

    if (pageId === 'filters') {
      switchFilterTab(state.activeFilterTab || 'whitelist');
    } else if (pageId === 'install') {
      renderInstallPageDetails();
    }
  }
}

function setupTopbarActions() {
  document.getElementById('btn-topbar-save')?.addEventListener('click', () => {
    saveConfigurationAndShowInstall();
  });

  document.getElementById('btn-home-header-save')?.addEventListener('click', () => {
    saveConfigurationAndShowInstall();
  });

  document.getElementById('btn-home-save-install')?.addEventListener('click', () => {
    saveConfigurationAndShowInstall();
  });

  document.getElementById('btn-trigger-load-config')?.addEventListener('click', () => {
    openLoadConfigModal();
  });

  document.getElementById('btn-close-missing-cred')?.addEventListener('click', () => {
    hideMissingCredentialsBanner();
  });

  // Unsaved banner: Restore draft
  document.getElementById('btn-restore-draft')?.addEventListener('click', () => {
    if (state.uuid) {
      const draft = localStorage.getItem(`aiosubtitles_draft_${state.uuid}`);
      if (draft) {
        try {
          applyConfigWithMigration(JSON.parse(draft));
          renderAll();
          notifyConfigChanged();
          showToast('Rascunho restaurado com sucesso.');
          return;
        } catch {
          // ignore
        }
      }
    }
    showToast('Nenhum rascunho anterior disponível.');
  });

  // Unsaved banner: Discard draft
  document.getElementById('btn-discard-draft')?.addEventListener('click', () => {
    if (state.lastSavedConfigJson) {
      applyConfigWithMigration(JSON.parse(state.lastSavedConfigJson));
      if (state.uuid) {
        localStorage.removeItem(`aiosubtitles_draft_${state.uuid}`);
      }
      renderAll();
      notifyConfigChanged();
      showToast('Alterações não salvas descartadas.');
    }
  });

  // Wizard nav: ↺ Reset changes button
  document.getElementById('btn-reset-draft')?.addEventListener('click', () => {
    if (state.lastSavedConfigJson) {
      applyConfigWithMigration(JSON.parse(state.lastSavedConfigJson));
      if (state.uuid) {
        localStorage.removeItem(`aiosubtitles_draft_${state.uuid}`);
      }
      renderAll();
      notifyConfigChanged();
      showToast('Alterações restauradas para a última versão salva.');
    }
  });

  // Toggle "Don't keep drafts on this browser"
  const toggleNoDrafts = document.getElementById('toggle-no-drafts');
  if (toggleNoDrafts) {
    toggleNoDrafts.checked = getNoDraftsSetting();
    toggleNoDrafts.addEventListener('change', (e) => {
      if (e.target.checked) {
        localStorage.setItem('aiosubtitles_no_drafts', 'true');
        if (state.uuid) {
          localStorage.removeItem(`aiosubtitles_draft_${state.uuid}`);
        }
        notifyConfigChanged();
        showToast('Rascunhos desativados neste navegador.');
      } else {
        localStorage.removeItem('aiosubtitles_no_drafts');
        notifyConfigChanged();
        showToast('Rascunhos ativados neste navegador.');
      }
    });
  }
}

// =============================================================================
// 7. Missing Credentials Banner
// =============================================================================
function showMissingCredentialsBanner(servicesList) {
  const banner = document.getElementById('missing-credentials-banner');
  const listEl = document.getElementById('missing-cred-list');
  if (!banner || !listEl) return;

  banner.classList.remove('banner-fade-out');
  listEl.innerHTML = '';
  servicesList.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    listEl.appendChild(li);
  });

  banner.style.display = 'flex';
  banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMissingCredentialsBanner() {
  const banner = document.getElementById('missing-credentials-banner');
  if (!banner || banner.style.display === 'none') return;
  banner.classList.add('banner-fade-out');
  setTimeout(() => {
    banner.style.display = 'none';
    banner.classList.remove('banner-fade-out');
  }, 160);
}

// Generic modal open/close helpers with smooth fade-in & fade-out
function openModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal) return;
  modal.classList.remove('closing');
  modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!modal || !modal.classList.contains('active')) return;
  modal.classList.add('closing');
  setTimeout(() => {
    modal.classList.remove('active', 'closing');
  }, 180);
}

// =============================================================================
// 8. Home Actions
// =============================================================================
function setupHomeActions() {
  document.getElementById('btn-edit-instance-name')?.addEventListener('click', openBrandingModal);
  document.getElementById('btn-edit-instance-desc')?.addEventListener('click', openBrandingModal);
  document.getElementById('btn-change-logo')?.addEventListener('click', openBrandingModal);

  document.getElementById('btn-save-branding')?.addEventListener('click', () => {
    const name = document.getElementById('modal-input-name').value.trim();
    const desc = document.getElementById('modal-input-desc').value.trim();
    const logo = document.getElementById('modal-input-logo').value.trim();
    const ver = document.getElementById('modal-input-version').value.trim();

    if (name) state.config.instanceName = name;
    if (desc) state.config.instanceDesc = desc;
    if (logo) state.config.instanceLogo = logo;
    if (ver) state.config.instanceVersion = ver;

    renderHomeBranding();
    closeBrandingModal();
    notifyConfigChanged();
    showToast('Identidade da instância atualizada.');
  });

  document.getElementById('btn-cancel-branding')?.addEventListener('click', closeBrandingModal);
  document.getElementById('btn-close-branding-modal')?.addEventListener('click', closeBrandingModal);

  // Sign out button
  document.getElementById('btn-home-signout')?.addEventListener('click', () => {
    if (confirm('Deseja realmente reiniciar a sessão local? Uma nova configuração limpa será criada.')) {
      if (state.uuid) {
        localStorage.removeItem(`aiosubtitles_pass_${state.uuid}`);
        localStorage.removeItem(`aiosubtitles_draft_${state.uuid}`);
      }
      localStorage.removeItem('aiosubtitles_current_uuid');
      state.uuid = generateUuid();
      state.password = generateSecurePassword();
      localStorage.setItem('aiosubtitles_current_uuid', state.uuid);
      localStorage.setItem(`aiosubtitles_pass_${state.uuid}`, state.password);
      applyConfigWithMigration(DEFAULT_CONFIG);
      state.lastSavedConfigJson = JSON.stringify(state.config);
      window.history.replaceState(null, '', `/${state.uuid}/configure`);
      renderAll();
      notifyConfigChanged();
      showToast('Nova sessão iniciada com sucesso.');
    }
  });
}

function openBrandingModal() {
  document.getElementById('modal-input-name').value = state.config.instanceName || '';
  document.getElementById('modal-input-desc').value = state.config.instanceDesc || '';
  document.getElementById('modal-input-logo').value = state.config.instanceLogo || '';
  document.getElementById('modal-input-version').value = state.config.instanceVersion || '';
  openModal('modal-branding');
}

function closeBrandingModal() {
  closeModal('modal-branding');
}

function renderHomeBranding() {
  const nameEl = document.getElementById('home-instance-name');
  const descEl = document.getElementById('home-instance-desc');
  const verEl = document.getElementById('home-instance-version');
  const imgEl = document.getElementById('home-logo-img');

  if (nameEl) nameEl.textContent = state.config.instanceName || 'AIOSubtitles';
  if (descEl) descEl.textContent = state.config.instanceDesc || 'Agregador de legendas';
  if (verEl) verEl.textContent = state.config.instanceVersion || 'v1.0.0';
  if (imgEl && state.config.instanceLogo) imgEl.src = state.config.instanceLogo;
}

// =============================================================================
// 9. Services Actions & Rules: OFF by default & Credentials Check
// =============================================================================
function setupServicesActions() {
  const serviceIds = ['opensubtitles', 'subdl', 'subsource'];

  serviceIds.forEach(id => {
    const toggle = document.getElementById(`svc-toggle-${id}`);
    if (toggle) {
      toggle.addEventListener('click', async (e) => {
        // Intercept toggle state change
        const isTurningOn = toggle.checked;

        if (isTurningOn) {
          // Rule: cannot be turned ON without valid API key
          const prov = state.config.providers[id];
          const apiKey = prov?.apiKey?.trim() || '';

          if (!apiKey) {
            // Revert switch to OFF without opening modal (Rule 10, 11)
            e.preventDefault();
            toggle.checked = false;
            prov.enabled = false;
            showMissingCredentialsBanner([SERVICES_META[id]?.name || id]);
            return;
          }

          // If key exists, verify if valid
          if (!state.validatedKeys[id]) {
            e.preventDefault();
            toggle.disabled = true;
            try {
              const res = await fetch(`/api/validate-key/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey })
              });
              const data = await res.json();
              toggle.disabled = false;
              if (data.valid) {
                state.validatedKeys[id] = true;
                toggle.checked = true;
                prov.enabled = true;
                hideMissingCredentialsBanner();
                renderFiltersPriority();
                updateStats();
                notifyConfigChanged();
                showToast(`${SERVICES_META[id]?.name} ativado com sucesso.`);
              } else {
                toggle.checked = false;
                prov.enabled = false;
                showMissingCredentialsBanner([SERVICES_META[id]?.name || id]);
              }
            } catch {
              toggle.disabled = false;
              toggle.checked = false;
              prov.enabled = false;
              showMissingCredentialsBanner([SERVICES_META[id]?.name || id]);
            }
            return;
          }

          // Validated already
          prov.enabled = true;
          hideMissingCredentialsBanner();
          renderFiltersPriority();
          updateStats();
          notifyConfigChanged();
        } else {
          // Turning OFF is always allowed and does not trigger error
          if (!state.config.providers[id]) {
            state.config.providers[id] = { enabled: false, apiKey: '' };
          }
          state.config.providers[id].enabled = false;
          hideMissingCredentialsBanner();
          renderFiltersPriority();
          updateStats();
          notifyConfigChanged();
        }
      });
    }

    // Configure gear button
    const btnGear = document.getElementById(`btn-config-${id}`);
    if (btnGear) {
      btnGear.addEventListener('click', () => {
        openServiceConfigModal(id);
      });
    }
  });

  // Services search filter
  const searchInput = document.getElementById('search-services');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      let matchIdx = 0;
      document.querySelectorAll('#services-list-container .service-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        const matches = text.includes(q);
        if (matches) {
          row.style.display = 'flex';
          row.classList.remove('search-stagger-item');
          void row.offsetWidth; // trigger reflow
          row.classList.add('search-stagger-item');
          row.style.animationDelay = `${Math.min(matchIdx * 15, 120)}ms`;
          matchIdx++;
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // Modal API Key Input with automatic background validation
  const keyInput = document.getElementById('modal-service-key-input');
  if (keyInput) {
    keyInput.addEventListener('input', () => {
      const serviceId = document.getElementById('modal-service-id').value;
      triggerAutoValidation(serviceId, keyInput.value);
    });
  }

  // Eye button to show/hide API key
  const btnEye = document.getElementById('btn-modal-toggle-eye');
  const eyeShow = document.getElementById('eye-icon-show');
  const eyeHide = document.getElementById('eye-icon-hide');
  if (btnEye && keyInput) {
    btnEye.addEventListener('click', () => {
      if (keyInput.type === 'password') {
        keyInput.type = 'text';
        eyeShow.style.display = 'none';
        eyeHide.style.display = 'block';
      } else {
        keyInput.type = 'password';
        eyeShow.style.display = 'block';
        eyeHide.style.display = 'none';
      }
    });
  }

  // Modal Save & Cancel
  document.getElementById('btn-save-service-modal')?.addEventListener('click', () => {
    const serviceId = document.getElementById('modal-service-id').value;
    const newKey = keyInput ? keyInput.value.trim() : '';

    if (!state.config.providers[serviceId]) {
      state.config.providers[serviceId] = { enabled: false, apiKey: '' };
    }
    state.config.providers[serviceId].apiKey = newKey;

    // If key is empty, ensure disabled
    if (!newKey) {
      state.config.providers[serviceId].enabled = false;
      state.validatedKeys[serviceId] = false;
      const toggle = document.getElementById(`svc-toggle-${serviceId}`);
      if (toggle) toggle.checked = false;
    }

    renderFiltersPriority();
    updateStats();
    notifyConfigChanged();
    closeServiceConfigModal();
    showToast(`Configuração de ${SERVICES_META[serviceId]?.name || serviceId} salva.`);
  });

  document.getElementById('btn-cancel-service-modal')?.addEventListener('click', closeServiceConfigModal);
  document.getElementById('btn-close-service-modal')?.addEventListener('click', closeServiceConfigModal);
}

function openServiceConfigModal(serviceId) {
  const meta = SERVICES_META[serviceId];
  if (!meta) return;

  document.getElementById('modal-service-id').value = serviceId;
  document.getElementById('modal-service-title').textContent = `Configure ${meta.name}`;
  document.getElementById('modal-service-hint').innerHTML = meta.helpText;

  const keyInput = document.getElementById('modal-service-key-input');
  const existingKey = state.config.providers[serviceId]?.apiKey || '';
  keyInput.value = existingKey;
  keyInput.type = 'password';

  document.getElementById('eye-icon-show').style.display = 'block';
  document.getElementById('eye-icon-hide').style.display = 'none';

  // Automatically validate existing key if present
  triggerAutoValidation(serviceId, existingKey);

  openModal('modal-service-config');
}

function closeServiceConfigModal() {
  clearTimeout(state.validationDebounceTimer);
  closeModal('modal-service-config');
}

function triggerAutoValidation(serviceId, apiKey) {
  const statusEl = document.getElementById('modal-key-status');
  if (!statusEl) return;

  const trimmed = (apiKey || '').trim();
  if (!trimmed) {
    statusEl.className = 'api-key-validation-indicator';
    statusEl.innerHTML = '';
    statusEl.title = '';
    state.validatedKeys[serviceId] = false;
    return;
  }

  // Show discrete loading spinner
  statusEl.className = 'api-key-validation-indicator loading';
  statusEl.innerHTML = '';
  statusEl.title = 'Validando chave...';

  clearTimeout(state.validationDebounceTimer);
  state.validationDebounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/validate-key/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed })
      });
      const data = await res.json();
      if (data.valid) {
        statusEl.className = 'api-key-validation-indicator valid';
        statusEl.innerHTML = MDI_ICONS.check16;
        statusEl.title = 'API Key válida';
        state.validatedKeys[serviceId] = true;
      } else {
        statusEl.className = 'api-key-validation-indicator invalid';
        statusEl.innerHTML = MDI_ICONS.close16;
        statusEl.title = data.error || 'API Key inválida';
        state.validatedKeys[serviceId] = false;
      }
    } catch {
      statusEl.className = 'api-key-validation-indicator invalid';
      statusEl.innerHTML = MDI_ICONS.close16;
      statusEl.title = 'Erro de conexão na validação';
      state.validatedKeys[serviceId] = false;
    }
  }, 450);
}

function renderServicesState() {
  const serviceIds = ['opensubtitles', 'subdl', 'subsource'];
  serviceIds.forEach(id => {
    const toggle = document.getElementById(`svc-toggle-${id}`);
    if (toggle) {
      const prov = state.config.providers[id];
      toggle.checked = prov ? prov.enabled === true : false;
    }
  });
}

// =============================================================================
// 10. Addons Actions (Imported Only — NO MARKETPLACE)
// =============================================================================
function setupAddonsActions() {
  const btnImport = document.getElementById('btn-import-manifest');
  const inputUrl = document.getElementById('input-manifest-url');
  const feedbackMsg = document.getElementById('import-validation-msg');

  if (btnImport && inputUrl) {
    btnImport.addEventListener('click', async () => {
      const rawUrl = inputUrl.value.trim();
      if (!rawUrl) {
        showImportFeedback('Insira a URL do manifest.json de um addon.', false);
        return;
      }

      btnImport.disabled = true;
      btnImport.textContent = 'Importando...';
      feedbackMsg.textContent = '';

      try {
        const res = await fetch('/api/manifest/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl })
        });
        const data = await res.json();

        if (!res.ok || !data.valid) {
          showImportFeedback(data.error || 'Este addon não fornece legendas.', false);
          return;
        }

        const exists = state.config.customAddons.some(a => a.manifestUrl === data.manifestUrl || a.id === data.id);
        if (exists) {
          showImportFeedback('Este addon já foi importado anteriormente.', false);
          return;
        }

        const newAddon = {
          id: data.id,
          name: data.name,
          manifestUrl: data.manifestUrl,
          logo: data.logo || '',
          description: data.description || '',
          enabled: true,
          timeout: 20000,
          resources: Array.isArray(data.resources) && data.resources.length > 0 ? data.resources : ['subtitles'],
          selectedResources: ['subtitles'],
          configurable: Boolean(data.configurable),
          configurationURL: data.configurationURL || ''
        };

        state.config.customAddons.push(newAddon);
        if (!state.config.providerPriority.includes(newAddon.id)) {
          state.config.providerPriority.push(newAddon.id);
        }

        inputUrl.value = '';
        showImportFeedback(`Addon "${newAddon.name}" importado com sucesso!`, true);
        renderInstalledAddons();
        renderFiltersPriority();
        updateStats();
        notifyConfigChanged();
      } catch {
        showImportFeedback('Não foi possível conectar ao endpoint do manifest.', false);
      } finally {
        btnImport.disabled = false;
        btnImport.innerHTML = `${MDI_ICONS.plus16} Importar`;
      }
    });
  }

  const searchInput = document.getElementById('search-installed-addons');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderInstalledAddons(searchInput.value.toLowerCase().trim());
    });
  }

  // Stepper handlers for Addon Editor modal
  document.getElementById('btn-edit-timeout-up')?.addEventListener('click', () => {
    const input = document.getElementById('edit-addon-timeout');
    if (input) {
      let val = parseInt(input.value, 10) || 20000;
      val = Math.min(60000, val + 500);
      input.value = val;
    }
  });

  document.getElementById('btn-edit-timeout-down')?.addEventListener('click', () => {
    const input = document.getElementById('edit-addon-timeout');
    if (input) {
      let val = parseInt(input.value, 10) || 20000;
      val = Math.max(1000, val - 500);
      input.value = val;
    }
  });

  // Addon Fetching Strategy selector
  const selectFetching = document.getElementById('select-fetching-strategy');
  if (selectFetching) {
    selectFetching.value = state.config.addonFetchingStrategy || 'default';
    setupCustomSelect('wrap-fetching-strategy', 'select-fetching-strategy', (val) => {
      state.config.addonFetchingStrategy = val;
      notifyConfigChanged();
      showToast(`Estratégia alterada para: ${val === 'sequential' ? 'Sequencial' : 'Default (Paralelo)'}`);
    });
  }

  document.getElementById('btn-save-edit-addon')?.addEventListener('click', () => {
    const id = document.getElementById('edit-addon-id').value;
    const name = document.getElementById('edit-addon-name').value.trim();
    const url = document.getElementById('edit-addon-url').value.trim();
    if (!name || !url) {
      alert('Por favor, preencha o Nome e a Manifest URL (campos obrigatórios).');
      return;
    }

    const timeoutInput = document.getElementById('edit-addon-timeout');
    let timeoutVal = 20000;
    if (timeoutInput) {
      const parsed = parseInt(timeoutInput.value, 10);
      if (!isNaN(parsed)) {
        timeoutVal = Math.max(1000, Math.min(60000, parsed));
      }
    }

    const addon = state.config.customAddons.find(a => a.id === id);
    if (addon) {
      addon.name = name;
      addon.manifestUrl = url;
      addon.timeout = timeoutVal;
      const chipsContainer = document.getElementById('edit-addon-resources-chips');
      if (chipsContainer && typeof chipsContainer._getSelected === 'function') {
        addon.selectedResources = chipsContainer._getSelected();
      }
      renderInstalledAddons();
      renderFiltersPriority();
      notifyConfigChanged();
      showToast('Addon atualizado.');
    }
    closeEditAddonModal();
  });

  document.getElementById('btn-cancel-edit-addon')?.addEventListener('click', closeEditAddonModal);
  document.getElementById('btn-close-edit-addon-modal')?.addEventListener('click', closeEditAddonModal);
}

function showImportFeedback(msg, isSuccess) {
  const el = document.getElementById('import-validation-msg');
  if (!el) return;
  el.className = `validation-feedback ${isSuccess ? 'success' : 'error'}`;
  el.textContent = msg;
}

function renderInstalledAddons(query = '') {
  const container = document.getElementById('installed-addons-list');
  if (!container) return;

  let list = state.config.customAddons || [];
  if (query) {
    list = list.filter(a => (a.name || '').toLowerCase().includes(query) || (a.manifestUrl || '').toLowerCase().includes(query));
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-addons-box">
        Nenhum addon importado. Cole a URL de manifest.json acima para adicionar addons de legendas externos.
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  list.forEach((addon, idx) => {
    const row = document.createElement('div');
    row.className = 'addon-row search-stagger-item';
    row.style.animationDelay = `${Math.min(idx * 15, 120)}ms`;
    row.dataset.id = addon.id;

    const logoHtml = addon.logo
      ? `<img src="${escapeHtml(addon.logo)}" alt="${escapeHtml(addon.name)}" onerror="this.src='https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png'">`
      : MDI_ICONS.puzzle;

    row.innerHTML = `
      <div class="addon-left">
        <div class="addon-logo">${logoHtml}</div>
        <div class="addon-info">
          <span class="addon-name">${escapeHtml(addon.name)}</span>
          <div class="addon-url-row">
            <span class="addon-url" title="${escapeHtml(addon.manifestUrl)}">${escapeHtml(addon.manifestUrl)}</span>
            <button class="btn-copy-sm" data-url="${escapeHtml(addon.manifestUrl)}" title="Copiar Manifest URL">
              ${MDI_ICONS.copySm}
            </button>
          </div>
        </div>
      </div>
      <div class="addon-right">
        <label class="compact-switch" title="Ativar ou desativar este addon">
          <input type="checkbox" class="toggle-addon" data-id="${addon.id}" ${addon.enabled !== false ? 'checked' : ''}>
          <span class="compact-slider"></span>
        </label>
        <button class="btn-addon-action btn-edit-addon" data-id="${addon.id}" title="Editar informações do addon">${MDI_ICONS.pencil}</button>
        <button class="btn-addon-action delete btn-delete-addon" data-id="${addon.id}" title="Excluir addon">${MDI_ICONS.trash}</button>
      </div>
    `;

    row.querySelector('.toggle-addon').addEventListener('change', (e) => {
      addon.enabled = e.target.checked;
      renderFiltersPriority();
      updateStats();
      notifyConfigChanged();
    });

    row.querySelector('.btn-copy-sm').addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(addon.manifestUrl);
      showToast('Manifest URL copiada!');
    });

    row.querySelector('.btn-edit-addon').addEventListener('click', () => {
      openEditAddonModal(addon);
    });

    row.querySelector('.btn-delete-addon').addEventListener('click', () => {
      if (confirm(`Deseja remover o addon "${addon.name}"?`)) {
        row.classList.add('row-fade-out');
        setTimeout(() => {
          state.config.customAddons = state.config.customAddons.filter(a => a.id !== addon.id);
          state.config.providerPriority = state.config.providerPriority.filter(id => id !== addon.id);
          renderInstalledAddons();
          renderFiltersPriority();
          updateStats();
          notifyConfigChanged();
          showToast('Addon removido.');
        }, 180);
      }
    });

    container.appendChild(row);
  });
}

function openEditAddonModal(addon) {
  document.getElementById('edit-addon-id').value = addon.id;
  document.getElementById('edit-addon-name').value = addon.name || '';
  document.getElementById('edit-addon-url').value = addon.manifestUrl || '';
  const timeoutInput = document.getElementById('edit-addon-timeout');
  if (timeoutInput) {
    timeoutInput.value = addon.timeout || 20000;
  }

  // Resources multi-select chips
  const chipsContainer = document.getElementById('edit-addon-resources-chips');
  if (chipsContainer) {
    chipsContainer.innerHTML = '';
    const availableResources = (addon.resources && addon.resources.length > 0) ? addon.resources : ['subtitles'];
    const selected = new Set(addon.selectedResources || ['subtitles']);
    availableResources.forEach(resName => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const isSel = selected.has(resName);
      chip.className = `btn btn-sm ${isSel ? 'btn-primary' : 'btn-outline'}`;
      chip.style.cssText = 'border-radius: 9999px; padding: 4px 12px; font-size: 11.5px; cursor: pointer; transition: all 150ms ease;';
      chip.textContent = resName.charAt(0).toUpperCase() + resName.slice(1);
      chip.addEventListener('click', () => {
        if (selected.has(resName)) {
          selected.delete(resName);
          chip.className = 'btn btn-sm btn-outline';
        } else {
          selected.add(resName);
          chip.className = 'btn btn-sm btn-primary';
        }
      });
      chipsContainer.appendChild(chip);
    });
    chipsContainer._getSelected = () => Array.from(selected);
  }

  // Addon external configuration page link
  const configRow = document.getElementById('edit-addon-config-link-row');
  const configBtn = document.getElementById('btn-addon-external-config');
  const isConfigurable = Boolean(addon.configurable || addon.configurationURL);
  if (configRow) {
    configRow.style.display = isConfigurable ? 'flex' : 'none';
    if (isConfigurable && configBtn) {
      configBtn.href = addon.configurationURL || (addon.manifestUrl ? addon.manifestUrl.replace(/\/manifest\.json$/i, '/configure') : '#');
    }
  }

  openModal('modal-edit-addon');
}

function closeEditAddonModal() {
  closeModal('modal-edit-addon');
}

// =============================================================================
// 11. Filters Actions (Priority, Whitelist, Remap, Deduplication)
// =============================================================================
// =============================================================================
// 11. Filters Actions (Lateral Sub-Nav: Whitelist, Remap + Dedup, Priority)
// =============================================================================
function setupFiltersActions() {
  // 1. Sub-navigation tab switching
  const tabButtons = document.querySelectorAll('.filters-nav-item');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-filter-tab');
      if (tabId) {
        switchFilterTab(tabId);
      }
    });
  });

  // 2. Whitelist: Quick selection buttons
  document.getElementById('btn-quick-pt-en')?.addEventListener('click', () => {
    state.config.languages = ['pob', 'por', 'eng'];
    renderWhitelistTags();
    renderLanguageChips(document.getElementById('search-languages')?.value || '');
    updateStats();
    notifyConfigChanged();
  });

  document.getElementById('btn-clear-langs')?.addEventListener('click', () => {
    state.config.languages = [];
    renderWhitelistTags();
    renderLanguageChips(document.getElementById('search-languages')?.value || '');
    updateStats();
    notifyConfigChanged();
  });

  // 3. Whitelist: Real-time search filter
  const searchLangInput = document.getElementById('search-languages');
  if (searchLangInput) {
    searchLangInput.addEventListener('input', () => {
      renderLanguageChips(searchLangInput.value.toLowerCase().trim());
    });
  }

  // 4. Remap: Add rule button
  document.getElementById('btn-add-remap')?.addEventListener('click', () => {
    const fromInput = document.getElementById('input-remap-from');
    const toInput = document.getElementById('input-remap-to');
    const fromVal = fromInput ? fromInput.value.trim().toLowerCase() : '';
    const toVal = toInput ? toInput.value.trim().toLowerCase() : '';

    if (!fromVal || !toVal) {
      alert('Preencha os códigos de origem e destino para o remapeamento (ex: pt-br → pob).');
      return;
    }

    if (!state.config.languageRemap) {
      state.config.languageRemap = {};
    }
    state.config.languageRemap[fromVal] = toVal;
    if (fromInput) fromInput.value = '';
    if (toInput) toInput.value = '';

    renderRemapTable();
    notifyConfigChanged();
    showToast(`Regra "${fromVal} → ${toVal}" adicionada.`);
  });

  // 5. Deduplication: Toggle & Strategy
  const toggleDedup = document.getElementById('toggle-deduplication');
  const dedupStrategyRow = document.getElementById('dedup-strategy-row');

  if (toggleDedup) {
    toggleDedup.checked = state.config.deduplication !== false;
    if (dedupStrategyRow) {
      dedupStrategyRow.style.opacity = toggleDedup.checked ? '1' : '0.4';
      dedupStrategyRow.style.pointerEvents = toggleDedup.checked ? 'auto' : 'none';
    }

    toggleDedup.addEventListener('change', () => {
      state.config.deduplication = toggleDedup.checked;
      if (dedupStrategyRow) {
        dedupStrategyRow.style.opacity = toggleDedup.checked ? '1' : '0.4';
        dedupStrategyRow.style.pointerEvents = toggleDedup.checked ? 'auto' : 'none';
      }
      updateStats();
      notifyConfigChanged();
    });
  }

  const selectDedupStrategy = document.getElementById('select-dedup-strategy');
  if (selectDedupStrategy) {
    setupCustomSelect('wrap-dedup-strategy', 'select-dedup-strategy', (val) => {
      state.config.deduplicationStrategy = val;
      updateStats();
      notifyConfigChanged();
    });
  }

}

function setupCustomSelect(wrapId, hiddenInputId, onChange) {
  const wrap = document.getElementById(wrapId);
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!wrap || !hiddenInput) return;

  const trigger = wrap.querySelector('.custom-select-trigger');
  const labelEl = wrap.querySelector('.custom-select-value');
  const options = wrap.querySelectorAll('.custom-select-option');

  const currentVal = hiddenInput.value || 'both';
  options.forEach(opt => {
    const isSelected = opt.dataset.value === currentVal;
    opt.classList.toggle('selected', isSelected);
    const checkSpan = opt.querySelector('.option-check');
    if (checkSpan) checkSpan.innerHTML = isSelected ? MDI_ICONS.check : '';
    if (isSelected && labelEl) {
      labelEl.textContent = opt.querySelector('.option-text')?.textContent || '';
    }
  });

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrap.classList.contains('open');
    document.querySelectorAll('.custom-select-wrap.open').forEach(w => {
      if (w !== wrap) w.classList.remove('open');
    });
    wrap.classList.toggle('open', !isOpen);
    trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
  });

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.dataset.value;
      hiddenInput.value = val;

      options.forEach(o => {
        const isSel = o === opt;
        o.classList.toggle('selected', isSel);
        const check = o.querySelector('.option-check');
        if (check) check.innerHTML = isSel ? MDI_ICONS.check : '';
      });

      if (labelEl) {
        labelEl.textContent = opt.querySelector('.option-text')?.textContent || '';
      }

      wrap.classList.remove('open');
      trigger?.setAttribute('aria-expanded', 'false');

      if (typeof onChange === 'function') {
        onChange(val);
      }
      hiddenInput.dispatchEvent(new Event('change'));
    });
  });
}

// Global click handler to close open custom selects
document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select-wrap.open').forEach(w => {
    w.classList.remove('open');
    w.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
  });
});

function switchFilterTab(tabId) {
  if (state.activeFilterTab === tabId && document.getElementById(`pane-filter-${tabId}`)?.classList.contains('active')) {
    return;
  }
  const currentTab = state.activeFilterTab;
  state.activeFilterTab = tabId;

  document.querySelectorAll('.filters-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter-tab') === tabId);
  });

  const currentPane = document.getElementById(`pane-filter-${currentTab}`);
  const targetPane = document.getElementById(`pane-filter-${tabId}`);

  if (currentPane && currentPane !== targetPane && currentPane.classList.contains('active')) {
    currentPane.classList.add('pane-fade-out');
    setTimeout(() => {
      document.querySelectorAll('.filters-tab-pane').forEach(pane => {
        pane.classList.remove('pane-fade-out');
        if (pane.id === `pane-filter-${tabId}`) {
          pane.classList.remove('active');
          void pane.offsetWidth; // Trigger reflow for smooth lateral animation replay
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
      triggerTabRender(tabId);
    }, 85);
  } else {
    document.querySelectorAll('.filters-tab-pane').forEach(pane => {
      pane.classList.remove('pane-fade-out');
      if (pane.id === `pane-filter-${tabId}`) {
        pane.classList.remove('active');
        void pane.offsetWidth;
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
    triggerTabRender(tabId);
  }
}

function triggerTabRender(tabId) {
  if (tabId === 'whitelist') {
    renderWhitelistTags();
    renderLanguageChips(document.getElementById('search-languages')?.value || '');
  } else if (tabId === 'remap-dedup') {
    renderRemapTable();
  } else if (tabId === 'priority') {
    renderFiltersPriority();
  }
}

function renderWhitelistTags() {
  const container = document.getElementById('selected-languages-tags');
  if (!container) return;

  const currentLangs = state.config.languages || [];

  if (currentLangs.length === 0) {
    container.innerHTML = `
      <div class="whitelist-empty-notice">
        <span class="empty-badge">Todos os idiomas permitidos</span>
        <span class="empty-text">Nenhum filtro de whitelist ativo. Todas as legendas com idiomas válidos serão exibidas.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  currentLangs.forEach(code => {
    const cleanCode = code.toLowerCase();
    const found = (state.languagesList || FALLBACK_LANGUAGES).find(l => l.code.toLowerCase() === cleanCode);
    const label = found ? found.name : cleanCode.toUpperCase();

    const tag = document.createElement('div');
    tag.className = 'selected-lang-tag';
    tag.dataset.code = cleanCode;
    tag.innerHTML = `
      <span class="tag-label">${escapeHtml(label)}</span>
      <span class="tag-code">${escapeHtml(cleanCode.toUpperCase())}</span>
      <button class="btn-remove-tag" data-code="${escapeHtml(cleanCode)}" title="Remover ${escapeHtml(label)}" type="button">${MDI_ICONS.closeSm}</button>
    `;

    tag.querySelector('.btn-remove-tag').addEventListener('click', (e) => {
      e.stopPropagation();
      tag.classList.add('removing');
      setTimeout(() => {
        state.config.languages = state.config.languages.filter(c => c.toLowerCase() !== cleanCode);
        renderWhitelistTags();
        renderLanguageChips(document.getElementById('search-languages')?.value || '');
        updateStats();
        notifyConfigChanged();
      }, 150);
    });

    container.appendChild(tag);
  });
}

function renderLanguageChips(filterQuery = '') {
  const container = document.getElementById('language-chips-container');
  if (!container) return;

  const currentLangs = new Set((state.config.languages || []).map(l => l.toLowerCase()));
  let list = state.languagesList || FALLBACK_LANGUAGES;

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    list = list.filter(l => l.code.toLowerCase().includes(q) || (l.name || '').toLowerCase().includes(q));
  }

  if (list.length === 0) {
    container.innerHTML = `<div class="empty-chips-msg" style="padding: 12px; color: var(--text-muted); font-size: 12px; text-align: center;">Nenhum idioma encontrado correspondente a "${escapeHtml(filterQuery)}".</div>`;
    return;
  }

  container.innerHTML = '';
  list.forEach((l, idx) => {
    const isSelected = currentLangs.has(l.code.toLowerCase());
    const item = document.createElement('div');
    item.className = `multiselect-item search-stagger-item ${isSelected ? 'selected' : ''}`;
    item.style.animationDelay = `${Math.min(idx * 15, 120)}ms`;
    item.innerHTML = `
      <span class="item-check">${isSelected ? MDI_ICONS.check16 : ''}</span>
      <span class="item-name">${escapeHtml(l.name || l.code)}</span>
      <span class="item-code">${l.code.toUpperCase()}</span>
    `;

    item.addEventListener('click', () => {
      if (isSelected) {
        const tag = document.querySelector(`.selected-lang-tag[data-code="${l.code.toLowerCase()}"]`);
        if (tag) {
          tag.classList.add('removing');
          setTimeout(() => {
            state.config.languages = state.config.languages.filter(code => code.toLowerCase() !== l.code.toLowerCase());
            renderWhitelistTags();
            renderLanguageChips(filterQuery);
            updateStats();
            notifyConfigChanged();
          }, 150);
          return;
        }
        state.config.languages = state.config.languages.filter(code => code.toLowerCase() !== l.code.toLowerCase());
      } else {
        state.config.languages.push(l.code.toLowerCase());
      }
      renderWhitelistTags();
      renderLanguageChips(filterQuery);
      updateStats();
      notifyConfigChanged();
    });

    container.appendChild(item);
  });
}

function renderRemapTable() {
  const tbody = document.getElementById('remap-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const remap = state.config.languageRemap || {};
  const entries = Object.entries(remap);

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 14px;">Nenhuma regra configurada. Adicione regras abaixo (ex: por → pob).</td></tr>`;
    return;
  }

  entries.forEach(([from, to]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="remap-code-badge">${escapeHtml(from)}</span></td>
      <td style="color: var(--text-muted); text-align: center; vertical-align: middle;">${MDI_ICONS.arrowRight}</td>
      <td><span class="remap-code-badge">${escapeHtml(to)}</span></td>
      <td style="text-align: right;">
        <button class="btn-addon-action delete" title="Excluir regra" type="button">${MDI_ICONS.trash}</button>
      </td>
    `;

    tr.querySelector('.delete').addEventListener('click', () => {
      tr.classList.add('row-fade-out');
      setTimeout(() => {
        delete state.config.languageRemap[from];
        renderRemapTable();
        notifyConfigChanged();
        showToast(`Regra "${from} → ${to}" removida.`);
      }, 180);
    });

    tbody.appendChild(tr);
  });
}

function renderFiltersPriority() {
  const container = document.getElementById('priority-list-container');
  if (!container) return;

  const activeItemsMap = new Map();

  const nativeKeys = ['opensubtitles', 'subdl', 'subsource'];
  for (const id of nativeKeys) {
    const prov = state.config.providers[id];
    // ONLY show native services that are enabled AND have an API key
    if (prov && prov.enabled === true && prov.apiKey && prov.apiKey.trim() !== '') {
      activeItemsMap.set(id, {
        id,
        name: SERVICES_META[id]?.name || id,
        type: 'Serviço Nativo'
      });
    }
  }

  if (Array.isArray(state.config.customAddons)) {
    for (const addon of state.config.customAddons) {
      if (addon && addon.enabled !== false) {
        activeItemsMap.set(addon.id, {
          id: addon.id,
          name: addon.name || 'Addon de Legendas',
          type: 'Addon Importado'
        });
      }
    }
  }

  const orderedList = [];
  const currentPriority = Array.isArray(state.config.providerPriority) ? state.config.providerPriority : [];

  for (const id of currentPriority) {
    if (activeItemsMap.has(id)) {
      orderedList.push(activeItemsMap.get(id));
      activeItemsMap.delete(id);
    }
  }

  for (const item of activeItemsMap.values()) {
    orderedList.push(item);
  }

  state.config.providerPriority = orderedList.map(item => item.id);

  if (orderedList.length === 0) {
    container.innerHTML = `
      <div class="empty-priority-box">
        Nenhum provedor ou addon ativo no momento.<br>
        <span style="font-size: 11.5px; color: #6b7280;">Ative serviços com API Key válida na página <b>Services</b> ou importe addons na página <b>Addons</b>.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  orderedList.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'priority-item';
    row.draggable = true;
    row.dataset.id = item.id;
    row.dataset.index = String(index);

    row.innerHTML = `
      <div class="priority-left">
        <span class="drag-handle" title="Arraste para reordenar">${MDI_ICONS.drag}</span>
        <span class="priority-name">${escapeHtml(item.name)}</span>
        <span class="priority-type-badge">${item.type}</span>
      </div>
      <div class="priority-right">
        <button class="btn-priority-move" data-action="up" data-index="${index}" title="Mover para cima" ${index === 0 ? 'disabled style="opacity:0.3;cursor:default"' : ''}>${MDI_ICONS.arrowUp}</button>
        <button class="btn-priority-move" data-action="down" data-index="${index}" title="Mover para baixo" ${index === orderedList.length - 1 ? 'disabled style="opacity:0.3;cursor:default"' : ''}>${MDI_ICONS.arrowDown}</button>
      </div>
    `;

    row.addEventListener('dragstart', (e) => {
      row.classList.add('dragging');
      e.dataTransfer.setData('text/plain', String(index));
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIndex = index;
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        const movedItem = state.config.providerPriority.splice(fromIndex, 1)[0];
        state.config.providerPriority.splice(toIndex, 0, movedItem);
        renderFiltersPriority();
        notifyConfigChanged();
      }
    });

    container.appendChild(row);
  });

  container.querySelectorAll('.btn-priority-move').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const action = btn.dataset.action;
      if (action === 'up' && idx > 0) {
        const temp = state.config.providerPriority[idx - 1];
        state.config.providerPriority[idx - 1] = state.config.providerPriority[idx];
        state.config.providerPriority[idx] = temp;
        renderFiltersPriority();
        notifyConfigChanged();
      } else if (action === 'down' && idx < state.config.providerPriority.length - 1) {
        const temp = state.config.providerPriority[idx + 1];
        state.config.providerPriority[idx + 1] = state.config.providerPriority[idx];
        state.config.providerPriority[idx] = temp;
        renderFiltersPriority();
        notifyConfigChanged();
      }
    });
  });
}

// =============================================================================
// 12. Install Addon Page & Save Configuration
// =============================================================================
function syncConnectorTimeout(newVal) {
  let val = parseInt(newVal, 10);
  if (isNaN(val) || val < 2000) val = 2000;
  if (val > 15000) val = 15000;
  state.config.providerTimeoutMs = val;
  const el1 = document.getElementById('install-addon-timeout');
  if (el1) el1.value = val;
  notifyConfigChanged();
}

function setupInstallPageActions() {
  // Backup: Export configuration to JSON
  document.getElementById('btn-export-backup')?.addEventListener('click', () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      uuid: state.uuid,
      config: state.config
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiosubtitles-backup-${(state.uuid || 'config').slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Configurações exportadas com sucesso!');
  });

  // Backup: Import configuration from JSON
  const fileImportInput = document.getElementById('file-import-backup');
  document.getElementById('btn-import-backup')?.addEventListener('click', () => {
    fileImportInput?.click();
  });
  fileImportInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const configToRestore = parsed.config || parsed;
        if (!configToRestore || typeof configToRestore !== 'object') {
          throw new Error('Arquivo de backup inválido.');
        }
        if (confirm('Deseja realmente restaurar as configurações do arquivo de backup? A configuração atual será substituída.')) {
          applyConfigWithMigration(configToRestore);
          renderAll();
          notifyConfigChanged();
          showToast('Configuração restaurada com sucesso!');
        }
      } catch (err) {
        alert('Erro ao importar backup: ' + (err.message || 'JSON inválido'));
      } finally {
        fileImportInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  // Copy UUID
  document.getElementById('btn-copy-uuid')?.addEventListener('click', () => {
    if (state.uuid) {
      navigator.clipboard.writeText(state.uuid);
      showToast('UUID copiado!');
    }
  });

  // Dynamic Password Input with Eye Toggle (hidden when empty)
  setupDynamicPasswordInput(
    'input-user-password',
    'user-password-wrap',
    'btn-toggle-pass-eye',
    'pass-eye-show',
    'pass-eye-hide',
    (val) => {
      state.password = val.trim();
      if (state.uuid) {
        localStorage.setItem(`aiosubtitles_pass_${state.uuid}`, state.password);
      }
    }
  );

  // Explicit Save button on Save Configuration section
  document.getElementById('btn-explicit-save')?.addEventListener('click', () => {
    saveConfigurationAndShowInstall();
  });

  // Copy Direct Manifest URL
  document.getElementById('btn-copy-manifest')?.addEventListener('click', () => {
    const input = document.getElementById('final-manifest-url');
    if (input && input.value) {
      navigator.clipboard.writeText(input.value);
      showToast('Manifest URL copiada com sucesso!');
    }
  });

  // Client Badges
  document.getElementById('pill-open-stremio')?.addEventListener('click', () => {
    const link = document.getElementById('link-install-stremio');
    if (link && link.href) window.location.href = link.href;
  });

  document.getElementById('pill-open-nuvio')?.addEventListener('click', () => {
    openNuvioModal();
  });

  document.getElementById('pill-open-web')?.addEventListener('click', () => {
    const link = document.getElementById('link-install-stremio-web');
    if (link && link.href) window.open(link.href, '_blank', 'noopener,noreferrer');
  });

  // Connector Timeout on Install page (Unified numeric input with custom stepper)
  const timeoutInput = document.getElementById('install-addon-timeout');
  if (timeoutInput) {
    timeoutInput.value = state.config.providerTimeoutMs || 6000;
    timeoutInput.addEventListener('change', () => {
      syncConnectorTimeout(parseInt(timeoutInput.value, 10));
    });
    timeoutInput.addEventListener('input', () => {
      const val = parseInt(timeoutInput.value, 10);
      if (!isNaN(val) && val >= 2000 && val <= 15000) {
        state.config.providerTimeoutMs = val;
        notifyConfigChanged();
      }
    });
  }

  document.getElementById('btn-timeout-up')?.addEventListener('click', () => {
    syncConnectorTimeout((state.config.providerTimeoutMs || 6000) + 500);
  });

  document.getElementById('btn-timeout-down')?.addEventListener('click', () => {
    syncConnectorTimeout((state.config.providerTimeoutMs || 6000) - 500);
  });
}

async function saveConfigurationAndShowInstall() {
  // 1. Validation check on active services
  const missingCreds = [];
  const nativeIds = ['opensubtitles', 'subdl', 'subsource'];
  for (const id of nativeIds) {
    const prov = state.config.providers[id];
    if (prov && prov.enabled === true) {
      if (!prov.apiKey || prov.apiKey.trim() === '') {
        missingCreds.push(SERVICES_META[id]?.name || id);
      }
    }
  }

  if (missingCreds.length > 0) {
    showMissingCredentialsBanner(missingCreds);
    showToast('Existem serviços ativados sem credenciais.');
    navigateToPage('services');
    return;
  }

  hideMissingCredentialsBanner();

  if (!state.uuid) {
    state.uuid = generateUuid();
  }
  if (!state.password) {
    state.password = generateSecurePassword();
  }

  const passInput = document.getElementById('input-user-password');
  if (passInput && passInput.value) {
    state.password = passInput.value.trim();
  }

  // 2. Save configuration to backend store
  try {
    const res = await fetch('/api/config/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uuid: state.uuid,
        password: state.password,
        config: state.config
      })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || 'Não foi possível salvar a configuração.');
      return;
    }

    state.lastSavedConfigJson = JSON.stringify(state.config);
    if (state.uuid) {
      localStorage.setItem('aiosubtitles_current_uuid', state.uuid);
      localStorage.setItem(`aiosubtitles_pass_${state.uuid}`, state.password);
      localStorage.removeItem(`aiosubtitles_draft_${state.uuid}`);
    }
    notifyConfigChanged();

    // Update URL path without full refresh
    window.history.replaceState(null, '', `/${state.uuid}/configure`);

    renderInstallPageDetails();
    navigateToPage('install');
    showToast('Configuração salva com sucesso!');
  } catch (err) {
    alert('Erro de conexão ao salvar a configuração.');
  }
}

function renderInstallPageDetails() {
  const uuidDisplay = document.getElementById('display-user-uuid');
  if (uuidDisplay) uuidDisplay.textContent = state.uuid || '--------';

  const passInput = document.getElementById('input-user-password');
  if (passInput) {
    passInput.value = state.password || '';
    passInput.dispatchEvent(new Event('input'));
  }

  const baseUrl = window.location.origin;
  const manifestUrl = `${baseUrl}/${state.uuid}/manifest.json`;

  const inputEl = document.getElementById('final-manifest-url');
  if (inputEl) inputEl.value = manifestUrl;

  const linkStremio = document.getElementById('link-install-stremio');
  if (linkStremio) {
    const cleanHost = manifestUrl.replace(/^https?:\/\//i, '');
    linkStremio.href = `stremio://${cleanHost}`;
  }

  const linkStremioWeb = document.getElementById('link-install-stremio-web');
  if (linkStremioWeb) {
    linkStremioWeb.href = `https://web.stremio.com/#/addons?addon=${encodeURIComponent(manifestUrl)}`;
  }

  // Connector Timeout Display (Unified numeric input)
  const timeoutInput = document.getElementById('install-addon-timeout');
  if (timeoutInput) {
    timeoutInput.value = state.config.providerTimeoutMs || 6000;
  }
}

// =============================================================================
// 13. Load Configuration Modal (UUID + Password)
// =============================================================================
function openLoadConfigModal() {
  const modal = document.getElementById('modal-load-config');
  const errBox = document.getElementById('load-config-error');
  if (errBox) errBox.style.display = 'none';

  const uuidInput = document.getElementById('load-input-uuid');
  if (uuidInput) uuidInput.value = state.uuid || '';

  const passInput = document.getElementById('load-input-password');
  if (passInput) {
    passInput.value = '';
    passInput.dispatchEvent(new Event('input'));
  }

  openModal('modal-load-config');
}

function closeLoadConfigModal() {
  closeModal('modal-load-config');
}

function setupModals() {
  // Load config modal dynamic eye toggle
  setupDynamicPasswordInput('load-input-password', 'load-password-wrap', 'btn-toggle-load-eye', 'load-eye-show', 'load-eye-hide');

  document.getElementById('btn-close-load-modal')?.addEventListener('click', closeLoadConfigModal);
  document.getElementById('btn-cancel-load-modal')?.addEventListener('click', closeLoadConfigModal);

  document.getElementById('btn-submit-load-config')?.addEventListener('click', async () => {
    const uuid = document.getElementById('load-input-uuid').value.trim();
    const pass = document.getElementById('load-input-password').value.trim();
    const errBox = document.getElementById('load-config-error');

    if (!uuid || !pass) {
      if (errBox) {
        errBox.textContent = 'UUID ou senha inválidos.';
        errBox.style.display = 'block';
      }
      return;
    }

    try {
      const res = await fetch('/api/config/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, password: pass })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (errBox) {
          errBox.textContent = 'UUID ou senha inválidos.';
          errBox.style.display = 'block';
        }
        return;
      }

      state.uuid = data.uuid;
      state.password = pass;
      localStorage.setItem('aiosubtitles_current_uuid', state.uuid);
      localStorage.setItem(`aiosubtitles_pass_${state.uuid}`, state.password);

      applyConfigWithMigration(data.config);
      renderAll();
      closeLoadConfigModal();
      window.history.replaceState(null, '', `/${state.uuid}/configure`);
      showToast('Configuração carregada com sucesso!');
    } catch {
      if (errBox) {
        errBox.textContent = 'UUID ou senha inválidos.';
        errBox.style.display = 'block';
      }
    }
  });

  // Nuvio modal
  document.getElementById('btn-close-nuvio-modal')?.addEventListener('click', () => {
    closeModal('modal-nuvio');
  });

  document.getElementById('btn-done-nuvio')?.addEventListener('click', () => {
    closeModal('modal-nuvio');
  });

  // Click outside backdrop to close any modal smoothly
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });
}

async function openNuvioModal() {
  const baseUrl = window.location.origin;
  const manifestUrl = `${baseUrl}/${state.uuid}/manifest.json`;

  const qrBox = document.getElementById('qr-code-box');
  if (qrBox) {
    qrBox.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:180px;color:var(--text-muted);font-size:12px;">Gerando QR Code...</div>';
    try {
      const res = await fetch(`/api/qrcode?text=${encodeURIComponent(manifestUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.dataUrl) {
          qrBox.innerHTML = `<img src="${data.dataUrl}" alt="QR Code de Instalação" width="180" height="180" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: block; margin: 0 auto; background: #fff; padding: 4px;">`;
        } else {
          throw new Error('Sem dataUrl');
        }
      } else {
        throw new Error('HTTP error');
      }
    } catch {
      if (window.QRCode) {
        qrBox.innerHTML = '';
        const canvas = document.createElement('canvas');
        qrBox.appendChild(canvas);
        window.QRCode.toCanvas(canvas, manifestUrl, {
          width: 180,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
      } else {
        qrBox.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(manifestUrl)}" alt="QR Code" width="180" height="180" style="border-radius: 8px; display: block; margin: 0 auto; background: #fff; padding: 4px;">`;
      }
    }
  }

  openModal('modal-nuvio');
}

// =============================================================================
// 14. Stats & Rendering Helpers
// =============================================================================
function updateStats() {
  const activeSvcCount = Object.keys(state.config.providers).filter(
    k => state.config.providers[k]?.enabled === true
  ).length;

  const activeAddonCount = (state.config.customAddons || []).filter(
    a => a.enabled !== false
  ).length;

  const statSvc = document.getElementById('stat-active-services');
  const statAddon = document.getElementById('stat-active-addons');
  const statLangs = document.getElementById('stat-active-langs');
  const statDedup = document.getElementById('stat-dedup-status');

  if (statSvc) statSvc.textContent = `${activeSvcCount} Ativos`;
  if (statAddon) statAddon.textContent = `${activeAddonCount} Instalados`;
  if (statLangs) {
    const langs = state.config.languages || [];
    statLangs.textContent = langs.length > 0 ? langs.slice(0, 3).map(l => l.toUpperCase()).join(', ') : 'Nenhum';
  }
  if (statDedup) {
    if (state.config.deduplication === false) {
      statDedup.textContent = 'Desativada';
      statDedup.className = 'stat-value';
    } else {
      const strat = state.config.deduplicationStrategy === 'hash' ? 'Hash' : (state.config.deduplicationStrategy === 'fuzzy' ? 'Fuzzy' : 'Ambos');
      statDedup.textContent = `Ativada (${strat})`;
      statDedup.className = 'stat-value highlight';
    }
  }
}

function renderAll() {
  renderHomeBranding();
  renderServicesState();
  renderInstalledAddons();
  renderWhitelistTags();
  renderLanguageChips();
  renderRemapTable();
  renderFiltersPriority();
  renderInstallPageDetails();
  updateStats();
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
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
