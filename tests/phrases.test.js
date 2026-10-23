import { test } from 'node:test'
import assert from 'node:assert/strict'
import { phrases } from '../src/js/phrases.js'

test('หัวข้อไทย: แต่ละวลี (คั่นด้วยเว้นวรรค) ห่อ inline-block ไม่ให้หักกลางวลี · ตัด " / " ไว้กับวลีหน้า', () => {
  assert.equal(phrases('จากจุดเริ่มต้น สู่ทีมดีที่คุณพบได้จริง'), '<span class="inline-block">จากจุดเริ่มต้น</span> <span class="inline-block">สู่ทีมดีที่คุณพบได้จริง</span>')
  assert.equal(phrases('ผลงานเสื้อโปโลปัก / เสื้อพิมพ์ลาย'), '<span class="inline-block">ผลงานเสื้อโปโลปัก /</span> <span class="inline-block">เสื้อพิมพ์ลาย</span>')
})

test('escape HTML · ค่าว่างได้สตริงว่าง', () => {
  assert.equal(phrases('a<b "c"'), '<span class="inline-block">a&lt;b</span> <span class="inline-block">&quot;c&quot;</span>')
  assert.equal(phrases(''), '')
  assert.equal(phrases(undefined), '')
})

test('ตัวเลขล้วนไม่อยู่บรรทัดเดียวโดดๆ: เลขนำติดคำถัดไป · เลขท้ายสุดติดคำก่อนหน้า (footer "264" / "11000" ตกบรรทัด)', () => {
  const words = (s) => [...phrases(s).matchAll(/<span class="inline-block">(.*?)<\/span>/g)].map((m) => m[1])
  assert.deepEqual(words('264 ถนนเลี่ยงเมืองนนท์ จังหวัดนนทบุรี 11000'), ['264 ถนนเลี่ยงเมืองนนท์', 'จังหวัดนนทบุรี 11000'])
  assert.deepEqual(words('สั่งเพิ่มภายใน 30 วัน'), ['สั่งเพิ่มภายใน', '30 วัน'])
  assert.deepEqual(words('10,000+ งาน'), ['10,000+ งาน'])
  assert.deepEqual(words('8:30 – 21:00 น.'), ['8:30 – 21:00 น.'])
})
