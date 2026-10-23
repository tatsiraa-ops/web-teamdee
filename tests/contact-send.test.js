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
