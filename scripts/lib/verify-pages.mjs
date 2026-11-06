import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'parse5';

export function verifyFlight(text) {
  const bytes = Buffer.from(text); let cursor = 0, records = 0;
  while (cursor < bytes.length) {
    const colon = bytes.indexOf(':', cursor);
    assert(colon >= cursor && /^[\da-f]*$/.test(bytes.subarray(cursor, colon).toString()), `Invalid Flight boundary at ${cursor}`);
    cursor = colon + 1;
    if (bytes[cursor] === 84) {
      const comma = bytes.indexOf(',', cursor);
      const length = bytes.subarray(cursor + 1, comma).toString();
      assert(/^[\da-f]+$/.test(length));
      cursor = comma + 1 + parseInt(length, 16);
    } else {
      const newline = bytes.indexOf('\n', cursor);
      assert(newline >= cursor, 'Truncated Flight record'); cursor = newline + 1;
    }
    assert(cursor <= bytes.length, 'Truncated Flight text'); records++;
  }
  return records;
}

export async function verifyPages(out, base, expectedDocs) {
  const references = new Set(), failures = []; let docs = 0, flightRecords = 0;
  async function walk(dir) {
    for (const entry of await readdir(dir, {withFileTypes:true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { await walk(file); continue; }
      if (!file.endsWith('.html')) continue;
      const html = await readFile(file, 'utf8'), chunks = [];
      function visit(node) {
        const attrs = Object.fromEntries((node.attrs || []).map(a => [a.name,a.value]));
        for (const name of ['src', 'href', 'poster']) {
          const value = attrs[name];
          if (value?.startsWith('/') && !value.startsWith('//')) references.add(value);
        }
        if (node.tagName === 'article' && 'data-pagefind-body' in attrs) docs++;
        if (node.tagName === 'script') {
          const script = (node.childNodes || []).map(n => n.value || '').join('');
          const match = script.match(/^self\.__next_f\.push\((.*)\);?$/s);
          if (match) { const chunk = JSON.parse(match[1]); if (chunk[0] === 1) chunks.push(chunk[1]); }
        }
        for (const child of node.childNodes || []) visit(child);
      }
      visit(parse(html));
      if (chunks.length) flightRecords += verifyFlight(chunks.join(''));
    }
  }
  await walk(out);
  for (const ref of references) {
    if (!ref.startsWith(base + '/') && ref !== base) { failures.push(`Unprefixed: ${ref}`); continue; }
    const clean = decodeURIComponent(ref.split(/[?#]/)[0].slice(base.length));
    let file = path.join(out, clean);
    try {
      const info = await stat(file);
      if (info.isDirectory()) await stat(path.join(file, 'index.html'));
    } catch { failures.push(`Missing: ${ref}`); }
  }
  assert.equal(failures.length, 0, failures.slice(0,25).join('\n'));
  assert(docs > 0, 'No documentation pages');
  if (expectedDocs !== undefined) assert.equal(docs, expectedDocs, 'Expected all documentation pages');
  return {docs, localReferences:references.size, flightRecords};
}
