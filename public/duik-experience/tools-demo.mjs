import {TOOL_TABS,LOCKED_CHARACTER_SHA,CROP_CANVAS,SCENE_PARTS,LAYER_SCENE_RECORDS,TOOLS_PREVIEW_DURATION,createToolsPreview,advanceToolsPreview,sampleToolsPreview,sceneLayerRecords,sceneNames,createCropState,updateCropMask,dragCropCorner,cropGeometry,freshTextSamples,renameSamples,replaceSamples,changedSampleCount,filterParts,SCRIPT_TASKS,escapeHTML as esc} from './tools-model.mjs';

const button=(action,label,extra='')=>'<button type="button" data-tool-action="'+action+'" '+extra+'>'+label+'</button>';
const defaultTool=TOOL_TABS[0];
// Product explanations come from the translated upstream pages; the interactive
// examples below remain a separate, explicitly non-AE teaching layer.
const officialTools={
  composition:{title:'调整合成，不打乱画面',description:'裁剪预合成，或集中修改合成设置。针对的是合成边界与属性，不是重新摆放画面中的图层。',image:'comp-tools.png',alt:'Duik 官方文档中的合成工具面板：裁剪预合成与合成设置',caption:'合成工具 / Composition',docs:'/docs/guide/tools/composition/crop',steps:[['准备','选中预合成，用蒙版圈出要保留的区域。'],['操作','点击“裁剪预合成”，以蒙版边界作为新尺寸。'],['结果','边界收紧，预合成在父合成中的位置保持不变。']],note:'合成设置是独立工具；可按需统一修改合成与嵌套合成属性。',extra:'/docs/guide/tools/composition/settings',extraLabel:'了解合成设置'},
  layers:{title:'创建、命名，再标记图层',description:'图层管理器不只是显隐列表。它帮助你创建图层，并组织组别、侧别、类型和名称。',image:'layer-tools.png',alt:'Duik 官方图层管理器面板，包含图层创建按钮与名称、类型等属性',caption:'图层管理器 / Layer manager',docs:'/docs/guide/tools/layers',steps:[['准备','选择要整理的图层，或创建空对象、形状等新图层。'],['操作','使用自动重命名与标记，或手动设置组别、侧别和类型。'],['结果','把名称与标记整理为 Duik 可识别的图层信息。']],note:'上方用预设名称演示标记信息，不识别图像，也不复现 Duik 的命名算法。展开的角色详情仅演示 26 张美术 PNG 的筛选与显隐。'},
  text:{title:'把一批名称，一次整理好',description:'重命名工具面向图层、木偶图钉与项目项；查找和替换则处理指定范围内的文字。',image:'text-tools.png',detail:'rename.png',alt:'Duik 官方文本工具面板：重命名与查找和替换',detailAlt:'Duik 官方重命名设置界面',caption:'文本工具 / Text',docs:'/docs/guide/tools/text/rename',steps:[['准备','选中需要重命名的图层、木偶图钉或项目项。'],['操作','设置命名规则；按需要决定是否同步更新表达式。'],['结果','一次整理多项名称，减少逐个修改。']],note:'网页样本不会同步改写表达式引用；官方重命名工具提供对应选项。',extra:'/docs/guide/tools/text/search-replace',extraLabel:'了解查找和替换'},
  scripts:{title:'从常用脚本，到自己的工具',description:'脚本库负责收藏与分类，编辑器负责快速编辑和运行，表达式工具负责属性表达式。它们各有明确入口。',image:'script-tools.png',detail:'script-editor.png',alt:'Duik 官方脚本与表达式面板：脚本库、脚本化表达式、脚本编辑器与编辑表达式',detailAlt:'Duik 官方脚本编辑器界面',caption:'脚本与表达式 / Scripting',docs:'/docs/guide/tools/scripting/script-editor',steps:[['准备','从脚本库找常用脚本，或打开脚本编辑器。'],['操作','在 AE 中编辑并运行；Duik 编辑器内置 Duik API。'],['结果','把重复步骤写成可再次调用的脚本。']],note:'此页编辑区只编辑和复制文本，不读取本机脚本，也不执行 AE 或 Duik API。',extra:'/docs/guide/tools/scripting/library',extraLabel:'了解脚本库'},
};
const officialToolDimensions={composition:[423,197],layers:[421,370],text:[418,177],scripts:[421,222]};
const officialToolMarkup=id=>{
  const item=officialTools[id],base='/duik-experience/official/duik/tools/',[width,height]=officialToolDimensions[id];
  return '<div class="duik-tools-official" data-official-tool="'+id+'"><figure class="duik-tools-official-figure"><div class="duik-tools-official-label">官方文档原图</div><div class="duik-tools-official-images"><a class="duik-tools-image-link" href="'+base+item.image+'" target="_blank" rel="noopener" aria-label="查看'+item.caption+'原尺寸截图"><img src="'+base+item.image+'" width="'+width+'" height="'+height+'" alt="'+item.alt+'" loading="lazy" decoding="async"></a>'+(item.detail?'<a class="duik-tools-detail-link" href="'+base+item.detail+'" target="_blank" rel="noopener">'+(id==='text'?'查看重命名设置原图':'查看脚本编辑器原图')+'</a>':'')+'</div><figcaption>'+item.caption+' · 点击图片查看原尺寸</figcaption></figure><div class="duik-tools-official-guide"><p class="duik-tools-official-context">在 After Effects 中使用</p><ol>'+item.steps.map(step=>'<li><strong>'+step[0]+'</strong><p>'+step[1]+'</p></li>').join('')+'</ol><p class="duik-tools-official-note">'+item.note+'</p><div class="duik-tools-official-links"><a href="'+item.docs+'">阅读操作说明</a>'+(item.extra?'<a href="'+item.extra+'">'+item.extraLabel+'</a>':'')+'</div></div></div>';
};
const referenceDetails=id=>'<details class="duik-tools-reference-details" data-tools-reference="'+id+'"><summary>查看 Duik 原面板与操作说明</summary>'+officialToolMarkup(id)+'<p class="duik-tools-attribution">界面原图：Nicolas “Duduf” Dufresne / RxLaboratory · Duik 文档 · <a href="/docs/misc/doc-license">GFDL 1.3</a></p></details>';
const comparisonArrow='<svg class="duik-tools-compare-arrow" viewBox="0 0 32 16" width="32" height="16" aria-hidden="true"><path d="M2 8h26m-6-6 6 6-6 6"/></svg>';
const textRow=(row,index,before,scope)=>'<li class="duik-tools-name-pair"><span class="duik-tools-name-before">'+esc(before[index][scope])+'</span>'+comparisonArrow+'<strong class="duik-tools-name-after'+(row[scope]!==before[index][scope]?' is-changed':'')+'" data-text-result>'+esc(row[scope])+'</strong></li>';
const sceneShapes=[
  '<rect x="174" y="88" width="108" height="208" rx="54" fill="#72816a"/>',
  '<circle cx="354" cy="208" r="88" fill="#dc825b"/>',
  '<rect x="218" y="164" width="180" height="76" rx="2" fill="#2e443c"/><text x="308" y="217" text-anchor="middle" fill="#fff9e8" font-size="46" font-weight="650" letter-spacing="-2">Duik</text>',
  '<circle cx="398" cy="116" r="24" fill="#e5b548"/>',
];
const sceneArt=interactive=>SCENE_PARTS.map((part,index)=>'<g'+(interactive?' data-scene-piece="'+part.id+'" data-selected="'+(part.id==='title')+'" tabindex="0" role="button" aria-pressed="'+(part.id==='title')+'" aria-label="'+part.label+'；可拖动，方向键微调，Home 复位"':'')+'>'+sceneShapes[index]+'</g>').join('');
const referenceMark='<path d="M-13 0H13M0-13V13" stroke="#fffdf6" stroke-width="5"/><path d="M-13 0H13M0-13V13"/><circle r="4" fill="#fffdf6"/>';
const originalSVG='<svg viewBox="0 0 760 480" role="img" aria-label="未整理的原始几何构图，始终保持不变"><rect x="60" y="40" width="640" height="400" fill="#f6ecd7"/><g transform="translate(60 40)">'+sceneArt(false)+'</g><rect class="duik-tools-original-boundary" x="60" y="40" width="640" height="400"/><g data-scene-crop-only data-comparison-reference="before" class="duik-tools-reference" transform="translate(380 240)" hidden>'+referenceMark+'</g></svg>';
const cropSVG=[
  '<svg class="duik-tools-crop-svg" data-crop-svg viewBox="0 0 760 480" aria-label="当前工具的可操作几何构图示意">',
  '<defs><clipPath data-crop-clip id="duik-tools-crop-clip"><rect data-crop-clip-box x="0" y="0" width="640" height="400"/></clipPath></defs>',
  '<rect class="duik-tools-original-boundary" x="60" y="40" width="640" height="400"/><text class="duik-tools-svg-label" data-scene-crop-only x="60" y="24" hidden>原边界 640 × 400</text>',
  '<g data-crop-origin transform="translate(60 40)"><g data-crop-offset><g data-crop-art clip-path="url(#duik-tools-crop-clip)">',
  '<rect data-scene-paper x="0" y="0" width="640" height="400" fill="#f6ecd7"/>'+sceneArt(true)+'</g></g></g>',
  '<rect data-crop-boundary class="duik-tools-comp-boundary" x="60" y="40" width="640" height="400" hidden/>',
  '<rect data-crop-mask class="duik-tools-mask" x="204" y="104" width="352" height="272" hidden/>',
  '<g data-parent-reference data-comparison-reference="after" class="duik-tools-reference" transform="translate(380 240)" hidden>'+referenceMark+'</g>',
  ...['nw','ne','sw','se'].map(c=>'<g data-crop-handle="'+c+'" class="duik-tools-crop-handle" transform="translate('+(c.includes('w')?204:556)+' '+(c.includes('n')?104:376)+')" tabindex="0" role="button" aria-label="调整蒙版'+({nw:'左上',ne:'右上',sw:'左下',se:'右下'}[c])+'角；方向键步进，Shift 加速" hidden><rect class="duik-tools-handle-hit" x="-15" y="-15" width="30" height="30"/><rect class="duik-tools-handle-mark" x="-6" y="-6" width="12" height="12" rx="1"/></g>'),
  '<g data-scene-layer-labels class="duik-tools-layer-labels" transform="translate(60 40)" aria-hidden="true">'+LAYER_SCENE_RECORDS.map(record=>'<g data-scene-layer-label="'+record.id+'" data-tagged="false" data-selected="'+(record.id==='title')+'"><text x="'+record.labelX+'" y="'+record.labelY+'" text-anchor="'+(record.anchor||'start')+'" data-scene-layer-name>'+esc(record.sourceName)+'</text></g>').join('')+'</g>',
  '<g data-scene-names hidden>'+SCENE_PARTS.map((part,index)=>'<g transform="translate(492 '+(124+index*61)+')"><rect x="0" y="-19" width="208" height="42" rx="4" fill="#fffdf6"/><circle cx="16" cy="2" r="5" fill="'+part.color+'"/><text data-scene-name="'+index+'" x="31" y="7" fill="#293f37" font-size="15">'+part.name+'</text></g>').join('')+'</g>',
  '<g data-scene-snippet hidden><rect width="296" height="112" rx="6" fill="#fffdf6" stroke="#879780"/><text x="19" y="27" fill="#627064" font-size="12" data-scene-snippet-label>已收藏的片段</text><text x="19" y="64" fill="#2e443c" font-size="22" font-family="ui-monospace,monospace" data-scene-code>value;</text><text x="19" y="92" fill="#627064" font-size="12">只取用文本 · 不执行</text></g>',
  '<text class="duik-tools-svg-label" data-scene-crop-only x="60" y="464" data-crop-svg-size hidden>预合成 640 × 400</text><text class="duik-tools-svg-label" data-scene-crop-only x="700" y="464" text-anchor="end" hidden>十字参考点始终不动</text></svg>',
].join('');

export const toolsMarkup=[
  '<section class="duik-tools-demo" data-tools-root data-tools-preview="idle" data-scene-progress="0" data-tools-current="'+defaultTool.id+'" aria-label="Duik 通用工具网页原理示意">',
  '<div class="duik-tools-intro"><h2 data-tools-title>'+defaultTool.title+'</h2><p data-tools-description>'+defaultTool.description+'</p></div>',
  '<div class="duik-tools-tabs" role="tablist" aria-label="通用工具四类">',
  ...TOOL_TABS.map((t,i)=>'<button type="button" role="tab" data-tools-tab="'+t.id+'" id="duik-tools-tab-'+t.id+'" aria-controls="duik-tools-panel-'+t.id+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?'0':'-1')+'">'+t.label+'</button>'),
  '</div>',
  '<div class="duik-tools-shared-stage" data-tools-stage data-crop-scene data-crop-mode="before" data-scene-step="before">',
  '<div class="duik-tools-comparison"><figure class="duik-tools-before"><figcaption><span>原始构图</span><small>固定参照</small></figcaption>'+originalSVG+'</figure>',
  '<figure class="duik-tools-result"><figcaption><span data-scene-heading>名称与标记</span><output data-scene-result>从示例名称开始</output></figcaption><div class="duik-tools-crop-stage">'+cropSVG+'</div><dl class="duik-tools-layer-identity" data-scene-layer-identity data-tagged="false" aria-label="所选图层的示例标记"><div><dt>名称</dt><dd data-scene-layer-field="name">'+LAYER_SCENE_RECORDS.find(record=>record.id==='title').sourceName+'</dd></div><div><dt>组别</dt><dd data-scene-layer-field="group">未整理</dd></div><div><dt>侧别</dt><dd data-scene-layer-field="side">未整理</dd></div><div><dt>类型</dt><dd data-scene-layer-field="type">未整理</dd></div></dl></figure></div>',
  '<div class="duik-tools-scene-controls" data-tools-control="composition" hidden><div class="duik-tools-crop-result"><output data-crop-size>640 × 400</output><span data-crop-result-note>调整橙色边界</span></div><div class="duik-tools-crop-controls">'+button('crop-after','裁掉空白','class="duik-tools-primary" aria-pressed="false"')+button('crop-before','查看原边界','aria-pressed="true"')+button('crop-reset','复位','class="duik-tools-quiet"')+'</div></div>',
  '<div class="duik-tools-scene-controls" data-tools-control="layers"><div class="duik-tools-piece-picks" aria-label="选择示意图层">'+SCENE_PARTS.map(part=>button('scene-select',part.label,'data-scene-select="'+part.id+'" aria-pressed="'+(part.id==='title')+'"')).join('')+'</div><div class="duik-tools-crop-controls">'+button('scene-isolate','只看所选','aria-pressed="false"')+button('scene-layout-reset','恢复布局','class="duik-tools-quiet"')+'</div></div>',
  '<div class="duik-tools-scene-controls" data-tools-control="text" hidden><label class="duik-tools-scene-prefix">名称前缀<input data-scene-prefix value="片头_" maxlength="12"></label>'+button('scene-rename','统一命名','class="duik-tools-primary"')+'</div>',
  '<div class="duik-tools-scene-controls" data-tools-control="scripts" hidden><div class="duik-tools-piece-picks" aria-label="选择收藏片段">'+button('scene-snippet','属性值','data-scene-task="expression" aria-pressed="true"')+button('scene-snippet','手臂绑定','data-scene-task="editor" aria-pressed="false"')+'</div>'+button('scene-use','取用片段','class="duik-tools-primary"')+button('scene-copy','复制已取用片段','disabled')+'</div>',
  '<p class="duik-tools-canvas-caption" data-scene-status>选中 Art_片头_Duik，整理后查看标记。预设名称示意，不识别图像。</p><p class="duik-tools-canvas-caption" data-crop-status hidden></p>',
  '</div>',
  '<div role="tabpanel" data-tools-panel="composition" id="duik-tools-panel-composition" aria-labelledby="duik-tools-tab-composition" hidden>',
  '<details class="duik-tools-precision"><summary>精确调整边界</summary><div class="duik-tools-precision-body"><label>蒙版宽度 <output data-crop-width-label>352 px</output><input type="range" data-crop-input="width" min="80" max="496" value="352" step="1"></label><label>蒙版高度 <output data-crop-height-label>272 px</output><input type="range" data-crop-input="height" min="64" max="336" value="272" step="1"></label><dl class="duik-tools-metrics"><div><dt>保留区域</dt><dd data-crop-mask-size>352 × 272</dd></div><div><dt>父级参考点</dt><dd data-crop-reference>380, 240 · 不变</dd></div></dl></div></details>',
  referenceDetails('composition'),'</div>',
  '<div role="tabpanel" data-tools-panel="layers" id="duik-tools-panel-layers" aria-labelledby="duik-tools-tab-layers">',
  '<details class="duik-tools-workbench" data-tools-workbench="layers"><summary>用已确认角色试试筛选与显隐</summary>',
  '<div class="duik-tools-layer-workspace"><div class="duik-tools-character-stage"><div data-tools-character-slot></div><div class="duik-tools-character-actions">'+button('layer-pose','试个姿态')+button('layer-controls','隐藏控制器','aria-pressed="true"')+button('layer-reset','复位姿态')+'</div><p data-layer-status class="duik-tools-canvas-caption" role="status">载入后可拖动控制器；筛选与显隐保留姿态。</p></div>',
  '<div class="duik-tools-layer-browser"><div class="duik-tools-layer-toolbar"><label>找一个部件<input type="search" data-layer-query placeholder="名称、侧别或 ID"></label><label>分组<select data-layer-group><option value="all">全部分组</option></select></label><div class="duik-tools-layer-quick">'+button('layer-left','左臂')+button('layer-clear','清空筛选')+button('layer-all','恢复全部图层')+'</div></div><div class="duik-tools-layer-list-head"><span>独立透明素材</span><output data-layer-count>26 张 PNG</output></div><ul data-layer-list class="duik-tools-layer-list" aria-label="真实角色美术图层"><li class="duik-tools-empty">选择图层页后载入角色。</li></ul></div></div>',
  '<p class="duik-tools-footnote">美术层筛选示意，不模拟 AE 图层创建或标记。</p></details>',referenceDetails('layers'),'</div>',
  '<div role="tabpanel" data-tools-panel="text" id="duik-tools-panel-text" aria-labelledby="duik-tools-tab-text" hidden>',
  '<details class="duik-tools-workbench" data-tools-workbench="text"><summary>试试查找替换、范围与撤销</summary>',
  '<div class="duik-tools-text-scene"><div class="duik-tools-text-controls"><div class="duik-tools-segment" aria-label="文本操作">'+button('text-rename-mode','批量命名','aria-pressed="true"')+button('text-replace-mode','查找替换','aria-pressed="false"')+'</div>',
  '<div data-text-rename class="duik-tools-inline-fields"><label>名称前缀<input data-text-prefix value="角色A_" maxlength="60"></label><label>起始序号<input type="number" data-text-start value="1" min="0" max="9999"></label></div>',
  '<div data-text-replace class="duik-tools-inline-fields" hidden><label>范围<select data-text-scope><option value="name">图层名称</option><option value="expression">表达式文本</option><option value="source">源文本</option></select></label><label>查找<input data-text-find value="角色" maxlength="100"></label><label>替换为<input data-text-replacement value="镜头A" maxlength="100"></label></div></div>',
  '<div class="duik-tools-naming-labels"><span data-text-before-heading>当前名称</span><span data-text-after-heading>结果预览</span></div><ol data-text-rows class="duik-tools-name-flow" aria-label="文本样本前后对照">',
  ...renameSamples(freshTextSamples(),{prefix:'角色A_'}).map((row,index)=>textRow(row,index,freshTextSamples(),'name')),
  '</ol><div class="duik-tools-actions">'+button('text-apply','应用到样本','class="duik-tools-primary"')+button('text-undo','撤销','disabled')+button('text-reset','恢复样本')+'</div><p class="duik-tools-canvas-caption" data-text-status role="status">4 处将改变，仅处理网页样本。</p></div>',
  '</details>',referenceDetails('text'),'</div>',
  '<div role="tabpanel" data-tools-panel="scripts" id="duik-tools-panel-scripts" aria-labelledby="duik-tools-tab-scripts" hidden>',
  '<details class="duik-tools-workbench" data-tools-workbench="scripts"><summary>编辑片段与查看使用前提</summary>',
  '<div class="duik-tools-script-workspace"><div class="duik-tools-script-library"><label>找一个片段<input type="search" data-script-query placeholder="脚本或表达式"></label><div data-script-tasks>',
  ...SCRIPT_TASKS.map(t=>'<button type="button" data-script-task="'+t.id+'" aria-pressed="'+(t.id==='editor')+'">'+t.label+'</button>'),
  '</div><p data-script-empty hidden>没有匹配任务，请修改搜索词。</p></div>',
  '<div class="duik-tools-editor"><div class="duik-tools-editor-heading"><strong data-script-title>脚本编辑器</strong><span>仅编辑 / 复制</span></div><p data-script-description>'+SCRIPT_TASKS[1].description+'</p><textarea data-script-code aria-label="可编辑的代码片段" spellcheck="false">'+esc(SCRIPT_TASKS[1].code)+'</textarea>',
  '<div class="duik-tools-editor-meta"><span data-script-source>'+SCRIPT_TASKS[1].source+'</span><output data-script-count></output></div>',
  '<div class="duik-tools-actions">'+button('script-copy','复制当前代码','class="duik-tools-primary"')+button('script-reset','恢复片段')+'<a data-script-docs href="'+SCRIPT_TASKS[1].docs+'">阅读任务文档</a></div><p data-script-status role="status">不会在网页中执行 AE 脚本。</p></div></div></details>',referenceDetails('scripts'),'</div>',
  '<div class="duik-tools-footer"><span>网页原理示意 · 不连接 AE 工程</span><a data-tools-docs href="'+defaultTool.docs+'">在 Duik 中使用</a></div></section>',
].join('');

const mounted=new WeakMap();
let instanceNumber=0;

/** Enhance SSR in place. Only an empty host receives markup. No browser work at import time. */
export function mountTools(host){
  if(!host?.ownerDocument)throw new TypeError('mountTools requires an element');
  let root=host.matches('[data-tools-root]')?host:host.querySelector('[data-tools-root]');
  if(!root){host.innerHTML=toolsMarkup;root=host.querySelector('[data-tools-root]');}
  if(mounted.has(root))return mounted.get(root);
  const doc=host.ownerDocument,win=doc.defaultView,life=new win.AbortController(),signal=life.signal;
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  const on=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal});
  const prefix='duik-tools-'+(++instanceNumber);
  const motionQuery=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reducedMotion=Boolean(motionQuery?.matches);
  let disposed=false,currentTab=defaultTool.id,inView=!win.IntersectionObserver,rigInView=!win.IntersectionObserver,crop=createCropState(),drag=null,sceneDrag=null;
  let preview=createToolsPreview(),previewFrame=0,previewPreviousTime=null,previewGeneration=0,previewDirection=1;
  let editedTarget=null;const heldKeys=new Set();
  let sceneSelected='title',sceneIsolated=false,sceneSnippet='expression',usedSnippet=null;
  const sceneOffsets=new Map(SCENE_PARTS.map(part=>[part.id,{x:0,y:0}]));
  const stage=$('[data-tools-stage]'),layerWorkbench=$('[data-tools-workbench="layers"]');
  const feedbackAnimations=new Set();
  let rig=null,character=null,rigPending=null,parts=[],layerSignature='',selected='fore-l';
  let textMode='rename',textRows=freshTextSamples(),textHistory=[],lastApplied=null;
  let scriptTask='editor';const drafts=new Map(SCRIPT_TASKS.map(t=>[t.id,t.code]));
  const tabs=$$('[data-tools-tab]');
  for(const tab of tabs){const id=tab.dataset.toolsTab,panel=$('[data-tools-panel="'+id+'"]');tab.id=prefix+'-tab-'+id;tab.setAttribute('aria-controls',prefix+'-panel-'+id);panel.id=prefix+'-panel-'+id;panel.setAttribute('aria-labelledby',tab.id);}
  $('[data-crop-clip]').id=prefix+'-crop-clip';$('[data-crop-art]').setAttribute('clip-path','url(#'+prefix+'-crop-clip)');

  const attributes=(element,attrs)=>Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,String(value)));
  const setText=(element,text)=>{if(element.textContent!==text)element.textContent=text;};
  const setHidden=(element,hidden)=>hidden?element.setAttribute('hidden',''):element.removeAttribute('hidden');
  function cancelFeedback(){for(const animation of feedbackAnimations)animation.cancel();feedbackAnimations.clear();}
  function feedback(elements,event){
    // Repeated keyboard/text input is immediate. Only pointer commits receive a
    // short visual acknowledgement; it never changes the underlying model.
    if(!event?.detail||reducedMotion||!inView||doc.hidden||disposed)return;
    cancelFeedback();
    for(const element of elements){
      if(!element.animate)continue;
      const animation=element.animate([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:190,easing:'cubic-bezier(0.23, 1, 0.32, 1)'});
      feedbackAnimations.add(animation);animation.onfinish=animation.oncancel=()=>feedbackAnimations.delete(animation);
    }
  }
  const previewAllowed=()=>!disposed&&inView&&!doc.hidden&&!reducedMotion&&!editedTarget&&!heldKeys.size&&!drag&&!sceneDrag;
  function cancelPreviewFrame(){previewGeneration++;if(previewFrame)win.cancelAnimationFrame(previewFrame);previewFrame=0;previewPreviousTime=null;}
  function schedulePreview(){const generation=previewGeneration;previewFrame=win.requestAnimationFrame(time=>{if(disposed||generation!==previewGeneration)return;previewTick(time);});}
  function takeOver(){preview=advanceToolsPreview(preview,'takeover');cancelPreviewFrame();renderPlaybackState();}
  function renderPlaybackState(){
    root.dataset.toolsPreview=preview.phase;
    root.dataset.sceneProgress=String(Math.round(sampleToolsPreview(preview).progress*100));
  }
  function seekScene(progress){preview=advanceToolsPreview(preview,'seek',{progress});cancelPreviewFrame();renderScene();}
  function previewTick(time){
    previewFrame=0;
    if(!previewAllowed()){syncActive();return;}
    if(preview.phase!=='running')return;
    const delta=previewPreviousTime===null?0:Math.min(100,time-previewPreviousTime);previewPreviousTime=time;
    const elapsed=Math.max(0,Math.min(TOOLS_PREVIEW_DURATION,preview.elapsed+delta*previewDirection));
    if(elapsed>=TOOLS_PREVIEW_DURATION)previewDirection=-1;else if(elapsed<=0)previewDirection=1;
    preview={phase:'running',elapsed};renderScene();schedulePreview();
  }
  // Merely hovering or focusing the scene is observation, not a playback
  // command. Yield only while accepted gestures or actual field edits own it.
  on(root,'input',event=>{
    if(!event.target.matches('input,select,textarea'))return;
    editedTarget=event.target;takeOver();
  },{capture:true});
  on(root,'change',event=>{if(event.target===editedTarget){editedTarget=null;syncActive();}});
  on(root,'focusout',event=>{if(event.target===editedTarget){editedTarget=null;syncActive();}});
  on(doc,'keyup',event=>{if(heldKeys.delete(event.key))syncActive();});
  if(typeof win.addEventListener==='function')on(win,'blur',event=>{if(event.target!==win)return;heldKeys.clear();editedTarget=null;syncActive();});
  if(motionQuery?.addEventListener)on(motionQuery,'change',event=>{reducedMotion=event.matches;cancelFeedback();syncActive();});
  function renderScene(){
    const sample=sampleToolsPreview(preview),layers=currentTab==='layers',names=sceneNames($('[data-scene-prefix]').value),layerRecords=sceneLayerRecords(preview);
    root.dataset.toolsCurrent=currentTab;stage.dataset.sceneStep=sample.step;
    for(const control of $$('[data-tools-control]'))control.hidden=control.dataset.toolsControl!==currentTab;
    for(const element of $$('[data-scene-crop-only],[data-crop-mask],[data-crop-boundary],[data-parent-reference],[data-crop-handle]'))setHidden(element,currentTab!=='composition');
    for(const element of $$('[data-scene-piece]')){
      const part=SCENE_PARTS.find(item=>item.id===element.dataset.scenePiece),offset=sceneOffsets.get(part.id);
      element.dataset.sceneOffsetX=String(offset.x);element.dataset.sceneOffsetY=String(offset.y);
      element.setAttribute('transform','translate('+(layers?part.dx*sample.spread+offset.x:0)+' '+(layers?part.dy*sample.spread+offset.y:0)+')');
      element.setAttribute('opacity',layers&&sceneIsolated&&part.id!==sceneSelected?'.12':currentTab==='scripts'?'.28':'1');
      element.dataset.selected=String(layers&&part.id===sceneSelected);
      element.setAttribute('tabindex',layers?'0':'-1');
      if(layers){element.setAttribute('role','button');element.setAttribute('aria-pressed',String(part.id===sceneSelected));element.setAttribute('aria-label',part.label+'；可拖动，方向键微调，Home 复位');}
      else{element.removeAttribute('role');element.removeAttribute('aria-pressed');element.removeAttribute('aria-label');}
    }
    setHidden($('[data-scene-layer-labels]'),!layers);setHidden($('[data-scene-layer-identity]'),!layers);
    for(const label of $$('[data-scene-layer-label]')){
      const record=layerRecords.find(item=>item.id===label.dataset.sceneLayerLabel),part=SCENE_PARTS.find(item=>item.id===record.id),offset=sceneOffsets.get(record.id);
      label.setAttribute('transform','translate('+(part.dx*sample.spread+offset.x)+' '+(part.dy*sample.spread+offset.y)+')');
      label.setAttribute('opacity',layers&&sceneIsolated&&record.id!==sceneSelected?'.12':'1');
      label.dataset.tagged=String(record.tagged);label.dataset.selected=String(record.id===sceneSelected);
      setText(label.querySelector('[data-scene-layer-name]'),record.displayName);
    }
    const layerRecord=layerRecords.find(item=>item.id===sceneSelected);
    $('[data-scene-layer-identity]').dataset.tagged=String(layerRecord.tagged);
    for(const field of $$('[data-scene-layer-field]')){const key=field.dataset.sceneLayerField;setText(field,key==='name'?layerRecord.displayName:layerRecord.tagged?layerRecord[key]:'未整理');}
    for(const pick of $$('[data-scene-select]'))pick.setAttribute('aria-pressed',String(pick.dataset.sceneSelect===sceneSelected));
    $('[data-tool-action="scene-isolate"]').setAttribute('aria-pressed',String(sceneIsolated));
    $('[data-tool-action="scene-isolate"]').textContent=sceneIsolated?'显示全部':'只看所选';
    setHidden($('[data-scene-names]'),currentTab!=='text');
    for(const name of $$('[data-scene-name]')){const index=Number(name.dataset.sceneName),full=index<sample.renamed?names[index].name:SCENE_PARTS[index].name;name.textContent=full.length>11?full.slice(0,10)+'…':full;name.setAttribute('aria-label',full);}
    setHidden($('[data-scene-snippet]'),currentTab!=='scripts');
    if(currentTab==='scripts'&&sample.used&&!usedSnippet)usedSnippet={id:sceneSnippet,code:sceneSnippet==='editor'?'Duik.Rig.arm();':'value;'};
    const picked=sample.used&&usedSnippet?usedSnippet:{id:sceneSnippet,code:sceneSnippet==='editor'?'Duik.Rig.arm();':'value;'};
    $('[data-scene-snippet]').setAttribute('transform','translate('+(80+300*sample.spread)+' '+(292-92*sample.spread)+')');
    $('[data-scene-code]').textContent=picked.code;
    $('[data-scene-snippet-label]').textContent=sample.used?'已取用 · '+(picked.id==='editor'?'手臂绑定':'属性值'):'已收藏 · '+(picked.id==='editor'?'手臂绑定':'属性值');
    for(const pick of $$('[data-scene-task]'))pick.setAttribute('aria-pressed',String(pick.dataset.sceneTask===sceneSnippet));
    $('[data-tool-action="scene-copy"]').disabled=!usedSnippet;
    const result={composition:['裁剪预合成',sample.step==='after'?'边界收紧 · 画面不移位':'拖动橙色四角'],layers:['名称与标记',sample.renamed===4?'四层已整理':sample.renamed?sample.renamed+' / 4 层已整理':'从示例名称开始'],text:['批量命名',sample.renamed+' / 4 个名称已整理'],scripts:['片段取用',sample.used?'文本已取用 · 未执行':'从收藏到编辑']}[currentTab];
    setText($('[data-scene-heading]'),result[0]);setText($('[data-scene-result]'),result[1]);
    const status={composition:'拖动四角，或用方向键调整。十字参考点始终不动。',layers:(layerRecord.tagged?layerRecord.name+'：'+layerRecord.group+'组，'+(layerRecord.side==='无'?'无侧别':layerRecord.side+'侧')+'，'+layerRecord.type+'。':'选中 '+layerRecord.sourceName+'，整理后查看标记。')+'预设名称示意，不识别图像。',text:'只改变这四个名称，不改画面，也不改表达式引用。',scripts:sample.used?(picked.id==='editor'?'已取用文本。手臂绑定需先在 AE 中初始化 API 并选择骨骼。':'已取用属性值表达式，只保留文本，未应用到 AE 属性。'):'选择一个收藏片段，再取用；网页不会执行 AE 脚本。'}[currentTab];
    setText($('[data-scene-status]'),status);renderPlaybackState();renderCrop();
  }
  function renderCrop(){
    const m=crop.mask,g=cropGeometry(currentTab==='composition'?crop:{...crop,cropped:false});
    let b=g.bounds;
    if(currentTab==='composition'&&preview.phase!=='idle'){
      const t=sampleToolsPreview(preview).spread;
      b={x:m.x*t,y:m.y*t,width:CROP_CANVAS.width+(m.width-CROP_CANVAS.width)*t,height:CROP_CANVAS.height+(m.height-CROP_CANVAS.height)*t};
    }
    attributes($('[data-crop-boundary]'),{x:CROP_CANVAS.x+b.x,y:CROP_CANVAS.y+b.y,width:b.width,height:b.height});
    attributes($('[data-crop-mask]'),{x:CROP_CANVAS.x+m.x,y:CROP_CANVAS.y+m.y,width:m.width,height:m.height});
    attributes($('[data-crop-clip-box]'),b);
    $('[data-crop-origin]').setAttribute('transform','translate('+(CROP_CANVAS.x+b.x)+' '+(CROP_CANVAS.y+b.y)+')');
    $('[data-crop-offset]').setAttribute('transform','translate('+(-b.x)+' '+(-b.y)+')');
    for(const handle of $$('[data-crop-handle]')){const c=handle.dataset.cropHandle;handle.setAttribute('transform','translate('+(CROP_CANVAS.x+m.x+(c.includes('e')?m.width:0))+' '+(CROP_CANVAS.y+m.y+(c.includes('s')?m.height:0))+')');}
    for(const key of ['width','height']){const input=$('[data-crop-input="'+key+'"]');input.value=String(m[key]);input.max=String(key==='width'?CROP_CANVAS.width-m.x:CROP_CANVAS.height-m.y);$('[data-crop-'+key+'-label]').textContent=m[key]+' px';}
    $('[data-crop-size]').textContent=Math.round(b.width)+' × '+Math.round(b.height);
    $('[data-crop-mask-size]').textContent=m.width+' × '+m.height;
    $('[data-crop-svg-size]').textContent='预合成 '+Math.round(b.width)+' × '+Math.round(b.height);
    $('[data-crop-reference]').textContent=g.reference.x+', '+g.reference.y+' · 不变';
    const cropped=b.width<CROP_CANVAS.width||b.height<CROP_CANVAS.height;
    $('[data-tool-action="crop-before"]').setAttribute('aria-pressed',String(!cropped));
    $('[data-tool-action="crop-after"]').setAttribute('aria-pressed',String(cropped));
    $('[data-crop-scene]').dataset.cropMode=cropped?'after':'before';
    setText($('[data-crop-result-note]'),cropped?'画面位置保持不变':'调整橙色边界');
    setText($('[data-crop-status]'),cropped?'边界已裁剪，画面仍在原位。':'拖动角点，或聚焦角点后使用方向键。');
  }
  const svg=$('[data-crop-svg]');
  function localPoint(event){const matrix=svg.getScreenCTM();if(!matrix)return null;const p=new win.DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());return {x:p.x-CROP_CANVAS.x,y:p.y-CROP_CANVAS.y};}
  const keepInStage=(point,id)=>({x:Math.max(-60,Math.min(60,point.x)),y:Math.max(-35,Math.min(id==='title'?24:35,point.y))});
  on(svg,'pointerdown',event=>{
    if(drag||sceneDrag||event.button!==0||event.isPrimary===false)return;
    const handle=event.target.closest('[data-crop-handle]'),piece=event.target.closest('[data-scene-piece]');
    if(currentTab==='composition'&&handle){drag={id:event.pointerId,corner:handle.dataset.cropHandle};}
    else if(currentTab==='layers'&&piece){const point=localPoint(event);if(!point)return;sceneSelected=piece.dataset.scenePiece;sceneDrag={id:event.pointerId,part:sceneSelected,start:point,offset:{...sceneOffsets.get(sceneSelected)}};renderScene();}
    else return;
    takeOver();svg.setPointerCapture(event.pointerId);event.preventDefault();
  });
  on(svg,'pointermove',event=>{
    const point=localPoint(event);if(!point)return;
    if(drag?.id===event.pointerId){crop=dragCropCorner(crop,drag.corner,point);renderCrop();}
    if(sceneDrag?.id===event.pointerId){sceneOffsets.set(sceneDrag.part,keepInStage({x:sceneDrag.offset.x+point.x-sceneDrag.start.x,y:sceneDrag.offset.y+point.y-sceneDrag.start.y},sceneDrag.part));renderScene();}
  });
  const releaseDrag=()=>{const id=drag?.id??sceneDrag?.id;if(id!==undefined&&svg.hasPointerCapture(id))svg.releasePointerCapture(id);drag=null;sceneDrag=null;};
  const endDrag=event=>{if(drag?.id===event.pointerId||sceneDrag?.id===event.pointerId){releaseDrag();syncActive();}};
  on(svg,'pointerup',endDrag);on(svg,'pointercancel',endDrag);on(svg,'lostpointercapture',()=>{drag=null;sceneDrag=null;syncActive();});
  on(svg,'keydown',event=>{
    const handle=event.target.closest('[data-crop-handle]'),piece=event.target.closest('[data-scene-piece]'),delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key],n=event.shiftKey?10:2;
    if(currentTab==='composition'&&handle&&delta){heldKeys.add(event.key);takeOver();event.preventDefault();const c=handle.dataset.cropHandle,m=crop.mask;crop=dragCropCorner(crop,c,{x:m.x+(c.includes('e')?m.width:0)+delta[0]*n,y:m.y+(c.includes('s')?m.height:0)+delta[1]*n});renderCrop();}
    if(currentTab==='layers'&&piece&&(delta||['Enter',' ','Home'].includes(event.key))){heldKeys.add(event.key);takeOver();event.preventDefault();sceneSelected=piece.dataset.scenePiece;const offset=sceneOffsets.get(sceneSelected);if(delta)sceneOffsets.set(sceneSelected,keepInStage({x:offset.x+delta[0]*n,y:offset.y+delta[1]*n},sceneSelected));if(event.key==='Home')sceneOffsets.set(sceneSelected,{x:0,y:0});renderScene();}
  });
  for(const input of $$('[data-crop-input]'))on(input,'input',()=>{takeOver();crop=updateCropMask(crop,{[input.dataset.cropInput]:Number(input.value)});renderCrop();});
  on($('[data-scene-prefix]'),'input',()=>seekScene(1));

  function syncActive(){
    if(disposed)return;
    if(rig&&!rig.getState().destroyed)rig.setActive(currentTab==='layers'&&layerWorkbench.open&&rigInView&&!doc.hidden);
    if(!previewAllowed()){
      preview=advanceToolsPreview(preview,'stop');cancelPreviewFrame();cancelFeedback();
      if(!inView||doc.hidden||reducedMotion){releaseDrag();heldKeys.clear();}
    }else if(preview.phase!=='running'){
      preview={...preview,phase:'running'};
      if(preview.elapsed>=TOOLS_PREVIEW_DURATION)previewDirection=-1;
      else if(preview.elapsed<=0)previewDirection=1;
      if(!previewFrame)schedulePreview();
    }
    renderPlaybackState();
  }
  on(layerWorkbench,'toggle',()=>{if(layerWorkbench.open&&currentTab==='layers')ensureRig();syncActive();});
  function renderLayers(force=false){
    if(!rig)return;const state=rig.getState(),visible=new Set(state.visibleParts);
    const filtered=filterParts(parts,$('[data-layer-query]').value,$('[data-layer-group]').value);
    $('[data-layer-count]').textContent=filtered.length+' / '+parts.length+' 张 · '+visible.size+' 可见';
    const signature=JSON.stringify([state.selected,state.visibleParts,filtered.map(p=>p.id)]);
    if(!force&&signature===layerSignature)return;layerSignature=signature;
    const focused=doc.activeElement?.dataset,focusId=focused?.partSelect||focused?.partVisibility,focusKind=focused?.partSelect?'part-select':'part-visibility';
    $('[data-layer-list]').innerHTML=filtered.length?filtered.map(part=>'<li class="duik-tools-layer-row'+(part.id===state.selected?' is-selected':'')+'"><button type="button" data-part-select="'+esc(part.id)+'" aria-pressed="'+(part.id===state.selected)+'"><span>'+esc(part.label)+'</span><small>'+esc(part.id)+' · '+esc(part.group)+'</small></button><button type="button" data-part-visibility="'+esc(part.id)+'" aria-pressed="'+visible.has(part.id)+'" aria-label="'+(visible.has(part.id)?'隐藏':'显示')+esc(part.label)+'">'+(visible.has(part.id)?'可见':'已隐藏')+'</button></li>').join(''):'<li class="duik-tools-empty">没有匹配的图层。清空筛选即可恢复列表。</li>';
    if(focusId)$('[data-'+focusKind+'="'+focusId+'"]')?.focus({preventScroll:true});
    const part=parts.find(p=>p.id===state.selected);
    $('[data-layer-status]').textContent=(part?'已选 '+part.label+'。':'')+'点击显隐，观察对应部件。';
  }
  async function ensureRig(){
    if(rig){syncActive();return;}if(rigPending)return rigPending;
    rigPending=(async()=>{try{
      $('[data-layer-status]').textContent='正在加载已确认角色与真实透明图层…';
      await import('../character-rig.js');await win.customElements.whenDefined('character-rig');if(disposed)return;
      character=doc.createElement('character-rig');character.setAttribute('src',new URL('../riglab-project/rig.json',import.meta.url).href);character.setAttribute('interaction','drag');character.setAttribute('controls','visible');character.setAttribute('aria-label','已确认角色的图层管理演示');
      $('[data-tools-character-slot]').append(character);const instance=await character.ready;if(disposed){character.remove();return;}
      if(instance.getState().sourceSha256!==LOCKED_CHARACTER_SHA||instance.getState().partCount!==26){character.remove();throw Error('角色身份或图层索引不匹配，已停止加载');}
      rig=instance;parts=rig.getParts();rig.selectPart(selected);rig.configure({showMesh:true});
      $('[data-layer-group]').innerHTML='<option value="all">全部分组</option>'+[...new Set(parts.map(p=>p.group))].map(group=>'<option value="'+esc(group)+'">'+esc(group)+'</option>').join('');
      on(character,'rig-change',()=>{if(!disposed)renderLayers();});renderLayers(true);syncActive();
    }catch(error){if(!disposed){$('[data-layer-status]').textContent='角色暂时无法载入：'+error.message+'。可先使用其它工具或阅读文档。';$('[data-layer-list]').innerHTML='<li class="duik-tools-empty">载入失败，重新进入图层页可重试。</li>';character?.remove();character=null;rig=null;}}finally{rigPending=null;}})();
    return rigPending;
  }
  for(const [selector,type] of [['[data-layer-query]','input'],['[data-layer-group]','change']])on($(selector),type,()=>renderLayers(true));
  on($('[data-layer-list]'),'click',event=>{if(!rig)return;const select=event.target.closest('[data-part-select]'),visibility=event.target.closest('[data-part-visibility]');if(select){selected=select.dataset.partSelect;rig.selectPart(selected);}if(visibility){const id=visibility.dataset.partVisibility;rig.setVisible(id,!rig.getState().visibleParts.includes(id));}renderLayers(true);});

  const textScope=()=>textMode==='rename'?'name':$('[data-text-scope]').value;
  function proposal(){return textMode==='rename'?renameSamples(textRows,{prefix:$('[data-text-prefix]').value,start:$('[data-text-start]').value}):replaceSamples(textRows,{find:$('[data-text-find]').value,replacement:$('[data-text-replacement]').value,scope:textScope()});}
  function renderText(applied=false){
    const scope=textScope(),before=applied&&lastApplied?lastApplied.before:textRows,after=applied&&lastApplied?lastApplied.after:proposal();
    const count=changedSampleCount(before,after,scope);
    $('[data-text-rows]').innerHTML=after.map((row,index)=>textRow(row,index,before,scope)).join('');
    $('[data-text-before-heading]').textContent=applied?'操作前':'当前文本';$('[data-text-after-heading]').textContent=applied?'操作后':'结果预览';
    $('[data-tool-action="text-undo"]').disabled=textHistory.length===0;
    $('[data-tool-action="text-apply"]').disabled=changedSampleCount(textRows,proposal(),scope)===0;
    $('[data-text-status]').textContent=(applied?'已更新 '+count+' 个样本，可撤销。':count+' 处将改变，仅处理网页样本。');
  }
  for(const input of $$('[data-text-prefix],[data-text-start],[data-text-find],[data-text-replacement],[data-text-scope]'))on(input,input.tagName==='SELECT'?'change':'input',()=>{lastApplied=null;renderText();});
  function setTextMode(mode){textMode=mode;lastApplied=null;$('[data-text-rename]').hidden=mode!=='rename';$('[data-text-replace]').hidden=mode!=='replace';$('[data-tool-action="text-rename-mode"]').setAttribute('aria-pressed',String(mode==='rename'));$('[data-tool-action="text-replace-mode"]').setAttribute('aria-pressed',String(mode==='replace'));renderText();}

  function renderScript(){
    const task=SCRIPT_TASKS.find(t=>t.id===scriptTask);
    $('[data-script-title]').textContent=task.label;$('[data-script-description]').textContent=task.description;$('[data-script-source]').textContent=task.source;$('[data-script-code]').value=drafts.get(task.id);$('[data-script-docs]').href=task.docs;
    for(const item of $$('[data-script-task]'))item.setAttribute('aria-pressed',String(item.dataset.scriptTask===task.id));
    $('[data-script-status]').textContent='不会在网页中执行 AE 脚本。';renderCodeCount();
  }
  function renderCodeCount(){const value=$('[data-script-code]').value,task=SCRIPT_TASKS.find(t=>t.id===scriptTask);$('[data-script-count]').textContent=value.split('\n').length+' 行 / '+value.length+' 字符';$('[data-script-source]').textContent=task.source+(value!==task.code?' · 已在网页修改':'');}
  on($('[data-script-code]'),'input',()=>{drafts.set(scriptTask,$('[data-script-code]').value);renderCodeCount();$('[data-script-status]').textContent='修改仅保留在此页面，可复制后在 AE 中处理。';});
  on($('[data-script-tasks]'),'click',event=>{const target=event.target.closest('[data-script-task]');if(target){scriptTask=target.dataset.scriptTask;renderScript();}});
  on($('[data-script-query]'),'input',()=>{const query=$('[data-script-query]').value.trim().toLocaleLowerCase();let count=0;for(const item of $$('[data-script-task]')){const task=SCRIPT_TASKS.find(t=>t.id===item.dataset.scriptTask),match=(task.label+' '+task.description).toLocaleLowerCase().includes(query);item.hidden=!match;if(match)count++;}$('[data-script-empty]').hidden=count>0;});

  function selectTab(id,focus=false){
    const tab=TOOL_TABS.find(t=>t.id===id);if(!tab)return;
    if(currentTab!==id){takeOver();releaseDrag();editedTarget=null;heldKeys.clear();preview=createToolsPreview();}
    currentTab=id;
    for(const item of tabs){const active=item.dataset.toolsTab===id;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;if(active&&focus)item.focus({preventScroll:true});}
    for(const panel of $$('[data-tools-panel]'))panel.hidden=panel.dataset.toolsPanel!==id;
    $('[data-tools-title]').textContent=tab.title;$('[data-tools-description]').textContent=tab.description;$('[data-tools-docs]').href=tab.docs;
    cancelFeedback();if(id==='layers'&&layerWorkbench.open)ensureRig();else if(rig)rig.pause();renderScene();syncActive();
  }
  on($('[role="tablist"]'),'click',event=>{const tab=event.target.closest('[data-tools-tab]');if(tab){takeOver();selectTab(tab.dataset.toolsTab);feedback([$('[data-tools-panel="'+tab.dataset.toolsTab+'"]')],event);}});
  on($('[role="tablist"]'),'keydown',event=>{const index=tabs.indexOf(event.target);if(index<0)return;let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(tabs[next].dataset.toolsTab,true);});
  on(root,'click',async event=>{
    const action=event.target.closest('[data-tool-action]')?.dataset.toolAction;if(!action)return;
    takeOver();
    if(action==='scene-layout-reset'){sceneIsolated=false;for(const part of SCENE_PARTS)sceneOffsets.set(part.id,{x:0,y:0});renderScene();}
    if(action==='scene-select'){sceneSelected=event.target.closest('[data-scene-select]').dataset.sceneSelect;renderScene();}
    if(action==='scene-isolate'){sceneIsolated=!sceneIsolated;renderScene();}
    if(action==='scene-rename')seekScene(1);
    if(action==='scene-snippet'){sceneSnippet=event.target.closest('[data-scene-task]').dataset.sceneTask;usedSnippet=null;seekScene(0);}
    if(action==='scene-use'){usedSnippet={id:sceneSnippet,code:sceneSnippet==='editor'?'Duik.Rig.arm();':'value;'};seekScene(1);}
    if(action==='scene-copy'&&usedSnippet){try{if(!win.navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await win.navigator.clipboard.writeText(usedSnippet.code);if(!disposed)$('[data-scene-status]').textContent='已复制取用的片段，未执行 AE 脚本。';}catch{if(!disposed){scriptTask=usedSnippet.id;drafts.set(scriptTask,usedSnippet.code);renderScript();$('[data-tools-workbench="scripts"]').open=true;$('[data-script-code]').focus();$('[data-script-code]').select();$('[data-scene-status]').textContent='复制未获许可，请在已展开的编辑区手动复制。';}}}
    if(action==='crop-before'||action==='crop-after'){crop={...crop,cropped:action==='crop-after'};seekScene(crop.cropped?1:0);}
    if(action==='crop-reset'){crop=createCropState();preview=createToolsPreview();renderScene();}
    if(action==='layer-left'){$('[data-layer-query]').value='';if(rig){$('[data-layer-group]').value='左臂';selected='fore-l';rig.selectPart(selected);renderLayers(true);}}
    if(action==='layer-clear'){$('[data-layer-query]').value='';$('[data-layer-group]').value='all';renderLayers(true);}
    if(action==='layer-all'&&rig){rig.showAll();renderLayers(true);}
    if(action==='layer-controls'&&rig){const show=!rig.getState().showControls;rig.setControls(show);const b=$('[data-tool-action="layer-controls"]');b.textContent=show?'隐藏控制器':'显示控制器';b.setAttribute('aria-pressed',String(show));}
    if(action==='layer-pose'&&rig)rig.setPose({head:4,body:-2,handL:[-14,-10]});
    if(action==='layer-reset'&&rig)rig.reset(false);
    if(action==='text-rename-mode')setTextMode('rename');if(action==='text-replace-mode')setTextMode('replace');
    if(action==='text-apply'){const next=proposal();textHistory.push(textRows.map(row=>({...row})));lastApplied={before:textRows,after:next};textRows=next;renderText(true);feedback($$('[data-text-result]'),event);}
    if(action==='text-undo'&&textHistory.length){textRows=textHistory.pop();lastApplied=null;renderText();$('[data-text-status]').textContent='已撤销上一次样本修改。';}
    if(action==='text-reset'){textRows=freshTextSamples();textHistory=[];lastApplied=null;renderText();$('[data-text-status]').textContent='已恢复原始网页样本。';}
    if(action==='script-reset'){drafts.set(scriptTask,SCRIPT_TASKS.find(t=>t.id===scriptTask).code);renderScript();}
    if(action==='script-copy'){try{if(!win.navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await win.navigator.clipboard.writeText($('[data-script-code]').value);if(!disposed)$('[data-script-status]').textContent='已复制当前代码；未执行脚本。';}catch{if(!disposed){$('[data-script-code]').focus();$('[data-script-code]').select();$('[data-script-status]').textContent='复制未获许可，请手动复制已选中的代码。';}}}
    syncActive();
  });
  const observer=win.IntersectionObserver?new win.IntersectionObserver(entries=>{if(disposed)return;for(const entry of entries){const visible=entry.isIntersecting&&entry.intersectionRatio>=.65;if(entry.target===stage)inView=visible;if(entry.target===$('[data-tools-character-slot]'))rigInView=visible;}syncActive();},{threshold:[0,.65]}):null;
  observer?.observe(stage);observer?.observe($('[data-tools-character-slot]'));on(doc,'visibilitychange',syncActive);
  renderCrop();setTextMode('rename');renderScript();selectTab(defaultTool.id);
  $('[data-tool-action="layer-controls"]').textContent='隐藏控制器';$('[data-tool-action="layer-controls"]').setAttribute('aria-pressed','true');
  const cleanup=()=>{if(disposed)return;disposed=true;cancelPreviewFrame();cancelFeedback();life.abort();observer?.disconnect();releaseDrag();character?.remove();rig=null;mounted.delete(root);};
  mounted.set(root,cleanup);return cleanup;
}
