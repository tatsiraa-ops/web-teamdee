/* ถาดเลือกแบบทุกแกลเลอรี (audit มือถือ 30 ต.ค. ข้อ 11) · ครูอยากได้ 3 แบบ ส่ง LINE ครั้งเดียว
   แบบมีรหัส TD ใช้รหัส · ภาพอ้างอิง/งานจริงไม่มีรหัส ใช้ "รูปที่ N จาก /หน้า/ (ไฟล์)" ให้ฝ่ายขายหาเจอ
   ที่เลือกจำข้ามหน้า (PICK_KEY เดียวกัน) · ถาดชุดเดียว (pickTray.hbs + pick-tray.js + picks.css) ใช้ทั้ง /designs/ และแกลเลอรี */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { picksMessage, readPicks, imageLabel, fileOf, isCode, pickText, PICK_KEY } from '../src/js/design-picks.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const store = (v) => (k) => (k === PICK_KEY ? v : null)

test('ป้ายภาพที่ไม่มีรหัส: เลขรูป + หน้า + ชื่อไฟล์ (ฝ่ายขายหาเจอ)', () => {
  assert.equal(fileOf('/media/gallery/sport%20blue-540.webp?v=2'), 'sport blue-540.webp')
  assert.equal(fileOf('https://teamdee.co/wp-content/uploads/x/real-07.jpg'), 'real-07.jpg')
  assert.equal(imageLabel({ n: 12, page: '/sports-shirt/', file: 'real-07.jpg' }), 'รูปที่ 12 จาก /sports-shirt/ (real-07.jpg)')
  assert.equal(imageLabel({ n: 3, page: '/class-shirt-designs/' }), 'รูปที่ 3 จาก /class-shirt-designs/')
  assert.ok(isCode('TD-0001'))
  assert.ok(!isCode('รูปที่ 12 จาก /sports-shirt/'))
})

test('ข้อความ LINE: มีรหัสล้วน = แบบเดิม · ปนภาพไม่มีรหัส = รายการทีละบรรทัด', () => {
  assert.equal(picksMessage(['TD-0001', 'TD-0012']).split('\n')[0], 'สนใจแบบเสื้อ 2 แบบ รหัส TD-0001, TD-0012')
  const img = 'รูปที่ 12 จาก /sports-shirt/ (real-07.jpg)'
  assert.equal(picksMessage(['TD-0001', img, 'TD-0012']), [
    'สนใจแบบเสื้อ 3 แบบ',
    '1. รหัส TD-0001',
    `2. ${img}`,
    '3. รหัส TD-0012',
    'จำนวนประมาณ:  ตัว',
    'อยากได้รับวันที่: ',
  ].join('\n'))
  assert.equal(picksMessage([img]).split('\n').slice(0, 2).join('\n'), `สนใจแบบเสื้อ 1 แบบ\n1. ${img}`)
})

test('ที่จำไว้ข้ามหน้า: แกลเลอรี (ไม่มีรายการรหัสทั้งหมด) เก็บทุกอย่างที่รูปร่างถูก · /designs/ ตัดรหัสที่ไม่มีแล้วแต่เก็บภาพจากแกลเลอรี', () => {
  const img = 'รูปที่ 12 จาก /sports-shirt/ (real-07.jpg)'
  const raw = JSON.stringify(['TD-0001', img, 'TD-0404', '<script>', 42, img])
  assert.deepEqual(readPicks(store(raw), null), ['TD-0001', img, 'TD-0404'])
  assert.deepEqual(readPicks(store(raw), ['TD-0001', 'TD-0002']), ['TD-0001', img])
  assert.deepEqual(readPicks(store('x'.repeat(10)), null), [])
})

test('ปุ่มที่เลือกแล้วอ่านว่า "เลือกแล้ว"', () => {
  assert.equal(pickText(true), 'เลือกแล้ว')
  assert.equal(pickText(false), 'เลือก')
})

test('ถาดชุดเดียว: partial ใช้ทั้ง /designs/ และแกลเลอรี · มีช่องประกาศจำนวน + เลิกทำ', () => {
  const tray = read('src/partials/pickTray.hbs')
  assert.match(tray, /id="dgTrayLive" aria-live="polite"/)
  assert.match(tray, /id="dgTrayUndoBtn">เลิกทำ</)
  assert.match(tray, /id="dgTraySend"/)
  const designs = read('site/designs/index.html')
  assert.match(designs, /\{\{> pickTray /)
  assert.doesNotMatch(designs, /<section class="dg-tray"/)
  assert.match(designs, /<span class="dcard__pick-t" data-pick-t>เลือก<\/span>/)
  const gal = read('src/partials/galleryPage.hbs')
  assert.match(gal, /\{\{> pickTray /)
})

test('แกลเลอรี: ทุกภาพมีปุ่มเลือก (aria-pressed) แยกจากปุ่มดูรูปใหญ่ · ส่งต่อให้ตัวดูรูปเลือกแบบมีรหัสได้', () => {
  const gal = read('src/partials/galleryPage.hbs')
  const btns = gal.match(/<button class="gcard__pick"[^>]*>/g) || []
  assert.equal(btns.length, 3, 'แบบมีรหัส · ภาพอ้างอิง · งานจริง')
  for (const b of btns) assert.match(b, /aria-pressed="false"/)
  /* ปุ่มเลือกอยู่ใต้รูป ไม่อยู่ใน <figure> (ตัวดูรูปใส่ปุ่มขยายทับทั้ง figure) */
  for (const fig of gal.match(/<figure[\s\S]*?<\/figure>/g)) assert.doesNotMatch(fig, /gcard__pick/)
  const js = read('src/js/gallery-page.js')
  assert.match(js, /import '\.\.\/styles\/picks\.css'/)
  assert.match(js, /initPickTray\(/)
  assert.match(js, /initLightbox\('#galGrid', 'figure', '[^']+', \{ pick:/)
})

test('/designs/ ใช้ถาดชุดเดียวกัน · ถาดเปิดแล้วแถบล่างไม่มีปุ่ม LINE เขียวซ้อน · จุดกด 44px', () => {
  const dj = read('src/js/designs-page.js')
  assert.match(dj, /^import '\.\/page\.js'\nimport '\.\.\/styles\/page-designs\.css'[^\n]*\nimport '\.\.\/styles\/picks\.css'/)
  assert.match(dj, /initPickTray\(/)
  const tray = read('src/js/pick-tray.js')
  assert.match(tray, /classList\.toggle\('has-tray', /)
  assert.match(tray, /setAttribute\('aria-pressed'/)
  const css = read('src/styles/picks.css')
  assert.match(css, /html\.has-tray \.mobilebar \.mb__line \{ display: none; \}/)
  assert.match(css, /\.gcard__pick \{[^}]*min-height: 44px/)
  assert.doesNotMatch(read('src/styles/page-designs.css'), /\.dg-tray \{/)
})
