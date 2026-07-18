export const TEMPLATE_IDS = [
  'bold-cuts',
  'fly-grid',
  'elastic-type',
  'tunnel-zoom',
  'flash-invert',
  'tile-storm',
  'glitch-slice',
  'scatter-assemble',
  'wave-flow',
  'typewriter',
  'shutter-reveal',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];
export type AspectRatio = '1:1' | '9:16';
export type FontId = 'noto-sans' | 'noto-serif' | 'archivo-black';

export const ENTRANCE_EFFECT_IDS = ['fly', 'typewriter', 'scatter', 'shutter', 'zoom', 'none'] as const;
export const MOTION_EFFECT_IDS = ['wave', 'elastic', 'drift', 'tunnel', 'still'] as const;
export const EMPHASIS_EFFECT_IDS = ['pulse', 'flash', 'glitch', 'invert', 'none'] as const;
export const EXIT_EFFECT_IDS = ['shrink', 'shutter', 'scatter', 'fly', 'fade', 'none'] as const;
export const BACKGROUND_EFFECT_IDS = ['none', 'tiles', 'grid', 'tunnel', 'scanlines'] as const;

export type EntranceEffectId = (typeof ENTRANCE_EFFECT_IDS)[number];
export type MotionEffectId = (typeof MOTION_EFFECT_IDS)[number];
export type EmphasisEffectId = (typeof EMPHASIS_EFFECT_IDS)[number];
export type ExitEffectId = (typeof EXIT_EFFECT_IDS)[number];
export type BackgroundEffectId = (typeof BACKGROUND_EFFECT_IDS)[number];

export interface MotionRecipe {
  entrance: EntranceEffectId;
  motion: MotionEffectId;
  emphasis: EmphasisEffectId;
  exit: ExitEffectId;
  background: BackgroundEffectId;
}

export interface ProjectLocks {
  template: boolean;
  palette: boolean;
  layout: boolean;
}

export interface ProjectSpec {
  version: 2;
  text: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  fps: 30;
  templateId: TemplateId;
  seed: number;
  intensity: number;
  speed: number;
  fontId: FontId;
  foreground: string;
  background: string;
  autoDirector: boolean;
  recipe: MotionRecipe;
  locks: ProjectLocks;
}

export type SceneKind = 'focus' | 'phrase' | 'climax' | 'resolve';

export interface TimelineScene {
  id: string;
  kind: SceneKind;
  text: string;
  startFrame: number;
  endFrame: number;
  emphasis: number;
}

export interface Timeline {
  totalFrames: number;
  scenes: TimelineScene[];
}

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'done';
  progress: number;
  message: string;
}

export interface ExportOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ExportProgress) => void;
}
