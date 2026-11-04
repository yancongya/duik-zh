// Read-only, one-width diagnosis of the retained Lenis header after scrolling.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
process.env.LANDING_INSPECT='1';
process.env.LANDING_OUTPUT??=join(root,'output/duik-landing-independent/cta-scroll');
let source=await readFile(join(root,'scripts/validate-duik-landing.mjs'),'utf8');
const extra=await readFile(join(root,'scripts/diagnose-duik-cta-checks.inc'),'utf8');
source=source.replace("await screenshot('01-hero');","await screenshot('01-hero');"+extra);
source=source.replace('for(const [index,section] of report.dom.sections.entries())','for(const [index,section] of [])');
source=source.replace("report.passed=process.env.LANDING_INSPECT==='1'||errors.length===0&&failedRequests.length===0;","report.passed=errors.length===0&&failedRequests.every(r=>new URL(r.url).pathname==='/favicon.ico')&&report.externalRequests.length===0;report.knownDocumentResourceGap=failedRequests.filter(r=>new URL(r.url).pathname==='/favicon.ico');");
source=source.replace('report.failure=error.stack','report.failure=error.name+": "+error.message');
source=source.replace('console.log(JSON.stringify({...report,output:out},null,2))','console.log(JSON.stringify({checks,errors,failedRequests,passed:report.passed,failure:report.failure,ctaScroll:report.ctaScroll,externalRequests:report.externalRequests,output:out},null,2))');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
