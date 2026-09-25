import { BaseSubtitleProvider } from './base';
import { SubtitleQuery, ProviderContext, RawSubtitleItem } from '../types/provider';

interface OpenSubtitlesV3Response {
  subtitles?: Array<{
    id: string;
    url: string;
    lang: string;
  }>;
}

export class OpenSubtitlesV3Provider extends BaseSubtitleProvider {
  readonly id = 'opensubtitles-v3';
  readonly name = 'OpenSubtitles v3';
  readonly description = 'Official Stremio OpenSubtitles v3 catalog (scanned in full and filtered post-response)';
  readonly requiresApiKey = false;
  readonly defaultEnabled = true;

  protected async executeSearch(
    query: SubtitleQuery,
    _context: ProviderContext,
    signal: AbortSignal
  ): Promise<RawSubtitleItem[]> {
    // OpenSubtitles v3 endpoint does not accept language filter query params in URL
    const url = `https://opensubtitles-v3.strem.io/subtitles/${encodeURIComponent(query.type)}/${encodeURIComponent(query.id)}.json`;

    const response = await this.httpGet<OpenSubtitlesV3Response>(url, {
      timeout: 10000
    }, signal);

    if (!response.data || !Array.isArray(response.data.subtitles)) {
      return [];
    }

    const items: RawSubtitleItem[] = [];

    for (const sub of response.data.subtitles) {
      if (!sub.url || !sub.lang) continue;

      // Extract release name from URL if possible
      let release: string | undefined;
      try {
        const parsedUrl = new URL(sub.url);
        const pathname = parsedUrl.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (filename && filename.includes('.')) {
          release = decodeURIComponent(filename).replace(/\.(srt|vtt|sub)$/i, '');
        }
      } catch {
        // Ignore URL parsing errors
      }

      // Check if hearing impaired flag is hinted in id or release
      const isHI = Boolean(
        (sub.id && sub.id.toLowerCase().includes('hi')) ||
        (release && /(hearing\.impaired|\.hi\.|\[hi\]|\(hi\)|\[cc\]|\.cc\.)/i.test(release))
      );

      items.push({
        id: `osv3-${sub.id || Math.random().toString(36).substring(7)}`,
        provider: this.id,
        providerName: 'OpenSubtitles v3',
        url: sub.url,
        lang: sub.lang,
        release: release || `${query.id}`,
        format: sub.url.endsWith('.vtt') ? 'vtt' : 'srt',
        hearingImpaired: isHI,
        rawMetadata: { originalId: sub.id }
      });
    }

    return items;
  }
}
