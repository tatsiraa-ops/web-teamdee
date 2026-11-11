/* ตรวจรวม 2 พ.ย. 2026 (docs/audit/2026-11-02-qa.md) · เทสของ logic ที่แก้จากรายงาน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBackStack } from '../src/js/back-close.js'
import { holdWhile } from '../src/js/design-filter.js'
import { cleanFrom, lineMessageUrl, LINE_CAP } from '../src/js/contact-send.js'
import { headerEdge } from '../src/js/sticky-side.js'
import { hrefWithDate, pageLineText } from '../src/js/use-cta.js'
import { planNeedBy, needByText } from '../src/js/need-by.js'
import { picksMessage } from '../src/js/design-picks.js'
import { faqAskText } from '../src/js/faq-search.js'

/* ประวัติเบราว์เซอร์จำลอง: back() ยิง popstate แบบ async เหมือนจริง */
function fakeHistory() {
  const entries = [{ url: '/designs/', state: null }]
  let at = 0
  const fns = []
  const pending = []
  const h = {
    get url() { return entries[at].url },
    get length() { return at + 1 },
    state: () => entries[at].state,
    push(state, url = entries[at].url) { entries.splice(at + 1); entries.push({ url, state }); at++ },
    replace(state) { entries[at].state = state },
    back() { pending.push(() => { at--; for (const f of fns) f() }) },
    listen(fn) { fns.push(fn) },
    flush() { while (pending.length) pending.shift()() },
    popNow() { at--; for (const f of fns) f() },
  }
  return h
}

function sheetRig() {
  const h = fakeHistory()
  const back = createBackStack(h)
  let open = false
  const entry = back(() => open, () => { open = false })
  let filter = ''
  let applied = ''
  const hold = holdWhile(() => open, (push) => { if (push) h.push(null, `/designs/?f=${filter}`) })
  /* หน้า /designs/ อ่านค่าจาก URL ตอน popstate · ลำดับ listener เดียวกับหน้าจริง (back-close ก่อน) */
  h.listen(() => { if (!hold.settle()) applied = h.url })
  return {
    h,
    openSheet() { open = true; entry.opened() },
    pick(v) { filter = v; applied = v; hold.write(true) },
    closeByButton() { open = false; entry.closed(); h.flush() },
    get applied() { return applied },
  }
}

test('ตัวกรองในแผ่นมือถือ: ปิดแผ่นแล้วตัวกรองไม่หาย และ URL ตามค่าที่เลือก', () => {
  const s = sheetRig()
  s.openSheet()
  s.pick('polo')
  s.closeByButton()
  assert.equal(s.h.url, '/designs/?f=polo')
  assert.equal(s.applied, 'polo')
})

test('ตัวกรองในแผ่นมือถือ: เลือกหลายครั้งได้ประวัติขั้นเดียว · ย้อนกลับครั้งเดียวกลับหน้าไม่กรอง', () => {
  const s = sheetRig()
  s.openSheet()
  s.pick('a')
  s.pick('b')
  s.closeByButton()
  assert.equal(s.h.url, '/designs/?f=b')
  assert.equal(s.h.length, 2)
  s.h.popNow()
  assert.equal(s.h.url, '/designs/')
})

test('ตัวกรองในแผ่นมือถือ: กดปุ่มย้อนกลับปิดแผ่น ตัวกรองที่เลือกยังอยู่', () => {
  const s = sheetRig()
  s.openSheet()
  s.pick('polo')
  s.h.popNow()
  assert.equal(s.h.url, '/designs/?f=polo')
})

test('เปิดแล้วปิดแผ่นโดยไม่เลือก: URL เดิม ไม่เพิ่มประวัติ', () => {
  const s = sheetRig()
  s.openSheet()
  s.closeByButton()
  assert.equal(s.h.url, '/designs/')
  assert.equal(s.h.length, 1)
})

test('cleanFrom: รับสรุปจากหน้าคำนวณภาษาไทยที่ยาวเกิน 100', () => {
  const v = '/calculations/ · เสื้อโปโลปัก · ผ้าจูติ/TK · 1,000 ตัว · ปักชื่อ · ปักโลโก้เพิ่ม · 289 บาท/ตัว · รวม 289,000 บาท (รวม VAT) · ข้อความต่อท้ายให้ยาวเกินร้อยตัวอักษร'
  assert.ok(v.length > 100)
  assert.equal(cleanFrom(v), v)
})

test('cleanFrom: ไม่เปิดช่องให้ข้อความแปลกปลอมเข้าอีเมลทีม', () => {
  assert.equal(cleanFrom('/calculations/ · <script>alert(1)</script>'), '')
  assert.equal(cleanFrom('/calculations/ · โทรหา https://evil.example'), '')
  assert.equal(cleanFrom(`/calculations/ · ${'ก'.repeat(400)}`), '')
  assert.equal(cleanFrom('ข้อความแปลก'), '')
})

test('headerEdge: หัวเว็บหลบ = 0 แม้ยังเลื่อนออกไม่หมด · ไม่หลบ = ขอบล่างจริง', () => {
  assert.equal(headerEdge(65, true), 0)
  assert.equal(headerEdge(64.6, false), 65)
  assert.equal(headerEdge(-10, false), 0)
})

test('hrefWithDate: เติมวันในช่อง "ต้องใช้วันที่:" ไม่ต่อท้ายหลังหน้าที่มา', () => {
  const base = lineMessageUrl(pageLineText({ kind: 'products', id: 'polo' }, { products: { polo: 'เสื้อโปโล' } }, '/polo/'))
  const text = decodeURIComponent(hrefWithDate(base, '2026-12-20', 'ยืนยันแบบภายใน 1 ธ.ค. 2569').split('?')[1])
  assert.match(text, /ต้องใช้วันที่: 20 ธ\.ค\. 2569 \(ยืนยันแบบภายใน 1 ธ\.ค\. 2569\)\n\(จากหน้า \/polo\/\)$/)
  assert.equal(text.match(/วันที่/g).length, 1)
})

test('hrefWithDate: ข้อความที่ไม่มีช่องวันที่ ต่อบรรทัดใหม่', () => {
  const text = decodeURIComponent(hrefWithDate(lineMessageUrl('สนใจทำเสื้อทีม'), '2026-12-20').split('?')[1])
  assert.equal(text, 'สนใจทำเสื้อทีม\nต้องใช้วันที่: 20 ธ.ค. 2569')
})

const lead = { print: { tech: 'งานพิมพ์', days: '7–10 วัน' }, rush: 'งานด่วนเร็วสุด 7 วัน', season: 'ช่วงตุลาคม–มกราคม เผื่อเพิ่ม 5–7 วัน', start: 'นับจากยืนยันแบบ', deposit: 'มัดจำ 50%' }

test('วันที่ผ่านไปแล้ว: สถานะ past ไม่บอกให้ทัก LINE', () => {
  const r = planNeedBy('2026-11-01', '2026-11-02', lead, 'print')
  assert.equal(r.status, 'past')
  const x = needByText(r, lead)
  assert.match(x.main, /ผ่านไปแล้ว/)
  assert.equal(x.cta, null)
  assert.equal(x.note, null)
})

test('เหลือ 7 วันพอดี: ข้อความไม่ขัดกับ "เร็วสุด 7 วัน"', () => {
  const x = needByText(planNeedBy('2026-11-09', '2026-11-02', lead, 'print'), lead)
  assert.doesNotMatch(x.main, /น้อยกว่างานด่วน/)
  assert.match(x.main, /เหลือ 7 วัน/)
})

test('LINE URL ทุกข้อความไม่เกินเพดาน · ตัดแล้วไม่พังกลางอักขระ', () => {
  const url = lineMessageUrl('ถาม'.repeat(5000))
  const q = url.split('?')[1]
  assert.ok(q.length <= LINE_CAP, String(q.length))
  assert.ok(decodeURIComponent(q).endsWith('…'))
  assert.equal(lineMessageUrl('สั้น').split('?')[1], encodeURIComponent('สั้น'))
  assert.doesNotThrow(() => lineMessageUrl('😀'.repeat(2000)))
})

test('faqAskText: คำค้นยาวผิดปกติถูกตัด ก่อนเข้าข้อความ', () => {
  assert.ok([...faqAskText('ก'.repeat(5000))].length < 200)
})

test('ถาดเลือกแบบ 10 ภาพไม่มีรหัส: ข้อความไม่เกินเพดาน และยังเห็นครบ 10 รายการ', () => {
  const ids = Array.from({ length: 10 }, (_, i) => `รูปที่ ${i + 1} จาก /sports-shirt/ (ภาพอ้างอิงเสื้อกีฬา-ทีมฟุตบอล-${i + 1}.webp)`)
  const msg = picksMessage(ids)
  assert.ok(encodeURIComponent(msg).length <= LINE_CAP, String(encodeURIComponent(msg).length))
  for (let i = 1; i <= 10; i++) assert.match(msg, new RegExp(`\\n${i}\\. `))
})

test('cleanFrom: รับสรุปจากหน้าคำนวณได้ทุกสินค้า ผ้า และออปชันจริง (จำนวน 7 ช่วง)', async () => {
  const { estimate, fromText } = await import('../src/js/estimate.js')
  const { calcKinds } = await import('../src/js/prices.js')
  const prices = JSON.parse((await import('node:fs')).readFileSync(new URL('../src/data/prices.json', import.meta.url), 'utf8'))
  const K = calcKinds(prices)
  let n = 0
  for (const k of K.kinds) for (const f of k.fabrics || [{}]) for (const q of [1, 10, 21, 51, 101, 501, 2500]) {
    const r = estimate(K, { kind: k.id, fabric: f.id, qty: q, options: K.options.map((o) => o.id) })
    const t = fromText(r)
    assert.equal(cleanFrom(t), t, t)
    n++
  }
  assert.ok(n > 30)
})

test('หน้ากลุ่มบนเว็บจริง: การ์ดบริบทที่ไม่มีภาพลูกค้าไม่ขึ้น · ต้นแบบยังเห็นครบ', async () => {
  const { useView } = await import('../src/js/use-view.js')
  const { readFileSync } = await import('node:fs')
  const up = JSON.parse(readFileSync(new URL('../src/data/use-pages.json', import.meta.url), 'utf8')).corp
  const contextPhotos = [{ img: '/a.webp', alt: 'ก' }, { img: '/b.webp', alt: 'ข' }, null]
  const has = () => true
  const wp = useView(up, { contextPhotos }, { forWp: true, has })
  assert.equal(wp.contexts.cards.length, 2)
  assert.ok(wp.contexts.cards.every((c) => c.photo))
  assert.equal(useView(up, { contextPhotos }, { forWp: false, has }).contexts.cards.length, 3)
})
