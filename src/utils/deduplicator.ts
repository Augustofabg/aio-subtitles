import { RawSubtitleItem } from '../types/provider';

/**
 * Tokenizes release names to calculate fuzzy similarity
 */
function tokenize(str: string): Set<string> {
  const tokens = str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
  return new Set(tokens);
}

/**
 * Calculates Dice's token similarity coefficient (0 to 1)
 */
function similarity(tokensA: Set<string>, tokensB: Set<string>): number {
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) {
      intersection++;
    }
  }
  return (2 * intersection) / (tokensA.size + tokensB.size);
}

/**
 * Deduplicates a list of subtitles based on:
 * 1. Exact fileHash or URL match
 * 2. Identical language + identical hearing-impaired status + high fuzzy similarity (>0.85) on release name
 *
 * Items earlier in the array take precedence over later items.
 */
export function deduplicateSubtitles(
  items: RawSubtitleItem[],
  similarityThreshold = 0.85
): RawSubtitleItem[] {
  const result: RawSubtitleItem[] = [];
  const seenHashes = new Set<string>();
  const seenUrls = new Set<string>();

  for (const item of items) {
    // 1. Direct URL deduplication
    if (item.url && seenUrls.has(item.url)) {
      continue;
    }

    // 2. Hash deduplication
    if (item.fileHash && seenHashes.has(item.fileHash)) {
      continue;
    }

    // 3. Fuzzy release name similarity deduplication
    let isDuplicate = false;
    const itemTokens = item.release ? tokenize(item.release) : new Set<string>();

    if (itemTokens.size > 0) {
      for (const existing of result) {
        // Must be same language and hearing-impaired status to be a duplicate
        if (existing.lang !== item.lang) continue;
        if (Boolean(existing.hearingImpaired) !== Boolean(item.hearingImpaired)) continue;

        if (existing.release) {
          const existingTokens = tokenize(existing.release);
          const score = similarity(itemTokens, existingTokens);
          if (score >= similarityThreshold) {
            isDuplicate = true;
            break;
          }
        }
      }
    }

    if (!isDuplicate) {
      if (item.url) seenUrls.add(item.url);
      if (item.fileHash) seenHashes.add(item.fileHash);
      result.push(item);
    }
  }

  return result;
}

/**
 * Sorts subtitles by provider priority defined by the user
 */
export function prioritizeSubtitles(
  items: RawSubtitleItem[],
  providerPriority: string[]
): RawSubtitleItem[] {
  if (!providerPriority || providerPriority.length === 0) {
    return items;
  }

  const priorityMap = new Map<string, number>();
  providerPriority.forEach((id, index) => {
    priorityMap.set(id.toLowerCase(), index);
  });

  return [...items].sort((a, b) => {
    const priorityA = priorityMap.has(a.provider.toLowerCase())
      ? priorityMap.get(a.provider.toLowerCase())!
      : 999;
    const priorityB = priorityMap.has(b.provider.toLowerCase())
      ? priorityMap.get(b.provider.toLowerCase())!
      : 999;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Secondary sort: prefer hearing impaired if requested or standard, and higher rating/downloads
    const downloadsA = a.downloads || 0;
    const downloadsB = b.downloads || 0;
    return downloadsB - downloadsA;
  });
}
