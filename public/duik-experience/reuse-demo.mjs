// Product explanation, not an emulated AE panel: screenshots are the actual
// upstream interfaces, copied by the shared publisher with source attribution.
// No browser work runs at import time. SSR and client consume the same markup.
export const REUSE_LIBRARIES = Object.freeze([
  {
    id:'structure',label:'结构',name:'OCO 元绑定库',purpose:'保存可再次调整的骨骼结构。',
    image:'/duik-experience/official/duik/oco/oco_panel.png',
    sourcePath:'src-docs/docs/img/duik/oco/oco_panel.png',
    docs:'/docs/guide/oco',alt:'Duik 官方文档中的 OCO 元绑定库面板，含元绑定分类和创建选项入口',
    outcome:'骨骼结构与层级',caution:'元绑定是起点。适配新角色时，仍要调整比例和关节位置。',
    steps:[
      {label:'选择元绑定',title:'从合适的结构开始。',body:'在 OCO 面板里浏览动物类别，或用顶部搜索框筛选元绑定。预定义骨架帮助你搭起角色结构，不替代角色美术。',detail:'在 AE 中：选择类别与元绑定。',docs:'/docs/guide/oco'},
      {label:'创建与调整',title:'先有骨架，再贴合角色。',body:'双击元绑定，或点击应用按钮创建骨架。Shift + 点击可设置骨骼类型、包络、面条骨，以及是否新建合成。',detail:'在 AE 中：调整比例，再使用自动绑定。',docs:'/docs/guide/bones/autorig'},
      {label:'收进自己的库',title:'把结构留给下一次。',body:'包含 Duik 骨骼的合成可以成为新的 OCO 元绑定。通过库管理按钮收集骨骼信息，补充名称与图标后留作复用。',detail:'OCO 文件由 Duik 在本地创建。',docs:'/docs/guide/oco'},
    ],
  },
  {
    id:'animation',label:'动作',name:'动画库',purpose:'分类、收藏和应用动画片段。',
    image:'/duik-experience/official/duik/animation/anim-library.png',
    sourcePath:'src-docs/docs/img/duik/animation/anim-library.png',
    docs:'/docs/guide/animation/anim-library',alt:'Duik 官方文档中的动画库面板，含动画条目、搜索和库管理按钮',
    outcome:'有时间信息的动画片段',caution:'换角色时检查比例和空间数值；不要把单张网页姿态当作动画库文件。',
    steps:[
      {label:'选接收图层',title:'先确定动作交给谁。',body:'在 After Effects 中选择接收动画的图层，并把时间指针放到合适的位置。动画复用需要目标与时间，不只是换一张缩略图。',detail:'在 AE 中：选图层，设定当前时间。',docs:'/docs/guide/animation/anim-library'},
      {label:'查找动作片段',title:'找到已经调好的节奏。',body:'在动画库里搜索动画、浏览分类或查看收藏。每个条目有自己的缩略图，便于在工作中识别与整理。',detail:'库分类与磁盘文件夹层级相对应。',docs:'/docs/guide/animation/anim-library'},
      {label:'应用与微调',title:'接着用，也接着调整。',body:'选中片段并点击应用。Shift + 点击可选择属性类型、绝对值或偏移，以及时间反转等选项；跨角色时继续校准空间数值。',detail:'网页不导出或写入 Duik 动画文件。',docs:'/docs/guide/animation/anim-library'},
    ],
  },
  {
    id:'scripts',label:'脚本',name:'脚本库',purpose:'给常用脚本一个清晰的入口。',
    image:'/duik-experience/official/duik/tools/script-lib.png',
    sourcePath:'src-docs/docs/img/duik/tools/script-lib.png',
    docs:'/docs/guide/tools/scripting/library',alt:'Duik 官方文档中的脚本库面板，含脚本分类、脚本条目以及运行和编辑入口',
    outcome:'脚本入口、分类与收藏',caution:'网页只解释界面。脚本文件、编辑器和运行环境都在你的 After Effects 工作流中。',
    steps:[
      {label:'按用途查找',title:'常用工具，有处可找。',body:'在脚本库顶部搜索脚本，或浏览已有分类。预定义分类对应 After Effects 的系统脚本位置，也可以添加自己的分类。',detail:'在 AE 中：搜索、分类或收藏脚本。',docs:'/docs/guide/tools/scripting/library'},
      {label:'先查看与编辑',title:'先读清楚，再运行。',body:'选中条目后点击编辑，用系统默认编辑器查看脚本。Alt + 点击可在 Duik 内置的简易编辑器中快速修改小脚本。',detail:'先确认脚本来源、用途与适用环境。',docs:'/docs/guide/tools/scripting/script-editor'},
      {label:'回到 AE 使用',title:'在真实工程里执行。',body:'在 Duik 中双击脚本，或选中后点击运行。可停靠脚本会以面板形式启动；网页不会代替 AE 运行脚本或修改工程。',detail:'从库中移除条目，不等于删除磁盘文件。',docs:'/docs/guide/tools/scripting/library'},
    ],
  },
]);

const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function getReuseStep(libraryId,step=0){
  const library=REUSE_LIBRARIES.find(item=>item.id===libraryId);
  if(!library)throw new TypeError('Unknown reuse library: '+libraryId);
  if(!Number.isInteger(step)||step<0||step>=library.steps.length)throw new RangeError('Invalid reuse step: '+step);
  return {...library.steps[step],libraryId,index:step};
}

// Spatial reference: Linearity's input/result stage. Interaction reference:
// VoiceStudio's selected sample and offscreen lifecycle. These are structural
// references, not copied implementations. All samples stay in this page's memory.
// Character images are captures of the approved, unchanged 26-layer rig.
const assetRoot='/duik-landing-assets/';
const sampleData={
  structure:[
    {id:'upper-body',label:'上半身结构',kind:'绑定视图',image:assetRoot+'bones-controls.webp',alt:'已确认角色的真实骨骼与控制器渲染',note:'保留结构视图，回到新任务时继续调整。'},
    {id:'separated-art',label:'分层关系',kind:'拆层视图',image:assetRoot+'layers-exploded.webp',alt:'已确认角色的 26 张透明图层拆开展示',note:'保留图层关系，先看清每个部件的位置。'},
  ],
  animation:[
    {id:'greeting',label:'抬手分镜',kind:'三帧示例',image:assetRoot+'animation-pose.webp',alt:'同一角色的真实抬手绑定姿态',frames:[assetRoot+'character-rest.webp',assetRoot+'animation-pose.webp',assetRoot+'character-rest.webp'],note:'保存的是本页分镜序列，不是 Duik 动画文件。'},
    {id:'reach',label:'手臂分镜',kind:'三帧示例',image:assetRoot+'ik-pose.webp',alt:'同一角色的真实双臂 IK 姿态',frames:[assetRoot+'character-rest.webp',assetRoot+'ik-pose.webp',assetRoot+'character-rest.webp'],note:'使用真实绑定静帧说明动作复用，不模拟官方插值。'},
  ],
  scripts:[
    {id:'arm-call',label:'手臂绑定片段',kind:'ExtendScript',code:'// 先在 AE 中初始化 Duik API，\n// 再选择符合手臂结构的骨骼。\nDuik.Rig.arm();',call:'Duik.Rig.arm();',docs:'/docs/advanced/api/duik-features',note:'只取出代码片段；需要初始化 API 并在 AE 中运行。'},
    {id:'wiggle-call',label:'属性抖动片段',kind:'ExtendScript',code:'// 先在 AE 中初始化 Duik API，\n// 再选择需要添加抖动的属性。\nDuik.Automation.wiggle();',call:'Duik.Automation.wiggle();',docs:'/docs/advanced/api/duik-features',note:'网页不执行脚本，也不会修改 AE 工程。'},
  ],
};
export const REUSE_SAMPLES=Object.freeze(Object.fromEntries(Object.entries(sampleData).map(([id,samples])=>[id,Object.freeze(samples.map(sample=>Object.freeze({...sample,...(sample.frames?{frames:Object.freeze(sample.frames)}:{})})))])));
const findSample=(library,id)=>{const sample=REUSE_SAMPLES[library]?.find(item=>item.id===id);if(!sample)throw new TypeError('Unknown reuse sample: '+library+'/'+id);return sample;};
export function createReuseState(){
  return {active:'structure',libraries:Object.fromEntries(Object.entries(REUSE_SAMPLES).map(([id,samples])=>[id,{selected:samples[0].id,frame:0,saved:[],applied:null,phase:'preview'}]))};
}
// Manual controls and the untouched automatic demo share immutable transitions.
// Saving never creates OCO, duio or JSX files; retrieving never executes a script.
export function updateReuseState(state,action){
  if(action.type==='reset')return createReuseState();
  const id=action.library||state.active,current=state.libraries[id];
  if(!current)throw new TypeError('Unknown reuse library: '+id);
  if(action.type==='tab')return {...state,active:id};
  let next={...current,saved:current.saved.map(item=>({...item}))};
  if(action.type==='select'){findSample(id,action.id);next={...next,selected:action.id,frame:0,phase:'preview'};}
  else if(action.type==='frame'){
    const sample=findSample(id,current.selected);
    if(!sample.frames||!Number.isInteger(action.frame)||action.frame<0||action.frame>=sample.frames.length)throw new RangeError('Invalid reuse frame');
    next.frame=action.frame;next.phase='preview';
  }else if(action.type==='save'){
    const entry={id:current.selected,frame:current.frame},index=next.saved.findIndex(item=>item.id===entry.id);
    if(index<0)next.saved.push(entry);else next.saved[index]=entry;
    next.phase='saved';
  }else if(action.type==='use'){
    const entry=current.saved.find(item=>item.id===action.id);
    if(!entry)throw new RangeError('Save a sample before using it');
    next={...next,applied:{id:entry.id,frame:entry.frame},phase:'used'};
  }else throw new TypeError('Unknown reuse action: '+action.type);
  return {...state,libraries:{...state.libraries,[id]:next}};
}
const thumbnail=(sample,frame=0)=>sample.image?'<img src="'+(sample.frames?.[frame]||sample.image)+'" alt="" width="1400" height="1200" loading="lazy" decoding="async">':'<code>'+escape(sample.call)+'</code>';
const timelineMarkup='<div class="duik-reuse-timeline" role="group" aria-label="选择待存入的动作分镜">'+['起势','动作','收势'].map((label,frame)=>'<button type="button" data-reuse-frame="'+frame+'" aria-pressed="'+(frame===0)+'">'+label+'</button>').join('')+'</div>';
const referenceMarkup=library=>{
  const first=library.steps[0];
  return '<details class="duik-reuse-reference" data-reuse-reference><summary>查看 '+library.name+' 的实际界面与操作</summary><div class="duik-reuse-reference-body" data-lenis-prevent>'+
    '<figure class="duik-reuse-official"><button type="button" class="duik-reuse-photo-button" data-reuse-zoom="'+library.id+'" aria-label="放大查看'+library.name+'官方面板"><img src="'+library.image+'" alt="'+escape(library.alt)+'" loading="lazy" decoding="async"><span>放大官方面板</span></button><figcaption>界面图 © RxLaboratory · GFDL 1.3</figcaption></figure>'+
    '<div class="duik-reuse-reference-copy"><div class="duik-reuse-step-list" role="group" aria-label="'+library.name+'操作说明">'+library.steps.map((step,index)=>'<button type="button" data-reuse-step="'+index+'" data-reuse-library="'+library.id+'" aria-pressed="'+(index===0)+'">'+escape(step.label)+'</button>').join('')+'</div><h3 data-reuse-step-title>'+escape(first.title)+'</h3><p data-reuse-step-body>'+escape(first.body)+'</p><p class="duik-reuse-operation" data-reuse-step-detail>'+escape(first.detail)+'</p><a data-reuse-step-docs href="'+first.docs+'">阅读这一步的中文文档</a><p class="duik-reuse-caution">'+escape(library.caution)+'</p></div></div></details>';
};
const panelMarkup=library=>{
  const samples=REUSE_SAMPLES[library.id],first=samples[0];
  return '<section class="duik-reuse-panel" data-reuse-panel="'+library.id+'" role="tabpanel"'+(library.id==='structure'?'':' hidden')+'>'+
    '<div class="duik-reuse-stage" data-reuse-stage>'+
    '<div class="duik-reuse-source"><h3>选择'+library.label+'示例</h3><div class="duik-reuse-source-list" role="group" aria-label="选择'+library.label+'示例">'+samples.map((sample,index)=>'<button type="button" class="duik-reuse-source-item" data-reuse-select="'+sample.id+'" aria-pressed="'+(index===0)+'"><span class="duik-reuse-thumb">'+thumbnail(sample)+'</span><span class="duik-reuse-item-name">'+sample.label+'</span></button>').join('')+'</div>'+(library.id==='animation'?timelineMarkup:'')+'<button type="button" class="duik-reuse-save" data-reuse-save>存入示例库</button></div>'+
    '<div class="duik-reuse-library" data-reuse-library-drop><h3>本页示例库 <span data-reuse-count>0 / 2</span></h3><div class="duik-reuse-saved-list" data-reuse-shelf>'+samples.map(sample=>'<div class="duik-reuse-shelf-slot" data-reuse-slot="'+sample.id+'"><span class="duik-reuse-empty" data-reuse-empty="'+sample.id+'">等待存入</span><button type="button" class="duik-reuse-saved-item" data-reuse-use="'+sample.id+'" aria-label="取用'+sample.label+'到网页场景" hidden><span class="duik-reuse-thumb">'+thumbnail(sample)+'</span><span class="duik-reuse-saved-caption"><span>'+sample.label+'</span><strong>取用</strong></span></button></div>').join('')+'</div><p>仅保留在本次网页演示中</p></div>'+
    '<div class="duik-reuse-output" data-reuse-output><div class="duik-reuse-output-heading"><h3 data-reuse-output-title>待选预览</h3><span data-reuse-preview-name>'+first.label+'</span></div>'+
    (library.id==='scripts'?'<div class="duik-reuse-code-view"><span>代码片段 / 不执行</span><pre tabindex="0" aria-label="当前脚本示例"><code data-reuse-code>'+escape(first.code)+'</code></pre><a data-reuse-code-docs href="'+first.docs+'">查看 API 使用前提</a></div>':'<figure class="duik-reuse-preview" data-reuse-preview-frame><img data-reuse-preview src="'+(first.frames?.[0]||first.image)+'" alt="'+first.alt+'" width="1400" height="1200" loading="lazy" decoding="async"><figcaption data-reuse-media-state hidden></figcaption></figure>')+
    '<p class="duik-reuse-sample-note" data-reuse-sample-note>'+first.note+'</p></div></div>'+
    '<div class="duik-reuse-stage-footer"><p data-reuse-message>先选择一份示例，再存入本页示例库。</p><div><button type="button" data-reuse-reset>重置示例</button></div></div>'+
    referenceMarkup(library)+'</section>';
};
export const reuseMarkup='<div class="duik-reuse-workbench" data-reuse-root data-reuse-active="structure" data-reuse-demo-state="idle">'+
  '<header class="duik-reuse-heading"><h2>把做好的，留给下一次。</h2><p>选择、收进库、再取用。先在这里试一次复用的过程。</p></header>'+
  '<div class="duik-reuse-toolbar"><div class="duik-reuse-tabs" role="tablist" aria-label="探索三类 Duik 资产复用">'+REUSE_LIBRARIES.map((library,index)=>'<button type="button" role="tab" data-reuse-tab="'+library.id+'" aria-selected="'+(index===0)+'" tabindex="'+(index===0?0:-1)+'">'+library.label+'</button>').join('')+'</div><span>原理演示</span></div>'+REUSE_LIBRARIES.map(panelMarkup).join('')+
  '<footer class="duik-reuse-board-footer"><span>把使用条件也留下。</span><nav aria-label="复用配套工具"><a href="/docs/guide/notes">项目与合成笔记</a><a href="/docs/guide/sanity">项目自检</a></nav></footer>'+
  '<p class="duik-reuse-boundary">这里只保存网页示例；OCO / duio 文件读写、脚本运行均需在 AE / Duik 中完成。</p>'+
  '<dialog class="duik-reuse-dialog" data-reuse-dialog aria-label="放大查看 Duik 官方面板" data-lenis-prevent><div class="duik-reuse-dialog-bar"><div><strong data-reuse-dialog-title></strong><span>官方文档原图，不是网页重绘界面</span></div><div class="duik-reuse-dialog-actions"><button type="button" data-reuse-dialog-scale aria-pressed="false">2 倍查看</button><button type="button" data-reuse-dialog-close aria-label="关闭面板大图">关闭</button></div></div><div class="duik-reuse-dialog-image" data-reuse-dialog-image data-lenis-prevent><img data-reuse-dialog-photo alt=""></div><div class="duik-reuse-dialog-foot"><span>RxLaboratory · GFDL 1.3</span><a data-reuse-dialog-docs href="/docs/guide/oco">阅读中文文档</a></div></dialog></div>';

const mounts=new WeakMap();let instanceNumber=0;
export function mountReuse(host){
  if(!host?.ownerDocument)throw new TypeError('mountReuse requires a DOM element');
  mounts.get(host)?.();
  let root=host.matches?.('[data-reuse-root]')?host:host.querySelector('[data-reuse-root]');
  if(!root){host.innerHTML=reuseMarkup;root=host.querySelector('[data-reuse-root]');}
  const doc=host.ownerDocument,win=doc.defaultView,lifetime=new win.AbortController(),signal=lifetime.signal;
  const q=selector=>root.querySelector(selector),all=selector=>[...root.querySelectorAll(selector)];
  const on=(target,type,listener)=>target?.addEventListener(type,listener,{signal});
  const prefix='duik-reuse-'+(++instanceNumber),tabs=all('[data-reuse-tab]'),dialog=q('[data-reuse-dialog]');
  const preference=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const flights=new Set(),animations=new Set();
  let state=createReuseState(),disposed=false,opener=null,zoomed=false;
  const heldPointers=new Set(),heldKeys=new Set();
  let visible=!win.IntersectionObserver,userOwned=false,queue=[],timer=0,due=0,remaining=0,queueVersion=0;
  const now=()=>win.performance.now();
  const activePanel=()=>q('[data-reuse-panel="'+state.active+'"]');
  const canMove=()=>!disposed&&visible&&!doc.hidden&&!preference?.matches;
  const canLoop=()=>canMove()&&!heldPointers.size&&!heldKeys.size&&!dialog.open&&!all('[data-reuse-reference]').some(details=>details.open);
  for(const tab of tabs){const id=tab.dataset.reuseTab,panel=q('[data-reuse-panel="'+id+'"]');tab.id=prefix+'-tab-'+id;tab.setAttribute('aria-controls',prefix+'-panel-'+id);panel.id=prefix+'-panel-'+id;panel.setAttribute('aria-labelledby',tab.id);}
  function render(){
    root.dataset.reuseActive=state.active;
    for(const tab of tabs){const active=tab.dataset.reuseTab===state.active;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
    for(const panel of all('[data-reuse-panel]')){
      const id=panel.dataset.reusePanel,current=state.libraries[id],sample=findSample(id,current.selected),applied=current.applied,outputSample=applied?findSample(id,applied.id):sample,outputFrame=applied?.frame??current.frame,p=selector=>panel.querySelector(selector);
      panel.hidden=id!==state.active;panel.dataset.reuseSelected=current.selected;panel.dataset.reusePhase=current.phase;panel.dataset.reuseFrame=String(current.frame);
      panel.dataset.reuseApplied=applied?.id||'';panel.dataset.reuseAppliedFrame=applied?String(applied.frame):'';
      panel.querySelectorAll('[data-reuse-select]').forEach(button=>{
        const selected=button.dataset.reuseSelect===current.selected,source=findSample(id,button.dataset.reuseSelect),image=button.querySelector('img');
        button.setAttribute('aria-pressed',String(selected));
        if(source.frames&&image)image.src=source.frames[selected?current.frame:0];
      });
      panel.querySelectorAll('[data-reuse-use]').forEach(button=>{
        const saved=current.saved.find(item=>item.id===button.dataset.reuseUse),source=findSample(id,button.dataset.reuseUse),image=button.querySelector('img');
        button.hidden=!saved;button.setAttribute('aria-pressed',String(applied?.id===saved?.id&&applied?.frame===saved?.frame&&!!saved));p('[data-reuse-empty="'+button.dataset.reuseUse+'"]').hidden=!!saved;
        if(saved&&source.frames&&image)image.src=source.frames[saved.frame];
      });
      p('[data-reuse-count]').textContent=current.saved.length+' / '+REUSE_SAMPLES[id].length;
      p('[data-reuse-preview-name]').textContent=outputSample.label+(outputSample.frames?' · 分镜 '+(outputFrame+1):'');p('[data-reuse-output-title]').textContent=applied?'网页示例结果':'待选预览';p('[data-reuse-sample-note]').textContent=outputSample.note;
      const save=p('[data-reuse-save]'),same=current.saved.some(item=>item.id===current.selected&&item.frame===current.frame);
      save.disabled=same;save.textContent=same?'已存入示例库':'存入示例库';
      if(outputSample.code){p('[data-reuse-code]').textContent=outputSample.code;p('[data-reuse-code-docs]').href=outputSample.docs;}
      else{const image=p('[data-reuse-preview]'),src=outputSample.frames?.[outputFrame]||outputSample.image;if(image.getAttribute('src')!==src){image.src=src;image.dataset.mediaState='loading';p('[data-reuse-media-state]').hidden=true;}image.alt=outputSample.alt+(outputSample.frames?'，分镜 '+(outputFrame+1):'');}
      if(sample.frames)panel.querySelectorAll('[data-reuse-frame]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.reuseFrame)===current.frame)));
      p('[data-reuse-message]').textContent=current.phase==='used'?'已取用「'+outputSample.label+'」。结果留在右侧，可继续挑选。':current.phase==='saved'?'「'+sample.label+'」已存入，点击库中的条目取用。':applied?'正在挑选「'+sample.label+'」。取用后更新右侧结果。':'选一份示例，存入库，再取用。';
    }
  }
  const dispatch=action=>{state=updateReuseState(state,action);render();};
  function clearFlights(){for(const animation of animations)animation.cancel();animations.clear();for(const flight of flights)flight.remove();flights.clear();}
  function transfer(from,to,sample,motion=true,frame=0){
    if(!motion||!canMove()||typeof from?.animate!=='function'||!to)return;
    clearFlights();
    const stage=from.closest('[data-reuse-stage]'),origin=stage.getBoundingClientRect(),start=from.getBoundingClientRect(),end=to.getBoundingClientRect();
    if(!start.width||!end.width)return;
    const flight=doc.createElement('div');flight.className='duik-reuse-transfer';flight.setAttribute('aria-hidden','true');flight.innerHTML=thumbnail(sample,frame);
    Object.assign(flight.style,{left:start.left-origin.left+'px',top:start.top-origin.top+'px',width:start.width+'px',height:start.height+'px'});stage.append(flight);flights.add(flight);
    const dx=end.left+end.width/2-start.left-start.width/2,dy=end.top+end.height/2-start.top-start.height/2;
    const scale=Math.min(end.width/start.width,end.height/start.height);
    const animation=flight.animate([{transform:'translate(0,0) scale(1)',opacity:.9},{transform:'translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:1}],{duration:280,easing:'cubic-bezier(0.23, 1, 0.32, 1)'});
    animations.add(animation);animation.onfinish=()=>{animations.delete(animation);flights.delete(flight);flight.remove();};
  }
  function save(motion=true){const panel=activePanel(),current=state.libraries[state.active],sample=findSample(state.active,current.selected);dispatch({type:'save'});transfer(panel.querySelector('[data-reuse-select="'+sample.id+'"] .duik-reuse-thumb'),panel.querySelector('[data-reuse-use="'+sample.id+'"] .duik-reuse-thumb'),sample,motion,current.frame);}
  function use(id,motion=true){const panel=activePanel(),sample=findSample(state.active,id);dispatch({type:'use',id});transfer(panel.querySelector('[data-reuse-use="'+id+'"] .duik-reuse-thumb'),panel.querySelector('[data-reuse-preview-frame]')||panel.querySelector('.duik-reuse-code-view'),sample,motion,state.libraries[state.active].applied.frame);}
  function queueState(value){root.dataset.reuseDemoState=value;}
  function stopQueue(value='user',clear=true){queueVersion++;if(timer)win.clearTimeout(timer);timer=0;queue=[];remaining=0;if(clear)clearFlights();queueState(value);}
  function pauseQueue(){queueVersion++;if(timer){remaining=Math.max(0,due-now());win.clearTimeout(timer);timer=0;}for(const animation of animations)animation.pause();if(queue.length)queueState('paused');}
  function resumeQueue(){
    if(!canLoop())return;
    if(!queue.length){demonstrate();return;}
    for(const animation of animations)animation.play();if(timer)return;
    queueState('playing');due=now()+remaining;
    const token=queueVersion;
    timer=win.setTimeout(()=>{if(disposed||token!==queueVersion)return;timer=0;if(!canLoop()){pauseQueue();return;}const next=queue.shift();if(!next)return;next.run();if(queue.length)remaining=queue[0].delay;resumeQueue();},remaining);
  }
  function startQueue(steps){stopQueue('idle',false);queue=steps;remaining=steps[0]?.delay||0;resumeQueue();}
  function takeOver(){userOwned=true;stopQueue('user');}
  function demonstrate(){
    if(!canLoop())return;
    const id=state.active,current=state.libraries[id],sample=findSample(id,current.selected);
    if(userOwned){
      // After an operation, animate the existing receipt (or pending preview)
      // without another save/use. A changed draft, saved revision or {id, frame}
      // remains user-owned; even an empty library can keep demonstrating.
      const applied=current.applied,shown=applied?findSample(id,applied.id):sample,panel=activePanel();
      const source=applied?'[data-reuse-use="'+applied.id+'"] .duik-reuse-thumb':'[data-reuse-select="'+sample.id+'"] .duik-reuse-thumb';
      startQueue([{delay:1600,run:()=>transfer(panel.querySelector(source),panel.querySelector('[data-reuse-preview-frame]')||panel.querySelector('.duik-reuse-code-view'),shown,true,applied?.frame??current.frame)},{delay:1800,run:()=>{}}]);
      return;
    }
    const frames=sample.frames?sample.frames.map((_,frame)=>({delay:650,run:()=>dispatch({type:'frame',frame})})):[];
    startQueue([{delay:0,run:()=>dispatch({type:'select',id:sample.id})},...frames,{delay:850,run:()=>save()},{delay:850,run:()=>use(sample.id)},{delay:1800,run:()=>{}}]);
  }
  function selectStep(id,index){
    const step=getReuseStep(id,index),panel=q('[data-reuse-panel="'+id+'"]');panel.dataset.reuseCurrentStep=String(index);
    panel.querySelectorAll('[data-reuse-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.reuseStep)===index)));
    panel.querySelector('[data-reuse-step-title]').textContent=step.title;panel.querySelector('[data-reuse-step-body]').textContent=step.body;panel.querySelector('[data-reuse-step-detail]').textContent=step.detail;panel.querySelector('[data-reuse-step-docs]').href=step.docs;
  }
  function setScale(enlarged){zoomed=enlarged;const image=q('[data-reuse-dialog-photo]'),button=q('[data-reuse-dialog-scale]');dialog.dataset.enlarged=String(enlarged);button.setAttribute('aria-pressed',String(enlarged));button.textContent=enlarged?'适应窗口':'2 倍查看';image.style.width=enlarged&&image.naturalWidth?image.naturalWidth*2+'px':'';}
  function closeDialog(){if(dialog.open){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}}
  function openImage(id,button){
    const library=REUSE_LIBRARIES.find(item=>item.id===id);if(!library)return;opener=button;q('[data-reuse-dialog-title]').textContent=library.name;
    const image=q('[data-reuse-dialog-photo]');image.src=library.image;image.alt=library.alt;q('[data-reuse-dialog-docs]').href=library.docs;setScale(false);
    const stage=q('[data-reuse-dialog-image]');stage.scrollTop=0;stage.scrollLeft=0;if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');q('[data-reuse-dialog-close]').focus({preventScroll:true});
  }
  on(root,'click',event=>{
    const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled)return;
    const motion=event.detail!==0;takeOver();
    if(button.hasAttribute('data-reuse-tab'))dispatch({type:'tab',library:button.dataset.reuseTab});
    else if(button.hasAttribute('data-reuse-select'))dispatch({type:'select',id:button.dataset.reuseSelect});
    else if(button.hasAttribute('data-reuse-frame'))dispatch({type:'frame',frame:Number(button.dataset.reuseFrame)});
    else if(button.hasAttribute('data-reuse-save'))save(motion);
    else if(button.hasAttribute('data-reuse-use'))use(button.dataset.reuseUse,motion);
    else if(button.hasAttribute('data-reuse-reset')){const active=state.active;dispatch({type:'reset'});dispatch({type:'tab',library:active});for(const library of REUSE_LIBRARIES)selectStep(library.id,0);activePanel().querySelector('[data-reuse-message]').textContent='网页示例已重置，真实文件未受影响。';}
    else if(button.hasAttribute('data-reuse-step'))selectStep(button.dataset.reuseLibrary,Number(button.dataset.reuseStep));
    else if(button.hasAttribute('data-reuse-zoom'))openImage(button.dataset.reuseZoom,button);
    else if(button.hasAttribute('data-reuse-dialog-close'))closeDialog();
    else if(button.hasAttribute('data-reuse-dialog-scale'))setScale(!zoomed);
    resumeQueue();
  });
  // Hover and ordinary focus are not playback controls. Only held activation
  // and open evidence defer the loop; release resumes without changing data.
  const actionTarget=target=>{const control=target.closest?.('button,a,summary');return control&&root.contains(control);};
  on(root,'pointerdown',event=>{if(actionTarget(event.target)&&Number.isFinite(event.pointerId)){heldPointers.add(event.pointerId);pauseQueue();}});
  const releasePointer=event=>{if(heldPointers.delete(event.pointerId))resumeQueue();};
  on(doc,'pointerup',releasePointer);on(doc,'pointercancel',releasePointer);
  on(root,'keydown',event=>{if((event.key==='Enter'||event.key===' ')&&actionTarget(event.target)){heldKeys.add(event.key);pauseQueue();}});
  on(doc,'keyup',event=>{if(heldKeys.delete(event.key))resumeQueue();});
  all('[data-reuse-reference]').forEach(details=>on(details,'toggle',()=>{if(details.open)pauseQueue();else resumeQueue();}));
  on(q('[role="tablist"]'),'keydown',event=>{
    const index=tabs.indexOf(event.target);if(index<0)return;let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
    event.preventDefault();takeOver();dispatch({type:'tab',library:tabs[next].dataset.reuseTab});tabs[next].focus({preventScroll:true});resumeQueue();
  });
  for(const image of all('[data-reuse-preview]')){
    const message=image.parentElement.querySelector('[data-reuse-media-state]');
    on(image,'load',()=>{image.dataset.mediaState='ready';message.hidden=true;});
    on(image,'error',()=>{image.dataset.mediaState='error';message.textContent='本地素材未加载，请刷新页面重试。';message.hidden=false;});
    if(image.complete&&!image.naturalWidth){image.dataset.mediaState='error';message.textContent='本地素材未加载，请刷新页面重试。';message.hidden=false;}
  }
  on(dialog,'click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
  on(dialog,'close',()=>{if(!disposed){opener?.focus({preventScroll:true});resumeQueue();}opener=null;});
  on(q('[data-reuse-dialog-photo]'),'load',()=>{if(zoomed)setScale(true);});
  on(doc,'keydown',event=>{if(event.key==='Escape'&&dialog.open&&typeof dialog.close!=='function')closeDialog();});
  on(doc,'visibilitychange',()=>{if(doc.hidden){heldPointers.clear();heldKeys.clear();pauseQueue();}else resumeQueue();});
  on(preference,'change',()=>{if(preference.matches)stopQueue('idle');else resumeQueue();});
  const observer=win.IntersectionObserver?new win.IntersectionObserver(entries=>{if(disposed)return;const latest=entries.filter(entry=>entry.target===root).at(-1);if(!latest)return;visible=latest.isIntersecting&&(latest.intersectionRatio??1)>=.65;root.dataset.reuseVisible=String(visible);if(!visible){pauseQueue();return;}resumeQueue();},{threshold:[0,.65]}):null;
  render();for(const library of REUSE_LIBRARIES)selectStep(library.id,0);root.dataset.reuseMounted='true';observer?.observe(root);if(!observer)resumeQueue();
  const cleanup=()=>{if(disposed)return;disposed=true;stopQueue('idle');observer?.disconnect();closeDialog();lifetime.abort();root.dataset.reuseMounted='false';opener=null;mounts.delete(host);};
  mounts.set(host,cleanup);return cleanup;
}
