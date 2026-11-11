/* ปุ่มและการ์ดของ v22 ที่หน้าสินค้า/หน้ากลุ่มต้องมี พร้อมรูปจริง (อาร์ตเคาะ 2 พ.ย. 2026 "ไล่ทุกหน้า เน้นใส่รูป")
   เทสนี้ลงถึงระดับการ์ด · tests/v22-structure.test.js ดูแค่ลำดับส่วนกับ H2 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const json = (p) => JSON.parse(read(p))
const v22P = json('docs/spec/teamdee-v22/extracted/products.json')
const v22U = json('docs/spec/teamdee-v22/extracted/uses.json')
const pages = json('src/data/product-pages.json')
const uses = json('src/data/use-pages.json')
const P = { polo: 'polo', printed: 'print', screen: 'screen', warmup: 'warmup', baseball: 'baseball', oversize: 'jersey' }
const U = { business: 'corp', shop: 'shop', organization: 'gov', education: 'edu', class: 'class', faculty: 'faculty', sport: 'sport', badminton: 'badminton', running: 'running', activity: 'event' }
const isFile = (p) => /\.webp$/.test(p || '') && existsSync(new URL(`../public${p}`, import.meta.url))

for (const [wid, id] of Object.entries(P)) {
  test(`${id}: การ์ดตัวเลือก 3 ใบของ v22 มีรูปจริง ป้ายประเภทภาพ และปุ่ม`, () => {
    const want = v22P[wid].sections[0].cards.filter((c) => c.cta?.some((t) => /ปรึกษาตัวเลือกนี้|ให้ช่วยเลือกแนวนี้/.test(t)))
    const got = pages[id].options.cards
    assert.deepEqual(got.map((c) => c.h), want.map((c) => c.h.trim()))
    for (const c of got) {
      assert.ok(isFile(c.img), `${c.h}: ${c.img}`)
      assert.ok(c.alt, c.h)
      assert.match(c.tag, /^ภาพ(จริง| 3D|แบบ)$/, c.h)
      assert.ok(c.cta && c.brief, c.h)
    }
  })
}

test('การ์ดรายละเอียด: ทุกหน้า (ยกเว้นสกรีนที่ใช้ชุดของตัวเอง) มีรูปจริงครบ', () => {
  for (const id of ['polo', 'print', 'warmup', 'baseball', 'jersey']) {
    for (const c of pages[id].detail.cards) assert.ok(isFile(c.img), `${id} ${c.h}: ${c.img}`)
  }
})

test('รูปในการ์ดตัวเลือก + รายละเอียดของแต่ละหน้าไม่ซ้ำกัน', () => {
  for (const id of Object.values(P)) {
    const imgs = [...pages[id].options.cards, ...pages[id].detail.cards].map((c) => c.img).filter(isFile)
    assert.equal(new Set(imgs).size, imgs.length, id)
  }
})

for (const [wid, id] of Object.entries(U)) {
  test(`${id}: ปุ่มของ v22 ในส่วนวางงบ ภาพลูกค้า และทีมมีข้อความตามเรื่อง`, () => {
    const sec = (k) => v22U[wid].sections.find((s) => s.key === k)
    const asks = (k) => sec(k).links.filter((l) => l.brief).map((l) => l.t.trim())
    const up = uses[id]
    assert.deepEqual(up.plan.asks.map((a) => a.t), asks('plan'))
    assert.ok(up.plan.asks.every((a) => a.brief))
    assert.ok(asks('team')[0].startsWith(up.team.ask.t), up.team.ask.t)
    assert.ok(up.team.place.t)
    assert.ok(up.help.cta && up.schedule.cta)
  })
}

test('แม่แบบหน้าสินค้า: ปุ่มเช็กคิวใน FAQ · ชื่อปุ่มตาม v22 · ไม่กลับไปใช้ชื่อเดิม', () => {
  assert.match(read('src/partials/ppFaq.hbs'), /เช็กคิวตามวันใช้เสื้อ/)
  assert.match(read('src/partials/ppFabric.hbs'), /ขอดูตัวอย่างผ้า/)
  assert.match(read('src/partials/ppReviews.hbs'), /ดูรีวิวเพิ่มเติม/)
  assert.doesNotMatch(read('src/partials/ppWork.hbs'), /อยากได้แบบนี้/)
})

test('แม่แบบหน้ากลุ่ม: ใช้ปุ่มของ v22 และมีปุ่มดูภาพลูกค้าเพิ่มเติม', () => {
  const t = read('src/partials/usePage.hbs')
  for (const s of ['up.help.cta', 'up.schedule.cta', 'up.plan.asks', 'up.team.ask.t', 'ดูภาพลูกค้าเพิ่มเติม', 'ดูผ้า ทรง และรายละเอียด', 'ดูรีวิวเพิ่มเติม']) assert.ok(t.includes(s), s)
})
