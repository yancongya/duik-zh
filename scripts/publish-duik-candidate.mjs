import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'components/home/landing/candidate');
const destination = path.join(root, 'public/duik-candidate');
await mkdir(destination, { recursive: true });
for (const name of ['style.css', 'story.js', 'scene-model.mjs']) {
  await cp(path.join(source, name), path.join(destination, name));
}
const html = await readFile(path.join(source, 'index.html'), 'utf8');
if (/assets\.linearity\.io|hero(?:[1-9]|1[0-5])\.jpg|<iframe/i.test(html)) {
  throw new Error('候选页不得引入旧模板图库或远程镜像。');
}
await writeFile(path.join(root, 'public/landing-candidate.html'), html);
console.log('Candidate published: /landing-candidate.html (root landing unchanged)');
