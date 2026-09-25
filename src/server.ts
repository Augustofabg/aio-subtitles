import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';
import { StremioManifest } from './types/stremio';
import { decodeUserConfig, encodeUserConfig, DEFAULT_USER_CONFIG } from './config/userConfig';
import { parseSubtitleQuery, getAggregatedSubtitles } from './core/aggregator';
import { handleSubtitleProxy, handleOpenSubtitlesRestDownload, handleShortIdDownload } from './proxy/subtitleProxy';
import { SUPPORTED_LANGUAGES } from './utils/languages';
import { getAllProviders } from './providers';
import { generatePreviewExamples } from './utils/template';
import { globalSubtitleCache } from './utils/cache';
import { Logger } from './utils/logger';

export function createServer(): express.Application {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: ENV.RATE_LIMIT_WINDOW_MS,
    max: ENV.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });
  app.use('/subtitles', limiter);

  // Helper to determine base URL dynamically or from ENV
  const getBaseUrl = (req: Request): string => {
    if (ENV.BASE_URL && ENV.BASE_URL.trim() !== '') {
      return ENV.BASE_URL.replace(/\/+$/, '');
    }
    const host = req.get('host') || `localhost:${ENV.PORT}`;
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    return `${protocol}://${host}`;
  };

  // Helper to construct Stremio manifest
  const buildManifest = (configEncoded?: string): StremioManifest => {
    return {
      id: 'org.aiosubtitles.addon',
      version: '1.0.0',
      name: 'AIO Subtitles',
      description: 'Unified subtitle aggregator with multi-provider search, language normalization, remapping, and custom formatting.',
      logo: 'https://raw.githubusercontent.com/stremio/stremio-addon-sdk/master/images/stremio.png',
      background: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80',
      resources: [
        {
          name: 'subtitles',
          types: ['movie', 'series', 'anime', 'other'],
          idPrefixes: ['tt', 'kitsu']
        }
      ],
      types: ['movie', 'series', 'anime', 'other'],
      catalogs: [],
      behaviorHints: {
        configurable: true,
        configurationRequired: false
      }
    };
  };

  // Static Assets for UI (support both dist and src directory trees)
  const distPublic = path.join(__dirname, 'web', 'public');
  const srcPublic = path.join(__dirname, '..', 'src', 'web', 'public');
  const publicDir = fs.existsSync(distPublic) ? distPublic : srcPublic;
  app.use(express.static(publicDir));

  // Health Endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      addon: 'AIOSubtitles',
      version: '1.0.0',
      uptime: process.uptime(),
      cacheSize: globalSubtitleCache.size,
      nodeVersion: process.version
    });
  });

  // API: Supported languages list
  app.get('/api/languages', (_req: Request, res: Response) => {
    res.json({ languages: SUPPORTED_LANGUAGES });
  });

  // API: Providers list
  app.get('/api/providers', (_req: Request, res: Response) => {
    const list = getAllProviders().map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      requiresApiKey: p.requiresApiKey,
      defaultEnabled: p.defaultEnabled
    }));
    res.json({ providers: list });
  });

  // API: Validate external Stremio subtitle addon manifest URL
  app.post('/api/manifest/validate', async (req: Request, res: Response) => {
    let inputUrl = (req.body?.url as string) || '';
    if (!inputUrl || inputUrl.trim() === '') {
      res.status(400).json({ valid: false, error: 'URL do manifest não pode estar vazia.' });
      return;
    }

    inputUrl = inputUrl.trim();
    if (inputUrl.startsWith('stremio://')) {
      inputUrl = inputUrl.replace(/^stremio:\/\//, 'https://');
    }

    if (!inputUrl.toLowerCase().endsWith('/manifest.json')) {
      inputUrl = `${inputUrl.replace(/\/+$/, '')}/manifest.json`;
    }

    try {
      const axios = require('axios');
      const response = await axios.get(inputUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'AIOSubtitles/1.0.0 (Stremio Addon Validator)',
          'Accept': 'application/json'
        }
      });

      const manifest = response.data;
      if (!manifest || typeof manifest !== 'object') {
        res.status(400).json({ valid: false, error: 'A resposta do endpoint não é um JSON de manifest válido.' });
        return;
      }

      // Check for subtitles resource
      const hasSubtitles = Array.isArray(manifest.resources) && manifest.resources.some((r: unknown) => {
        if (typeof r === 'string') return r.toLowerCase() === 'subtitles';
        if (typeof r === 'object' && r !== null && 'name' in r) {
          return String((r as { name: string }).name).toLowerCase() === 'subtitles';
        }
        return false;
      });

      if (!hasSubtitles) {
        res.status(400).json({
          valid: false,
          error: `O addon "${manifest.name || manifest.id || 'Externo'}" não declara o recurso de legendas ('subtitles'). Somente addons que fornecem legendas são suportados.`
        });
        return;
      }

      const addonName = manifest.name && String(manifest.name).trim() !== ''
        ? String(manifest.name).trim()
        : (manifest.id ? String(manifest.id).trim() : 'External Subtitles Addon');

      res.json({
        valid: true,
        id: manifest.id || `custom-${Math.random().toString(36).substring(2, 9)}`,
        name: addonName,
        description: manifest.description || '',
        manifestUrl: inputUrl
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({
        valid: false,
        error: `Não foi possível acessar o manifest em "${inputUrl}": ${msg}`
      });
    }
  });

  // API: Live preview rendering
  app.post('/api/preview', (req: Request, res: Response) => {
    const template = req.body.template || DEFAULT_USER_CONFIG.namingTemplate;
    const previews = generatePreviewExamples(template);
    res.json({ previews });
  });

  // Configuration Page: root redirect or /configure
  app.get('/', (_req: Request, res: Response) => {
    res.redirect('/configure');
  });

  app.get('/configure', (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // Edit existing configuration in UI: /:config/configure
  app.get('/:config/configure', (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // Manifest Endpoints
  app.get('/manifest.json', (_req: Request, res: Response) => {
    res.json(buildManifest());
  });

  app.get('/:config/manifest.json', (req: Request, res: Response) => {
    res.json(buildManifest(req.params.config));
  });

  // Subtitle Endpoints (Configured)
  const handleSubtitles = async (req: Request, res: Response): Promise<void> => {
    try {
      const configParam = req.params.config;
      const userConfig = decodeUserConfig(configParam);
      const type = req.params.type;
      const id = req.params.id;
      const baseUrl = getBaseUrl(req);

      const query = parseSubtitleQuery(type, id, req.query as Record<string, string>);
      const response = await getAggregatedSubtitles(query, userConfig, baseUrl);

      res.setHeader('Cache-Control', 'max-age=1800, public'); // 30 mins
      res.json(response);
    } catch (err: unknown) {
      Logger.error('Failed to handle subtitles request', err);
      res.json({ subtitles: [] });
    }
  };

  // Subtitle route definitions according to Stremio protocol
  app.get('/:config/subtitles/:type/:id.json', handleSubtitles);
  app.get('/:config/subtitles/:type/:id/:extra.json', handleSubtitles);
  app.get('/subtitles/:type/:id.json', handleSubtitles);
  app.get('/subtitles/:type/:id/:extra.json', handleSubtitles);

  // Clean Subtitle Download & Proxy Endpoints (Bug 6.3 fix - Short ID, NO base64 leaked)
  app.get('/download/:id', handleShortIdDownload);
  app.get('/download/:id/:filename', handleShortIdDownload);
  app.get('/sub/:id', handleShortIdDownload);
  app.get('/sub/:id/:filename', handleShortIdDownload);

  // Legacy Subtitle Proxy Endpoints (retained for backward compatibility)
  app.get('/proxy/subtitle/:data', handleSubtitleProxy);
  app.get('/proxy/download/os-rest/:fileId', handleOpenSubtitlesRestDownload);

  // Fallback 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
  });

  // Global Error Handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    Logger.error('Unhandled server exception', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
