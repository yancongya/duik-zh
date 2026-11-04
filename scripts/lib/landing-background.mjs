import assert from 'node:assert/strict';

// Adapt the captured shader, not a new animation system. UV warping, the scroll
// velocity, pulse, active lens and section color weights stay owned by Linearity.
export function patchLightBackground(source) {
  if (source.startsWith('// duik-light-background-v1\n')) return source;
  let code=source;
  const replace=(from,to)=>{
    assert.equal(code.split(from).length-1,1,'Unknown background anchor: '+from);
    code=code.replace(from,to);
  };
  for(const [from,to] of [
    ['colors:["#3bffbd","#8a0000","#ffd400","#ff3300"]','colors:["#a3bba0","#de967b","#eed49b","#e8b879"]'],
    ['float rVal = 0.0;','float rVal = 0.97255;'],
    ['float gVal = 0.0;','float gVal = 0.96471;'],
    ['float bVal = 0.0;','float bVal = 0.94118;'],
    ['vec3 hotColor = vec3(1.0, 0.85, 0.1);','vec3 hotColor = vec3(0.98, 0.88, 0.68);'],
    ['col = mix(col, col * col + 0.5 * sqrt(col), 0.3 + u_activeProgress * 0.15);','col = mix(col, col * 0.97, u_activeProgress * 0.15);'],
    ['let p=0;const _=(v,x)=>{if(p+=','let p=0;const duikMotion=typeof window!=="undefined"?window.matchMedia("(prefers-reduced-motion: reduce)"):null,duikRunning=bn(false);const duikSyncBackground=()=>{duikRunning.value=!document.hidden&&!duikMotion?.matches};const _=(v,x)=>{if(!duikRunning.value)return;if(p+='],
    ['u(),window.addEventListener("resize",u)','u(),duikSyncBackground(),document.addEventListener("visibilitychange",duikSyncBackground),duikMotion?.addEventListener("change",duikSyncBackground),window.addEventListener("resize",u)'],
    ['window.removeEventListener("resize",u)','document.removeEventListener("visibilitychange",duikSyncBackground),duikMotion?.removeEventListener("change",duikSyncBackground),window.removeEventListener("resize",u)'],
    ['"clear-color":"#050505","window-size":!0,dpr:s.value,alpha:""','"clear-color":"#f8f6f0","window-size":!0,"render-mode":duikRunning.value?"always":"on-demand",dpr:s.value,alpha:""'],
    ['},8,["dpr"])):Vp','},8,["dpr","render-mode"])):Vp'],
  ]) replace(from,to);
  // All original scenarios share the same pigments; only their area changes.
  assert.equal(code.split('colors:["#37ffbc","#940a03","#dfa006","#ff3d00"]').length-1,3);
  code=code.replaceAll('colors:["#37ffbc","#940a03","#dfa006","#ff3d00"]','colors:["#a3bba0","#de967b","#eed49b","#e8b879"]');
  return '// duik-light-background-v1\n'+code;
}
