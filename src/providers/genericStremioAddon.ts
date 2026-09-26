import { BaseSubtitleProvider } from './base';
import { SubtitleQuery, ProviderContext, RawSubtitleItem } from '../types/provider';

interface GenericStremioSubtitleItem {
  id?: string;
  url: string;
  lang: string;
  file?: string;
  title?: string;
  SubEncoding?: string;
  [key: string]: unknown;
}

interface GenericStremioSubtitlesResponse {
  subtitles?: GenericStremioSubtitleItem[];
}

export class GenericStremioAddonProvider extends BaseSubtitleProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly requiresApiKey = false;
  readonly defaultEnabled = true;
  private readonly baseUrl: string;

  constructor(addonId: string, addonName: string, manifestUrl: string) {
    super();
    this.id = addonId;
    this.name = addonName && addonName.trim() !== '' ? addonName.trim() : (addonId || 'External Addon');
    this.description = `Custom imported Stremio subtitle addon: ${this.name}`;

    let cleanUrl = manifestUrl.trim();
    if (cleanUrl.startsWith('stremio://')) {
      cleanUrl = cleanUrl.replace(/^stremio:\/\//, 'https://');
    }
    this.baseUrl = cleanUrl.replace(/\/manifest\.json$/i, '').replace(/\/+$/, '');
  }

  protected async executeSearch(
    query: SubtitleQuery,
    context: ProviderContext,
    signal: AbortSignal
  ): Promise<RawSubtitleItem[]> {
    const url = `${this.baseUrl}/subtitles/${encodeURIComponent(query.type)}/${encodeURIComponent(query.id)}.json`;
    const timeout = context.timeoutMs || 20000;

    const response = await this.httpGet<GenericStremioSubtitlesResponse>(
      url,
      { timeout },
      signal
    );

    if (!response.data || !Array.isArray(response.data.subtitles)) {
      return [];
    }

    const items: RawSubtitleItem[] = [];

    for (const sub of response.data.subtitles) {
      if (!sub.url || !sub.lang) continue;

      let release = sub.file || sub.title;
      if (!release) {
        try {
          const parsed = new URL(sub.url);
          const fname = parsed.pathname.substring(parsed.pathname.lastIndexOf('/') + 1);
          if (fname && fname.includes('.')) {
            release = decodeURIComponent(fname).replace(/\.(srt|vtt|sub)$/i, '');
          }
        } catch {
          // Ignored URL parsing error
        }
      }

      if (!release) {
        release = `${this.name} Subtitle`;
      }

      const isHI = /(hearing\.impaired|\.hi\.|\[hi\]|\(hi\)|\[cc\]|\.cc\.)/i.test(release);

      items.push({
        id: `${this.id}-${sub.id || Math.random().toString(36).substring(2, 9)}`,
        provider: this.id,
        providerName: this.name,
        url: sub.url,
        lang: sub.lang,
        release,
        format: sub.url.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt',
        hearingImpaired: isHI,
        rawMetadata: sub as Record<string, unknown>
      });
    }

    return items;
  }
}
