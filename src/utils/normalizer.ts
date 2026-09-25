import { normalizeLanguageCode, isValidIso639_2 } from './languages';

export interface LanguageValidationResult {
  valid: boolean;
  normalizedLang: string;
  discardedReason?: string;
}

/**
 * Bug 6.2 fix: Strictly validates and canonicalizes language codes to ISO 639-2.
 * If invalid or unrecognized, discards the subtitle (unless allowUnknown is explicitly true).
 */
export function validateAndNormalizeLanguage(
  rawLang: string | undefined | null,
  allowUnknown: boolean = false,
  remapRules?: Record<string, string>
): LanguageValidationResult {
  if (!rawLang || typeof rawLang !== 'string' || rawLang.trim() === '') {
    if (allowUnknown) {
      return { valid: true, normalizedLang: 'und' };
    }
    return {
      valid: false,
      normalizedLang: '',
      discardedReason: 'Campo de idioma vazio ou ausente na resposta do provedor.'
    };
  }

  const cleanRaw = rawLang.trim().toLowerCase();

  // 1. Check direct raw match in user's remap rules (e.g. "pt-br" -> "pob")
  if (remapRules && remapRules[cleanRaw]) {
    const remapped = remapRules[cleanRaw].trim().toLowerCase();
    const normalizedRemapped = normalizeLanguageCode(remapped) || remapped;
    if (isValidIso639_2(normalizedRemapped)) {
      return { valid: true, normalizedLang: normalizedRemapped };
    }
  }

  // 2. Canonicalize standard language code/name/alias to ISO 639-2
  const normalized = normalizeLanguageCode(cleanRaw);

  if (normalized && isValidIso639_2(normalized)) {
    // 3. Apply remapping to normalized code (e.g. "por" -> "pob")
    if (remapRules && remapRules[normalized]) {
      const remapped = remapRules[normalized].trim().toLowerCase();
      const remappedNorm = normalizeLanguageCode(remapped) || remapped;
      if (isValidIso639_2(remappedNorm)) {
        return { valid: true, normalizedLang: remappedNorm };
      }
    }
    return { valid: true, normalizedLang: normalized };
  }

  // 4. Code could not be resolved to any valid ISO 639-2
  if (allowUnknown) {
    // Stremio recognizes 'und' (undetermined) cleanly without creating arbitrary broken tabs
    return { valid: true, normalizedLang: 'und' };
  }

  return {
    valid: false,
    normalizedLang: '',
    discardedReason: `Código de idioma "${rawLang}" não é um ISO 639-2 válido reconhecido.`
  };
}

/**
 * Checks if a normalized ISO 639-2 language code satisfies the user's whitelist.
 */
export function isLanguageWhitelisted(
  normalizedLang: string,
  whitelist: string[]
): boolean {
  if (!whitelist || whitelist.length === 0) {
    return true; // No filter configured means accept all
  }

  const cleanLang = normalizedLang.trim().toLowerCase();
  const normalizedWhitelist = whitelist
    .map(l => normalizeLanguageCode(l) || l.trim().toLowerCase());

  return normalizedWhitelist.includes(cleanLang);
}

/**
 * Applies language remapping rules defined by the user.
 * e.g. { "por": "pob", "pt-br": "pob", "pt": "pob" }
 */
export function applyLanguageRemap(
  rawLang: string,
  remapRules: Record<string, string> | undefined
): string {
  const validation = validateAndNormalizeLanguage(rawLang, true, remapRules);
  return validation.normalizedLang || 'und';
}
