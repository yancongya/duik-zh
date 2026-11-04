import assert from 'node:assert/strict';
import {parse} from 'parse5';
import ts from 'typescript';
import {navMarkup} from '../../components/home/landing/content.mjs';

export function patchNavigationSSR(html){
  let header;
  function visit(node){
    if(node.tagName==='header'&&node.attrs?.some(a=>a.name==='class'&&a.value.includes('_header_wl6s2_1'))){assert(!header,'Duplicate root navigation');header=node;}
    for(const child of node.childNodes||[])visit(child);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));
  assert(header,'Missing root navigation');
  const loc=header.sourceCodeLocation;
  const tag=html.slice(loc.startTag.startOffset,loc.startTag.endOffset).replace(/\sdata-duik-ready="[^"]*"/g,'').replace(/>$/,' data-duik-ready="true">');
  return html.slice(0,loc.startOffset)+tag+navMarkup+'</header>'+html.slice(loc.endOffset);
}

export function patchNavigationRuntime(source){
  if(source.startsWith('// duik-navigation-v1\n'))return source;
  const tree=ts.createSourceFile('header.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
  function visit(node){
    if(ts.isCallExpression(node)&&node.expression.getText(tree)==='_'&&node.arguments[0]?.getText(tree)==='"header"'){
      assert(ts.isObjectLiteralExpression(node.arguments[1]));
      edits.push({start:node.arguments[1].getStart(tree)+1,end:node.arguments[1].getStart(tree)+1,value:'"data-duik-ready":"true",innerHTML:duikNavMarkup,'});
      edits.push({start:node.arguments[2].getStart(tree),end:node.arguments[2].end,value:'null'});
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);assert.equal(edits.length,2,'Expected one reactive header root');
  let code=source;
  for(const edit of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,edit.start)+edit.value+code.slice(edit.end);
  for(const [from,to]of [
    ['X(()=>{M.value>0&&P()});','X(()=>{M.value>0&&P();import("/duik-landing.js").then(module=>{if(L.value?.isConnected)module.mountNavigation(L.value)}).catch(console.error)});'],
    ['!k.value&&e>n','!k.value&&!L.value?.classList.contains("duik-menu-open")&&e>n'],
    ['ee(()=>{document.body.classList.remove','ee(()=>{L.value?.duikDisposeNavigation?.();document.body.classList.remove'],
  ]){assert.equal(code.split(from).length-1,1,'Unknown navigation lifecycle');code=code.replace(from,to);}
  return '// duik-navigation-v1\nimport {navMarkup as duikNavMarkup} from "/duik-landing-content.js";\n'+code;
}
