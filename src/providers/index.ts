import { SubtitleProvider, SubtitleQuery, RawSubtitleItem, ProviderContext } from '../types/provider';
import { UserConfig } from '../types/config';
import { OpenSubtitlesProvider } from './openSubtitles';
import { SubDLProvider } from './subdl';
import { SubsourceProvider } from './subsource';
import { GenericStremioAddonProvider } from './genericStremioAddon';
import { Logger } from '../utils/logger';

// Instantiate built-in providers (OpenSubtitles, SubDL, Subsource)
const BUILTIN_PROVIDERS: SubtitleProvider[] = [
  new OpenSubtitlesProvider(),
  new SubDLProvider(),
  new SubsourceProvider()
];

const PROVIDER_MAP = new Map<string, SubtitleProvider>();
for (const p of BUILTIN_PROVIDERS) {
  PROVIDER_MAP.set(p.id, p);
}

/**
 * Returns list of all registered built-in providers and their metadata
 */
export function getAllProviders(): SubtitleProvider[] {
  return [...BUILTIN_PROVIDERS];
}

/**
 * Executes subtitle search across all enabled built-in and custom imported providers in parallel using Promise.allSettled
 */
export async function executeParallelSearch(
  query: SubtitleQuery,
  config: UserConfig
): Promise<RawSubtitleItem[]> {
  // 1. Collect enabled built-in providers (must be enabled and have apiKey configured if required)
  const activeProviders: SubtitleProvider[] = BUILTIN_PROVIDERS.filter(provider => {
    const provConfig = config.providers[provider.id];
    if (!provConfig || provConfig.enabled === false) {
      return false;
    }
    if (provider.requiresApiKey && (!provConfig.apiKey || provConfig.apiKey.trim() === '')) {
      return false;
    }
    return true;
  });

  // 2. Instantiate and add enabled custom imported addons
  if (Array.isArray(config.customAddons)) {
    for (const custom of config.customAddons) {
      if (custom && custom.enabled !== false && custom.manifestUrl) {
        if (Array.isArray(custom.selectedResources) && !custom.selectedResources.includes('subtitles')) {
          continue;
        }
        activeProviders.push(
          new GenericStremioAddonProvider(custom.id, custom.name, custom.manifestUrl)
        );
      }
    }
  }

  Logger.info(`Searching subtitles across ${activeProviders.length} providers`, {
    id: query.id,
    imdbId: query.imdbId,
    type: query.type,
    season: query.season,
    episode: query.episode,
    providers: activeProviders.map(p => `${p.name} (${p.id})`),
    timeoutMs: config.providerTimeoutMs
  });

  // Launch all providers concurrently with Promise.allSettled
  const searchPromises = activeProviders.map(provider => {
    const customConfig = config.customAddons?.find(c => c.id === provider.id);
    const timeoutMs = (customConfig && typeof customConfig.timeout === 'number' && customConfig.timeout > 0)
      ? customConfig.timeout
      : config.providerTimeoutMs;

    const context: ProviderContext = {
      config,
      providerConfig: config.providers[provider.id] || { enabled: true },
      timeoutMs
    };
    return provider.search(query, context);
  });

  const settledResults = await Promise.allSettled(searchPromises);

  const aggregatedSubtitles: RawSubtitleItem[] = [];

  settledResults.forEach((result, idx) => {
    const provider = activeProviders[idx];
    if (result.status === 'fulfilled') {
      aggregatedSubtitles.push(...result.value);
    } else {
      Logger.error(`Provider [${provider.id}] search promise rejected`, result.reason);
    }
  });

  return aggregatedSubtitles;
}
