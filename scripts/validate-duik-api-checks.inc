  stage='api-scenes';
  const releaseApi=async()=>{const before=await evaluate('scrollY');for(const type of ['mouseMoved','mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:2,y:2,...(type==='mouseMoved'?{}:{button:'left',buttons:type==='mousePressed'?1:0,clickCount:1})});const after=await evaluate('scrollY');assert(Math.abs(after-before)<2,'Releasing the API scene must not move the page');return {before,after};};
  const apiState=()=>evaluate('(()=>{const r=document.querySelector("[data-duik-api]");return {selection:r.dataset.apiSelection,progress:Number(r.dataset.apiPosition),playing:r.dataset.apiPlaying,code:r.querySelector("[data-api-code]").textContent,scenes:[...r.querySelectorAll("[data-api-scene]")].filter(e=>!e.hasAttribute("hidden")).map(e=>e.dataset.apiScene),running:r.getAnimations({subtree:true}).filter(a=>a.playState==="running").length,times:r.getAnimations({subtree:true}).map(a=>a.currentTime),reference:r.querySelector("details").open}})()');
  await step('API stage is live on root with short copy, three source-backed tasks, and closed references',async()=>{
    await reveal('.duik-api-stage');
    await waitFor('!!document.querySelector("[data-duik-api]").dataset.apiSelection','API mount');
    assert.equal(await evaluate('document.querySelectorAll("[data-api-example]").length'),3);
    assert.equal(await evaluate('document.querySelectorAll(".duik-api-editor").length'),0);
    assert.equal((await apiState()).reference,false);
    assert.equal((await apiState()).code,'Duik.Rig.arm();');
    report.apiRelease=await releaseApi();await waitFor('document.querySelector("[data-duik-api]").dataset.apiPlaying==="true"','automatic API demonstration');
    assert.equal(await evaluate('document.querySelectorAll("[data-api-play],[data-api-progress],[data-api-phase],[data-api-reset]").length'),0);
    assert.equal(await evaluate('document.querySelector("[data-api-stage-status]").getAttribute("aria-live")'),'off');
    await shot('01-api-stage');
  });
  await step('All task buttons change their geometric scene, truthful snippet and source link',async()=>{
    for(const [id,call] of [['wiggle','Duik.Automation.wiggle();'],['auto-parent','Duik.Constraint.autoParent();'],['arm','Duik.Rig.arm();']]){
      await click('[data-api-example="'+id+'"]');const s=await apiState();
      assert.equal(s.selection,id);assert.equal(s.code,call);assert.deepEqual(s.scenes,[id]);
      await reveal('.duik-api-stage');await waitFor('document.querySelector("[data-duik-api]").dataset.apiPlaying==="true"','selected API starts automatically');
      const href=await evaluate('document.querySelector("[data-api-source]").getAttribute("href")');
      assert.equal(href,id==='auto-parent'?'/docs/advanced/api/headless-scripts':'/docs/advanced/api/duik-features');
    }
  });
  await step('Automatic API motion advances actual SVG transforms and returns without a reset cut',async()=>{
    await click('[data-api-example=arm]');await reveal('.duik-api-stage');
    await waitFor('Number(document.querySelector("[data-duik-api]").dataset.apiPosition)>.7','moving arm phase');
    const moving=await evaluate('getComputedStyle(document.querySelector("[data-api-motion=arm-lower]")).transform');
    assert.notEqual(moving,'none');assert.notEqual(moving,'matrix(1, 0, 0, 1, 0, 0)');
    const r=await rect('[data-api-surface]');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:r.x+r.width/2,y:r.y+r.height/2});
    const before=await apiState();await delay(250);const after=await apiState();
    assert.equal(after.playing,'true');assert.notEqual(after.progress,before.progress,'passive hover must not pause motion');
    await waitFor('Number(document.querySelector("[data-duik-api]").dataset.apiPosition)>.95','API completes outward move');
    await waitFor('Number(document.querySelector("[data-duik-api]").dataset.apiPosition)<.7','API returns through its authored sequence');
    assert.equal((await apiState()).playing,'true');assert((await apiState()).running>0);
  });
  await step('Keyboard example selection starts its own scene; reference reading alone holds motion',async()=>{
    await focus('[data-api-example=wiggle]');await key('Enter');assert.equal((await apiState()).selection,'wiggle');
    await reveal('.duik-api-stage');await waitFor('document.querySelector("[data-duik-api]").dataset.apiPlaying==="true"','keyboard selected API loops');
    await click('.duik-api-reference>summary');
    try{const paused=await apiState();await delay(250);const still=await apiState();assert.equal(still.playing,'false');assert.equal(still.progress,paused.progress);}
    finally{if((await apiState()).reference)await click('.duik-api-reference>summary');}
    await reveal('.duik-api-stage');
    await waitFor('document.querySelector("[data-duik-api]").dataset.apiPlaying==="true"','reference closed resumes motion');
    await shot('02-api-wiggle');
  });
  await step('Offscreen and hidden-document lifecycle freeze the timeline',async()=>{
    await reveal('.duik-api-stage');await waitFor('document.querySelector("[data-duik-api]").dataset.apiPlaying==="true"','API visible loop');await scroll(0);await delay(200);
    const s=await apiState();assert.equal(s.playing,'false');assert.equal(s.running,0);
    await reveal('.duik-api-stage');await releaseApi();await waitFor('document.querySelector("[data-duik-api]").dataset.apiPlaying==="true"','API offscreen return');
    await evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));');
    try{assert.equal((await apiState()).running,0);assert.equal((await apiState()).playing,'false');}
    finally{await evaluate('delete document.hidden;document.dispatchEvent(new Event("visibilitychange"));');}
  });
  await step('Reduced motion stops all stage animations and retains complete readable results',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    try{
      await waitFor('document.querySelector("[data-duik-api]").dataset.apiPlaying==="false"','reduced motion');
      assert.equal((await apiState()).running,0);assert.equal((await apiState()).progress,1);
      await click('[data-api-example=wiggle]');assert.equal((await apiState()).progress,1);
    }finally{await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});}
  });
  await step('Copy succeeds or explains refusal without executing a snippet; official detail remains available',async()=>{
    await click('[data-api-example=auto-parent]');
    if(!(await apiState()).reference)await click('.duik-api-reference>summary');
    try{
    await evaluate('window.__clipboardDescriptor=Object.getOwnPropertyDescriptor(navigator,"clipboard");Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async s=>{window.__apiCopy=s}}});');
    try{
      await click('[data-api-copy]');assert.equal(await evaluate('window.__apiCopy'),'Duik.Constraint.autoParent();');
      assert.match(await text('[data-api-feedback]'),/已复制/);
      await evaluate('navigator.clipboard.writeText=async()=>{throw Error("denied")};');await click('[data-api-copy]');
      assert.match(await text('[data-api-feedback]'),/复制失败/);
      assert.equal(await evaluate('document.querySelector("[data-api-copy]").disabled'),false);
    }finally{await evaluate('if(window.__clipboardDescriptor)Object.defineProperty(navigator,"clipboard",window.__clipboardDescriptor);else delete navigator.clipboard;');}
    assert.equal((await apiState()).reference,true);
    await waitFor('document.querySelector(".duik-api-official img").complete&&document.querySelector(".duik-api-official img").naturalWidth===481','official reference');
    const detail=await text('.duik-api-requirements');assert(detail.includes('DuAEF.init()')&&detail.includes('DuAEF.enterRunTime()')&&detail.includes('DuScriptUI.showUI()'));
    }finally{if((await apiState()).reference)await click('.duik-api-reference>summary');}
  });
  await step('Remount and disposal cancel owned animations and listeners',async()=>{
    await evaluate('(async()=>{const {mountApi}=await import("/duik-experience/experience-catalog.mjs");window.__apiCleanup=mountApi(document.querySelector("#api"));})()');
    await click('[data-api-example=arm]');await reveal('.duik-api-stage');await waitFor('document.querySelector("[data-duik-api]").dataset.apiPlaying==="true"','remounted API loop');
    await evaluate('window.__apiCleanup()');const disposedState=await apiState();
    assert.equal(disposedState.running,0);
    await click('[data-api-example=wiggle]');assert.equal((await apiState()).selection,disposedState.selection);
    await evaluate('(async()=>{const {mountApi}=await import("/duik-experience/experience-catalog.mjs");window.__apiCleanup=mountApi(document.querySelector("#api"));})()');
    await click('[data-api-example=auto-parent]');assert.equal((await apiState()).selection,'auto-parent');
    report.finalApi=await apiState();
  });
