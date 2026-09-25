import { Request, Response } from 'express';
import axios from 'axios';
import AdmZip from 'adm-zip';
import iconv from 'iconv-lite';
import { LRUCache } from 'lru-cache';
import { Logger } from '../utils/logger';

export interface ProxyDownloadEntry {
  originalUrl: string;
  filename: string;
  provider: string;
  format: string;
  apiKey?: string;
  fileId?: string | number;
}

// In-memory cache holding shortId -> ProxyDownloadEntry mapping with 4-hour TTL (Bug 6.3 fix)
const proxyDownloadStore = new LRUCache<string, ProxyDownloadEntry>({
  max: 10000,
  ttl: 4 * 60 * 60 * 1000 // 4 hours TTL
});

/**
 * Registers a subtitle download URL and returns a clean, human-readable short ID.
 * NEVER leaks base64 or technical URLs to the client.
 */
export function registerProxyDownload(entry: ProxyDownloadEntry): string {
  const cleanProvider = (entry.provider || 'sub').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const shortId = `${cleanProvider}_${randomSuffix}`;
  
  proxyDownloadStore.set(shortId, entry);
  return shortId;
}

/**
 * Detects if a buffer is likely UTF-8 or Windows-1252 / ISO-8859-1 and normalizes to UTF-8
 */
function toUtf8(buffer: Buffer): string {
  try {
    const utf8Str = buffer.toString('utf8');
    if (utf8Str.includes('\uFFFD')) {
      return iconv.decode(buffer, 'win1252');
    }
    return utf8Str;
  } catch {
    return iconv.decode(buffer, 'win1252');
  }
}

/**
 * Bug 6.3 fix: Clean Short ID Download endpoint:
 * GET /download/:id
 * GET /download/:id/:filename
 */
export async function handleShortIdDownload(req: Request, res: Response): Promise<void> {
  const shortId = req.params.id;
  const entry = proxyDownloadStore.get(shortId);

  if (!entry) {
    res.status(404).send('Subtitle download link expired or not found. Please refresh subtitles in your player.');
    return;
  }

  const filename = req.params.filename || (req.query.filename as string) || entry.filename || 'subtitle.srt';
  const targetUrl = entry.originalUrl;

  try {
    // If it's an OpenSubtitles REST fileId download
    if (entry.fileId && entry.apiKey) {
      const downloadRes = await axios.post<{ link: string }>(
        'https://api.opensubtitles.com/api/v1/download',
        { file_id: Number(entry.fileId) },
        {
          headers: {
            'Api-Key': entry.apiKey,
            'User-Agent': 'AIOSubtitles/1.0.0',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!downloadRes.data?.link) {
        res.status(502).send('OpenSubtitles REST returned no download link');
        return;
      }

      const subRes = await axios.get<ArrayBuffer>(downloadRes.data.link, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      const buffer = Buffer.from(subRes.data);
      const text = toUtf8(buffer);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      res.send(text);
      return;
    }

    // Standard download from upstream URL
    const response = await axios.get<ArrayBuffer>(targetUrl, {
      responseType: 'arraybuffer',
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIOSubtitles/1.0.0',
        'Accept': '*/*'
      }
    });

    const buffer = Buffer.from(response.data);
    let subtitleContent = '';
    const isVtt = filename.toLowerCase().endsWith('.vtt') || targetUrl.toLowerCase().endsWith('.vtt');

    // Check if response is a ZIP file (starts with PK)
    if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      try {
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        const subEntry = entries.find(e =>
          !e.isDirectory && (e.entryName.toLowerCase().endsWith('.srt') || e.entryName.toLowerCase().endsWith('.vtt'))
        );

        if (subEntry) {
          subtitleContent = toUtf8(subEntry.getData());
        } else {
          subtitleContent = toUtf8(buffer);
        }
      } catch {
        subtitleContent = toUtf8(buffer);
      }
    } else {
      subtitleContent = toUtf8(buffer);
    }

    const contentType = isVtt ? 'text/vtt; charset=utf-8' : 'text/plain; charset=utf-8';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(subtitleContent);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.error(`Subtitle short ID download failed for ${shortId} (${targetUrl})`, err);
    res.status(502).send(`Failed to proxy subtitle: ${errorMsg}`);
  }
}

/**
 * Legacy base64 subtitle proxy (retained for backward compatibility)
 */
export async function handleSubtitleProxy(req: Request, res: Response): Promise<void> {
  const { data } = req.params;
  const filename = (req.query.filename as string) || 'subtitle.srt';

  let targetUrl: string;
  try {
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    targetUrl = Buffer.from(normalized, 'base64').toString('utf8');
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      throw new Error('Invalid URL protocol');
    }
  } catch {
    res.status(400).send('Invalid subtitle proxy URL');
    return;
  }

  try {
    const response = await axios.get<ArrayBuffer>(targetUrl, {
      responseType: 'arraybuffer',
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIOSubtitles/1.0.0',
        'Accept': '*/*'
      }
    });

    const buffer = Buffer.from(response.data);
    let subtitleContent = '';
    const isVtt = filename.toLowerCase().endsWith('.vtt') || targetUrl.toLowerCase().endsWith('.vtt');

    if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      try {
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        const subEntry = entries.find(e =>
          !e.isDirectory && (e.entryName.toLowerCase().endsWith('.srt') || e.entryName.toLowerCase().endsWith('.vtt'))
        );
        subtitleContent = subEntry ? toUtf8(subEntry.getData()) : toUtf8(buffer);
      } catch {
        subtitleContent = toUtf8(buffer);
      }
    } else {
      subtitleContent = toUtf8(buffer);
    }

    const contentType = isVtt ? 'text/vtt; charset=utf-8' : 'text/plain; charset=utf-8';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(subtitleContent);
  } catch (err: unknown) {
    Logger.error(`Legacy subtitle proxy fetch failed for ${targetUrl}`, err);
    res.status(502).send('Failed to proxy subtitle');
  }
}

/**
 * Handles OpenSubtitles REST API file download proxy
 */
export async function handleOpenSubtitlesRestDownload(req: Request, res: Response): Promise<void> {
  const { fileId } = req.params;
  const apiKey = req.query.apiKey as string;
  const filename = (req.query.filename as string) || `subtitle-${fileId}.srt`;

  if (!fileId || !apiKey) {
    res.status(400).send('Missing fileId or apiKey');
    return;
  }

  try {
    const downloadRes = await axios.post<{ link: string }>(
      'https://api.opensubtitles.com/api/v1/download',
      { file_id: parseInt(fileId, 10) },
      {
        headers: {
          'Api-Key': apiKey,
          'User-Agent': 'AIOSubtitles/1.0.0',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!downloadRes.data?.link) {
      res.status(502).send('OpenSubtitles REST returned no download link');
      return;
    }

    const subRes = await axios.get<ArrayBuffer>(downloadRes.data.link, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    const buffer = Buffer.from(subRes.data);
    const text = toUtf8(buffer);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.send(text);
  } catch (err: unknown) {
    Logger.error(`OpenSubtitles REST download failed for file ${fileId}`, err);
    res.status(502).send('Failed to download subtitle from OpenSubtitles REST');
  }
}
