/** Allocate an anchor without changing existing document IDs, including Thai headings. */
export function createHeadingId(text, occupied = new Set()) {
  const slug = String(text).normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
  const base = `reader-${slug || 'section'}`
  let id = base
  let suffix = 2
  while (occupied.has(id)) id = `${base}-${suffix++}`
  occupied.add(id)
  return id
}
