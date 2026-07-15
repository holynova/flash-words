const segmenters = new Map<string, Intl.Segmenter>();

function getSegmenter(granularity: Intl.SegmenterOptions['granularity']) {
  const key = granularity ?? 'grapheme';
  const existing = segmenters.get(key);
  if (existing) return existing;
  const segmenter = new Intl.Segmenter(['zh-CN', 'en'], {granularity});
  segmenters.set(key, segmenter);
  return segmenter;
}

export function graphemes(text: string): string[] {
  const normalized = text.normalize('NFC');
  if (typeof Intl.Segmenter === 'undefined') return Array.from(normalized);
  return Array.from(getSegmenter('grapheme').segment(normalized), (item) => item.segment);
}

export function words(text: string): string[] {
  const normalized = text.normalize('NFC').trim();
  if (!normalized) return [];
  if (typeof Intl.Segmenter === 'undefined') return normalized.split(/\s+/u);

  const segments = Array.from(getSegmenter('word').segment(normalized));
  const result: string[] = [];
  for (const segment of segments) {
    const value = segment.segment.trim();
    if (!value) continue;
    if (segment.isWordLike || /[\p{P}\p{S}]/u.test(value)) result.push(value);
  }
  return result;
}

export function visibleCharacterCount(text: string): number {
  return graphemes(text).filter((item) => item.trim().length > 0).length;
}

export function clampText(text: string, max = 60): string {
  const items = graphemes(text);
  let visibleCount = 0;
  let whitespaceCount = 0;
  const result: string[] = [];
  for (const item of items) {
    if (item.trim()) {
      visibleCount += 1;
    } else {
      whitespaceCount += 1;
      if (whitespaceCount > max * 4) continue;
    }
    if (visibleCount > max) break;
    result.push(item);
  }
  return result.join('');
}
