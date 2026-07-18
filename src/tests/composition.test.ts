import {describe, expect, it} from 'vitest';
import {compositionTiming} from '../engine/composition';

describe('composition timing', () => {
  it('orders entrance, motion, emphasis, and exit without breaking the loop endpoints', () => {
    expect(compositionTiming(0)).toMatchObject({entrance: 0, emphasis: 0, exit: 0});
    expect(compositionTiming(0.24).entrance).toBe(1);
    expect(compositionTiming(0.5).motion).toBeGreaterThan(0);
    expect(compositionTiming(0.68).emphasis).toBeGreaterThan(0.9);
    expect(compositionTiming(0.9).exit).toBeGreaterThan(0);
    expect(compositionTiming(1)).toMatchObject({entrance: 1, motion: 0, emphasis: 0, exit: 1});
  });

  it('clamps progress outside the valid scene range', () => {
    expect(compositionTiming(-1)).toEqual(compositionTiming(0));
    expect(compositionTiming(2)).toEqual(compositionTiming(1));
  });
});
