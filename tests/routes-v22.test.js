/* ตาราง URL ต้องตรง Wireframe v22 (docs/spec/teamdee-v22 · อาร์ตสั่ง 22 ต.ค. 2026)
   - URL เดิมที่ออนไลน์อยู่บน team-dee.com และมีหน้าต้นแบบ ต้องได้ URL เดิมเป๊ะ ไม่งั้น SEO เดิมหาย
   - หน้าตาม PAGE-MAP ต้องมีใน routes.json · ที่ยังไม่ทำให้อยู่ใน PENDING พร้อมรอบที่จะทำ (รายการต้องหดลงเรื่อยๆ)
   - ห้ามมีหน้าที่ v22 ไม่มี (เช่น /solutions/ /special/) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pageFor } from '../src/js/routes.js'

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const routes = read('../src/data/routes.json')
const map = read('../docs/spec/teamdee-v22/URL-MIGRATION-MAP.json')
const pageMap = read('../docs/spec/teamdee-v22/PAGE-MAP.json').pages
const ours = pageFor(routes, ['x'])
const key = (p) => (p ? (p.id ? `${p.kind}.${p.id}` : p.kind) : null)

/* รหัสหน้าใน v22 → key ใน routes.json */
const ID = {
  home: 'home', polo: 'products.polo', printed: 'products.print', screen: 'products.screen',
  warmup: 'products.warmup', baseball: 'products.baseball', oversize: 'products.jersey',
  business: 'uses.corp', shop: 'uses.shop', organization: 'uses.gov', education: 'uses.edu',
  class: 'uses.class', faculty: 'uses.faculty', sport: 'uses.sport', badminton: 'uses.badminton',
  running: 'uses.running', activity: 'uses.event',
  'guide-print': 'guides.print', 'guide-screen': 'guides.screen', 'guide-embroider': 'guides.polo',
  'guide-fabric': 'guides.fabric', 'guide-size': 'guides.size', 'guide-files': 'guides.logo',
  'guide-delivery': 'guides.delivery',
  'designs-business': 'galleries.corp', 'designs-shop': 'galleries.shop', 'designs-organization': 'galleries.gov',
  'designs-education': 'galleries.edu', 'designs-class': 'galleries.class', 'designs-faculty': 'galleries.faculty',
  'designs-sport': 'galleries.sport', 'designs-badminton': 'galleries.badminton', 'designs-running': 'galleries.running',
  'designs-activity': 'galleries.event',
  article: 'posts.polo', 'article-fabric': 'posts.fabric', 'article-design': 'posts.design', 'article-checklist': 'posts.checklist',
  designs: 'designs', works: 'projects', articles: 'blog', faq: 'faq', about: 'about',
  contact: 'contact', search: 'search', privacy: 'privacy',
}

/* หน้า v22 ที่ยังไม่สร้าง · ลบออกจากรายการเมื่อทำเสร็จ */
const PENDING = {
}

/* หน้าของเราที่ v22 ไม่ได้ทำต้นแบบ แต่เป็น URL เดิมบนเว็บจริง หรือเป็นหน้าภายใน */
const EXTRA_OK = new Set(['/calculations/', '/collar-styles/', '/terms-conditions/', '/ui/', '/blog/x/'])

const v22Pages = pageMap.filter((p) => p.group !== 'รายละเอียดแบบ' && p.id !== 'not-found')

test('URL เดิมบนเว็บจริงที่มีหน้าต้นแบบ ต้องเป็น URL เดิมเป๊ะ', () => {
  const wrong = []
  for (const r of map.live_url_rows.filter((r) => r.wireframe_id && r.action === 'KEEP')) {
    const path = new URL(r.old_url).pathname
    const want = ID[r.wireframe_id]
    if (!want) continue // หน้าแบบเสื้อรายกลุ่ม · อยู่ใน PENDING
    if (key(ours[path]) !== want) wrong.push(`${path} ต้องเป็นหน้า ${want} · ตอนนี้ ${key(ours[path]) ?? 'ไม่มีหน้า'}`)
  }
  assert.deepEqual(wrong, [])
})

test('ทุกหน้าใน PAGE-MAP v22 มีใน routes.json ที่ URL ตามแผน (ยกเว้นที่อยู่ใน PENDING)', () => {
  const missing = []
  for (const p of v22Pages) {
    if (PENDING[p.id]) continue
    const want = ID[p.id]
    if (!want) { missing.push(`${p.id}: ยังไม่ได้จับคู่ใน ID`); continue }
    if (key(ours[p.proposed_url]) !== want) missing.push(`${p.id}: ${p.proposed_url} ต้องเป็น ${want} · ตอนนี้ ${key(ours[p.proposed_url]) ?? 'ไม่มีหน้า'}`)
  }
  assert.deepEqual(missing, [])
})

test('ไม่มีหน้าที่ v22 ตัดออกแล้ว', () => {
  const allowed = new Set([...v22Pages.map((p) => p.proposed_url), ...map.live_url_rows.map((r) => new URL(r.old_url).pathname), ...EXTRA_OK])
  /* หน้าเคสลูกค้าจากคลิปใต้ /project/…/ ไม่อยู่ใน v22 · อาร์ตเลือกทำ (แนวทาง ก · 26 ต.ค.) · อยู่แค่ต้นแบบจนคลิปพร้อม (seo-check isExported) */
  const extra = Object.keys(ours).filter((u) => !allowed.has(u) && !u.startsWith('/blog/') && !/^\/project\/.+\//.test(u))
  assert.deepEqual(extra, [])
})

test('รายการ PENDING มีแต่หน้าที่ยังไม่ทำจริง (ทำแล้วต้องลบออก)', () => {
  const done = Object.keys(PENDING).filter((id) => {
    const p = v22Pages.find((x) => x.id === id)
    return p && ours[p.proposed_url]
  })
  assert.deepEqual(done, [])
})

test('URL ล็อก (lock) = URL เดิมบนเว็บจริงเท่านั้น', () => {
  const live = new Set(map.live_url_rows.map((r) => new URL(r.old_url).pathname))
  assert.deepEqual(routes.lock.filter((u) => !live.has(u)), [])
})
