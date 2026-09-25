import { Request, Response } from 'express';
import axios from 'axios';
import AdmZip from 'adm-zip';
import iconv from 'iconv-lite';
import { Logger } from '../utils/logger';

/**
 * Detects if a buffer is likely UTF-8 or Windows-1252 / ISO-8859-1
 */
function toUtf8(buffer: Buffer): string {
  try {
    // Check if buffer is already valid UTF-8
    const utf8Str = buffer.toString('utf8');
    // If it contains replacement character or broken multi-byte sequences, attempt windows-1252 decode
    if (utf8Str.includes('\uFFFD')) {
      return iconv.decode(buffer, 'win1252');
    }
    return utf8Str;
  } catch {
    return iconv.decode(buffer, 'win1252');
  }
}

/**
 * Proxy endpoint that fetches subtitle from original source,
 * auto-unpacks ZIP if needed, normalizes charset to UTF-8,
 * and sets Content-Disposition header with custom filename.
 */
export async function handleSubtitleProxy(req: Request, res: Response): Promise<void> {
  const { data } = req.params;
  const filename = (req.query.filename as string) || 'subtitle.srt';

  let targetUrl: string;
  try {
    // Decode base64url target URL
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    targetUrl = Buffer.from(normalized, 'base64').toString('utf8');
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      throw new Error('Invalid URL protocol');
    }
  } catch (err) {
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

    // Check if response is a ZIP file (starts with PK)
    if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      try {
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        // Find best subtitle entry (.srt or .vtt)
        const subEntry = entries.find(e =>
          !e.isDirectory && (e.entryName.toLowerCase().endsWith('.srt') || e.entryName.toLowerCase().endsWith('.vtt'))
        );

        if (subEntry) {
          const extractedBuffer = subEntry.getData();
          subtitleContent = toUtf8(extractedBuffer);
        } else {
          subtitleContent = toUtf8(buffer);
        }
      } catch {
        subtitleContent = toUtf8(buffer);
      }
    } else {
      subtitleContent = toUtf8(buffer);
    }

    // Prepare headers
    const contentType = isVtt ? 'text/vtt; charset=utf-8' : 'text/plain; charset=utf-8';
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h

    res.send(subtitleContent);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.error(`Subtitle proxy fetch failed for ${targetUrl}`, err);
    res.status(502).send(`Failed to proxy subtitle: ${errorMsg}`);
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
    // Request download link from OpenSubtitles REST API
    const downloadRes = await axios.post<{ link: string }>(
      'https://api.opensubtitles.com/api/v1/download',
      { file_id: parseInt(fileId, 10) },
      {
        headers: {
          'Api-Key': apiKey,
          'User-Agent': 'AIOSubtitles v1.0.0',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!downloadRes.data?.link) {
      res.status(502).send('OpenSubtitles REST returned no download link');
      return;
    }

    // Fetch the actual subtitle content
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
