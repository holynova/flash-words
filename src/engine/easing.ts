export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function easeOutQuint(value: number) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 5);
}

export function easeInOutQuart(value: number) {
  const t = clamp01(value);
  return t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export function pulse(value: number) {
  return Math.sin(clamp01(value) * Math.PI);
}

export function tempoProgress(value: number, speed: number) {
  return Math.pow(clamp01(value), 1 / Math.max(0.01, speed));
}
