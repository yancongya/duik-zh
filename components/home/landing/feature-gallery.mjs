import {renderMotion} from './motion-demo.mjs';

// Reuse the previously authored illustrations in their original horizontal slots.
// Models, gestures and visibility clocks remain owned by motion-demo.
export const featureGalleryItems=Object.freeze([
  {kind:'automation',title:'让变化自己发生',summary:'一次设置，让位置、旋转和大小持续变化。',href:'/docs/guide/automation/wiggle',link:'自动化 · Wiggle'},
  {kind:'animation',title:'同一条路，不同的节奏',summary:'缓入、缓出，让每次出发和停下各有轻重。',href:'/docs/guide/animation/interpolation',link:'动画 · 插值'},
  {kind:'camera',title:'平面的风景，也有纵深',summary:'让远山、房屋和近处的树，跟着镜头错开。',href:'/docs/guide/camera/camera-2d',link:'2D 摄像机'},
]);
// No second gallery after the orbit: each scene has one production owner.
export function renderFeatureSlide(kind){
  const item=featureGalleryItems.find(item=>item.kind===kind);
  if(!item)throw Error('Unknown feature illustration '+kind);
  return `<section class="duik-feature-slide" data-feature-kind="${kind}"${kind==='animation'?' id="more-features"':''} aria-label="${item.title}">
    <header class="duik-feature-slide-heading"><h2>${item.title}</h2><p>${item.summary}</p></header>
    ${renderMotion(kind,{compact:true})}
    <div class="duik-feature-slide-footnote"><span>网页原理示意 · 可直接拖动画面</span><a href="${item.href}">${item.link} ↗</a></div>
  </section>`;
}
