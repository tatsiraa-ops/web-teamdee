/* 11 พ.ย. 2026 หน้างานปัก /embroidery/ โฉมใหม่ (อาร์ต "งานปักต่อเลย ต้นแบบคือหน้าเสื้อพิมพ์ลาย" → "เริ่มทำได้")
   spec docs/superpowers/specs/2026-11-11-embroidery-page-design.md · ข้อมูลไดรฟ์ src/data/polo.json (tests/polo-data.test.js) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const page = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const ids = (m) => [...m.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map((x) => x[1])
const cls = (m) => [...m.matchAll(/<section class="([a-z0-9-]+)/g)].map((x) => x[1])
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const polo = JSON.parse(readFileSync('src/data/polo.json', 'utf8'))
const EMB3D = ['tdwhite', 'tdblack', 'pcm', 'decolgen', 'alfredo', 'scg', 'bluering', 'tbs']

test('ภาพงานปัก 3D จากไดรฟ์ครบทุกขนาด', () => {
  for (const n of EMB3D) for (const w of [480, 760, 1200]) assert.ok(pub(`/img/emb-3d/${n}-${w}.webp`), `${n}-${w}`)
})

test('ลำดับส่วนเหมือนหน้าพิมพ์ลาย · ส่วนเก่าของหน้าปักถูกตัด', () => {
  const m = page('embroidery')
  const order = ['band-hero', 'pp2-hl', 'pp2-dz', 'pp2-pf', 'reviews', 'fabric', 'options', 'size', 'order', 'faq']
  const seen = [...cls(m), ...ids(m)]
  let at = -1
  for (const k of order) { const i = m.search(new RegExp(`<section[^>]*(class="${k}|id="${k}")`)); assert.ok(i > at, `${k} ต้องมาหลังส่วนก่อนหน้า (${i} ≤ ${at})`); at = i }
  for (const old of ['production', 'clips', 'uses', 'wrap', 'price', 'detail', 'work']) assert.ok(!ids(m).includes(old), `ยังมีส่วนเก่า #${old}`)
  assert.ok(seen.length > 8)
})

test('แบบ 3D แถวแรก = ภาพงานปักลูกค้าจริง 8 ภาพ พร้อมชื่อแบรนด์ใน alt', () => {
  const m = page('embroidery')
  const dz = m.slice(m.indexOf('class="pp2-dz"'), m.indexOf('</section>', m.indexOf('class="pp2-dz"')))
  const row1 = dz.slice(0, dz.indexOf('<!-- /row'))
  for (const n of EMB3D) assert.match(row1, new RegExp(`/img/emb-3d/${n}-`), n)
  for (const b of ['SCG', 'Decolgen', 'TBS', 'PCM', 'Alfredo']) assert.match(row1, new RegExp(`alt="[^"]*${b}`), b)
  assert.ok((dz.match(/<!-- \/row/g) || []).length >= 2, 'มีแถวแบบโปโลปักจากคลังด้วย')
})

test('จุดเด่น + ทรงและคอ ใช้แบบมาตรฐานจากไดรฟ์', () => {
  const m = page('embroidery')
  assert.match(m, /ปักโลโก้ฟรี 1 จุด/)
  const op = m.slice(m.search(/<section[^>]*id="options"/), m.indexOf('</section>', m.search(/<section[^>]*id="options"/)))
  for (const s of polo.spec) assert.ok(op.includes(s.t), s.t)
})

test('ส่วนทำไมทีมดีของหน้าปักไม่มีภาพงานพิมพ์ลาย', () => {
  const m = page('embroidery')
  const pf = m.slice(m.indexOf('class="pp2-pf"'), m.indexOf('</section>', m.indexOf('class="pp2-pf"')))
  assert.doesNotMatch(pf, /pp-proof\/(print|bts-print|bts-heat|bts-file)/)
  assert.doesNotMatch(pf, /alt="[^"]*พิมพ์ลาย/)
  assert.match(pf, /embroidery-asmr|งานปักโลโก้บนเสื้อโปโล/, 'มีคลิปงานปักจริง')
})

test('ขั้นตอนสั่งผลิตของหน้าปักไม่ใช้ภาพ/คำงานพิมพ์ · เวลาผลิต 10–15 วัน', () => {
  const m = page('embroidery')
  const at = m.search(/<section[^>]*id="order"/)
  const st = m.slice(at, m.indexOf('</section>', at))
  assert.doesNotMatch(st, /พิมพ์ลาย|อัดลาย|15–20 วัน/)
  assert.match(st, /10–15 วัน/)
})

test('หน้าพิมพ์ลายไม่กระทบ', () => {
  const m = page('sublimation')
  assert.match(m, /ผ้าพิมพ์ลาย 14 ชนิด|ผ้าพิมพ์ลาย/)
  assert.match(m, /pp-proof\/print-wide/)
})

test('ทุกภาพในหน้าปักมีไฟล์จริง (hero · ภาพประกอบขั้นตอน · ภาพผ้า · ตัวเลือก)', () => {
  const m = page('embroidery')
  const urls = new Set([...m.matchAll(/(?:src|srcset)="([^"]+)"/g)].flatMap((x) => x[1].split(',').map((s) => s.trim().split(/\s+/)[0])).filter((u) => u.includes('/img/')).map((u) => u.replace(/^.*?\/img\//, '/img/')))
  const missing = [...urls].filter((u) => !pub(u))
  assert.deepEqual(missing, [], `ไม่มีไฟล์: ${missing.join(' ')}`)
  const hero = readFileSync('dist-wp/embroidery/index.html', 'utf8').match(/pp-hero\/polo-[a-z0-9-]+\.webp/g) || []
  assert.ok(hero.length >= 3, 'hero ใช้ภาพชุด polo')
})

test('ลิงก์จากทุกหน้าที่ชี้ /embroidery/#x มีส่วน id นั้นจริง · แถบล่างมือถือไปตารางราคาในแผงผ้า', async () => {
  const { readdirSync } = await import('node:fs')
  const html = readFileSync('dist-wp/embroidery/index.html', 'utf8')
  const has = (id) => new RegExp(`\\sid="${id}"`).test(html)
  const bad = []
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.isDirectory()) walk(p); else if (e.name === 'index.html') { const h = readFileSync(p, 'utf8'); const self = p === 'dist-wp/embroidery/index.html'; for (const m of h.matchAll(/href="([^"]*)"/g)) { const u = m[1]; const t = self && u.startsWith('#') ? u.slice(1) : (u.match(/\/embroidery\/#([\w-]+)/) || [])[1]; if (t && !has(t)) bad.push(`${p} → #${t}`) } } } }
  walk('dist-wp')
  assert.deepEqual([...new Set(bad)], [])
  assert.match(html, /class="mb__btn" href="#fabric"/)
})

test('คลังรีวิวหน้าปักใช้ id ของหน้าเอง (ไม่ใช่ print-review-wall)', () => {
  const m = page('embroidery')
  assert.match(m, /id="polo-review-wall"/)
  assert.doesNotMatch(m, /id="print-review-wall"/)
})

test('แถวแบบโปโลปักจากคลังมีครบ 8 ใบ เป็นภาพตัวหน้าทั้งหมด (ไม่ใช่ใบแบบหน้า+หลัง)', () => {
  const m = page('embroidery')
  const dz = m.slice(m.indexOf('class="pp2-dz"'), m.indexOf('</section>', m.indexOf('class="pp2-dz"')))
  const rows = dz.split('<!-- /row')
  const row2 = rows[1]
  const imgs = [...row2.matchAll(/<figure class="pp2-dz__card"[^>]*>[^]*?<img src="([^"]+)"/g)].map((x) => x[1])
  assert.equal(imgs.length, 8, `มี ${imgs.length} ใบ`)
  for (const s of imgs) assert.match(s, /\/design-front\/embroider-\d+-720\.webp$/, s)
})

test('ขั้นตอนสั่งผลิตตามคู่มือ TEAMDEE: 6 ขั้น มีตรวจตัวอย่าง · จ่าย 2 จังหวะ (มัดจำ 50% ก่อนทำตัวอย่าง) · ไม่มีมัดจำค่าออกแบบ 500', () => {
  const m = page('embroidery')
  const at = m.search(/<section[^>]*id="order"/)
  const st = m.slice(at, m.indexOf('</section>', at))
  assert.match(st, /ตรวจตัวอย่าง/)
  assert.match(st, /มัดจำ 50%/)
  assert.match(st.replace(/<[^>]+>/g, '').replace(/\s+/g, ' '), /จ่ายเงิน 2 จังหวะ/)
  assert.doesNotMatch(st, /500 บาท|ค่าออกแบบ/)
  /* 12 พ.ย. อาร์ตยืนยัน "งานปักก็ได้แบบภายใน 24hr" → ขั้นวางโลโก้บอกเวลาแบบ 3D */
  assert.match(st.replace(/<[^>]+>/g, ''), /แบบ 3D ใน 24 ชม\./, 'ขั้นตอนบอกว่าได้แบบ 3D ใน 24 ชม.')
})

test('ตำแหน่งปักและรายละเอียดเสื้อจากคู่มือ TEAMDEE ขึ้นในหน้า', () => {
  const m = page('embroidery')
  for (const w of ['อกซ้าย', 'กลางหลัง', 'คอจีน', 'สาบซิป', 'แขนจั๊มผ้าทอ', 'กระเป๋าซ่อน', 'ตัดต่อสันไหล่ถึงปลายแขน', 'สีด้ายได้สูงสุด 6 สี']) assert.ok(m.includes(w), w)
  assert.match(m, /\/img\/emb-guide\/pos-map\.webp/)
})


/* 12 พ.ย. รอบ 213 อาร์ต "ใช้งานยาก คำเยอะเกินไป ให้กดเยอะเกิน ข้อมูลที่ควรให้ลูกค้าดูเลยไม่แสดง" */
const txt = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
const sec = (m, id) => { const at = m.search(new RegExp(`<section[^>]*id="${id}"`)); return m.slice(at, m.indexOf('</section>\n', at)) }

test('รายละเอียดเสื้อ 28 แบบเห็นครบไม่ต้องกด · ไม่มีแท็บ · ชื่อแบบอย่างเดียว · ไม่มีการ์ดงานลูกค้าซ้ำ', () => {
  const m = page('embroidery')
  const o = m.slice(m.search(/<section[^>]*id="options"/), m.search(/<section[^>]*id="size"/))
  assert.doesNotMatch(o, /role="tab"/, 'ไม่ซ่อนแบบไว้หลังแท็บ')
  assert.doesNotMatch(o, /\shidden[\s>]/)
  assert.equal([...o.matchAll(/class="ps2__pi"/g)].length, 28)
  assert.doesNotMatch(o, /ps2__opts|ps2__o"/, 'การ์ดงานลูกค้า 4 ใบซ้ำกับแบบด้านบน → ตัด')
  assert.doesNotMatch(txt(o), /เรียบ คลาสสิก จับคู่สีได้ง่าย/, 'คำบรรยายใต้รูปตัดออก เหลือชื่อแบบ (คำบรรยายอยู่ใน alt)')
  /* 12 พ.ย. รอบ 215 อาร์ต "ทำแบบเดิมมาได้": ตำแหน่งปักกลับเป็นการ์ดภาพ 6 ใบ + ผังเสื้อ (แบบรอบ 212) */
  assert.equal([...o.matchAll(/emb-guide\/pos-[1-6]\.webp/g)].length, 6, 'การ์ดภาพตำแหน่งปัก 6 ใบ')
  for (const w of ['6–6.5 ซม.', '7 ซม.', '10 ซม.', '15 ซม.', '4.5 × 5 นิ้ว']) assert.ok(o.includes(w), w)
})

test('ขั้นตอนสั่งมีชุดเดียว · แบบภาพใหญ่เดิม (รอบ 215 อาร์ต "ทำแบบเดิมมาได้") · เนื้อหาตามคู่มือ', () => {
  const m = page('embroidery')
  assert.doesNotMatch(m, /pp2-pf__steps/, 'การ์ด 6 ขั้นใน "ทำไมทีมดี" ซ้ำกับ #order')
  const st = sec(m, 'order')
  assert.doesNotMatch(st, /pp2-stb--c/)
  assert.equal([...st.matchAll(/class="pp2-stb__s pp2-stb__s--\d"/g)].length, 6)
  for (const w of ['100 ตัว', 'มัดจำ 50%', 'ชำระอีก 50%', 'เคลมฟรี']) assert.ok(st.includes(w), w)
})

test('วิธีชำระเงินตรงกับขั้นตอนงานปัก (มัดจำก่อนทำตัวอย่าง)', () => {
  const m = page('embroidery')
  assert.match(m, /มัดจำ 50% ก่อนทำตัวอย่าง/)
  assert.doesNotMatch(m, /มัดจำ 50% ก่อนเริ่มผลิต/)
})

test('หน้าพิมพ์ลายไม่เปลี่ยน: ยังมีขั้นตอนแบบเดิมและการ์ด 6 ขั้น', () => {
  const m = page('sublimation')
  assert.match(m, /pp2-pf__steps/)
  assert.doesNotMatch(m, /pp2-stb--c/)
})

test('ผ้า 6 ชนิดแยกอ่านได้ครบ · แต่ละผ้ามีราคาทุกช่วงจำนวนและสีที่กดเปิดได้', () => {
  const f = sec(page('embroidery'), 'fabric')
  const prices = JSON.parse(readFileSync('src/data/prices.json', 'utf8')).products.polo
  const panels = [...f.matchAll(/<article[^>]*id="fab-([a-z]+)"[^>]*>([\s\S]*?)<\/article>/g)]
  assert.deepEqual(panels.map(x => x[1]), polo.fabrics.map(x => x.id))
  for (const [markup, id, body] of panels) {
    assert.doesNotMatch(markup.split('>')[0], /\bhidden\b/, `${id} อ่านได้โดยไม่เลือกแท็บ`)
    const values = [...body.matchAll(/<td>(\d+)<\/td>/g)].map(x => Number(x[1]))
    assert.deepEqual(values, prices.bands.map(b => b.price[id]), `${id} ราคาครบทุกช่วง`)
    assert.equal([...body.matchAll(/<th scope="col"/g)].length, prices.bands.length)
    assert.match(body, /<details class="pf5__color-picker">/, `${id} สีปิดไว้ตั้งต้น`)
    const codes = [...body.matchAll(/data-code="([^"]+)"/g)].map(x => x[1]).sort()
    assert.deepEqual(codes, polo.fabrics.find(x => x.id === id).colors.map(x => x.code).sort(), `${id} สีครบ`)
    assert.match(body, /data-where="pp-price-board"/)
  }
})

test('บอร์ดผ้า + ราคา ใช้ความกว้างพิเศษ (1400) แบบเดียวกับส่วนกว้างอื่น', () => {
  const css = readFileSync('src/styles/product-page.css', 'utf8')
  assert.match(css, /\.pf2 > \.wrap \{ width: calc\(100% - 64px\); max-width: 1400px; padding-inline: 0; \}/)
})
