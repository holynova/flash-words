import {describe, expect, it} from 'vitest';
import {
  directRecipe,
  normalizeRecipe,
  randomRecipe,
  RECIPE_PRESETS,
  SINGLE_EFFECT_PRESETS,
  singleRecipe,
} from '../engine/recipes';
import {EMPHASIS_EFFECT_IDS, MOTION_EFFECT_IDS, TEMPLATE_IDS} from '../engine/types';

describe('motion recipes', () => {
  it('provides a complete multi-effect preset for every visual template', () => {
    expect(Object.keys(RECIPE_PRESETS)).toEqual([...TEMPLATE_IDS]);
    for (const templateId of TEMPLATE_IDS) {
      const recipe = RECIPE_PRESETS[templateId];
      const activeEffects = Object.values(recipe).filter((effect) => effect !== 'none');
      expect(activeEffects.length, templateId).toBeGreaterThanOrEqual(2);
    }
  });

  it('removes spring-like elastic and pulse layers everywhere', () => {
    expect(MOTION_EFFECT_IDS).not.toContain('elastic');
    expect(EMPHASIS_EFFECT_IDS).not.toContain('pulse');
    expect(Object.values(RECIPE_PRESETS).every((recipe) => (
      String(recipe.motion) !== 'elastic' && String(recipe.emphasis) !== 'pulse'
    ))).toBe(true);
    expect(normalizeRecipe({
      ...RECIPE_PRESETS['fly-grid'],
      motion: 'elastic',
      emphasis: 'pulse',
    }, 'fly-grid')).toEqual(RECIPE_PRESETS['fly-grid']);
  });

  it('provides exactly one active effect for every single-effect preset', () => {
    expect(Object.keys(SINGLE_EFFECT_PRESETS)).toEqual([...TEMPLATE_IDS]);
    for (const templateId of TEMPLATE_IDS) {
      const recipe = singleRecipe(templateId);
      const activeEffects = Object.entries(recipe).filter(([slot, effect]) => (
        effect !== 'none' && !(slot === 'motion' && effect === 'still')
      ));
      expect(activeEffects, templateId).toHaveLength(1);
    }
  });

  it('normalizes unknown effects back to the selected preset', () => {
    expect(normalizeRecipe({
      entrance: 'unknown',
      motion: 'wave',
      emphasis: 'unknown',
      exit: 'fade',
      background: 'unknown',
    }, 'wave-flow')).toEqual({
      ...RECIPE_PRESETS['wave-flow'],
      motion: 'wave',
      exit: 'fade',
    });
  });

  it('directs deterministic recipes and varies them by text shape', () => {
    expect(directRecipe('bold-cuts', '动', 42)).toEqual(directRecipe('bold-cuts', '动', 42));
    expect(directRecipe('bold-cuts', '动', 42)).not.toEqual(
      directRecipe('bold-cuts', '一段更长的文字需要不同的视觉节奏', 42),
    );
  });

  it('creates deterministic manual combinations from a seed', () => {
    expect(randomRecipe(8128)).toEqual(randomRecipe(8128));
    expect(randomRecipe(8128)).not.toEqual(randomRecipe(8129));
  });
});
