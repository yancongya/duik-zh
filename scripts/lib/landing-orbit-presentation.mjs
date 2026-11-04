import assert from 'node:assert/strict';
import {parse} from 'parse5';
import {orbitIconProps,renderOrbitIcon,orbitDecorativeAlt} from '../../components/home/landing/orbit.mjs';

export function patchOrbitImageAltsRuntime(source){
  const before='alt:r.title||"testimonial"';
  const after='alt:r.title||'+JSON.stringify(orbitDecorativeAlt);
  if(source.includes(after)){
    assert.equal(source.split(after).length-1,1,'Incomplete orbit image alt mapping');
    assert(!source.includes(before),'Mixed orbit image alt mappings');
    return source;
  }
  assert.equal(source.split(before).length-1,1,'Unknown original orbit image alt');
  return source.replace(before,after);
}

const iconName='name:i===0?"ic-kp-testi1":i===1?"ic-kp-testi2":i===2?"ic-kp-testi3":i===3?"ic-kp-testi4":"ic-kp-testi5"';
const oldDesktop='h(l,{'+iconName+',class:k(["transition-opacity duration-500 w-[1.5rem] h-[1.5rem]",b.value===i?"opacity-100":"opacity-50"])},null,8,["name","class"])';
const oldMobile='h(l,{'+iconName+',class:"transition-opacity duration-500 w-[1.5rem] h-[1.5rem] mobile-testi-icon"},null,8,["name"])';
const render='s("span",duikOrbitIconProps(i),null,16)';
const prefix='import {orbitIconProps as duikOrbitIconProps} from "/duik-experience/orbit.mjs";\n';

/** Replace only the two icon render expressions; keep all orbital motion and
 * the selected item's original progress-border drawing intact. */
export function patchOrbitIconsRuntime(source){
  if(source.includes('duikOrbitIconProps')){
    assert.equal(source.split(prefix).length-1,1,'Missing orbit icon import');
    assert.equal(source.split(render).length-1,2,'Incomplete orbit icon renders');
    assert(!source.includes('ic-kp-testi'),'Mixed orbit icon mappings');
    return source;
  }
  for(const before of [oldDesktop,oldMobile]){
    assert.equal(source.split(before).length-1,1,'Unknown original orbit icon render');
    source=source.replace(before,render);
  }
  return prefix+source;
}

/** The capture contains the mobile five-slide branch. Also support the five
 * desktop selectors without depending on the white SVG path geometry. */
export function patchOrbitIconsSSR(html){
  const edits=[],existing=[];let roots=0;
  function visit(node,owner=false){
    const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
    const classes=(attrs.class||'').split(/\s+/);
    if(classes.includes('home-testimonial-capabilities-kp')){owner=true;roots++;}
    if(owner&&Object.hasOwn(attrs,'data-duik-orbit-icon')){existing.push({node,attrs});return;}
    if(owner&&node.tagName==='svg'&&classes.includes('transition-opacity')&&classes.includes('w-[1.5rem]')&&classes.includes('h-[1.5rem]')){
      const loc=node.sourceCodeLocation;
      edits.push({start:loc.startOffset,end:loc.endOffset,value:renderOrbitIcon(edits.length)});
      return;
    }
    for(const child of node.childNodes||[])visit(child,owner);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));
  assert.equal(roots,1,'Expected one original orbit root');
  assert((edits.length===5&&existing.length===0)||(edits.length===0&&existing.length===5),'Partially adapted orbit icons');
  for(const [index,{node,attrs}] of existing.entries()){
    assert.equal(node.tagName,'span','Invalid existing orbit icon element');
    assert.deepEqual(attrs,{...orbitIconProps(index),'data-v-775aae4b':''},'Invalid existing orbit icon mapping');
    assert.equal(node.childNodes.length,0,'Invalid existing orbit icon content');
  }
  for(const edit of edits.sort((a,b)=>b.start-a.start))html=html.slice(0,edit.start)+edit.value+html.slice(edit.end);
  return html;
}
