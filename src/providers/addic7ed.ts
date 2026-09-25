import { BaseSubtitleProvider } from './base';
import { SubtitleQuery, ProviderContext, RawSubtitleItem } from '../types/provider';

export class Addic7edProvider extends BaseSubtitleProvider {
  readonly id = 'addic7ed';
  readonly name = 'Addic7ed';
  readonly description = 'Specialized in fast TV show releases and high quality translations';
  readonly requiresApiKey = false;
  readonly defaultEnabled = true;

  protected async executeSearch(
    query: SubtitleQuery,
    _context: ProviderContext,
    signal: AbortSignal
  ): Promise<RawSubtitleItem[]> {
    // Addic7ed only indexes TV Series
    if (query.season === null || query.episode === null || !query.imdbId) {
      return [];
    }

    try {
      // Query Addic7ed search API / mirror by IMDb or episode
      const url = `https://api.subtitles.download/addic7ed/search?imdb=${encodeURIComponent(query.imdbId)}&season=${query.season}&episode=${query.episode}`;

      const response = await this.httpGet<{
        subtitles?: Array<{
          id: string;
          version?: string;
          language: string;
          downloadUrl: string;
          hearingImpaired?: boolean;
          completed?: boolean;
        }>;
      }>(
        url,
        {
          timeout: 8000,
          headers: {
            'Accept': 'application/json'
          }
        },
        signal
      );

      if (!response.data?.subtitles || !Array.isArray(response.data.subtitles)) {
        return [];
      }

      const items: RawSubtitleItem[] = [];

      for (const sub of response.data.subtitles) {
        if (!sub.downloadUrl || !sub.language) continue;
        if (sub.completed === false) continue; // Skip incomplete subtitles

        const release = sub.version || `${query.imdbId}.S${String(query.season).padStart(2, '0')}E${String(query.episode).padStart(2, '0')}`;

        items.push({
          id: `addic7ed-${sub.id || Math.random().toString(36).substring(2, 9)}`,
          provider: this.id,
          providerName: 'Addic7ed',
          url: sub.downloadUrl,
          lang: sub.language,
          release: release,
          format: 'srt',
          hearingImpaired: Boolean(sub.hearingImpaired),
          rawMetadata: sub as Record<string, unknown>
        });
      }

      return items;
    } catch {
      // If primary mirror is down or unconfigured, gracefully return empty without throwing
      return [];
    }
  }
}
