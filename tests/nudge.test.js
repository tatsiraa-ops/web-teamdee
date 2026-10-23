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

import { overlaps, dodgeFrom } from '../src/js/nudge.js'

test('ปุ่มลอย: กล่องสองกล่องทับกันไหม (ชิดขอบพอดีไม่นับว่าทับ)', () => {
  const f = { left: 100, top: 100, right: 200, bottom: 160 }
  assert.equal(overlaps(f, { left: 150, top: 150, right: 260, bottom: 190 }), true)
  assert.equal(overlaps(f, { left: 200, top: 100, right: 260, bottom: 160 }), false)
  assert.equal(overlaps(f, { left: 0, top: 0, right: 90, bottom: 90 }), false)
})

test('ปุ่มลอยหลบเมื่อใต้ปุ่มมีปุ่ม/ลิงก์ของเนื้อหา · ไม่นับตัวปุ่มลอยเอง', () => {
  const floats = { contains: (el) => el.inFloat }
  const link = { closest: (s) => (s.includes('a') ? link : null), inFloat: false }
  const own = { closest: () => own, inFloat: true }
  const text = { closest: () => null, inFloat: false }
  assert.equal(dodgeFrom([[own, text]], floats), false)
  assert.equal(dodgeFrom([[own, link]], floats), true)
  assert.equal(dodgeFrom([[text], [own]], floats), false)
})

import { blocksFloat, HIT } from '../src/js/nudge.js'

test('ปุ่มลอยหลบเฉพาะตัวที่กดได้จริง: summary / แถบเลื่อน (tabindex=0) นับ · main/section ที่ได้โฟกัสจากโค้ด (tabindex=-1) ไม่นับ', () => {
  const el = (tag, attrs = {}) => ({ matches: (sel) => sel.split(',').map((s) => s.trim()).some((s) => s === tag || (attrs.tabindex === '0' && s === '[tabindex="0"]')) })
  assert.equal(blocksFloat(el('summary')), true)
  assert.equal(blocksFloat(el('div', { tabindex: '0' })), true)
  assert.equal(blocksFloat(el('main', { tabindex: '-1' })), false)
  assert.equal(blocksFloat(null), false)
  assert.ok(HIT.includes('summary') && HIT.includes('[tabindex="0"]'))
})
