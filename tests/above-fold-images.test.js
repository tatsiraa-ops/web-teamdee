/* 16 พ.ย. 2026 audit ความเร็วมือถือ: รูปแถวแรกที่เห็นทันทีถูกตั้ง loading="lazy" (เบราว์เซอร์รอจนจัดหน้าเสร็จถึงโหลด → รูปหลักขึ้นช้า)
   /designs/ รูปหลักของหน้า (LCP) เป็น lazy · แกลเลอรีแบบเสื้อ 11 หน้า แถวแรก lazy · /calculations/ การ์ดชนิดเสื้อ lazy
   → 4 รูปแรกของกริดโหลดทันที รูปแรกบอกเบราว์เซอร์ว่าสำคัญ (fetchpriority high) · ที่เหลือยัง lazy */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const page = (s) => readFileSync(new URL(`../wp-theme/teamdee/build/pages/${s}.body.html`, import.meta.url), 'utf8')
const skip = !existsSync(new URL('../wp-theme/teamdee/build/pages/designs.body.html', import.meta.url))
const imgsIn = (h, start, end) => { const a = h.indexOf(start); return [...h.slice(a, end ? h.indexOf(end, a) : undefined).matchAll(/<img\b[^>]*>/g)].map((m) => m[0]) }

test('/designs/: 4 รูปแรกของกริดโหลดทันที · รูปแรก fetchpriority high · รูปถัดไป lazy', { skip }, () => {
  const imgs = imgsIn(page('designs'), 'class="dcard"').filter((t) => /\/img\/design\//.test(t))
  assert.ok(imgs.length > 8)
  imgs.slice(0, 4).forEach((t, i) => assert.match(t, /loading="eager"/, `รูปที่ ${i + 1}`))
  assert.match(imgs[0], /fetchpriority="high"/)
  assert.match(imgs[4], /loading="lazy"/)
})
test('แกลเลอรีแบบเสื้อ: 4 รูปแรกของกริดโหลดทันที', { skip }, () => {
  for (const s of ['running-shirt-designs', 'class-shirt-designs', 'corporate-shirts']) {
    const imgs = imgsIn(page(s), 'id="galGrid"')
    imgs.slice(0, 4).forEach((t, i) => assert.match(t, /loading="eager"/, `${s} รูปที่ ${i + 1}`))
    if (imgs.length > 5) assert.match(imgs[5], /loading="lazy"/, s)
  }
})
test('/calculations/: รูปการ์ดชนิดเสื้อแถวบนโหลดทันที', { skip }, () => {
  const imgs = [...page('calculations').matchAll(/<span class="kcard__img"><img\b[^>]*>/g)].map((m) => m[0])
  assert.ok(imgs.length >= 4)
  imgs.slice(0, 6).forEach((t, i) => assert.match(t, /loading="eager"/, `การ์ด ${i + 1}`))
})
