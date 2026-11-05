import assert from 'node:assert/strict';
import {parse} from 'parse5';
import {renderOrbitDocumentation} from '../../components/home/landing/orbit.mjs';

// The three motion stages already have a specific guide link beside their
// controls. Remove only the duplicated global CTA fields in this component.
export function patchCapabilityLinksRuntime(source) {
  const before='ctaOutlineText:s.ctaOutlineText||"",ctaOutlineLink:s.ctaOutlineLink||null,ctaPrimaryText:s.ctaPrimaryText||"",ctaPrimaryLink:s.ctaPrimaryLink||null';
  const after='ctaOutlineText:"",ctaOutlineLink:null,ctaPrimaryText:"",ctaPrimaryLink:null';
  if(source.includes(after)){assert.equal(source.split(after).length-1,1);assert(!source.includes(before),'Mixed capability CTA mappings');return source;}
  assert.equal(source.split(before).length-1,1,'Unknown capability CTA mapping');
  return source.replace(before,after);
}

// Follow the original selected orbit item (or swiper item), not a separate
// timer or wrapper state. Arrival/outgoing motion and selection are unchanged.
export function patchOrbitLinksRuntime(source) {
  const marker='data-duik-orbit-doc';
  const start='o.blok?.testiCtaOutlineLink&&o.blok?.testiCtaOutlineText||o.blok?.testiCtaPrimaryLink&&o.blok?.testiCtaPrimaryText?';
  const call='duikOrbitDocumentFor(S.value?b.value:A.value)';
  const render='s("a",{class:"duik-orbit-doc","data-duik-orbit-doc":"",href:'+call+'.href},'+call+'.label,9,["href"])';
  const prefix='import {orbitDocumentationFor as duikOrbitDocumentFor} from "/duik-experience/orbit.mjs";\n';
  if(source.includes(marker)){
    assert.equal(source.split(render).length-1,1,'Incomplete orbit documentation render');
    assert.equal(source.split(prefix).length-1,1,'Missing or duplicated orbit documentation import');
    assert(!source.includes(start),'Mixed orbit CTA mappings');
    return source;
  }
  const end=']),s("div",Ae,';
  assert.equal(source.split(start).length-1,1,'Unknown orbit CTA condition');
  const from=source.indexOf(start),to=source.indexOf(end,from);
  assert(to>from&&to-from<1200,'Unknown orbit CTA boundary');
  return prefix+source.slice(0,from)+render+source.slice(to);
}

export function patchCapabilityLinksSSR(html) {
  const edits=[];
  const attrs=node=>Object.fromEntries((node.attrs||[]).map(attr=>[attr.name,attr.value]));
  const motionClass='flex items-center gap-[.8rem] md:gap-[1.25rem] mt-[2rem]';
  const orbitClass='flex items-center gap-[.8rem] md:gap-[1.25rem] md:mt-[2rem] mt-[1.6rem] justify-center lg:justify-start';
  let motionCards=0,orbitRoots=0,remainingButtons=0,contextLinks=0;
  function visit(node,owner){
    const a=attrs(node),classes=(a.class||'').split(/\s+/);
    if(classes.includes('duik-capability-card')){owner='motion';motionCards++;}
    if(classes.includes('home-testimonial-capabilities-kp')){owner='orbit';orbitRoots++;}
    if(owner&&node.tagName==='a'&&classes.includes('btn-group'))remainingButtons++;
    if(owner==='orbit'&&Object.hasOwn(a,'data-duik-orbit-doc'))contextLinks++;
    if(owner&&a.class===(owner==='motion'?motionClass:orbitClass)){
      const links=(node.childNodes||[]).filter(child=>child.tagName==='a');
      assert.equal(links.length,2,'Expected the original pair of global CTAs');
      assert(links.every(link=>(attrs(link).class||'').split(/\s+/).includes('btn-group')));
      const loc=node.sourceCodeLocation;
      edits.push({start:loc.startOffset,end:loc.endOffset,value:owner==='motion'?'<!---->':renderOrbitDocumentation()});
      return;
    }
    for(const child of node.childNodes||[])visit(child,owner);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));
  assert.equal(motionCards,3,'Expected all three motion cards');
  assert.equal(orbitRoots,1,'Expected the original orbit root');
  // A second publication must leave the already adapted markup untouched.
  assert([0,4].includes(edits.length),'Partially adapted capability CTAs');
  if(edits.length===0){
    assert.equal(contextLinks,1,'Missing adapted orbit documentation link');
    assert.equal(remainingButtons,0,'Unexpected legacy capability CTA structure');
  }else assert.equal(contextLinks,0,'Mixed original and adapted orbit CTAs');
  for(const edit of edits.sort((a,b)=>b.start-a.start))html=html.slice(0,edit.start)+edit.value+html.slice(edit.end);
  return html;
}
