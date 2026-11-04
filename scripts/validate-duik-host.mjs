// Independent host acceptance at one desktop width, plus one narrow-nav check.
// Uses actual CDP mouse/key events and the existing isolated-browser harness.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
delete process.env.LANDING_INSPECT;
process.env.LANDING_OUTPUT??=join(root,'output/duik-landing-independent/host');
let source=await readFile(join(root,'scripts/validate-duik-landing.mjs'),'utf8');
const extra=await readFile(join(root,'scripts/validate-duik-host-checks.inc'),'utf8');
const anchor='for(const [index,section] of report.dom.sections.entries())';
if(!source.includes(anchor))throw Error('Browser harness changed');
source=source.replace(anchor,extra+'\nfor(const [index,section] of [])');
source=source.replace('report.passed=process.env.LANDING_INSPECT===\'1\'||errors.length===0&&failedRequests.length===0;','report.passed=errors.length===0&&failedRequests.length===0&&report.externalRequests.length===0;');
source=source.replace('report.failure=error.stack','report.failure=error.name+": "+error.message');
source=source.replace('console.log(JSON.stringify({...report,output:out},null,2))','console.log(JSON.stringify({checks,errors,failedRequests,passed:report.passed,failure:report.failure,navigation:report.navigation,externalRequests:report.externalRequests,output:out},null,2))');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
