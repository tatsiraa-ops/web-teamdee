/* 9 พ.ย. 2026 อาร์ต (กล่องดูแบบเสื้อพื้นดำเต็มจอ) "เอาแบบกดขึ้นมาแล้ว popup ทัดรับ และดูแบบไม่ได้ตัดออกจากเว็บขนาดนั้น ตอนนี้มันดูตัดขาดออกจากเว็บ"
   → แบบเสื้อที่มีรหัส: กล่องขาวขอบมนลอยกลางจอ หน้าเว็บด้านหลังจาง+เบลอ · ชื่อทรงตัวใหญ่ รหัสบรรทัดรอง · ปุ่มชุดเดียวกับเว็บ
   รูปในกล่องไม่ทับแถบรหัสดำ (ภาพพร้อมรหัสใช้ตอนเซฟเท่านั้น) · รูปลูกค้าจริงยังเป็นกล่องมืดเดิม */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('กล่องแบบเสื้อ: โหมดสว่างเมื่อมีรหัส · มีชื่อทรง · รูปในกล่องไม่ถูกแทนด้วยภาพแถบรหัส', () => {
  const js = read('src/js/lightbox.js')
  assert.match(js, /dlg\.classList\.toggle\('lb--design', !!code \|\| el\.dataset\.design === '1'\)/) /* 10 พ.ย. แบบไม่มีรหัสจากแกลเลอรีเว็บเดิมก็เป็นโหมดสว่าง */
  assert.match(js, /class="lb__title"/)
  assert.match(js, /titleOf\(/)
  /* ภาพพร้อมรหัสใช้เป็นไฟล์เซฟ ไม่สลับรูปที่แสดง */
  assert.doesNotMatch(js, /img\.src = dataUrl/)
  const src = js.match(/export const titleOf = (\(alt\) => .+)\n/)[1]
  const titleOf = new Function(`return ${src}`)()
  assert.equal(titleOf('แบบเสื้อฟุตบอล Jersey งานพิมพ์ลาย รหัส TD-0001 ด้านหน้าและด้านหลัง'), 'เสื้อฟุตบอล Jersey') /* หน้าแรก */
  assert.equal(titleOf('แบบเสื้อแขนกุด บาส-วอลเลย์ พิมพ์ลาย รหัส TD-0005'), 'เสื้อแขนกุด บาส-วอลเลย์') /* หน้าแบบเสื้อ */
  assert.equal(titleOf('ทีมฟุตบอลถ่ายรูปหมู่'), '') /* รูปลูกค้า ไม่มีชื่อทรง */
})

test('กล่องแบบเสื้อ: CSS การ์ดขาวลอยบนหน้าเว็บที่จาง · มือถือพื้นขาว', () => {
  const css = read('src/styles/viewer.css')
  assert.match(css, /dialog\.lb\.lb--design \{[^}]*background: transparent;/)
  assert.match(css, /dialog\.lb\.lb--design::backdrop \{[^}]*backdrop-filter: blur\(/)
  assert.match(css, /dialog\.lb\.lb--design \.lb__fig \{[^}]*border-radius: 28px;[^}]*background: #fff;/)
  assert.match(css, /dialog\.lb\.lb--design \.lb__cap \{[^}]*color: var\(--color-ink\);/)
  assert.match(css, /@media \(max-width: 767px\) \{[\s\S]*dialog\.lb\.lb--design::after \{[^}]*rgb\(255 255 255/)
})

test('หน้าแรก: กล่องดูรูปใหญ่ใช้รูปครอปสะอาด 1200 (design-home)', () => {
  const m = read('dist-wp/index.html')
  const sec = m.slice(m.indexOf('id="designs"'), m.indexOf('</section>', m.indexOf('id="designs"')))
  const fulls = [...sec.matchAll(/data-full="([^"]+)"/g)].map((x) => x[1])
  assert.ok(fulls.length >= 60)
  for (const f of fulls) {
    assert.match(f, /\/img\/design-home\/(TD-\d+|g-[a-z]+-\d{3})-1200\.webp$/)
    assert.ok(existsSync(new URL(`../public${f.slice(f.indexOf('/img/'))}`, import.meta.url)), f)
  }
})

/* 10 พ.ย. อาร์ต (ภาพปุ่ม 3 ก้อนเรียงกันในกล่อง) "ทำมาดีๆครับ sloppy มาก" → "เน้นๆ ไอคอน · คนแลบไม่ต้องอ่านตัวหนังสือก็กดได้"
   → ปุ่มหลัก LINE เต็มกว้างตัวเดียว (โลโก้ LINE) · ปุ่มรองเป็นแถวไทล์ไอคอนใหญ่ + คำสั้นคำเดียว: บุ๊กมาร์ก "เก็บไว้" · ป้ายราคา "ขอราคา" · ดาวน์โหลด "เซฟรูป"
   เก็บแล้ว = บุ๊กมาร์กทึบสีส้ม "เก็บแล้ว" · ไทล์ที่ซ่อนไม่กินช่อง (หน้าแรกไม่มีปุ่มเก็บ = 2 ไทล์) */
test('กล่องแบบเสื้อ: ปุ่มหลัก LINE 1 ตัว · แถวไทล์ไอคอน เก็บไว้ / ขอราคา / เซฟรูป', () => {
  const js = read('src/js/lightbox.js')
  assert.match(js, /<span class="lb__tiles">[\s\S]*class="lb__pick lb__tile"[\s\S]*class="lb__quote lb__tile"[\s\S]*class="lb__save lb__tile"[\s\S]*<\/span>/)
  for (const ico of ['lb__ico--keep', 'lb__ico--price', 'lb__ico--save']) assert.match(js, new RegExp(`class="lb__ico ${ico}"`), ico)
  assert.match(js, /'เก็บไว้'/)
  assert.match(js, /'เก็บแล้ว'/)
  assert.match(js, /<span class="lb__tile-t">ขอราคา<\/span>/)
  assert.doesNotMatch(js, /หรือกดค้างที่รูป/)
  const css = read('src/styles/viewer.css')
  assert.match(css, /dialog\.lb\.lb--design \.lb__tiles \{[^}]*grid-auto-flow: column;[^}]*grid-auto-columns: minmax\(0, 1fr\);/)
  assert.match(css, /dialog\.lb\.lb--design \.lb__tile \{[^}]*flex-direction: column;[^}]*min-height: 84px;/)
  assert.match(css, /dialog\.lb\.lb--design \.lb__ico \{[^}]*width: 44px; height: 44px;/)
  assert.match(css, /dialog\.lb\.lb--design \.lb__pick\[aria-pressed="true"\] \.lb__ico \{[^}]*background: #FF6C00;/)
})
