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
  for (const u of ['corp', 'gov', 'shop', 'edu', 'faculty']) {
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
