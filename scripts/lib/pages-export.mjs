import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';

export function imageResolver(recorded, base = '') {
  const entries = Object.entries(recorded).map(([query, asset]) => [new URLSearchParams(query), asset]);
  return function resolve(input, modifiers = {}) {
    const params = input.startsWith('/.netlify/images?')
      ? new URLSearchParams(input.slice(input.indexOf('?') + 1).replaceAll('&amp;', '&'))
      : new URLSearchParams({ url: input, ...Object.fromEntries(Object.entries(modifiers).filter(([,v]) => v != null).map(([k,v]) => [k, String(v)])) });
    let url = params.get('url') || '';
    if (base && url.startsWith(base + '/')) url = url.slice(base.length);
    const prefixes = ['/duik-preview-assets/', '/duik-landing-assets/', '/duik-experience/previews/', '/duik-experience/official/', '/duik-experience/wall/', '/duik-experience/icons/'];
    if (prefixes.some(prefix => url.startsWith(prefix)) && !url.split('/').includes('..')) return base + url;
    const exact = entries.find(([saved]) => [...params].every(([k,v]) => saved.get(k) === v) && [...saved].length === [...params].length);
    const candidates = entries.filter(([saved]) => saved.get('url') === url && (!params.get('fm') || saved.get('fm') === params.get('fm')));
    candidates.sort(([a],[b]) => Math.abs(Number(a.get('w') || 0) - Number(params.get('w') || 0)) - Math.abs(Number(b.get('w') || 0) - Number(params.get('w') || 0)));
    const selected = exact || candidates[0];
    if (selected) return base + '/linearity-media/' + selected[1].file;
    if (url.startsWith('/') && !url.startsWith('//')) return base + url;
    throw new Error('No recorded local image: ' + url);
  };
}

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Only known local asset roots and explicit links are rebased; no router monkeypatch. */
export function rebaseText(text, { base, roots, resolveImage, docs = true, links = true }) {
  text = text.replace(/\/\.netlify\/images\?[^"'`\s<>\\]+/g, match => resolveImage(match));
  const local = new RegExp('(?<![\\w/.-])/(' + roots.map(escapeRegExp).join('|') + ')(?=[/?#"\x27`\\\\\\s<>)\\]}:]|$)', 'g');
  text = text.replace(local, (_, name) => base + '/' + name);
  if (docs) text = text.replace(/(?<![\w/.-])\/docs(?=[/?#"'`\\\s<>)\]}:]|$)/g, base + '/docs');
  if (links) text = text.replace(/href=(['"])\/(\1)/g, (_, quote) => 'href=' + quote + base + '/' + quote);
  return text;
}

// Next's Flight data contains byte-length-framed records, including raw MDX.
// Rebase asset literals BEFORE compilation, never in Next output or route keys.
export async function preparePagesSources(stage, { base, roots, resolveImage }) {
  async function walk(file) {
    const { stat } = await import('node:fs/promises');
    if ((await stat(file)).isDirectory()) {
      for (const name of await readdir(file)) await walk(path.join(file, name));
    } else if (/\.(?:[cm]?[jt]sx?|mdx?)$/.test(file)) {
      const before = await readFile(file, 'utf8');
      const after = rebaseText(before, { base, roots, resolveImage, docs: false, links: false });
      if (before !== after) await writeFile(file, after);
    }
  }
  for (const name of ['app', 'content', 'components/docs', 'components/brand/logo.mjs', 'mdx-components.tsx']) {
    await walk(path.join(stage, name));
  }
}

export const isPublicOutput = (relative, roots) => roots.includes(relative.split(path.sep)[0]);

export async function finalizePages({ out, sourcePublic, base, origin, imageMap, mediaRewrites }) {
  const roots = await readdir(sourcePublic);
  const resolveImage = imageResolver(imageMap, base);
  const resolverSource = `const resolve=(${imageResolver.toString()})(${JSON.stringify(imageMap)},${JSON.stringify(base)});\nexport {resolve};\n`;
  const { mkdir } = await import('node:fs/promises');
  await mkdir(path.join(out, 'pages'), { recursive: true });
  await writeFile(path.join(out, 'pages/image-resolver.mjs'), resolverSource);
  const hash = 'd2ea4a745e1ba64aecc76bbf680458929795d2d8';
  const composablesPath = path.join(out, '_nuxt/composables.' + hash + '.js');
  let composables = await readFile(composablesPath, 'utf8');
  const provider = 'return{url:`${r||"/.netlify/images"}?${n}`}';
  if (!composables.includes(provider)) throw Error('Expected captured Nuxt image provider');
  composables = `import {resolve as duikPagesImage} from "${base}/pages/image-resolver.mjs";\n` + composables.replace(provider, 'return{url:duikPagesImage("/.netlify/images?"+n)}');
  await writeFile(composablesPath, composables);
  const imagePath = path.join(out, '_nuxt/image.' + hash + '.js');
  let image = await readFile(imagePath, 'utf8');
  const template = '`/.netlify/images?${p.toString()}`';
  if (!image.includes(template)) throw Error('Expected captured image URL builder');
  image = `import {resolve as duikPagesImage} from "${base}/pages/image-resolver.mjs";\n` + image.replace(template, 'duikPagesImage("/.netlify/images?"+p.toString())');
  await writeFile(imagePath, image);

  const rewritten = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name), relative = path.relative(out, file);
      if (entry.isDirectory()) { await walk(file); continue; }
      if (!/\.(?:html|js|mjs|css|json|svg|webmanifest|txt)$/.test(entry.name)) continue;
      if (relative === 'pages/image-resolver.mjs') continue;
      if (!isPublicOutput(relative, roots)) {
        if (relative.startsWith('docs/') && entry.name.endsWith('.html')) {
          const html = await readFile(file, 'utf8');
          await writeFile(file, html.replace('<article ', '<article data-pagefind-body '));
        }
        continue;
      }
      let before = await readFile(file, 'utf8');
      // Dynamic provider expressions above are intentionally not static URL literals.
      const safeResolve = input => input === '/.netlify/images?' ? input : resolveImage(input);
      let after = rebaseText(before, { base, roots, resolveImage: safeResolve });
      if (entry.name.endsWith('.html')) {
        after = after.replace('app:{baseURL:"/"', 'app:{baseURL:' + JSON.stringify(base + '/'));
        after = after.replace('buildAssetsDir:' + JSON.stringify(base + '/_nuxt/'), 'buildAssetsDir:"/_nuxt/"');
      }
      if (relative === 'site.webmanifest') {
        const manifest = JSON.parse(after); manifest.start_url = base + '/';
        after = JSON.stringify(manifest);
      }
      if (after !== before) { await writeFile(file, after); rewritten.push(relative); }
    }
  }
  await walk(out);
  // Replace the unused React home export with the approved, complete local landing.
  let landing = await readFile(path.join(out, 'landing.html'), 'utf8');
  landing = landing.replace(/(<link[^>]+rel="canonical"[^>]+href=")[^"]*(")/, '$1' + origin + base + '/$2');
  await writeFile(path.join(out, 'index.html'), landing);
  await writeFile(path.join(out, 'landing.html'), landing);
  await writeFile(path.join(out, '.nojekyll'), '');
  // Paths used by the source rig stay intact; distribution JSON may point to exact RGBA copies.
  const rigFile = path.join(out, 'riglab-project/rig.json');
  const rig = JSON.parse(await readFile(rigFile, 'utf8'));
  const remaps = new Map(mediaRewrites.map(rule => [rule.source, rule.destination]));
  for (const part of rig.parts) {
    const destination = remaps.get('/riglab-project/' + part.src);
    if (destination) part.src = destination.slice('/riglab-project/'.length);
  }
  await writeFile(rigFile, JSON.stringify(rig));
  const redirect = destination => `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${destination}"><link rel="canonical" href="${destination}"><title>页面已迁移</title><a href="${destination}">继续阅读</a></html>`;
  await writeFile(path.join(out, 'logo-lab.html'), redirect(base + '/brand.html'));
  await writeFile(path.join(out, 'landing-candidate.html'), redirect(base + '/'));
  const docs = [];
  async function legacy(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { await legacy(f); continue; }
      if (e.name !== 'index.html') continue;
      const route = path.relative(path.join(out, 'docs'), path.dirname(f)).split(path.sep).join('/');
      docs.push(base + '/docs/' + (route ? route + '/' : ''));
    }
  }
  await legacy(path.join(out, 'docs'));
  for (const route of docs) {
    const target = path.join(out, 'docs', route.slice(base.length + 1), 'index.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, redirect(route));
  }
  await writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}${base}/sitemap.xml\n`);
  await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[base + '/', ...docs].map(route => `<url><loc>${origin}${route}</loc></url>`).join('')}</urlset>`);
  // Every directly referenced rig layer must remain a real local file.
  for (const part of rig.parts) await access(path.join(out, 'riglab-project', part.src));
  return { base, origin, docs: docs.length, rigLayers: rig.parts.length, rewritten: rewritten.length };
}
