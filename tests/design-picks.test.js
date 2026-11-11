/* หน้าแบบเสื้อ แบบ c (26 ต.ค.): เลือกเก็บหลายแบบ แล้วส่งรหัสทั้งหมดทาง LINE ครั้งเดียว */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { picksMessage, togglePick, readPicks, MAX_PICKS, PICK_KEY } from '../src/js/design-picks.js'

test('ข้อความ LINE: รหัสทุกแบบที่เลือก + ช่องจำนวนกับวันใช้ให้เติม', () => {
  assert.equal(picksMessage(['TD-0001']), 'สนใจแบบเสื้อรหัส TD-0001\nจำนวนประมาณ:  ตัว\nอยากได้รับวันที่: ')
  assert.equal(picksMessage(['TD-0001', 'TD-0012']).split('\n')[0], 'สนใจแบบเสื้อ 2 แบบ รหัส TD-0001, TD-0012')
})

test('กดเลือก/เลิกเลือก · ไม่ซ้ำ · เลือกได้สูงสุด MAX_PICKS แบบ (เกินแล้วไม่เพิ่ม)', () => {
  assert.deepEqual(togglePick([], 'TD-0001'), ['TD-0001'])
  assert.deepEqual(togglePick(['TD-0001'], 'TD-0001'), [])
  const full = Array.from({ length: MAX_PICKS }, (_, i) => `TD-${String(i).padStart(4, '0')}`)
  assert.deepEqual(togglePick(full, 'TD-9999'), full)
})

test('อ่านที่จำไว้: เฉพาะรหัสที่ยังมีในหน้า · ค่าเสีย/อ่านไม่ได้ = ว่าง', () => {
  const store = (v) => (k) => (k === PICK_KEY ? v : null)
  assert.deepEqual(readPicks(store('["TD-0001","TD-0404","TD-0001"]'), ['TD-0001', 'TD-0002']), ['TD-0001'])
  assert.deepEqual(readPicks(store('เสีย'), ['TD-0001']), [])
  assert.deepEqual(readPicks(() => { throw new Error('private') }, ['TD-0001']), [])
})
