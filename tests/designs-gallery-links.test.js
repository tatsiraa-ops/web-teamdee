/* 17 พ.ย. 2026 รอบตรวจ SEO: หน้าแกลเลอรีแบบเสื้อ 10 หน้า (/corporate-shirts/ /sports-shirt/ …) มีลิงก์เข้าแค่ 1 ลิงก์จากหน้ากลุ่มลูกค้า
   อาร์ต "เพิ่มลิงก์จาก /designs/ ไปหน้าแกลเลอรี" → ส่วนท้ายหน้า /designs/ "ดูแบบเสื้อรวมตามกลุ่มลูกค้า" ลิงก์ครบทุกกลุ่มที่มีแบบ */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const routes = JSON.parse(readFileSync(new URL('../src/data/routes.json', import.meta.url), 'utf8'))
const built = new URL('../dist-wp/designs/index.html', import.meta.url)

test('/designs/ ลิงก์ไปหน้าแกลเลอรีทั้ง 10 กลุ่ม (ส่วน dg-gal ก่อนแบนเนอร์ LINE)', { skip: !existsSync(built) }, () => {
  const html = readFileSync(built, 'utf8')
  const at = html.indexOf('class="wrap dg-gal"')
  assert.ok(at > 0, 'มีส่วนลิงก์แกลเลอรี')
  const sec = html.slice(at, html.indexOf('</section>', at))
  const hrefs = [...sec.matchAll(/<a class="dg-gal__a" href="([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual([...hrefs].sort(), Object.values(routes.galleries).sort())
  assert.match(sec, /<h2 [^>]*>ดูแบบเสื้อรวมตามกลุ่มลูกค้า<\/h2>/)
  for (const m of sec.matchAll(/<img [^>]*alt="([^"]*)"/g)) assert.equal(m[1], '', 'รูปในลิงก์เป็นภาพประกอบ ชื่อกลุ่มอยู่ในข้อความลิงก์แล้ว')
  assert.ok(at < html.indexOf('data-where="designs-line"'), 'อยู่ก่อนแบนเนอร์ LINE')
})
