import {reuseMarkup} from './reuse-demo.mjs';

// Linearity's original orbit is deliberately retained, not replaced by this
// secondary workbench. Both renderers wrap that same compiled component.
export const orbitClass='duik-orbit-section w-screen flex-none';
// The final three pictures add motion/texture, not extra feature information.
// Both SSR and the original Vue component publish this decorative fallback.
export const orbitDecorativeAlt='';
export const orbitDetailsMarkup='<summary>试试结构、动作与脚本的复用</summary><div class="duik-orbit-workbench" data-lenis-prevent>'+reuseMarkup+'</div>';
// The same order as content.mjs's five original orbit selections.
export const orbitDocumentation=Object.freeze([
  {label:'了解 OCO 结构复用',href:'/docs/guide/oco',icon:'oco'},
  {label:'了解动画库',href:'/docs/guide/animation/anim-library',icon:'library'},
  {label:'了解脚本库',href:'/docs/guide/tools/scripting/library',icon:'library'},
  {label:'了解工程笔记',href:'/docs/guide/notes',icon:'file'},
  {label:'了解工程自检',href:'/docs/guide/sanity',icon:'dusan-check'},
]);
export function orbitDocumentationFor(index=0){return orbitDocumentation[index]||orbitDocumentation[0];}
export function renderOrbitDocumentation(index=0){
  const doc=orbitDocumentationFor(index);
  return '<a class="duik-orbit-doc" data-duik-orbit-doc="" href="'+doc.href+'">'+doc.label+'</a>';
}
// One presentation contract for the initial swiper and the desktop selectors.
// The original SVG bytes remain canonical; the light theme colors their alpha.
export function orbitIconProps(index=0){
  const {icon}=orbitDocumentationFor(index);
  return {class:'duik-orbit-icon','aria-hidden':'true','data-duik-orbit-icon':icon,style:'--duik-orbit-icon:url(/duik-experience/icons/'+icon+'.svg);'};
}
export function renderOrbitIcon(index=0){
  const attrs=Object.entries(orbitIconProps(index)).map(([name,value])=>name+'="'+value+'"').join(' ');
  return '<span '+attrs+' data-v-775aae4b=""></span>';
}
export function wrapOrbitSSR(original){
  return '<section id="reuse" class="'+orbitClass+'">'+original+'<details class="duik-orbit-details">'+orbitDetailsMarkup+'</details></section>';
}
