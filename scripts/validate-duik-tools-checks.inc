// Insert inside validate-duik-experience.mjs's existing acceptance block,
// replacing the previous Tools block. No browser/service is launched here.
// Uses existing CDP helpers; only pointer/keyboard input changes user controls.
// Reduced motion is a same-page check, not a claim of cold-navigation coverage.
{
  const toolsRoot='[data-tools-root]';
  const tools=child=>toolsRoot+' '+child;
  const toolsPanel=id=>tools('[data-tools-panel="'+id+'"]');
  const toolsType=async(selector,value)=>{await focus(selector);await evaluate(query(selector)+'.select()');await send('Input.insertText',{text:value});};
  const toolsReadCrop=()=>evaluate('(()=>{const r='+query(toolsRoot)+';const matrix=e=>{const m=e.getCTM();return [m.a,m.b,m.c,m.d,m.e,m.f]};const dimensions=e=>Object.fromEntries(["x","y","width","height"].map(k=>[k,Number(e.getAttribute(k))]));return {mask:dimensions(r.querySelector("[data-crop-mask]")),boundary:dimensions(r.querySelector("[data-crop-boundary]")),reference:matrix(r.querySelector("[data-parent-reference]")),art:matrix(r.querySelector("[data-crop-art]")),preview:r.dataset.toolsPreview,progress:Number(r.dataset.sceneProgress),mode:r.querySelector("[data-crop-scene]").dataset.cropMode}})()');
  const toolsReadPreview=()=>evaluate('(()=>{const r='+query(toolsRoot)+';return {phase:r.dataset.toolsPreview,tool:r.dataset.toolsCurrent,progress:Number(r.dataset.sceneProgress),step:r.querySelector("[data-tools-stage]").dataset.sceneStep,playbackButtons:r.querySelectorAll("[data-scene-play]").length,progressControls:r.querySelectorAll("input[data-scene-progress],.duik-tools-transport").length}})()');
  const toolsWorkbench=async(id,open=true)=>{const selector=tools('[data-tools-workbench="'+id+'"]');if(await evaluate(query(selector)+'.open')!==open)await click(selector+' > summary');await waitFor(query(selector)+'.open==='+open,'Tools '+id+' workbench '+(open?'opens':'closes'));};
  const toolsPress=async point=>{await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...point});};
  const releaseTools=async()=>{const before=await evaluate('scrollY');await toolsPress({x:2,y:2});const after=await evaluate('scrollY');assert(Math.abs(after-before)<2,'Giving the scene back must not move the page');return {before,after};};

  await step('Tools leads with automatic layer management and keeps detailed workbenches and references closed',async()=>{
    await reveal(tools('[data-tools-stage]'));
    assert.equal((await toolsReadPreview()).tool,'layers','The first visit must not need a tab click to reach layer management');
    assert.equal(await evaluate(query(tools('[data-tools-tab="layers"]'))+'.getAttribute("aria-selected")'),'true');
    assert.equal(await evaluate(query(tools('[data-tools-docs]'))+'.getAttribute("href")'),'/docs/guide/tools/layers');
    assert.deepEqual(await evaluate('[...'+query(toolsRoot)+'.querySelectorAll("[data-tools-tab]")].map(tab=>tab.dataset.toolsTab)'),['layers','text','scripts','composition']);
    const structure=await evaluate('(()=>{const r='+query(toolsRoot)+',s=r.querySelector("[data-tools-stage]");const detailed=["[data-crop-input]","[data-tools-character-slot]","[data-text-rows]","[data-script-code]"];return {stages:r.querySelectorAll("[data-tools-stage]").length,stageInDetails:!!s?.closest("details"),figures:s?.querySelectorAll("figure").length,pieces:s?.querySelectorAll("[data-scene-piece]").length,controls:[...s.querySelectorAll("[data-tools-control]")].map(c=>({id:c.dataset.toolsControl,visible:!c.hidden})),progressControls:s?.querySelectorAll("input[data-scene-progress],.duik-tools-transport").length,panels:[...r.querySelectorAll("[data-tools-panel]")].map((p,i)=>{const work=p.querySelector(detailed[i]),d=p.querySelector("[data-tools-reference]");return {id:p.dataset.toolsPanel,visible:!p.hidden,work:!!work,workInDetails:!!work?.closest("details"),workOpen:work?.closest("details")?.open,reference:!!d,referenceOpen:d?.open,workFirst:!!(work&&d&&(work.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_FOLLOWING))}}),references:r.querySelectorAll("[data-tools-reference]").length,boundary:r.querySelector(".duik-tools-footer").textContent}})()');
    assert.deepEqual(structure.panels.map(p=>p.id),['composition','layers','text','scripts']);
    assert.equal(structure.stages,1);assert.equal(structure.stageInDetails,false);assert.equal(structure.figures,2);assert.equal(structure.pieces,4);assert.equal(structure.progressControls,0);
    assert.deepEqual(structure.controls.map(c=>c.id),['composition','layers','text','scripts']);assert.equal(structure.controls.filter(c=>c.visible).length,1);
    assert.equal(structure.references,4);assert.equal(structure.panels.filter(p=>p.visible).length,1);
    assert(structure.panels.every(p=>p.work&&p.workInDetails&&!p.workOpen&&p.reference&&!p.referenceOpen&&p.workFirst));
    assert(structure.boundary.includes('不连接 AE 工程'));report.toolsStructure=structure;
  });

  await step('Tools tab changes start their authored demonstration without a player or progress slider',async()=>{
    const original=await evaluate(query(tools('.duik-tools-before svg > g:not([data-scene-crop-only])'))+'.outerHTML');report.toolsAutomaticTabs=[];
    for(const id of ['composition','layers','text','scripts']){
      await click(tools('[data-tools-tab="'+id+'"]'));await reveal(tools('[data-tools-stage]'));
      await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','Tools '+id+' starts without playback input');
      const before=await toolsReadPreview();assert.equal(before.tool,id);assert.equal(before.progressControls,0);assert.equal(before.playbackButtons,0);
      await waitFor(query(tools('[data-tools-stage]'))+'.dataset.sceneStep==="after"','Tools '+id+' reaches its result automatically');const result=await toolsReadPreview();
      assert.equal(result.phase,'running');assert.equal(result.step,'after');
      assert.equal(await evaluate(query(tools('.duik-tools-before svg > g:not([data-scene-crop-only])'))+'.outerHTML'),original,'Tool states never rewrite the original artwork');
      report.toolsAutomaticTabs.push({id,before,result});
    }
  });

  await step('Tools automatically traverses both directions without playback buttons or a reset cut',async()=>{
    await click(tools('[data-tools-tab="text"]'));await click(tools('[data-tools-tab="layers"]'));
    await reveal(tools('[data-tools-stage]'));const scroll=await releaseTools();
    await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','visible Tools automatic loop');
    assert.equal((await toolsReadPreview()).playbackButtons,0);assert.equal((await toolsReadPreview()).progressControls,0);
    await evaluate('(()=>{const root='+query(toolsRoot)+',surface=root.querySelector("[data-tools-stage]");window.__toolsPreviewSteps=[surface.dataset.sceneStep];window.__toolsPreviewProgress=[];const observer=new MutationObserver(()=>{const step=surface.dataset.sceneStep;if(window.__toolsPreviewSteps.at(-1)!==step)window.__toolsPreviewSteps.push(step);window.__toolsPreviewProgress.push(Number(root.dataset.sceneProgress))});observer.observe(root,{attributes:true,subtree:true,attributeFilter:["data-scene-step","data-scene-progress"]});window.__removeToolsPreviewProbe=()=>observer.disconnect()})()');
    try{
      await waitFor('window.__toolsPreviewSteps.includes("after")&&window.__toolsPreviewSteps.at(-1)==="before"','Tools result returns through the authored sequence');
      const steps=await evaluate('window.__toolsPreviewSteps'),progress=await evaluate('window.__toolsPreviewProgress');
      assert(['before','working','after'].every(value=>steps.includes(value)));assert(progress.some((value,i)=>i&&value<progress[i-1]));
      assert.equal((await toolsReadPreview()).phase,'running');report.toolsPreview={steps,progress,scroll};
    }finally{await evaluate('window.__removeToolsPreviewProbe?.()');}
  });

  await step('Tools yields to real parameter edits but not hover or passive focus and resumes after offscreen return',async()=>{
    await click(tools('[data-tools-tab="text"]'));
    await reveal(tools('[data-tools-stage]'));await releaseTools();await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','Tools loop visible');
    await focus(tools('[data-scene-prefix]'));const focused=await toolsReadPreview();assert.equal(focused.phase,'running');
    await waitFor('Number('+query(toolsRoot)+'.dataset.sceneProgress)!=='+focused.progress,'Passive focus does not stop the loop');
    await toolsType(tools('[data-scene-prefix]'),'演示_');const manual=await toolsReadPreview();assert.equal(manual.phase,'manual');assert.equal(manual.progress,100);
    await delay(250);assert.deepEqual(await toolsReadPreview(),manual,'Actual field editing owns the scene until it finishes');
    await releaseTools();await reveal(tools('[data-tools-stage]'));const visibleScroll=await evaluate('scrollY');
    await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"&&Number('+query(toolsRoot)+'.dataset.sceneProgress)>0','Tools loop resumes when editing finishes');
    await scroll(0);await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="paused"','Tools physical offscreen pauses');
    const offscreen=await toolsReadPreview();await delay(200);assert.deepEqual(await toolsReadPreview(),offscreen);
    await scroll(visibleScroll);await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','Tools actual stage loops again');
    const returned=await toolsReadPreview();await waitFor('Number('+query(toolsRoot)+'.dataset.sceneProgress)!=='+returned.progress,'Tools returns to motion');
    report.toolsTakeover={focused,manual,offscreen,returned,scope:'trusted field editing and actual Lenis scroll; not physical background-tab acceptance'};
    await toolsType(tools('[data-scene-prefix]'),'片头_');await releaseTools();
  });

  await step('Tools real pointer crop changes bounds without moving artwork or parent reference',async()=>{
    // This step also works when selected on its own by LANDING_CHECK_FILTER.
    await click(tools('[data-tools-tab="composition"]'));
    await click(tools('[data-tool-action="crop-reset"]'));
    const hit=await reveal(tools('[data-crop-handle="se"]')),p=hit.point,before=await toolsReadCrop();
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...p});
    for(let i=1;i<=8;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:p.x+32*i/8,y:p.y-24*i/8});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:p.x+32,y:p.y-24});
    const dragged=await toolsReadCrop();assert(dragged.mask.width>before.mask.width);assert(dragged.mask.height<before.mask.height);
    assert.equal(dragged.mask.x,before.mask.x);assert.equal(dragged.mask.y,before.mask.y);
    assert.deepEqual(dragged.reference,before.reference);assert.deepEqual(dragged.art,before.art);
    await click(tools('[data-tool-action="crop-after"]'));const cropped=await toolsReadCrop();
    assert.deepEqual(cropped.boundary,dragged.mask);assert.equal(cropped.mode,'after');
    assert.deepEqual(cropped.reference,before.reference);assert.deepEqual(cropped.art,before.art);
    assert.equal(await text(tools('[data-crop-size]')),dragged.mask.width+' × '+dragged.mask.height);
    await click(tools('[data-tool-action="crop-before"]'));assert.equal(await text(tools('[data-crop-size]')),'640 × 400');
    await click(tools('[data-tool-action="crop-reset"]'));const reset=await toolsReadCrop();
    assert.deepEqual(reset.mask,before.mask);assert.deepEqual(reset.art,before.art);assert.deepEqual(reset.reference,before.reference);
    report.toolsCrop={hit,before,dragged,cropped,reset};
  });

  await step('Tools corner keys move exactly 2 px or Shift 10 px and tabs preserve immediate access',async()=>{
    await click(tools('[data-tools-tab="composition"]'));await click(tools('[data-tool-action="crop-reset"]'));
    await focus(tools('[data-crop-handle="se"]'));const before=await toolsReadCrop();await key('ArrowRight');
    const normal=await toolsReadCrop();assert.equal(normal.mask.width,before.mask.width+2);assert.equal(normal.mask.height,before.mask.height);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40,nativeVirtualKeyCode:40,modifiers:8});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40,nativeVirtualKeyCode:40,modifiers:8});
    const shifted=await toolsReadCrop();assert.equal(shifted.mask.height,normal.mask.height+10);assert.equal(shifted.mask.width,normal.mask.width);
    await delay(350);assert.deepEqual((await toolsReadCrop()).mask,shifted.mask,'The resumed loop cannot overwrite the user-adjusted mask');
    await reveal(tools('[data-tools-stage]'));await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','The loop resumes after the adjustment key is released');
    await focus(tools('[data-tools-tab="layers"]'));await key('End');
    assert.equal(await evaluate(query(tools('[data-tools-tab="composition"]'))+'.getAttribute("aria-selected")'),'true');
    await key('Home');assert.equal(await evaluate(query(toolsPanel('layers'))+'.hidden'),false);
    await click(tools('[data-tools-tab="composition"]'));
    await click(tools('[data-tool-action="crop-reset"]'));
  });

  await step('Tools shared layer pieces accept real drag and keyboard movement with a fixed original reference',async()=>{
    await click(tools('[data-tools-tab="layers"]'));await click(tools('[data-tool-action="scene-layout-reset"]'));
    const piece=tools('[data-scene-piece="title"]'),original=await evaluate(query(tools('.duik-tools-before svg'))+'.outerHTML');
    const read=()=>evaluate('(()=>{const p='+query(piece)+';return {transform:p.getAttribute("transform"),selected:p.getAttribute("aria-pressed"),offset:[Number(p.dataset.sceneOffsetX),Number(p.dataset.sceneOffsetY)]}})()');
    await reveal(tools('[data-tools-stage]'));await waitFor(query(tools('[data-tools-stage]'))+'.dataset.sceneStep==="after"','The automatic layer result is available for direct manipulation');
    const hit=await stableHit(piece),point=hit.point;
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...point});
    const before=await read(),held=await toolsReadPreview();let dragged;
    try{
      assert.equal(held.phase,'manual');await delay(180);assert.deepEqual(await toolsReadPreview(),held,'Accepted pointer ownership stops the demonstration');
      for(let i=1;i<=6;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:point.x+24*i/6,y:point.y-12*i/6});
      dragged=await read();assert.equal(dragged.selected,'true');assert(dragged.offset[0]>before.offset[0]);assert(dragged.offset[1]<before.offset[1]);
    }finally{await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:point.x+24,y:point.y-12});}
    await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','The layer loop resumes after pointer release');
    // Focus the still-visible shape without relocating the document while it is moving.
    await evaluate(query(piece)+'.focus({preventScroll:true})');await key('Home');const reset=await read();assert.deepEqual(reset.offset,[0,0]);
    await key('ArrowRight');const keyed=await read();assert.equal(keyed.offset[0],reset.offset[0]+2);assert.equal(keyed.offset[1],reset.offset[1]);
    await click(tools('[data-tool-action="scene-isolate"]'));assert.equal(await evaluate(query(tools('[data-scene-piece="circle"]'))+'.getAttribute("opacity")'),'.12');
    assert.equal(await evaluate(query(tools('.duik-tools-before svg'))+'.outerHTML'),original);assert.equal(await evaluate(query(tools('[data-tools-workbench="layers"]'))+'.open'),false);
    report.toolsLayerScene={before,dragged,reset,keyed,hit,held,scope:'real pointer input and user offsets separate from automatic scene transforms; webpage geometry, not AE automatic layer alignment'};await click(tools('[data-tool-action="scene-layout-reset"]'));
    assert.deepEqual((await read()).offset,[0,0]);assert.equal((await toolsReadPreview()).phase,'running');
  });

  await step('Tools filters and hides actual 26 PNG parts without changing the chosen pose',async()=>{
    await click(tools('[data-tools-tab="layers"]'));
    await toolsWorkbench('layers');
    try{
    const character=tools('[data-tools-character-slot] character-rig'),rig=query(character)+'.rig';
    await waitFor('!!'+query(character)+'?.rig','Tools approved character');
    assert.equal(await evaluate(rig+'.getState().partCount'),26);
    assert.equal(await evaluate(rig+'.getState().sourceSha256'),'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');
    await click(tools('[data-tool-action="layer-all"]'));await click(tools('[data-tool-action="layer-pose"]'));await click(tools('[data-tool-action="layer-left"]'));
    assert.equal(await evaluate(query(toolsRoot)+'.querySelectorAll("[data-part-select]").length'),4);
    assert.equal(await evaluate(rig+'.getState().selected'),'fore-l');const pose=await evaluate(rig+'.getState().pose');
    await evaluate('window.__duikToolsVisiblePixels='+rig+'.capture()');
    await click(tools('[data-part-visibility="fore-l"]'));
    assert.equal(await evaluate(rig+'.getState().visibleParts.includes("fore-l")'),false);
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);
    await waitFor('window.__duikToolsVisiblePixels!=='+rig+'.capture()','Hiding the actual PNG changes pixels');
    await toolsType(tools('[data-layer-query]'),'fore-l');assert.equal(await evaluate(query(toolsRoot)+'.querySelectorAll("[data-part-select]").length'),1);
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);
    await click(tools('[data-part-visibility="fore-l"]'));assert.equal(await evaluate(rig+'.getState().visibleParts.includes("fore-l")'),true);
    await toolsType(tools('[data-layer-query]'),'no-such-part-xyz');assert.equal(await evaluate(query(toolsRoot)+'.querySelectorAll("[data-part-select]").length'),0);
    await click(tools('[data-tool-action="layer-clear"]'));assert.equal(await evaluate(query(toolsRoot)+'.querySelectorAll("[data-part-select]").length'),26);
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);report.toolsLayers={partCount:26,pose,selected:'fore-l'};
    await click(tools('[data-tool-action="layer-reset"]'));
    }finally{await toolsWorkbench('layers',false);}
  });

  await step('Tools name flow applies and undoes real samples and escapes replacement markup',async()=>{
    await click(tools('[data-tools-tab="text"]'));
    await toolsType(tools('[data-scene-prefix]'),'片头B_');
    assert.deepEqual(await evaluate('[...'+query(toolsRoot)+'.querySelectorAll("[data-scene-name]")].map(e=>e.textContent)'),['片头B_01','片头B_02','片头B_03','片头B_04']);
    assert.equal((await toolsReadPreview()).phase,'manual');await toolsWorkbench('text');
    try{
    await click(tools('[data-tool-action="text-reset"]'));await click(tools('[data-tool-action="text-rename-mode"]'));
    const firstBefore=tools('[data-text-rows] li:first-child .duik-tools-name-before'),firstResult=tools('[data-text-rows] li:first-child [data-text-result]');
    await toolsType(tools('[data-text-prefix]'),'镜头B_');await toolsType(tools('[data-text-start]'),'7');
    assert.equal(await text(firstBefore),'角色_左上臂');assert.equal(await text(firstResult),'镜头B_07');
    await click(tools('[data-tool-action="text-apply"]'));assert.equal(await text(firstResult),'镜头B_07');
    assert.equal(await evaluate(query(tools('[data-tool-action="text-apply"]'))+'.disabled'),true);
    await click(tools('[data-tool-action="text-undo"]'));assert.equal(await text(firstBefore),'角色_左上臂');
    await click(tools('[data-tool-action="text-replace-mode"]'));await toolsType(tools('[data-text-find]'),'角色');
    const replacement='<img src=x onerror="window.__duikToolsTextExecuted=1">';await evaluate('window.__duikToolsTextExecuted=0');
    await toolsType(tools('[data-text-replacement]'),replacement);await click(tools('[data-tool-action="text-apply"]'));
    assert.equal(await text(firstResult),replacement+'_左上臂');
    assert.equal(await evaluate(query(tools('[data-text-rows]'))+'.querySelectorAll("img,script").length'),0);
    assert.equal(await evaluate('window.__duikToolsTextExecuted'),0);
    await click(tools('[data-tool-action="text-undo"]'));assert.equal(await text(firstBefore),'角色_左上臂');
    await toolsType(tools('[data-text-replacement]'),'镜头A');await click(tools('[data-tool-action="text-reset"]'));
    }finally{await toolsWorkbench('text',false);}
  });

  await step('Tools script drafts survive task switches and clipboard copy never executes them',async()=>{
    await click(tools('[data-tools-tab="scripts"]'));
    await click(tools('[data-scene-task="expression"]'));assert.equal(await evaluate(query(tools('[data-tool-action="scene-copy"]'))+'.disabled'),true);
    await click(tools('[data-tool-action="scene-use"]'));assert.equal(await text(tools('[data-scene-code]')),'value;');
    await click(tools('[data-scene-task="editor"]'));assert.equal(await evaluate(query(tools('[data-tool-action="scene-copy"]'))+'.disabled'),true);
    await click(tools('[data-tool-action="scene-use"]'));assert.equal(await text(tools('[data-scene-code]')),'Duik.Rig.arm();');assert((await text(tools('[data-scene-status]'))).includes('初始化 API'));
    await send('Browser.grantPermissions',{origin:new URL(url).origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']},null);
    await click(tools('[data-tool-action="scene-copy"]'));assert.equal(await evaluate('navigator.clipboard.readText()'),'Duik.Rig.arm();');
    await toolsWorkbench('scripts');
    try{
    await click(tools('[data-script-task="editor"]'));
    const code='// Browser acceptance: text only\nwindow.__duikToolsCodeExecuted = 1;\nDuik.Rig.arm();';
    await evaluate('window.__duikToolsCodeExecuted=0');await toolsType(tools('[data-script-code]'),code);
    await click(tools('[data-script-task="expression"]'));await toolsType(tools('[data-script-code]'),'value + 10;');
    await click(tools('[data-script-task="editor"]'));assert.equal(await evaluate(query(tools('[data-script-code]'))+'.value'),code);
    await click(tools('[data-script-task="expression"]'));assert.equal(await evaluate(query(tools('[data-script-code]'))+'.value'),'value + 10;');
    await click(tools('[data-tool-action="script-reset"]'));await click(tools('[data-script-task="editor"]'));
    await send('Browser.grantPermissions',{origin:new URL(url).origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']},null);
    await click(tools('[data-tool-action="script-copy"]'));assert.equal(await evaluate('navigator.clipboard.readText()'),code);
    assert((await text(tools('[data-script-status]'))).includes('未执行'));assert.equal(await evaluate('window.__duikToolsCodeExecuted'),0);
    await click(tools('[data-tool-action="script-reset"]'));
    }finally{await toolsWorkbench('scripts',false);}
  });

  await step('Each Tools reference opens a real proportional local image with provenance',async()=>{
    report.toolsReferences=[];
    for(const id of ['composition','layers','text','scripts']){
      await click(tools('[data-tools-tab="'+id+'"]'));const reference=tools('[data-tools-reference="'+id+'"]');
      assert.equal(await evaluate(query(reference)+'.open'),false);await click(reference+' > summary');
      await waitFor(query(reference+' img')+'.complete&&'+query(reference+' img')+'.naturalWidth>0','Tools '+id+' reference image');
      const image=await evaluate('(()=>{const d='+query(reference)+',i=d.querySelector("img"),r=i.getBoundingClientRect();return {src:i.getAttribute("src"),width:i.naturalWidth,height:i.naturalHeight,declaredWidth:Number(i.getAttribute("width")),declaredHeight:Number(i.getAttribute("height")),renderedWidth:r.width,renderedHeight:r.height,credit:d.querySelector(".duik-tools-attribution").textContent,docs:d.querySelector(".duik-tools-official-links a").getAttribute("href")}})()');
      assert(image.src.startsWith('/duik-experience/official/duik/tools/'));assert.equal(image.width,image.declaredWidth);assert.equal(image.height,image.declaredHeight);
      assert(Math.abs(image.renderedWidth/image.renderedHeight-image.width/image.height)<.015,'Official screenshot keeps its aspect ratio');
      assert(image.credit.includes('RxLaboratory'));assert(image.credit.includes('GFDL 1.3'));assert(image.docs.startsWith('/docs/guide/tools/'));
      report.toolsReferences.push({id,...image});await click(reference+' > summary');
    }
  });

  await step('Reduced-motion Tools stays still on this page and keeps direct keyboard control',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    try{
      await waitFor('matchMedia("(prefers-reduced-motion: reduce)").matches','Tools reduced-motion media');
      await click(tools('[data-tools-tab="composition"]'));await click(tools('[data-tool-action="crop-reset"]'));
      const before=await toolsReadCrop();assert.equal(before.preview,'idle');assert.equal((await toolsReadPreview()).playbackButtons,0);
      await delay(450);assert.deepEqual((await toolsReadCrop()).mask,before.mask);
      await focus(tools('[data-crop-handle="se"]'));await key('ArrowLeft');const after=await toolsReadCrop();
      assert.equal(after.mask.width,before.mask.width-2);
      await click(tools('[data-tool-action="crop-after"]'));const cropped=await toolsReadCrop(),sought=await toolsReadPreview();assert.equal(sought.progress,100);assert.equal(sought.phase,'manual');assert.equal(sought.playbackButtons,0);assert.equal(sought.progressControls,0);assert.deepEqual(cropped.boundary,cropped.mask);
      assert.equal(await evaluate(query(toolsRoot)+'.getAnimations({subtree:true}).filter(a=>a.playState==="running").length'),0);
      report.toolsReducedMotion={scope:'same-page media change and trusted keyboard input; no cold-navigation or physical background-tab claim',before,after,sought};
      await click(tools('[data-tool-action="crop-reset"]'));
    }finally{
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await waitFor('!matchMedia("(prefers-reduced-motion: reduce)").matches','Tools motion preference restored');
    }
  });
}
