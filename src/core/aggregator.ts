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
 * Bug 6.5 Assertion: Validates that id and label/filename never leak raw URLs
 * or unspaced tokens exceeding 80 characters (such as raw base64 or technical hashes).
 * Throws runtime error if an invalid or leaked value is detected.
 */
export function assertCleanSubtitleItem(id: string, label: string): void {
  if (!id || typeof id !== 'string') {
    throw new Error('CRITICAL PIPELINE LEAK: Subtitle id is empty or invalid');
  }
  if (!label || typeof label !== 'string') {
    throw new Error('CRITICAL PIPELINE LEAK: Subtitle label is empty or invalid');
  }

  // 1. Never allow http:// or https:// in id or label
  if (/https?:\/\//i.test(id)) {
    throw new Error(`CRITICAL PIPELINE LEAK: URL detected inside subtitle id: "${id}"`);
  }
  if (/https?:\/\//i.test(label)) {
    throw new Error(`CRITICAL PIPELINE LEAK: URL detected inside subtitle label: "${label}"`);
  }

  // 2. Never allow id to exceed 80 characters without spaces
  if (id.length > 80 && !id.includes(' ')) {
    throw new Error(`CRITICAL PIPELINE LEAK: Subtitle id exceeds 80 characters without spaces: "${id}"`);
  }

  // 3. Never allow any token in label to exceed 80 characters without spaces (e.g. leaked base64)
  const tokens = label.split(/\s+/);
  for (const token of tokens) {
    if (token.length > 80) {
      throw new Error(`CRITICAL PIPELINE LEAK: Subtitle label contains unspaced token exceeding 80 characters: "${token.substring(0, 30)}..."`);
    }
  }
}

/**
 * Main subtitle aggregation pipeline strictly following Bug 6.5 7-step execution order:
 *
 * 1. Fetch raw results from all connectors (native + custom external addons).
 * 2. BEFORE ANYTHING ELSE: Normalize `lang` to standard ISO 639-2. Discard (or isolate) invalid ones.
 * 3. Whitelist filter on already normalized `lang`.
 * 4. Prioritization and Deduplication.
 * 5. ONLY AFTER steps 1-4: Apply custom naming/label template to generate brand-new id and url.
 * 6. Generate short readable slug ID (no URLs, no base64) + runtime validation assert.
 * 7. Store upstream URL in proxy store and return internal proxy URL (/download/:idCurto.srt).
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
  // STEP 2: ANTES DE QUALQUER OUTRA COISA: Normalizar o campo lang para ISO 639-2
  // Descartar qualquer resultado com código não resolvido (a menos que allowUnknownLanguages = true)
  // NUNCA deixar lang bruto seguir adiante no pipeline!
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

    // Overwrite with normalized ISO 639-2 code so raw lang NEVER leaks
    sub.lang = validation.normalizedLang;
    normalizedItems.push(sub);
  }

  Logger.info(`Language validation (ISO 639-2): ${rawSubtitles.length} -> ${normalizedItems.length} subtitles`, {
    allowUnknown: config.allowUnknownLanguages
  });

  // =========================================================================
  // STEP 3: Aplicar filtro de idiomas permitidos (whitelist) sobre o lang já normalizado
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
    orderedItems = deduplicateSubtitles(orderedItems);
    Logger.info(`Deduplication: ${beforeCount} -> ${orderedItems.length} subtitles`);
  }

  // =========================================================================
  // STEP 5, 6, 7: Personalização de Nome/Rótulo, ID Curto & URL de Proxy Interno
  // SÓ DEPOIS de todas as etapas anteriores!
  // =========================================================================
  const formattedSubtitles: StremioSubtitle[] = orderedItems.map((item, index) => {
    // 5. Apply custom template to generate label and filename
    const ctx = buildTemplateContext(item, item.lang);
    const customLabel = renderTemplate(config.namingTemplate, ctx);
    const ext = item.format || (item.url.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt');
    const filename = `${customLabel}.${ext}`.replace(/[\\/:*?"<>|]/g, '_');

    // 6. Generate clean short slug ID based on provider, lang, and index
    // NEVER reuse the original connector ID or URL
    const providerSlug = (item.providerName || item.provider || 'sub')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    const cleanId = `${providerSlug}-${item.lang.toLowerCase()}-${index + 1}`;

    // Assert that cleanId and customLabel do not leak URLs or oversized base64 tokens
    assertCleanSubtitleItem(cleanId, customLabel);

    // 7. Subtitle file URL pointing to internal proxy endpoint (/download/:idCurto.srt)
    // Upstream URL is registered and stored exclusively in the proxy store
    const shortId = registerProxyDownload({
      originalUrl: item.url,
      filename,
      provider: item.provider,
      format: ext,
      apiKey: config.providers[item.provider]?.apiKey,
      fileId: (item.rawMetadata as Record<string, unknown> | undefined)?.fileId as string | number | undefined
    });

    const proxyUrl = `${baseUrl}/download/${shortId}.srt`;

    return {
      id: cleanId,
      url: proxyUrl,
      lang: item.lang,
      file: filename,
      title: customLabel
    };
  });

  return {
    subtitles: formattedSubtitles
  };
}
