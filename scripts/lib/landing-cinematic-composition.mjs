import assert from 'node:assert/strict';
import {parse} from 'parse5';

const marker='// duik-cinematic-composition-v2\n';
const attr='data-duik-cinematic-card';
const curveBefore='we=()=>{k.value&&(k.value.style.width=`${J}px`,k.value.style.left=`-${he}px`,k.value.setAttribute("viewBox",`0 0 ${J} ${ne}`)),g.value&&(g.value.setAttribute("d",ke(J,ne)),g.value.setAttribute("stroke-width",`${G}`))}';
// Include the existing orbit approach gap in the SVG projection so the original
// curve stays visible while the three full-stage scenes meet the orbit.
// Do not change the measured scroll distance, orbit timing or drawing tween.
const curveAfter='we=()=>{const duikCurveWidth=J+se;k.value&&(k.value.style.width=`${duikCurveWidth}px`,k.value.style.left=`-${he}px`,k.value.setAttribute("viewBox",`0 0 ${duikCurveWidth} ${ne}`)),g.value&&(g.value.setAttribute("d",ke(duikCurveWidth,ne)),g.value.setAttribute("stroke-width",`${G}`))}';
const attrs=node=>Object.fromEntries((node.attrs||[]).map(item=>[item.name,item.value]));
const hasClass=(node,name)=>(attrs(node).class||'').split(/\s+/).includes(name);
const find=(node,predicate)=>predicate(node)?node:(node.childNodes||[]).map(child=>find(child,predicate)).find(Boolean);
const all=(node,predicate)=>[...(predicate(node)?[node]:[]),...(node.childNodes||[]).flatMap(child=>all(child,predicate))];

// Keep all three original slots, each with one full artwork instead of the old
// copy/art split. The measured parent owns traversal, orbit and resize as before.
export function patchCinematicCompositionRuntime(source){
  const listBefore='(de.blok?.listItems||[]).map(s=>';
  const retiredList='(de.blok?.listItems||[]).slice(0,1).map(s=>';
  const card='class:"flex flex-row gap-[18rem] justify-between items-center self-center flex-none duik-capability-card"';
  const marked=card+',"'+attr+'":"true"';
  if(source.includes('// duik-cinematic-composition-v1\n')){
    assert.equal(source.split(retiredList).length-1,1,'Incomplete retired single-scene mapping');
    assert.equal(source.split('// duik-cinematic-composition-v1\n').length-1,1,'Duplicate retired composition marker');
    source=source.replace(retiredList,listBefore).replace('// duik-cinematic-composition-v1\n',marker);
  }
  if(source.includes(marker)){
    assert.equal(source.split(marker).length-1,1,'Duplicate cinematic composition marker');
    assert.equal(source.split(listBefore).length-1,1,'Incomplete three-scene item contract');
    assert.equal(source.split(marked).length-1,1,'Incomplete cinematic card contract');
    assert(!source.includes('.slice(0,'),'Truncated motion content');
    assert(!source.includes('r("div",ct,['),'Legacy capability copy returned');
    if(source.includes(curveBefore)){assert.equal(source.split(curveBefore).length-1,1);return source.replace(curveBefore,curveAfter);}
    assert.equal(source.split(curveAfter).length-1,1,'Incomplete original curve projection');
    return source;
  }
  let code=source;
  function replace(from,to){assert.equal(code.split(from).length-1,1,'Unknown cinematic anchor: '+from);code=code.replace(from,to);}
  function between(from,to,replacement){
    assert.equal(code.split(from).length-1,1,'Unknown cinematic start: '+from);
    const start=code.indexOf(from),end=code.indexOf(to,start);
    assert(end>start&&end-start<2600,'Unknown cinematic boundary: '+to);
    code=code.slice(0,start)+replacement+code.slice(end);
  }
  assert.equal(code.split(listBefore).length-1,1,'Unknown original three-scene list');replace(card,marked);
  replace(curveBefore,curveAfter);
  between('r("div",ct,[','r("div",mt,[','');
  between('r("div",ht,[','r("div",_t,[','r("div",ht,[');
  replace('A(m,{animate:"",shadow:"",class:"inset-0 w-full h-full rounded-[1.2rem]"}),','');
  between(']),e.subTitle?(t(),o(l,{key:3,size:"16"','])]),_:2}','])');
  const pagination='s[0]||(s[0]=r("div",{class:"capabilities-cards-pagination flex justify-center items-center gap-[0.5rem] mt-[2rem]"},null,-1))';
  replace(pagination,'i("",!0)');
  // Existing resize/keyboard owners intentionally keep their header first.
  return code+'\n'+marker;
}

export function isCinematicComposition(html){return html.includes(attr+'="true"');}

export function patchCinematicCompositionSSR(html){
  const document=parse(html,{sourceCodeLocationInfo:true}),cards=[];
  function visit(node){if(hasClass(node,'duik-capability-card'))cards.push(node);for(const child of node.childNodes||[])visit(child);}
  visit(document);
  if(isCinematicComposition(html)){
    assert.equal(cards.length,3,'Three motion scenes required; republish from baseline with npm run landing:publish');
    for(const [index,card]of cards.entries()){
      assert.equal(attrs(card)[attr],'true','Missing cinematic card owner');
      assert.equal((card.childNodes||[]).filter(child=>child.tagName).length,1,'Legacy cinematic text column returned');
      assert.deepEqual(all(card,node=>Object.hasOwn(attrs(node),'data-duik-motion')).map(node=>attrs(node)['data-duik-motion']),[['animation'],['automation'],['camera']][index],'Unexpected motion slot order');
    }
    return html;
  }
  assert.equal(cards.length,3,'Expected the three original motion cards');
  const stages=cards.map(card=>all(card,node=>Object.hasOwn(attrs(node),'data-duik-motion')).map(node=>attrs(node)['data-duik-motion']));
  assert.deepEqual(stages,[['animation'],['automation'],['camera']],'Unknown scene order or mixed scene slots');
  const edits=[];
  for(const card of cards){
    const loc=card.sourceCodeLocation;
    const columns=card.childNodes.filter(node=>node.tagName);assert.equal(columns.length,2,'Expected original copy/art columns');
    assert(!find(columns[0],node=>Object.hasOwn(attrs(node),'data-duik-motion')),'Motion art cannot be the removed column');
    const copy=columns[0].sourceCodeLocation;
    edits.push({start:copy.startOffset,end:copy.endOffset,value:''});
    edits.push({start:loc.startTag.endOffset-1,end:loc.startTag.endOffset-1,value:' '+attr+'="true"'});
  }
  for(const edit of edits.sort((a,b)=>b.start-a.start))html=html.slice(0,edit.start)+edit.value+html.slice(edit.end);
  return html;
}
