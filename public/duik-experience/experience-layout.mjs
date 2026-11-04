import {catalogMarkup} from './experience-catalog.mjs';
import {apiMarkup} from './api-cinema.mjs';
import {toolsMarkup} from './tools-demo.mjs';
import {comparisonCurvesMarkup} from './tools-comparison-motion.mjs';
import {renderMotion} from './motion-demo.mjs';
import {learningMarkup,faqMarkup,footerMarkup} from './guide-experience.mjs';
import {reuseMarkup} from './reuse-demo.mjs';
import {orientationMarkup,workflowMarkup} from './orientation.mjs';

// Pure shared markup. Vue and the published HTML use this exact contract.
export function experienceView(kind){
  if(kind==='workflow')return {tag:'div',attrs:{class:'duik-product-orientation'},html:orientationMarkup+workflowMarkup};
  if(kind==='tools')return {tag:'section',attrs:{id:'tools',class:'duik-experience-section duik-tools-section'},html:comparisonCurvesMarkup()+toolsMarkup};
  if(kind==='catalog')return {tag:'section',attrs:{id:'toolkit',class:'duik-experience-section duik-catalog-section'},html:catalogMarkup+`<div class="duik-learning-inline">${learningMarkup}</div>`};
  if(kind==='api')return {tag:'section',attrs:{id:'api',class:'duik-experience-section duik-api-section'},html:apiMarkup};
  if(kind==='faq')return {tag:'div',attrs:{id:'faq',class:'duik-experience-section duik-faq-section'},html:faqMarkup};
  if(kind==='footer')return {tag:'footer',attrs:{id:'about',class:'duik-guide duik-guide-footer','data-duik-guide':'footer','aria-labelledby':'duik-guide-footer-title'},html:footerMarkup.replace(/^<footer[^>]*>/,'').replace(/<\/footer>$/,'')};
  if(kind==='libraries')return {tag:'section',attrs:{class:'duik-reuse-section w-screen flex-none',id:'reuse'},html:reuseMarkup};
  if(['animation','automation','camera'].includes(kind))return {tag:'div',attrs:{class:'duik-motion-slot','data-duik-motion':kind},html:renderMotion(kind)};
  throw Error('Unknown Duik experience '+kind);
}
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderExperience(kind){const view=experienceView(kind);return '<'+view.tag+Object.entries(view.attrs).map(([k,v])=>' '+k+'="'+escape(v)+'"').join('')+'>'+view.html+'</'+view.tag+'>'; }
