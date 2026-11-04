import assert from 'node:assert/strict';
import {parse} from 'parse5';

const marker='// duik-capability-resize-v3\n';
const previousMarker='// duik-capability-resize-v2\n';
const legacyMarker='// duik-capability-resize-v1\n';

// Keep the capture's measurement formulas and complete GSAP timeline intact.
// Re-run that owner only after Vue commits the new desktop/mobile branch, then
// let ScrollTrigger read the current physical scroll position and new spacer.
export function patchCapabilityResizeRuntime(source) {
  if(source.startsWith(marker))return source;
  const previous=source.startsWith(previousMarker);
  const legacy=source.startsWith(legacyMarker);
  let code=previous?source.slice(previousMarker.length):legacy?source.slice(legacyMarker.length):source;
  const replace=(from,to)=>{
    assert.equal(code.split(from).length-1,1,'Unknown capability resize anchor: '+from);
    code=code.replace(from,to);
  };
  // A scroll-measured host must never become an offscreen 500px placeholder.
  // Remove this from the render contract, not after mounted or on resize.
  if(!previous)replace('class:"relative contain-paint kp-home-capabilities-wrap",style:le(_(Y)?"":"content-visibility: auto; contain-intrinsic-block-size: auto 500px;")',
    'class:"relative contain-paint kp-home-capabilities-wrap"');
  if(!previous&&!legacy){
    replace('import{e as Xe,a5 as Ye,f as Ze',
      'import{ac as duikCapabilityNextTick,e as Xe,a5 as Ye,f as Ze');
    replace('let S,z;',
      'let S,z,duikCapabilityFrame=null,duikCapabilityGeneration=0,duikCapabilityDisposed=false;');
    replace('u(),z=()=>{Y.value&&!me||(ae(),te(),u())},window.addEventListener("resize",z)',`u(),z=()=>{
    if(duikCapabilityDisposed)return;
    duikCapabilityGeneration++;
    if(duikCapabilityFrame!==null)return;
    const frame=requestAnimationFrame(async()=>{
      if(duikCapabilityDisposed||duikCapabilityFrame!==frame)return;
      duikCapabilityFrame=null;
      const generation=duikCapabilityGeneration;
      ae();te();
      await duikCapabilityNextTick();
      if(duikCapabilityDisposed||generation!==duikCapabilityGeneration)return;
      u();
      await duikCapabilityNextTick();
      if(duikCapabilityDisposed||generation!==duikCapabilityGeneration)return;
      oe.refresh();
    });
    duikCapabilityFrame=frame;
  },window.addEventListener("resize",z)`);
    replace('et(()=>{S&&S.revert(),typeof window<"u"&&z&&window.removeEventListener("resize",z)})',`et(()=>{
    duikCapabilityDisposed=true;
    duikCapabilityGeneration++;
    if(duikCapabilityFrame!==null)cancelAnimationFrame(duikCapabilityFrame);
    duikCapabilityFrame=null;
    S&&S.revert();
    typeof window<"u"&&z&&window.removeEventListener("resize",z);
  })`);
  }
  // CSS uses a vertical, unpinned layout under reduced motion. Do not let the
  // captured horizontal owner keep writing transforms or measure that layout.
  // The original u() body is untouched: normal motion keeps every formula and
  // phase. Both media changes and resize go through the same guarded Vue queue.
  replace('let S,z,duikCapabilityFrame=null,duikCapabilityGeneration=0,duikCapabilityDisposed=false;',
    'let S,z,duikCapabilityFrame=null,duikCapabilityGeneration=0,duikCapabilityDisposed=false,duikCapabilityMotion=null;');
  replace(';u(),z=()=>{',`;const duikCapabilityRebuild=()=>{
    if(duikCapabilityMotion?.matches){
      S&&S.revert();S=undefined;B.value="0px";
      return;
    }
    u();
  };
  duikCapabilityMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")||null;
  duikCapabilityRebuild(),z=()=>{`);
  replace('\n      u();\n', '\n      duikCapabilityRebuild();\n');
  replace('},window.addEventListener("resize",z)',
    '},window.addEventListener("resize",z),duikCapabilityMotion?.addEventListener("change",z)');
  replace('typeof window<"u"&&z&&window.removeEventListener("resize",z);',
    'typeof window<"u"&&z&&window.removeEventListener("resize",z);\n    duikCapabilityMotion?.removeEventListener("change",z);');
  return marker+code;
}

// Preserve unrelated declarations, including semicolons inside URL functions,
// quoted values and comments. Only top-level declaration names are examined.
function withoutPlaceholder(style){
  const result=[];
  let start=0,quote='',comment=false,depth=0;
  const append=end=>{
    const declaration=style.slice(start,end);
    const property=declaration.replace(/\/\*[\s\S]*?\*\//g,'').split(':',1)[0].trim().toLowerCase();
    if(property!=='content-visibility'&&property!=='contain-intrinsic-block-size')result.push(declaration);
    start=end;
  };
  for(let index=0;index<style.length;index++){
    const char=style[index],next=style[index+1];
    if(comment){if(char==='*'&&next==='/'){comment=false;index++;}continue;}
    if(quote){if(char==='\\'){index++;continue;}if(char===quote)quote='';continue;}
    if(char==='/'&&next==='*'){comment=true;index++;continue;}
    if(char==='"'||char==="'"){quote=char;continue;}
    if(char==='\\'){index++;continue;}
    if(char==='('||char==='['||char==='{')depth++;
    else if(char===')'||char===']'||char==='}')depth=Math.max(0,depth-1);
    else if(char===';'&&depth===0)append(index+1);
  }
  append(style.length);
  return result.join('');
}

export function patchCapabilityResizeSSR(html){
  const patches=[];
  let hosts=0;
  const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  function visit(node){
    const classes=node.attrs?.find(attr=>attr.name==='class')?.value.split(/\s+/)||[];
    if(classes.includes('kp-home-capabilities-wrap')){
      hosts++;
      const attr=node.attrs.find(attr=>attr.name==='style');
      if(attr){
        const value=withoutPlaceholder(attr.value);
        if(value!==attr.value){
          const loc=node.sourceCodeLocation.attrs.style;
          patches.push({start:loc.startOffset,end:loc.endOffset,value:value.trim()?'style="'+escape(value)+'"':''});
        }
      }
    }
    for(const child of node.childNodes||[])visit(child);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));
  assert.equal(hosts,1,'Expected one measured capability host');
  for(const patch of patches.sort((a,b)=>b.start-a.start))html=html.slice(0,patch.start)+patch.value+html.slice(patch.end);
  return html;
}
