/* 13 พ.ย. 2026 ตรวจหน้า /embroidery/ ทั้งหน้า (อาร์ต "ไปตรวจสอบหน้าปักมาทั้งหน้า … ห้ามอวย" → "เริ่มได้ทั้งหมดยกเว้นข้อ 3")
   ข้อ 3 = ความยาวหน้า/ลำดับส่วน ไม่แตะ · ที่แก้: ภาพงานปักจริงจากไดรฟ์ VDO/งานปัก (เฟรมวิดีโอ 4K ของทีมดี · อาร์ต "ใช้ได้ทุกเฟรม")
   ลบภาพที่มีเบอร์โทรลูกค้า · ราคามือถือเห็นครบทุกช่วง · คลังภาพลูกค้าขึ้นกลุ่มบริษัทก่อน · ข้อความซ้ำ · จุดกด 44px · ตัวหนังสือ ≥ 12px
   อ่านจาก dist-wp (npm run export:wp ก่อนรัน) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (f) => readFileSync(f, 'utf8')
const main = (() => { const h = read('dist-wp/embroidery/index.html'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') })()
const text = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const secBy = (re) => { const at = main.search(re); assert.ok(at >= 0, `ไม่พบส่วน ${re}`); return main.slice(at, main.indexOf('</section>', at)) }
const css = (read('src/styles/pp-base.css') + read('src/styles/product-page.css')).replace(/\/\*[\s\S]*?\*\//g, '')
const pub = (s) => existsSync(`public${s}`)
const REAL = ['sample', 'machine'] // เฟรมวิดีโอจริงที่ยังใช้ (ขั้น 03 · 05)
const GEN = ['logo', 'digitize', 'thread', 'hoop', 'position', 'heads', 'needle', 'sample', 'trim', 'qc', 'pack', 'operator', 'positions']
const LOOPS = ['logo', 'machine', 'heads', 'thread']

test('ไฟล์ภาพส่วนงานปักมีครบ: เฟรมจริงของขั้นตอน · ภาพประกอบ 13 ใบ + แบนเนอร์ · ภาพเคลื่อนไหวจริง 4 คลิป', () => {
  for (const n of REAL) for (const w of [640, 1280]) assert.ok(pub(`/img/emb-real/${n}-${w}.webp`), `${n}-${w}`)
  for (const n of GEN) for (const w of [640, 1024, 1440]) assert.ok(pub(`/img/emb-real/g-${n}-${w}.webp`), `g-${n}-${w}`)
  for (const w of [760, 1200, 1600]) assert.ok(pub(`/img/emb-real/g-banner-${w}.webp`), `g-banner-${w}`)
  for (const n of LOOPS) for (const e of ['mp4', 'webp']) assert.ok(pub(`/img/emb-real/loop-${n}.${e}`), `loop-${n}.${e}`)
})

/* 13 พ.ย. รอบ 2 (อาร์ต "ไม่ผ่าน ใช้ภาพเจนหรืออะไรมาได้เต็มที่ ทำให้มันครบกว่าพิมพ์ลาย"): การ์ดจากเฟรมวิดีโอดิบไม่ผ่าน (ไม่คม มุมภาพไม่ดี)
   → ภาพสมจริง Nano Banana 2.1 อ้างอิงเครื่องปัก / โลโก้ปัก / แบบเสื้อจริงของทีมดี · แบนเนอร์ + 13 การ์ด (พิมพ์ลายมี 10) + ภาพเคลื่อนไหวจริง 4 ช่อง + คลิป */
test('ส่วนงานจริงครบกว่าหน้าพิมพ์ลาย: แบนเนอร์ + การ์ดเบื้องหลัง 13 ใบ + ภาพเคลื่อนไหวจริง 4 ช่อง + คลิปงานปัก · บอกชัดว่าภาพไหนเป็นภาพประกอบ', () => {
  const pf = secBy(/<section class="pp2-pf"/)
  assert.match(pf, /<figure class="pp2-pf__ban">\s*<img src="[^"]*\/img\/emb-real\/g-banner-1200\.webp"/)
  const cards = [...pf.matchAll(/<li class="pp2-pf__bc[^"]*"><img src="([^"]+)"[^>]*alt="([^"]+)"/g)]
  assert.equal(cards.length, 13)
  const print = read('dist-wp/sublimation/index.html')
  assert.ok(cards.length > [...print.matchAll(/<li class="pp2-pf__bc/g)].length, 'การ์ดเบื้องหลังมากกว่าหน้าพิมพ์ลาย')
  for (const [, src, alt] of cards) { assert.match(src, /\/img\/emb-real\/g-/, src); assert.doesNotMatch(alt, /^(ภาพจำลอง|ภาพประกอบ)/, alt); assert.doesNotMatch(alt, /พิมพ์ลาย/) }
  const loops = [...pf.matchAll(/<video[^>]*data-loop[^>]*>/g)].map((m) => m[0])
  assert.equal(loops.length, 4)
  for (const v of loops) { assert.match(v, / muted /); assert.match(v, / loop /); assert.match(v, / playsinline /); assert.match(v, /preload="none"/); assert.match(v, /poster="[^"]*\/img\/emb-real\/loop-[a-z]+\.webp"/); assert.match(v, /aria-label="[^"]+"/) }
    assert.doesNotMatch(text(pf), /ภาพประกอบ|ภาพจำลอง/, 'ไม่มีหมายเหตุภาพประกอบ (อาร์ต 16 พ.ย.)')
  assert.match(pf, /embroidery-asmr|งานปักโลโก้บนเสื้อโปโล/)
  const js = read('src/js/product-page.js')
  assert.match(js, /\[data-loop\]/)
  assert.match(js, /prefers-reduced-motion/, 'ภาพเคลื่อนไหวไม่เล่นเองเมื่อผู้ใช้ตั้งค่าลดการเคลื่อนไหว')
})

test('ขั้นตอน: ขั้น 03 ตรวจตัวอย่าง และ 05 ผลิต ใช้ภาพงานปักจริง · หมายเหตุบอกชัดว่าขั้นไหนจริง ขั้นไหนภาพประกอบ', () => {
  const st = secBy(/<section[^>]*id="order"/)
  const photo = (n) => st.match(new RegExp(`id="step-${n}"[\\s\\S]*?<img src="([^"]+)"[^>]*alt="([^"]+)"`))
  assert.match(photo(3)[1], /\/img\/emb-real\/sample-/)
  assert.match(photo(5)[1], /\/img\/emb-real\/machine-/)
  for (const n of [3, 5]) assert.doesNotMatch(photo(n)[2], /ภาพประกอบ/)
  assert.doesNotMatch(text(st), /ภาพประกอบ|ภาพจำลอง/) /* 16 พ.ย. 2026 อาร์ต "ไม่เอาป้ายภาพจำลอง" → "เอาออกทั้งหมด": ไม่มีป้ายภาพจำลอง/ภาพประกอบ (tests/no-image-labels.test.js) */
})

test('ไม่มีข้อมูลติดต่อของลูกค้าในภาพ: การ์ด "งานปักพิเศษ" เป็นภาพงานปักจริงใหม่ (ไม่ใช่แพตช์ที่มีเบอร์โทรร้านลูกค้า)', () => {
  const o = secBy(/<section[^>]*id="options"/)
  /* 16 พ.ย. 2026 ตำแหน่งปักเป็นผังเสื้อมีเส้นชี้ · งานปักพิเศษเหลือแถบข้อความ ไม่มีภาพ (แพตช์เดิมที่มีเบอร์โทรร้านลูกค้าไม่กลับมา) */
  assert.doesNotMatch(o, /emb-guide\/pos-6\.webp/)
  assert.match(o, /class="ps2__special"/)
  assert.doesNotMatch(text(main), /081[ -]?592/)
})

test('ราคา: มือถือเห็นครบทุกผ้า × ทุกช่วงจำนวน ไม่ต้องกดเลือกช่วง (show, don\'t hide)', () => {
  const f = secBy(/<section[^>]*id="fabric"/)
  assert.doesNotMatch(f, /class="pf4__q"|pf4__qty/, 'ไม่มีชิปเลือกช่วงจำนวน')
  assert.doesNotMatch(css, /:not\(\.is-band\)/, 'CSS ไม่ซ่อนคอลัมน์ราคา')
  assert.doesNotMatch(read('src/js/polo-fabric.js'), /is-band/)
  /* 16 พ.ย. 2026: ตารางรวมเดิม (ผ้า × ช่วงจำนวน ตารางเดียว) เปลี่ยนเป็นการ์ดผ้าละใบ แต่ละใบมีตารางราคาครบ 6 ช่วงจำนวน
     เจตนาเดิมยังอยู่: ทุกผ้า × ทุกช่วงเห็นพร้อมกัน ไม่ต้องกด ไม่มีอะไรซ่อน */
  const tables = [...f.matchAll(/<table>[\s\S]*?<\/table>/g)].map((m) => m[0])
  assert.equal(tables.length, 6, 'ผ้า 6 ชนิด ตารางละผ้า')
  for (const t of tables) {
    assert.equal([...t.matchAll(/<th scope="col"/g)].length, 6, 'ครบ 6 ช่วงจำนวน')
    assert.equal([...t.matchAll(/<td>[^<]+<\/td>/g)].length, 6, 'มีราคาทุกช่อง')
  }
  assert.doesNotMatch(f, /<table[^>]*hidden|<tr[^>]*hidden|<td[^>]*hidden/)
})

test('คลังภาพลูกค้าท้ายหน้า: 12 รูปแรกเป็นกลุ่มบริษัท/องค์กร (ตรงกับคนสั่งโปโลปัก) ไม่ใช่คละเสื้อกีฬา', () => {
  const w = secBy(/<section[^>]*id="polo-review-wall"/)
  const lib = JSON.parse(read('src/data/media-library.json')).items
  const corp = new Set(lib.filter((x) => (x.groups || []).includes('corp') || (x.primary || []).includes('corp')).map((x) => x.path.split('/').pop().replace(/\.webp$/, '')))
  const first = [...w.matchAll(/<img[^>]*src="[^"]*\/([^"/]+?)(?:-\d+)?\.webp"/g)].slice(0, 12).map((x) => x[1])
  assert.equal(first.length, 12)
  assert.deepEqual(first.filter((n) => !corp.has(n)), [])
})

test('ข้อความ: หัวแถวแบบ 3D ไม่อ้าง "ลูกค้าจริง" คู่กับภาพ 3D · ไม่พูดซ้ำ · H2 แรกไม่ขึ้นต้นซ้ำ H1', () => {
  const dz = secBy(/<section class="pp2-dz"/)
  assert.doesNotMatch(text(dz), /งานปักของลูกค้าจริง · ภาพ 3D/)
  const t = text(main)
  assert.ok((t.match(/ปักโลโก้ฟรี 1 จุด/g) || []).length <= 2, 'ปักโลโก้ฟรี 1 จุด ไม่เกิน 2 ที่')
  assert.ok((t.match(/ภายใน 24 ชม\./g) || []).length <= 1, 'ภายใน 24 ชม. ไม่เกิน 1 ที่')
  const h2 = [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((x) => text(x[1]).trim())
  assert.doesNotMatch(h2[0], /^รับทำเสื้อโปโลปัก/)
  assert.equal(new Set(h2).size, h2.length, 'ไม่มี H2 ซ้ำกัน')
})

test('ส่วนชำระเงินมีหัวข้อ H2 ให้โครงหน้าและโปรแกรมอ่านจอ', () => {
  const p = secBy(/<section[^>]*id="payment"/)
  assert.match(p, /<h2[^>]*>วิธีชำระเงิน<\/h2>/)
})

test('จุดกดอย่างน้อย 44px · ตัวหนังสือเล็กสุด 12px (product-page.css)', () => {
  const rule = (sel) => { const m = css.match(new RegExp(`(?:^|})\\s*${sel.replace(/[.[\]()>+*]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm')); assert.ok(m, `ไม่พบกฎ ${sel}`); return m[1] }
  assert.match(rule('.pp2-dz-ctl button'), /width: 44px; height: 44px/)
  assert.match(rule('.pp2-sz__seg button'), /min-height: 44px/)
  assert.match(css, /\.pp2-stb__map a \{[^}]*min-height: 44px/)
  /* 16 พ.ย. เพิ่มหัวช่วงจำนวนในตารางราคาการ์ดผ้า (pf5__prices) ที่เคยย่อเหลือ 10px บนมือถือ */
  const small = [...css.matchAll(/([^{}]+)\{([^{}]*font-size:\s*(\d+(?:\.\d+)?)px[^{}]*)\}/g)].filter((m) => +m[3] < 12 && /pf2__code|pp2-sz__bub|pp2-stb__tt|pp2-sz__t caption|pf5__prices/.test(m[1])).map((m) => `${m[1].trim()} ${m[3]}px`)
  assert.deepEqual(small, [])
})

test('ตารางไซซ์บนมือถือ: มีป้ายบอกว่าเลื่อนข้างเพื่อดูไซซ์ใหญ่ได้', () => {
  const s = secBy(/<section[^>]*id="size"/)
  assert.match(s, /class="pp2-sz__hint"/)
  assert.match(css, /\.pp2-sz__hint \{[^}]*display: none/)
})
