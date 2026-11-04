/**
 * Two-bone world-space adapter based on RevStudio/Rev2D src/core/rig/ik.ts.
 * MIT, Copyright (c) 2026 RevStudio. See LICENSE-Rev2D.txt.
 * Adapted: rigid world-space joints only; no compiler, scale, stretch or softness.
 */
export function solveTwoBone(shoulder, restElbow, restWrist, target, restShoulder = shoulder) {
  const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);
  const l1=distance(restShoulder,restElbow), l2=distance(restElbow,restWrist);
  const dx=target[0]-shoulder[0], dy=target[1]-shoulder[1];
  const raw=Math.hypot(dx,dy), d=Math.max(Math.abs(l1-l2)+1e-6,Math.min(l1+l2-1e-6,raw));
  const fallback=Math.atan2(restWrist[1]-restShoulder[1],restWrist[0]-restShoulder[0]);
  const direction=raw>1e-8?Math.atan2(dy,dx):fallback;
  const cross=(restWrist[0]-restShoulder[0])*(restElbow[1]-restShoulder[1])-(restWrist[1]-restShoulder[1])*(restElbow[0]-restShoulder[0]);
  const bend=Math.sign(cross)||1;
  const angle=direction+bend*Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
  const elbow=[shoulder[0]+Math.cos(angle)*l1,shoulder[1]+Math.sin(angle)*l1];
  const wrist=[shoulder[0]+Math.cos(direction)*d,shoulder[1]+Math.sin(direction)*d];
  return {shoulder,elbow,wrist,requested:target,clamped:Math.abs(raw-d)>1e-4,
    targetError:distance(wrist,target),lengthError:Math.max(Math.abs(distance(shoulder,elbow)-l1),Math.abs(distance(elbow,wrist)-l2))};
}

