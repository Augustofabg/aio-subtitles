import { UserConfig, PartialUserConfig } from '../types/config';

export const DEFAULT_USER_CONFIG: UserConfig = {
  providers: {
    'opensubtitles-v3': { enabled: true },
    'opensubtitles-rest': { enabled: true, apiKey: '' },
    'subdl': { enabled: true, apiKey: '' },
    'subsource': { enabled: true },
    'addic7ed': { enabled: true }
  },
  customAddons: [],
  providerPriority: [
    'opensubtitles-rest',
    'subdl',
    'opensubtitles-v3',
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
  namingTemplate: '[{provider}] {lang_flag} {release} {hi}',
  providerTimeoutMs: 6000,
  deduplication: true,
  proxySubtitles: true,
  cacheTtlMinutes: 30
};

/**
 * Encodes a UserConfig into a URL-safe Base64 string
 */
export function encodeUserConfig(config: UserConfig): string {
  const json = JSON.stringify(config);
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a configuration string (Base64URL, standard Base64, or URI-encoded JSON)
 * and deep-merges with default configuration.
 */
export function decodeUserConfig(encodedStr?: string | null): UserConfig {
  if (!encodedStr || encodedStr.trim() === '' || encodedStr === 'default') {
    return { ...DEFAULT_USER_CONFIG };
  }

  try {
    let jsonStr = '';
    // Normalize base64url
    let base64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    try {
      jsonStr = Buffer.from(base64, 'base64').toString('utf8');
      JSON.parse(jsonStr); // test parse
    } catch {
      // If direct base64 failed, try URL decode then parse
      try {
        jsonStr = decodeURIComponent(encodedStr);
        JSON.parse(jsonStr);
      } catch {
        jsonStr = encodedStr;
      }
    }

    const parsed: PartialUserConfig = JSON.parse(jsonStr);
    return mergeWithDefaults(parsed);
  } catch (err) {
    // If decoding or parsing completely fails, return safe defaults
    return { ...DEFAULT_USER_CONFIG };
  }
}

/**
 * Merges partial user config with defaults, ensuring valid types and bounds
 */
export function mergeWithDefaults(partial: PartialUserConfig): UserConfig {
  const customAddons = Array.isArray((partial as unknown as { customAddons?: unknown }).customAddons)
    ? ((partial as unknown as { customAddons: unknown[] }).customAddons
        .filter(a => a && typeof a === 'object' && typeof (a as { manifestUrl?: unknown }).manifestUrl === 'string')
        .map(a => {
          const item = a as { id?: string; name?: string; manifestUrl: string; enabled?: boolean };
          return {
            id: (item.id && String(item.id).trim()) || `addon-${Math.random().toString(36).substring(2, 8)}`,
            name: (item.name && String(item.name).trim()) || 'External Addon',
            manifestUrl: String(item.manifestUrl).trim(),
            enabled: typeof item.enabled === 'boolean' ? item.enabled : true
          };
        }))
    : [];

  const result: UserConfig = {
    providers: { ...DEFAULT_USER_CONFIG.providers },
    customAddons,
    providerPriority: Array.isArray(partial.providerPriority) && partial.providerPriority.length > 0
      ? partial.providerPriority
      : [...DEFAULT_USER_CONFIG.providerPriority],
    languages: Array.isArray(partial.languages) && partial.languages.length > 0
      ? partial.languages.map(l => l.trim().toLowerCase())
      : [...DEFAULT_USER_CONFIG.languages],
    allowUnknownLanguages: typeof partial.allowUnknownLanguages === 'boolean'
      ? partial.allowUnknownLanguages
      : DEFAULT_USER_CONFIG.allowUnknownLanguages,
    languageRemap: typeof partial.languageRemap === 'object' && partial.languageRemap !== null
      ? { ...partial.languageRemap }
      : { ...DEFAULT_USER_CONFIG.languageRemap },
    namingTemplate: typeof partial.namingTemplate === 'string' && partial.namingTemplate.trim() !== ''
      ? partial.namingTemplate
      : DEFAULT_USER_CONFIG.namingTemplate,
    providerTimeoutMs: typeof partial.providerTimeoutMs === 'number'
      ? Math.max(2000, Math.min(15000, partial.providerTimeoutMs))
      : DEFAULT_USER_CONFIG.providerTimeoutMs,
    deduplication: typeof partial.deduplication === 'boolean'
      ? partial.deduplication
      : DEFAULT_USER_CONFIG.deduplication,
    proxySubtitles: typeof partial.proxySubtitles === 'boolean'
      ? partial.proxySubtitles
      : DEFAULT_USER_CONFIG.proxySubtitles,
    cacheTtlMinutes: typeof partial.cacheTtlMinutes === 'number'
      ? Math.max(1, Math.min(1440, partial.cacheTtlMinutes))
      : DEFAULT_USER_CONFIG.cacheTtlMinutes
  };

  // Merge individual providers
  if (partial.providers && typeof partial.providers === 'object') {
    for (const [key, val] of Object.entries(partial.providers)) {
      if (val && typeof val === 'object') {
        result.providers[key] = {
          enabled: typeof val.enabled === 'boolean' ? val.enabled : true,
          apiKey: typeof val.apiKey === 'string' ? val.apiKey.trim() : undefined,
          username: typeof val.username === 'string' ? val.username.trim() : undefined,
          password: typeof val.password === 'string' ? val.password : undefined,
          customEndpoint: typeof val.customEndpoint === 'string' ? val.customEndpoint.trim() : undefined
        };
      }
    }
  }

  return result;
}
