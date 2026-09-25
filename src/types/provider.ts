import { UserConfig, ProviderConfigItem } from './config';

export interface SubtitleQuery {
  type: string;
  id: string;
  imdbId: string | null;
  season: number | null;
  episode: number | null;
  kitsuId: string | null;
  extra?: Record<string, string | undefined>;
}

export interface RawSubtitleItem {
  id: string;
  provider: string;
  providerName: string;
  url: string;
  lang: string;
  release?: string;
  format?: 'srt' | 'vtt' | string;
  hearingImpaired?: boolean;
  fps?: number | string;
  rating?: number;
  downloads?: number;
  fileHash?: string;
  rawMetadata?: Record<string, unknown>;
}

export interface ProviderLogEntry {
  providerId: string;
  durationMs: number;
  resultsCount: number;
  success: boolean;
  error?: string;
}

export interface SubtitleProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly requiresApiKey: boolean;
  readonly defaultEnabled: boolean;
  search(query: SubtitleQuery, context: ProviderContext): Promise<RawSubtitleItem[]>;
}

export interface ProviderContext {
  config: UserConfig;
  providerConfig: ProviderConfigItem;
  timeoutMs: number;
}
