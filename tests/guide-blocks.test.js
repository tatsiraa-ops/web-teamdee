import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Handlebars from 'handlebars'

const source = readFileSync(new URL('../src/partials/guideBlock.hbs', import.meta.url), 'utf8')
const h = Handlebars.create()
h.registerHelper('eq', (a, b) => a === b)
h.registerHelper('inc', n => n + 1)
h.registerHelper('url', (...args) => '/' + args.slice(0, -1).join('/') + '/')
const render = h.compile(source)

test('guide blocks: nested content uses H4 and roles appear only when provided', () => {
  const html = render({ kind: 'steps', blockHeading: 'h4', items: [{ t: 'เริ่มคุย', d: 'ส่งโจทย์' }, { t: 'ตรวจแบบ', d: 'ตรวจชื่อ', tag: 'approve' }] })
  assert.match(html, /<h4 class="gblock-title">เริ่มคุย<\/h4>/)
  assert.equal((html.match(/class="gblock-role"/g) || []).length, 1)
  assert.match(html, /ต้องอนุมัติ/)
})

test('guide blocks: native FAQ keeps answer and stable anchors without JS', () => {
  const html = render({ kind: 'faq', id: 'faq', items: [['เริ่มอย่างไร?', 'ส่งโจทย์ทาง LINE']] })
  /* การ์ด .fq-q ชุดเดียวกับหน้า /faq/ (27 ต.ค.) · ยังเป็น details/summary ธรรมดา ไม่ต้องมี JS */
  assert.match(html, /<details class="fq-q" id="gfaq-faq-0">/)
  assert.match(html, /<summary>/)
  assert.match(html, /id="gfaq-panel-faq-0"/)
  assert.match(html, /ส่งโจทย์ทาง LINE/)
  assert.doesNotMatch(html, /hs-accordion|aria-expanded="false"/)
})

test('guide blocks: comparison table preserves data and row/column semantics', () => {
  const html = render({ kind: 'table', title: 'สเปก', head: ['หัวข้อ', 'รายละเอียด'], rows: [['ผ้า', 'ผ้ารังผึ้ง']] })
  assert.match(html, /tabindex="0" role="region" aria-label="ตาราง สเปก/)
  assert.match(html, /<th scope="col">หัวข้อ<\/th>/)
  assert.match(html, /<th scope="row">ผ้า<\/th><td>ผ้ารังผึ้ง<\/td>/)
})

test('guide blocks: size reference remains explicitly provisional and data unchanged', () => {
  const sizing = JSON.parse(readFileSync(new URL('../src/data/sizing.json', import.meta.url), 'utf8'))
  const html = render({ kind: 'sizes', sizing })
  assert.match(html, /ตารางนี้เป็นขนาดอ้างอิงเบื้องต้น/)
  for (const row of sizing.sizes) assert.ok(html.includes(`<th scope="row">${row.size}</th><td>${row.chest}</td><td>${row.length}</td><td>${row.shoulder}</td>`))
})

test('guide blocks: pending image annotations are preserved only in prototype', () => {
  const card = { kind: 'cards', cards: [{ t: 'ตัวอย่าง', ph: 'รอรูป' }] }
  assert.match(render(card), /รอรูป/)
  assert.doesNotMatch(render({ ...card, wp: true }), /รอรูป/)
})

test('guide blocks: related product links remain without duplicating the parent guide library', () => {
  const html = render({ kind: 'links', links: [{ to: 'products', t: 'ดูสินค้า' }], otherGuides: [{ id: 'fabric', name: 'คู่มือเลือกผ้า' }] })
  assert.match(html, /ดูสินค้า/)
  assert.doesNotMatch(html, /คู่มือเล่มอื่น|คู่มือเลือกผ้า/)
})
