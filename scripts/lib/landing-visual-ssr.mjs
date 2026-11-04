/** Pure SSR patch helper: importing this file never reads or writes files. */
import assert from 'node:assert/strict';
import {capabilityVisuals,capabilityVisualTree} from '../../components/home/landing/visual-capability-tree.mjs';

export const landingVisualStyleHref='/duik-landing-visuals/visual-scenes.css';
const oldClasses=[
  'relative flex gap-[2.5rem] md:gap-[3.75rem] lg:gap-[6.625rem] items-center',
  'relative flex lg:gap-[6.625rem] md:gap-[3.75rem] gap-[1.5rem] items-center'
];
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function renderTree(tree){
  if(typeof tree==='string')return escape(tree);
  let attributes='';
  for(const [name,value]of Object.entries(tree.attrs||{})){
    if(value===undefined||value===null)continue;
    const attribute=name==='style'?Object.entries(value).map(([key,item])=>key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())+':'+item+';').join(''):value;
    attributes+=' '+name+'="'+escape(attribute)+'"';
  }
  const opening='<'+tree.tag+attributes+'>';
  if(tree.tag==='img')return opening;
  const children=Array.isArray(tree.children)?tree.children.map(renderTree).join(''):tree.children===undefined?'':escape(tree.children);
  return opening+children+'</'+tree.tag+'>';
}
export function renderCapabilityVisualSSR(index){return renderTree(capabilityVisualTree(index));}

function divEnd(html,start){
  const tags=/<\/?div\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/g;
  tags.lastIndex=start;let depth=0,match;
  while((match=tags.exec(html))){
    depth+=match[0].startsWith('</')?-1:1;
    if(depth===0)return tags.lastIndex;
  }
  throw Error('Unbalanced capability visual div');
}

/** Replaces only the three original diagram roots inside the existing wrapper.
 * Repeated calls refresh our three roots from the same source tree (idempotent).
 * The caller owns writing landing.html and stylesheet inclusion. */
export function patchLandingVisualSSR(html){
  const wrapper=/<div\b[^>]*class="[^"]*\bkp-home-capabilities-wrap\b[^"]*"[^>]*>/.exec(html);
  assert(wrapper,'Capabilities wrapper must exist before patching its child visuals');
  const end=divEnd(html,wrapper.index),segment=html.slice(wrapper.index,end);
  const roots=[];
  for(const match of segment.matchAll(/<div\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/g)){
    const tag=match[0],className=/\bclass="([^"]*)"/.exec(tag)?.[1],id=/\bdata-duik-capability-visual="([^"]*)"/.exec(tag)?.[1];
    if(!oldClasses.includes(className)&&!id)continue;
    const index=id?capabilityVisuals.findIndex(visual=>visual.id===id):roots.length;
    assert(index>=0&&index<3,'Unexpected or repeated capability visual root');
    roots.push({start:match.index,end:divEnd(segment,match.index),index});
  }
  assert.equal(roots.length,3,'Exactly three original or migrated capability roots must exist');
  assert.equal(new Set(roots.map(item=>item.index)).size,3,'Each capability must appear exactly once');
  let replaced=segment;
  for(const item of roots.reverse())replaced=replaced.slice(0,item.start)+renderCapabilityVisualSSR(item.index)+replaced.slice(item.end);
  return html.slice(0,wrapper.index)+replaced+html.slice(end);
}
