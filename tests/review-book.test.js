/* /project/ รอบ 169 (9 พ.ย. อาร์ต "เสียงจากผู้สั่งและคนใส่จริง เรื่องราวจากทีมลูกค้า เอามารวมกันไม่เอาเลื่อนๆแล้ว · กว้างพิเศษ")
   → 169c อาร์ตแคปกระดานรีวิวหน้าแรก "ชอบแบบนี้อะ ทำให้มันดีกว่าอันนี้": ใช้กระดานรีวิวหน้าแรก (hm-rvb · review-board.js) ทั้งชุด แล้วต่อยอด
   ดีกว่าเดิม: กว้างพิเศษ · รีวิวครบ 13 ราย (หน้าแรกเฉพาะที่มีรูป) · 4 เรื่องเด่นอยู่ในกระดานเดียวกัน (หัวเรื่อง ข้อเท็จจริง ไอคอน 3D) · ไม่มีแถวเลื่อน
   แถวรายชื่อรีวิวใต้กระดาน ลองแล้ว อาร์ต "ไม่เอา" (9 พ.ย.) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../dist-wp/project/index.html', import.meta.url), 'utf8')
const at = html.indexOf('id="reviews"')
const sec = html.slice(at, html.indexOf('</section>', at))
const { items, stories } = JSON.parse(readFileSync(new URL('../src/data/reviews.json', import.meta.url), 'utf8'))

test('กระดานรีวิวหน้าแรกส่วนเดียว กว้างพิเศษ · ไม่มีแถวเลื่อน ไม่มีส่วนเรื่องราวแยก', () => {
  assert.ok(at > 0)
  assert.match(sec, /class="wrap hm-rvb pj-rvb" data-rvb/)
  assert.doesNotMatch(html, /data-rvm|class="sty"|class="rvb"/)
  assert.equal((html.match(/<section[^>]+id="stories"/g) || []).length, 0)
  assert.match(sec, /id="stories"/, 'ปุ่มทางลัด "เรื่องราวลูกค้า" ยังมีปลายทาง')
  assert.match(sec, /data-rv-json/)
})

test('รีวิวครบทุกราย ครั้งเดียว · เรื่องเด่น 4 เรื่องมีหัวเรื่อง ข้อเท็จจริง ไอคอน 3D', () => {
  const ids = [...sec.matchAll(/data-rvb-item data-use="[^"]*" data-id="([^"]+)"/g)].map((m) => m[1])
  assert.equal(ids.length, items.length)
  assert.equal(new Set(ids).size, items.length)
  assert.equal((sec.match(/class="pj-rvb__story"/g) || []).length, stories.length)
  assert.equal((sec.match(/class="hm-rvb__pop pj-rvb__pop" style="background-image:url\(\/img\/icons\/story-[a-z]+\.webp\)"/g) || []).length, 4)
  for (const s of stories) for (const f of s.facts) assert.ok(sec.replace(/<\/?t-[a-z]+>/g, '').includes(f), f)
})

test('ไม่มีแถวรายชื่อรีวิวใต้กระดาน (อาร์ต "ไม่เอา") · หน้านี้เรียกกระดานรีวิว', () => {
  assert.doesNotMatch(sec, /data-rvb-jump|pj-rvb__index/)
  assert.match(readFileSync(new URL('../src/js/works-page.js', import.meta.url), 'utf8'), /initReviewBoard\(\)/)
})

/* 169d อาร์ต "ทำขนาดความสูงซ้ายขวามาดีๆหน่อย ทำให้มันเท่าๆกัน" · ความสูงการ์ด = การ์ดที่สูงสุด (วัดด้วย JS · กฎ [hidden] ของ preflight เป็น !important ในเลเยอร์ ใช้ CSS ซ้อนช่องไม่ได้) */
test('กระดานรีวิว /project/ ตั้งความสูงการ์ดเท่าการ์ดที่สูงสุด (คอม ≥1024)', async () => {
  const { tallest } = await import('../src/js/board-fit.js')
  assert.equal(tallest([320, 880, 640]), 880)
  assert.equal(tallest([]), 0)
  const js = readFileSync(new URL('../src/js/works-page.js', import.meta.url), 'utf8')
  assert.match(js, /fitBoard\(/)
  const css = readFileSync(new URL('../src/styles/page-project.css', import.meta.url), 'utf8')
  assert.match(css, /min-height: var\(--rvb-item-h/)
})
