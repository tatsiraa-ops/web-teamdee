/* ตารางราคาโปโลปักบนมือถือ (mobile UX audit 30 ต.ค. ข้อ 10)
   เดิม: ตาราง 597px ในกล่อง 299px ที่ 375 เห็นผ้า ~2 จาก 6 คอลัมน์ · ฝ่ายบุคคลสั่ง 80 ตัวต้องปัดซ้ายขวาเทียบแถว 51–200 เอง
   ใหม่: มือถือเลือก "ช่วงจำนวน" (radio) แล้วเห็นราคาทุกผ้าของช่วงนั้นเป็นตาราง 2 คอลัมน์ (ผ้า | บาท/ตัว) · จอ ≥768 ตารางเต็มเหมือนเดิม
   ไม่มี JS = ตารางเต็มเลื่อนได้เหมือนเดิม · ตัวเลขมาจาก prices.json ผ่าน bandCompare() เท่านั้น */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bandCompare, bandFor, bandLabel, qtyText, bandId } from '../src/js/prices.js'
import { compareCaption, compareMarkup, compareRows, pickBand } from '../src/js/price-compare-view.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const P = JSON.parse(read('src/data/prices.json'))
const fmt = (n) => Number(n).toLocaleString('en-US')

test('bandCompare: โปโล 6 ช่วงจำนวน × 6 ผ้า ราคาตรง prices.json ทุกช่อง · ป้ายช่วงสร้างจากตัวเลข', () => {
  const v = bandCompare(P, 'polo')
  const p = P.products.polo
  assert.equal(v.bands.length, p.bands.length)
  v.bands.forEach((b, i) => {
    const src = p.bands[i]
    assert.equal(b.id, bandId(src))
    assert.equal(b.label, bandLabel(src))
    assert.equal(b.qty, qtyText(src))
    assert.deepEqual(b.rows.map((r) => r.id), p.cols.map((c) => c.id))
    assert.deepEqual(b.rows.map((r) => r.name), p.cols.map((c) => c.name))
    assert.deepEqual(b.rows.map((r) => r.price), p.cols.map((c) => src.price[c.id]))
    assert.deepEqual(b.rows.map((r) => r.text), p.cols.map((c) => fmt(src.price[c.id])))
  })
})

test('bandCompare: ทุกราคาบอกจำนวนที่ใช้ได้ + รวม VAT (audit 2.2) · caption ของแต่ละช่วง', () => {
  const v = bandCompare(P, 'polo')
  for (const b of v.bands) {
    assert.ok(b.caption.includes(b.qty), `${b.caption} ต้องบอก ${b.qty}`)
    assert.match(b.caption, /รวม VAT 7%/)
    assert.match(b.caption, /บาท/)
  }
  const noVat = bandCompare({ ...P, vatIncluded: false }, 'polo')
  assert.doesNotMatch(noVat.bands[0].caption, /VAT/)
})

test('งานจริง: ฝ่ายบุคคลสั่ง 80 ตัว → ช่วง 51–200 · เห็นราคาครบ 6 ผ้าในที่เดียว', () => {
  const v = bandCompare(P, 'polo')
  const src = bandFor(P.products.polo, 80)
  const b = pickBand(v, bandId(src))
  assert.equal(b.label, '51–200')
  assert.equal(b.qty, '51–200 ตัว')
  assert.deepEqual(b.rows.map((r) => r.price), P.products.polo.cols.map((c) => src.price[c.id]))
  const prices = b.rows.map((r) => r.price)
  assert.equal(b.status, `51–200 ตัว: ${prices.length} ผ้า ${fmt(Math.min(...prices))}–${fmt(Math.max(...prices))} บาท/ตัว · รวม VAT 7%`)
})

test('pickBand: รหัสไม่มีจริง → ช่วงแรก (ขั้นต่ำ)', () => {
  const v = bandCompare(P, 'polo')
  assert.equal(pickBand(v, 'nope'), v.bands[0])
  assert.equal(pickBand(v, null), v.bands[0])
})

test('bandCompare: สินค้าที่ตารางพอดีจออยู่แล้ว (≤2 คอลัมน์ราคา) / ไม่มีตาราง / ไม่มีสินค้า = null → หน้าเดิมไม่เปลี่ยน', () => {
  for (const id of ['print', 'screen', 'baseball', 'jersey']) assert.equal(bandCompare(P, id), null, id)
  assert.equal(bandCompare(P, 'warmup'), null)
  assert.equal(bandCompare(P, 'ไม่มี'), null)
})

test('bandCompare: ช่องที่ยังไม่มีราคา (null) ขึ้นข้อความทักถาม ไม่คิดเป็นศูนย์ · status นับเฉพาะช่องที่มีราคา', () => {
  const Q = structuredClone(P)
  const p = Q.products.polo
  p.ask = 'ทักถามราคา'
  p.bands.at(-1).price.drytech = null
  const last = bandCompare(Q, 'polo').bands.at(-1)
  const dry = last.rows.find((r) => r.id === 'drytech')
  assert.equal(dry.price, null)
  assert.equal(dry.text, 'ทักถามราคา')
  const priced = last.rows.filter((r) => r.price !== null).map((r) => r.price)
  assert.match(last.status, new RegExp(`${priced.length} ผ้า ${fmt(Math.min(...priced))}–${fmt(Math.max(...priced))}`))
  for (const c of p.cols) p.bands.at(-1).price[c.id] = null
  assert.match(bandCompare(Q, 'polo').bands.at(-1).status, /ทักถามราคา/)
})

test('compareMarkup: radio group (fieldset/legend) · ช่วงแรกถูกเลือก · ตาราง 2 คอลัมน์มี caption + หัวคอลัมน์/หัวแถว · ประกาศแบบ polite', () => {
  const v = bandCompare(P, 'polo')
  const html = compareMarkup(v, { name: 'pcmp-polo' })
  assert.match(html, /<fieldset class="pcmp__pick">\s*<legend[^>]*>[^<]*สั่งกี่ตัว/)
  const radios = html.match(/<input type="radio" name="pcmp-polo"[^>]*>/g)
  assert.equal(radios.length, v.bands.length)
  assert.match(radios[0], /checked/)
  assert.ok(radios.slice(1).every((r) => !/checked/.test(r)))
  v.bands.forEach((b) => assert.ok(html.includes(`value="${b.id}"`) && html.includes(`>${b.label}<`), b.label))
  /* ชื่อ radio = ข้อความในป้าย <label> ที่ตาเห็น (ไม่ใส่ aria-label ทับ · WCAG 2.5.3) */
  for (const r of radios) assert.doesNotMatch(r, /aria-label/)
  assert.equal((html.match(/<label class="pcmp__opt"><input /g) || []).length, v.bands.length)
  const cap = /<caption>([\s\S]*?)<\/caption>/.exec(html)[1]
  assert.equal(cap.replace(/<[^>]+>/g, ''), v.bands[0].caption)
  assert.match(cap, /<span class="pcmp__nb">รวม VAT 7%<\/span>/, 'VAT ไม่ขาดกลางวลี')
  assert.equal((html.match(/<th scope="col">/g) || []).length, 2)
  assert.equal((html.match(/<th scope="row">/g) || []).length, P.products.polo.cols.length)
  assert.match(html, /aria-live="polite"/)
})

test('compareCaption: ข้อความเดียวกับ caption · ใช้ตอนเปลี่ยนช่วง', () => {
  const b = pickBand(bandCompare(P, 'polo'), '51-200')
  assert.equal(compareCaption(b).replace(/<[^>]+>/g, ''), b.caption)
  assert.match(compareCaption(b), /51–200 ตัว/)
})

test('compareRows: แถวของช่วงที่เลือก · ชื่อผ้าเป็นหัวแถว ราคาเป็นตัวเลขจาก prices.json', () => {
  const v = bandCompare(P, 'polo')
  const b = pickBand(v, '51-200')
  const rows = compareRows(b)
  for (const r of b.rows) assert.ok(rows.includes(`<th scope="row">${r.name}</th><td>${r.text}</td>`), r.name)
})

test('compareMarkup: escape ข้อความ (กันชื่อผ้าแปลกจาก JSON ทำ HTML พัง)', () => {
  const v = { bands: [{ id: 'a"b', label: '<x>', qty: 'q', caption: 'c&d', status: 's', rows: [{ id: 'x', name: '<b>', price: 1, text: '1' }] }] }
  const html = compareMarkup(v, { name: 'n' })
  assert.ok(!html.includes('<x>') && !html.includes('<b>'))
  assert.ok(html.includes('&lt;x&gt;') && html.includes('c&amp;d') && html.includes('value="a&quot;b"'))
})

test('ตารางราคาห่อด้วย data-price-compare · ตารางเต็มยังมี caption รวม VAT + หัวคอลัมน์/หัวแถว (ไม่มี JS ก็ใช้ได้)', () => {
  const src = read('src/partials/ppPrice.hbs')
  assert.match(src, /<div[^>]*data-price-compare="\{\{item\.id\}\}"[^>]*>\s*<div class="ptable[^"]*"[^>]*>\s*<table>\s*<caption>ราคาต่อตัว \(บาท\) · รวม VAT 7%<\/caption>/)
  assert.match(src, /<th scope="col">/)
  assert.match(src, /<th scope="row">/)
})

test('สคริปต์หน้าสินค้าโหลดตัวเลือกช่วงจำนวน · CSS แยกไฟล์ · ไม่มีราคาพิมพ์เองในโค้ด', () => {
  assert.match(read('src/js/product-page.js'), /import \{ initPriceCompare \} from '\.\/price-compare\.js'/)
  assert.match(read('src/js/product-page.js'), /initPriceCompare\(\)/)
  const js = read('src/js/price-compare.js')
  assert.match(js, /import '\.\.\/styles\/price-table\.css'/)
  assert.match(js, /import prices from '\.\.\/data\/prices\.json'/)
  assert.match(js, /bandCompare\(/)
  const all = new Set(Object.values(P.products).flatMap((p) => (p.bands || []).flatMap((b) => Object.values(b.price))).filter(Boolean))
  for (const f of ['src/js/price-compare.js', 'src/js/price-compare-view.js']) {
    const code = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    for (const n of all) assert.doesNotMatch(code, new RegExp(`\\b${n}\\b`), `${f} มีเลข ${n} พิมพ์เอง`)
  }
})

test('price-table.css: ตารางเต็มซ่อนเฉพาะเมื่อ JS ใส่ .is-pcmp และเฉพาะจอ <768 · ปุ่มเลือกสูง ≥44px', () => {
  const css = read('src/styles/price-table.css').replace(/\/\*[\s\S]*?\*\//g, '')
  /* ค่าเริ่ม: ตัวเลือกซ่อน (จอคอม / ไม่มี JS ไม่มีตัวเลือกอยู่แล้ว) */
  assert.match(css, /\.pcmp\s*\{[^}]*display:\s*none/)
  const mq = /@media \(max-width: 767\.98px\)\s*\{([\s\S]*?)\n\}/.exec(css)
  assert.ok(mq, 'มี media query มือถือ')
  assert.match(mq[1], /\.is-pcmp > \.pcmp\s*\{[^}]*display:\s*block/)
  assert.match(mq[1], /\.is-pcmp > \.ptable[^{]*\{[^}]*display:\s*none/)
  /* นอก media query ห้ามซ่อนตารางเต็ม */
  assert.doesNotMatch(css.replace(mq[0], ''), /\.ptable\s*\{[^}]*display:\s*none/)
  const opt = /\.pcmp__opt\s*\{([^}]*)\}/.exec(css)
  const h = Number((/min-height:\s*(\d+)px/.exec(opt[1]) || [])[1])
  assert.ok(h >= 44, `ปุ่มเลือกสูง ${h}px`)
})
