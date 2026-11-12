/* 11 พ.ย. 2026 อาร์ต "ไปตรวจสิ่งที่ตัวเองทำ" → "เริ่มทั้งหมดได้" (ร้านค้า · หน่วยงาน · โรงเรียน)
   1 showroom แถวแบบ 3D = แบบของกลุ่มนั้นที่ยืนยันชื่องานแล้ว (เดิมเป็นแบบชุดหน้าบริษัท ใต้หัวข้อ "ผลงานเสื้อ<กลุ่ม>") · แถวเสื้อจริงบนหุ่น = บอกว่าคละทุกกลุ่ม
   2 kicker ร้านค้าไม่พูดถึงร้านอาหาร/คาเฟ่ (ไม่มีเนื้อหานั้นแล้ว) · 3 รีวิวรายการเดียวไม่มีลูกศร/ตัวนับ */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const row = (m, id) => { const a = m.indexOf(`id="show-${id}"`); return m.slice(a, m.indexOf('</div><!-- /row', a) > 0 ? m.indexOf('</div><!-- /row', a) : m.indexOf('id="show-', a + 10) > 0 ? m.indexOf('id="show-', a + 10) : m.indexOf('</section>', a)) }
const OK = {
  'custom-staff-shirts': ['embroider-006', 'embroider-016', 'embroider-014', 'embroider-032', 'shop-watsadu'],
  'custom-organization-shirts': ['gov-bangkrathum', 'gov-prd', 'gov-mwa-esports', 'gov-mwa-darts'],
  education: ['edu-sriboonyanon', 'edu-room8', 'edu-bannongmihuadong', 'edu-school50', 'edu-waikru'],
}

test('showroom แถวแบบ 3D ของแต่ละกลุ่ม = แบบของกลุ่มนั้นที่ยืนยันแล้ว · แถวเสื้อจริงบอกว่าคละทุกกลุ่ม', () => {
  for (const [page, names] of Object.entries(OK)) {
    const m = main(page)
    const srcs = [...row(m, 'designs').matchAll(/<img[^>]*src="([^"]+)"/g)].map((x) => x[1]).filter((s) => !s.includes('/img/icons/'))
    assert.ok(srcs.length >= names.length - 1, `${page}: ${srcs.length}`)
    for (const s of srcs) { assert.ok(pub(s), s); assert.ok(names.some((n) => s.includes(`/design-front/${n}`)), `${page}: ${s} ไม่ใช่แบบของกลุ่มนี้`) }
    assert.match(row(m, 'real'), /หลายกลุ่ม/, `${page}: แถวเสื้อจริงบอกว่าคละทุกกลุ่ม`)
  }
})

test('kicker ร้านค้าตรงเนื้อหา · รีวิวรายการเดียวไม่มีลูกศร', () => {
  const shop = main('custom-staff-shirts')
  assert.doesNotMatch(shop.match(/class="th-o__kick">([^<]*)</)[1], /ร้านอาหาร|คาเฟ่/)
  const rv = shop.slice(shop.indexOf('id="reviews"'), shop.indexOf('</section>', shop.indexOf('id="reviews"')))
  assert.doesNotMatch(rv, /data-rvb-step|data-rvb-count/)
  assert.match(main('education'), /data-rvb-step/, 'หน้าที่มีหลายรีวิวยังมีลูกศร')
})
