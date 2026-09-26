import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Logger } from '../../utils/logger';

export interface CachedAlignmentItem {
  key: string;
  srtContent: string;
  createdAt: number;
}

export class AlignmentCacheManager {
  private inMemoryCache: Map<string, CachedAlignmentItem> = new Map();
  private storageDir: string;
  private ttlMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(customDir?: string, ttlMinutes: number = 120) {
    this.storageDir = customDir || path.join(process.cwd(), 'data', 'tmp', 'aligned');
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.ensureStorageDir();
    this.cleanupStaleFiles();

    // Periodic cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleFiles();
    }, 30 * 60 * 1000);

    // Unref interval to not block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private ensureStorageDir(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (err) {
      // Fallback to os tmpdir
      this.storageDir = path.join(os.tmpdir(), 'aiosubs-aligned');
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    }
  }

  public generateKey(videoUrl: string, subUrl: string, sampleMinutes: number = 2, tool: string = 'auto'): string {
    const raw = `${videoUrl.trim()}::${subUrl.trim()}::${sampleMinutes}::${tool}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public get(key: string): string | null {
    // 1. Check in-memory cache
    const mem = this.inMemoryCache.get(key);
    if (mem) {
      if (Date.now() - mem.createdAt < this.ttlMs) {
        return mem.srtContent;
      }
      this.inMemoryCache.delete(key);
    }

    // 2. Check disk cache
    const filePath = path.join(this.storageDir, `${key}.srt`);
    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (Date.now() - stat.mtimeMs < this.ttlMs) {
          const content = fs.readFileSync(filePath, 'utf8');
          this.inMemoryCache.set(key, { key, srtContent: content, createdAt: stat.mtimeMs });
          return content;
        } else {
          fs.unlinkSync(filePath);
        }
      } catch (err: any) {
        Logger.warn(`Failed to read cached alignment file: ${filePath} - ${err?.message || err}`);
      }
    }

    return null;
  }

  public set(key: string, srtContent: string): void {
    const now = Date.now();
    this.inMemoryCache.set(key, { key, srtContent, createdAt: now });

    try {
      this.ensureStorageDir();
      const filePath = path.join(this.storageDir, `${key}.srt`);
      fs.writeFileSync(filePath, srtContent, 'utf8');
    } catch (err: any) {
      Logger.warn(`Failed to write aligned subtitle to disk cache: ${key} - ${err?.message || err}`);
    }
  }

  public cleanupStaleFiles(): void {
    try {
      if (!fs.existsSync(this.storageDir)) return;
      const now = Date.now();
      const files = fs.readdirSync(this.storageDir);

      for (const file of files) {
        const fullPath = path.join(this.storageDir, file);
        try {
          const stat = fs.statSync(fullPath);
          if (now - stat.mtimeMs > this.ttlMs) {
            fs.unlinkSync(fullPath);
          }
        } catch {}
      }

      for (const [k, v] of this.inMemoryCache.entries()) {
        if (now - v.createdAt > this.ttlMs) {
          this.inMemoryCache.delete(k);
        }
      }
    } catch (err: any) {
      Logger.warn(`Error during alignment cache cleanup - ${err?.message || err}`);
    }
  }

  public clear(): void {
    this.inMemoryCache.clear();
    try {
      if (fs.existsSync(this.storageDir)) {
        const files = fs.readdirSync(this.storageDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(this.storageDir, file));
          } catch {}
        }
      }
    } catch {}
  }

  public close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const alignmentCache = new AlignmentCacheManager();
