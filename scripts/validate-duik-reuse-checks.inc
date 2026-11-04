// Insert inside validate-duik-experience.mjs's existing try block, replacing the
// superseded "three real panels" step. Uses its existing real CDP input helpers.
// This fragment adds no browser/service process and has not been browser-run here.
{
  const reusePanel=id=>'[data-reuse-panel="'+id+'"]';
  const reuseIn=(id,child)=>reusePanel(id)+' '+child;
  const reuseRoot='[data-reuse-root]';
  const reuseDetails='#reuse > .duik-orbit-details';
  // Open the real secondary workbench only for checks selected by the filter.
  // Closing it in finally also restores the original orbit after a failure.
  const reuseStep=(name,fn)=>step(name,async()=>{
    await revealHorizontal('#reuse');
    assert.equal(await evaluate(query(reuseDetails)+'.open'),false,'Reuse workbench starts closed');
    try{
      await click(reuseDetails+' > summary');
      await waitFor(query(reuseDetails)+'.open===true','Reuse workbench opens');
      await fn();
    }finally{
      // A failed zoom check may leave a native modal above the summary.
      if(await evaluate(query('[data-reuse-dialog]')+'?.open'))await key('Escape');
      const references=await evaluate('[...document.querySelectorAll("#reuse [data-reuse-reference][open]")].map(e=>e.closest("[data-reuse-panel]").dataset.reusePanel)');
      for(const id of references)await click(reuseIn(id,'[data-reuse-reference] > summary'));
      if(await evaluate(query(reuseDetails)+'.open'))await click(reuseDetails+' > summary');
      await waitFor(query(reuseDetails)+'.open===false','Reuse workbench closes');
    }
  });
  const releaseReuse=async()=>{
    // Ordinary mouse hover and keyboard focus do not gate the presentation.
    // Only actual held activation, open evidence and visibility can defer it.
    await waitFor(query(reuseRoot)+'.dataset.reuseVisible==="true"','reuse presentation is mostly visible');
  };
  const receiptSnapshot=()=>evaluate('(()=>{const p='+query(reusePanel('animation'))+';return {selected:p.dataset.reuseSelected,frame:p.dataset.reuseFrame,applied:{id:p.dataset.reuseApplied,frame:p.dataset.reuseAppliedFrame},src:p.querySelector("[data-reuse-preview]").src,saved:[...p.querySelectorAll("[data-reuse-use]")].filter(e=>!e.hidden).map(e=>({id:e.dataset.reuseUse,src:e.querySelector("img")?.src}))}})()');
  await reuseStep('Reuse keeps the original orbit first and opens its optional sample workbench',async()=>{
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll("[data-reuse-play],[data-reuse-demo]").length'),0);
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll("input[type=range]").length'),0);
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll("button[data-reuse-frame]").length'),3);
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll("[aria-live=polite],[role=status]").length'),0,'automatic cycles must not repeatedly announce status');
    await evaluate('(()=>{const p=document.querySelector("[data-reuse-panel=structure]");window.__reuseCyclePhases=[p.dataset.reusePhase];const observer=new MutationObserver(()=>{if(window.__reuseCyclePhases.at(-1)!==p.dataset.reusePhase)window.__reuseCyclePhases.push(p.dataset.reusePhase)});observer.observe(p,{attributes:true,attributeFilter:["data-reuse-phase"]});window.__removeReuseCycleProbe=()=>observer.disconnect()})()');
    try{
      await releaseReuse();
      await waitFor('window.__reuseCyclePhases.filter(phase=>phase==="used").length>=2','two automatic save/retrieve cycles');
      report.reuseAutomaticPhases=await evaluate('window.__reuseCyclePhases');
    }finally{await evaluate('window.__removeReuseCycleProbe?.()');}
    await click('[data-reuse-tab="structure"]');
    await click(reuseIn('structure','[data-reuse-reset]'));
    assert.equal(await evaluate('document.querySelectorAll("#reuse [data-reuse-stage]").length'),3);
    assert.equal(await evaluate('document.querySelectorAll("#reuse character-rig").length'),0);
    assert.equal(await evaluate('document.querySelectorAll("#reuse [data-reuse-reference][open]").length'),0);
    await waitFor(query(reuseIn('structure','[data-reuse-preview]'))+'.naturalWidth>0','approved local structure capture');
    assert.equal(await text(reuseIn('structure','[data-reuse-count]')),'0 / 2');
    assert((await text('.duik-reuse-boundary')).includes('这里只保存网页示例'));
    await shot('reuse-spatial-stage');
  });
  await reuseStep('Selected source saves, transfers and retrieves in the webpage sample library',async()=>{
    await click('[data-reuse-tab="structure"]');await click(reuseIn('structure','[data-reuse-reset]'));
    await click(reuseIn('structure','[data-reuse-select="separated-art"]'));
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reuseSelected'),'separated-art');
    assert((await evaluate(query(reuseIn('structure','[data-reuse-preview]'))+'.src')).endsWith('/layers-exploded.webp'));
    await click(reuseIn('structure','[data-reuse-save]'));
    assert.equal(await text(reuseIn('structure','[data-reuse-count]')),'1 / 2');
    assert.equal(await evaluate(query(reuseIn('structure','[data-reuse-save]'))+'.disabled'),true);
    await click(reuseIn('structure','[data-reuse-select="upper-body"]'));
    await click(reuseIn('structure','[data-reuse-use="separated-art"]'));
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase'),'used');
    assert.equal(await text(reuseIn('structure','[data-reuse-output-title]')),'网页示例结果');
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reuseSelected'),'upper-body');
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reuseApplied'),'separated-art');
    await shot('reuse-retrieved-structure');
  });
  await reuseStep('Animation receipt loops visually without changing its saved frame and yields to manual control',async()=>{
    await click('[data-reuse-tab="animation"]');
    await click(reuseIn('animation','[data-reuse-reset]'));
    await focus(reuseIn('animation','[data-reuse-frame="1"]'));await key('Enter');
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseFrame'),'1');
    await click(reuseIn('animation','[data-reuse-save]'));
    await click(reuseIn('animation','[data-reuse-select="reach"]'));
    await click(reuseIn('animation','[data-reuse-save]'));
    await click(reuseIn('animation','[data-reuse-use="greeting"]'));
    assert.equal(await text(reuseIn('animation','[data-reuse-count]')),'2 / 2');
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseFrame'),'0');
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseAppliedFrame'),'1');
    assert((await evaluate(query(reuseIn('animation','[data-reuse-preview]'))+'.src')).endsWith('/animation-pose.webp'));
    const before=await receiptSnapshot();
    await evaluate('(()=>{const root=document.querySelector("[data-reuse-root]");window.__reuseTransfers=0;const observer=new MutationObserver(entries=>{for(const entry of entries)for(const node of entry.addedNodes)if(node.matches?.(".duik-reuse-transfer"))window.__reuseTransfers++});observer.observe(root,{childList:true,subtree:true});window.__removeReuseProbe=()=>observer.disconnect()})()');
    try{
      await releaseReuse();await waitFor('window.__reuseTransfers>=2','two automatic receipt transfers');
      report.reuseReceiptLoop={before,after:await receiptSnapshot(),transfers:await evaluate('window.__reuseTransfers')};
      assert.deepEqual(report.reuseReceiptLoop.after,before,'looping the illustration never mutates selected, saved, or received frame');
      await focus(reuseIn('animation','[data-reuse-frame="2"]'));await key('Enter');
      const selected=await receiptSnapshot(),transfers=await evaluate('window.__reuseTransfers');
      await waitFor('window.__reuseTransfers>'+transfers,'automatic illustration resumes after storyboard selection while focus remains');
      assert.deepEqual(await receiptSnapshot(),selected,'resuming never changes the selected, saved or received snapshots');
      assert.equal(selected.frame,'2');assert.deepEqual(selected.applied,{id:'greeting',frame:'1'});
      assert.equal(await evaluate(query(reuseIn('animation','[data-reuse-frame="2"]'))+'.getAttribute("aria-pressed")'),'true');
    }finally{await evaluate('window.__removeReuseProbe?.()');}
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseApplied'),'greeting');
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseAppliedFrame'),'1');
    await shot('reuse-storyboard');
  });
  await reuseStep('Script reuse retrieves the documented code without claiming execution',async()=>{
    await click('[data-reuse-tab="scripts"]');
    await click(reuseIn('scripts','[data-reuse-select="wiggle-call"]'));await click(reuseIn('scripts','[data-reuse-save]'));
    await click(reuseIn('scripts','[data-reuse-select="arm-call"]'));await click(reuseIn('scripts','[data-reuse-use="wiggle-call"]'));
    assert((await text(reuseIn('scripts','[data-reuse-code]'))).includes('Duik.Automation.wiggle();'));
    assert((await text(reuseIn('scripts','[data-reuse-sample-note]'))).includes('网页不执行脚本'));
    await shot('reuse-script-sample');
  });
  await reuseStep('Authentic references occupy the same stage and support enlargement and keyboard return',async()=>{
    report.reuseReferences=[];
    for(const id of ['structure','animation','scripts']){
      await click('[data-reuse-tab="'+id+'"]');
      const before=await rect(reusePanel(id));
      await click(reuseIn(id,'[data-reuse-reference] > summary'));
      await waitFor(query(reuseIn(id,'[data-reuse-zoom] img'))+'.naturalWidth>0','real '+id+' panel');
      assert.equal(await evaluate('getComputedStyle('+query(reuseIn(id,'[data-reuse-stage]'))+').visibility'),'hidden');
      const after=await rect(reusePanel(id));assert(Math.abs(before.height-after.height)<2,'reference must not resize pinned host');
      await click(reuseIn(id,'[data-reuse-step="1"]'));assert.equal(await evaluate(query(reusePanel(id))+'.dataset.reuseCurrentStep'),'1');
      await click('[data-reuse-zoom="'+id+'"]');assert.equal(await evaluate(query('[data-reuse-dialog]')+'.open'),true);
      await click('[data-reuse-dialog-scale]');assert.equal(await evaluate(query('[data-reuse-dialog]')+'.dataset.enlarged'),'true');
      await key('Escape');assert.equal(await evaluate(query('[data-reuse-dialog]')+'.open'),false);
      assert.equal(await evaluate('document.activeElement.dataset.reuseZoom'),id);
      const href=await evaluate(query(reuseIn(id,'[data-reuse-step-docs]'))+'.getAttribute("href")');
      const response=await fetch(new URL(href,url),{signal:AbortSignal.timeout(60000)});
      report.reuseReferences.push({href,status:response.status});
      await click(reuseIn(id,'[data-reuse-reference] > summary'));
    }
    assert(report.reuseReferences.every(item=>item.status===200));
  });
  await reuseStep('Reuse automatic loop suspends offscreen and resumes without overwriting user state',async()=>{
    await click('[data-reuse-tab="structure"]');await click(reuseIn('structure','[data-reuse-reset]'));
    await click(reuseIn('structure','[data-reuse-save]'));await click(reuseIn('structure','[data-reuse-use="upper-body"]'));
    await releaseReuse();await waitFor(query(reuseRoot)+'.dataset.reuseDemoState==="playing"','automatic receipt loop starts');
    await scroll(0);await waitFor(query(reuseRoot)+'.dataset.reuseVisible==="false"','reuse offscreen');
    const phase=await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase');await delay(1900);
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase'),phase);
    assert.equal(await evaluate(query(reuseRoot)+'.dataset.reuseDemoState'),'paused');
    await revealHorizontal('#reuse');await releaseReuse();await waitFor(query(reuseRoot)+'.dataset.reuseDemoState==="playing"','reuse automatic loop resumes');
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase'),'used');
    await click(reuseIn('structure','[data-reuse-select="separated-art"]'));await delay(1000);
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reuseSelected'),'separated-art');
  });
  await reuseStep('Reduced motion retains save/use and keyboard tabs with no moving transfer',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    try{
    await click('[data-reuse-tab="structure"]');
    await click(reuseIn('structure','[data-reuse-reset]'));
    await focus('[data-reuse-tab="structure"]');await key('End');assert.equal(await evaluate(query(reuseRoot)+'.dataset.reuseActive'),'scripts');
    await key('Home');assert.equal(await evaluate(query(reuseRoot)+'.dataset.reuseActive'),'structure');
    await focus(reuseIn('structure','[data-reuse-save]'));await key('Enter');
    await focus(reuseIn('structure','[data-reuse-use="upper-body"]'));await key('Enter');
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase'),'used');
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll(".duik-reuse-transfer").length'),0);
    const dimensions=await evaluate('(()=>{const stage='+query(reuseIn('structure','[data-reuse-stage]'))+';return {width:stage.clientWidth,scrollWidth:stage.scrollWidth,overflow:document.documentElement.scrollWidth-innerWidth}})()');
    assert(dimensions.scrollWidth<=dimensions.width+1);assert(dimensions.overflow<=1);report.reuseGeometry=dimensions;
    await shot('reuse-reduced-motion');
    }finally{await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});}
  });
}
