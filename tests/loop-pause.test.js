/* 17 พ.ย. 2026 audit (WCAG 2.2.2 ระดับ A): หน้า /embroidery/ คลิปเครื่องปัก 4 คลิป (pp2Proof loops) เล่นวนเองเมื่อเห็นในจอ ไม่มีทางหยุด
   → ปุ่ม "หยุดคลิป" หน้าตาเดียวกับปุ่มหยุดแถวรีวิว (.rvm__pause) · กดแล้วหยุดทุกคลิปและไม่เล่นเองอีกจนกดเล่นต่อ */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const hbs = readFileSync(new URL('../src/partials/pp2Proof.hbs', import.meta.url), 'utf8')
const js = readFileSync(new URL('../src/js/product-page.js', import.meta.url), 'utf8')

test('คลิปวนหน้าปักมีปุ่มหยุด (ปุ่มเดียวกับแถวรีวิว)', () => {
  const loops = hbs.slice(hbs.indexOf('pp2-pf__loops'), hbs.indexOf('<!-- /loops -->'))
  assert.match(loops, /<button type="button" class="rvm__pause" data-loops-pause data-on="false" aria-pressed="false">/)
})

test('กดหยุดแล้ว คลิปหยุดทั้งหมด และเลื่อนกลับมาเห็นก็ไม่เล่นเอง', () => {
  const blk = js.slice(js.indexOf("video[data-loop]"), js.indexOf("video[data-loop]") + 2000)
  assert.match(blk, /data-loops-pause/)
  assert.match(blk, /if \(e\.isIntersecting && !paused\)/)
  assert.match(blk, /for \(const v of loops\) v\.pause\(\)/)
})
