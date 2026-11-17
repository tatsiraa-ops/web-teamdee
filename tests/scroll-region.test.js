/* 16 พ.ย. 2026 audit (WCAG 2.1.1 · axe scrollable-region-focusable): แถบเลื่อนแนวนอนที่ข้างในไม่มีปุ่ม/ลิงก์ ผู้ใช้คีย์บอร์ดเลื่อนไม่ได้
   → แถบแบบนี้กด Tab ถึงได้ (tabindex 0) มีชื่อบอกว่าเป็นอะไร · แถบที่มีลิงก์/ปุ่มข้างในอยู่แล้วไม่เพิ่มจุดกด Tab */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { keyboardScrollable } from '../src/js/mobile-ui.js'

const fake = ({ tag = 'DIV', focusable = false, attrs = {} } = {}) => {
  const a = { ...attrs }
  return { tagName: tag, attrs: a, querySelector: () => (focusable ? {} : null), hasAttribute: (k) => k in a, getAttribute: (k) => a[k] ?? null, setAttribute: (k, v) => { a[k] = String(v) } }
}

test('แถบไม่มีจุดกดข้างใน: กด Tab ถึงได้ · role region · มีชื่อ', () => {
  const el = keyboardScrollable(fake(), 'แถวรูป')
  assert.equal(el.attrs.tabindex, '0'); assert.equal(el.attrs.role, 'region'); assert.equal(el.attrs['aria-label'], 'แถวรูป')
})
test('รายการ (ol/ul) คงความเป็นรายการ ไม่ใส่ role · ชื่อเดิมไม่ทับ · มีลิงก์ข้างในแล้วไม่แตะ', () => {
  const ol = keyboardScrollable(fake({ tag: 'OL', attrs: { 'aria-label': 'ขั้นตอน' } }), 'อื่น')
  assert.equal(ol.attrs.tabindex, '0'); assert.equal(ol.attrs.role, undefined); assert.equal(ol.attrs['aria-label'], 'ขั้นตอน')
  const withLinks = keyboardScrollable(fake({ focusable: true }), 'x')
  assert.deepEqual(withLinks.attrs, {})
})
test('ลูกที่ tabindex="-1" ไม่นับเป็นจุดกด (กด Tab ไม่ถึง) → แถบยังต้องกด Tab ถึงได้', () => {
  const calls = []
  const el = { tagName: 'OL', attrs: {}, querySelector: (s) => { calls.push(s); return s.includes(':not([tabindex="-1"])') ? null : {} }, hasAttribute: () => false, getAttribute: () => null, setAttribute(k, v) { this.attrs[k] = String(v) } }
  keyboardScrollable(el, 'ขั้นตอน')
  assert.equal(el.attrs.tabindex, '0')
})
test('แถบเลื่อนในหน้า: ตารางไซซ์ · ตระกูลคอเสื้อ · ภาพขั้นตอนหน้าเกี่ยวกับเรา กด Tab ถึงได้', () => {
  assert.match(readFileSync(new URL('../src/partials/pp2Sizes.hbs', import.meta.url), 'utf8'), /<div class="pp2-sz__tables" tabindex="0" role="region" aria-label="ตารางไซซ์ เลื่อนดูได้">/)
  assert.match(readFileSync(new URL('../src/partials/pp2Types.hbs', import.meta.url), 'utf8'), /<div class="cfm__cs" tabindex="0" role="region" aria-label="\{\{this\.t\}\}">/)
  assert.match(readFileSync(new URL('../site/about-us/index.html', import.meta.url), 'utf8'), /<ol class="ab2-film" tabindex="0" aria-label="ขั้นตอนทำเสื้อ เลื่อนดูได้">/)
  assert.match(readFileSync(new URL('../src/js/mobile-ui.js', import.meta.url), 'utf8'), /keyboardScrollable\(rail,/)
})
