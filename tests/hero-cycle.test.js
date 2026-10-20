import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCycle, makeClock } from '../src/js/hero-cycle.js'

test('สลับ A กับ B ทีละคู่ และ B บอกว่าคู่ถัดไปคือคู่ไหน (วนกลับคู่แรก)', () => {
  assert.deepEqual(buildCycle(3), [
    { scene: 'A', pair: 0 }, { scene: 'B', next: 1 },
    { scene: 'A', pair: 1 }, { scene: 'B', next: 2 },
    { scene: 'A', pair: 2 }, { scene: 'B', next: 0 },
  ])
})

test('มีคู่เดียวก็ยังวน A → B → A ได้', () => {
  assert.deepEqual(buildCycle(1), [{ scene: 'A', pair: 0 }, { scene: 'B', next: 0 }])
})

test('ไม่มีคู่เลย เหลือแค่ผนัง B ไม่พัง', () => {
  assert.deepEqual(buildCycle(0), [{ scene: 'B', next: null }])
})

test('นาฬิกานับเฉพาะเวลาที่ไม่ได้หยุด', () => {
  let now = 0
  const clock = makeClock(() => now)
  clock.start()
  now = 1000
  clock.pause()
  now = 5000 // หยุดอยู่ 4 วิ ไม่นับ
  clock.resume()
  now = 5500
  assert.equal(clock.elapsed(), 1500)
  clock.reset()
  now = 6000
  assert.equal(clock.elapsed(), 500)
})

test('หยุดซ้ำหรือเล่นซ้ำไม่ทำให้เวลาเพี้ยน', () => {
  let now = 0
  const clock = makeClock(() => now)
  clock.start()
  now = 200
  clock.pause()
  clock.pause()
  now = 900
  clock.resume()
  clock.resume()
  now = 1000
  assert.equal(clock.elapsed(), 300)
})

import { flightFrames } from '../src/js/hero-cycle.js'

test('ท่าบินใช้ translate/scale แยก ไม่รวมใน transform (rotate จะไปเบี้ยวระยะทาง ทำให้ลงพลาดเป้า)', () => {
  const tile = { left: 700, top: 300, width: 100, height: 66 }
  const card = { left: 500, top: 100, width: 400, height: 264 }
  const [from, to] = flightFrames(tile, card, '-7deg', '-3deg')
  assert.equal(from.transform, undefined)
  assert.equal(to.transform, undefined)
  assert.equal(from.scale, '0.25')
  assert.equal(from.rotate, '-7deg')
  assert.deepEqual(to, { translate: '0px 0px', scale: '1', rotate: '-3deg', opacity: 1 })
})

test('ท่าบินคำนวณจากจุดกึ่งกลาง', () => {
  const tile = { left: 700, top: 300, width: 100, height: 66 }
  const card = { left: 500, top: 100, width: 400, height: 264 }
  const [from] = flightFrames(tile, card, '-7deg', '-3deg')
  // กลาง tile (750, 333) − กลางการ์ด (700, 232) = (50, 101)
  assert.equal(from.translate, '50px 101px')
})
