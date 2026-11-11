/* Recommendations are design starting points, never customer/project attribution. */
export const suggestedCodes = {
  shop: ['TD-0008', 'TD-0026', 'TD-0027', 'TD-0029'],
  class: ['TD-0011', 'TD-0024', 'TD-0028', 'TD-0031'],
  faculty: ['TD-0015', 'TD-0024', 'TD-0030', 'TD-0033'],
}
export function gallerySelection(designs, id, actual = []) {
  if (actual.length || !suggestedCodes[id]) return { items: actual, inspiration: false }
  const byCode = new Map(designs.map(d => [d.code, d]))
  return { inspiration: true, items: suggestedCodes[id].map(code => byCode.get(code)).filter(Boolean) }
}
