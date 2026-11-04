export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const beatPositions = [0, .45, .74, .97];
export function sceneAt(progress) {
  const p = clamp(progress);
  const beat = p < .16 ? 0 : p < .58 ? 1 : p < .82 ? 2 : 3;
  const spread = p < .45 ? smooth((p - .1) / .35) : 1 - smooth((p - .52) / .3);
  return { beat, spread, interactive: spread < .001 && (beat === 0 || beat === 3) };
}
export function layerTransform(part, index, camera, spread) {
  const [x, y, right, bottom] = part.bbox;
  const w = right - x, h = bottom - y;
  const cellW = camera[2] / 6, cellH = camera[3] / 5;
  const targetX = camera[0] + cellW * (index % 6 + .5);
  const targetY = camera[1] + cellH * (Math.floor(index / 6) + .5);
  const targetScale = Math.min(cellW * .74 / w, cellH * .72 / h, 1.5);
  const dx = (targetX - x - w / 2) / w * 100 * spread;
  const dy = (targetY - y - h / 2) / h * 100 * spread;
  return 'translate(' + dx + '%, ' + dy + '%) scale(' + (1 + (targetScale - 1) * spread) + ')';
}
