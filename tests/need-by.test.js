/* "ต้องใช้เสื้อวันที่…" → ยืนยันแบบ + โอนมัดจำภายในวันไหน (ตรวจมือถือ 30 ต.ค. 2026 ข้อ 35)
   ตัวเลขทั้งหมดมาจาก src/data/lead-times.json ที่ยืนยันแล้ว · ยังไม่รวมวันขนส่ง (ยังไม่ยืนยัน) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { planNeedBy, needByText, thaiDate, addDays, maxDays } from '../src/js/need-by.js'
import { hrefWithDate, lineMessageUrl } from '../src/js/use-cta.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const lead = JSON.parse(read('src/data/lead-times.json'))

test('ตัวช่วยวันที่: บวกลบวันข้ามเดือน/ปี · วันมากสุดของช่วง · วันที่ไทย พ.ศ.', () => {
  assert.equal(addDays('2026-12-25', 10), '2027-01-04')
  assert.equal(addDays('2027-03-01', -1), '2027-02-28')
  assert.equal(maxDays(lead.print.days), 20)
  assert.equal(maxDays(lead.polo.days), 15)
  assert.equal(maxDays(lead.screen.days), 14)
  assert.equal(maxDays(lead.season), 7, 'ช่วงคิวแน่นใช้ตัวบนของ 5–7 วัน')
  assert.equal(maxDays(lead.rush), 7, 'งานด่วนเร็วสุด 7 วัน')
  assert.equal(thaiDate('2026-11-09'), '9 พ.ย. 2569')
  assert.equal(thaiDate('2027-01-01'), '1 ม.ค. 2570')
})

test('ข้อมูลที่ใช้คำนวณยังเป็นข้อความที่ยืนยันแล้ว (ถ้าแก้ lead-times.json ต้องกลับมาดูตรรกะ)', () => {
  assert.match(lead.season, /ตุลาคม–มกราคม/)
  assert.equal(lead.start, 'เริ่มนับวันถัดจากวันยืนยันแบบ')
  assert.match(lead.rush, /เร็วสุด 7 วัน ไม่มีค่าเร่ง/)
})

test('ok: นอกช่วงคิวแน่น วันยืนยันแบบ = วันใช้ − วันผลิตมากสุด', () => {
  const r = planNeedBy('2026-04-15', '2026-03-01', lead, 'print')
  assert.equal(r.status, 'ok')
  assert.equal(r.approveBy, '2026-03-26')
  assert.equal(r.season, false)
  assert.equal(r.buffer, 0)
  assert.equal(planNeedBy('2026-04-15', '2026-03-01', lead, 'screen').approveBy, '2026-04-01')
  assert.equal(planNeedBy('2026-04-15', '2026-03-01', lead, 'polo').approveBy, '2026-03-31')
})

test('ช่วงตุลาคม–มกราคม: เผื่อเพิ่ม 7 วัน (ตัวบนของ 5–7) · ดูช่วงผลิตที่แตะเดือนในช่วง', () => {
  const r = planNeedBy('2026-12-31', '2026-10-30', lead, 'print')
  assert.equal(r.season, true)
  assert.equal(r.buffer, 7)
  assert.equal(r.approveBy, '2026-12-04')
  /* โปโล 15 วัน ใช้ 14 ก.พ. → ช่วงผลิต 31 ม.ค.–14 ก.พ. แตะมกราคม → เผื่อ */
  const touch = planNeedBy('2027-02-14', '2026-11-01', lead, 'polo')
  assert.equal(touch.season, true)
  assert.equal(touch.approveBy, '2027-01-23')
  /* ใช้ 15 ก.พ. → ช่วงผลิต 1–15 ก.พ. ไม่แตะ → ไม่เผื่อ */
  const clear = planNeedBy('2027-02-15', '2026-11-01', lead, 'polo')
  assert.equal(clear.season, false)
  assert.equal(clear.approveBy, '2027-01-31')
})

test('tight: วันยืนยันแบบอยู่ภายใน 3 วันจากวันนี้ (ตั้งแต่พรุ่งนี้)', () => {
  const t = '2026-03-01'
  assert.equal(planNeedBy('2026-03-22', t, lead, 'print').status, 'tight', 'ยืนยันพรุ่งนี้')
  assert.equal(planNeedBy('2026-03-24', t, lead, 'print').status, 'tight', 'อีก 3 วัน')
  assert.equal(planNeedBy('2026-03-25', t, lead, 'print').status, 'ok', 'อีก 4 วัน')
})

test('rush: ไม่ทันผลิตปกติ แต่วันใช้ ≥ วันนี้ + 7 + 1 · late: น้อยกว่านั้น · past: วันที่ผ่านไปแล้ว', () => {
  const t = '2026-03-01'
  assert.equal(planNeedBy('2026-03-21', t, lead, 'print').status, 'rush', 'ต้องยืนยันวันนี้ = ไม่ทันปกติ')
  assert.equal(planNeedBy('2026-03-09', t, lead, 'print').status, 'rush', 'วันนี้ + 8')
  assert.equal(planNeedBy('2026-03-08', t, lead, 'print').status, 'late', 'วันนี้ + 7')
  assert.equal(planNeedBy('2026-03-01', t, lead, 'screen').status, 'late', 'วันนี้')
  assert.equal(planNeedBy('2026-02-20', t, lead, 'screen').status, 'past', 'ผ่านไปแล้ว')
})

test('ข้อมูลไม่พอ: สินค้าไม่มีเวลาผลิต หรือวันที่ผิดรูปแบบ → null', () => {
  assert.equal(planNeedBy('2026-04-15', '2026-03-01', lead, 'nope'), null)
  assert.equal(planNeedBy('15/04/2026', '2026-03-01', lead, 'print'), null)
  assert.equal(planNeedBy('', '2026-03-01', lead, 'print'), null)
})

test('ข้อความ ok: วันใช้ · ยืนยันแบบและโอนมัดจำภายใน · ที่มาของตัวเลข · ยังไม่รวมวันขนส่ง · ไม่มีปุ่มด่วน', () => {
  const x = needByText(planNeedBy('2026-04-15', '2026-03-01', lead, 'print'), lead)
  assert.equal(x.status, 'ok')
  assert.equal(x.need, 'ต้องใช้เสื้อวันที่ 15 เม.ย. 2569')
  assert.equal(x.main, 'ยืนยันแบบและโอนมัดจำภายใน 26 มี.ค. 2569')
  /* รอบ 64 (อาร์ต: ข้อความเยอะไป): บรรทัดที่มาเหลือ เวลาผลิต · เผื่อคิว · ไม่รวมขนส่ง
     กติกาการนับวัน (start · deposit · season · rush) ย้ายไป "วิธีนับวันผลิต" (nbHow.hbs) ข้างกล่อง */
  assert.ok(x.basis.includes('15–20 วัน'), x.basis)
  assert.ok(!x.basis.includes(lead.start) && !x.basis.includes(lead.deposit), x.basis)
  assert.ok(x.basis.includes('ยังไม่รวมวันขนส่ง'), x.basis)
  assert.ok(x.basis.length <= 70, `ยาว ${x.basis.length}: ${x.basis}`)
  assert.doesNotMatch(x.basis, /ตุลาคม/)
  assert.equal(x.cta, null)
  assert.equal(x.note, 'ยืนยันแบบภายใน 26 มี.ค. 2569')
})

test('ข้อความช่วงคิวแน่นบอกว่าเผื่อ 7 วัน · tight บอกจำนวนวันที่เหลือ', () => {
  const s = needByText(planNeedBy('2026-12-31', '2026-10-30', lead, 'print'), lead)
  assert.match(s.basis, /เผื่อช่วงคิวแน่น 7 วันแล้ว/)
  const t = needByText(planNeedBy('2026-03-23', '2026-03-01', lead, 'print'), lead)
  assert.equal(t.status, 'tight')
  assert.equal(t.main, 'ยืนยันแบบและโอนมัดจำภายใน 3 มี.ค. 2569 (อีก 2 วัน)')
})

test('ข้อความ rush/late: ไม่มีวันยืนยันแบบปลอม · ชวนคุยใน LINE · rush ใช้ข้อความงานด่วนที่ยืนยันแล้ว', () => {
  const r = needByText(planNeedBy('2026-03-09', '2026-03-01', lead, 'print'), lead)
  assert.equal(r.status, 'rush')
  assert.ok(r.main.includes(lead.rush), r.main)
  assert.match(r.cta, /LINE/)
  assert.match(r.note, /งานด่วน/)
  assert.doesNotMatch(r.note, /ยืนยันแบบภายใน/)
  const l = needByText(planNeedBy('2026-03-03', '2026-03-01', lead, 'print'), lead)
  assert.equal(l.status, 'late')
  assert.match(l.cta, /LINE/)
  assert.doesNotMatch(l.main, /ยืนยันแบบและโอนมัดจำภายใน/)
  assert.ok(l.basis.includes('ยังไม่รวมวันขนส่ง'))
})

test('hrefWithDate: ไม่มีช่องวันที่ = ต่อบรรทัดใหม่พร้อมวันยืนยันแบบ · ฟอร์มยังได้แค่ ?date= · ไม่ส่ง note = มีแค่วัน', () => {
  const line = lineMessageUrl('ขอราคาเสื้อพิมพ์ลาย จำนวนประมาณ ... ตัว')
  assert.equal(hrefWithDate(line, '2026-04-15', 'ยืนยันแบบภายใน 26 มี.ค. 2569'), lineMessageUrl('ขอราคาเสื้อพิมพ์ลาย จำนวนประมาณ ... ตัว\nต้องใช้วันที่: 15 เม.ย. 2569 (ยืนยันแบบภายใน 26 มี.ค. 2569)'))
  assert.equal(hrefWithDate(line, '2026-04-15'), lineMessageUrl('ขอราคาเสื้อพิมพ์ลาย จำนวนประมาณ ... ตัว\nต้องใช้วันที่: 15 เม.ย. 2569'))
  assert.equal(hrefWithDate('/contact-us/?u=corp', '2026-04-15', 'ยืนยันแบบภายใน 26 มี.ค. 2569'), '/contact-us/?u=corp&date=2026-04-15')
  /* ข้อความหลายบรรทัด (แถบล่างมือถือ): เติมในช่องวันที่ ไม่ต่อท้าย (2 พ.ย.) */
  const bar = lineMessageUrl('สวัสดี ทีมดี\nต้องใช้วันที่: \n(จากหน้า /sublimation/)')
  assert.equal(decodeURIComponent(hrefWithDate(bar, '2026-04-15', 'x').split('?')[1]), 'สวัสดี ทีมดี\nต้องใช้วันที่: 15 เม.ย. 2569 (x)\n(จากหน้า /sublimation/)')
})

test('วางบนหน้า: hero หน้าสินค้ามีช่องวันที่มีป้าย + live region · หน้ากลุ่มส่งสินค้าตัวแรกที่มีราคา · สคริปต์ผูกครบ', () => {
  const hero = read('src/partials/ppOrder.hbs')
  assert.match(hero, /data-need-by="\{\{item\.id\}\}"/)
  assert.match(hero, /<label[^>]*for="nbDate"/)
  assert.match(hero, /<input[^>]*id="nbDate"[^>]*type="date"/)
  assert.match(hero, /aria-live="polite"/)
  const use = read('src/partials/usePage.hbs')
  assert.match(use, /id="useDate"[^>]*data-need-by="\{\{up\.hero\.price\.pid\}\}"/)
  assert.match(use, /id="useDateOut"[^>]*aria-live="polite"/)
  assert.match(read('vite.config.js'), /pid: firstPriced/)
  assert.match(read('src/js/product-page.js'), /initNeedBy/)
  assert.match(read('src/js/use-page.js'), /bindNeedBy/)
  assert.match(read('src/js/need-by-ui.js'), /^import '\.\.\/styles\/need-by\.css'/m)
  /* /embroidery/ กลับมาใช้ ppHero (2 พ.ย.) → ไม่ต้องสร้างกล่องด้วย JS อีก */
  assert.doesNotMatch(read('src/js/need-by-ui.js'), /v3h__btns|insertAdjacentHTML|productRoutes/)
  assert.doesNotMatch(read('src/styles/need-by.css'), /nb--dark/)
})

test('กติกาการนับวันอยู่ครบใน "วิธีนับวันผลิต" ข้างกล่องวันที่ ทั้งหน้าสินค้าและหน้ากลุ่ม', () => {
  const how = readFileSync(new URL('../src/partials/nbHow.hbs', import.meta.url), 'utf8')
  for (const k of ['open', 'start', 'deposit', 'season', 'rush']) assert.ok(how.includes(`leadTimes.${k}`), k)
  for (const f of ['ppOrder', 'usePage']) assert.match(readFileSync(new URL(`../src/partials/${f}.hbs`, import.meta.url), 'utf8'), /\{\{> nbHow/, f)
  assert.doesNotMatch(readFileSync(new URL('../src/partials/usePage.hbs', import.meta.url), 'utf8'), /leadTimes\.note/)
})
