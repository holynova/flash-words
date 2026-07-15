import {describe, expect, it} from 'vitest';
import {tempoProgress} from '../engine/easing';

describe('tempo progress', () => {
  it('changes pacing while preserving both loop boundaries', () => {
    for (const speed of [0.5, 1, 1.3, 2]) {
      expect(tempoProgress(0, speed)).toBe(0);
      expect(tempoProgress(1, speed)).toBe(1);
    }
    expect(tempoProgress(0.5, 2)).toBeGreaterThan(0.5);
    expect(tempoProgress(0.5, 0.5)).toBeLessThan(0.5);
  });
});
