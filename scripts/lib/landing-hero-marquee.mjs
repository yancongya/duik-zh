import assert from 'node:assert/strict';
import ts from 'typescript';
export {renderHeroMarqueeSSR} from '../../components/home/landing/hero-marquee.mjs';

/** Change the original data and link semantics, not the measured marquee. */
export function patchHeroMarqueeRuntime(original){
  if(original.startsWith('// duik-hero-marquee-v1\n'))return original;
  const tree=ts.createSourceFile('marquee.js',original,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const edits=[],found=new Set();
  const replace=(node,value,key)=>{assert(!found.has(key),'Duplicate marquee anchor: '+key);found.add(key);edits.push({start:node.getStart(tree),end:node.end,value});};
  function visit(node){
    if(ts.isVariableDeclaration(node)&&node.name.getText(tree)==='u'&&ts.isArrayLiteralExpression(node.initializer))replace(node.initializer,'duikMarqueeItems','items');
    if(ts.isCallExpression(node)&&node.expression.getText(tree)==='g'&&node.arguments[0]?.text==='div'&&ts.isObjectLiteralExpression(node.arguments[1])&&node.arguments[1].properties.some(p=>p.name?.getText(tree)==='key'&&p.initializer?.getText(tree)==='L')){
      replace(node,'g("a",{key:L,href:p.href,tabindex:v===1?0:-1,class:c(["duik-hero-marquee-item flex items-center",l.iconHeightClass])},[g("img",{src:p.src,alt:"",width:"32",height:"32",draggable:"false",class:"duik-hero-marquee-icon object-contain h-full w-auto",onLoad:y},null,40,W),g("span",{class:"duik-hero-marquee-title"},p.title,1)],10,["href","tabindex"])','link');
      return;
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);assert.equal(found.size,2,'Missing original marquee render/data anchors');
  let code=original;
  for(const edit of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,edit.start)+edit.value+code.slice(edit.end);
  const patch=(from,to)=>{assert.equal(code.split(from).length-1,1,'Unknown original marquee anchor: '+from);code=code.replace(from,to);};
  patch('"marquee-container contain-paint h-full"','"marquee-container contain-paint h-full duik-hero-marquee"');
  patch('ref:r,class:c(','ref:r,role:"navigation","aria-label":"Duik 八个功能面板",tabindex:-1,class:c(');
  patch('key:v,ref_for:!0','key:v,"data-duik-marquee-copy":v,"aria-hidden":v===1?null:"true",ref_for:!0');
  patch('return M(()=>{x(()=>{o()})','let duikDisposeMarquee;return M(()=>{duikDisposeMarquee=mountHeroMarquee(r.value);x(()=>{o()})');
  patch('k(()=>{window.removeEventListener("resize",o)}','k(()=>{duikDisposeMarquee?.();window.removeEventListener("resize",o)}');
  return '// duik-hero-marquee-v1\nimport {heroMarqueeItems as duikMarqueeItems,mountHeroMarquee} from "/duik-experience/hero-marquee.mjs";\n'+code;
}
