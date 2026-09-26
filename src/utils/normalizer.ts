import { normalizeLanguageCode, isValidIso639_2 } from './languages';

export interface LanguageValidationResult {
  valid: boolean;
  normalizedLang: string;
  discardedReason?: string;
}

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

  // Match raw string in user remap rules first (e.g. "pt-br" -> "pob")
  if (remapRules && remapRules[cleanRaw]) {
    const remapped = remapRules[cleanRaw].trim().toLowerCase();
    const normalizedRemapped = normalizeLanguageCode(remapped) || remapped;
    if (isValidIso639_2(normalizedRemapped)) {
      return { valid: true, normalizedLang: normalizedRemapped };
    }
  }

  // Canonicalize to ISO 639-2
  const normalized = normalizeLanguageCode(cleanRaw);

  if (normalized && isValidIso639_2(normalized)) {
    if (remapRules && remapRules[normalized]) {
      const remapped = remapRules[normalized].trim().toLowerCase();
      const remappedNorm = normalizeLanguageCode(remapped) || remapped;
      if (isValidIso639_2(remappedNorm)) {
        return { valid: true, normalizedLang: remappedNorm };
      }
    }
    return { valid: true, normalizedLang: normalized };
  }

  if (allowUnknown) {
    return { valid: true, normalizedLang: 'und' };
  }

  return {
    valid: false,
    normalizedLang: '',
    discardedReason: `Código de idioma "${rawLang}" não é um ISO 639-2 válido reconhecido.`
  };
}

export function isLanguageWhitelisted(
  normalizedLang: string,
  whitelist: string[]
): boolean {
  if (!whitelist || whitelist.length === 0) {
    return true;
  }

  const cleanLang = normalizedLang.trim().toLowerCase();
  const normalizedWhitelist = whitelist
    .map(l => normalizeLanguageCode(l) || l.trim().toLowerCase());

  return normalizedWhitelist.includes(cleanLang);
}
