import { LRUCache } from 'lru-cache';
import { RawSubtitleItem } from '../types/provider';

export interface CacheEntry {
  subtitles: RawSubtitleItem[];
  cachedAt: number;
}

export class SubtitleCache {
  private cache: LRUCache<string, CacheEntry>;

  constructor(defaultTtlMinutes = 30, maxEntries = 500) {
    this.cache = new LRUCache<string, CacheEntry>({
      max: maxEntries,
      ttl: defaultTtlMinutes * 60 * 1000,
      updateAgeOnGet: false
    });
  }

  generateKey(
    id: string,
    languages: string[],
    providers: string[],
    season?: number | null,
    episode?: number | null
  ): string {
    const sortedLangs = [...languages].sort().join(',');
    const sortedProviders = [...providers].sort().join(',');
    const epStr = season !== null && episode !== null ? `s${season}e${episode}` : '';
    return `${id}:${epStr}:${sortedLangs}:${sortedProviders}`;
  }

  get(key: string): RawSubtitleItem[] | undefined {
    const entry = this.cache.get(key);
    return entry ? entry.subtitles : undefined;
  }

  set(key: string, subtitles: RawSubtitleItem[], ttlMinutes?: number): void {
    const ttl = (ttlMinutes || 30) * 60 * 1000;
    this.cache.set(key, { subtitles, cachedAt: Date.now() }, { ttl });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const globalSubtitleCache = new SubtitleCache(30, 1000);
