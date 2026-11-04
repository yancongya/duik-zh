import assert from 'node:assert/strict';
import {parse} from 'parse5';
import ts from 'typescript';
import {heroRibbon} from '../../components/home/landing/content.mjs';

const originalClass='relative w-full flex flex-row lg:grid lg:grid-cols-[minmax(0px,1fr)_auto_minmax(0px,1fr)] items-center md:gap-[2rem] gap-[1.25rem]';
const marker='duik-hero-ribbon';
const viewportMarker='duik-hero-ribbon-window';
const guideClass='duik-hero-ribbon-guide';
const guideContent=`<img src="${heroRibbon.icon}" width="22" height="22" alt=""><span>${heroRibbon.label}</span>`;
const guideMarkup=`<a class="${guideClass}" href="${heroRibbon.href}">${guideContent}</a>`;
const toolsMarkup='<a class="duik-hero-ribbon-toggle" href="#toolkit">查找工具</a>';

// Keep the original Hero-owned bottom strip. Its parent timeline owns exit,
// pointer-events and reverse scrolling; never move this into a fixed overlay.
export function patchHeroRibbonSSR(html,marquee){
  let target;
  function visit(node){
    const value=node.attrs?.find(a=>a.name==='class')?.value;
    if(value===originalClass||value===originalClass+' '+marker){assert(!target);target=node;}
    for(const child of node.childNodes||[])visit(child);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));assert(target,'Missing Hero bottom strip');
  const loc=target.sourceCodeLocation;
  const inner=`<div class="h-line w-full bg-white/10 top-0 inset-x-0 absolute rounded-none" aria-hidden="true"></div>${guideMarkup}<div class="w-full h-full max-w-[42.5rem] overflow-hidden py-[0.75rem] mt-auto ${viewportMarker}">${marquee}</div>${toolsMarkup}`;
  const tag=html.slice(loc.startTag.startOffset,loc.startTag.endOffset).replace(`class="${target.attrs.find(a=>a.name==='class').value}"`,`class="${originalClass} ${marker}"`);
  return html.slice(0,loc.startOffset)+tag+inner+'</div>'+html.slice(loc.endOffset);
}

export function patchHeroRibbonRuntime(source){
  if(source.startsWith('// duik-hero-ribbon-v2\n'))return source;
  if(source.startsWith('// duik-hero-ribbon-v1\n')){
    const previous=`s("button",{type:"button",class:"duik-hero-ribbon-toggle","data-hero-marquee-toggle":"","aria-pressed":"false"},${JSON.stringify(heroRibbon.pause)})`;
    assert.equal(source.split(previous).length,2,'Unknown existing ribbon playback control');
    return source.replace('// duik-hero-ribbon-v1\n','// duik-hero-ribbon-v2\n').replace(previous,'s("a",{class:"duik-hero-ribbon-toggle",href:"#toolkit"},"查找工具")');
  }
  const tree=ts.createSourceFile('hero.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
  function visit(node){
    if(ts.isVariableDeclaration(node)&&['Rt','Bt'].includes(node.name.getText(tree))){
      const prop=node.initializer.properties.find(p=>p.name?.getText(tree)==='class');
      const value=prop.initializer.text;
      if(node.name.getText(tree)==='Rt')assert.equal(value,originalClass,'Unknown ribbon host');
      edits.push({start:prop.initializer.getStart(tree),end:prop.initializer.end,value:JSON.stringify(value+' '+(node.name.getText(tree)==='Rt'?marker:viewportMarker))});
    }
    if(ts.isCallExpression(node)&&node.arguments[1]?.getText(tree)==='Rt'){
      const children=node.arguments[2];assert(ts.isArrayLiteralExpression(children)&&children.elements.length===4,'Unknown ribbon columns');
      const left=children.elements[1],right=children.elements[3];
      assert(left.getText(tree).includes('videoLink'),'Missing original video entrance');
      assert(right.getText(tree).startsWith('s("div",Yt,'),'Missing original awards column');
      edits.push({start:left.getStart(tree),end:left.end,value:`s("a",{class:${JSON.stringify(guideClass)},href:${JSON.stringify(heroRibbon.href)},innerHTML:${JSON.stringify(guideContent)}})`});
      edits.push({start:right.getStart(tree),end:right.end,value:'s("a",{class:"duik-hero-ribbon-toggle",href:"#toolkit"},"查找工具")'});
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);assert.equal(edits.length,4,'Expected two ribbon classes and two side columns');
  for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.value+source.slice(edit.end);
  return '// duik-hero-ribbon-v2\n'+source;
}
