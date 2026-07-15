export const TEMPLATE_IDS = [
  'bold-cuts',
  'fly-grid',
  'elastic-type',
  'tunnel-zoom',
  'flash-invert',
  'tile-storm',
  'glitch-slice',
  'scatter-assemble',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];
export type AspectRatio = '1:1' | '9:16';
export type FontId = 'noto-sans' | 'noto-serif' | 'archivo-black';

export interface ProjectLocks {
  template: boolean;
  palette: boolean;
  layout: boolean;
}

export interface ProjectSpec {
  version: 1;
  text: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  fps: 30;
  templateId: TemplateId;
  seed: number;
  intensity: number;
  fontId: FontId;
  foreground: string;
  background: string;
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
