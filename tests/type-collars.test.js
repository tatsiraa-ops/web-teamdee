/* แผงเลือกเสื้อ /sublimation/ · 196c (อาร์ต "กดแต่ละทรงเสื้อแล้ว บอกว่าทรงเสื้ออันไหนมีคออะไรบ้าง")
   data-cols ของปุ่มทรง: "all" = ทุกคอ · "crew v" = เฉพาะคอเหล่านี้ · "" = ยังไม่ระบุ (ไม่จางคอไหน ขึ้นข้อความทักถาม) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { offKeys } from '../src/js/type-collars.js'

const all = ['crew', 'crew2', 'v', 'polo', 'pk']
test('offKeys: ทุกคอ = ไม่จางอะไร', () => assert.deepEqual(offKeys('all', all), []))
test('offKeys: เฉพาะคอที่ระบุ = จางที่เหลือ รวมปก 2 แบบ', () => assert.deepEqual(offKeys('crew v', all), ['crew2', 'polo', 'pk']))
test('offKeys: ยังไม่ระบุ = ไม่จางอะไร (ไม่เดาว่าไม่มี)', () => assert.deepEqual(offKeys('', all), []))
