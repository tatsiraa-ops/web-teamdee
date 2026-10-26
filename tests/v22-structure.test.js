/* เทียบโครงหน้ากับ Wireframe v22 (PAGE-CONTENT.json + PAGE-MAP.json) · build ต้นแบบ (dist) ที่โชว์ทุกส่วน รวมช่องรอข้อมูล
   ทุกหัวข้อ H2 ของ v22 ต้องมีในหน้าเดียวกัน (ข้อความตรง ไม่สนช่องว่าง/เลขข้อนำหน้า) · หน้าเว็บจริงซ่อนส่วนที่ยังไม่มีของจริงได้ ตรวจที่ seo-pages.test.js
   ยกเว้นที่ตั้งใจไว้ (EXCEPT) ต้องมีเหตุผลกำกับ */
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const spec = (f) => JSON.parse(readFileSync(join(root, 'docs/spec/teamdee-v22', f), 'utf8')).pages
const content = Object.fromEntries(spec('PAGE-CONTENT.json').map((p) => [p.id, p]))
const pages = spec('PAGE-MAP.json').filter((p) => !p.id.startsWith('design-wf'))
const norm = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x3D;/g, '=').replace(/\s+/g, '')
/* หน้ากลุ่มลูกค้า: H2 ที่ไม่ใช่หัวข้อแบบเสื้อ/FAQ ใช้ชื่อแรก แทนชื่อเต็ม "ก / ข / ค" (agent ลูกค้า 22 ต.ค. · scripts/v22/use-pages.mjs shortenH2) */
const longNames = JSON.parse(readFileSync(join(root, 'src/data/uses.json'), 'utf8')).map((u) => u.name).filter((n) => n.includes(' / '))
const variants = (h) => {
  const t = h.replace(/^\d+\s*\/\s*/, '') // หน้าแรก v22 ใส่เลขส่วน "02 / " นำหน้า
  return [t, ...longNames.filter((n) => t.includes(n)).map((n) => t.replace(n, n.split(' / ')[0]))].map(norm)
}
const EXCEPT = {
  /* หน้าเนื้อหาเดิมบน CMS เว็บจริง ไม่ export (seo-check.mjs CMS_PAGES) */
  privacy: 'all',
  /* การ์ดแนะนำของ v22 เป็นบทความร่าง (noindex) → แนะนำบทความเดิมแทน */
  articles: ['เสื้อโปโลปักกับเสื้อพิมพ์ลาย เลือกแบบไหนสำหรับพนักงาน?'],
  /* หน้าแรก: ชำระเงิน + รับประกัน รวมเข้าส่วน "ทุกออเดอร์ได้ครบ" (อาร์ตเคาะ 23 ต.ค. · ตรวจหน้าแรกกลุ่ม 2 ข้อ A) */
  home: ['ชำระค่าเสื้อและเตรียมเอกสารสำหรับองค์กร', '11 / การรับประกันเสื้อและบริการหลังการขาย'],
  /* สกรีนของทีมดีมีแค่ DFT ไม่มีหลายวิธีให้เลือก (อาร์ตเคาะ 26 ต.ค.) → H2 เป็น "วางลายสกรีน DFT ตามลาย ผ้า และจำนวน" (claims.mjs) */
  screen: ['เลือกวิธีสกรีนจากลาย ผ้า และจำนวน'],
}

before(() => execSync('npx vite build --logLevel error', { cwd: root, stdio: 'pipe' }))

test('ทุกหน้าในผัง v22 มีไฟล์ · H2 ของ v22 อยู่ครบในต้นแบบ', () => {
  const bad = []
  for (const p of pages) {
    if (EXCEPT[p.id] === 'all') continue
    const f = join(root, 'dist', p.proposed_url === '/404/' ? '404.html' : `${p.proposed_url}index.html`)
    if (!existsSync(f)) { bad.push(`${p.proposed_url}: ไม่มีหน้า`); continue }
    const html = readFileSync(f, 'utf8')
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    const got = [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => norm(m[1]))
    for (const h of content[p.id].headings.filter((x) => x.level === 'H2').map((x) => x.text)) {
      if ((EXCEPT[p.id] || []).includes(h)) continue
      if (!variants(h).some((v) => got.some((g) => g.includes(v)))) bad.push(`${p.proposed_url}: ไม่มี H2 "${h}"`)
    }
  }
  assert.deepEqual(bad, [])
})

test('คำค้นทุกคำบนการ์ดผังเว็บ v22 (PAGE-MAP keyword) อยู่ในหน้า', () => {
  const bad = []
  for (const p of pages) {
    if (EXCEPT[p.id] === 'all' || !p.keyword) continue
    const f = join(root, 'dist', p.proposed_url === '/404/' ? '404.html' : `${p.proposed_url}index.html`)
    const html = norm(readFileSync(f, 'utf8'))
    for (const k of p.keyword.split('·').map((x) => x.trim()).filter(Boolean)) if (!html.includes(norm(k))) bad.push(`${p.proposed_url}: "${k}"`)
  }
  assert.deepEqual(bad, [])
})

/* เมนูหลักตาม wireframe v22 (header ของ TEAMDEE-Full-Website-Wireframe.html · อาร์ตส่งภาพยืนยัน 22 ต.ค.) */
const NAV_V22 = [
  /* เพิ่มจาก v22: อาร์ตสั่งให้มีเมนู "หน้าแรก" ให้กดได้ (22 ต.ค. 2026) · v22 ใช้โลโก้อย่างเดียว */
  ['หน้าแรก', '/'],
  ['สั่งทำเสื้อ', [['สั่งทำเสื้อโปโลปัก', '/embroidery/'], ['สั่งทำเสื้อพิมพ์ลาย', '/sublimation/'], ['สั่งทำเสื้อสกรีน', '/screen-printing/'], ['สั่งทำเสื้อวอร์มพิมพ์ลาย', '/custom-printed-warmup-shirts/'], ['สั่งทำเสื้อเบสบอล', '/custom-baseball-shirts/'], ['สั่งทำเสื้อเจอร์ซีย์ Oversize', '/custom-oversize-jerseys/']]],
  ['เสื้อสำหรับทีมคุณ', [['ธุรกิจและหน่วยงาน'], ['สั่งทำเสื้อบริษัท', '/corporate/'], ['สั่งทำเสื้อพนักงานร้านค้า', '/custom-staff-shirts/'], ['สั่งทำเสื้อหน่วยงาน', '/custom-organization-shirts/'],
    ['โรงเรียน รุ่น และชมรม'], ['สั่งทำเสื้อโรงเรียน / เสื้อกีฬาสี', '/education/'], ['สั่งทำเสื้อรุ่น / เสื้อชมรม', '/custom-class-shirts/'], ['สั่งทำเสื้อคณะ / เสื้อมหาวิทยาลัย', '/custom-university-shirts/'],
    ['กีฬา'], ['สั่งทำเสื้อกีฬา', '/sport/'], ['สั่งทำเสื้อแบดมินตัน / เสื้อแบด / เสื้อก๊วนแบด', '/custom-badminton-shirts/'], ['สั่งทำเสื้อวิ่ง / เสื้องานวิ่ง', '/custom-running-shirts/'],
    ['อีเวนต์และกิจกรรม'], ['สั่งทำเสื้ออีเวนต์ / เสื้อกิจกรรม / เสื้อ Outing', '/event/']]],
  ['แบบเสื้อพิมพ์ลาย', '/designs/'],
  ['รีวิวลูกค้า', '/project/'],
  ['คู่มือและบทความ', [['คู่มือสั่งทำ'], ['วิธีสั่งเสื้อพิมพ์ลาย', '/printed-shirt-order-guide/'], ['วิธีสั่งเสื้อสกรีน', '/screen-printing-order-guide/'], ['วิธีสั่งเสื้อโปโลปัก', '/embroidered-polo-order-guide/'], ['เลือกผ้าเสื้อทีม', '/fabric-technology/'], ['ตารางไซซ์และวิธีวัด', '/size-chart/'], ['เตรียมโลโก้และข้อมูล', '/artwork-preparation-guide/'], ['จัดส่งและหลังการขาย', '/delivery-after-sales-guide/'], ['บทความและไอเดีย', '/blog/'], ['คำถามที่พบบ่อย', '/faq/']]],
  ['รู้จักทีมดี', '/about-us/'],
]
const flat = (nav) => nav.flatMap(([t, x]) => (Array.isArray(x) ? [t, ...x.map((i) => i.join(' '))] : [`${t} ${x}`]))

test('เมนูหลัก (เดสก์ท็อปและมือถือ) ชื่อ ลำดับ กลุ่ม และลิงก์ ตรง v22', () => {
  const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
  const txt = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const read = (part) => [...part.matchAll(/<(a|button|p)\b([^>]*)>([\s\S]*?)<\/\1>/g)]
    .filter(([, tag, attrs]) => tag !== 'p' || /dd__group|mnav__head/.test(attrs))
    .map(([, tag, attrs, inner]) => { const href = (attrs.match(/href="([^"]+)"/) || [])[1]; return href && tag === 'a' ? `${txt(inner)} ${href}` : txt(inner) })
  const desk = html.slice(html.indexOf('aria-label="เมนูหลัก"'), html.indexOf('</nav>', html.indexOf('aria-label="เมนูหลัก"')))
  assert.deepEqual(read(desk), flat(NAV_V22))
  const mob = html.slice(html.indexOf('aria-label="เมนูมือถือ"'), html.indexOf('</nav>', html.indexOf('aria-label="เมนูมือถือ"')))
  assert.deepEqual(read(mob).filter((x) => !/^(ติดต่อทีมดี|ทักไลน์|ทัก LINE|โทร)/.test(x)), flat(NAV_V22))
  assert.match(desk, /href="\/"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/"/)
})
