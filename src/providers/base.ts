import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { SubtitleProvider, SubtitleQuery, ProviderContext, RawSubtitleItem, ProviderLogEntry } from '../types/provider';
import { Logger } from '../utils/logger';

export abstract class BaseSubtitleProvider implements SubtitleProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly requiresApiKey: boolean;
  abstract readonly defaultEnabled: boolean;

  protected abstract executeSearch(
    query: SubtitleQuery,
    context: ProviderContext,
    signal: AbortSignal
  ): Promise<RawSubtitleItem[]>;

  async search(query: SubtitleQuery, context: ProviderContext): Promise<RawSubtitleItem[]> {
    const startTime = Date.now();
    const abortController = new AbortController();
    const timeoutMs = context.timeoutMs || 6000;
    const timeoutTimer = setTimeout(() => {
      abortController.abort(new Error(`Provider [${this.name}] timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const items = await this.executeSearch(query, context, abortController.signal);
      clearTimeout(timeoutTimer);

      const durationMs = Date.now() - startTime;
      const logEntry: ProviderLogEntry = {
        providerId: this.id,
        durationMs,
        resultsCount: items.length,
        success: true
      };
      Logger.logProviderResult(logEntry);

      return items;
    } catch (err: unknown) {
      clearTimeout(timeoutTimer);
      const durationMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      const logEntry: ProviderLogEntry = {
        providerId: this.id,
        durationMs,
        resultsCount: 0,
        success: false,
        error: errorMessage
      };
      Logger.logProviderResult(logEntry);

      return [];
    }
  }

  protected async httpGet<T = unknown>(
    url: string,
    options: AxiosRequestConfig = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<T>> {
    return axios.get<T>(url, {
      ...options,
      signal,
      headers: {
        'User-Agent': 'AIOSubs v1.0.0 (Stremio Addon)',
        ...(options.headers || {})
      }
    });
  }
}
