import assert from 'node:assert/strict';

const owner='// duik-capability-resize-v3\n';
const marker='// duik-capability-keyboard-v1\n';
const changes=[
  [owner,owner+marker+'import{mountCapabilityKeyboardFocus}from"/duik-experience/capability-keyboard.mjs";\n'],
  ['duikCapabilityMotion=null;','duikCapabilityMotion=null,duikCapabilityKeyboard=null;'],
  ['duikCapabilityRebuild(),z=()=>{',`duikCapabilityRebuild();
  duikCapabilityKeyboard=mountCapabilityKeyboardFocus({
    root:document.querySelector(".kp-home-capabilities-wrap"),
    getTrigger:()=>oe.getById("capabilities-master-trigger"),
    gsap:M,isReduced:()=>!C.value||!!duikCapabilityMotion?.matches,
    sync:()=>oe.update(),
    revealOrbit:target=>{
      const trigger=oe.getById("capabilities-master-trigger"),total=j+q+V+ee;
      const orbit=target.closest("#reuse");
      if(!orbit||!trigger||total<=0)return;
      const selected=orbit.querySelector('[data-duik-orbit-step][aria-pressed="true"]');
      const index=Math.max(0,Math.min(4,Number(selected?.getAttribute("data-duik-orbit-step"))||0));
      const top=trigger.start+(j+q+index/5*V)/total*(trigger.end-trigger.start);
      if(!Number.isFinite(top))return;
      window.lenis?window.lenis.scrollTo(top,{immediate:true}):window.scrollTo({top,behavior:"instant"});
      oe.update();
    }
  });
  z=()=>{`],
  ['if(duikCapabilityDisposed)return;\n    duikCapabilityGeneration++;','if(duikCapabilityDisposed)return;\n    duikCapabilityKeyboard?.suspend();\n    duikCapabilityGeneration++;'],
  ['      oe.refresh();\n','      oe.refresh();\n      duikCapabilityKeyboard?.resume();\n'],
  ['    duikCapabilityDisposed=true;\n','    duikCapabilityDisposed=true;\n    duikCapabilityKeyboard?.dispose();\n'],
];

// Add only focus coordination around the original measured owner. The helper
// reads the current timeline; it never duplicates the captured travel formulas.
export function patchCapabilityKeyboardRuntime(source){
  assert(source.startsWith(owner),'Keyboard handoff requires the guarded resize owner');
  if(source.includes(marker)){
    for(const [,after]of changes)assert.equal(source.split(after).length-1,1,'Incomplete capability keyboard patch');
    return source;
  }
  let code=source;
  for(const [before,after]of changes){
    assert.equal(code.split(before).length-1,1,'Unknown capability keyboard anchor: '+before);
    code=code.replace(before,after);
  }
  return code;
}
