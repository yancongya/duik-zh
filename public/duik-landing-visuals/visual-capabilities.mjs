import {element,ensureVisualStyles} from './visual-scenes.mjs';
import {capabilityVisuals,capabilityVisualTree} from './visual-capability-tree.mjs';

function toVNode(tree){
  if(typeof tree==='string')return tree;
  const children=Array.isArray(tree.children)?tree.children.map(toVNode):tree.children;
  return element(tree.tag,tree.attrs,children);
}
function makeVisual(index){return {
  name:capabilityVisuals[index].name,
  mounted(){ensureVisualStyles();},
  render(){return toVNode(capabilityVisualTree(index));}
};}

export const structureVisual=makeVisual(0);
export const controlsVisual=makeVisual(1);
export const animationVisual=makeVisual(2);
