/* ป๊อปอัปเข้าเว็บครั้งแรก (อาร์ตเลือกแบบ ก ขึ้นเมื่อดูเว็บไปสักพัก · 26 ต.ค. 2026)
   ขึ้นครั้งแรกแล้วเว้น 7 วัน · ไม่ขึ้นหน้าติดต่อ ขอบคุณ คำนวณราคา · โปรหมดอายุหายเอง · ข้อความต้องไม่มีสัญญาที่ยังไม่ยืนยัน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { activePromo, shouldShowPromo, PROMO_NEVER_DAYS, PROMO_DELAY_MS, neverUntil } from '../src/js/promo.js'

const data = JSON.parse(readFileSync(new URL('../src/data/promo.json', import.meta.url), 'utf8'))
const day = (s) => new Date(`${s}T12:00:00+07:00`)

test('เลือกโปรที่อยู่ในช่วงวันเริ่ม–วันหมด (นับวันสุดท้ายด้วย) · ไม่มีวันหมด = ใช้ได้เรื่อยๆ · ปิดไว้ = ข้าม', () => {
  const items = [
    { id: 'old', start: '2026-08-01', end: '2026-08-31' },
    { id: 'off', start: '2026-10-01', end: null, active: false },
    { id: 'now', start: '2026-10-01', end: '2026-10-31' },
    { id: 'always', start: '2026-01-01', end: null },
  ]
  assert.equal(activePromo(items, day('2026-10-31')).id, 'now')
  assert.equal(activePromo(items, day('2026-11-01')).id, 'always')
  assert.equal(activePromo(items, day('2025-12-31')), null)
})

test('อาร์ต 26 ต.ค. รอบ 2: ขึ้นเร็ว ทุกหน้า ครั้งเดียวต่อการเข้าเว็บ 1 รอบ · "ไม่ต้องแสดงอีก" = ไม่ขึ้น 30 วัน', () => {
  assert.ok(PROMO_DELAY_MS <= 2000)
  assert.equal(PROMO_NEVER_DAYS, 30)
  const now = day('2026-10-26')
  for (const path of ['/', '/contact-us/', '/thank-you/', '/calculations/', '/designs/']) assert.equal(shouldShowPromo({ path, sessionSeen: false, never: null, now }), true, path)
  assert.equal(shouldShowPromo({ path: '/', sessionSeen: true, never: null, now }), false)
  const until = neverUntil(now)
  assert.equal(shouldShowPromo({ path: '/', sessionSeen: false, never: until, now }), false)
  assert.equal(shouldShowPromo({ path: '/', sessionSeen: false, never: until, now: new Date(now.getTime() + 31 * 864e5) }), true)
  assert.equal(shouldShowPromo({ path: '/', sessionSeen: false, never: 'เสีย', now }), true)
})

test('ข้อมูลโปรจริง: ทุกโปรมีหัวข้อ ปุ่ม วันเริ่ม · ไม่มีข้อความรอยืนยัน [วงเล็บ] · ไม่สัญญาสิ่งที่ยังไม่ยืนยัน', () => {
  assert.ok(data.items.length >= 1)
  for (const p of data.items) {
    for (const k of ['id', 'title', 'body', 'start', 'alt']) assert.ok(p[k], `${p.id} ${k}`)
    /* banner = รูปโฆษณา 1:1 จากดีไซเนอร์ (null = ใช้การ์ด 1:1 ที่สร้างจากรูปจริง + ข้อความ) */
    assert.ok(p.banner === null || /\.(webp|jpg|png)$/.test(p.banner), p.id)
    assert.ok(p.cta?.t && p.cta?.to, p.id)
    assert.match(p.start, /^\d{4}-\d{2}-\d{2}$/)
    /* ข้อความทุกช่อง (รวม steps ที่เป็น array · 4 พ.ย.) · ไม่นับวงเล็บของโครงสร้าง JSON */
    const strings = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [])
    const text = strings(p).join(' ')
    assert.doesNotMatch(text, /\[[^\]]*\]/, p.id)
    assert.doesNotMatch(text, /ส่วนลด|ลด \d|ฟรี|แถม|ถูกที่สุด|อันดับ ?1/, `${p.id}: โปรที่มีส่วนลด/ของแถมต้องได้รับอนุมัติก่อน`)
  }
})

/* อาร์ตเคาะ 30 ต.ค. (ตรวจมือถือ): มือถือไม่ขึ้นตามเวลา (1.5 วิ บังราคาจอแรก · Google นับเป็น intrusive interstitial)
   → ขึ้นเมื่อเลื่อนเกินครึ่งหน้า · รอบที่เห็นป้ายคุกกี้แล้วไม่ขึ้นอีกบนมือถือ · จอใหญ่เหมือนเดิม */
import { promoTrigger, scrolledHalf, PROMO_SCROLL } from '../src/js/promo.js'

test('มือถือ: รอเลื่อนเกินครึ่งหน้า · รอบเดียวกับป้ายคุกกี้ไม่ขึ้น · จอใหญ่ใช้เวลาเหมือนเดิม', () => {
  assert.equal(PROMO_SCROLL, 0.5)
  assert.equal(promoTrigger({ narrow: true, cookieSession: false }), 'scroll')
  assert.equal(promoTrigger({ narrow: true, cookieSession: true }), null)
  assert.equal(promoTrigger({ narrow: false, cookieSession: true }), null)
  /* ครึ่งหน้า = ขอบล่างของจอเลยครึ่งความสูงเอกสาร */
  assert.equal(scrolledHalf({ y: 0, view: 800, doc: 4000 }), false)
  assert.equal(scrolledHalf({ y: 1200, view: 800, doc: 4000 }), true)
  assert.equal(scrolledHalf({ y: 0, view: 800, doc: 1000 }), false)
  assert.equal(scrolledHalf({ y: 200, view: 800, doc: 1000 }), true)
})

test('ป๊อปอัปใช้ตัวเลือกจังหวะจาก promo.js · จำว่ารอบนี้เห็นป้ายคุกกี้แล้ว', async () => {
  const { readFileSync } = await import('node:fs')
  const js = readFileSync(new URL('../src/js/promo-popup.js', import.meta.url), 'utf8')
  assert.match(js, /promoTrigger\(\{ narrow, cookieSession/)
  assert.match(js, /if \(needsAsk\(getConsent\(\)\)\) put\(sessionStorage, CK_SESSION_KEY, '1'\)/)
})

/* 4 พ.ย. อาร์ต "ไปทำอันนี้มาใหม่ ขออันนี้โฉมใหม่ไปเลย": เดิมรูปหมู่ลูกค้า 1:1 ทั้งรูปเป็นลิงก์ + ข้อความทับรูป + "ไม่ต้องแสดงอีก" ตัวขาวลอยบนพื้นดำ
   → การ์ดแนวนอน (มือถือแผ่นเลื่อนขึ้นจากล่าง) รูปชุดผ้าตัวอย่าง · หัวข้อ + 3 ขั้นจากข้อมูลจริง · ปุ่ม LINE แยกเป็นปุ่ม · "ไม่ต้องแสดงอีก" อยู่ในการ์ด */
test('ป๊อปอัปโฉมใหม่: การ์ดผ้าตัวอย่าง มีรูปชุดผ้า 3 ขั้น ปุ่ม LINE และปุ่มไม่ต้องแสดงอีกในการ์ด', () => {
  const p = data.items.find((x) => x.id === 'fabric-sample')
  assert.equal(p.img, '/img/promo/fabric-sample-760.webp')
  assert.ok(existsSync(new URL('../public/img/promo/fabric-sample-760.webp', import.meta.url)))
  assert.equal(p.steps.length, 3)
  assert.equal(p.accent, 'ก่อนตัดสินใจ')
  const hbs = readFileSync(new URL('../src/partials/promoPopup.hbs', import.meta.url), 'utf8')
  const card = hbs.slice(hbs.indexOf('<div class="promo__card">'))
  assert.match(card, /<ol class="promo__steps">/)
  assert.match(card, /<a class="promo__cta promo__cta--line"[^>]*data-promo-go/)
  assert.match(card, /<button type="button" class="promo__never" data-promo-never>/)
  assert.doesNotMatch(card, /<h[1-6]/) // ป๊อปอัปอยู่ทุกหน้า ห้ามเพิ่มหัวข้อ (ล็อกลำดับหัวข้อ v22)
})
