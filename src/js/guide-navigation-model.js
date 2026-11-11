/** Geometry is cached outside scroll events; the reading line sits below the header. */
export function currentGuideSection(positions, scrollY, viewportHeight, documentHeight) {
  if (!positions.length) return null
  if (scrollY > 0 && scrollY + viewportHeight >= documentHeight - 2) return positions.at(-1).id
  const line = scrollY + Math.min(180, viewportHeight * 0.25)
  let current = positions[0].id
  for (const section of positions) {
    if (section.y > line) break
    current = section.id
  }
  return current
}

export function guideSectionURL(pageURL, sectionID) {
  const url = new URL(pageURL)
  url.hash = encodeURIComponent(sectionID)
  return url.href
}

export function guideHashID(hash) {
  try { return decodeURIComponent(hash.replace(/^#/, '')) } catch { return '' }
}
