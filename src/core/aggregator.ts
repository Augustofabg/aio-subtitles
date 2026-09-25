import { StremioSubtitle, StremioSubtitlesResponse } from '../types/stremio';
import { SubtitleQuery, RawSubtitleItem } from '../types/provider';
import { UserConfig } from '../types/config';
import { executeParallelSearch } from '../providers';
import { validateAndNormalizeLanguage, isLanguageWhitelisted } from '../utils/normalizer';
import { deduplicateSubtitles, prioritizeSubtitles } from '../utils/deduplicator';
import { globalSubtitleCache } from '../utils/cache';
import { Logger } from '../utils/logger';

/**
 * Parses Stremio parameters into a normalized SubtitleQuery
 */
export function parseSubtitleQuery(
  type: string,
  id: string,
  extra?: Record<string, string | undefined>
): SubtitleQuery {
  let imdbId: string | null = null;
  let season: number | null = null;
  let episode: number | null = null;
  let kitsuId: string | null = null;

  if (id.includes(':')) {
    const parts = id.split(':');
    if (parts[0].startsWith('tt')) {
      imdbId = parts[0];
      season = parseInt(parts[1], 10);
      episode = parseInt(parts[2], 10);
    } else if (parts[0] === 'kitsu') {
      kitsuId = `${parts[0]}:${parts[1]}`;
      episode = parseInt(parts[2], 10);
    } else {
      imdbId = parts[0];
    }
  } else if (id.startsWith('tt')) {
    imdbId = id;
  }

  return {
    type,
    id,
    imdbId,
    season: isNaN(Number(season)) ? null : season,
    episode: isNaN(Number(episode)) ? null : episode,
    kitsuId,
    extra
  };
}

/**
 * Main subtitle aggregation pipeline
 * 1. Fetch raw subtitles from all active native and imported connectors in parallel.
 * 2. Strictly normalize `lang` to ISO 639-2. Discard unmapped/invalid languages with warning log.
 * 3. Whitelist filter on normalized ISO 639-2 codes.
 * 4. Provider prioritization and deduplication.
 * 5. Return clean response to player with original provider id, normalized lang, and direct url.
 */
export async function getAggregatedSubtitles(
  query: SubtitleQuery,
  config: UserConfig,
  baseUrl: string
): Promise<StremioSubtitlesResponse> {
  const enabledProviderIds = Object.keys(config.providers).filter(
    id => config.providers[id]?.enabled !== false
  );

  const cacheKey = globalSubtitleCache.generateKey(
    query.id,
    config.languages,
    enabledProviderIds,
    query.season,
    query.episode
  );

  // =========================================================================
  // STEP 1: Fetch raw results from all connectors (native + custom addons)
  // =========================================================================
  let rawSubtitles = globalSubtitleCache.get(cacheKey);

  if (!rawSubtitles) {
    rawSubtitles = await executeParallelSearch(query, config);
    globalSubtitleCache.set(cacheKey, rawSubtitles, config.cacheTtlMinutes);
  } else {
    Logger.info(`Serving subtitles from cache for ${query.id} (${rawSubtitles.length} items)`);
  }

  // =========================================================================
  // STEP 2: Normalizar o campo lang para ISO 639-2
  // Descartar qualquer resultado com código não resolvido para evitar categoria "Desconhecido".
  // =========================================================================
  const normalizedItems: RawSubtitleItem[] = [];

  for (const sub of rawSubtitles) {
    const validation = validateAndNormalizeLanguage(
      sub.lang,
      config.allowUnknownLanguages,
      config.languageRemap
    );

    if (!validation.valid || !validation.normalizedLang) {
      Logger.warn(`Discarded subtitle due to invalid ISO 639-2 language: "${sub.lang}" from provider [${sub.provider}]`, {
        provider: sub.providerName || sub.provider,
        release: sub.release,
        reason: validation.discardedReason
      });
      continue;
    }

    // Overwrite with normalized ISO 639-2 code so raw lang never leaks to player
    sub.lang = validation.normalizedLang;
    normalizedItems.push(sub);
  }

  Logger.info(`Language validation (ISO 639-2): ${rawSubtitles.length} -> ${normalizedItems.length} subtitles`, {
    allowUnknown: config.allowUnknownLanguages
  });

  // =========================================================================
  // STEP 3: Aplicar filtro de idiomas permitidos (whitelist) sobre o lang normalizado
  // =========================================================================
  const whitelistedItems = normalizedItems.filter(item =>
    isLanguageWhitelisted(item.lang, config.languages)
  );

  Logger.info(`Language whitelist filter: ${normalizedItems.length} -> ${whitelistedItems.length} subtitles`, {
    whitelist: config.languages
  });

  // =========================================================================
  // STEP 4: Priorização por ordem de provedor e Deduplicação
  // =========================================================================
  let orderedItems = prioritizeSubtitles(whitelistedItems, config.providerPriority);

  if (config.deduplication) {
    const beforeCount = orderedItems.length;
    orderedItems = deduplicateSubtitles(orderedItems, 0.85, config.deduplicationStrategy || 'both');
    Logger.info(`Deduplication: ${beforeCount} -> ${orderedItems.length} subtitles`);
  }

  // =========================================================================
  // STEP 5: Resposta final limpa ao player Stremio/Nuvio
  // Retorna id, lang (normalizado) e url originais sem camada de reescrita de rótulo.
  // =========================================================================
  const subtitles: StremioSubtitle[] = orderedItems.map(item => {
    let finalUrl = item.url;
    if (finalUrl.startsWith('/')) {
      finalUrl = `${baseUrl}${finalUrl}`;
    }

    return {
      id: item.id,
      lang: item.lang,
      url: finalUrl
    };
  });

  return {
    subtitles
  };
}
