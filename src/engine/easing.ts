export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function easeOutQuint(value: number) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 5);
}

export function easeInOutQuart(value: number) {
  const t = clamp01(value);
  return t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export function tempoProgress(value: number, speed: number) {
  const boundedSpeed = Math.min(2, Math.max(0.5, speed));
  const exponent = 1 / (0.8 + boundedSpeed * 0.2);
  return Math.pow(clamp01(value), exponent);
}
