// Exact source migrations, verified against Wikimedia Commons imageinfo on
// 2026-11-06. Preserve the image identity and all document captions/attribution.
// Do not generalize this into a URL guesser or a missing-image placeholder.
export const docsImageMigrations = Object.freeze({
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Signed-by-Bassel.svg/320px-Signed-by-Bassel.svg.png':
    'https://upload.wikimedia.org/wikipedia/commons/7/7d/Bassel_Khartabil_signature.svg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bassel_Khartabil_%28Safadi%29.jpg/387px-Bassel_Khartabil_%28Safadi%29.jpg':
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Bassel_Khartabil_%28Safadi%29.jpg',
})

export function resolveDocsImage(src) {
  return typeof src === 'string' && Object.hasOwn(docsImageMigrations, src)
    ? docsImageMigrations[src] : src
}
