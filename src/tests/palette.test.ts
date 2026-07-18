import {describe, expect, it} from 'vitest';
import {compositionTiming} from '../engine/composition';
import {DEFAULT_PROJECT} from '../engine/project';
import {resolvePalette} from '../renderer/render-frame';

function brightness(color: string) {
  return [1, 3, 5]
    .map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16))
    .reduce((total, channel) => total + channel, 0) / 3;
}

describe('comfortable emphasis palettes', () => {
  it('renders flash as one continuous, muted pulse', () => {
    const project = {
      ...DEFAULT_PROJECT,
      recipe: {...DEFAULT_PROJECT.recipe, emphasis: 'flash' as const},
    };
    const samples = Array.from({length: 101}, (_, index) => {
      const palette = resolvePalette(project, compositionTiming(index / 100));
      return brightness(palette.background);
    });
    const restingBrightness = brightness(project.background);
    const activeFrames = samples
      .map((value, index) => value > restingBrightness + 8 ? index : -1)
      .filter((index) => index >= 0);

    expect(activeFrames.length).toBeGreaterThan(0);
    expect(activeFrames.at(-1)! - activeFrames[0] + 1).toBe(activeFrames.length);
    expect(Math.max(...samples) - restingBrightness).toBeLessThan(45);
  });

  it('caps inverted backgrounds well below white', () => {
    const project = {
      ...DEFAULT_PROJECT,
      recipe: {...DEFAULT_PROJECT.recipe, emphasis: 'invert' as const},
    };
    const samples = Array.from({length: 101}, (_, index) => {
      const palette = resolvePalette(project, compositionTiming(index / 100));
      return brightness(palette.background);
    });

    expect(Math.max(...samples)).toBeLessThan(120);
    expect(resolvePalette(project, compositionTiming(0)).background).toBe(project.background);
    expect(resolvePalette(project, compositionTiming(1)).background).toBe(project.background);
  });
});
