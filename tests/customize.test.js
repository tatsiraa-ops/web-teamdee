import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as cz from '../src/js/customize.js'

test('ออกแบบให้เป็นทีมคุณ: เส้นโยงจากขอบการ์ดไปจุดบนเสื้อ = เส้นตรงแนวนอนแล้วหักเข้าหาจุด', () => {
  // การ์ดซ้าย: ออกจากขอบขวาของการ์ด
  assert.equal(cz.dzPath({ x: 300, y: 100 }, { x: 500, y: 200 }), 'M300 100H400L500 200')
  // การ์ดขวา: ออกจากขอบซ้ายของการ์ด
  assert.equal(cz.dzPath({ x: 900, y: 150 }, { x: 700, y: 80 }), 'M900 150H800L700 80')
})

test('เส้นออกจากการ์ดระดับเดียวกับจุด → เส้นตรงแนวนอน ไม่เฉียงทับเสื้อ · จุดอยู่นอกช่วงการ์ด = ชิดขอบการ์ดแล้วหักลง/ขึ้น', () => {
  assert.equal(cz.dzAnchorY(100, 400, 250), 250, 'จุดอยู่ในช่วงความสูงการ์ด = ระดับเดียวกัน')
  assert.equal(cz.dzAnchorY(100, 400, 60), 130, 'จุดสูงกว่าการ์ด = ชิดขอบบน (เว้น 30)')
  assert.equal(cz.dzAnchorY(100, 400, 520), 370, 'จุดต่ำกว่าการ์ด = ชิดขอบล่าง (เว้น 30)')
  assert.equal(cz.dzPath({ x: 300, y: 250 }, { x: 500, y: 250 }), 'M300 250H500', 'ระดับเดียวกัน = เส้นตรงเส้นเดียว')
})

test('ไม่มีสคริปต์เสื้อแยกชิ้นค้าง', () => {
  assert.equal(cz.exState, undefined)
  assert.equal(typeof cz.initCustomize, 'function')
})
