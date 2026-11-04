/** One pure element tree for both the copied Vue runtime and its static SSR shell. */
import {characterScenes} from './scenes.mjs';

export const capabilityVisuals=[
  {name:'DuikStructureVisual',label:'从美术层到驱动结构',id:'structure',width:'57.25rem',figures:[
    {id:'layers',index:'01',title:'先整理独立图层',description:'头发、五官、身体与双臂'},
    {id:'controllers',index:'02',title:'再建立骨骼关系',description:'结构与操作分开，控制更清楚'}
  ]},
  {name:'DuikControlsVisual',label:'让控制关系看得见',id:'controls',width:'46.625rem',figures:[
    {id:'controllers',index:'01',title:'明确控制目标',description:'手部目标与肢体骨骼分开'},
    {id:'ik',alternate:'controllers',index:'02',title:'调整姿态',description:'悬停对照调整前后的姿态'}
  ]},
  {name:'DuikAnimationVisual',label:'从姿态走向表演',id:'animation',width:'46.625rem',figures:[
    {id:'animation',alternate:'assembled',index:'01',title:'组织关键姿势',description:'悬停对照同一角色的两个姿态'},
    {id:'expression',index:'02',title:'打磨表情与细节',description:'视线、表情与发梢共同参与表达',className:'duik-scene-detail'}
  ]}
];

const node=(tag,attrs,children)=>({tag,attrs,children});
function image(id,className='',extra={}){
  const scene=characterScenes[id];
  return node('img',{src:scene.src,alt:scene.alt,width:scene.width,height:scene.height,
    class:'duik-scene-image '+className,decoding:'async',loading:'eager',draggable:false,...extra});
}
function figure({id,index,title,description,alternate,className=''}){
  return node('figure',{class:'duik-scene-figure '+className,tabindex:alternate?0:undefined},[
    node('div',{class:'duik-scene-art'},[
      image(id,alternate?'duik-scene-default':''),
      ...(alternate?[image(alternate,'duik-scene-alternate',{'aria-hidden':'true'})]:[])
    ]),
    node('figcaption',{class:'duik-scene-caption'},[
      node('span',{class:'duik-scene-index'},index),
      node('span',{class:'duik-scene-caption-copy'},[
        node('strong',null,title),node('span',null,description)
      ])
    ])
  ]);
}

export function capabilityVisualTree(index){
  const definition=capabilityVisuals[index];
  if(!definition)throw Error('Unknown capability visual '+index);
  return node('div',{class:'duik-capability-visual','data-duik-capability-visual':definition.id,style:{width:definition.width}},[
    node('div',{class:'duik-visual-topline'},[
      node('span',{class:'duik-visual-label'},definition.label),
      node('span',{class:'duik-visual-note'},'真实角色分镜 · 非软件截图')
    ]),
    node('div',{class:'duik-capability-scenes'},definition.figures.map(figure)),
    node('div',{class:'duik-capability-footnote'},[
      node('span',{class:'duik-visual-origin'},'同一角色 / 26 张透明图层'),
      node('span',null,definition.id==='controls'?'IK · 目标 → 肢体联动':definition.id==='animation'?'姿态 · 表情 · 节奏':'美术层 → 骨骼 → 控制器')
    ])
  ]);
}
