import assert from 'node:assert/strict';

// Adapt the captured component in place. The four shaders, pulse/scroll maths,
// blur passes, bloom and visible show/hide durations remain capture-owned.
export function patchGlowLifecycle(source) {
  if (source.startsWith('// duik-glow-lifecycle-v1\n')) return source;
  let code=source;
  const replace=(from,to)=>{
    assert.equal(code.split(from).length-1,1,'Unknown glow lifecycle anchor: '+from);
    code=code.replace(from,to);
  };

  replace('N=()=>{Q.to(S,{value:1,duration:1,ease:"power2.out"}),ce(1,.5)},G=()=>{Q.to(S,{value:0,duration:1.5,ease:"power2.out"})},te=o=>{Q.killTweensOf(S),S.value=o.detail.progress};ge(()=>be.active,o=>{o?N():G()},{immediate:!0});',
    'N=()=>{duikOpacity(1,1),ce(1,.5)},G=()=>{duikOpacity(0,1.5)},te=o=>{if(duikDisposed)return;duikClearTweens(),S.value=o.detail.progress,duikSyncGlow()};');

  replace('function V(){if(!h.value)return;const o=se(),u=h.value;X=u.clientWidth,I=u.clientHeight,u.width=X*o,u.height=I*o,e&&fe()}',
    'function V(){if(duikDisposed||!h.value)return;const o=se(),u=h.value;X=u.clientWidth,I=u.clientHeight,u.width=X*o,u.height=I*o,e&&fe(),duikSyncGlow()}');
  replace('function ce(o=1.001,u=.5){m=0,$=[o,u]}',
    'function ce(o=1.001,u=.5){if(duikDisposed)return;m=duikMotion?.matches?1:0,$=[o,u],duikSyncGlow()}');

  // The async noise upload must also invalidate a reduced-motion still frame.
  replace('e.UNSIGNED_BYTE,s))},q=e.createBuffer()',
    'e.UNSIGNED_BYTE,s),duikSyncGlow())},q=e.createBuffer()');

  replace('let j=!1;function me(o){if(D=requestAnimationFrame(me),!e||!d)return;',`let j=!1;
let duikDisposed=false,duikReady=false,duikInitTimer=null,duikRevealTimer=null,duikFrameGeneration=0,duikPausedAt=null;
const duikMotion=typeof window!=="undefined"&&typeof window.matchMedia==="function"?window.matchMedia("(prefers-reduced-motion: reduce)"):null,duikTweens=new Set();
function duikCanShow(){return !duikDisposed&&typeof document!=="undefined"&&!document.hidden}
function duikCanRun(){return duikCanShow()&&!duikMotion?.matches}
function duikClearTweens(){for(const tween of duikTweens)tween.kill();duikTweens.clear();Q.killTweensOf(S)}
function duikOpacity(value,duration){
  if(duikDisposed)return;
  if(duikMotion?.matches){duikClearTweens();S.value=value;duikSyncGlow();return}
  let tween;
  tween=Q.to(S,{value,duration,ease:"power2.out",onComplete(){duikTweens.delete(tween)}});
  duikTweens.add(tween);
  if(!duikCanRun())tween.pause();
}
function duikStopFrame(){
  duikFrameGeneration++;
  if(D!==null){cancelAnimationFrame(D);D=null}
  M=0;
  if(duikReady&&duikPausedAt===null)duikPausedAt=performance.now();
}
function duikQueueFrame(){
  if(!duikReady||!duikCanRun()||D!==null)return;
  if(duikPausedAt!==null){re+=performance.now()-duikPausedAt;duikPausedAt=null}
  const generation=duikFrameGeneration;
  const frame=requestAnimationFrame(time=>{
    if(duikDisposed||generation!==duikFrameGeneration||D!==frame)return;
    D=null;me(time);
  });
  D=frame;
}
function duikSyncGlow(){
  if(duikDisposed)return;
  const running=duikCanRun();
  for(const tween of duikTweens)running?tween.resume():tween.pause();
  if(!duikReady)return;
  if(running)duikQueueFrame();
  else{duikStopFrame();if(duikCanShow())me(duikPausedAt??performance.now(),true)}
}
function duikDisposeGlow(){
  duikDisposed=true;duikReady=false;duikStopFrame();duikClearTweens();
  if(duikInitTimer!==null)clearTimeout(duikInitTimer);
  if(duikRevealTimer!==null)clearTimeout(duikRevealTimer);
  duikInitTimer=duikRevealTimer=null;
  if(typeof document!=="undefined")document.removeEventListener("visibilitychange",duikSyncGlow);
  duikMotion?.removeEventListener("change",duikSyncGlow);
}
function me(o,duikStatic=false){if(!duikReady||!duikCanShow()||(!duikStatic&&!duikCanRun())||!e||!d)return;duikStatic||duikQueueFrame();`);
  // A paused pulse cannot run itself to completion. Hide must clear its static
  // output, while leaving m intact for a later return to the original timeline.
  replace('if(u===0&&m>=1){', 'if(u===0&&(duikStatic||m>=1)){');
  replace('j=!0),M=o;return}', 'j=!0),M=duikStatic?0:o;return}');
  replace('const i=(o-re)/1e3,n=M?(o-M)/1e3:.016;M=o;',
    'const i=(o-re)/1e3,n=duikStatic?0:M?(o-M)/1e3:.016;M=duikStatic?0:o;');

  // Move the immediate active watcher past the lifecycle state it now uses.
  // Initialization/readiness retain the original 100/500 ms and 50 ms delays.
  replace('return Be(()=>{if(typeof window<"u"){if(!h.value)return;V();const o=()=>{Te(h.value)&&(fe(),re=performance.now(),M=0,m=1,D=requestAnimationFrame(me),setTimeout(()=>{le.value=!0},50))};window.requestIdleCallback?setTimeout(o,100):setTimeout(o,500),window.addEventListener("resize",V)',
    'ge(()=>be.active,o=>{o?N():G()},{immediate:!0});return Be(()=>{if(typeof window<"u"){if(duikDisposed||!h.value)return;V();const o=()=>{duikInitTimer=null;if(duikDisposed||!h.value)return;Te(h.value)&&(fe(),re=performance.now(),M=0,m=1,duikReady=true,duikSyncGlow(),duikRevealTimer=setTimeout(()=>{duikRevealTimer=null;if(!duikDisposed)le.value=!0},50))};duikInitTimer=setTimeout(o,window.requestIdleCallback?100:500),document.addEventListener("visibilitychange",duikSyncGlow),duikMotion?.addEventListener("change",duikSyncGlow),window.addEventListener("resize",V)');
  replace('Fe(()=>{typeof window<"u"&&(D&&cancelAnimationFrame(D),window.removeEventListener("resize",V)',
    'Fe(()=>{duikDisposeGlow();typeof window<"u"&&(window.removeEventListener("resize",V)');
  return '// duik-glow-lifecycle-v1\n'+code;
}
