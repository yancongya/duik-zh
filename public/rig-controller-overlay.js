/** Reference-style SVG controllers; renderer geometry is separate from the character. */
const NS='http://www.w3.org/2000/svg';
export const CONTROLLER_STYLE={id:'reference-duik-2d',version:1,endpoint:'#ed0025',left:'#b65363',right:'#5594ad',hair:'#9471bc',ring:'#b83c7a',gaze:'#78977a',stage:'#faebc6',lineWidth:.9};
export function renderControllers({root,rig,pose,arms,matrices,point,hairOffset,showLabels=false}){
  const color=CONTROLLER_STYLE, sx=rig.canvas[0]/1312;
  const create=(tag,attrs,parent=root)=>{const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));parent.append(e);return e;};
  const line=(d,c,opacity=1,parent=root)=>create('path',{d,fill:'none',stroke:c,'stroke-width':color.lineWidth,'vector-effect':'non-scaling-stroke',opacity},parent);
  const joint=(p,c='#6d6c58')=>{create('circle',{cx:p[0],cy:p[1],r:5*sx,fill:'#fff9de',stroke:c,'stroke-width':.75,'vector-effect':'non-scaling-stroke'});create('circle',{cx:p[0],cy:p[1],r:1.5*sx,fill:c});};
  const cone=(a,b,c,width=16)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/d*width*sx,ny=(b[0]-a[0])/d*width*sx;create('path',{d:'M'+(a[0]+nx)+','+(a[1]+ny)+'L'+b+'L'+(a[0]-nx)+','+(a[1]-ny)+'Z',fill:c,opacity:.48,'data-bone-cone':''});line('M'+a+'L'+b,c,.38);joint(a);joint(b);};
  const control=(name,p,label,shape,c=color.ring)=>{const g=create('g',{'class':'handle reference-control','data-control':name,'data-shape':shape,transform:'translate('+p.join(' ')+') scale('+sx+')',tabindex:0,role:'slider','aria-label':label,'aria-valuetext':label});create('title',{},g).textContent=label;create('circle',{r:38,fill:'transparent','class':'hit-target'},g);
    if(shape==='square'){create('circle',{r:27,fill:'none',stroke:'#fffdf1','stroke-width':.9,'vector-effect':'non-scaling-stroke'},g);create('rect',{x:-10,y:-10,width:20,height:20,fill:color.endpoint,'data-solid-endpoint':''},g);}
    else if(shape==='eye'){line('M-26 0Q0-22 26 0Q0 22-26 0 M-16-23L0-33L16-23 M-16 23L0 33L16 23',c,1,g);create('circle',{r:8,fill:c},g);}
    else if(shape==='horizontal'){line('M-34 0H34 M-22-12L-34 0L-22 12 M22-12L34 0L22 12',c,1,g);}
    else if(shape==='move'){line('M-25 0H25 M0-25V25 M-15-8L-25 0L-15 8 M15-8L25 0L15 8 M-8-15L0-25L8-15 M-8 15L0 25L8 15 M-15-15L15-15L15 15L-15 15Z',c,1,g);}
    else {const r=shape==='target'?21:14;create('circle',{r,fill:'none',stroke:c,'stroke-width':.9,'vector-effect':'non-scaling-stroke'},g);if(shape==='target')create('circle',{r:12,fill:'none',stroke:c,'stroke-width':.85,'vector-effect':'non-scaling-stroke'},g);line('M-8 0H8 M0-8V8 M0-'+(r+6)+'L-4-'+(r-1)+'H4Z',c,1,g);}
    const text=create('text',{x:35,y:5,'class':showLabels?'controller-label':'controller-label on-hover'},g);text.textContent=label;return g;};
  root.dataset.controllerStyle=color.id;
  for(const side of ['r','l']){const a=arms[side],c=side==='r'?color.left:color.right;cone(a.shoulder,a.elbow,c);cone(a.elbow,a.wrist,c,13);control(side==='l'?'handL':'handR',a.wrist,side==='l'?'左手 IK':'右手 IK','square');}
  const rootPos=point(matrices[0],rig.joints.root),neck=point(matrices[2],rig.joints.neck),head=point(matrices[3],rig.joints.head);
  cone(rootPos,neck,color.left,18);cone(neck,head,color.ring,11);
  control('root',rootPos,'腰部平移','circle');control('body',neck,'上身倾斜','target');control('head',head,'头部倾斜','target');
  const profile=rig.controllers||{};
  for(const side of ['r','l']){const part=rig.parts.find(x=>x.id==='hair-side-'+side),b=part.visualBBox||part.bbox;const tip=profile['hairTip'+side.toUpperCase()]||[(b[0]+b[2])/2,b[3]-18*sx],offset=hairOffset(tip,pose),m=matrices[3],end=point(m,[tip[0]+offset[0],tip[1]+offset[1]]);cone(point(m,part.pivot),end,color.hair,12);control(side==='r'?'hairR':'hairL',end,'发束 '+(side==='r'?'右':'左'),'square');}
  for(const side of ['r','l']){const p=rig.parts.find(x=>x.id==='iris-'+side).pivot,q=point(matrices[3],p);create('circle',{cx:q[0],cy:q[1],r:24*sx,fill:color.gaze,'fill-opacity':.12,stroke:color.gaze,'stroke-width':.8,'vector-effect':'non-scaling-stroke','data-gaze-ring':''});}
  const mouth=rig.parts.find(x=>x.id==='mouth').pivot;
  control('smile',point(matrices[3],[mouth[0]+95*sx,mouth[1]+12*sx]),'表情 / 微笑','circle');
  const at=(id,fallback)=>profile[id]||fallback.map(v=>v*sx);
  control('direction',at('direction',[75,55]),'头部方向','horizontal');
  control('gaze',at('gaze',[75,350]),'视线（横向） / 闭眼（纵向）','eye',color.gaze);
  const global=at('globalMove',[75,1090]);line('M'+(global[0]-65*sx)+','+(global[1]-100*sx)+'h165v150',color.ring,.85);control('globalMove',global,'整体平移','move',color.gaze);control('bodyGlobal',at('bodyGlobal',[75,950]),'整体倾斜','circle');
}
