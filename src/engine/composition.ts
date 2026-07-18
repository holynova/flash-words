import {clamp01} from './easing';

export interface CompositionTiming {
  progress: number;
  entrance: number;
  motion: number;
  emphasis: number;
  emphasisPhase: number;
  exit: number;
}

function windowProgress(value: number, start: number, end: number) {
  return clamp01((value - start) / (end - start));
}

export function compositionTiming(value: number): CompositionTiming {
  const progress = clamp01(value);
  const motionPhase = windowProgress(progress, 0.18, 0.78);
  const emphasisPhase = windowProgress(progress, 0.58, 0.78);
  const emphasis = progress <= 0.58 || progress >= 0.78
    ? 0
    : Math.sin(emphasisPhase * Math.PI);
  return {
    progress,
    entrance: windowProgress(progress, 0, 0.22),
    motion: progress <= 0.18 || progress >= 0.78 ? 0 : Math.sin(motionPhase * Math.PI),
    emphasis,
    emphasisPhase,
    exit: windowProgress(progress, 0.8, 1),
  };
}
