// One desktop pass for the three published, directly manipulable motion scenes.
import {readFile} from 'node:fs/promises';
// The generated data: module has no directory for relative static imports.
const base=(await readFile(new URL('./validate-duik-experience.mjs',import.meta.url),'utf8'))
  .replace(/^(import\b[^\n]*?\bfrom\s*)([\'"])(\.[^\'"\n]+)\2/gm,
    (_statement,prefix,_quote,path)=>prefix+JSON.stringify(new URL(path,import.meta.url).href));
const cut=base.indexOf('  report.initial=');
if(cut<0)throw Error('The host browser driver changed.');
let source=base.slice(0,cut).replace("resolve('output/duik-experience-check'+(inspect?'/inspect':''))","resolve(process.env.MOTION_OUTPUT||'output/playwright/motion-scenes')");
source+=await readFile(new URL('./validate-duik-motion-checks.inc',import.meta.url),'utf8');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
