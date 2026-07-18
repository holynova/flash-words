import {visibleCharacterCount} from './segment';
import {
  BACKGROUND_EFFECT_IDS,
  EMPHASIS_EFFECT_IDS,
  ENTRANCE_EFFECT_IDS,
  EXIT_EFFECT_IDS,
  MOTION_EFFECT_IDS,
  type BackgroundEffectId,
  type EmphasisEffectId,
  type EntranceEffectId,
  type ExitEffectId,
  type MotionEffectId,
  type MotionRecipe,
  type TemplateId,
} from './types';

export const RECIPE_PRESETS: Record<TemplateId, MotionRecipe> = {
  'bold-cuts': {entrance: 'fly', motion: 'elastic', emphasis: 'flash', exit: 'shutter', background: 'tiles'},
  'fly-grid': {entrance: 'fly', motion: 'drift', emphasis: 'pulse', exit: 'fly', background: 'grid'},
  'elastic-type': {entrance: 'zoom', motion: 'elastic', emphasis: 'pulse', exit: 'shrink', background: 'none'},
  'tunnel-zoom': {entrance: 'zoom', motion: 'tunnel', emphasis: 'flash', exit: 'shrink', background: 'tunnel'},
  'flash-invert': {entrance: 'shutter', motion: 'still', emphasis: 'flash', exit: 'fade', background: 'scanlines'},
  'tile-storm': {entrance: 'fly', motion: 'wave', emphasis: 'pulse', exit: 'shutter', background: 'tiles'},
  'glitch-slice': {entrance: 'typewriter', motion: 'drift', emphasis: 'glitch', exit: 'fade', background: 'scanlines'},
  'scatter-assemble': {entrance: 'scatter', motion: 'wave', emphasis: 'pulse', exit: 'scatter', background: 'none'},
  'wave-flow': {entrance: 'fly', motion: 'wave', emphasis: 'invert', exit: 'fade', background: 'grid'},
  typewriter: {entrance: 'typewriter', motion: 'still', emphasis: 'glitch', exit: 'fade', background: 'scanlines'},
  'shutter-reveal': {entrance: 'shutter', motion: 'elastic', emphasis: 'invert', exit: 'shutter', background: 'grid'},
};

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

export function normalizeRecipe(input: unknown, templateId: TemplateId): MotionRecipe {
  const fallback = RECIPE_PRESETS[templateId];
  const source = input && typeof input === 'object' ? input as Partial<MotionRecipe> : {};
  return {
    entrance: isOneOf(source.entrance, ENTRANCE_EFFECT_IDS) ? source.entrance : fallback.entrance,
    motion: isOneOf(source.motion, MOTION_EFFECT_IDS) ? source.motion : fallback.motion,
    emphasis: isOneOf(source.emphasis, EMPHASIS_EFFECT_IDS) ? source.emphasis : fallback.emphasis,
    exit: isOneOf(source.exit, EXIT_EFFECT_IDS) ? source.exit : fallback.exit,
    background: isOneOf(source.background, BACKGROUND_EFFECT_IDS) ? source.background : fallback.background,
  };
}

export function directRecipe(templateId: TemplateId, text: string, seed: number): MotionRecipe {
  const recipe = {...RECIPE_PRESETS[templateId]};
  const count = visibleCharacterCount(text);
  if (count <= 4) {
    recipe.exit = 'shrink';
    if (recipe.emphasis === 'none') recipe.emphasis = seed % 2 === 0 ? 'pulse' : 'flash';
  } else if (count >= 12) {
    recipe.entrance = seed % 2 === 0 ? 'typewriter' : 'scatter';
    recipe.motion = seed % 3 === 0 ? 'drift' : 'wave';
    recipe.exit = 'fade';
    if (recipe.background === 'none') recipe.background = 'grid';
  }
  return recipe;
}

export function randomRecipe(seed: number): MotionRecipe {
  return {
    entrance: ENTRANCE_EFFECT_IDS[seed % (ENTRANCE_EFFECT_IDS.length - 1)] as EntranceEffectId,
    motion: MOTION_EFFECT_IDS[(seed >>> 3) % MOTION_EFFECT_IDS.length] as MotionEffectId,
    emphasis: EMPHASIS_EFFECT_IDS[(seed >>> 6) % EMPHASIS_EFFECT_IDS.length] as EmphasisEffectId,
    exit: EXIT_EFFECT_IDS[(seed >>> 9) % (EXIT_EFFECT_IDS.length - 1)] as ExitEffectId,
    background: BACKGROUND_EFFECT_IDS[(seed >>> 12) % BACKGROUND_EFFECT_IDS.length] as BackgroundEffectId,
  };
}
