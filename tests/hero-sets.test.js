import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextSet, canAutoplay, tabKey, holdsOnPointer } from '../src/js/hero-sets.js'
import { pastHero } from '../src/js/nudge.js'

test('hero สลับชุดวนรอบ 01 → 02 → 01', () => {
  assert.equal(nextSet(2, 0), 1)
  assert.equal(nextSet(2, 1), 0)
  assert.equal(nextSet(1, 0), 0)
})

test('เล่นเองได้เฉพาะเมื่อมีมากกว่า 1 ชุด และไม่มีอะไรสั่งหยุด', () => {
  const ok = { count: 2, reduce: false, paused: false, held: false, offscreen: false, docHidden: false }
  assert.equal(canAutoplay(ok), true)
  assert.equal(canAutoplay({ ...ok, count: 1 }), false)
  assert.equal(canAutoplay({ ...ok, reduce: true }), false, 'ตั้งค่าลดการเคลื่อนไหว')
  assert.equal(canAutoplay({ ...ok, paused: true }), false, 'กดเลือกชุดเอง (ไม่มีปุ่มหยุด)')
  assert.equal(canAutoplay({ ...ok, held: true }), false, 'เมาส์ชี้ หรือโฟกัสอยู่ใน hero')
  assert.equal(canAutoplay({ ...ok, docHidden: true }), false, 'แท็บไม่ได้เปิดอยู่')
})

test('ปุ่มเลือกชุด: ลูกศรซ้ายขวาวนรอบ · Home/End ไปหัวท้าย · ปุ่มอื่นไม่ทำอะไร', () => {
  assert.equal(tabKey('ArrowRight', 0, 2), 1)
  assert.equal(tabKey('ArrowRight', 1, 2), 0)
  assert.equal(tabKey('ArrowLeft', 0, 2), 1)
  assert.equal(tabKey('Home', 1, 2), 0)
  assert.equal(tabKey('End', 0, 2), 1)
  assert.equal(tabKey('Enter', 0, 2), null)
})

test('การ์ดชวนมุมจอขึ้นเมื่อเลื่อนพ้น hero แล้วเท่านั้น ไม่ขึ้นทับปุ่มใน hero', () => {
  assert.equal(pastHero({ bottom: 120 }), false)
  assert.equal(pastHero({ bottom: 0 }), true)
  assert.equal(pastHero({ bottom: -40 }), true)
})

test('hero พ้นจอ กับแท็บซ่อน แยกกัน · กลับมาที่แท็บแต่ hero ยังพ้นจอ ต้องไม่เล่น (agent ตรวจโค้ด 23 ต.ค.)', () => {
  const ok = { count: 2, reduce: false, paused: false, held: false, offscreen: false, docHidden: false }
  assert.equal(canAutoplay(ok), true)
  assert.equal(canAutoplay({ ...ok, offscreen: true }), false)
  assert.equal(canAutoplay({ ...ok, docHidden: true }), false)
})

/* 3 พ.ย. อาร์ต: "เอาเมาส์อยู่ในรูปก็ไม่มีผลในการเวลาเปลี่ยน" → ชี้ค้างไม่หยุดสลับแล้ว ทุกชนิดอุปกรณ์ */
test('ชี้ค้างบนแบนเนอร์ไม่หยุดการสลับ (เมาส์ นิ้ว ปากกา)', () => {
  assert.equal(holdsOnPointer('mouse'), false)
  assert.equal(holdsOnPointer('touch'), false)
  assert.equal(holdsOnPointer('pen'), false)
})

test('ปุ่มก่อนหน้าวนรอบ 01 ← 02 ← 01', async () => {
  const { prevSet } = await import('../src/js/hero-sets.js')
  assert.equal(prevSet(2, 0), 1)
  assert.equal(prevSet(2, 1), 0)
  assert.equal(prevSet(3, 0), 2)
  assert.equal(prevSet(1, 0), 0)
})

test('ลาก/ปัดแนวนอนเกิน 40px = เปลี่ยนสไลด์ · ลากแนวตั้ง (เลื่อนหน้า) หรือสั้นไป = ไม่เปลี่ยน', async () => {
  const { swipeDir } = await import('../src/js/hero-sets.js')
  assert.equal(swipeDir(-80, 10), 1, 'ลากซ้าย = ถัดไป')
  assert.equal(swipeDir(90, -12), -1, 'ลากขวา = ก่อนหน้า')
  assert.equal(swipeDir(-30, 0), 0, 'สั้นไป')
  assert.equal(swipeDir(-60, 120), 0, 'แนวตั้งมากกว่า = เลื่อนหน้า')
})

test('กดเปลี่ยนเองแล้วนับเวลาใหม่และสลับต่อ ไม่หยุดถาวร · ไม่มีการหยุดเพราะแตะ/คลิกในแบนเนอร์', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('../src/js/hero-sets.js', import.meta.url), 'utf8')
  assert.doesNotMatch(src, /state\.paused = true/)
  assert.doesNotMatch(src, /root\.addEventListener\('pointerdown', \(\) => \{ state\.paused/)
  assert.match(src, /data-set-prev/)
  assert.match(src, /data-set-next/)
})

/* 30 ต.ค. H-perf: มือถือไม่เล่นเอง จึงไม่โหลดชุด 2 ล่วงหน้า (รอแตะแถบเลือกชุด) · จอคอมเล่นเองจึงโหลดรอไว้ */
test('โหลดรูปชุดถัดไปล่วงหน้าเฉพาะจอที่เล่นเอง (ไม่ใช่มือถือ)', async () => {
  const { warmsAhead } = await import('../src/js/hero-sets.js')
  assert.equal(warmsAhead({ mobile: true }), false)
  assert.equal(warmsAhead({ mobile: false }), true)
  assert.equal(warmsAhead({ mobile: false, reduce: true }), false, 'ลดการเคลื่อนไหว = ไม่เล่นเอง ไม่ต้องโหลดรอ')
})

test('แถบเลือกชุดโหลดรูปตอนแตะ/ชี้ ก่อนกดจริง (มือถือไม่มี pointerenter)', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('../src/js/hero-sets.js', import.meta.url), 'utf8')
  for (const ev of ['pointerdown', 'touchstart', 'pointerenter', 'focus']) assert.match(src, new RegExp(`t\\.addEventListener\\('${ev}', \\(\\) => warm\\(k\\)`), ev)
})
