import '@fontsource-variable/noto-sans-sc';
import '@fontsource-variable/noto-serif-sc';
import '@fontsource/archivo-black';
import type {FontId} from '../engine/types';

export const FONT_STACKS: Record<FontId, string> = {
  'noto-sans': '"Noto Sans SC Variable", "PingFang SC", sans-serif',
  'noto-serif': '"Noto Serif SC Variable", "Songti SC", serif',
  'archivo-black': '"Archivo Black", "Noto Sans SC Variable", "PingFang SC", sans-serif',
};

export async function ensureFontsLoaded() {
  if (!('fonts' in document)) return;
  await document.fonts.ready;
}
