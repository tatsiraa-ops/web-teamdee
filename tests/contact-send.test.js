import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lineUrlFor, sendContact, codeFromQuery } from '../src/js/contact-send.js'

test('ลิงก์ LINE แนบรหัสแบบเป็นข้อความตั้งต้น · ไม่มีรหัสใช้ลิงก์เพิ่มเพื่อนปกติ', () => {
  assert.equal(lineUrlFor('', 'https://line.me/R/ti/p/@teamdee'), 'https://line.me/R/ti/p/@teamdee')
  const u = lineUrlFor('TD-0012', 'https://line.me/R/ti/p/@teamdee')
  assert.ok(u.startsWith('https://line.me/R/oaMessage/@teamdee/?'))
  assert.equal(decodeURIComponent(u.split('?')[1]), 'สนใจแบบเสื้อรหัส TD-0012')
})

test('รหัสแบบจาก ?code= รับเฉพาะรูปแบบรหัส กันข้อความแปลกปลอม', () => {
  assert.equal(codeFromQuery('?code=TD-0012'), 'TD-0012')
  assert.equal(codeFromQuery('?code=gfn260436'), 'GFN260436')
  assert.equal(codeFromQuery('?code=<script>'), '')
  assert.equal(codeFromQuery(''), '')
})

test('ยังไม่ได้ตั้งอีเมลรับฟอร์ม → ไม่ส่ง ให้หน้าใช้ทางสำรอง (คัดลอก + LINE)', async () => {
  let called = false
  const r = await sendContact({ name: 'ก' }, { enabled: false }, () => { called = true })
  assert.deepEqual(r, { ok: false, reason: 'off' })
  assert.equal(called, false)
})

test('ส่งสำเร็จ → บอกหน้าขอบคุณ · ส่งข้อมูลเป็นฟอร์มพร้อม action', async () => {
  let sent
  const fakeFetch = async (url, opt) => { sent = { url, opt }; return { ok: true, json: async () => ({ ok: true }) } }
  const r = await sendContact({ name: 'สมชาย', tel: '0800000000' }, { enabled: true, endpoint: '/wp-admin/admin-post.php', thanks: '/thank-you/' }, fakeFetch)
  assert.deepEqual(r, { ok: true, redirect: '/thank-you/' })
  assert.equal(sent.url, '/wp-admin/admin-post.php')
  assert.equal(sent.opt.method, 'POST')
  const body = new URLSearchParams(sent.opt.body)
  assert.equal(body.get('action'), 'td_contact')
  assert.equal(body.get('name'), 'สมชาย')
})

test('เซิร์ฟเวอร์ตอบผิดพลาดหรือเน็ตหลุด → ไม่ถือว่าส่งแล้ว', async () => {
  const bad = await sendContact({}, { enabled: true, endpoint: '/x' }, async () => ({ ok: false, json: async () => ({ ok: false }) }))
  assert.deepEqual(bad, { ok: false, reason: 'error' })
  const down = await sendContact({}, { enabled: true, endpoint: '/x' }, async () => { throw new Error('offline') })
  assert.deepEqual(down, { ok: false, reason: 'network' })
})

import { b2bPrefill } from '../src/js/contact-send.js'

test('มาจากหน้าบริษัท/หน่วยงาน/ร้านค้า/โรงเรียน/คณะ: ติ๊กใบเสนอราคาให้ และชวนใส่อีเมล · กลุ่มอื่นไม่แตะ', () => {
  for (const u of ['corp', 'gov', 'shop', 'edu', 'faculty', 'class']) {
    const b = b2bPrefill(u)
    assert.deepEqual(b.docs, ['ใบเสนอราคา'], u)
    assert.match(b.emailHelp, /อีเมล/)
  }
  for (const u of ['sport', 'running', '', null, 'x']) assert.equal(b2bPrefill(u), null)
})

/* ---------- ผลของการส่ง 3 ทาง (อาร์ตเคาะ 24 ต.ค. ข้อ 6 · audit C2) ---------- */
import { outcomeOf, failText, lineSummary, telOk, thanksFlag, readThanksFlag } from '../src/js/contact-send.js'

test('ผลการส่ง: สำเร็จ → หน้าขอบคุณ · off → ส่งต่อทาง LINE · error/network → กล่องยังส่งไม่ถึง', () => {
  assert.deepEqual(outcomeOf({ ok: true, redirect: '/thank-you/' }), { view: 'thanks', to: '/thank-you/' })
  /* ธีมไม่ได้บอกหน้าขอบคุณ ก็ยังไปหน้าขอบคุณ ไม่มีกล่องเขียวในหน้าแล้ว */
  assert.deepEqual(outcomeOf({ ok: true, redirect: null }), { view: 'thanks', to: '/thank-you/' })
  assert.deepEqual(outcomeOf({ ok: false, reason: 'off' }), { view: 'off' })
  assert.deepEqual(outcomeOf({ ok: false, reason: 'error' }), { view: 'failed' })
  assert.deepEqual(outcomeOf({ ok: false, reason: 'network' }), { view: 'failed' })
  /* ค่าแปลกที่ไม่รู้จัก ห้ามตกไปเป็นสำเร็จ */
  assert.deepEqual(outcomeOf({ ok: false, reason: 'x' }), { view: 'failed' })
  assert.deepEqual(outcomeOf(undefined), { view: 'failed' })
})

test('เซิร์ฟเวอร์บอกเหตุผล (limit / invalid / mail) → ส่งต่อเป็น code · กล่องบอกสาเหตุตรงๆ', async () => {
  const limit = await sendContact({}, { enabled: true, endpoint: '/x' }, async () => ({ ok: false, json: async () => ({ ok: false, reason: 'limit' }) }))
  assert.deepEqual(limit, { ok: false, reason: 'error', code: 'limit' })
  assert.match(failText(limit), /ถี่/)
  assert.match(failText({ ok: false, reason: 'error', code: 'invalid' }), /เบอร์/)
  assert.match(failText({ ok: false, reason: 'network' }), /อินเทอร์เน็ต/)
  assert.match(failText({ ok: false, reason: 'error', code: 'mail' }), /ข้อมูลที่กรอกยังอยู่ครบ/)
  /* ไม่มีคำว่าส่งแล้ว และไม่สัญญา 5 นาทีกับฟอร์ม */
  for (const s of [limit, { ok: false, reason: 'network' }, { ok: false, reason: 'error' }]) {
    assert.doesNotMatch(failText(s), /ส่งแล้ว|ได้รับแล้ว|5 นาที/)
  }
})

test('ข้อความ LINE ที่พิมพ์ไว้ให้: มีสินค้า จำนวน วันที่ รหัสแบบ · ไม่มีชื่อ เบอร์ อีเมล องค์กร หรือรายละเอียดที่พิมพ์เอง', () => {
  const t = lineSummary({ name: 'สมชาย', tel: '0812345678', email: 'a@b.co', org: 'บริษัท ก', note: 'โทรหาผม 0812345678', product: 'เสื้อโปโลปัก', qty: '50', date: '2026-11-09', use: 'บริษัท', code: 'TD-0012', docs: 'ใบเสนอราคา' })
  for (const s of ['เสื้อโปโลปัก', '50 ตัว', '2026-11-09', 'TD-0012', 'บริษัท', 'ใบเสนอราคา']) assert.ok(t.includes(s), s)
  for (const s of ['สมชาย', '0812345678', 'a@b.co', 'บริษัท ก', 'โทรหาผม']) assert.ok(!t.includes(s), s)
  /* ไม่ได้เลือกอะไรเลย ก็ยังมีประโยคเปิด */
  assert.ok(lineSummary({}).length > 0)
  assert.ok(!lineSummary({}).includes('undefined'))
})

test('เบอร์โทร: 9–10 หลักขึ้นต้น 0 หรือ +66 / 66 · ขีดและเว้นวรรคได้', () => {
  for (const v of ['0812345678', '081-234-5678', '02 123 4567', '+66 81 234 5678', '66812345678', '+6621234567']) assert.equal(telOk(v), true, v)
  for (const v of ['', '12345', '081234567890', 'abc', '812345678', '+1 415 555 0100']) assert.equal(telOk(v), false, v)
})

test('ธงหน้าขอบคุณ: เก็บเบอร์ที่กรอก (ตัดอักขระแปลก) · อ่านคืนได้ภายใน 30 นาที · นับ event ครั้งเดียว', () => {
  const now = 1_800_000_000_000
  const raw = thanksFlag({ tel: '081-234-5678<b>', from: '/corporate/' }, now)
  const d = readThanksFlag(raw, now + 60_000)
  assert.deepEqual(d, { tel: '081-234-5678', from: '/corporate/', t: now, counted: false })
  assert.equal(readThanksFlag(raw, now + 31 * 60_000), null)
  assert.equal(readThanksFlag(null, now), null)
  assert.equal(readThanksFlag('{bad', now), null)
  assert.equal(readThanksFlag(JSON.stringify({ tel: 1, t: now }), now), null)
  const again = readThanksFlag(JSON.stringify({ ...d, counted: true }), now)
  assert.equal(again.counted, true)
})

/* ---------- audit 26 ต.ค. M1/M2: ฟอร์มรู้ว่ามาจากปุ่มไหน · ไม่ทิ้งข้อมูลจัดซื้อ ---------- */
import { prefillFor, emailLooksOk, qtyFromQuery } from '../src/js/contact-send.js'

test('เบอร์องค์กรที่มีเบอร์ต่อ วงเล็บ หรือ # ยังผ่าน', () => {
  for (const v of ['02-123-4567 ต่อ 12', '02-123-4567 #12', '(02) 123-4567', '02 123 4567 ext 5', '02-123-4567 ext.5', '021234567 x12']) assert.equal(telOk(v), true, v)
  for (const v of ['ต่อ 12', '12 ต่อ 3', '(02)']) assert.equal(telOk(v), false, v)
})

test('ปุ่มที่ส่งมาบอกบริบท: ขอเอกสารบริษัท · ขอใบเสนอราคา · หน้าคำนวณ · โปโลปัก · สั่งซ้ำ · กลุ่มองค์กร', () => {
  assert.deepEqual(prefillFor({ from: 'company-docs' }).docs, ['ใบเสนอราคา', 'หนังสือรับรองบริษัท', 'ภ.พ.20'])
  assert.equal(prefillFor({ from: 'company-docs' }).openOrg, true)
  assert.deepEqual(prefillFor({ from: 'quote' }).docs, ['ใบเสนอราคา'])
  assert.deepEqual(prefillFor({ from: '/calculations/ · โปโล 30 ตัว' }).docs, ['ใบเสนอราคา'])
  assert.equal(prefillFor({ product: 'polo' }).openOrg, true)
  assert.equal(prefillFor({ use: 'class' }).openOrg, true)
  assert.equal(prefillFor({ from: 'reorder' }).reorder, true)
  assert.equal(prefillFor({ from: 'reorder' }).openOrg, false)
  assert.equal(prefillFor({ use: 'sport' }), null)
  assert.equal(prefillFor({}), null)
})

test('อีเมลผิดรูปแบบเตือนได้ (ไม่บล็อก) · ว่างไม่เตือน', () => {
  for (const v of ['hr@company.co.th', 'a.b@x.com', '']) assert.equal(emailLooksOk(v), true, v)
  for (const v of ['hr@company', 'hr@company,co.th', 'hr company.com', 'hr@@x.com']) assert.equal(emailLooksOk(v), false, v)
})

test('จำนวนจากหน้าคำนวณ (?qty=) รับแค่จำนวนเต็มบวก', () => {
  assert.equal(qtyFromQuery('?qty=150'), '150')
  for (const s of ['?qty=0', '?qty=-3', '?qty=abc', '?qty=1.5', '', '?qty=999999']) assert.equal(qtyFromQuery(s), '', s)
})

test('telOk: เลขไทย (๐๘๑…) ก็รับ (ลองใช้จริง 30 ต.ค. · คีย์บอร์ดไทยบางแบบพิมพ์เลขไทย)', () => {
  for (const v of ['๐๘๑๒๓๔๕๖๗๘', '๐๘๑-๒๓๔-๕๖๗๘', '๐๒ ๑๒๓ ๔๕๖๗']) assert.equal(telOk(v), true, v)
  assert.equal(telOk('๑๒๓๔๕'), false)
})

test('toAsciiDigits: แปลงเลขไทยก่อนส่ง (ตรวจละเอียด 30 ต.ค.: เว็บรับเลขไทยแต่ server ตัดทิ้ง → ลูกค้าเจอ "เบอร์ไม่ครบ")', async () => {
  const { toAsciiDigits } = await import('../src/js/contact-send.js')
  assert.equal(toAsciiDigits('๐๘๑-๒๓๔-๕๖๗๘'), '081-234-5678')
  assert.equal(toAsciiDigits('สั่ง ๕๐ ตัว'), 'สั่ง 50 ตัว')
  assert.equal(toAsciiDigits(''), '')
  assert.equal(thanksFlag({ tel: '๐๘๑๒๓๔๕๖๗๘' }, 1).includes('0812345678'), true)
})

test('telOk: รูปแบบที่คนพิมพ์จริงและ server รับได้ (+66 (0) · จุด · สองเบอร์คั่น / หรือ ,)', () => {
  for (const v of ['+66 (0) 81 234 5678', '081.234.5678', '081 234 5678 / 089 123 4567', '0812345678, 0891234567']) assert.equal(telOk(v), true, v)
})

test('sendContact: เน็ตค้างเกินเวลา = network (เดิมปุ่มค้าง "กำลังส่ง" ตลอด · 30 ต.ค.)', async () => {
  const { sendContact } = await import('../src/js/contact-send.js')
  const hang = (url, opt) => new Promise((_, reject) => opt.signal.addEventListener('abort', () => reject(new Error('abort'))))
  const r = await sendContact({ name: 'a', tel: '0812345678' }, { enabled: true, endpoint: '/x' }, hang, 30)
  assert.deepEqual(r, { ok: false, reason: 'network' })
})

test('cleanFrom: ?from= รับเฉพาะ path ของเว็บหรือคำที่ใช้จริง ยาวไม่เกิน 100 (ไม่ให้ข้อความแปลกเข้าอีเมลทีม · 30 ต.ค.)', async () => {
  const { cleanFrom } = await import('../src/js/contact-send.js')
  assert.equal(cleanFrom('/designs/'), '/designs/')
  assert.equal(cleanFrom('quote'), 'quote')
  assert.equal(cleanFrom('collar-options'), 'collar-options')
  assert.equal(cleanFrom('โปรด่วน! โทรหาฉัน'), '')
  assert.equal(cleanFrom('//evil.example'), '')
  assert.equal(cleanFrom('/' + 'a'.repeat(200)), '')
})

test('todayLocal: วันนี้ตามเวลาเครื่อง ไม่ใช่ UTC (ตี 0–7 เวลาไทยเคยเลือกเมื่อวานได้ · 30 ต.ค.)', async () => {
  const { todayLocal } = await import('../src/js/lib.js')
  assert.equal(todayLocal(new Date(2026, 9, 30, 2, 0)), '2026-10-30')
  assert.equal(todayLocal(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
})

test('failText: ส่งข้ามเว็บ (origin) บอกให้รีเฟรชหน้าแล้วลองใหม่ ไม่ใช่ "ระบบขัดข้อง" ลอยๆ (30 ต.ค.)', () => {
  assert.match(failText({ ok: false, reason: 'error', code: 'origin' }), /รีเฟรช/)
})

/* ตรวจมือถือ 30 ต.ค. ข้อ 12: มาจากหน้าแบบ/แกลเลอรี (?from=/sports-shirt/) รหัสไปอยู่ในรายละเอียด แต่ช่องสินค้า/งานไม่ถูกเลือก */
import { contextFromPath } from '../src/js/contact-send.js'
test('เดาสินค้าและงานจากหน้าที่มา · หน้าที่ไม่รู้จัก = ว่าง', async () => {
  const routes = JSON.parse((await import('node:fs')).readFileSync(new URL('../src/data/routes.json', import.meta.url), 'utf8'))
  assert.deepEqual(contextFromPath('/sports-shirt/', routes), { product: 'print', use: 'sport' })
  assert.deepEqual(contextFromPath('/corporate-shirts/', routes), { product: 'print', use: 'corp' })
  assert.deepEqual(contextFromPath('/embroidery/', routes), { product: 'polo', use: '' })
  assert.deepEqual(contextFromPath('/education/', routes), { product: '', use: 'edu' })
  assert.deepEqual(contextFromPath('/designs/', routes), { product: 'print', use: '' })
  assert.deepEqual(contextFromPath('/design-preview/td-0012/', routes), { product: 'print', use: '' })
  assert.deepEqual(contextFromPath('/size-chart/', routes), { product: '', use: '' })
  assert.deepEqual(contextFromPath('', routes), { product: '', use: '' })
})
