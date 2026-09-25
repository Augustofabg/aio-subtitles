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
  return {
    provider: item.providerName || item.provider || 'AIOSubtitles',
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
 * Normalizes release names for better readability
 */
function cleanReleaseName(raw: string): string {
  return raw
    .replace(/\.srt$/i, '')
    .replace(/\.vtt$/i, '')
    .replace(/_/g, '.')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');
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
