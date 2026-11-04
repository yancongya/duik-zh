import assert from 'node:assert/strict';
import {parse} from 'parse5';

// Keep the original measured GSAP track. These markers own only its composition.
export const capabilityClasses = Object.freeze([
  ['h-full flex-row gap-[45rem] flex kp-home-capabilities-content-list', 'duik-capability-track'],
  ['flex flex-row gap-[18rem] justify-between items-center self-center flex-none', 'duik-capability-card'],
  ['relative w-full aspect-[91/62] rounded-[1.2rem] flex justify-center items-center p-6 md:p-8 mb-[2.4rem]', 'duik-capability-mobile-art'],
]);

export function patchCapabilityLayoutRuntime(source) {
  let code=source;
  for (const [original, marker] of capabilityClasses) {
    const current=JSON.stringify(original), patched=JSON.stringify(original+' '+marker);
    if(code.includes(patched)){assert.equal(code.split(patched).length-1,1);continue;}
    assert.equal(code.split(current).length-1,1,'Unknown capability layout: '+marker);
    code=code.replace(current,patched);
  }
  return code;
}

export function patchCapabilityLayoutSSR(html,titles) {
  const patches=[],counts=new Map(capabilityClasses.map(([,marker])=>[marker,0]));
  let titleIndex=0;
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  function patchTitle(node){
    const classes=node.attrs?.find(attr=>attr.name==='class')?.value?.split(/\s+/)||[];
    if(classes.includes('h2')){
      const span=node.childNodes?.find(child=>child.tagName==='span');
      assert(span?.sourceCodeLocation,'Missing capability title span');
      assert.equal(typeof titles[titleIndex],'string','Missing capability title');
      const loc=span.sourceCodeLocation;
      patches.push({start:loc.startTag.endOffset,end:loc.endTag.startOffset,value:escape(titles[titleIndex++]).replaceAll('\n','<br>')});
      return;
    }
    for(const child of node.childNodes||[])patchTitle(child);
  }
  function visit(node) {
    const value=node.attrs?.find(attr=>attr.name==='class')?.value;
    for(const [original,marker] of capabilityClasses){
      if(value!==original&&value!==original+' '+marker)continue;
      counts.set(marker,counts.get(marker)+1);
      if(titles&&marker==='duik-capability-card')patchTitle(node);
      if(value===original){const loc=node.sourceCodeLocation.attrs.class;patches.push({start:loc.startOffset,end:loc.endOffset,value:'class="'+original+' '+marker+'"'});}
    }
    for(const child of node.childNodes||[])visit(child);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));
  assert.equal(counts.get('duik-capability-track'),1,'Expected one measured desktop track');
  assert.equal(counts.get('duik-capability-card'),3,'Expected three desktop motion cards');
  if(titles)assert.equal(titleIndex,3,'Expected three complete capability headings');
  // The mobile branch is mounted by Vue, and is absent in captured desktop SSR.
  assert([0,3].includes(counts.get('duik-capability-mobile-art')),'Unexpected mobile scene wrappers');
  for(const patch of patches.sort((a,b)=>b.start-a.start))html=html.slice(0,patch.start)+patch.value+html.slice(patch.end);
  return html;
}
