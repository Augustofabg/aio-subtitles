import { RawSubtitleItem } from '../types/provider';
import { FormatterConfig } from '../types/config';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

export interface FormattedSubtitleResult {
  id: string;
  lang: string;
  title?: string;
  label?: string;
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
  if (!rawId || /community|subsync|stremio-subtitles/i.test(rawId) || /^[a-z0-9_]+\.[a-z0-9_]+/i.test(rawId)) {
    return `${item.lang || 'sub'}-${index + 1}`;
  }

  return rawId;
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
  const formattedDesc = interpolateVariables(descTemplate, vars).trim();

  // If description template evaluates to a non-empty string (Detailed or Custom mode):
  if (formattedDesc !== '') {
    // Both Nuvio and Stremio should display `formattedDesc` as the secondary line.
    // In Stremio, `label` is the official property (PR #947).
    // In Nuvio, it renders `sub.label ?: sub.id`.
    // By setting `label`, `description`, AND `id` to the formatted description (with index suffix if needed for uniqueness),
    // we guarantee that NO player can display any technical community IDs.
    const uniqueId = index > 0 ? `${formattedDesc} #${index + 1}` : formattedDesc;

    const result: FormattedSubtitleResult = {
      id: uniqueId,
      lang: item.lang,
      label: formattedDesc,
      description: formattedDesc
    };

    if (formattedName && formattedName !== item.lang) {
      result.title = formattedName;
    }

    return result;
  }

  // If description template evaluates to an empty string ("Clean / Default" mode):
  // 1. Omit `description` completely
  // 2. Set `label: ""` so players reading `label` do not fall back to technical IDs
  // 3. Sanitize `id` so that even if a client displays `id`, it is a clean short index
  const cleanId = sanitizeSubtitleId(item.id, item, index);

  const result: FormattedSubtitleResult = {
    id: cleanId,
    lang: item.lang,
    label: ''
  };

  if (formattedName && formattedName !== item.lang) {
    result.title = formattedName;
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
