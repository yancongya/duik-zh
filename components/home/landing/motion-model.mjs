// Original, deterministic browser illustrations. These are not Duik's AE solvers.
export const MOTION_KINDS = Object.freeze(['animation', 'automation', 'camera']);
export const AUTOMATION_DURATION = 4;
export const ANIMATION_DURATION = 3.4;
export const CAMERA_DURATION = 4.8;
export const CAMERA_DEPTHS = Object.freeze([0.16, 0.48, 0.92]);
// Presentation projection keeps the timing model independent of the stage size.
export function animationStagePoint(sample) {
  return {x: sample.x, y: 96 + (sample.y - 58) * 2.25, angle: Math.atan(Math.tan(sample.angle * Math.PI / 180) * 2.25) * 180 / Math.PI};
}
export const AUTOMATION_PRESETS = Object.freeze([
  Object.freeze({id: "soft", label: "轻晃", amplitude: 16, frequency: 1}),
  Object.freeze({id: "natural", label: "自然", amplitude: 32, frequency: 2}),
  Object.freeze({id: "lively", label: "活跃", amplitude: 48, frequency: 3}),
]);
export function clamp(value, min, max) {
  const n = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}
export function easing(time, mode = 'smooth') {
  const t = clamp(time, 0, 1);
  return mode === 'linear' ? t : t * t * (3 - 2 * t);
}
export function pathPoint(progress) {
  const p = clamp(progress, 0, 1);
  return {x: 68 + 464 * p, y: 122 - 64 * Math.sin(Math.PI * p)};
}
export function sampleAnimation(time, mode = 'smooth') {
  const t = clamp(time, 0, 1), progress = easing(t, mode), point = pathPoint(progress);
  return {time: t, progress, ...point, angle: Math.atan2(-64 * Math.PI * Math.cos(Math.PI * progress), 464) * 180 / Math.PI};
}
// Pointer scrubbing follows the artwork's position, not a second, unrelated rail.
export function animationTimeAtX(x, mode = 'smooth') {
  const progress = clamp((Number(x) - 68) / 464, 0, 1);
  if (mode === 'linear' || progress === 0 || progress === 1) return progress;
  let low = 0, high = 1;
  for (let i = 0; i < 32; i++) {
    const middle = (low + high) / 2;
    if (easing(middle, mode) < progress) low = middle; else high = middle;
  }
  return (low + high) / 2;
}
export function sampleAutomation({time = 0, amplitude = 32, frequency = 2, loop = true, seed = 17} = {}) {
  const seconds = clamp(time, 0, AUTOMATION_DURATION);
  const amount = clamp(amplitude, 0, 64), cycles = Math.round(clamp(frequency, 1, 6));
  const phase = seconds / AUTOMATION_DURATION * Math.PI * 2 * cycles;
  const origin = (Number.isFinite(Number(seed)) ? Number(seed) : 17) * 0.37;
  const wave = (offset = 0) => loop
    ? 0.72 * Math.sin(phase + origin + offset) + 0.28 * Math.sin(phase * 2 + origin * 1.7 + offset)
    : 0.72 * Math.sin(phase * 1.17 + origin + offset) + 0.28 * Math.sin(phase * 2.43 + origin * 1.7 + offset);
  return {time: seconds, amplitude: amount, frequency: cycles, loop: Boolean(loop), x: amount ? amount * wave() : 0, rotation: amount ? amount * 0.72 * wave(1.2) : 0, scale: 1 + amount / 220 * wave(2.4)};
}
export function cameraTransforms(viewX = 0, viewY = 0) {
  const x = clamp(viewX, -100, 100), y = clamp(viewY, -70, 70);
  return CAMERA_DEPTHS.map(depth => ({depth, x: -x * depth, y: -y * depth * 0.55}));
}
// One authored move, ending on a held composition. Starting from a user's view
// avoids a snap to the origin when they hand the camera back to the demonstration.
export function sampleCameraTour(time = 0, start = {viewX: 0, viewY: 0}) {
  const t = clamp(time / CAMERA_DURATION, 0, 1);
  const shots = [
    {at: 0, viewX: clamp(start.viewX, -100, 100), viewY: clamp(start.viewY, -70, 70)},
    {at: .38, viewX: -68, viewY: 24},
    {at: .78, viewX: 72, viewY: -24},
    {at: 1, viewX: 28, viewY: -8},
  ];
  const index = Math.min(shots.length - 2, shots.findIndex((shot, i) => i < shots.length - 1 && t <= shots[i + 1].at));
  const from = shots[Math.max(0, index)], to = shots[Math.max(0, index) + 1];
  const p = easing((t - from.at) / (to.at - from.at));
  return {viewX: from.viewX + (to.viewX - from.viewX) * p, viewY: from.viewY + (to.viewY - from.viewY) * p};
}
export function easePath(mode = 'smooth', steps = 48) {
  return Array.from({length: steps + 1}, (_, i) => {
    const t = i / steps;
    return `${i ? 'L' : 'M'}${(36 + t * 528).toFixed(2)},${(64 - easing(t, mode) * 48).toFixed(2)}`;
  }).join(' ');
}
export function automationPath(options = {}, steps = 80) {
  return Array.from({length: steps + 1}, (_, i) => {
    const sample = sampleAutomation({...options, time: AUTOMATION_DURATION * i / steps});
    return `${i ? 'L' : 'M'}${(36 + i / steps * 528).toFixed(2)},${(34 - sample.x * 0.34).toFixed(2)}`;
  }).join(' ');
}
