/* ค้นหาทั้งเว็บ (/search/) แบบไม่แตะหน้าเว็บ · เทส tests/search-intent.test.js
   ใช้ตารางคำพ้อง/เจตนาเดียวกับ /faq/ (faq-search.js ← src/data/search-synonyms.json) · ดัชนีรวมคำถาม FAQ (k "คำถาม" ชี้ /faq/#ข้อ) */
import { parseQuery, scoreAll, EXACT } from './faq-search.js'

/* key ใน routes.json แบบ "guides.size" → URL */
const routeOf = (routes, key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), routes)

/** หน้าที่ตรงกับคำค้น เรียงตรงที่สุดก่อน · หน้าที่เจตนากำหนด (ไซซ์ → ตารางไซซ์ · ราคา → คำนวณราคา) ขึ้นบนสุด
    pages: [{ t, d, u, k }] · คืน [] ถ้าคำค้นว่าง */
export function searchPages(q, pages, routes = {}) {
  const p = parseQuery(q)
  if (!p.words.length && !p.intents.length) return []
  const pin = new Set(p.intents.flatMap((i) => i.pages || []).map((k) => routeOf(routes, k)).filter(Boolean))
  const scores = scoreAll(p, pages.map((x) => `${x.t} ${x.d} ${x.k}`), pages.map((x) => x.t))
  return pages
    /* หน้าที่เจตนากำหนดขึ้นบนสุดเสมอ (DTF → หน้าเสื้อสกรีน แม้หน้านั้นไม่ได้เขียนคำว่า DFT) */
    .map((x, i) => ({ x, i, s: pin.has(x.u) ? 10 * EXACT + scores[i] : scores[i] }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((r) => r.x)
}

/** แบบเสื้อที่ตรงกับคำค้น (รหัส ชนิดเสื้อ งาน สี) · พิมพ์รหัสมาตรงๆ ให้แบบนั้นมาก่อนเสมอ */
export function searchDesigns(q, designs) {
  const p = parseQuery(q)
  if (!p.words.length && !p.intents.length) return []
  const scores = scoreAll(p, designs.map((d) => `${d.c} ${d.g} ${d.t} ${d.col}`))
  const hits = designs.filter((d, i) => scores[i] > 0)
  if (!/^td-?\d{1,4}$/i.test(String(q).trim())) return hits
  const code = String(q).trim().toLowerCase().replace(/-/g, '')
  const exact = designs.filter((d) => d.c.toLowerCase().replace(/-/g, '') === code)
  return [...exact, ...hits.filter((d) => !exact.includes(d))]
}
