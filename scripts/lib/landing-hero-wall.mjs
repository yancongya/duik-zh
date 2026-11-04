import { parse } from 'parse5';
import ts from 'typescript';

const encode = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const attrsOf = node => Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));

/** Mirror the captured Vue conditional for the non-rotating title prefix.
 * When introTitle starts with its final rotating phrase, Vue renders a comment
 * instead of this row. Text replacement alone leaves a duplicate SSR heading.
 */
export function patchHeroWallIntroSSR(html, introTitle, finalPhaseTitle) {
  const prefix=introTitle.split('\n')[0].replace(finalPhaseTitle,'').trim();
  let target;
  function visit(node, inside=false) {
    const classes=(attrsOf(node).class||'').split(' ');
    inside ||= classes.includes('kp-home-hero-intro');
    if(inside && node.parentNode?.tagName==='h2' && classes.includes('gap-x-[0.3em]')) {
      if(target)throw new Error('Duplicate hero intro prefix.');
      target=node;
    }
    for(const child of node.childNodes||[])visit(child,inside);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));
  if(!target)throw new Error('Missing hero intro prefix.');
  const loc=target.sourceCodeLocation;
  if(!prefix)return html.slice(0,loc.startOffset)+'<!---->'+html.slice(loc.endOffset);
  const span=target.childNodes.find(node=>node.tagName==='span')?.sourceCodeLocation;
  if(!span)throw new Error('Missing hero intro prefix text.');
  return html.slice(0,span.startTag.endOffset)+encode(prefix)+html.slice(span.endTag.startOffset);
}

/** Repair the captured SSR gallery independently of its already-remapped payload.
 * Keep the original card DOM, image dimensions, event hooks and GSAP selectors.
 */
export function patchHeroWallSSR(html, scenes) {
  const patches = [];
  let count = 0;
  function visit(node, inWall = false) {
    const attrs = attrsOf(node);
    inWall ||= (attrs.class || '').split(' ').includes('kp-home-hero-thumbnails-list');
    if (inWall && (attrs.class || '').includes('kp-home-hero-inner-scale-target')) {
      const scene = scenes[count];
      const caption = node.childNodes?.find(child => (attrsOf(child).class || '').includes('bottom-full'));
      const spans = caption?.childNodes?.filter(child => child.tagName === 'span') || [];
      if (!scene || spans.length !== 2) throw new Error('Unknown gallery caption structure.');
      const captionClass=caption.sourceCodeLocation.attrs.class;
      patches.push({start:captionClass.startOffset,end:captionClass.endOffset,value:'class="duik-wall-caption"'});
      for (const [index, span] of spans.entries()) {
        const spanClass = span.sourceCodeLocation.attrs.class;
        patches.push({ start: spanClass.startOffset, end: spanClass.endOffset, value: 'class="duik-wall-' + (index ? 'summary' : 'title') + '"' });
        patches.push({ start: span.sourceCodeLocation.startTag.endOffset, end: span.sourceCodeLocation.endTag.startOffset, value: encode(index ? scene.summary : scene.title) });
      }
    }
    if (inWall && (attrs.class || '').split(' ').includes('kp-home-hero-thumbnails-img-wrap')) {
      const scene = scenes[count], loc = node.sourceCodeLocation;
      if (!scene?.guide?.startsWith('/docs/')) throw new Error('Missing local gallery guide.');
      const opening = html.slice(loc.startTag.startOffset, loc.startTag.endOffset)
        .replace(/^<div\b/, '<a').replace('class="', 'class="block duik-wall-link ')
        .replace(/>$/, ' href="' + encode(scene.guide) + '" aria-label="' + encode(scene.title + ' · 阅读文档') + '" data-duik-wall-guide="' + encode(scene.guide) + '" draggable="false">');
      patches.push({ start: loc.startTag.startOffset, end: loc.startTag.endOffset, value: opening });
      patches.push({ start: loc.endTag.startOffset, end: loc.endTag.endOffset, value: '</a>' });
    }
    if (inWall && node.tagName === 'img' && node.sourceCodeLocation && (attrs.class || '').includes('will-change-transform')) {
      const scene = scenes[count++];
      if (!scene) throw new Error('More captured gallery images than mapped scenes.');
      patches.push({ start: node.sourceCodeLocation.startOffset, end: node.sourceCodeLocation.startOffset, value: '<picture style="display:contents"><source media="(prefers-reduced-motion: reduce)" srcset="' + encode(scene.reducedMotionSrc || scene.src) + '"><source data-duik-wall-playback media="all" srcset="' + encode(scene.reducedMotionSrc || scene.src) + '">' });
      patches.push({ start: node.sourceCodeLocation.endOffset, end: node.sourceCodeLocation.endOffset, value: '</picture>' });
      for (const name of ['src', 'srcset', 'alt']) {
        const location = node.sourceCodeLocation.attrs?.[name];
        if (!location) continue;
        let value;
        if (name === 'alt') value = scene.alt;
        else if ((attrs[name] || '').includes('url=')) {
          value = attrs[name].replace(/([?&]url=)[^&\s,]+/g, (_, prefix) => prefix + encodeURIComponent(scene.src));
        } else value = scene.src;
        patches.push({ start: location.startOffset, end: location.endOffset, value: name + '="' + encode(value) + '"' });
      }
    }
    for (const child of node.childNodes || []) visit(child, inWall);
  }
  visit(parse(html, { sourceCodeLocationInfo: true }));
  if (count !== scenes.length) throw new Error('Gallery map mismatch: captured ' + count + ', expected ' + scenes.length);
  for (const patch of patches.sort((a, b) => b.start - a.start)) html = html.slice(0, patch.start) + patch.value + html.slice(patch.end);
  return html;
}

/** Make the existing Vue gallery semantic links without changing its GSAP/drag
 * wrappers. Patches are anchored to the captured component and fail closed.
 */
export function patchHeroWallRuntime(code, scenes) {
  const tree = ts.createSourceFile('hero.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits = [], found = new Set();
  const replace = (node, value, key) => {
    if (found.has(key)) throw new Error('Duplicate gallery runtime anchor: ' + key);
    found.add(key); edits.push({ start: node.getStart(tree), end: node.end, value });
  };
  function visit(node) {
    if (ts.isVariableDeclaration(node)) {
      const name = node.name.getText(tree);
      if (name === 'lo' || name === 'no') {
        const expected = name === 'lo' ? 'whitespace-nowrap' : 'text-white/60 whitespace-nowrap';
        const className = node.initializer.properties?.find(property => property.name?.getText(tree) === 'class')?.initializer.text;
        if (className !== expected) throw new Error('Unknown gallery caption text style.');
        replace(node.initializer, JSON.stringify({ class: name === 'lo' ? 'duik-wall-title' : 'duik-wall-summary' }), 'caption-' + name);
      }
      if (name === 'io') {
        const className = node.initializer.properties.find(property => property.name?.getText(tree) === 'class')?.initializer.text;
        if (!className?.includes('kp-home-hero-thumbnails-img-wrap')) throw new Error('Unknown gallery image wrapper.');
        replace(node.initializer, JSON.stringify({ class: 'block duik-wall-link ' + className }), 'wrapper');
      }
      if (name === 'Ne') replace(node.initializer, '(t,e)=>{if(Q&&e.detail!==0){Q=!1;e.preventDefault();e.stopPropagation()}}', 'click');
      if (name === 'Pe') {
        const original = node.initializer.getText(tree);
        if (!original.startsWith('(t,e)=>{')) throw new Error('Unknown gallery drag start.');
        replace(node.initializer, original.replace('(t,e)=>{', '(t,e)=>{Q=!1;'), 'drag-start');
      }
      if (name === 'ee') {
        const original = node.initializer.getText(tree), timer = ',setTimeout(()=>{Q=!1},50)';
        if (!original.includes(timer)) throw new Error('Unknown gallery drag suppression.');
        const drag = 'ae&&(Q=!0,';
        if (!original.includes(drag)) throw new Error('Unknown gallery drag completion.');
        replace(node.initializer, original.replace(drag, 'ae&&(Q=!0,document.documentElement.dataset.duikDragClick="true",setTimeout(()=>delete document.documentElement.dataset.duikDragClick,0),').replace(timer, ''), 'drag-end');
      }
    }
    if (ts.isCallExpression(node) && node.arguments[1]?.getText(tree) === 'io') {
      replace(node.arguments[0], '"a"', 'link-tag');
      replace(node.arguments[1], '{...io,href:duikWallFeatures[o].guide,"aria-label":duikWallFeatures[o].title+" · 阅读文档","data-duik-wall-guide":duikWallFeatures[o].guide,draggable:"false"}', 'link-props');
    }
    if (ts.isCallExpression(node) && node.expression.getText(tree) === 'ze' && ts.isCallExpression(node.arguments[0]) && node.arguments[0].expression.getText(tree) === 'k' && node.arguments[0].arguments[1]?.properties?.some(property => property.name?.getText(tree) === 'alt' && property.initializer?.getText(tree).includes('${r.title.toLowerCase()}'))) {
      if (found.has('picture')) throw new Error('Duplicate gallery picture anchor.');
      found.add('picture');
      edits.push({ start: node.getStart(tree), end: node.getStart(tree), value: 's("picture",{style:"display:contents"},[s("source",{media:"(prefers-reduced-motion: reduce)",srcset:duikWallFeatures[o].reducedMotionSrc||duikWallFeatures[o].src}),s("source",{"data-duik-wall-playback":"",media:"all",srcset:duikWallFeatures[o].reducedMotionSrc||duikWallFeatures[o].src}),' });
      edits.push({ start: node.end, end: node.end, value: '])' });
    }
    if (ts.isPropertyAssignment(node) && node.name.getText(tree) === 'alt' && node.initializer.getText(tree).includes('AI-generated')) {
      const modal = node.initializer.getText(tree).includes('ve.value');
      replace(node.initializer, modal ? 'duikWallFeatures[ve.value].alt' : 'duikWallFeatures[o].alt', modal ? 'modal-alt' : 'wall-alt');
    }
    if (ts.isPropertyAssignment(node) && node.name.getText(tree) === 'resolution' && ts.isTemplateExpression(node.initializer)) {
      replace(node.initializer, '(duikWallFeatures.find(feature=>feature.title===S)?.summary||"")', 'caption');
    }
    if (ts.isPropertyAssignment(node) && node.name.getText(tree) === 'class' && node.initializer.getText(tree).includes('absolute bottom-full mb-')) {
      replace(node.initializer,JSON.stringify('duik-wall-caption'),'persistent-caption');
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (found.size !== 13) throw new Error('Incomplete gallery runtime patch: ' + [...found].join(', '));
  for (const edit of edits.sort((a, b) => b.start - a.start)) code = code.slice(0, edit.start) + edit.value + code.slice(edit.end);
  return 'const duikWallFeatures=' + JSON.stringify(scenes.map(({ title, summary, alt, guide, src, reducedMotionSrc }) => ({ title, summary, alt, guide, src, reducedMotionSrc }))) + ';' + code;
}
