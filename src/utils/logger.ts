import { ProviderLogEntry } from '../types/provider';

export class Logger {
  static info(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] [INFO] ${message}${ctx}`);
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    console.warn(`[${timestamp}] [WARN] ${message}${ctx}`);
  }

  static error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const errStr = error instanceof Error ? error.stack || error.message : String(error || '');
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    console.error(`[${timestamp}] [ERROR] ${message} - ${errStr}${ctx}`);
  }

  static logProviderResult(entry: ProviderLogEntry): void {
    const status = entry.success ? 'SUCCESS' : 'FAILED';
    const errorMsg = entry.error ? ` - Error: ${entry.error}` : '';
    const logData = {
      provider: entry.providerId,
      durationMs: entry.durationMs,
      results: entry.resultsCount,
      success: entry.success,
      ...(entry.error ? { error: entry.error } : {})
    };

    console.log(`[PROVIDER] [${status}] [${entry.providerId}] ${entry.durationMs}ms -> ${entry.resultsCount} subs${errorMsg} ${JSON.stringify(logData)}`);
  }
}
