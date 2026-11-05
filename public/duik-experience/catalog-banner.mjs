import {panels} from './tool-catalog.mjs';

// Panoramic counterparts to the local wall's original geometry. These are
// explanatory drawings, not screenshots, AE output or a newly generated rig.
const P={paper:'#f3f1e8',chalk:'#fbfaf5',olive:'#798569',forest:'#374a3b',orange:'#bd582f',sand:'#dfbb81',sage:'#c1c8af'};
const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const rect=(x,y,w,h,fill,r=0,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const line=(d,color=P.forest,width=3,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const diamond=(x,y,r,fill)=>`<path d="M${x} ${y-r}l${r} ${r}-${r} ${r}-${r}-${r}Z" fill="${fill}"/>`;
const joint=(x,y)=>circle(x,y,13,P.chalk)+circle(x,y,5,P.orange);
const bone=(length,fill)=>`<path d="M0 -7L${length} -15V15L0 7Z" fill="${fill}"/>`+joint(0,0)+joint(length,0);
const moving=(id,body)=>`<g data-catalog-motion="${id}">${body}</g>`;
const out='cubic-bezier(.23,1,.32,1)',inOut='cubic-bezier(.77,0,.175,1)';
const transforms=(...values)=>values.map(transform=>({transform}));
const motion=(id,keyframes,duration=6000,easing=inOut,delay=0)=>({id,keyframes,duration,easing,delay});
const base=rect(0,0,1200,300,P.paper)+line('M48 258H1152',P.sage,1);

function bones(){
  const segments=[['upper',-15,P.forest,260],['middle',27,P.olive,250],['tip',-20,P.orange,220]];
  const limb=(i)=>{const [id,angle,color,length]=segments[i];return `<g transform="rotate(${angle})">${moving(id,bone(length,color)+(i<2?`<g transform="translate(${length} 0)">${limb(i+1)}</g>`:''))}</g>`;};
  return {label:'骨骼：相连的关节组成一条可活动的结构。',body:base+line('M110 186Q550 18 1080 172',P.sage,1,'stroke-dasharray="4 10"')+`<g transform="translate(230 168)">${limb(0)}</g>`+circle(230,168,31,'none',`stroke="${P.olive}" stroke-width="1"`),motions:[motion('upper',transforms('rotate(0deg)','rotate(-9deg)','rotate(0deg)'),7000),motion('middle',transforms('rotate(0deg)','rotate(22deg)','rotate(0deg)'),7000),motion('tip',transforms('rotate(0deg)','rotate(-16deg)','rotate(0deg)'),7000)]};
}
function constraints(){
  let body=base+line('M120 56H1080',P.forest,5);const motions=[];
  for(let i=0;i<4;i++){
    const id='weight-'+i,angle=i%2?'-18deg':'18deg';
    body+=`<g transform="translate(${240+i*240} 56)">${moving(id,line('M0 0V140',P.olive,2)+circle(0,166,34,i%2?P.orange:P.forest))}${joint(0,0)}</g>`;
    motions.push(motion(id,transforms('rotate(0deg)',`rotate(${angle})`,'rotate(0deg)'),5600,inOut,-i*360));
  }
  return {label:'链接与约束：一组相连的悬挂物沿共同关系摆动。',body,motions};
}
function controllers(){
  const core=bone(225,P.forest)+`<g transform="translate(225 0) rotate(-35)">${moving('forearm',bone(220,P.orange)+rect(200,-20,40,40,'none',2,`stroke="${P.orange}" stroke-width="2"`))}</g>`;
  return {label:'控制器：末端目标带动相连的关节，复杂结构收拢为清晰控件。',body:base+circle(600,150,98,'none',`stroke="${P.sage}" stroke-width="30"`)+line('M118 150H1082',P.sage,1,'stroke-dasharray="5 12"')+`<g transform="translate(358 182)">${moving('arm',core)}</g>`+moving('target',circle(915,123,35,'none',`stroke="${P.orange}" stroke-width="2"`)+line('M865 123h22m56 0h22m-50-50v22m0 56v22',P.orange,2)),motions:[motion('arm',transforms('rotate(0deg)','rotate(-12deg)','rotate(0deg)'),6800),motion('forearm',transforms('rotate(0deg)','rotate(24deg)','rotate(0deg)'),6800),motion('target',[{opacity:.4},{opacity:1},{opacity:.4}],6800)]};
}
function automation(){
  const wave=Array.from({length:85},(_,i)=>`${i?'L':'M'}${48+i*13.2} ${154+Math.sin(i*.32)*32+Math.sin(i*.7)*11}`).join('');
  return {label:'自动化：同一组规则持续驱动位置、旋转与大小。',body:base+line(wave,P.sage,2)+`<g transform="translate(280 150)">${moving('position',circle(0,0,61,P.forest)+circle(0,0,20,P.sand))}</g><g transform="translate(600 150)">${moving('rotation',rect(-54,-54,108,108,P.orange,6)+circle(0,0,21,P.chalk))}</g><g transform="translate(920 150)">${moving('scale',diamond(0,0,72,P.olive)+diamond(0,0,25,P.paper))}</g>`,motions:[motion('position',transforms('translateY(0px)','translateY(-36px)','translateY(22px)','translateY(0px)'),4800),motion('rotation',transforms('rotate(0deg)','rotate(24deg)','rotate(-18deg)','rotate(0deg)'),4800),motion('scale',transforms('scale(1)','scale(1.18)','scale(.84)','scale(1)'),4800)]};
}
function animation(){
  // Samples are points on this exact cubic, not unrelated transform guesses.
  const frames=[];for(let i=0;i<=20;i++){const t=i/20,u=1-t;const x=80*u*u*u+390*3*u*u*t+820*3*u*t*t+1120*t*t*t;const y=224*u*u*u+224*3*u*u*t+66*3*u*t*t+66*t*t*t;frames.push({transform:`translate(${x}px,${y}px)`});}
  const roundTrip=[...frames,...frames.slice(0,-1).reverse()];
  let body=base+line('M80 224C390 224 820 66 1120 66',P.forest,3)+line('M80 224H260M940 66H1120',P.olive,1)+[80,340,600,860,1120].map(x=>diamond(x,270,5,P.olive)).join('');
  const motions=[];for(let i=3;i>=0;i--){const id='traveller-'+i;body+=moving(id,circle(0,0,i?12-i:23,i?P.sage:P.orange));motions.push(motion(id,roundTrip,7000,inOut,-i*150));}
  return {label:'动画：物体沿同一条路径缓入缓出，间距显示动作的节奏。',body,motions};
}
function camera(){
  const body=rect(0,0,1200,300,P.sage)+moving('far',circle(936,84,58,P.sand)+rect(-60,146,330,180,P.paper,140)+rect(318,78,252,300,P.paper,126)+rect(685,116,258,300,P.paper,129))+moving('middle',rect(252,148,158,225,P.olive,79)+rect(720,117,152,270,P.orange,76))+moving('near',rect(-80,251,1360,95,P.forest)+circle(85,264,100,P.forest)+circle(1110,276,125,P.forest))+line('M86 70V38H126M1074 38H1114V70M1114 230V262H1074M126 262H86V230',P.chalk,3);
  return {label:'摄像机：远近景层以不同速度移动，平面画面产生纵深。',body,motions:[motion('far',transforms('translateX(-8px)','translateX(8px)','translateX(-8px)'),8000),motion('middle',transforms('translateX(-25px)','translateX(25px)','translateX(-25px)'),8000),motion('near',transforms('translateX(-54px)','translateX(54px)','translateX(-54px)'),8000)]};
}
function toolsScene(){
  let body=base+line('M132 112H1068M132 208H1068',P.sage,1,'stroke-dasharray="3 9"');const motions=[];
  const colors=[P.forest,P.olive,P.orange,P.olive,P.forest];
  for(let i=0;i<5;i++){
    const id='sheet-'+i,dy=[-27,21,-36,30,-18][i],angle=[-9,5,-6,8,-4][i];
    body+=`<g transform="translate(${200+i*200} 148)">${moving(id,rect(-55,-74,110,148,colors[i],8)+line('M-31 -47H31',P.chalk,2)+circle(0,10,26,P.sand)+line('M-31 54H16',P.chalk,2))}</g>`;
    motions.push(motion(id,transforms(`translateY(${dy}px) rotate(${angle}deg)`,'translateY(0px) rotate(0deg)','translateY(0px) rotate(0deg)',`translateY(${dy}px) rotate(${angle}deg)`),6500,out,-i*120));
  }
  return {label:'通用工具：分散的图层整理为有序排列，便于继续修改。',body,motions};
}
function command(){
  const glyphs=[circle(0,0,28,P.forest),diamond(0,0,35,P.olive),rect(-25,-25,50,50,P.orange,5),line('M-22 -28L-43 0l21 28m44-56 21 28-21 28',P.forest,8),circle(0,0,28,'none',`stroke="${P.orange}" stroke-width="12"`)];
  let body=base+line('M130 150H1070',P.sage,1);glyphs.forEach((glyph,i)=>body+=`<g transform="translate(${200+i*200} 150)">${glyph}</g>`);
  body+=moving('selection',rect(137,87,126,126,'none',12,`stroke="${P.orange}" stroke-width="3"`)+line('M200 226v15',P.orange,2));
  return {label:'命令行：从功能中定位所需工具，选择框依次找到匹配项。',body,motions:[motion('selection',transforms('translateX(0px)','translateX(400px)','translateX(800px)','translateX(400px)','translateX(0px)'),7000)]};
}
function all(){
  return {label:'八个主面板：骨骼、约束、控制器、自动化、动画、摄像机、通用工具与命令行。',body:base+line('M103 148H1097',P.olive,2)+panels.map((panel,i)=>`<g transform="translate(${110+i*140} 150)">${circle(0,0,39,P.chalk)}<image href="/duik-experience/icons/${panel.icon}.svg" x="-18" y="-18" width="36" height="36"/></g>`).join('')+moving('route',circle(110,225,6,P.orange)),motions:[motion('route',transforms('translateX(0px)','translateX(980px)','translateX(0px)'),9000)]};
}

const scenes=Object.freeze({bones:bones(),constraints:constraints(),controllers:controllers(),automation:automation(),animation:animation(),camera:camera(),tools:toolsScene(),command:command(),all:all()});
export const catalogBannerKeys=Object.freeze(Object.keys(scenes));
export const catalogBannerLabels=Object.freeze(Object.fromEntries(Object.entries(scenes).map(([id,scene])=>[id,scene.label])));
const valid=id=>Object.hasOwn(scenes,id)?id:'all';
export function catalogBannerMarkup(initial='bones'){
  const selected=valid(initial);
  const poster=scene=>scene.motions.reduce((body,item)=>{
    const style=Object.entries(item.keyframes[0]).map(([name,value])=>`${name}:${value}`).join(';');
    return body.replace(`<g data-catalog-motion="${item.id}">`,`<g data-catalog-motion="${item.id}" style="${style}">`);
  },scene.body);
  return `<figure class="duik-catalog-banner" data-catalog-banner data-catalog-banner-active="${selected}" data-catalog-banner-playback="poster"><svg viewBox="0 0 1200 300" width="1200" height="300" role="img" aria-label="${scenes[selected].label}" data-catalog-banner-svg>${Object.entries(scenes).map(([id,scene])=>`<g data-catalog-banner-scene="${id}"${id===selected?'':' hidden'}>${poster(scene)}</g>`).join('')}</svg><figcaption>网页功能示意</figcaption></figure>`;
}

const mounts=new WeakMap();
export function mountCatalogBanner(host){
  const root=host?.matches?.('[data-catalog-banner]')?host:host?.querySelector?.('[data-catalog-banner]');
  if(!root)return {select(){},destroy(){}};
  if(mounts.has(root))return mounts.get(root);
  const doc=root.ownerDocument,view=doc.defaultView,svg=root.querySelector('[data-catalog-banner-svg]');
  const groups=[...root.querySelectorAll('[data-catalog-banner-scene]')];
  const preference=view?.matchMedia?.('(prefers-reduced-motion: reduce)');
  let selected,animations=[],disposed=false,suspended=false,visible=false;
  const viewportVisible=()=>{
    if(root.isConnected===false)return false;
    const box=root.getBoundingClientRect();
    if(!box.width||!box.height)return false;
    const width=Math.max(0,Math.min(box.right,view.innerWidth)-Math.max(0,box.left));
    const height=Math.max(0,Math.min(box.bottom,view.innerHeight)-Math.max(0,box.top));
    return width*height/(box.width*box.height)>=.65;
  };
  function sync(){
    if(disposed)return;
    const running=visible&&!suspended&&!doc.hidden&&!preference?.matches&&root.isConnected!==false;
    root.dataset.catalogBannerPlayback=running&&animations.length?'playing':'poster';
    for(const animation of animations){
      if(running)animation.play();
      else{animation.pause();if(preference?.matches)animation.currentTime=0;}
    }
  }
  function select(id){
    if(disposed)return;
    const next=valid(id);
    if(next===selected){sync();return;}
    for(const animation of animations)animation.cancel();animations=[];selected=next;
    root.dataset.catalogBannerActive=next;svg.setAttribute('aria-label',scenes[next].label);
    for(const group of groups)group.toggleAttribute('hidden',group.dataset.catalogBannerScene!==next);
    const group=groups.find(item=>item.dataset.catalogBannerScene===next);
    try{for(const item of scenes[next].motions){
      const target=group?.querySelector(`[data-catalog-motion="${item.id}"]`);
      if(!target?.animate)continue;
      const animation=target.animate(item.keyframes,{duration:item.duration,easing:item.easing,delay:item.delay,iterations:Infinity,fill:'both'});
      animation.pause();animations.push(animation);
    }}catch{for(const animation of animations)animation.cancel();animations=[];}
    sync();
  }
  const observer=typeof view?.IntersectionObserver==='function'?new view.IntersectionObserver(entries=>{
    if(disposed||suspended)return;
    const current=entries.filter(entry=>entry.target===root).at(-1);if(!current)return;
    // A queued entry can predate BFCache restore or a category change. Measure
    // the current stable banner box, rather than applying stale entry geometry.
    visible=viewportVisible();sync();
  },{threshold:[0,.65,1]}):null;
  const measure=()=>{if(disposed)return;visible=viewportVisible();sync();};
  const hide=event=>{if(event.persisted){suspended=true;sync();}else destroy();};
  const show=()=>{if(disposed)return;suspended=false;measure();};
  const visibility=()=>{if(!doc.hidden)visible=viewportVisible();sync();};
  function destroy(){
    if(disposed)return;disposed=true;observer?.disconnect();
    for(const animation of animations)animation.cancel();animations=[];
    doc.removeEventListener('visibilitychange',visibility);view?.removeEventListener('resize',measure);view?.removeEventListener('pagehide',hide);view?.removeEventListener('pageshow',show);if(!observer)view?.removeEventListener('scroll',measure);preference?.removeEventListener('change',measure);
    root.dataset.catalogBannerPlayback='poster';
    if(mounts.get(root)===api)mounts.delete(root);
  }
  const api={select,destroy};mounts.set(root,api);
  visible=viewportVisible();select(root.dataset.catalogBannerActive||'bones');observer?.observe(root);
  doc.addEventListener('visibilitychange',visibility);view?.addEventListener('resize',measure,{passive:true});view?.addEventListener('pagehide',hide);view?.addEventListener('pageshow',show);if(!observer)view?.addEventListener('scroll',measure,{passive:true});preference?.addEventListener('change',measure);
  return api;
}
