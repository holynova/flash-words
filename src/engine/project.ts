import {clampText, visibleCharacterCount} from './segment';
import {directRecipe, normalizeRecipe} from './recipes';
import {TEMPLATE_IDS, type AspectRatio, type ProjectSpec, type TemplateId} from './types';

export const DEFAULT_PROJECT: ProjectSpec = {
  version: 2,
  text: '艺术是我的朋友',
  aspectRatio: '1:1',
  durationSeconds: 8,
  fps: 30,
  templateId: 'bold-cuts',
  seed: 731986,
  intensity: 0.72,
  speed: 1,
  fontId: 'noto-sans',
  foreground: '#f5f1e8',
  background: '#0d0d0c',
  autoDirector: true,
  recipe: directRecipe('bold-cuts', '艺术是我的朋友', 731986),
  locks: {template: false, palette: true, layout: false},
};

const COLOR_PATTERN = /^#[0-9a-f]{6}$/iu;

export function dimensionsFor(aspectRatio: AspectRatio, quality: 'preview' | 'video' | 'gif') {
  if (aspectRatio === '9:16') {
    if (quality === 'preview') return {width: 405, height: 720};
    if (quality === 'gif') return {width: 405, height: 720};
    return {width: 1080, height: 1920};
  }
  if (quality === 'preview') return {width: 720, height: 720};
  if (quality === 'gif') return {width: 720, height: 720};
  return {width: 1080, height: 1080};
}

export function normalizeProject(input: unknown): ProjectSpec {
  if (!input || typeof input !== 'object') return structuredClone(DEFAULT_PROJECT);
  const source = input as Partial<ProjectSpec>;
  const text = clampText(typeof source.text === 'string' ? source.text : DEFAULT_PROJECT.text);
  const templateId = TEMPLATE_IDS.includes(source.templateId as TemplateId)
    ? (source.templateId as TemplateId)
    : DEFAULT_PROJECT.templateId;
  const aspectRatio = source.aspectRatio === '9:16' ? '9:16' : '1:1';
  const fontId = ['noto-sans', 'noto-serif', 'archivo-black'].includes(source.fontId ?? '')
    ? source.fontId!
    : DEFAULT_PROJECT.fontId;

  return {
    version: 2,
    text,
    aspectRatio,
    durationSeconds: Math.min(12, Math.max(4, Number(source.durationSeconds) || 8)),
    fps: 30,
    templateId,
    seed: Number.isFinite(source.seed) ? Math.max(0, Math.floor(source.seed!)) : DEFAULT_PROJECT.seed,
    intensity: Math.min(1, Math.max(0.2, Number(source.intensity) || DEFAULT_PROJECT.intensity)),
    speed: Math.min(2, Math.max(0.5, Number(source.speed) || DEFAULT_PROJECT.speed)),
    fontId,
    foreground: COLOR_PATTERN.test(source.foreground ?? '') ? source.foreground! : DEFAULT_PROJECT.foreground,
    background: COLOR_PATTERN.test(source.background ?? '') ? source.background! : DEFAULT_PROJECT.background,
    autoDirector: source.autoDirector !== false,
    recipe: source.recipe
      ? normalizeRecipe(source.recipe, templateId)
      : directRecipe(templateId, text, Number.isFinite(source.seed) ? Number(source.seed) : DEFAULT_PROJECT.seed),
    locks: {
      template: Boolean(source.locks?.template),
      palette: Boolean(source.locks?.palette),
      layout: Boolean(source.locks?.layout),
    },
  };
}

export function validateProject(project: ProjectSpec): string | null {
  if (!project.text.trim()) return '请输入至少一个字符';
  if (visibleCharacterCount(project.text) > 60) return '最多输入 60 个字符';
  if (project.foreground.toLowerCase() === project.background.toLowerCase()) return '文字和背景颜色不能相同';
  return null;
}
