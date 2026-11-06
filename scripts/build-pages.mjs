import { cp, readdir, mkdtemp, readFile, writeFile, symlink, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { finalizePages, preparePagesSources, imageResolver } from './lib/pages-export.mjs';
import { verifyPages } from './lib/verify-pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const stage = await mkdtemp(path.join(tmpdir(), 'duik-pages-'));
const base = process.env.DUIK_PAGES_BASE_PATH || '/duik-zh';
const origin = process.env.DUIK_PAGES_ORIGIN || 'https://yancongya.github.io';
if (!/^\/[a-zA-Z0-9_-]+$/.test(base)) throw Error('Expected a repository Pages base path');
const run = (bin, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(bin, args, { stdio: 'inherit', ...options });
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(Error(`${bin} exited ${code}`)));
});
console.log('Pages staging:', stage);
for (const name of ['app', 'components', 'content', 'public', 'lib', 'patches', 'next.config.mjs', 'tsconfig.json', 'mdx-components.tsx', 'package.json', 'package-lock.json', 'next-env.d.ts']) {
  try { await access(path.join(root, name)); } catch { continue; }
  await cp(path.join(root, name), path.join(stage, name), { recursive: true });
}
await symlink(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), 'dir');
// This request-dependent server adapter is replaced by build-time/runtime local URL maps.
await rm(path.join(stage, 'app/.netlify'), { recursive: true, force: true });
const imageMap = JSON.parse(await readFile(path.join(root, 'app/.netlify/images/asset-map.json'), 'utf8'));
await preparePagesSources(stage, { base, roots: await readdir(path.join(root, 'public')), resolveImage: imageResolver(imageMap, base) });
await run(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], {
  cwd: stage, env: { ...process.env, DUIK_PAGES: '1', DUIK_PAGES_BASE_PATH: base, NEXT_TELEMETRY_DISABLED: '1' },
});
const generated = path.join(stage, 'out');
const report = await finalizePages({
  out: generated, sourcePublic: path.join(root, 'public'), base, origin,
  imageMap,
  mediaRewrites: JSON.parse(await readFile(path.join(root, 'components/brand/media-rewrites.json'), 'utf8')),
});
await run(path.join(root, 'node_modules/.bin/pagefind'), ['--site', generated, '--output-subdir', '_pagefind', '--glob', 'docs/**/index.html', '--exclude-selectors', 'nav,footer,aside'], { cwd: root });
report.verification = await verifyPages(generated, base, report.docs);
const destination = path.join(root, 'out');
try {
  await access(destination);
  await access(path.join(destination, '.duik-pages-build.json'));
  await rm(destination, { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  try { await access(destination); throw Error('Refusing to overwrite an unmanaged out/ directory'); } catch (inner) { if (inner.code !== 'ENOENT') throw inner; }
}
await cp(generated, destination, { recursive: true });
const buildInfo = { ...report, revision: process.env.GITHUB_SHA || 'local', builtAt: new Date().toISOString() };
await writeFile(path.join(destination, '.duik-pages-build.json'), JSON.stringify(buildInfo, null, 2));
await writeFile(path.join(destination, 'pages/build-info.json'), JSON.stringify(buildInfo, null, 2));
await rm(stage, { recursive: true });
console.log('Pages export:', JSON.stringify(report));
