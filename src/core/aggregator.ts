import { StremioSubtitle, StremioSubtitlesResponse } from '../types/stremio';
import { SubtitleQuery, RawSubtitleItem } from '../types/provider';
import { UserConfig } from '../types/config';
import { executeParallelSearch } from '../providers';
import { isLanguageWhitelisted, applyLanguageRemap } from '../utils/normalizer';
import { buildTemplateContext, renderTemplate } from '../utils/template';
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

  // 3. Language Normalization & Whitelist Filtering (Problem #1)
  const whitelistedItems = rawSubtitles.filter(sub =>
    isLanguageWhitelisted(sub.lang, config.languages, config.languageRemap)
  );

  Logger.info(`Language filter: ${rawSubtitles.length} -> ${whitelistedItems.length} subtitles`, {
    whitelist: config.languages
  });

  // 4. Prioritization by provider order (Requirement #5)
  let orderedItems = prioritizeSubtitles(whitelistedItems, config.providerPriority);

  // 5. Deduplication (Requirement #5)
  if (config.deduplication) {
    const beforeCount = orderedItems.length;
    orderedItems = deduplicateSubtitles(orderedItems);
    Logger.info(`Deduplication: ${beforeCount} -> ${orderedItems.length} subtitles`);
  }

  // 6. Language Remapping (Problem #2) and Naming Customization (Problem #4)
  const formattedSubtitles: StremioSubtitle[] = orderedItems.map((item, index) => {
    // Apply language remapping before responding (e.g. por -> pob)
    const remappedLang = applyLanguageRemap(item.lang, config.languageRemap);

    // Build naming context and render custom template
    const ctx = buildTemplateContext(item, remappedLang);
    const customLabel = renderTemplate(config.namingTemplate, ctx);
    const ext = item.format || (item.url.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt');
    const filename = `${customLabel}.${ext}`.replace(/[\\/:*?"<>|]/g, '_');

    // Handle Subtitle URL: direct or proxy
    let subtitleUrl = item.url;
    if (config.proxySubtitles) {
      // Build proxy URL to inject Content-Disposition filename and fix UTF-8 encoding
      const encodedTarget = Buffer.from(item.url, 'utf8').toString('base64url');
      const encodedFilename = encodeURIComponent(filename);
      subtitleUrl = `${baseUrl}/proxy/subtitle/${encodedTarget}?filename=${encodedFilename}`;
    }

    return {
      id: `${item.id}-${index}`,
      url: subtitleUrl,
      lang: remappedLang,
      // Provide custom file and title fields for players that support them (like Nuvio or Stremio Web)
      file: filename,
      title: customLabel
    };
  });

  return {
    subtitles: formattedSubtitles
  };
}
