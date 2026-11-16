/* 12 พ.ย. 2026 อาร์ต "1-4 มาก่อน" (ตรวจหน้าร้านค้า หน่วยงาน โรงเรียน เทียบหน้าบริษัท)
   ข้อ 2: หน้าร้านค้าไม่มีคลังรีวิว ทั้งที่ /corporate/ /custom-organization-shirts/ /education/ มี → เพิ่มจากรูปลูกค้าร้านค้าจริงในคลัง
   ข้อ 3: แถบโลโก้ทุกหน้าเป็น 45 โลโก้ชุดเดียวกันเรียงเหมือนกัน → แถวแรกขึ้นโลโก้ของกลุ่มนั้นก่อน (ใช้โลโก้เดิมที่อาร์ตอนุมัติ 22 ต.ค. ไม่เพิ่มโลโก้ใหม่) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const text = (h) => h.replace(/<\/?t-(?:g|nw)>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const lib = JSON.parse(readFileSync(new URL('../src/data/media-library.json', import.meta.url), 'utf8')).items
const names = JSON.parse(readFileSync(new URL('../src/data/client-logos.json', import.meta.url), 'utf8'))

test('/custom-staff-shirts/ คลังรีวิว: ต่อจากรีวิวลูกค้าร้านค้า · รูปร้านค้าจริงขึ้นก่อน เติมรูปพนักงานจริง · ไม่ซ้ำรูปอื่นในหน้า', () => {
  const m = main('custom-staff-shirts')
  const at = m.indexOf('<section class="hm-sec rvw-sec" id="shop-review-wall"')
  assert.ok(at > 0, 'มีคลังรีวิว')
  assert.ok(m.indexOf('id="reviews"') < at, 'อยู่ต่อจากรีวิวลูกค้าร้านค้า')
  const sec = m.slice(at, m.indexOf('</section>', at))
  const imgs = [...sec.matchAll(/<li class="rvw__ph"[^>]*><img src="([^"]+)"[^>]*alt="([^"]+)"/g)].map((x) => ({ src: x[1], alt: x[2] }))
  /* รูปร้านค้า (กลุ่มหลัก shop) ที่ยังไม่อยู่ในหน้ามีแค่ 9 รูป → ขึ้นก่อนทั้งหมด แล้วเติมด้วยรูปพนักงานจริงจากกลุ่ม corp */
  assert.ok(imgs.length >= 24, `รูปเยอะพอ (${imgs.length})`)
  const kinds = imgs.map(({ src, alt }) => {
    assert.ok(pub(src), src); assert.ok(alt.trim(), `${src}: alt`)
    const it = lib.find((x) => x.path === src)
    assert.ok(it && it.kind === 'customer', `${src}: รูปลูกค้าจริงจากคลัง`)
    if ((it.primary || []).includes('shop')) return 'shop'
    assert.ok((it.groups || []).includes('corp'), `${src}: รูปเติมต้องเป็นลูกค้าบริษัท`)
    return 'corp'
  })
  const n = kinds.filter((k) => k === 'shop').length
  /* 13 พ.ย. ตัดรูปร้านค้า 4 รูปที่เป็นงานเดียวกับรูปในส่วนรีวิวข้างบน (tests/use-three-pages-audit.test.js ข้อ 4) → เหลือ 5 */
  assert.ok(n >= 5, `รูปร้านค้า ${n}`)
  assert.ok(kinds.slice(0, n).every((k) => k === 'shop'), 'รูปร้านค้าขึ้นก่อน')
  /* หัวข้อกลาง ไม่เคลมว่าทุกรูปเป็นร้านค้า (แบบหน้าหน่วยงาน) · หน้าร้านค้าห้ามมีคำของกลุ่มบริษัท */
  const h = text(sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1])
  assert.match(h, /ลูกค้า/); assert.doesNotMatch(h, /บริษัท|องค์กร/)
  assert.equal(new Set(imgs.map((x) => x.src)).size, imgs.length, 'ไม่ซ้ำในคลัง')
  const rest = m.slice(0, at) + m.slice(m.indexOf('</section>', at))
  /* เทียบชื่อไฟล์เต็ม: lc24 ต้องไม่ถูกนับว่าซ้ำกับ lc241 (ชื่อขึ้นต้นเหมือนกัน) */
  for (const { src } of imgs) assert.ok(!new RegExp(src.replace(/\.webp$/, '').replace(/[/.]/g, '\\$&') + '(?![0-9])').test(rest), `${src}: ไม่ซ้ำกับรูปอื่นในหน้า`)
})

const logoRows = (f) => {
  const m = main(f)
  const sec = m.slice(m.indexOf('class="hm-sec hm-sec--tight hm-logowrap up2-logos"'), m.indexOf('</section>', m.indexOf('up2-logos')))
  return { h: text(sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]), rows: [...sec.matchAll(/<ul class="hm-marquee__track" aria-label="[^"]*">([\s\S]*?)<\/ul>/g)].map((r) => [...r[1].matchAll(/src="\/img\/client-fit\/(c\d+)\.\w+"/g)].map((x) => x[1])) }
}
const GOV = ['c06', 'c07', 'c21', 'c22', 'c26', 'c27', 'c28', 'c30', 'c31', 'c37', 'c38', 'c39', 'c40', 'c45']
const EDU = ['c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18', 'c35']

test('โลโก้หน่วยงาน: แถวแรกเป็นหน่วยงานรัฐ/รัฐวิสาหกิจ · หัวข้อพูดถึงหน่วยงาน · ครบ 45 โลโก้ไม่ซ้ำ', () => {
  const { h, rows } = logoRows('custom-organization-shirts')
  assert.deepEqual([...rows[0]].sort(), [...GOV].sort())
  assert.match(h, /หน่วยงาน/)
  assert.equal(new Set(rows.flat()).size, 45)
})

test('โลโก้โรงเรียน: แถวแรกเป็นมหาวิทยาลัย/สถาบันการศึกษา · หัวข้อพูดถึงสถาบันการศึกษา · ครบ 45 โลโก้ไม่ซ้ำ', () => {
  const { h, rows } = logoRows('education')
  assert.deepEqual([...rows[0]].sort(), [...EDU].sort())
  assert.match(h, /สถาบันการศึกษา/)
  assert.equal(new Set(rows.flat()).size, 45)
})

test('โลโก้ร้านค้า: แถวแรกเป็นแบรนด์ธุรกิจ ไม่มีหน่วยงานรัฐหรือมหาวิทยาลัย · ครบ 45 ไม่ซ้ำ', () => {
  const { rows } = logoRows('custom-staff-shirts')
  assert.ok(rows[0].length >= 10, `แถวแรก ${rows[0].length}`)
  for (const c of rows[0]) assert.ok(!GOV.includes(c) && !EDU.includes(c), `${c} ${names[c]}`)
  assert.equal(new Set(rows.flat()).size, 45)
})

test('ทุกโลโก้ที่แยกกลุ่มมีชื่อ (alt) และไฟล์จริง', () => {
  for (const c of [...GOV, ...EDU]) { assert.ok(names[c], c); assert.ok(pub(`/img/client-fit/${c}.png`) || pub(`/img/client-fit/${c}.webp`), c) }
})
