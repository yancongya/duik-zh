import assert from 'node:assert/strict';
import {parse} from 'parse5';

/** Remove only the copied site's ownership and billing head entries. Keep the
 * rest byte-for-byte: in particular Nuxt bootstrap, preload and SVG metadata. */
export function cleanTemplateHead(html){
  const document=parse(html,{sourceCodeLocationInfo:true});
  const head=document.childNodes.find(node=>node.tagName==='html')?.childNodes.find(node=>node.tagName==='head');
  assert(head?.sourceCodeLocation,'Expected an explicit landing head');
  const removals=head.childNodes.filter(node=>{
    const attrs=Object.fromEntries((node.attrs||[]).map(attr=>[attr.name,attr.value]));
    return (node.tagName==='meta'&&attrs.name?.toLowerCase()==='p:domain_verify')||
      (node.tagName==='script'&&attrs['data-hid']==='pricing-billing-toggle');
  }).map(node=>node.sourceCodeLocation);
  for(const {startOffset,endOffset} of removals.sort((a,b)=>b.startOffset-a.startOffset)){
    html=html.slice(0,startOffset)+html.slice(endOffset);
  }
  return html;
}
