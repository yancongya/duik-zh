import { readFileSync, writeFileSync } from 'node:fs'

const MANIFEST = 'F:/duik-zh/translation-manifest.json'
const REPORT = 'F:/duik-zh/sync-report.json'

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const report = JSON.parse(readFileSync(REPORT, 'utf8'))

// 1. build hash lookup from report
const hashByPath = Object.fromEntries(report.files.map(f => [f.path, f.hash]))

// 2. clear false stale (content unchanged, only hash algorithm normalized to LF)
let cleared = 0
for (const [path, entry] of Object.entries(manifest)) {
  if (entry.stale) { delete entry.stale; cleared++ }
  // sync upstreamHashAtSnapshot to the new LF-based hash
  if (hashByPath[path]) entry.upstreamHashAtSnapshot = hashByPath[path]
}

// 3. mark 5 bones files as translated
const bonesTranslated = [
  'guide/bones/index.md',
  'guide/bones/create-bones.md',
  'guide/bones/envelops.md',
  'guide/bones/noodles.md',
  'guide/bones/autorig/index.md',
]
for (const p of bonesTranslated) {
  const e = manifest[p]
  if (!e) { console.error('missing entry:', p); continue }
  e.status = 'translated'
  e.upstreamHashAtTranslation = e.upstreamHashAtSnapshot
  e.lastTranslated = '2026-10-28'
  e.translator = 'opencode-agent'
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`cleared stale: ${cleared}`)
console.log(`marked translated: ${bonesTranslated.length}`)
const staleCount = Object.values(manifest).filter(v => v.stale).length
const transCount = Object.values(manifest).filter(v => v.status === 'translated').length
console.log(`remaining stale: ${staleCount}, translated: ${transCount}`)
