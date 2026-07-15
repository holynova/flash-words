import {describe, expect, it} from 'vitest';
import {clampText, graphemes, visibleCharacterCount, words} from '../engine/segment';

describe('text segmentation', () => {
  it('segments Chinese text into useful word-like units', () => {
    expect(words('艺术是我的朋友').join('')).toBe('艺术是我的朋友');
    expect(words('艺术是我的朋友').length).toBeGreaterThan(1);
  });

  it('keeps emoji sequences as one visible grapheme', () => {
    expect(graphemes('A👩‍🎨B')).toEqual(['A', '👩‍🎨', 'B']);
    expect(visibleCharacterCount(' A 👩‍🎨 B ')).toBe(3);
  });

  it('clamps without splitting a grapheme cluster', () => {
    expect(clampText('甲乙👩‍🎨丙', 3)).toBe('甲乙👩‍🎨');
  });

  it('clamps by visible graphemes without counting whitespace', () => {
    const value = `${'字 '.repeat(60)}👨‍👩‍👧‍👦`;
    const clamped = clampText(value);
    expect(visibleCharacterCount(clamped)).toBe(60);
    expect(clamped).not.toContain('👨‍👩‍👧‍👦');
    expect(clamped).toContain(' ');
  });

  it('caps excess whitespace without losing later visible text', () => {
    const clamped = clampText(`${' '.repeat(1_000)}保留我`);
    expect(clamped.length).toBeLessThanOrEqual(243);
    expect(clamped).toContain('保留我');
  });
});
