/* คลังรีวิวบนหน้ากลุ่มลูกค้า · 11 พ.ย. 2026 อาร์ต "เพิ่มคลังรีวิวตรงนี้" (/corporate/ ต่อจาก "รีวิวจากลูกค้าองค์กร" ก่อน "ผลงานเสื้อบริษัทที่ผลิตจริง")
   ใช้ partial กลาง reviewWall.hbs (ห้าม copy/จัดใหม่) · รูปลูกค้าจริงกลุ่ม corp จากคลัง · ไม่ซ้ำรูปที่หน้านี้ใช้แล้ว */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const text = (h) => h.replace(/<\/?t-(?:g|nw)>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

test('/corporate/ คลังรีวิว: อยู่ต่อจากรีวิวองค์กร ก่อนผลงานจริง · รูปลูกค้าองค์กรจริง · ไม่ซ้ำรูปอื่นในหน้า', () => {
  const m = main('corporate')
  const at = m.indexOf('<section class="hm-sec rvw-sec" id="corp-review-wall"')
  assert.ok(at > 0, 'มีคลังรีวิว')
  assert.ok(m.indexOf('id="reviews"') < at && at < m.indexOf('id="real-work"'), 'ต่อจากรีวิวลูกค้าองค์กร ก่อนผลงานเสื้อบริษัท')
  const sec = m.slice(at, m.indexOf('</section>', at))
  assert.match(text(sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]), /องค์กร/, 'หัวข้อบอกว่าเป็นลูกค้าองค์กร')
  const imgs = [...sec.matchAll(/<li class="rvw__ph"[^>]*><img src="([^"]+)"[^>]*alt="([^"]+)"/g)].map((x) => ({ src: x[1], alt: x[2] }))
  assert.ok(imgs.length >= 12, `รูปเยอะพอ (${imgs.length})`)
  const lib = JSON.parse(readFileSync(new URL('../src/data/media-library.json', import.meta.url), 'utf8')).items
  for (const { src, alt } of imgs) {
    assert.ok(pub(src), src); assert.ok(alt.trim(), `${src}: alt`)
    const it = lib.find((x) => x.path === src)
    assert.ok(it && it.kind === 'customer' && (it.groups || []).includes('corp'), `${src}: รูปลูกค้าองค์กรจริงจากคลัง`)
  }
  assert.equal(new Set(imgs.map((x) => x.src)).size, imgs.length, 'ไม่ซ้ำในคลัง')
  const rest = m.slice(0, at) + m.slice(m.indexOf('</section>', at))
  for (const { src } of imgs) assert.ok(!rest.includes(src.replace(/\.webp$/, '')), `${src}: ไม่ซ้ำกับรูปอื่นในหน้า`)
  assert.match(sec, /class="rvw__all" href="\/project\/#reviews"/, 'ปุ่มดูรีวิวทั้งหมด')
  assert.match(sec, /data-track="line" data-where="review-wall"/, 'ปุ่ม LINE')
})

test('คลังรีวิวเปิดเฉพาะหน้าที่ตั้งไว้ใน use-v2.json (ตอนนี้ /corporate/)', () => {
  const v2 = JSON.parse(readFileSync(new URL('../src/data/use-v2.json', import.meta.url), 'utf8'))
  assert.ok(v2.corp.reviewWall, 'corp ตั้งไว้')
  const tpl = readFileSync(new URL('../src/partials/usePage.hbs', import.meta.url), 'utf8')
  assert.match(tpl, /\{\{#if up\.v2\.reviewWall\}\}\{\{> reviewWall items=up\.v2\.reviewWall\.items/, 'ใช้ partial กลาง ไม่ copy')
})

/* 11 พ.ย. อาร์ต "เพิ่มคลังรีวิว" (/sublimation/ ใต้ภาพทีมฟุตบอลท้ายส่วนขั้นตอน ก่อนส่วนชำระเงิน) · รูปคละทุกกลุ่มแบบหน้าแรก */
test('/sublimation/ คลังรีวิว: ต่อจากขั้นตอนสั่งผลิต ก่อนชำระเงิน · รูปลูกค้าจริง · ไม่ซ้ำรูปอื่นในหน้า', () => {
  const m = main('sublimation')
  const at = m.indexOf('<section class="hm-sec rvw-sec" id="print-review-wall"')
  assert.ok(at > 0, 'มีคลังรีวิว')
  assert.ok(m.indexOf('id="order"') < at && at < m.indexOf('id="payment"'), 'ต่อจากขั้นตอน (ภาพทีมฟุตบอล) ก่อนชำระเงิน')
  const sec = m.slice(at, m.indexOf('</section>', at))
  const imgs = [...sec.matchAll(/<li class="rvw__ph"[^>]*><img src="([^"]+)"[^>]*alt="([^"]+)"/g)].map((x) => ({ src: x[1], alt: x[2] }))
  assert.ok(imgs.length >= 24, `รูปเยอะพอ (${imgs.length})`)
  const lib = JSON.parse(readFileSync(new URL('../src/data/media-library.json', import.meta.url), 'utf8')).items
  for (const { src, alt } of imgs) { assert.ok(pub(src), src); assert.ok(alt.trim()); assert.equal(lib.find((x) => x.path === src)?.kind, 'customer', `${src}: รูปลูกค้าจริงจากคลัง`) }
  assert.equal(new Set(imgs.map((x) => x.src)).size, imgs.length, 'ไม่ซ้ำในคลัง')
  const rest = m.slice(0, at) + m.slice(m.indexOf('</section>', at))
  for (const { src } of imgs) assert.ok(!rest.includes(src.replace(/\.webp$/, '')), `${src}: ไม่ซ้ำกับรูปอื่นในหน้า`)
  const tpl = readFileSync(new URL('../src/partials/productPage.hbs', import.meta.url), 'utf8')
  assert.match(tpl, /\{\{#if pp2\.reviewWall\}\}\{\{> reviewWall items=pp2\.reviewWall\.items/, 'ใช้ partial กลาง ไม่ copy')
})
