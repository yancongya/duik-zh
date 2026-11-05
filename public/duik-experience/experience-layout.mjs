import {apiMarkup} from './api-cinema.mjs';
import {toolsCinemaMarkup} from './tools-cinema.mjs';
import {comparisonCurvesMarkup} from './tools-comparison-motion.mjs';
import {footerMarkup} from './guide-experience.mjs';
import {reuseMarkup} from './reuse-demo.mjs';
import {orientationMarkup,workflowMarkup} from './orientation.mjs';
import {closingIndexMarkup,closingStartMarkup} from './closing-summary.mjs';
import {renderFeatureSlide} from './feature-gallery.mjs';

// The closing Start section owns the conversion headline and install CTA.
// Preserve all source/attribution links here, without repeating that chapter.
const footerDirectoryStart=footerMarkup.indexOf('<div class="duik-guide-footer-directory">');
if(footerDirectoryStart<0)throw Error('Missing source/attribution footer');
const legalFooter=footerMarkup.slice(footerDirectoryStart).replace(/<\/footer>$/,'');

// Pure shared markup. Vue and the published HTML use this exact contract.
export function experienceView(kind){
  if(kind==='workflow')return {tag:'div',attrs:{class:'duik-product-orientation'},html:orientationMarkup+workflowMarkup};
  if(kind==='tools')return {tag:'section',attrs:{id:'tools',class:'duik-experience-section duik-tools-section'},html:comparisonCurvesMarkup()+toolsCinemaMarkup};
  if(kind==='catalog')return {tag:'div',attrs:{class:'duik-closing-host','data-duik-closing-host':'catalog'},html:closingIndexMarkup};
  if(kind==='api')return {tag:'section',attrs:{id:'api',class:'duik-experience-section duik-api-section'},html:apiMarkup};
  if(kind==='faq')return {tag:'div',attrs:{class:'duik-closing-host','data-duik-closing-host':'faq'},html:closingStartMarkup};
  if(kind==='closing-empty')return {tag:'div',attrs:{hidden:'','data-duik-closing-host':'closing-empty'},html:''};
  if(kind==='footer')return {tag:'footer',attrs:{id:'about',class:'duik-guide duik-guide-footer','data-duik-guide':'footer','aria-label':'Duik 中文指南来源与归属'},html:legalFooter};
  if(kind==='libraries')return {tag:'section',attrs:{class:'duik-reuse-section w-screen flex-none',id:'reuse'},html:reuseMarkup};
  if(['animation','automation','camera'].includes(kind))return {tag:'div',attrs:{class:'duik-motion-slot','data-duik-motion':kind},html:renderFeatureSlide(kind)};
  throw Error('Unknown Duik experience '+kind);
}
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderExperience(kind){const view=experienceView(kind);return '<'+view.tag+Object.entries(view.attrs).map(([k,v])=>' '+k+'="'+escape(v)+'"').join('')+'>'+view.html+'</'+view.tag+'>'; }
