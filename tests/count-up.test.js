/* ตัวเลขสถิติหน้าแรกวิ่งนับขึ้น (อาร์ต 23 ต.ค.: "animated เต็มที่ เอาให้ว้าวๆ") */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseStat, statAt, easeOut } from '../src/js/count-up.js'

test('แยกตัวเลข เครื่องหมาย + และหน่วยออกจากข้อความสถิติ', () => {
  assert.deepEqual(parseStat('8 ปี'), { n: 8, plus: '', unit: 'ปี' })
  assert.deepEqual(parseStat('2,800+ องค์กร'), { n: 2800, plus: '+', unit: 'องค์กร' })
  assert.deepEqual(parseStat('10,000+ งาน'), { n: 10000, plus: '+', unit: 'งาน' })
  assert.equal(parseStat('[รอยืนยัน]'), null)
})

test('ค่าระหว่างนับ: เริ่ม 0 จบที่ค่าจริง มีคอมม่า ไม่เกินค่าจริง', () => {
  const s = parseStat('2,800+ องค์กร')
  assert.equal(statAt(s, 0), '0')
  assert.equal(statAt(s, 1), '2,800')
  assert.equal(statAt(s, 1.2), '2,800')
  assert.ok(Number(statAt(s, 0.5).replace(/,/g, '')) <= 2800)
})

test('easeOut: เร็วตอนต้น ช้าตอนท้าย · 0→0 · 1→1', () => {
  assert.equal(easeOut(0), 0)
  assert.equal(easeOut(1), 1)
  assert.ok(easeOut(0.5) > 0.8)
})
