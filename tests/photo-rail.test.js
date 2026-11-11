/* /project/ ภาพลูกค้า รอบ 167 (อาร์ต "เอารูปมาให้เต็มๆเลย อย่างละ 30-40 รูป กดดูเพิ่มค่อยเปิดรูปเพิ่มขึ้นอีก แล้วเลื่อนซ้ายขวาไปดูอีก")
   HTML มีชุดแรก 5 รูป/กลุ่ม (งบ DOM มือถือ) · ใกล้เห็นแถว = เติมจาก template ให้ครบ AUTO รูป · กด "ดูอีก" = เพิ่มทีละ STEP */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AUTO, STEP, takeCount } from '../src/js/photo-rail.js'

test('takeCount: เติมให้ถึงเป้า ไม่เกินที่เหลือ · ถึงเป้าแล้ว/ไม่มีเหลือ = 0', () => {
  assert.ok(AUTO >= 30 && AUTO <= 40, 'แถวละ 30–40 รูป')
  assert.equal(takeCount(5, 63, AUTO), AUTO - 5)
  assert.equal(takeCount(5, 8, AUTO), 8, 'กลุ่มเล็ก เติมหมด')
  assert.equal(takeCount(AUTO, 32, AUTO), 0, 'ถึงเป้าแล้ว ไม่เติมเอง')
  assert.equal(takeCount(AUTO, 32, AUTO + STEP), Math.min(32, STEP), 'กดดูเพิ่ม = ทีละ STEP')
  assert.equal(takeCount(10, 0, AUTO), 0)
})

test('/project/ แถวภาพ: รางเลื่อนข้าง + ปุ่มซ้ายขวา · ปุ่มดูเพิ่มอยู่ท้ายราง · JS เติมอัตโนมัติเมื่อใกล้เห็น', () => {
  const h = readFileSync('dist-wp/project/index.html', 'utf8')
  const rails = [...h.matchAll(/<div class="pj-rail" data-rail>[\s\S]*?<\/ul>/g)].map((m) => m[0])
  assert.ok(rails.length >= 5, `ราง ${rails.length}`)
  for (const r of rails) {
    assert.match(r, /<button type="button" class="pj-rail__btn pj-rail__btn--prev" data-rail-prev aria-label="[^"]+"/)
    assert.match(r, /<button type="button" class="pj-rail__btn pj-rail__btn--next" data-rail-next aria-label="[^"]+"/)
  }
  const js = readFileSync('src/js/works-page.js', 'utf8')
  assert.match(js, /IntersectionObserver/)
  assert.match(js, /takeCount\(/)
})

/* 9 พ.ย. อาร์ต "เอารูปรีวิวเต็มๆไปเลย ไม่ต้องมีที่โล่ง ซ้ายขวา" → "เอาข้อความไว้ซ้าย" → เลือกแบบ ค "กองภาพบนโต๊ะ แบบภาพส่งงาน"
   แบนเนอร์ /project/: ข้อความซ้าย · กองภาพลูกค้าจริง 5 ใบ ไม่ซ้ำ ทุกใบมีป้ายกลุ่มลูกค้า + alt · กดเปิดภาพใหญ่ (lightbox #pjPile) */
test('/project/ แบนเนอร์: ข้อความซ้าย กองภาพ 5 ใบ มีป้ายกลุ่ม', () => {
  const html = readFileSync(new URL('../dist-wp/project/index.html', import.meta.url), 'utf8')
  const at = html.indexOf('id="pjPile"')
  assert.ok(at > 0, 'ไม่มีกองภาพ')
  const ul = html.slice(at, html.indexOf('</ul>', at))
  const src = [...ul.matchAll(/<img src="([^"]+)" alt="([^"]+)"/g)]
  assert.equal(src.length, 5)
  assert.equal(new Set(src.map((m) => m[1])).size, 5)
  assert.equal((ul.match(/class="pj-print__tag"/g) || []).length, 5)
  assert.ok(html.indexOf('pj-stage__txt') < at, 'ข้อความต้องมาก่อนภาพ (ซ้าย)')
  const js = readFileSync(new URL('../src/js/works-page.js', import.meta.url), 'utf8')
  assert.match(js, /initLightbox\('#pjPile'/)
})
