import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nudgesFor, nextNudge, isDismissed } from '../src/js/nudge.js'

const items = [
  { id: 'designs', href: '/designs/' },
  { id: 'warmup', href: '/warm-up/' },
  { id: 'size', href: '/size-chart/' },
]

test('ไม่แนะนำหน้าที่เปิดอยู่', () => {
  assert.deepEqual(nudgesFor(items, '/warm-up/').map((x) => x.id), ['designs', 'size'])
  assert.deepEqual(nudgesFor(items, '/').map((x) => x.id), ['designs', 'warmup', 'size'])
})

test('path ไม่มี / ท้าย หรือมี query ก็เทียบถูก', () => {
  assert.deepEqual(nudgesFor(items, '/warm-up').map((x) => x.id), ['designs', 'size'])
  assert.deepEqual(nudgesFor(items, '/warm-up/?a=1').map((x) => x.id), ['designs', 'size'])
})

test('สลับการ์ดวนรอบ', () => {
  assert.equal(nextNudge(3, 0), 1)
  assert.equal(nextNudge(3, 2), 0)
  assert.equal(nextNudge(1, 0), 0)
  assert.equal(nextNudge(0, 0), -1)
})

test('ปิดแล้วไม่ขึ้นอีกจนครบเวลาที่กำหนด', () => {
  const now = 1_000_000
  assert.equal(isDismissed(null, now), false)
  assert.equal(isDismissed(String(now - 1000), now, 60_000), true)
  assert.equal(isDismissed(String(now - 120_000), now, 60_000), false)
  assert.equal(isDismissed('xx', now), false)
})
