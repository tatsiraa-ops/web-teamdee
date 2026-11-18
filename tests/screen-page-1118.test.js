/* 18 พ.ย. 2026 หน้า /screen-printing/ ตามสไลด์ "ขายงานสกรีน DTF" · ตรวจ HTML ที่ export แล้ว (npm run build && npm run export:wp)
   ตัวเลขเทียบกับ prices.json ไม่พิมพ์ซ้ำ · สเปก docs/superpowers/specs/2026-11-18-screen-dtf-pricing-design.md */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const S = JSON.parse(read('src/data/prices.json')).products.screen
const page = JSON.parse(read('wp-theme/teamdee/build/pages.json')).pages['/screen-printing/']
const html = read('wp-theme/teamdee/build/pages/screen-printing.body.html')
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
const table = (id) => (main.match(new RegExp(`<table[^>]*id="${id}"[\\s\\S]*?</table>`)) || [''])[0]
const rowNums = (t, size) => [...((t.match(new RegExp(`<tr><th scope="row">${size}[\\s\\S]*?</tr>`)) || [''])[0].matchAll(/<td>([\d,]+)<\/td>/g))].map((m) => Number(m[1].replace(',', '')))

test('title / description', () => {
  assert.equal(page.title, 'รับทำเสื้อสกรีน DTF เริ่ม 5 ตัว ราคารวม VAT | TEAMDEE')
  assert.match(page.description, /เริ่ม 5 ตัว/); assert.match(page.description, /145–245/)
})

test('ตารางราคา 3 ตาราง = เมทริกซ์ใน prices.json · ไม่ซ่อนในปุ่มกดเปิด', () => {
  for (const [id, m] of [['screen-price-own', S.own.first], ['screen-price-extra', S.extra.price], ['screen-price-customer', S.customer.first]]) {
    const t = table(id)
    assert.ok(t, id)
    for (const [size, row] of Object.entries(m)) assert.deepEqual(rowNums(t, size), row, `${id} ${size}`)
  }
  assert.doesNotMatch(main.slice(main.indexOf('id="price"'), main.indexOf('id="own-shirt"')), /<details/)
})

test('ตัวอย่างคำนวณจากตัวคิดราคา (18,000 · 28,800) · ปุ่มไปเครื่องคำนวณสกรีน', () => {
  const t = text(main)
  assert.match(t, /225 บาท\/ตัว[^]*18,000 บาท/); assert.match(t, /240 บาท\/ตัว[^]*28,800 บาท/)
  assert.match(main, /href="[^"]*\/calculations\/\?kind=screen"/)
})

test('สกรีนบนเสื้อของคุณ: ขั้นต่ำ 20 · ผ้าที่รับ/ระวัง/ไม่รับ', () => {
  const own = text(main.slice(main.indexOf('id="own-shirt"')))
  assert.match(own, /ขั้นต่ำ 20 ตัว/); assert.match(own, /ผ้ากันน้ำ/); assert.match(own, /ส่งรูปป้ายเสื้อ/)
})

test('เสื้อ 2 รุ่น: C32 8 สี (ฟ้า สอบถามสต็อก) + ตารางไซซ์ S–5XL (+20 ตั้งแต่ 2XL) · Oversize +30', () => {
  const sw = main.match(/<ul class="screen-colors" aria-label="สี Premium Cotton C32 Comb">[\s\S]*?<\/ul>/)[0]
  assert.equal((sw.match(/<li/g) || []).length, 8); assert.match(text(sw), /ฟ้า สอบถามสต็อก/)
  const sizeHtml = main.slice(main.indexOf('id="size"'))
  const size = text(sizeHtml)
  for (const [s, c, l] of S.shirts[0].sizes) assert.match(sizeHtml, new RegExp(`<th scope="row">${s}</th><td>${c}</td><td>${l}</td>`))
  assert.match(size, /2XL ขึ้นไป \+20 บาท\/ตัว/); assert.match(size, /\+30 บาท\/ตัว/)
})

test('ขนาดลาย 5 ขนาด (วาดเป็นเส้น ไม่ใช้ภาพจำลองจากสไลด์)', () => {
  const d = main.slice(main.indexOf('id="detail"'), main.indexOf('id="price"'))
  for (const z of S.sizes) assert.match(text(d), new RegExp(`${z.id} ${z.cm} ซม\\.`))
  assert.match(d, /<svg[^>]*class="screen-sizes__art"/)
})

test('วันผลิต · มัดจำ 300 + 50% · FAQ ตัวเลขใหม่', () => {
  const t = text(main)
  assert.match(t, /1–50 ตัว 1–2 วัน/); assert.match(t, /มัดจำขึ้นแบบ 300 บาท/)
  assert.match(t, /เริ่ม 5 ตัว/); assert.match(t, /2XL ขึ้นไป \+20/)
})

test('DTF · "DFT" แค่ 1 จุดในวงเล็บ · ไม่มีข้อความเก่า/ข้อมูลภายใน · H1 เดียว', () => {
  assert.equal((main.match(/DFT/g) || []).length, 1); assert.match(text(main), /หลายคนเรียก DFT/)
  for (const bad of ['เริ่ม 1 ตัว', 'ไม่มีขั้นต่ำ', '3–14', 'ทุกไซซ์ราคาเดียว', 'HUB', 'มั่ง', 'โรงงาน', 'ต้นแบบ', '[ยืนยัน', '25–55']) assert.ok(!text(main).includes(bad), bad)
  assert.equal((main.match(/<h1[\s>]/g) || []).length, 1)
  assert.doesNotMatch(read('wp-theme/teamdee/build/pages/screen-printing.head.html'), /DFT|เริ่ม 1 ตัว|3–14/)
})
