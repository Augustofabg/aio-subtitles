import { SubtitleProvider, SubtitleQuery, RawSubtitleItem, ProviderContext } from '../types/provider';
import { UserConfig } from '../types/config';
import { OpenSubtitlesV3Provider } from './openSubtitlesV3';
import { OpenSubtitlesRestProvider } from './openSubtitlesRest';
import { SubDLProvider } from './subdl';
import { SubsourceProvider } from './subsource';
import { Addic7edProvider } from './addic7ed';
import { Logger } from '../utils/logger';

// Instantiate available providers
const PROVIDERS: SubtitleProvider[] = [
  new OpenSubtitlesRestProvider(),
  new SubDLProvider(),
  new OpenSubtitlesV3Provider(),
  new SubsourceProvider(),
  new Addic7edProvider()
];

const PROVIDER_MAP = new Map<string, SubtitleProvider>();
for (const p of PROVIDERS) {
  PROVIDER_MAP.set(p.id, p);
}

/**
 * Returns list of all registered providers and their metadata
 */
export function getAllProviders(): SubtitleProvider[] {
  return [...PROVIDERS];
}

/**
 * Executes subtitle search across all enabled providers in parallel using Promise.allSettled
 */
export async function executeParallelSearch(
  query: SubtitleQuery,
  config: UserConfig
): Promise<RawSubtitleItem[]> {
  // Determine which providers to run
  const enabledProviders = PROVIDERS.filter(provider => {
    const provConfig = config.providers[provider.id];
    if (!provConfig) {
      return provider.defaultEnabled;
    }
    return provConfig.enabled !== false;
  });

  Logger.info(`Searching subtitles across ${enabledProviders.length} providers`, {
    id: query.id,
    imdbId: query.imdbId,
    type: query.type,
    season: query.season,
    episode: query.episode,
    providers: enabledProviders.map(p => p.id),
    timeoutMs: config.providerTimeoutMs
  });

  // Launch all providers concurrently with Promise.allSettled
  const searchPromises = enabledProviders.map(provider => {
    const context: ProviderContext = {
      config,
      providerConfig: config.providers[provider.id] || { enabled: true },
      timeoutMs: config.providerTimeoutMs
    };
    return provider.search(query, context);
  });

  const settledResults = await Promise.allSettled(searchPromises);

  const aggregatedSubtitles: RawSubtitleItem[] = [];

  settledResults.forEach((result, idx) => {
    const provider = enabledProviders[idx];
    if (result.status === 'fulfilled') {
      aggregatedSubtitles.push(...result.value);
    } else {
      Logger.error(`Provider [${provider.id}] search promise rejected`, result.reason);
    }
  });

  return aggregatedSubtitles;
}
