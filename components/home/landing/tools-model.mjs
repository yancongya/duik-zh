// Deterministic webpage examples, not an After Effects execution engine.
export const TOOL_TABS=Object.freeze([
  {id:'layers',label:'图层',title:'图层再多，也能各就各位。',description:'整理名称、分组与侧别，让每一层都有清楚的身份。',docs:'/docs/guide/tools/layers'},
  {id:'text',label:'文本',title:'四个名字，一次理顺。',description:'画面不变，名字有序。换一个前缀，看看结果。',docs:'/docs/guide/tools/text/rename'},
  {id:'scripts',label:'脚本与表达式',title:'常用片段，随取随用。',description:'从收藏到编辑，保留可以再次使用的那一段。',docs:'/docs/guide/tools/scripting/library'},
  {id:'composition',label:'合成',title:'合成里的零碎操作，一起处理。',description:'裁剪多余空白，或集中调整合成设置。',docs:'/docs/guide/tools/composition/crop'},
]);
export const LOCKED_CHARACTER_SHA='fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a';
export const CROP_CANVAS=Object.freeze({width:640,height:400,x:60,y:40,reference:Object.freeze({x:320,y:200})});
export const INITIAL_MASK=Object.freeze({x:144,y:64,width:352,height:272});
export const CROP_INTRO_DURATION=2700;
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const TOOLS_PREVIEW_DURATION=3300;
export const SCENE_PARTS=Object.freeze([
  {id:'stem',label:'绿色形状',name:'形状 1 副本',color:'#72816a',dx:-64,dy:-12},
  {id:'circle',label:'橙色形状',name:'形状 2 副本',color:'#dc825b',dx:92,dy:50},
  {id:'title',label:'Duik 字样',name:'文本 1',color:'#2e443c',dx:-8,dy:132},
  {id:'dot',label:'黄色圆点',name:'形状 3 副本',color:'#e5b548',dx:128,dy:-18},
].map(Object.freeze));
// Authored naming fixtures, not image recognition or a port of Duik's parser.
// Group/side/type come from the Layer Manager documentation. Type is Art
// (Duik.Layer.Type.ART), not AE's separate shape/text layer classification.
// Source: RxLaboratory/Duik@718e6e282d1ae91dc9678bb1a202ce08e862a28d,
// src/Scripts/ScriptUI Panels/inc/api/layer.jsx. Display names are deliberately
// not presented as Duik's exact generated layer-name syntax.
export const LAYER_SCENE_RECORDS=Object.freeze([
  {id:'stem',sourceName:'Art_片头_L_绿色形状',name:'绿色形状',group:'片头',side:'左',type:'美术',labelX:174,labelY:72},
  {id:'circle',sourceName:'Art_片头_R_橙色形状',name:'橙色形状',group:'片头',side:'右',type:'美术',labelX:324,labelY:312},
  {id:'title',sourceName:'Art_片头_Duik',name:'Duik 字样',group:'片头',side:'无',type:'美术',labelX:218,labelY:153},
  {id:'dot',sourceName:'Art_片头_R_黄色圆点',name:'黄色圆点',group:'片头',side:'右',type:'美术',labelX:430,labelY:78,anchor:'end'},
].map(Object.freeze));
// Deterministic sampling for the shared stage. The mounted controller owns its
// visible automatic loop and yields to direct input; manual progress uses seek.
export function createToolsPreview(){return {phase:'idle',elapsed:0};}
export function advanceToolsPreview(state,event,{delta=0,progress=0,allowed=true}={}){
  if(event==='reset')return createToolsPreview();
  if(event==='seek')return {phase:'manual',elapsed:clamp(finite(progress,0),0,1)*TOOLS_PREVIEW_DURATION};
  if(event==='stop'||event==='takeover'||!allowed)return state.phase==='running'?{...state,phase:'paused'}:state;
  if(event==='play')return {phase:'running',elapsed:state.elapsed>=TOOLS_PREVIEW_DURATION?0:state.elapsed};
  if(event==='tick'&&state.phase==='running'){
    const elapsed=clamp(state.elapsed+Math.max(0,finite(delta,0)),0,TOOLS_PREVIEW_DURATION);
    return {phase:elapsed===TOOLS_PREVIEW_DURATION?'complete':'running',elapsed};
  }
  return state;
}
export function sampleToolsPreview(preview){
  const progress=clamp(finite(preview.elapsed,0)/TOOLS_PREVIEW_DURATION,0,1);
  const move=clamp((progress-.14)/.6,0,1),spread=1-Math.pow(1-move,3);
  return {progress,spread,step:progress<.14?'before':progress<.82?'working':'after',renamed:Math.min(4,Math.floor(clamp((progress-.18)/.64,0,1)*4)),used:progress>=.82};
}
export function sceneLayerRecords(preview){
  const {renamed}=sampleToolsPreview(preview);
  return LAYER_SCENE_RECORDS.map((record,index)=>({...record,tagged:index<renamed,displayName:index<renamed?record.name:record.sourceName}));
}
export function sceneNames(prefix='片头_'){return renameSamples(SCENE_PARTS,{prefix,start:1});}
export function createCropState(){return {mask:{...INITIAL_MASK},cropped:false};}
export function updateCropMask(state,patch){
  const old=state.mask;
  const x=Math.round(clamp(finite(patch.x,old.x),0,CROP_CANVAS.width-80));
  const y=Math.round(clamp(finite(patch.y,old.y),0,CROP_CANVAS.height-64));
  return {...state,mask:{x,y,width:Math.round(clamp(finite(patch.width,old.width),80,CROP_CANVAS.width-x)),height:Math.round(clamp(finite(patch.height,old.height),64,CROP_CANVAS.height-y))}};
}
export function dragCropCorner(state,corner,point){
  const m=state.mask,right=m.x+m.width,bottom=m.y+m.height;
  const x=finite(point.x,m.x),y=finite(point.y,m.y);
  const left=corner.includes('w')?clamp(x,0,right-80):m.x;
  const top=corner.includes('n')?clamp(y,0,bottom-64):m.y;
  const r=corner.includes('e')?clamp(x,left+80,CROP_CANVAS.width):right;
  const b=corner.includes('s')?clamp(y,top+64,CROP_CANVAS.height):bottom;
  return updateCropMask(state,{x:left,y:top,width:r-left,height:b-top});
}
export function cropGeometry(state){
  const bounds=state.cropped?{...state.mask}:{x:0,y:0,width:CROP_CANVAS.width,height:CROP_CANVAS.height};
  return {bounds,childOrigin:{x:CROP_CANVAS.x+bounds.x,y:CROP_CANVAS.y+bounds.y},contentOffset:{x:-bounds.x,y:-bounds.y},reference:{x:CROP_CANVAS.x+CROP_CANVAS.reference.x,y:CROP_CANVAS.y+CROP_CANVAS.reference.y},areaSaved:1-bounds.width*bounds.height/(CROP_CANVAS.width*CROP_CANVAS.height)};
}
// The explanatory entrance can run only once per mount. Pointer/focus/keyboard
// takeover is terminal; reset changes the model, never silently replays a tour.
export function createCropIntro({reducedMotion=false}={}){return {phase:reducedMotion?'skipped':'idle',elapsed:0};}
export function advanceCropIntro(state,event,delta=0){
  if(['complete','taken-over','skipped'].includes(state.phase))return state;
  if(event==='takeover'||event==='skip')return {...state,phase:event==='skip'?'skipped':'taken-over'};
  if(event==='start'&&state.phase==='idle')return {...state,phase:'running'};
  if(event==='pause'&&state.phase==='running')return {...state,phase:'paused'};
  if(event==='resume'&&state.phase==='paused')return {...state,phase:'running'};
  if(event==='tick'&&state.phase==='running'){
    const elapsed=clamp(state.elapsed+Math.max(0,finite(delta,0)),0,CROP_INTRO_DURATION);
    return {phase:elapsed===CROP_INTRO_DURATION?'complete':'running',elapsed};
  }
  return state;
}
export function sampleCropIntro(elapsed){
  const time=clamp(finite(elapsed,0),0,CROP_INTRO_DURATION);
  const progress=clamp((time-450)/1050,0,1),ease=1-Math.pow(1-progress,3);
  const state=updateCropMask(createCropState(),{width:INITIAL_MASK.width-48*ease,height:INITIAL_MASK.height-28*ease});
  return {...state,cropped:time>=1950};
}
export const TEXT_SAMPLES=Object.freeze([
  {id:'sample-1',name:'角色_左上臂',expression:'thisComp.layer("角色_左上臂").transform.position',source:'角色向左挥手'},
  {id:'sample-2',name:'角色_左前臂',expression:'thisComp.layer("角色_左前臂").transform.rotation',source:'角色转向观众'},
  {id:'sample-3',name:'角色_右上臂',expression:'thisComp.layer("角色_右上臂").transform.position',source:'角色准备登场'},
  {id:'sample-4',name:'角色_右前臂',expression:'thisComp.layer("角色_右前臂").transform.rotation',source:'角色结束动作'},
].map(Object.freeze));
export const freshTextSamples=()=>TEXT_SAMPLES.map(row=>({...row}));
export function renameSamples(rows,{prefix='镜头A_',start=1}={}){
  const first=clamp(Math.trunc(finite(start,1)),0,9999);
  return rows.map((row,index)=>({...row,name:String(prefix)+String(first+index).padStart(2,'0')}));
}
export function replaceSamples(rows,{find='',replacement='',scope='name'}={}){
  if(!['name','expression','source'].includes(scope))throw Error('Unknown text scope');
  if(!find)return rows.map(row=>({...row}));
  return rows.map(row=>({...row,[scope]:row[scope].split(String(find)).join(String(replacement))}));
}
export function changedSampleCount(before,after,scope){return after.filter((row,index)=>row[scope]!==before[index]?.[scope]).length;}
export function filterParts(parts,query='',group='all'){
  const needle=String(query).trim().toLocaleLowerCase();
  return parts.filter(p=>(group==='all'||p.group===group)&&(!needle||[p.id,p.label,p.group].join(' ').toLocaleLowerCase().includes(needle)));
}
export const SCRIPT_TASKS=Object.freeze([
  {id:'library',label:'脚本库',description:'搜索、分类和访问常用脚本。此处仅编辑网页示例，不扫描本机脚本。',docs:'/docs/guide/tools/scripting/library',source:'网页原创注释模板',code:'// 任务：整理常用脚本\n// 在 Duik 脚本库中管理分类与收藏。\n// 这是网页编辑示例，不会读取或执行本机脚本。'},
  {id:'editor',label:'脚本编辑器',description:'真实 API 调用片段。先在 AE 中初始化 Duik API，再选择需要绑定的手臂骨骼。',docs:'/docs/guide/tools/scripting/script-editor',source:'Duik API 功能文档：Duik.Rig.arm()',code:'// AE ExtendScript；需先初始化 Duik API。\n// 在 AE 中准备并选择手臂骨骼。\nDuik.Rig.arm();'},
  {id:'expression',label:'编辑表达式',description:'表达式文本示例：保留当前属性值。可以编辑、复制，但网页不会应用到 AE 属性。',docs:'/docs/guide/tools/scripting/edit-expression',source:'网页原创表达式示例',code:'// AE 属性表达式示例：保持当前属性值。\nvalue;'},
  {id:'scriptify',label:'脚本化表达式',description:'把表达式转为脚本的实际操作请阅读文档。此处仅提供原始表达式编辑与复制。',docs:'/docs/guide/tools/scripting/scriptify-expression',source:'网页原创表达式示例；未转换为脚本',code:'// 待处理的原始表达式；未进行脚本化。\nvalue;'},
].map(Object.freeze));
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
