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
  const motionPhase = windowProgress(progress, 0.24, 0.8);
  const emphasisPhase = windowProgress(progress, 0.56, 0.76);
  const emphasis = progress <= 0.56 || progress >= 0.76
    ? 0
    : Math.sin(emphasisPhase * Math.PI);
  return {
    progress,
    entrance: windowProgress(progress, 0, 0.68),
    motion: progress <= 0.24 || progress >= 0.8 ? 0 : Math.sin(motionPhase * Math.PI),
    emphasis,
    emphasisPhase,
    exit: windowProgress(progress, 0.78, 1),
  };
}
