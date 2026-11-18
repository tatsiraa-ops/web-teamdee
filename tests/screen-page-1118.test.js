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

/* 18 พ.ย. 2026 อาร์ต "ลบภาพแรก ภาพสอง และภาพสามเอาราคาออก": หน้าสกรีนไม่โชว์ตารางราคา/จุดเพิ่ม/ตัวอย่าง · ราคาอยู่ที่เครื่องคำนวณ */
test('การ์ด 2 ทางสั่งสกรีน · ไม่มีตารางราคาบนหน้า · ปุ่มไปเครื่องคำนวณสกรีน', () => {
  const sec = main.slice(main.indexOf('id="price"'), main.indexOf('id="size"'))
  assert.equal((sec.match(/<article class="scw__c"/g) || []).length, 2)
  assert.match(text(sec), /เสื้อทีมดี สกรีนลายของคุณ/); assert.match(text(sec), /ส่งเสื้อของคุณมา ทีมดีสกรีนให้/)
  assert.doesNotMatch(main, /id="screen-price-(own|extra|customer)"/)
  assert.doesNotMatch(text(sec), /145–245|18–80|บาท\/จุด\/ตัว/)
  assert.match(main, /href="[^"]*\/calculations\/\?kind=screen"/)
})

test('สกรีนบนเสื้อของคุณ: ขั้นต่ำ 20 · ปุ่มส่งรูปป้ายเสื้อ', () => {
  const own = text(main.slice(main.indexOf('id="own-shirt"')))
  /* 18 พ.ย. 2026 อาร์ต "ไม่ต้องบอกลูกค้าเยอะ ให้ลูกค้ามาสอบถามเรา": ไม่มีรายการผ้า · ปุ่ม LINE ส่งรูปป้ายเสื้อ */
  assert.match(own, /ขั้นต่ำ 20 ตัว/); assert.match(own, /ส่งรูปป้ายเสื้อ/)
  assert.match(main.slice(main.indexOf('id="own-shirt"')), /data-where="screen-own-shirt"/)
})

test('เสื้อ 2 รุ่น: C32 8 สี (ฟ้า สอบถามสต็อก) + ตารางไซซ์ S–5XL (+20 ตั้งแต่ 2XL) · Oversize +30', () => {
  /* 18 พ.ย. 2026 การ์ดเสื้อ 2 ทรง: จุดสี = ปุ่มกดลองสี (aria-pressed) */
  const sw = main.match(/<div class="scf__colors" role="group" aria-label="เลือกสี Premium Cotton C32 Comb">[\s\S]*?<\/div>\s*<\/div>/)[0]
  assert.equal((sw.match(/<button type="button" class="scf__dot"/g) || []).length, 8); assert.match(sw, /aria-label="สีฟ้า สอบถามสต็อก"/)
  const sizeHtml = main.slice(main.indexOf('id="size"'))
  const size = text(sizeHtml)
  /* 18 พ.ย. 2026 ตารางไซซ์โฉมใหม่ (pp2Sizes · เหมือนหน้าปัก): แถวรอบอก/ความยาว ช่องละไซซ์ · Premium = ตาราง sz-adult · Oversize = sz-kids */
  for (const [id, sh] of [['sz-adult', S.shirts[0]], ['sz-kids', S.shirts[1]]]) {
    const t = (sizeHtml.match(new RegExp(`<table class="pp2-sz__t[^"]*" id="${id}">[\\s\\S]*?</table>`)) || [''])[0]
    for (const [s, c, l] of sh.sizes) { assert.match(t, new RegExp(`data-c="${s}" data-in="${c}"`), `${id} ${s} อก`); assert.match(t, new RegExp(`data-c="${s}" data-in="${l}"`), `${id} ${s} ยาว`) }
  }
  assert.match(size, /2XL ขึ้นไป \+20 บาท\/ตัว/); assert.match(size, /\+30 บาท\/ตัว/)
})

/* 18 พ.ย. 2026 อาร์ต "เสื้อสีขาวโทนเดียว ทำกรอบ เอาโลโก้ไปใส่": เวทีเสื้อขาว + กรอบตามสัดส่วน + โลโก้ TEAMDEE จริง (SVG) · ปุ่ม 5 ขนาดเห็นข้อมูลครบ */
test('ขนาดลาย 5 ขนาด: ปุ่มบอก ซม. · ตำแหน่ง · ราคาจุดแรกเริ่ม · เวทีเสื้อขาว + โลโก้จริง', () => {
  const d = main.slice(main.indexOf('id="detail"'), main.indexOf('id="price"'))
  const btns = [...d.matchAll(/<button type="button" class="szx__pick"([\s\S]*?)<\/button>/g)].map((m) => m[1])
  assert.equal(btns.length, S.sizes.length)
  S.sizes.forEach((z, i) => assert.match(text(btns[i]), new RegExp(`${z.id}.*${z.cm} ซม\\..*${z.use.replace(/[·]/g, '.')}.*จุดแรกเริ่ม ${Math.min(...S.own.first[z.id])} บาท/ตัว`)))
  assert.equal((d.match(/aria-pressed="true"/g) || []).length, 1)
  assert.match(d, /data-szx-stage data-size="A4"/)
  assert.match(d, /shirt-white-1200\.webp/)
  assert.match(d, /<div class="szx__frame"[^>]*><svg class="szx__logo"/)
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
