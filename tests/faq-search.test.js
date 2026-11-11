import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normFaq, faqHit, faqAskText } from '../src/js/faq-search.js'

test('normFaq: ตัวเล็ก ตัดช่องว่างและเครื่องหมาย · สระอำแบบแยกตัว = อำ', () => {
  assert.equal(normFaq('  สั่ง ขั้นต่ำ กี่ตัว? '), 'สั่งขั้นต่ำกี่ตัว')
  assert.equal(normFaq('ขั้นตํา'), 'ขั้นตำ')
  assert.equal(normFaq('VAT 7%'), 'vat7')
})

test('faqHit: คำว่าง = เจอทุกข้อ', () => {
  assert.equal(faqHit('', 'อะไรก็ได้'), true)
  assert.equal(faqHit('   ', 'อะไรก็ได้'), true)
})

test('faqHit: พิมพ์ติดกันหรือเว้นวรรคก็เจอ', () => {
  const t = 'ออกใบกำกับภาษีเต็มรูปแบบได้ไหม'
  assert.equal(faqHit('ใบกำกับภาษี', t), true)
  assert.equal(faqHit('ใบกำกับ ภาษี', t), true)
  assert.equal(faqHit('ใบเสร็จ', t), false)
})

test('faqHit: ทุกคำต้องเจอ (ไม่ใช่คำใดคำหนึ่ง)', () => {
  const t = 'สั่งคละไซซ์ในงานเดียวได้ไหม'
  assert.equal(faqHit('คละ ไซซ์', t), true)
  assert.equal(faqHit('คละ ภาษี', t), false)
})

test('faqHit: คำที่คนพิมพ์ต่างกันบ่อย (ไซส์ ไซด์ size · vat · logo)', () => {
  assert.equal(faqHit('ไซส์', 'มีไซซ์ใหญ่กว่า 3XL ไหม'), true)
  assert.equal(faqHit('ไซด์ใหญ่', 'มีไซซ์ใหญ่กว่า 3XL ไหม'), true)
  assert.equal(faqHit('size', 'มีไซซ์ใหญ่กว่า 3XL ไหม'), true)
  assert.equal(faqHit('vat', 'ออกใบกำกับภาษีเต็มรูปแบบได้ไหม'), true)
  assert.equal(faqHit('logo', 'ยังไม่มีโลโก้เป็นไฟล์ ทำยังไง'), true)
  assert.equal(faqHit('3xl', 'มีไซซ์ใหญ่กว่า 3XL ไหม'), true)
})

test('faqAskText: ข้อความพิมพ์รอใน LINE แนบคำถามที่ถาม', () => {
  assert.equal(faqAskText('งานด่วนรับไหม'), 'สวัสดี ทีมดี สอบถามเรื่อง: งานด่วนรับไหม\n')
  assert.equal(faqAskText('  '), 'สวัสดี ทีมดี มีคำถามเรื่องสั่งทำเสื้อ\n')
})

test('faqHit: คำที่คนพิมพ์เรื่องค่าส่ง/ต่างจังหวัด เจอข้อจัดส่ง (ลองใช้จริง 30 ต.ค.: เดิมได้ 0 ผล)', () => {
  const ship = 'มีค่าจัดส่งไหม จัดส่งทั่วประเทศ'
  for (const q of ['ค่าส่ง', 'ต่างจังหวัด', 'ขนส่ง', 'ส่งไปรษณีย์', 'ส่งต่างจังหวัด']) assert.equal(faqHit(q, ship), true, q)
  /* "ใบส่งของ" (เอกสารจัดซื้อ) ต้องยังค้นเจอด้วยคำเดิม */
  assert.equal(faqHit('ใบส่งของ', 'เอกสาร ใบส่งของ ใบกำกับภาษี'), true)
  assert.equal(faqHit('บิล', 'ออกใบเสร็จ / ใบกำกับภาษี'), true)
})

test('faqHit: DTF = DFT (30 ต.ค. อาร์ต: ใช้ทั้งสองชื่อ)', () => {
  assert.equal(faqHit('dtf', 'สกรีน DFT ทนไหม'), true)
  assert.equal(faqHit('DTF', 'สกรีน DFT ทนไหม'), true)
})
