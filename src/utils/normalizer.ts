import { normalizeLanguageCode } from './languages';

/**
 * Checks if a given language satisfies the user's language whitelist.
 * Considers both the normalized code and any remapped value.
 */
export function isLanguageWhitelisted(
  rawLang: string,
  whitelist: string[],
  remapRules?: Record<string, string>
): boolean {
  if (!whitelist || whitelist.length === 0) {
    return true; // No filter configured means accept all
  }

  const normalized = normalizeLanguageCode(rawLang);
  const normalizedWhitelist = whitelist.map(l => normalizeLanguageCode(l));

  // Check direct normalized match
  if (normalizedWhitelist.includes(normalized)) {
    return true;
  }

  // Check if raw matches any in whitelist directly
  const rawLower = rawLang.trim().toLowerCase();
  if (whitelist.some(w => w.trim().toLowerCase() === rawLower)) {
    return true;
  }

  // Check if remapped version matches whitelist
  if (remapRules) {
    const remapped = applyLanguageRemap(rawLang, remapRules);
    const remappedNormalized = normalizeLanguageCode(remapped);
    if (normalizedWhitelist.includes(remappedNormalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Applies language remapping rules defined by the user.
 * e.g. { "por": "pob", "pt-br": "pob", "pt": "pob" }
 */
export function applyLanguageRemap(
  rawLang: string,
  remapRules: Record<string, string> | undefined
): string {
  if (!rawLang) return 'unknown';
  if (!remapRules || Object.keys(remapRules).length === 0) {
    return normalizeLanguageCode(rawLang);
  }

  const cleanRaw = rawLang.trim().toLowerCase();
  const normalized = normalizeLanguageCode(rawLang);

  // 1. Direct match on clean raw string (e.g. 'pt-br')
  if (remapRules[cleanRaw]) {
    return remapRules[cleanRaw].trim().toLowerCase();
  }

  // 2. Match on normalized 3-letter code (e.g. 'por' -> 'pob')
  if (remapRules[normalized]) {
    return remapRules[normalized].trim().toLowerCase();
  }

  // 3. Fallback to standard normalized code
  return normalized;
}
