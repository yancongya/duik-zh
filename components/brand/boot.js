// Inlined before #__nuxt. No imports, no framework readiness dependency.
// A failed bundle cannot strand the page behind this optional introduction.
(() => {
  const root=document.getElementById('duik-boot');
  if(!root||root.dataset.mounted)return;
  root.dataset.mounted='true';
  const image=root.querySelector('img'),media=matchMedia('(prefers-reduced-motion: reduce)');
  const timers=new Set(),listeners=[];
  const startedAt=Date.now(),introMs=1800,exitMs=820,revealDelay=140,revealMs=1180;
  const page=document.documentElement;
  let done=false,shown=false,observer,settled=false,exiting=false,removed=false;
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
  const listen=(target,type,fn)=>{target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener(type,fn));};
  const clearTimers=()=>{timers.forEach(clearTimeout);timers.clear();};
  const removeOverlay=()=>{if(removed)return;removed=true;root.remove();};
  function release(reason){
    if(done)return;done=true;
    clearTimers();observer?.disconnect();listeners.forEach(off=>off());
    root.dataset.state=reason;
    page.dataset.duikBoot=reason;
    delete page.dataset.duikEntry;
    root.removeAttribute('data-active');root.setAttribute('aria-hidden','true');
    removeOverlay();
  }
  function finish(reason){
    if(done)return;
    // Input/error/background must still interrupt the exit, not only loading.
    if(!['ready','timeout'].includes(reason)||!shown||media.matches||document.hidden){release(reason);return;}
    if(exiting)return;exiting=true;
    clearTimers();observer?.disconnect();
    root.dataset.state='exiting';page.dataset.duikBoot=reason;
    root.setAttribute('aria-hidden','true');
    // Preserve the SVG's frame. The host moves it toward the lens while the
    // veil dissolves and independent Hero children come into focus.
    later(()=>{page.dataset.duikEntry='revealing';},revealDelay);
    later(removeOverlay,exitMs);
    // No transitionend dependency; release CSS ownership after the last stagger.
    later(()=>release(reason),revealDelay+revealMs);
  }
  function inspect(){
    if(done||exiting)return;
    const state=document.querySelector('.kp-home-hero-main-input-wrap .duik-character-stage')?.dataset.rigState;
    if(state==='error'){finish('error');return;}
    if(state==='ready'&&!settled){
      settled=true;
      // User-approved brand entrance also plays on warm cache. Resource work
      // is never held back; only the visual handoff waits for the entry to land.
      const remaining=Math.max(0,introMs-(Date.now()-startedAt));
      if(remaining)later(()=>finish('ready'),remaining);else finish('ready');
    }
  }
  if(media.matches||document.hidden||location.hash){finish(media.matches?'reduced':location.hash?'deep-link':'background');return;}
  listen(document,'visibilitychange',()=>{if(document.hidden)finish('background');});
  listen(window,'pagehide',()=>finish('pagehide'));
  listen(window,'pageshow',event=>{if(event.persisted)finish('restored');});
  listen(media,'change',()=>{if(media.matches)finish('reduced');});
  for(const type of ['pointerdown','keydown','wheel','touchstart','hashchange'])listen(window,type,()=>finish('interaction'));
  observer=new MutationObserver(inspect);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-rig-state']});
  shown=true;page.dataset.duikEntry='pending';root.dataset.active='true';root.setAttribute('aria-hidden','false');root.dataset.state='loading';
  image.src='/brand/v1/logo-loader.svg';
  inspect();
  if(done)return;
  later(()=>finish('timeout'),5000);
})();
