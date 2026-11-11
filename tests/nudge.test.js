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

/* อาร์ต 26 ต.ค. "แถบซ้ายล่างหาย เอากลับมาให้ดีกว่าเดิม · CTA ขวาเช่นกัน" */
import { openNow, liftFor, fillNudge } from '../src/js/nudge.js'

test('ป้ายสถานะปุ่มขวา: เปิดทำการทุกวัน 08:30–21:00 ตามเวลาไทย', () => {
  const at = (hhmm) => new Date(`2026-10-26T${hhmm}:00+07:00`)
  assert.equal(openNow(at('08:29'), 'Mo-Su 08:30-21:00'), false)
  assert.equal(openNow(at('08:30'), 'Mo-Su 08:30-21:00'), true)
  assert.equal(openNow(at('20:59'), 'Mo-Su 08:30-21:00'), true)
  assert.equal(openNow(at('21:00'), 'Mo-Su 08:30-21:00'), false)
  /* อ่านรูปแบบไม่ออก = ไม่อ้างว่าเปิดอยู่ */
  assert.equal(openNow(at('12:00'), 'ทุกวัน'), false)
})

test('การ์ดซ้ายกับปุ่มขวายกขึ้นเหนือป้ายคุกกี้ (เดิมซ่อนไปทั้งที่ยังไม่เลือกคุกกี้)', () => {
  /* ป้ายไม่ขึ้น = ไม่ยก · ขึ้น = ระยะจากขอบล่างจอถึงขอบบนของป้าย */
  assert.equal(liftFor(null, 900), 0)
  assert.equal(liftFor({ top: 760 }, 900), 140)
  assert.equal(liftFor({ top: 950 }, 900), 0)
})

test('ข้อความการ์ดใช้ตัวเลขจริงจากเว็บ ({designs} = จำนวนแบบที่มีรหัส)', () => {
  assert.equal(fillNudge('แบบเสื้อพร้อมรหัส {designs} แบบ', { designs: 31 }), 'แบบเสื้อพร้อมรหัส 31 แบบ')
  assert.equal(fillNudge('ไม่มีตัวแปร', { designs: 31 }), 'ไม่มีตัวแปร')
})

test('ยกเฉพาะฝั่งที่ป้ายคุกกี้ทับจริงในแนวนอน', async () => {
  const { overlapsX } = await import('../src/js/nudge.js')
  const bar = { left: 420, right: 1020 }
  assert.equal(overlapsX(bar, { left: 24, right: 408 }), false)
  assert.equal(overlapsX(bar, { left: 1116, right: 1416 }), false)
  assert.equal(overlapsX({ left: 0, right: 375 }, { left: 12, right: 363 }), true)
})

/* 170y อาร์ต (แคปการ์ดเด้งซ้ายล่าง) → "แต่งการ์ดใหม่ ทั้งเว็บ": รูปเต็มความสูงฝั่งซ้าย (ไม่มีกรอบในกรอบ) · การ์ดไอคอนใช้ไอคอน 3D ชุดเว็บ
   ปุ่มส้มก้อนใหญ่ → ลิงก์ตัวหนังสือมีลูกศร · ตัดตัวนับ 1/6 · ตรวจจาก dist-wp หน้า about (มีการ์ดแนะนำ) */
test('การ์ดแนะนำโฉมใหม่: ทุกใบมีรูปหรือไอคอน 3D · ไม่มีไอคอนเส้น · ไม่มีตัวนับ', async () => {
  const { readFileSync } = await import('node:fs')
  const html = readFileSync(new URL('../dist-wp/about-us/index.html', import.meta.url), 'utf8')
  const box = html.slice(html.indexOf('data-nudge'), html.indexOf('data-float-cta'))
  const items = [...box.matchAll(/<a class="nudge__item"[\s\S]*?<\/a>/g)].map((m) => m[0])
  assert.ok(items.length >= 5)
  for (const it of items) {
    assert.match(it, /<img [^>]*data-src="[^"]*\/img\/(icons|design|case|mockup)\/[^"]+\.webp"/)
    assert.equal((it.match(/<svg/g) || []).length, 1, 'svg ได้แค่ลูกศร')
    assert.match(it, /class="nudge__go"/)
  }
  assert.doesNotMatch(box, /nudge__count|nudge__ico"/)
})
