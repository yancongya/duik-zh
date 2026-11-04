/** Presentation-only helpers. Images come from the approved local 26-layer rig. */
import {a as element} from '../_nuxt/entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
import {characterScenes} from './scenes.mjs';

export {element,characterScenes};

export function ensureVisualStyles(){
  if(typeof document==='undefined'||document.querySelector('link[data-duik-visual-styles]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='/duik-landing-visuals/visual-scenes.css';
  link.dataset.duikVisualStyles='';document.head.append(link);
}

export function sceneImage(id,className='',extra={}){
  const scene=characterScenes[id];
  return element('img',{src:scene.src,alt:scene.alt,width:scene.width,height:scene.height,
    class:'duik-scene-image '+className,decoding:'async',loading:'eager',draggable:false,...extra});
}

export function sceneCaption(index,title,description){
  return element('figcaption',{class:'duik-scene-caption'},[
    element('span',{class:'duik-scene-index'},index),
    element('span',{class:'duik-scene-caption-copy'},[
      element('strong',null,title),element('span',null,description)
    ])
  ]);
}

export function sceneFigure({id,index,title,description,alternate,className=''}){
  return element('figure',{class:'duik-scene-figure '+className,tabindex:alternate?0:undefined},[
    element('div',{class:'duik-scene-art'},[
      sceneImage(id,alternate?'duik-scene-default':''),
      ...(alternate?[sceneImage(alternate,'duik-scene-alternate',{'aria-hidden':'true'})]:[])
    ]),sceneCaption(index,title,description)
  ]);
}
