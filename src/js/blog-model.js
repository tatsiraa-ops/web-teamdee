/* Reader intent is separate from the original CMS taxonomy; URLs and categories stay intact. */
export const blogTopics = [
  { id: 'fabric', name: 'เลือกผ้า' },
  { id: 'technique', name: 'เลือกเทคนิคผลิต' },
  { id: 'planning', name: 'งบ ไซซ์ และวันใช้งาน' },
  { id: 'ideas', name: 'ไอเดียและเตรียมแบบ' },
]
const topicsBySlug = {
  'what-is-dft-shirt-printing-durability-guide': ['technique'],
  'sports-running-shirt-fabric-guide': ['fabric'],
  'polo-shirt-size-chart-uniform-guide': ['planning'],
  'how-to-start-clothing-brand-production-guide': ['planning'],
  'garment-production-cost-structure-bulk-order': ['planning'],
  'event-sports-day-t-shirt-timeline-management': ['planning'],
  'sublimation-sportswear-designs': ['ideas'],
  'shirt-production-techniques-guide': ['technique'],
  'polo-shirt-fabric-guide': ['fabric'],
  'how-to-design-sportswear-color-guide': ['ideas', 'technique'],
  'how-to-choose-garment-factory-checklist': ['planning'],
  'choose-uniform-manufacturer-checklist': ['planning'],
}
export const normalizeBlogQuery = (s = '') => s.normalize('NFKC').toLocaleLowerCase('th').replace(/\s+/g, ' ').trim()
export function blogMatches(item, { q = '', cat = 'all', topic = 'all' } = {}) {
  const text = normalizeBlogQuery(`${item.title} ${item.excerpt} ${item.catName || ''}`)
  return (cat === 'all' || item.cat === cat) && (topic === 'all' || item.topics.includes(topic)) && normalizeBlogQuery(q).split(' ').every((word) => text.includes(word))
}
export function blogView(data) {
  const names = Object.fromEntries(data.cats.map((c) => [c.id, c.name]))
  const items = data.items.map((p) => ({ ...p, catName: names[p.cat], topics: topicsBySlug[p.slug] || [], topicKeys: (topicsBySlug[p.slug] || []).join(' ') }))
  const featured = items.find((p) => p.slug === 'what-is-dft-shirt-printing-durability-guide') || items[0]
  const ideas = ['sublimation-sportswear-designs', 'how-to-design-sportswear-color-guide'].map((slug) => items.find((p) => p.slug === slug)).filter(Boolean)
  const highlighted = new Set([featured?.slug, ...ideas.map((p) => p.slug)])
  /* แนวนิตยสาร (อาร์ตเลือก 27 ต.ค.): เรื่องปก = DFT · เรื่องข้าง = ไอเดียแบบเสื้อ + ไทม์ไลน์งาน (ใหม่และคนค้นบ่อย)
     ที่เหลืออยู่ใต้หัวข้อแรกของเรื่อง ไม่ซ้ำกัน · หัวข้อที่มีเรื่องมากสุดขึ้นก่อน = คอลัมน์กว้าง */
  const side = ['sublimation-sportswear-designs', 'event-sports-day-t-shirt-timeline-management'].map((slug) => items.find((p) => p.slug === slug)).filter(Boolean)
  const onCover = new Set([featured?.slug, ...side.map((p) => p.slug)])
  const rest = items.filter((p) => !onCover.has(p.slug))
  const blocks = blogTopics
    .map((t) => ({ ...t, items: rest.filter((p) => (p.topics[0] || 'planning') === t.id) }))
    .filter((b) => b.items.length)
    .sort((x, y) => y.items.length - x.items.length)
  const latest = items.map((p) => p.date).sort().at(-1)
  const magazine = { main: featured, side, blocks, latest: items.find((p) => p.date === latest)?.dateTh }
  return { ...data, cats: data.cats.map((c) => ({ ...c, n: items.filter((p) => p.cat === c.id).length })), items, featured, idea: ideas[0], ideaMore: ideas.slice(1), topics: blogTopics.map((t) => ({ ...t, n: items.filter((p) => p.topics.includes(t.id)).length })), magazine, library: [...items.filter((p) => !highlighted.has(p.slug)), ...items.filter((p) => highlighted.has(p.slug))] }
}
