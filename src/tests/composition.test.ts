import {describe, expect, it} from 'vitest';
import {compositionTiming} from '../engine/composition';

describe('composition timing', () => {
  it('orders entrance, motion, emphasis, and exit without breaking the loop endpoints', () => {
    expect(compositionTiming(0)).toMatchObject({entrance: 0, emphasis: 0, exit: 0});
    expect(compositionTiming(0.24).entrance).toBeGreaterThan(0);
    expect(compositionTiming(0.24).entrance).toBeLessThan(1);
    expect(compositionTiming(0.7).entrance).toBe(1);
    expect(compositionTiming(0.5).motion).toBeGreaterThan(0);
    expect(compositionTiming(0.66).emphasis).toBeGreaterThan(0.9);
    expect(compositionTiming(0.9).exit).toBeGreaterThan(0);
    expect(compositionTiming(1)).toMatchObject({entrance: 1, motion: 0, emphasis: 0, exit: 1});
  });

  it('keeps entrance effects visible for several frames in fast character mode', () => {
    const framesPerCharacter = Math.round(8 * 30 * 0.72) / 12;
    const firstFrameProgress = 1 / framesPerCharacter;
    expect(compositionTiming(firstFrameProgress).entrance).toBeLessThan(0.25);
    expect(compositionTiming(6 / framesPerCharacter).entrance).toBeLessThan(1);
  });

  it('clamps progress outside the valid scene range', () => {
    expect(compositionTiming(-1)).toEqual(compositionTiming(0));
    expect(compositionTiming(2)).toEqual(compositionTiming(1));
  });
});
