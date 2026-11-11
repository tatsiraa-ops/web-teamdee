/* ปุ่ม LINE ส่วนกลาง (แถบล่างมือถือ · เมนู · hero · ปุ่มลอย · ท้ายเว็บ) ส่งข้อความตามหน้า (ตรวจมือถือ 30 ต.ค. ข้อ 2)
   เดิมเป็นลิงก์เปล่า line.me/R/ti/p/@teamdee = ฝ่ายขายไม่รู้ว่าลูกค้ามาจากหน้าไหน สนใจอะไร */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pageLineText, REORDER_TEXT, TRACK_TEXT } from '../src/js/use-cta.js'

const names = {
  products: { polo: 'เสื้อโปโลปัก', print: 'เสื้อพิมพ์ลาย' },
  uses: { edu: 'เสื้อโรงเรียน / เสื้อกีฬาสี', corp: 'เสื้อบริษัท' },
}

test('หน้าสินค้า: ขอราคาสินค้านั้น · บรรทัดให้กรอกงาน จำนวน วันที่ · บอกหน้าที่มา', () => {
  const t = pageLineText({ kind: 'products', id: 'polo' }, names, '/embroidery/')
  assert.match(t, /^สวัสดี ทีมดี ขอราคาเสื้อโปโลปัก\n/)
  assert.match(t, /\nใช้กับงาน: \nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: \n\(จากหน้า \/embroidery\/\)$/)
})

test('หน้ากลุ่มลูกค้าและแกลเลอรี: ใช้ชื่อสั้น (ก่อน " / ")', () => {
  assert.match(pageLineText({ kind: 'uses', id: 'edu' }, names, '/education/'), /^สวัสดี ทีมดี สนใจทำเสื้อโรงเรียน\n/)
  assert.match(pageLineText({ kind: 'galleries', id: 'corp' }, names, '/corporate-shirts/'), /^สวัสดี ทีมดี ดูแบบเสื้อบริษัทแล้วสนใจ\n/)
})

test('หน้าแรกไม่ใส่หน้าที่มา · คู่มือ/บทความเป็นคำถาม · หน้าอื่นเป็นข้อความทั่วไป · ไม่มี "..." ให้ลบเอง', () => {
  const home = pageLineText({ kind: 'home', id: null }, names, '/')
  assert.match(home, /^สวัสดี ทีมดี สนใจทำเสื้อทีม\nประเภทเสื้อ: /)
  assert.doesNotMatch(home, /จากหน้า/)
  assert.match(pageLineText({ kind: 'guides', id: 'size' }, names, '/size-chart/'), /^สวัสดี ทีมดี อ่านคู่มือบนเว็บแล้วมีคำถาม\nคำถาม: /)
  assert.match(pageLineText({ kind: 'articles', id: 'x' }, names, '/blog/x/'), /มีคำถาม/)
  assert.match(pageLineText({ kind: 'contact', id: null }, names, '/contact-us/'), /^สวัสดี ทีมดี สนใจทำเสื้อทีม/)
  for (const k of ['home', 'products', 'uses', 'guides', 'faq']) assert.doesNotMatch(pageLineText({ kind: k, id: 'polo' }, names, '/x/'), /\.\.\./)
})

test('ลูกค้าเดิม: สั่งซ้ำ / ติดตามงาน มีข้อความของตัวเอง', () => {
  assert.match(REORDER_TEXT, /สั่งซ้ำ/)
  assert.match(REORDER_TEXT, /เลขออเดอร์เดิม/)
  assert.match(TRACK_TEXT, /ติดตามงาน/)
})

test('ปุ่ม LINE ส่วนกลางใช้ข้อความตามหน้า ไม่ใช่ลิงก์เปล่า', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
  assert.match(read('src/partials/footer.hbs'), /class="mb__line" href="\{\{@root\.pageLine\}\}"/)
  assert.match(read('src/partials/floats.hbs'), /fcta__btn--line" href="\{\{@root\.pageLine\}\}"/)
  assert.match(read('src/partials/siteHeader.hbs'), /href="\{\{@root\.pageLine\}\}" data-track="line" data-where="mobile-menu"/)
  assert.match(read('src/partials/heroTeam.hbs'), /href="\{\{@root\.pageLine\}\}" data-track="line" data-where="hero"/)
  assert.match(read('vite.config.js'), /base\.pageLine = lineMessageUrl\(pageLineText\(page, /)
})

test('build: หน้าสินค้าได้ข้อความขอราคาสินค้านั้นจริง (products.json / uses.json เป็น array)', async () => {
  const { existsSync } = await import('node:fs')
  const f = new URL('../dist/sublimation/index.html', import.meta.url)
  if (!existsSync(f)) return
  const h = readFileSync(f, 'utf8')
  const href = h.match(/class="mb__line" href="([^"]+)"/)[1].replace(/&amp;/g, '&')
  assert.match(decodeURIComponent(href.split('?')[1]), /^สวัสดี ทีมดี ขอราคาเสื้อพิมพ์ลาย\n/)
})

test('หน้าแรก: ไม่มีปุ่ม LINE เปล่าเหลือ (ขั้นตอน · ชำระเงิน · เอกสารบริษัท ส่งข้อความตามเรื่อง)', () => {
  for (const [f, k] of [['src/partials/homeReference-process.hbs', 'pageLine'], ['src/partials/homeOriginStory.hbs', 'homeDocsLine'] /* 9 พ.ย. การ์ดบริษัทย้ายมา partial ร่วมกับ /about-us/ */]) {
    assert.match(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), new RegExp(`href="\\{\\{@root\\.${k}\\}\\}" data-track="line"`), f)
  }
})
