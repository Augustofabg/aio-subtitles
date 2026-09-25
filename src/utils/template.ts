import { RawSubtitleItem } from '../types/provider';
import { getLanguageFlag, getLanguageDisplayName } from './languages';

export interface TemplateContext {
  provider: string;
  lang: string;
  lang_flag: string;
  lang_name: string;
  release: string;
  hi: string;
  format: string;
  fps: string;
}

/**
 * Extracts context variables from a RawSubtitleItem
 */
export function buildTemplateContext(item: RawSubtitleItem, displayLang?: string): TemplateContext {
  const langCode = displayLang || item.lang;
  
  // Bug 6.1 fix: Guarantee provider is never empty or "Desconhecido"
  let cleanProvider = item.providerName || item.provider || 'AIOSubtitles';
  if (cleanProvider.trim().toLowerCase() === 'desconhecido' || cleanProvider.trim().toLowerCase() === 'unknown') {
    cleanProvider = (item.provider && item.provider.toLowerCase() !== 'desconhecido') ? item.provider : 'AIOSubtitles';
  }

  return {
    provider: cleanProvider,
    lang: langCode.toUpperCase(),
    lang_flag: getLanguageFlag(langCode),
    lang_name: getLanguageDisplayName(langCode),
    release: item.release ? cleanReleaseName(item.release) : 'Standard',
    hi: item.hearingImpaired ? '[CC]' : '',
    format: (item.format || 'srt').toUpperCase(),
    fps: item.fps ? `${item.fps}fps` : ''
  };
}

/**
 * Renders a naming template with provided context.
 * Cleanly trims empty tokens, extra spaces, and orphaned brackets.
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  if (!template || template.trim() === '') {
    template = '[{provider}] {lang_flag} {release} {hi}';
  }

  let result = template
    .replace(/\{provider\}/gi, ctx.provider)
    .replace(/\{lang\}/gi, ctx.lang)
    .replace(/\{lang_flag\}/gi, ctx.lang_flag)
    .replace(/\{lang_name\}/gi, ctx.lang_name)
    .replace(/\{release\}/gi, ctx.release)
    .replace(/\{hi\}/gi, ctx.hi)
    .replace(/\{format\}/gi, ctx.format)
    .replace(/\{fps\}/gi, ctx.fps);

  // Clean up empty bracket pairs: [] or () or {}
  result = result
    .replace(/\[\s*\]/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\{\s*\}/g, '')
    // Replace multiple spaces with single space
    .replace(/\s{2,}/g, ' ')
    .trim();

  return result || `${ctx.provider} - ${ctx.release}`;
}

/**
 * Normalizes and sanitizes release names for better readability.
 * Strictly prevents URLs, long base64 strings, and technical garbage from leaking into labels.
 */
export function cleanReleaseName(raw: string): string {
  if (!raw || typeof raw !== 'string') return 'Standard';

  let cleaned = raw.trim();

  // 1. If contains a filename parameter (e.g. "...filename=POB SRT.srt"), extract the actual filename
  const filenameMatch = cleaned.match(/filename=([^&;]+)/i);
  if (filenameMatch && filenameMatch[1]) {
    try {
      cleaned = decodeURIComponent(filenameMatch[1].trim());
    } catch {
      cleaned = filenameMatch[1].trim();
    }
  }

  // 2. Remove full URL schemes and hostnames if present
  cleaned = cleaned.replace(/https?:\/\/[^\s/$.?#].[^\s]*/gi, '');

  // 3. Strip long base64/hex hash tokens (>35 consecutive alphanumeric characters without spaces)
  cleaned = cleaned.replace(/[A-Za-z0-9+/=_-]{35,}/g, '');

  // 4. Clean extensions and normalize dots/spaces
  cleaned = cleaned
    .replace(/\.srt$/i, '')
    .replace(/\.vtt$/i, '')
    .replace(/\.sub$/i, '')
    .replace(/_/g, '.')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '')
    .trim();

  // 5. Ensure no individual token exceeds 60 characters without spaces
  const tokens = cleaned.split(/\s+/);
  const truncatedTokens = tokens.map(t => (t.length > 60 ? t.substring(0, 60) : t));
  cleaned = truncatedTokens.join(' ').trim();

  return cleaned || 'Standard';
}

/**
 * Returns mock subtitle examples for live preview in the configuration UI
 */
export function generatePreviewExamples(template: string): string[] {
  const mockContexts: TemplateContext[] = [
    {
      provider: 'OpenSubtitles',
      lang: 'POB',
      lang_flag: '🇧🇷',
      lang_name: 'Portuguese (Brazil)',
      release: '1080p.BluRay.x264-SPARKS',
      hi: '[CC]',
      format: 'SRT',
      fps: '23.976fps'
    },
    {
      provider: 'SubDL',
      lang: 'POB',
      lang_flag: '🇧🇷',
      lang_name: 'Portuguese (Brazil)',
      release: '2160p.UHD.HDR.WEB-DL.DDP5.1.Atmos',
      hi: '',
      format: 'SRT',
      fps: '24fps'
    },
    {
      provider: 'Subsource',
      lang: 'ENG',
      lang_flag: '🇺🇸',
      lang_name: 'English',
      release: '720p.HDTV.x264-AVS',
      hi: '[CC]',
      format: 'VTT',
      fps: '25fps'
    }
  ];

  return mockContexts.map(ctx => renderTemplate(template, ctx));
}
