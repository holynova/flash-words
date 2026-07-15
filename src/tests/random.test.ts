import {describe, expect, it} from 'vitest';
import {createRandom, hashString, randomFor} from '../engine/random';

describe('seeded random', () => {
  it('returns the same sequence for the same seed', () => {
    const first = createRandom(42);
    const second = createRandom(42);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('separates named random channels', () => {
    expect(randomFor(42, 'x')).toBe(randomFor(42, 'x'));
    expect(randomFor(42, 'x')).not.toBe(randomFor(42, 'y'));
    expect(hashString('艺术')).toBe(hashString('艺术'));
  });
});
