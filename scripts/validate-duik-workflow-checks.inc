
  const selector='[data-workflow-rig-host] character-rig',rig=query(selector)+'.rig';
  const rigExposed='document.querySelector("[data-workflow-rig-host]").inert===false&&getComputedStyle(document.querySelector("[data-workflow-rig-host]")).opacity==="1"';
  const workflowState=()=>evaluate('(()=>{const root=document.querySelector("#workflow"),camera=root.querySelector("[data-workflow-camera]");return {tour:root.dataset.workflowTour,step:root.dataset.workflowStep,progress:Number(root.dataset.workflowProgress),camera:camera.style.transform,transforms:[...root.querySelectorAll("[data-workflow-layer]")].map(image=>image.style.transform),scrollY}})()');
  // Sample real physical scroll through the retained Lenis owner, never seek().
  async function workflowScroll(progress){
    const target=await evaluate('(()=>{const root=document.querySelector("#workflow"),pin=root.querySelector("[data-workflow-pin]"),r=root.getBoundingClientRect(),s=getComputedStyle(root),p=getComputedStyle(pin),top=parseFloat(s.paddingTop),bottom=parseFloat(s.paddingBottom),inset=parseFloat(p.top);return scrollY+r.top+top-inset+'+JSON.stringify(progress)+'*Math.max(1,r.height-top-bottom-pin.getBoundingClientRect().height)*.85})()');
    await scroll(target);await waitFor('Math.abs(Number(document.querySelector("#workflow").dataset.workflowProgress)-'+JSON.stringify(Math.max(0,Math.min(1,progress)))+')<.005','physical workflow scroll '+progress);
    return workflowState();
  }
  const heroBefore=await evaluate('document.querySelector("#duik-hero-character").rig.getState().pose');
  await reveal('[data-workflow-art]');await waitFor('document.querySelector("#workflow").dataset.workflowReady==="true"','workflow real rig');
  await step('Physical scrolling assembles all 26 layers and reversing restores the same frames',async()=>{
    assert.equal(await evaluate('document.querySelectorAll("#workflow button:not([data-workflow-retry]),#workflow input[type=range]").length'),0);
    await waitFor('(()=>{const images=[...document.querySelectorAll("[data-workflow-layer]")];return images.length===26&&images.every(image=>image.complete&&image.naturalWidth>0)})()','26 transparent PNG layers decoded');
    const state=await evaluate(rig+'.getState()');assert.equal(state.sourceSha256,'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');assert.equal(state.partCount,26);
    report.workflowForward=[];for(const p of [0,.2,.4,.6,.72,.86,1.01])report.workflowForward.push(await workflowScroll(p));
    assert.deepEqual(report.workflowForward.map(s=>s.step),['0','0','0','1','1','1','2']);
    assert.equal(await evaluate(rig+'.getState().interaction'),'drag');assert.equal(await evaluate(query(selector)+'.getAttribute("interaction")'),'drag');
    await waitFor(rigExposed,'final controllers exposed');report.workflowReverse=[];
    for(const p of [.86,.72,.6,.4,.2,0]){
      const reverse=await workflowScroll(p),forward=report.workflowForward.find(item=>Math.abs(item.progress-p)<.005);report.workflowReverse.push(reverse);
      assert.equal(reverse.camera,forward.camera);assert.deepEqual(reverse.transforms,forward.transforms);
    }
    assert.equal(await evaluate('document.querySelector("[data-workflow-rig-host]").inert'),true);
    assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-workflow-layer-stack]")).opacity'),'1');
  });
  await step('Stationary scroll leaves the current assembly frame unchanged',async()=>{
    const before=await workflowScroll(.4);await delay(1500);const after=await workflowState();
    assert.equal(after.progress,before.progress);assert.equal(after.camera,before.camera);assert.deepEqual(after.transforms,before.transforms);
    report.workflowStationary={before,after};
  });
  await step('Final controllers accept real dragging and reverse scroll preserves that saved pose',async()=>{
    await workflowScroll(1.01);await waitFor(rigExposed,'control handoff');
    const before=await evaluate(rig+'.getState().pose');await evaluate('window.__wfPixels='+rig+'.capture()');
    const p=await evaluate('(()=>{const e='+query(selector)+'.shadowRoot.querySelector("[data-control=handL]");const p=new DOMPoint(0,0).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y}})()');
    const scrollBefore=await evaluate('scrollY');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...p});
    for(let i=1;i<=8;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:p.x+18*i/8,y:p.y-15*i/8});await delay(25);}
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:p.x+18,y:p.y-15});
    const after=await evaluate(rig+'.getState()');assert.notDeepEqual(after.pose.handL,before.handL);assert(after.finiteVertices);assert.equal(after.webglError,0);
    assert(await evaluate('window.__wfPixels!=='+rig+'.capture()'));assert.deepEqual(await evaluate('document.querySelector("#duik-hero-character").rig.getState().pose'),heroBefore);
    const scrollAfter=await evaluate('scrollY');assert(Math.abs(scrollAfter-scrollBefore)<1,'controller input does not scroll the chapter');
    for(const progress of [.8,.5,0,.5,.8,1.01])await workflowScroll(progress);
    // getState().pose is the rendered blend during intermediate samples. The
    // unchanged saved pose is observable again at the interactive endpoint.
    assert.deepEqual(await evaluate(rig+'.getState().pose'),after.pose);
    report.workflowDrag={before:before.handL,after:after.pose.handL,scrollBefore,scrollAfter};
  });
  await step('Final keyboard controller input remains available without phase controls',async()=>{
    await workflowScroll(1.01);await evaluate(query(selector)+'.shadowRoot.querySelector("[data-control=handL]").focus({preventScroll:true})');
    const before=await evaluate(rig+'.getState().pose.handL');await key('ArrowRight');assert.notDeepEqual(await evaluate(rig+'.getState().pose.handL'),before);
    assert.equal(await evaluate(query(selector)+'.shadowRoot.activeElement?.dataset.control'),'handL');
  });
  await step('Reduced media emulation gives a static interactive endpoint then restores physical mapping',async()=>{
    // Only this isolated browser changes; the user's macOS preference does not.
    try{
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      await waitFor('document.querySelector("#workflow").dataset.workflowTour==="reduced"','reduced static controls');
      assert.equal(await evaluate(rig+'.getState().interaction'),'drag');assert.equal(await evaluate('document.querySelector("[data-workflow-camera]").getAnimations({subtree:true}).length'),0);
    }finally{await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});}
    await workflowScroll(.4);assert.equal((await workflowState()).step,'0');report.workflowReducedEvidence='isolated browser media emulation only; system preference not changed';
  });
  await step('Workflow stays in its desktop frame and exposes a real local documentation target',async()=>{
    await workflowScroll(1.01);
    const geometry=await evaluate('(()=>{const s=document.querySelector(".duik-workflow-stage"),r=s.getBoundingClientRect();return {width:r.width,scrollWidth:s.scrollWidth,rigs:s.querySelectorAll("character-rig").length,bodyOverflow:document.documentElement.scrollWidth-innerWidth}})()');report.geometry=geometry;
    assert.equal(geometry.rigs,1);assert(geometry.scrollWidth<=geometry.width+1);assert(geometry.bodyOverflow<=1);
    report.docs=await evaluate('(async()=>{const urls=[...new Set([...document.querySelectorAll("#workflow a[href]")].map(a=>a.href))];return Promise.all(urls.map(async url=>({url,status:(await fetch(url)).status})))})()');assert(report.docs.length>0&&report.docs.every(r=>r.status===200));
    await shot('workflow-scroll-controls');
  });
  report.rootErrors=errors;report.failedRequests=failedRequests;
  report.passed=failures.length===0&&errors.length===0&&failedRequests.length===0;
  if(!report.passed)process.exitCode=1;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;try{await shot('failure');}catch{}}
finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks,failures,errors,failedRequests,failure:report.failure,output:out},null,2));try{await send('Browser.close',{},null);}catch{}socket?.close();child.kill('SIGTERM');}
