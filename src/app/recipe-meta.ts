import {
  BACKGROUND_EFFECT_IDS,
  EMPHASIS_EFFECT_IDS,
  ENTRANCE_EFFECT_IDS,
  EXIT_EFFECT_IDS,
  MOTION_EFFECT_IDS,
  type MotionRecipe,
} from '../engine/types';

const EFFECT_NAMES: Record<string, string> = {
  fly: '飞入',
  typewriter: '打字',
  scatter: '聚散',
  shutter: '快门',
  zoom: '缩放',
  none: '无',
  wave: '波浪',
  elastic: '弹性',
  drift: '漂移',
  tunnel: '隧道',
  still: '静止',
  pulse: '脉冲',
  flash: '闪烁',
  glitch: '故障',
  invert: '反相',
  shrink: '收缩',
  fade: '淡出',
  tiles: '平铺',
  grid: '网格',
  scanlines: '扫描线',
};

export const RECIPE_FIELDS: Array<{
  key: keyof MotionRecipe;
  label: string;
  index: string;
  options: readonly string[];
}> = [
  {key: 'entrance', label: '进入', index: 'IN', options: ENTRANCE_EFFECT_IDS},
  {key: 'motion', label: '持续', index: 'MOVE', options: MOTION_EFFECT_IDS},
  {key: 'emphasis', label: '强调', index: 'HIT', options: EMPHASIS_EFFECT_IDS},
  {key: 'exit', label: '退出', index: 'OUT', options: EXIT_EFFECT_IDS},
  {key: 'background', label: '背景', index: 'BG', options: BACKGROUND_EFFECT_IDS},
];

export function effectName(effect: string) {
  return EFFECT_NAMES[effect] ?? effect;
}

export function recipeSummary(recipe: MotionRecipe) {
  return RECIPE_FIELDS.map((field) => effectName(recipe[field.key])).join(' · ');
}
