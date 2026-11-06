import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {imageResolver, rebaseText, isPublicOutput} from './lib/pages-export.mjs';
import {verifyFlight} from './lib/verify-pages.mjs';

const recorded = JSON.parse(fs.readFileSync(new URL('../app/.netlify/images/asset-map.json', import.meta.url), 'utf8'));
const base = '/duik-zh';
const roots = fs.readdirSync(new URL('../public', import.meta.url));
const resolve = imageResolver(recorded, base);
test('every previously recorded query resolves to its original local asset', () => {
  for(const [query, asset] of Object.entries(recorded)) assert.equal(resolve('/.netlify/images?' + query), base + '/linearity-media/' + asset.file);
});
test('local SVG/poster switching is direct and has no server endpoint', () => {
  for(const suffix of ['.svg','.poster.webp']) {
    const url='/duik-experience/wall/character-paper-illustrated-fullbleed-v2'+suffix;
    assert.equal(resolve('/.netlify/images?url='+encodeURIComponent(url)+'&w=800'), base+url);
    assert.equal(resolve(base+url,{w:640}),base+url);
  }
});
test('known asset paths rebase once without changing external URLs, regexes or next route keys', () => {
  const text='<a href="/docs/guide/bones">说明</a><a href="/">首页</a><img src="/brand/v1/logo.svg"><img src="https://example.com/brand/v1/logo.svg">';
  const settings={base,roots,resolveImage:resolve};
  const result=rebaseText(text,settings);
  assert.match(result,/href="\/duik-zh\/docs\/guide\/bones"/);
  assert.match(result,/href="\/duik-zh\/"/);
  assert.match(result,/src="\/duik-zh\/brand\/v1\/logo.svg"/);
  assert(result.includes('https://example.com/brand/v1/logo.svg'));
  assert.equal(rebaseText(result,settings),result);
  assert.equal(rebaseText('"/docs"',{...settings,docs:false}),'"/docs"');
});
test('actual SSR image proxy URLs resolve before subpath rebasing', () => {
  const html=fs.readFileSync(new URL('../public/landing.html',import.meta.url),'utf8');
  const output=rebaseText(html,{base,roots,resolveImage:resolve});
  assert(!output.includes('/.netlify/images?'));
  assert(output.includes(base+'/duik-experience/wall/'));
  assert(output.includes('duik-workflow'));
});
test('Next Flight records and navigation are never transformed after compilation', () => {
  for (const file of ['docs/index.html', 'docs/index.txt', '_next/static/chunks/app.js', 'index.txt']) {
    assert.equal(isPublicOutput(file, roots), false, file);
  }
  assert.equal(isPublicOutput('_nuxt/entry.js', roots), true);
  const source = '<Link href="/docs">文档</Link><Link href="/">首页</Link><img src="/docs-img/logos/gnu.png" />';
  const result = rebaseText(source, {base, roots, resolveImage:resolve, docs:false, links:false});
  assert(result.includes('href="/docs"')); assert(result.includes('href="/"'));
  assert(result.includes('src="/duik-zh/docs-img/logos/gnu.png"'));
});
test('detects deployment URL substitution inside a byte-framed Flight text record', () => {
  const text = '中文原文 /docs-img/a.png';
  const flight = `1:T${Buffer.byteLength(text).toString(16)},${text}0:["$","article",null,{}]\n`;
  assert.equal(verifyFlight(flight), 2);
  assert.throws(() => verifyFlight(flight.replace('/docs-img/', '/duik-zh/docs-img/')), /Flight/);
});
test('returning from Next docs to the Nuxt landing uses a full navigation', () => {
  const layout = fs.readFileSync(new URL('../app/[...mdxPath]/layout.tsx',import.meta.url),'utf8');
  assert(layout.includes('<a href={homeHref}>返回首页</a>'));
  assert(!layout.includes('<Link href="/">返回首页</Link>'));
});
