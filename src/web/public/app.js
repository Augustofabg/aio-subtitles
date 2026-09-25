/**
 * AIOSubtitles — Frontend Application SPA
 * Following AIOStreams Visual and Logical Standards
 */

// =============================================================================
// 1. Default Configuration & Services Metadata
// =============================================================================
const DEFAULT_CONFIG = {
  instanceName: 'AIOSubtitles',
  instanceDesc: 'Agregador e organizador de legendas',
  instanceLogo: 'https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png',
  instanceVersion: 'v1.0.0',
  providers: {
    'opensubtitles': { enabled: true, apiKey: '' },
    'subdl': { enabled: true, apiKey: '' },
    'subsource': { enabled: true, apiKey: '' }
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
const PAGES_ORDER = ['home', 'services', 'addons', 'filters', 'settings'];

const state = {
  activePage: 'home',
  config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  initialConfig: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  languagesList: FALLBACK_LANGUAGES,
  draftsEnabled: localStorage.getItem('aiosubtitles_no_drafts') !== 'true',
  validationDebounceTimer: null
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
  updateUnsavedStatus();
});

// =============================================================================
// 4. Configuration Loading & URL Helpers
// =============================================================================
function encodeConfig(configObj) {
  const json = JSON.stringify(configObj);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeConfig(encodedStr) {
  if (!encodedStr || encodedStr === 'default') {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
  try {
    let base64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

async function loadInitialConfiguration() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let configFromUrl = null;

  if (pathParts.length > 0 && pathParts[0] !== 'configure') {
    configFromUrl = pathParts[0];
  }

  if (configFromUrl) {
    const decoded = decodeConfig(configFromUrl);
    applyConfigWithMigration(decoded);
  } else if (state.draftsEnabled) {
    const savedDraft = localStorage.getItem('aiosubtitles_draft_config');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        applyConfigWithMigration(parsed);
      } catch {
        applyConfigWithMigration(DEFAULT_CONFIG);
      }
    } else {
      applyConfigWithMigration(DEFAULT_CONFIG);
    }
  } else {
    applyConfigWithMigration(DEFAULT_CONFIG);
  }

  state.initialConfig = JSON.parse(JSON.stringify(state.config));
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
        merged.providers[targetKey].enabled = typeof val.enabled === 'boolean' ? val.enabled : true;
        if (typeof val.apiKey === 'string') {
          merged.providers[targetKey].apiKey = val.apiKey.trim();
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
      enabled: typeof a.enabled === 'boolean' ? a.enabled : true
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
// 5. Navigation & Topbar
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

  btnPrev.addEventListener('click', () => {
    const curIdx = PAGES_ORDER.indexOf(state.activePage);
    if (curIdx > 0) {
      navigateToPage(PAGES_ORDER[curIdx - 1]);
    }
  });

  btnNext.addEventListener('click', () => {
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
  state.activePage = pageId;

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.page-view').forEach(view => {
    if (view.id === `page-${pageId}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  const curIdx = PAGES_ORDER.indexOf(pageId);
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if (btnPrev) btnPrev.disabled = curIdx === 0;
  if (btnNext) btnNext.disabled = curIdx === PAGES_ORDER.length - 1;

  if (pageId === 'filters') {
    renderFiltersPriority();
  } else if (pageId === 'settings') {
    renderManifestOutput();
  }
}

function setupTopbarActions() {
  document.getElementById('btn-topbar-save').addEventListener('click', () => {
    saveAndInstall();
  });

  document.getElementById('btn-home-save-install')?.addEventListener('click', () => {
    saveAndInstall();
  });

  document.getElementById('btn-restore').addEventListener('click', () => {
    state.config = JSON.parse(JSON.stringify(state.initialConfig));
    renderAll();
    updateUnsavedStatus();
    showToast('Configurações restauradas para o estado anterior.');
  });

  document.getElementById('btn-discard').addEventListener('click', () => {
    if (confirm('Deseja descartar as alterações e redefinir para a configuração padrão?')) {
      state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      renderAll();
      updateUnsavedStatus();
      showToast('Configurações redefinidas para o padrão.');
    }
  });

  const toggleNoDrafts = document.getElementById('toggle-no-drafts');
  toggleNoDrafts.checked = !state.draftsEnabled;
  toggleNoDrafts.addEventListener('change', () => {
    state.draftsEnabled = !toggleNoDrafts.checked;
    localStorage.setItem('aiosubtitles_no_drafts', toggleNoDrafts.checked ? 'true' : 'false');
    if (!state.draftsEnabled) {
      localStorage.removeItem('aiosubtitles_draft_config');
    }
  });

  document.getElementById('btn-signout').addEventListener('click', () => {
    if (confirm('Deseja sair e limpar a configuração atual deste navegador?')) {
      localStorage.removeItem('aiosubtitles_draft_config');
      window.location.href = '/configure';
    }
  });
}

function updateUnsavedStatus() {
  const isDirty = JSON.stringify(state.config) !== JSON.stringify(state.initialConfig);
  const pill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');

  if (isDirty) {
    pill.className = 'unsaved-status-pill dirty';
    statusText.textContent = 'Unsaved changes';
    if (state.draftsEnabled) {
      localStorage.setItem('aiosubtitles_draft_config', JSON.stringify(state.config));
    }
  } else {
    pill.className = 'unsaved-status-pill clean';
    statusText.textContent = 'All changes saved';
  }
}

function markDirty() {
  updateUnsavedStatus();
}

function saveAndInstall() {
  const encoded = encodeConfig(state.config);
  state.initialConfig = JSON.parse(JSON.stringify(state.config));
  updateUnsavedStatus();

  const baseUrl = window.location.origin;
  const manifestUrl = `${baseUrl}/${encoded}/manifest.json`;

  const newPath = `/${encoded}/configure`;
  window.history.replaceState(null, '', newPath);

  renderManifestOutput();
  navigateToPage('settings');
  showToast('Configuração salva com sucesso!');
}

// =============================================================================
// 6. Home Actions
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
    markDirty();
    closeBrandingModal();
    showToast('Identidade da instância atualizada.');
  });

  document.getElementById('btn-cancel-branding')?.addEventListener('click', closeBrandingModal);
  document.getElementById('btn-close-branding-modal')?.addEventListener('click', closeBrandingModal);
}

function openBrandingModal() {
  document.getElementById('modal-input-name').value = state.config.instanceName || '';
  document.getElementById('modal-input-desc').value = state.config.instanceDesc || '';
  document.getElementById('modal-input-logo').value = state.config.instanceLogo || '';
  document.getElementById('modal-input-version').value = state.config.instanceVersion || '';
  document.getElementById('modal-branding').classList.add('active');
}

function closeBrandingModal() {
  document.getElementById('modal-branding').classList.remove('active');
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
// 7. Services Actions & Automatic Background Validation
// =============================================================================
function setupServicesActions() {
  const serviceIds = ['opensubtitles', 'subdl', 'subsource'];

  serviceIds.forEach(id => {
    // Toggle ON/OFF
    const toggle = document.getElementById(`svc-toggle-${id}`);
    if (toggle) {
      toggle.addEventListener('change', () => {
        if (!state.config.providers[id]) {
          state.config.providers[id] = { enabled: true, apiKey: '' };
        }
        state.config.providers[id].enabled = toggle.checked;
        markDirty();
        renderFiltersPriority();
        updateStats();
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
      document.querySelectorAll('#services-list-container .service-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? 'flex' : 'none';
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
      state.config.providers[serviceId] = { enabled: true, apiKey: '' };
    }
    state.config.providers[serviceId].apiKey = newKey;

    markDirty();
    renderFiltersPriority();
    updateStats();
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

  document.getElementById('modal-service-config').classList.add('active');
}

function closeServiceConfigModal() {
  clearTimeout(state.validationDebounceTimer);
  document.getElementById('modal-service-config').classList.remove('active');
}

function triggerAutoValidation(serviceId, apiKey) {
  const statusEl = document.getElementById('modal-key-status');
  if (!statusEl) return;

  const trimmed = (apiKey || '').trim();
  if (!trimmed) {
    statusEl.className = 'api-key-validation-indicator';
    statusEl.innerHTML = '';
    statusEl.title = '';
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
        statusEl.innerHTML = '✓';
        statusEl.title = 'API Key válida';
      } else {
        statusEl.className = 'api-key-validation-indicator invalid';
        statusEl.innerHTML = '✕';
        statusEl.title = data.error || 'API Key inválida';
      }
    } catch {
      statusEl.className = 'api-key-validation-indicator invalid';
      statusEl.innerHTML = '✕';
      statusEl.title = 'Erro de conexão na validação';
    }
  }, 450);
}

function renderServicesState() {
  const serviceIds = ['opensubtitles', 'subdl', 'subsource'];
  serviceIds.forEach(id => {
    const toggle = document.getElementById(`svc-toggle-${id}`);
    if (toggle) {
      const prov = state.config.providers[id];
      toggle.checked = prov ? prov.enabled !== false : true;
    }
  });
}

// =============================================================================
// 8. Addons Actions (Imported Only — NO MARKETPLACE)
// =============================================================================
function setupAddonsActions() {
  // Import by Manifest URL
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

        // Addon is valid and provides subtitles
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
          enabled: true
        };

        state.config.customAddons.push(newAddon);
        if (!state.config.providerPriority.includes(newAddon.id)) {
          state.config.providerPriority.push(newAddon.id);
        }

        inputUrl.value = '';
        showImportFeedback(`Addon "${newAddon.name}" importado com sucesso!`, true);
        markDirty();
        renderInstalledAddons();
        renderFiltersPriority();
        updateStats();
      } catch (err) {
        showImportFeedback('Não foi possível conectar ao endpoint do manifest.', false);
      } finally {
        btnImport.disabled = false;
        btnImport.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Importar
        `;
      }
    });
  }

  // Search installed addons
  const searchInput = document.getElementById('search-installed-addons');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderInstalledAddons(searchInput.value.toLowerCase().trim());
    });
  }

  // Fetching strategy
  const strategySelect = document.getElementById('select-fetching-strategy');
  if (strategySelect) {
    strategySelect.value = state.config.addonFetchingStrategy || 'default';
    strategySelect.addEventListener('change', () => {
      state.config.addonFetchingStrategy = strategySelect.value;
      markDirty();
    });
  }

  // Edit Addon Modal
  document.getElementById('btn-save-edit-addon')?.addEventListener('click', () => {
    const id = document.getElementById('edit-addon-id').value;
    const name = document.getElementById('edit-addon-name').value.trim();
    const url = document.getElementById('edit-addon-url').value.trim();

    const addon = state.config.customAddons.find(a => a.id === id);
    if (addon) {
      if (name) addon.name = name;
      if (url) addon.manifestUrl = url;
      markDirty();
      renderInstalledAddons();
      renderFiltersPriority();
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
  list.forEach(addon => {
    const row = document.createElement('div');
    row.className = 'addon-row';
    row.dataset.id = addon.id;

    const logoHtml = addon.logo
      ? `<img src="${escapeHtml(addon.logo)}" alt="${escapeHtml(addon.name)}" onerror="this.src='https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png'">`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>`;

    row.innerHTML = `
      <div class="addon-left">
        <div class="addon-logo">${logoHtml}</div>
        <div class="addon-info">
          <span class="addon-name">${escapeHtml(addon.name)}</span>
          <div class="addon-url-row">
            <span class="addon-url" title="${escapeHtml(addon.manifestUrl)}">${escapeHtml(addon.manifestUrl)}</span>
            <button class="btn-copy-sm" data-url="${escapeHtml(addon.manifestUrl)}" title="Copiar Manifest URL">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="addon-right">
        <label class="compact-switch" title="Ativar ou desativar este addon">
          <input type="checkbox" class="toggle-addon" data-id="${addon.id}" ${addon.enabled !== false ? 'checked' : ''}>
          <span class="compact-slider"></span>
        </label>
        <button class="btn-addon-action btn-edit-addon" data-id="${addon.id}" title="Editar informações do addon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button class="btn-addon-action delete btn-delete-addon" data-id="${addon.id}" title="Excluir addon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;

    // Toggle listener
    row.querySelector('.toggle-addon').addEventListener('change', (e) => {
      addon.enabled = e.target.checked;
      markDirty();
      renderFiltersPriority();
      updateStats();
    });

    // Copy URL listener
    row.querySelector('.btn-copy-sm').addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(addon.manifestUrl);
      showToast('Manifest URL copiada!');
    });

    // Edit listener
    row.querySelector('.btn-edit-addon').addEventListener('click', () => {
      openEditAddonModal(addon);
    });

    // Delete listener
    row.querySelector('.btn-delete-addon').addEventListener('click', () => {
      if (confirm(`Deseja remover o addon "${addon.name}"?`)) {
        state.config.customAddons = state.config.customAddons.filter(a => a.id !== addon.id);
        state.config.providerPriority = state.config.providerPriority.filter(id => id !== addon.id);
        markDirty();
        renderInstalledAddons();
        renderFiltersPriority();
        updateStats();
        showToast('Addon excluído.');
      }
    });

    container.appendChild(row);
  });
}

function openEditAddonModal(addon) {
  document.getElementById('edit-addon-id').value = addon.id;
  document.getElementById('edit-addon-name').value = addon.name || '';
  document.getElementById('edit-addon-url').value = addon.manifestUrl || '';
  document.getElementById('modal-edit-addon').classList.add('active');
}

function closeEditAddonModal() {
  document.getElementById('modal-edit-addon').classList.remove('active');
}

// =============================================================================
// 9. Filters Actions (Dynamic Priority, Whitelist, Remap, Deduplication)
// =============================================================================
function setupFiltersActions() {
  // Deduplication toggle
  const toggleDedup = document.getElementById('toggle-deduplication');
  if (toggleDedup) {
    toggleDedup.checked = state.config.deduplication !== false;
    toggleDedup.addEventListener('change', () => {
      state.config.deduplication = toggleDedup.checked;
      markDirty();
      updateStats();
    });
  }

  // Deduplication strategy
  const selectDedupStrategy = document.getElementById('select-dedup-strategy');
  if (selectDedupStrategy) {
    selectDedupStrategy.value = state.config.deduplicationStrategy || 'both';
    selectDedupStrategy.addEventListener('change', () => {
      state.config.deduplicationStrategy = selectDedupStrategy.value;
      markDirty();
      updateStats();
    });
  }

  // Timeout slider
  const timeoutSlider = document.getElementById('timeout-slider');
  const timeoutDisplay = document.getElementById('timeout-display');
  if (timeoutSlider && timeoutDisplay) {
    timeoutSlider.value = state.config.providerTimeoutMs || 6000;
    timeoutDisplay.textContent = `${timeoutSlider.value} ms (${(timeoutSlider.value / 1000).toFixed(1)}s)`;
    timeoutSlider.addEventListener('input', () => {
      timeoutDisplay.textContent = `${timeoutSlider.value} ms (${(timeoutSlider.value / 1000).toFixed(1)}s)`;
      state.config.providerTimeoutMs = parseInt(timeoutSlider.value, 10);
      markDirty();
    });
  }

  // Quick languages buttons
  document.getElementById('btn-quick-pt-en')?.addEventListener('click', () => {
    state.config.languages = ['pob', 'por', 'eng'];
    renderLanguageChips();
    markDirty();
    updateStats();
  });

  document.getElementById('btn-clear-langs')?.addEventListener('click', () => {
    state.config.languages = [];
    renderLanguageChips();
    markDirty();
    updateStats();
  });

  // Languages search
  const searchLangInput = document.getElementById('search-languages');
  if (searchLangInput) {
    searchLangInput.addEventListener('input', () => {
      renderLanguageChips(searchLangInput.value.toLowerCase().trim());
    });
  }

  // Add remap rule
  document.getElementById('btn-add-remap')?.addEventListener('click', () => {
    const fromInput = document.getElementById('input-remap-from');
    const toInput = document.getElementById('input-remap-to');
    const fromVal = fromInput.value.trim().toLowerCase();
    const toVal = toInput.value.trim().toLowerCase();

    if (!fromVal || !toVal) {
      alert('Preencha os códigos de origem e destino para o remapeamento.');
      return;
    }

    if (!state.config.languageRemap) {
      state.config.languageRemap = {};
    }
    state.config.languageRemap[fromVal] = toVal;
    fromInput.value = '';
    toInput.value = '';

    markDirty();
    renderRemapTable();
  });
}

/**
 * Renders ONLY active native services and active imported addons.
 * Supports drag-and-drop reordering and Up/Down button clicks.
 */
function renderFiltersPriority() {
  const container = document.getElementById('priority-list-container');
  if (!container) return;

  // 1. Gather all currently active items:
  // Native services: must be enabled AND have an API key configured (required by spec)
  const activeItemsMap = new Map();

  const nativeKeys = ['opensubtitles', 'subdl', 'subsource'];
  for (const id of nativeKeys) {
    const prov = state.config.providers[id];
    if (prov && prov.enabled !== false && prov.apiKey && prov.apiKey.trim() !== '') {
      activeItemsMap.set(id, {
        id,
        name: SERVICES_META[id]?.name || id,
        type: 'Serviço Nativo'
      });
    }
  }

  // Custom imported addons: must be enabled
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

  // 2. Build ordered list adhering to state.config.providerPriority
  const orderedList = [];
  const currentPriority = Array.isArray(state.config.providerPriority) ? state.config.providerPriority : [];

  for (const id of currentPriority) {
    if (activeItemsMap.has(id)) {
      orderedList.push(activeItemsMap.get(id));
      activeItemsMap.delete(id);
    }
  }

  // Any newly enabled item not yet in providerPriority array is appended
  for (const item of activeItemsMap.values()) {
    orderedList.push(item);
  }

  // Sync state.config.providerPriority so order is persisted
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
        <span class="drag-handle" title="Arraste para reordenar">☰</span>
        <span class="priority-name">${escapeHtml(item.name)}</span>
        <span class="priority-type-badge">${item.type}</span>
      </div>
      <div class="priority-right">
        <button class="btn-priority-move" data-action="up" data-index="${index}" title="Mover para cima" ${index === 0 ? 'disabled style="opacity:0.3;cursor:default"' : ''}>▲</button>
        <button class="btn-priority-move" data-action="down" data-index="${index}" title="Mover para baixo" ${index === orderedList.length - 1 ? 'disabled style="opacity:0.3;cursor:default"' : ''}>▼</button>
      </div>
    `;

    // HTML5 Drag and drop
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
        markDirty();
        renderFiltersPriority();
      }
    });

    container.appendChild(row);
  });

  // Up / Down buttons
  container.querySelectorAll('.btn-priority-move').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const action = btn.dataset.action;
      if (action === 'up' && idx > 0) {
        const temp = state.config.providerPriority[idx - 1];
        state.config.providerPriority[idx - 1] = state.config.providerPriority[idx];
        state.config.providerPriority[idx] = temp;
        markDirty();
        renderFiltersPriority();
      } else if (action === 'down' && idx < state.config.providerPriority.length - 1) {
        const temp = state.config.providerPriority[idx + 1];
        state.config.providerPriority[idx + 1] = state.config.providerPriority[idx];
        state.config.providerPriority[idx] = temp;
        markDirty();
        renderFiltersPriority();
      }
    });
  });
}

function renderLanguageChips(filterQuery = '') {
  const container = document.getElementById('language-chips-container');
  if (!container) return;

  const currentLangs = new Set((state.config.languages || []).map(l => l.toLowerCase()));
  let list = state.languagesList || FALLBACK_LANGUAGES;

  if (filterQuery) {
    list = list.filter(l => l.code.toLowerCase().includes(filterQuery) || (l.name || '').toLowerCase().includes(filterQuery));
  }

  container.innerHTML = '';
  list.forEach(l => {
    const isSelected = currentLangs.has(l.code.toLowerCase());
    const chip = document.createElement('div');
    chip.className = `lang-chip ${isSelected ? 'selected' : ''}`;
    chip.textContent = `${l.code.toUpperCase()} — ${l.name || l.code}`;

    chip.addEventListener('click', () => {
      if (isSelected) {
        state.config.languages = state.config.languages.filter(code => code.toLowerCase() !== l.code.toLowerCase());
      } else {
        state.config.languages.push(l.code.toLowerCase());
      }
      markDirty();
      renderLanguageChips(filterQuery);
      updateStats();
    });

    container.appendChild(chip);
  });
}

function renderRemapTable() {
  const tbody = document.getElementById('remap-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const remap = state.config.languageRemap || {};
  const entries = Object.entries(remap);

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 12px;">Nenhuma regra configurada.</td></tr>`;
    return;
  }

  entries.forEach(([from, to]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="remap-code-badge">${escapeHtml(from)}</span></td>
      <td style="color: var(--text-muted); width: 24px;">→</td>
      <td><span class="remap-code-badge">${escapeHtml(to)}</span></td>
      <td style="width: 60px;">
        <button class="btn-addon-action delete" title="Excluir regra">✕</button>
      </td>
    `;

    tr.querySelector('.delete').addEventListener('click', () => {
      delete state.config.languageRemap[from];
      markDirty();
      renderRemapTable();
    });

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 10. Settings & Installation Actions
// =============================================================================
function setupSettingsActions() {
  // Copy Manifest URL
  document.getElementById('btn-copy-manifest')?.addEventListener('click', () => {
    const input = document.getElementById('final-manifest-url');
    if (input) {
      navigator.clipboard.writeText(input.value);
      showToast('Manifest URL copiada com sucesso!');
    }
  });

  // Server Cache Slider
  const cacheSlider = document.getElementById('cache-ttl-slider');
  const cacheDisplay = document.getElementById('cache-ttl-display');
  if (cacheSlider && cacheDisplay) {
    cacheSlider.value = state.config.cacheTtlMinutes || 30;
    cacheDisplay.textContent = `${cacheSlider.value} minutos`;
    cacheSlider.addEventListener('input', () => {
      cacheDisplay.textContent = `${cacheSlider.value} minutos`;
      state.config.cacheTtlMinutes = parseInt(cacheSlider.value, 10);
      markDirty();
    });
  }

  // Backup / Export JSON
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.config, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'aiosubtitles-config.json');
    dlAnchor.click();
    showToast('Configuração exportada em JSON.');
  });

  // Restore / Import JSON
  const fileInput = document.getElementById('file-input-json');
  document.getElementById('btn-import-json')?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        applyConfigWithMigration(parsed);
        renderAll();
        markDirty();
        showToast('Configuração importada com sucesso!');
      } catch {
        alert('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

function renderManifestOutput() {
  const encoded = encodeConfig(state.config);
  const baseUrl = window.location.origin;
  const manifestUrl = `${baseUrl}/${encoded}/manifest.json`;

  const inputEl = document.getElementById('final-manifest-url');
  if (inputEl) inputEl.value = manifestUrl;

  const linkStremio = document.getElementById('link-install-stremio');
  if (linkStremio) {
    const stremioUrl = manifestUrl.replace(/^https?:\/\//i, 'stremio://');
    linkStremio.href = stremioUrl;
  }
}

// =============================================================================
// 11. Modals (Nuvio QR Code, Generic)
// =============================================================================
function setupModals() {
  document.getElementById('btn-open-nuvio-modal')?.addEventListener('click', () => {
    const encoded = encodeConfig(state.config);
    const baseUrl = window.location.origin;
    const manifestUrl = `${baseUrl}/${encoded}/manifest.json`;

    const qrBox = document.getElementById('qr-code-box');
    if (qrBox && window.QRCode) {
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
    }

    document.getElementById('modal-nuvio').classList.add('active');
  });

  document.getElementById('btn-close-nuvio-modal')?.addEventListener('click', () => {
    document.getElementById('modal-nuvio').classList.remove('active');
  });

  document.getElementById('btn-done-nuvio')?.addEventListener('click', () => {
    document.getElementById('modal-nuvio').classList.remove('active');
  });
}

// =============================================================================
// 12. Stats & Rendering Helpers
// =============================================================================
function updateStats() {
  const activeSvcCount = Object.keys(state.config.providers).filter(
    k => state.config.providers[k]?.enabled !== false
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
  renderLanguageChips();
  renderRemapTable();
  renderFiltersPriority();
  renderManifestOutput();
  updateStats();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
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
