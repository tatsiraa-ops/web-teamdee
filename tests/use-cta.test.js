import { test } from 'node:test'
import assert from 'node:assert/strict'
import { useCta, lineMessageUrl } from '../src/js/use-cta.js'

const site = { lineUrl: 'https://line.me/R/ti/p/@teamdee', phonePrimary: '097-549-5941', phonePrimaryTel: '0975495941' }
const item = (id, shortName) => ({ id, shortName })

test('บริษัท หน่วยงาน ร้านค้า โรงเรียน คณะ: ปุ่มหลักขอใบเสนอราคา · ปุ่มรองโทร', () => {
  for (const id of ['corp', 'gov', 'shop', 'edu', 'faculty']) {
    const c = useCta(item(id, 'x'), site, '/contact-us/')
    assert.equal(c.mode, 'quote', id)
    assert.deepEqual(c.primary, { href: `/contact-us/?u=${id}`, label: 'ขอใบเสนอราคา' })
    assert.deepEqual(c.secondary, { href: 'tel:0975495941', label: 'โทร 097-549-5941' })
  }
})

test('กีฬา ก๊วน วิ่ง อีเวนต์ รุ่น: ปุ่มหลักทักไลน์พร้อมข้อความตั้งต้น · ปุ่มรองฟอร์มขอราคา', () => {
  for (const id of ['sport', 'badminton', 'running', 'event', 'class']) {
    const c = useCta(item(id, 'วิ่ง'), site, '/contact-us/')
    assert.equal(c.mode, 'line', id)
    assert.equal(c.primary.label, 'ทัก LINE ขอราคา')
    assert.equal(c.primary.href, lineMessageUrl('สนใจทำเสื้อวิ่ง ขอราคาและดูแบบ'))
    assert.deepEqual(c.secondary, { href: `/contact-us/?u=${id}`, label: 'ขอราคาผ่านฟอร์ม' })
  }
})

test('ทุกกลุ่มมีเบอร์โทรไว้ท้ายเนื้อหา', () => {
  for (const id of ['corp', 'sport']) assert.deepEqual(useCta(item(id, 'x'), site, '/c/').tel, { href: 'tel:0975495941', label: '097-549-5941' })
})

test('ลิงก์ LINE ข้อความตั้งต้นเข้ารหัส URL', () => {
  assert.equal(lineMessageUrl('สนใจ ก'), `https://line.me/R/oaMessage/@teamdee/?${encodeURIComponent('สนใจ ก')}`)
})

import { hrefWithDate } from '../src/js/use-cta.js'
import { dateFromQuery } from '../src/js/contact-send.js'

test('วันที่ต้องใช้เสื้อ: ฟอร์มได้ ?date= · LINE ต่อท้ายข้อความเป็นวันที่ไทย · วันที่ผิดรูปแบบไม่แตะลิงก์', () => {
  assert.equal(hrefWithDate('/contact-us/?u=corp', '2026-11-09'), '/contact-us/?u=corp&date=2026-11-09')
  const line = lineMessageUrl('สนใจทำเสื้อวิ่ง ขอราคาและดูแบบ')
  assert.equal(hrefWithDate(line, '2026-11-09'), lineMessageUrl('สนใจทำเสื้อวิ่ง ขอราคาและดูแบบ · ต้องใช้เสื้อวันที่ 9 พ.ย. 2569'))
  assert.equal(hrefWithDate('/contact-us/?u=corp', '9/11/2026'), '/contact-us/?u=corp')
  assert.equal(hrefWithDate('tel:0975495941', '2026-11-09'), 'tel:0975495941')
})

test('ฟอร์มติดต่อรับ ?date= เฉพาะรูปแบบ YYYY-MM-DD', () => {
  assert.equal(dateFromQuery('?u=corp&date=2026-11-09'), '2026-11-09')
  assert.equal(dateFromQuery('?date=<script>'), '')
  assert.equal(dateFromQuery('?date=2026-13-40'), '')
  assert.equal(dateFromQuery(''), '')
})
