import { RawSubtitleItem } from '../types/provider';
import { FormatterConfig } from '../types/config';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

export interface FormattedSubtitleResult {
  id: string;
  lang: string;
  title?: string;
  description?: string;
}

export const DEFAULT_PREVIEW_VARIABLES: Record<string, string> = {
  'addon.name': 'AIOSubs',
  'sub.lang': 'Português (Brasil)',
  'sub.filename': 'Inception.2010.1080p.BluRay.x264.srt',
  'sub.fps': '23.976 fps',
  'sub.format': 'SRT',
  'sub.delay': '0ms'
};

export function getLanguageDisplayName(code: string): string {
  if (!code) return '';
  const clean = code.trim().toLowerCase();
  const match = SUPPORTED_LANGUAGES.find(
    l => l.code.toLowerCase() === clean || l.iso639_2.toLowerCase() === clean || l.aliases.includes(clean)
  );
  if (match) {
    return match.nativeName || match.name;
  }
  return code;
}

export function extractSubtitleVariables(item: RawSubtitleItem): Record<string, string> {
  const langDisplay = getLanguageDisplayName(item.lang) || item.lang || 'Unknown';
  const addonName = item.providerName || item.provider || 'AIOSubs';
  const filename = item.release || (typeof item.rawMetadata?.file === 'string' ? item.rawMetadata.file : '') || 'subtitle.srt';
  const fps = item.fps ? (String(item.fps).includes('fps') ? String(item.fps) : `${item.fps} fps`) : '23.976 fps';
  const format = (item.format || (item.url && item.url.toLowerCase().endsWith('.vtt') ? 'VTT' : 'SRT')).toUpperCase();
  const delay = (item.rawMetadata?.delay !== undefined ? `${item.rawMetadata.delay}ms` : '0ms');

  return {
    'addon.name': addonName,
    'sub.lang': langDisplay,
    'sub.filename': filename,
    'sub.fps': fps,
    'sub.format': format,
    'sub.delay': delay
  };
}

export function interpolateVariables(template: string, vars: Record<string, string>): string {
  if (!template || typeof template !== 'string') return '';

  let output = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key.replace('.', '\\.')}\\}`, 'gi');
    output = output.replace(regex, value);
  }

  // Remove any remaining unresolved {placeholders}
  output = output.replace(/\{[a-zA-Z0-9_.]+\}/g, '');

  // Clean up duplicated or orphan separators like " • • " or trailing/leading "• "
  output = output
    .replace(/\s+([•|\-–/])\s+([•|\-–/])/g, ' $1')
    .replace(/^[\s•|\-–/]+|[\s•|\-–/]+$/g, '')
    .trim();

  return output;
}

export function sanitizeSubtitleId(rawId: string, item: RawSubtitleItem, index: number): string {
  // If rawId contains technical debug / community paths like "com.community..." or "community.subsync"
  if (/community|subsync|stremio-subtitles/i.test(rawId)) {
    const prefix = (item.provider || 'sub').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '');
    return `${prefix || 'sub'}-${item.lang || 'und'}-${index + 1}`;
  }

  return rawId || `sub-${index + 1}`;
}

export function formatSubtitleItem(
  item: RawSubtitleItem,
  config?: FormatterConfig,
  index: number = 0
): FormattedSubtitleResult {
  const cfg: FormatterConfig = config || {
    preset: 'clean',
    nameTemplate: '{sub.lang}',
    descriptionTemplate: ''
  };

  const vars = extractSubtitleVariables(item);

  const nameTemplate = typeof cfg.nameTemplate === 'string' && cfg.nameTemplate.trim() !== ''
    ? cfg.nameTemplate
    : '{sub.lang}';

  const descTemplate = typeof cfg.descriptionTemplate === 'string'
    ? cfg.descriptionTemplate
    : '';

  const formattedName = interpolateVariables(nameTemplate, vars) || vars['sub.lang'] || item.lang;
  const formattedDesc = interpolateVariables(descTemplate, vars);

  // If description is empty, sanitize id to prevent Nuvio from displaying raw community package names as fallback
  const cleanId = formattedDesc.trim() === ''
    ? sanitizeSubtitleId(item.id, item, index)
    : item.id;

  const result: FormattedSubtitleResult = {
    id: cleanId,
    lang: item.lang
  };

  if (formattedName && formattedName !== item.lang) {
    result.title = formattedName;
  }

  // Only attach description if it evaluated to a non-empty string.
  // When empty, omitting it ensures players do not show residual debug lines.
  if (formattedDesc && formattedDesc.trim() !== '') {
    result.description = formattedDesc.trim();
  }

  return result;
}

export function renderPreview(
  nameTemplate: string,
  descTemplate: string,
  customVars?: Record<string, string>
): { title: string; description: string } {
  const vars = { ...DEFAULT_PREVIEW_VARIABLES, ...(customVars || {}) };
  const title = interpolateVariables(nameTemplate || '{sub.lang}', vars) || vars['sub.lang'];
  const description = interpolateVariables(descTemplate || '', vars);

  return {
    title,
    description
  };
}
