import { StremioSubtitle, StremioSubtitlesResponse } from '../types/stremio';
import { SubtitleQuery, RawSubtitleItem } from '../types/provider';
import { UserConfig } from '../types/config';
import { executeParallelSearch } from '../providers';
import { validateAndNormalizeLanguage, isLanguageWhitelisted } from '../utils/normalizer';
import { buildTemplateContext, renderTemplate } from '../utils/template';
import { deduplicateSubtitles, prioritizeSubtitles } from '../utils/deduplicator';
import { globalSubtitleCache } from '../utils/cache';
import { registerProxyDownload } from '../proxy/subtitleProxy';
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
 */
export async function getAggregatedSubtitles(
  query: SubtitleQuery,
  config: UserConfig,
  baseUrl: string
): Promise<StremioSubtitlesResponse> {
  const enabledProviderIds = Object.keys(config.providers).filter(
    id => config.providers[id]?.enabled !== false
  );

  // 1. Check Cache
  const cacheKey = globalSubtitleCache.generateKey(
    query.id,
    config.languages,
    enabledProviderIds,
    query.season,
    query.episode
  );

  let rawSubtitles = globalSubtitleCache.get(cacheKey);

  if (!rawSubtitles) {
    // 2. Fetch concurrently from all enabled providers
    rawSubtitles = await executeParallelSearch(query, config);
    // Cache the raw provider results
    globalSubtitleCache.set(cacheKey, rawSubtitles, config.cacheTtlMinutes);
  } else {
    Logger.info(`Serving subtitles from cache for ${query.id} (${rawSubtitles.length} items)`);
  }

  // 3. Language Normalization & Whitelist Filtering (Bug 6.2 fix)
  const validAndWhitelistedItems: RawSubtitleItem[] = [];

  for (const sub of rawSubtitles) {
    const validation = validateAndNormalizeLanguage(
      sub.lang,
      config.allowUnknownLanguages,
      config.languageRemap
    );

    if (!validation.valid) {
      Logger.warn(`Discarded subtitle due to invalid ISO 639-2 language: "${sub.lang}" from provider [${sub.provider}]`, {
        provider: sub.providerName || sub.provider,
        release: sub.release,
        reason: validation.discardedReason
      });
      continue;
    }

    if (isLanguageWhitelisted(validation.normalizedLang, config.languages)) {
      // Store normalized and remapped ISO 639-2 code directly on item
      sub.lang = validation.normalizedLang;
      validAndWhitelistedItems.push(sub);
    }
  }

  Logger.info(`Language filter & validation: ${rawSubtitles.length} -> ${validAndWhitelistedItems.length} subtitles`, {
    whitelist: config.languages,
    allowUnknown: config.allowUnknownLanguages
  });

  // 4. Prioritization by provider order (Requirement #5)
  let orderedItems = prioritizeSubtitles(validAndWhitelistedItems, config.providerPriority);

  // 5. Deduplication (Requirement #5)
  if (config.deduplication) {
    const beforeCount = orderedItems.length;
    orderedItems = deduplicateSubtitles(orderedItems);
    Logger.info(`Deduplication: ${beforeCount} -> ${orderedItems.length} subtitles`);
  }

  // 6. Formatting, Short-ID Proxy Generation & Clean IDs (Bug 6.3 fix)
  const formattedSubtitles: StremioSubtitle[] = orderedItems.map((item, index) => {
    // Build naming context and render custom template
    const ctx = buildTemplateContext(item, item.lang);
    const customLabel = renderTemplate(config.namingTemplate, ctx);
    const ext = item.format || (item.url.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt');
    const filename = `${customLabel}.${ext}`.replace(/[\\/:*?"<>|]/g, '_');

    // Clean readable ID without any base64
    const cleanId = `${item.provider}-${item.lang}-${index + 1}`;

    // Handle Subtitle URL: Short-ID Proxy or direct URL
    let subtitleUrl = item.url;
    if (config.proxySubtitles) {
      // Register in internal Proxy store (never leaks base64 into client UI)
      const shortId = registerProxyDownload({
        originalUrl: item.url,
        filename,
        provider: item.provider,
        format: ext,
        apiKey: config.providers[item.provider]?.apiKey,
        fileId: (item.rawMetadata as Record<string, unknown> | undefined)?.fileId as string | number | undefined
      });
      subtitleUrl = `${baseUrl}/download/${shortId}/${encodeURIComponent(filename)}`;
    }

    return {
      id: cleanId,
      url: subtitleUrl,
      lang: item.lang,
      // Provide custom file and title fields for players that support them (like Nuvio or Stremio Web)
      file: filename,
      title: customLabel
    };
  });

  return {
    subtitles: formattedSubtitles
  };
}
