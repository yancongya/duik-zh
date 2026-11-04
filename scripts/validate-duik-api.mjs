// Focused API acceptance on the real root route, using the shared CDP driver.
import {readFile} from 'node:fs/promises';
// The generated data: module has no directory for relative static imports.
const base=(await readFile(new URL('./validate-duik-experience.mjs',import.meta.url),'utf8'))
  .replace(/^(import\b[^\n]*?\bfrom\s*)([\'"])(\.[^\'"\n]+)\2/gm,
    (_statement,prefix,_quote,path)=>prefix+JSON.stringify(new URL(path,import.meta.url).href));
const cut=base.indexOf('  report.initial=');
if(cut<0)throw Error('The host browser driver changed.');
let source=base.slice(0,cut).replace("resolve('output/duik-experience-check'+(inspect?'/inspect':''))","resolve(process.env.API_OUTPUT||'output/playwright/api-scenes')");
source+=await readFile(new URL('./validate-duik-api-checks.inc',import.meta.url),'utf8');
source+=String.raw`
  report.passed=failures.length===0&&errors.length===0&&failedRequests.length===0;
  if(!report.passed)process.exitCode=1;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;try{await shot('failure');}catch{}}
finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks,failures,errors,failedRequests,failure:report.failure,output:out},null,2));try{await send('Browser.close',{},null);}catch{}socket?.close();child.kill('SIGTERM');}
`;
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
