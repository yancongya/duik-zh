
  const selector='[data-workflow-rig-host] character-rig',rig=query(selector)+'.rig';
  const settledCamera='document.querySelector("[data-workflow-camera]").getAnimations().length===0';
  const rigExposed='document.querySelector("[data-workflow-rig-host]").inert===false&&getComputedStyle(document.querySelector("[data-workflow-rig-host]")).opacity==="1"';
  const workflowState=()=>evaluate('(()=>{const root=document.querySelector("#workflow"),art=root.querySelector("[data-workflow-art]"),r=art.getBoundingClientRect();return {tour:root.dataset.workflowTour,step:root.dataset.workflowStep,handoff:art.dataset.workflowPoseHandoff||null,visibleRatio:Math.max(0,Math.min(r.right,innerWidth)-Math.max(0,r.left))*Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(0,r.top))/(r.width*r.height),scrollY}})()');
  const heroBefore=await evaluate('document.querySelector("#duik-hero-character").rig.getState().pose');
  await reveal('[data-workflow-art]');await waitFor('document.querySelector("#workflow").dataset.workflowReady==="true"','workflow real rig');
  await step('The first visible entry plays one continuous introduction then yields permanent controls',async()=>{
    assert.equal(await evaluate('document.querySelectorAll("[data-workflow-tour-toggle]").length'),0);
    assert((await workflowState()).visibleRatio>=.65);
    const pose=await evaluate(rig+'.getState().pose');report.automaticWorkflow=[];
    const deadline=Date.now()+15000;
    while(Date.now()<deadline){
      const state=await workflowState();report.automaticWorkflow.push(state);
      if(state.tour==='complete')break;
      assert.equal(state.tour,'playing','no manual input or playback command is used for the first sequence');
      await delay(50);
    }
    const final=report.automaticWorkflow.at(-1);
    assert.equal(final.tour,'complete');assert.equal(final.step,'2');
    assert.deepEqual(report.automaticWorkflow.map(state=>state.step).filter((value,index,all)=>index===0||value!==all[index-1]),['0','1','2']);
    await waitFor(rigExposed+'&&'+settledCamera,'final controls are exposed after the camera settles');
    assert.equal(await evaluate(rig+'.getState().interaction'),'drag');
    assert.equal(await evaluate('document.querySelector("[data-workflow-camera]").dataset.workflowCameraPose'),'control');
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:4,y:4});await delay(4500);
    const after=await workflowState();assert.equal(after.tour,'complete');assert.equal(after.step,'2');report.workflowNoReplay=after;
  });
  await step('Leaving and returning after completion preserves the final stage instead of replaying',async()=>{
    const before=await workflowState();const pose=await evaluate(rig+'.getState().pose');await scroll(before.scrollY+1100);
    const exited=await workflowState();await delay(1000);assert.equal((await workflowState()).step,'2');
    await reveal('[data-workflow-art]');await waitFor(rigExposed,'completed controls remain exposed on return');
    await delay(2000);const reentered=await workflowState();assert.equal(reentered.tour,'complete');assert.equal(reentered.step,'2');
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);report.workflowVisibility={before,exited,reentered};
  });
  await step('Same approved 26 transparent PNG layers render in the expanded camera stage',async()=>{
    // Inspect a manual phase only after observing the untouched one-shot introduction.
    await click('button[data-workflow-step="0"]');await waitFor(settledCamera+'&&!document.querySelector("[data-workflow-art]").dataset.workflowPoseHandoff','expanded shot finishes');
    const s=await evaluate(rig+'.getState()');report.initialWorkflow=s;
    assert.equal(s.sourceSha256,'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');
    assert.equal(s.partCount,26);assert.equal(s.visibleParts.length,26);assert.equal(s.mode,'assembled');assert.equal(s.showControls,false);
    await waitFor('(()=>{const images=[...document.querySelectorAll("[data-workflow-layer]")];return images.length===26&&images.every(image=>image.complete&&image.naturalWidth>0)})()','all 26 original transparent layers decoded');
    const layers=await evaluate('(()=>{const art=document.querySelector("[data-workflow-art]"),stack=document.querySelector("[data-workflow-layer-stack]");return {shot:art.dataset.workflowShot,count:art.dataset.workflowLayerCount,opacity:getComputedStyle(stack).opacity,ids:[...stack.querySelectorAll("img")].map(image=>image.dataset.workflowLayer),transforms:[...stack.querySelectorAll("img")].map(image=>getComputedStyle(image).transform)}})()');
    assert.equal(layers.shot,'layers');assert.equal(layers.count,'26');assert.equal(layers.opacity,'1');
    assert.deepEqual(layers.ids,(await evaluate(rig+'.getParts()')).map(part=>part.id));assert(layers.transforms.every(transform=>transform!=='none'));
    assert.equal(await evaluate('document.querySelector("[data-workflow-rig-host]").inert'),true);report.expandedLayers=layers;
    assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-workflow-poster]")).visibility'),'hidden');
    assert.equal(await evaluate(query(selector)+'.shadowRoot.querySelectorAll("[data-control]").length'),0);
    assert.equal(await evaluate('document.querySelector(".duik-workflow-reference").open'),false);
  });
  await step('Link stage selects actual rig art and lists its real transparent layers',async()=>{
    await click('button[data-workflow-step="1"]');await click('[data-workflow-part="fore-r"]');
    await waitFor(rigExposed+'&&'+settledCamera,'selected arm camera settles after the original layers collect');
    const s=await evaluate(rig+'.getState()');assert.equal(s.mode,'assembled');assert.equal(s.selected,'fore-r');assert.equal(s.showMesh,true);assert.equal(s.interaction,'none');
    assert.equal(await evaluate('document.querySelectorAll("[data-workflow-linked] li").length'),4);
    assert.equal(await evaluate(query('button[data-workflow-part="fore-r"]')+'.getAttribute("aria-pressed")'), 'true');
    assert.equal(await evaluate('document.querySelector(".duik-workflow-linked-detail").open'),false);
    await click('.duik-workflow-linked-detail > summary');
    await waitFor('(()=>{const images=[...document.querySelectorAll("[data-workflow-linked] img")];return images.length===4&&images.every(image=>image.complete&&image.naturalWidth>0)})()','selected arm thumbnails decode');
    await click('.duik-workflow-linked-detail > summary');
  });
  await step('Visible controls update the matching selected artwork in the link stage',async()=>{
    await reveal('[data-workflow-art]');
    const point=await evaluate('(()=>{const e='+query(selector)+'.shadowRoot.querySelector("[data-control=head]");const p=new DOMPoint(0,0).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y}})()');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...point});
    assert.equal(await evaluate(rig+'.getState().selected'),'face');
    assert.equal(await evaluate('document.querySelector("#workflow").dataset.workflowPart'),'face');
  });
  await step('Real mouse dragging changes the pose and rendered pixels, without changing Hero',async()=>{
    await click('button[data-workflow-step="2"]');await reveal('[data-workflow-art]');
    await waitFor(settledCamera+'&&'+rigExposed,'control camera settles before trusted pointer input');
    const before=await evaluate(rig+'.getState().pose');await evaluate('window.__wfPixels='+rig+'.capture()');
    const p=await evaluate('(()=>{const e='+query(selector)+'.shadowRoot.querySelector("[data-control=handL]");const p=new DOMPoint(0,0).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y}})()');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...p});
    for(let i=1;i<=8;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:p.x+18*i/8,y:p.y-15*i/8});await delay(25);}
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:p.x+18,y:p.y-15});
    const after=await evaluate(rig+'.getState()');assert.notDeepEqual(after.pose.handL,before.handL);assert(after.finiteVertices);assert.equal(after.webglError,0);
    assert(await evaluate('window.__wfPixels!=='+rig+'.capture()'));assert.deepEqual(await evaluate('document.querySelector("#duik-hero-character").rig.getState().pose'),heroBefore);
    report.drag={before:before.handL,after:after.pose.handL};
  });
  await step('Stage changes preserve the current pose; explicit reset restores it',async()=>{
    const pose=await evaluate(rig+'.getState().pose');await click('button[data-workflow-step="0"]');await click('button[data-workflow-step="2"]');
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);await click('[data-workflow-reset]');assert.deepEqual(await evaluate(rig+'.getState().pose.handL'),[0,0]);
  });
  await step('Keyboard stage switching and controller arrows remain usable',async()=>{
    await focus('button[data-workflow-step="0"]');await key('Home');assert.equal(await evaluate(rig+'.getState().mode'),'assembled');assert.equal(await evaluate('document.querySelector("[data-workflow-art]").dataset.workflowShot'),'layers');await key('End');
    await reveal('[data-workflow-art]');await evaluate(query(selector)+'.shadowRoot.querySelector("[data-control=handL]").focus({preventScroll:true})');
    const before=await evaluate(rig+'.getState().pose.handL');await key('ArrowRight');assert.notDeepEqual(await evaluate(rig+'.getState().pose.handL'),before);
    assert.equal(await evaluate(query(selector)+'.shadowRoot.activeElement?.dataset.control'),'handL');await click('[data-workflow-reset]');
  });
  await step('Reduced motion removes stage transitions while retaining interaction',async()=>{
    try{
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('button[data-workflow-step="1"]');
      assert.equal(await evaluate('document.querySelector("[data-workflow-copy]").getAnimations().length'),0);assert.equal(await evaluate(rig+'.getState().reducedMotion'),true);
      assert.equal(await evaluate('document.querySelector("[data-workflow-camera]").getAnimations({subtree:true}).length'),0);
      assert.notEqual((await workflowState()).tour,'playing');
      await click('button[data-workflow-step="2"]');assert.equal(await evaluate(rig+'.getState().interaction'),'drag');
    }finally{await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});}
  });
  await step('Authentic panel reference follows selection and documentation is reachable',async()=>{
    await click('button[data-workflow-step="1"]');await click('.duik-workflow-reference > summary');
    assert.equal(await evaluate('document.querySelector(".duik-workflow-reference").open'),true);
    await waitFor('document.querySelector(".duik-workflow-panel img").naturalWidth>0','official panel');
    assert((await evaluate('document.querySelector(".duik-workflow-panel img").src')).includes('/constraints/constraints-panel.png'));
    report.docs=await evaluate('(async()=>{const urls=[...new Set([...document.querySelectorAll("#workflow a[href],#inside-ae a[href]")].map(a=>a.href))];return Promise.all(urls.map(async url=>({url,status:(await fetch(url)).status})))})()');assert(report.docs.every(r=>r.status===200));
    await click('.duik-workflow-reference > summary');await click('button[data-workflow-step="2"]');await reveal('[data-workflow-art]');
  });
  await step('Changed section stays in its desktop frame and mounts only one live character',async()=>{
    const geometry=await evaluate('(()=>{const s=document.querySelector(".duik-workflow-stage"),r=s.getBoundingClientRect();return {width:r.width,scrollWidth:s.scrollWidth,rigs:s.querySelectorAll("character-rig").length,bodyOverflow:document.documentElement.scrollWidth-innerWidth}})()');report.geometry=geometry;
    assert.equal(geometry.rigs,1);assert(geometry.scrollWidth<=geometry.width+1);assert(geometry.bodyOverflow<=1);
    await shot('workflow-controls');
  });
  await step('Workflow character releases its resources on removal',async()=>{
    const result=await evaluate('(()=>{const e='+query(selector)+',r=e.rig;e.remove();return r.getState()})()');assert(result.destroyed);assert.equal(result.rafScheduled,false);
  });
  report.rootErrors=errors;report.failedRequests=failedRequests;
  report.passed=failures.length===0&&errors.length===0&&failedRequests.length===0;
  if(!report.passed)process.exitCode=1;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;try{await shot('failure');}catch{}}
finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks,failures,errors,failedRequests,failure:report.failure,output:out},null,2));try{await send('Browser.close',{},null);}catch{}socket?.close();child.kill('SIGTERM');}

