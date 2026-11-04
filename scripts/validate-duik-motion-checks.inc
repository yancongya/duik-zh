
  const motion=kind=>'[data-motion-demo="'+kind+'"]';
  const inScene=(kind,child)=>motion(kind)+' '+child;
  const releaseMotion=async()=>{const before=await evaluate('scrollY');for(const type of ['mouseMoved','mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:2,y:2,...(type==='mouseMoved'?{}:{button:'left',buttons:type==='mousePressed'?1:0,clickCount:1})});const after=await evaluate('scrollY');assert(Math.abs(after-before)<2,'Releasing the scene must not move the pinned track');return {before,after};};
  const heldMotionKey=async(keyName,inspect)=>{const virtual={Home:36,End:35,ArrowRight:39}[keyName],event={key:keyName,code:keyName,windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual};await send('Input.dispatchKeyEvent',{type:'keyDown',...event});try{await inspect();}finally{await send('Input.dispatchKeyEvent',{type:'keyUp',...event});}};
  await step('All motion sections lead with working scenes, not screenshot instruction panels',async()=>{
    const modes=await evaluate('Array.from(document.querySelectorAll("[data-motion-demo]")).map(e=>({kind:e.dataset.motionDemo,view:e.dataset.view,referenceHidden:e.querySelector("[data-motion-reference]").hidden,sceneHidden:e.querySelector("[data-motion-interactive]").hidden}))');
    assert.equal(modes.length,3);assert(modes.every(m=>m.view==='demo'&&m.referenceHidden&&!m.sceneHidden));report.views=modes;
    for(const kind of ['animation','automation','camera'])assert.equal(await evaluate(query(motion(kind))+'.querySelectorAll("[data-action=play], [data-action=reset], [data-input=time], [data-input=automationTime], [data-input=cameraTime], [data-art=timing-progress], [data-art=reference-progress]").length'),0,'No playback transport in '+kind);
  });
  await step('Interpolation loops on entry, yields only to held canvas input and resumes on release',async()=>{
    await revealMotion('animation');report.animationRelease=await releaseMotion();await waitFor(query(motion('animation'))+'.dataset.playing==="true"','automatic interpolation');
    const a=await evaluate(query(inScene('animation','[data-art=traveler]'))+'.getAttribute("transform")');await delay(200);
    await waitFor(query(inScene('animation','[data-art=traveler]'))+'.getAttribute("transform")!=='+JSON.stringify(a),'animation advances after a real frame');
    await focus(inScene('animation','[data-motion-stage]'));assert.equal(await evaluate(query(motion('animation'))+'.dataset.playing'),'true','Focus alone does not pause the scene');
    await heldMotionKey('Home',async()=>{assert.equal(await evaluate(query(motion('animation'))+'.dataset.time'),'0.00');assert.equal(await evaluate(query(motion('animation'))+'.dataset.playing'),'false');await heldMotionKey('ArrowRight',async()=>{assert.equal(await evaluate(query(motion('animation'))+'.dataset.time'),'0.02');assert.notEqual(await evaluate(query(inScene('animation','[data-art=traveler]'))+'.getAttribute("transform")'),await evaluate(query(inScene('animation','[data-art=reference-traveler]'))+'.getAttribute("transform")'));});});
    await waitFor(query(motion('animation'))+'.dataset.playing==="true"','interpolation resumes without blurring the canvas');
    await heldMotionKey('End',async()=>{assert.equal(await evaluate(query(motion('animation'))+'.dataset.time'),'1.00');await delay(250);assert.equal(await evaluate(query(motion('animation'))+'.dataset.time'),'1.00');assert.equal(await evaluate(query(motion('animation'))+'.dataset.playing'),'false');});
    await waitFor(query(motion('animation'))+'.dataset.playing==="true"','interpolation resumes on key release');
    await click(inScene('animation','[data-ease=linear]'));assert.equal(await evaluate(query(motion('animation'))+'.dataset.mode'),'linear');assert.equal(await evaluate(query(motion('animation'))+'.dataset.playing'),'true');await shot('animation-stage');
  });
  await step('Real Duik references are secondary, locally loaded and still link to their documents',async()=>{
    const docs=[];
    for(const kind of ['animation','automation','camera']){
      await revealMotion(kind);await click(inScene(kind,'[data-motion-view=reference]'));
      await waitFor(query(inScene(kind,'[data-motion-reference] img'))+'.naturalWidth>0','authentic '+kind+' image');
      assert.equal(await evaluate(query(motion(kind))+'.dataset.view'),'reference');
      docs.push(await evaluate('(async()=>{const a='+query(inScene(kind,'.duik-motion-foot a'))+';return {href:a.getAttribute("href"),status:(await fetch(a.href)).status}})()'));
      await click(inScene(kind,'[data-motion-view=demo]'));
    }
    assert(docs.every(d=>d.status===200));report.docs=docs;
  });
  await step('Automation controls drive the actual geometry and pause offscreen',async()=>{
    await revealMotion('automation');await click(inScene('automation','[data-motion-adjust] summary'));await focus(inScene('automation','[data-input=amplitude]'));await key('Home');
    await waitFor(query(motion('automation'))+'.dataset.playing==="true"','zero-amplitude loop without changing focus');await delay(250);
    assert.equal(await evaluate(query(inScene('automation','[data-art=position]'))+'.getAttribute("transform")'),'translate(300.00 128)');
    assert.equal(await evaluate(query(inScene('automation','[data-art=rotation]'))+'.getAttribute("transform")'),'rotate(0.00)');
    assert.equal(await evaluate(query(inScene('automation','[data-art=scale]'))+'.getAttribute("transform")'),'scale(1.00)');
    await focus(inScene('automation','[data-input=amplitude]'));await key('End');
    assert.equal(await evaluate(query(inScene('automation','[data-input=amplitude]'))+'.value'),'64');
    await waitFor(query(motion('automation'))+'.dataset.playing==="true"','automatic waveform resumes on parameter key release');
    await click(inScene('automation','[data-motion-adjust] summary'));
    const a=await evaluate(query(inScene('automation','[data-art=position]'))+'.getAttribute("transform")');await delay(220);
    await waitFor(query(inScene('automation','[data-art=position]'))+'.getAttribute("transform")!=='+JSON.stringify(a),'automation advances after a real frame');
    await revealMotion('camera');await delay(150);const t=await evaluate(query(motion('automation'))+'.dataset.time');await delay(250);assert.equal(await evaluate(query(motion('automation'))+'.dataset.time'),t);
    assert.equal(await evaluate(query(motion('automation'))+'.dataset.playing'),'false');
    await revealMotion('automation');await releaseMotion();await waitFor(query(motion('automation'))+'.dataset.playing==="true"','waveform resumes on return');await shot('automation-mobile-stage');
  });
  await step('Camera automatically returns through the original composition without a cut',async()=>{
    await revealMotion('camera');report.cameraRelease=await releaseMotion();
    await waitFor(query(motion('camera'))+'.dataset.playing==="true"','camera automatic movement');
    await waitFor('Number('+query(motion('camera'))+'.dataset.time)>4.6','camera reaches end of first move',75);
    await waitFor('Number('+query(motion('camera'))+'.dataset.time)<3','camera returns along the same shot',75);
    assert.equal(await evaluate(query(motion('camera'))+'.dataset.playing'),'true');
    await shot('camera-composition-stage');
  });
  await step('Camera opens actual depth layers and drag changes their parallax independently',async()=>{
    await revealMotion('camera');await click(inScene('camera','[data-action=depth]'));await delay(450);
    assert.equal(await evaluate(query(inScene('camera','[data-camera-drag]'))+'.dataset.depthView'),'exploded');
    const planes=await evaluate('Array.from('+query(motion('camera'))+'.querySelectorAll("[data-plane]")).map(e=>getComputedStyle(e).transform)');assert.equal(new Set(planes).size,3);
    const hit=await reveal(inScene('camera','[data-camera-drag]')),p=hit.point;
    const before=await evaluate(query(motion('camera'))+'.dataset.viewX');
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...p});
    assert.equal(await evaluate(query(motion('camera'))+'.dataset.viewX'),before,'Grabbing a composition does not snap its camera to the pointer');
    for(let i=1;i<=6;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:p.x+45*i/6,y:p.y-20*i/6});await delay(25);}
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:p.x+45,y:p.y-20});
    const depths=await evaluate('Array.from('+query(motion('camera'))+'.querySelectorAll("[data-depth]")).map(e=>e.getAttribute("transform"))');assert.equal(new Set(depths).size,3);
    assert.notEqual(await evaluate(query(motion('camera'))+'.dataset.viewX'),'0.00');report.camera={planes,depths};await shot('camera-depth-stage');
    await waitFor(query(motion('camera'))+'.dataset.playing==="true"','camera resumes while pointer and focus stay on the composition');
    await click(inScene('camera','[data-action=depth]'));assert.equal(await evaluate(query(inScene('camera','[data-camera-drag]'))+'.dataset.depthView'),'flat');
  });
  await step('Keyboard and reduced motion retain camera control without animated layer transitions',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    try{
    await focus(inScene('camera','[data-action=depth]'));await key('Enter');
    assert.equal(await evaluate(query(inScene('camera','[data-camera-drag]'))+'.dataset.depthView'),'exploded');
    assert.equal(await evaluate(query(inScene('camera','.duik-camera-space'))+'.getAnimations().length'),0);
    await click(inScene('camera','.duik-motion-adjust summary'));await focus(inScene('camera','[data-input=viewX]'));await key('Home');assert.equal(await evaluate(query(motion('camera'))+'.dataset.viewX'),'-100.00');
    await focus(inScene('camera','[data-motion-stage]'));await key('ArrowRight');assert.equal(await evaluate(query(motion('camera'))+'.dataset.viewX'),'-95.00');
    assert.equal(await evaluate(query(motion('camera'))+'.dataset.playing'),'false');assert.equal(await evaluate(query(motion('camera'))+'.querySelectorAll("[data-action=play]").length'),0);
    await focus(inScene('camera','[data-motion-stage]'));await key('Home');assert.equal(await evaluate(query(motion('camera'))+'.dataset.viewX'),'0.00');
    }finally{try{if(await evaluate(query(inScene('camera','[data-motion-adjust]'))+'.open'))await click(inScene('camera','[data-motion-adjust] summary'));if(await evaluate(query(inScene('camera','[data-camera-drag]'))+'.dataset.depthView==="exploded"'))await click(inScene('camera','[data-action=depth]'));}finally{await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});}}
  });
  await step('Reduced-motion page entry does not start explanatory autoplay',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    try{
    await send('Page.navigate',{url});await waitFor('!!window.lenis&&document.querySelectorAll("[data-motion-mounted]").length===3','fresh reduced-motion root');await delay(300);
    await revealMotion('animation');await delay(350);
    assert.equal(await evaluate(query(motion('animation'))+'.dataset.playing'),'false');
    }finally{await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});}
  });
  report.passed=failures.length===0&&errors.length===0&&failedRequests.length===0;
  if(!report.passed)process.exitCode=1;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;try{await shot('failure');}catch{}}
finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks,failures,errors,failedRequests,failure:report.failure,output:out},null,2));try{await send('Browser.close',{},null);}catch{}socket?.close();child.kill('SIGTERM');}
