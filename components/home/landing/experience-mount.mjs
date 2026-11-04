import {mountCatalog} from './experience-catalog.mjs';
import {mountApi} from './api-cinema.mjs';
import {mountTools} from './tools-demo.mjs';
import {mountToolsComparisonMotion} from './tools-comparison-motion.mjs';
import {mountMotion} from './motion-demo.mjs';
import {mountGuide} from './guide-experience.mjs';
import {mountReuse} from './reuse-demo.mjs';
import {mountWorkflow} from './orientation.mjs';

export function mountExperience(host,kind){
  host.dataset.experienceMounted=kind;
  let dispose;
  if(kind==='catalog'){const a=mountCatalog(host),b=mountGuide(host,'learning');dispose=()=>{a();b();};}
  else if(kind==='workflow')dispose=mountWorkflow(host);
  else if(kind==='faq'||kind==='footer')dispose=mountGuide(host,kind);
  else if(kind==='tools'){
    const toolsDispose=mountTools(host);let curvesDispose;
    try{curvesDispose=mountToolsComparisonMotion(host);}
    catch(error){host.ownerDocument.defaultView.console?.warn('Duik comparison drawing unavailable; tools remain interactive.',error);}
    dispose=()=>{curvesDispose?.();toolsDispose();};
  }
  else dispose=kind==='api'?mountApi(host):kind==='libraries'?mountReuse(host):mountMotion(host,kind);
  return ()=>{dispose?.();delete host.dataset.experienceMounted;};
}
