/* 16 พ.ย. 2026 อาร์ต: "การ์ดรีวิว (ส่วนรีวิว) · คำรีวิวในแท็บ — สองอันบนเอารวมกันได้เลย คนละประเภทลูกค้าไม่เป็นไร เอาให้ครบๆ"
   กติกา (src/js/review-pool.js):
   - คลังเดียว = รีวิวจริงทั้งหมดใน reviews.json · ทุกหน้าได้ครบทุกราย แบ่งไปแท็บ + ส่วนรีวิว · ในหน้าเดียวไม่ซ้ำ
   - เรียงตามความใกล้ของกลุ่ม: รีวิวของหน้านี้ (own) ก่อน → กลุ่มใกล้เคียง
   - ทุกแท็บมีคำรีวิว · แท็บที่ใส่รีวิวไว้เดิมคงไว้ · แท็บว่างเติมจากกลุ่มอื่น (เก็บรีวิว own ไว้ขึ้นส่วนรีวิว)
   - ส่วนรีวิว: own ก่อน แล้วรีวิวกลุ่มอื่น (มีป้ายคั่น) · หน้าไม่มี own ใช้หัวข้อกลาง */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { planReviews, poolFor, OWN } from '../src/js/review-pool.js'
import { ppV2, useV2 } from '../src/build/content.js'

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'))
const REVIEWS = read('src/data/reviews.json').items
const V2 = useV2()
const PAGES = ['corp', 'shop', 'gov', 'edu', 'faculty', 'class', 'sport', 'badminton', 'running', 'event']
const SLUG = { corp: 'corporate', shop: 'custom-staff-shirts', gov: 'custom-organization-shirts', edu: 'education', faculty: 'custom-university-shirts', class: 'custom-class-shirts', sport: 'sport', badminton: 'custom-badminton-shirts', running: 'custom-running-shirts', event: 'event' }
const ALL = REVIEWS.map((r) => r.id)

test('ทุกหน้า: แท็บทุกแท็บมีรีวิว · แท็บ + ส่วนรีวิว = รีวิวครบทุกราย ไม่ซ้ำ', () => {
  for (const id of PAGES) {
    const tabs = V2[id].contexts.tabs
    const p = planReviews(id, REVIEWS, tabs)
    assert.equal(p.tabs.length, tabs.length, id)
    assert.ok(p.tabs.every((t) => t.review), `${id}: แท็บไม่มีรีวิว`)
    const used = [...p.tabs.map((t) => t.review), ...p.board.map((b) => b.id)]
    assert.equal(new Set(used).size, used.length, `${id}: รีวิวซ้ำในหน้า`)
    assert.deepEqual([...used].sort(), [...ALL].sort(), `${id}: ไม่ครบทุกราย`)
  }
})

/* รีวิว own ขึ้นส่วนรีวิวเสมอ (การ์ดใหญ่ มีรูปและปุ่ม LINE) · เดิมบางหน้าใส่ own ไว้ในแท็บ (แบด วิ่ง) ทำให้ส่วนรีวิวไม่มีรีวิวของกลุ่มเลย */
test('แท็บไม่มีรีวิว own · แท็บที่ใส่รีวิวกลุ่มอื่นไว้เดิมคงไว้', () => {
  for (const id of PAGES) {
    const tabs = V2[id].contexts.tabs
    const p = planReviews(id, REVIEWS, tabs)
    tabs.forEach((t, i) => {
      const r = REVIEWS.find((x) => x.id === p.tabs[i].review)
      assert.ok(!OWN[id](r), `${id}/${t.id}: รีวิว own อยู่ในแท็บ`)
      if (t.review && !OWN[id](REVIEWS.find((x) => x.id === t.review))) assert.equal(p.tabs[i].review, t.review, `${id}/${t.id}`)
    })
  }
})

test('ส่วนรีวิว: own ขึ้นก่อนทั้งหมด แล้วค่อยกลุ่มอื่น · own ของหน้าตามที่อาร์ตเคาะ', () => {
  for (const id of PAGES) {
    const b = planReviews(id, REVIEWS, V2[id].contexts.tabs).board
    const firstOther = b.findIndex((x) => !x.own)
    if (firstOther >= 0) assert.ok(b.slice(firstOther).every((x) => !x.own), `${id}: own ปนหลังกลุ่มอื่น`)
  }
  const own = (id) => planReviews(id, REVIEWS, V2[id].contexts.tabs).board.filter((x) => x.own).map((x) => x.id)
  assert.deepEqual(own('shop'), ['resort'])
  assert.deepEqual(own('badminton'), ['krungthai-badminton'])
  assert.deepEqual(own('running'), ['runners'])
  assert.deepEqual(own('faculty'), [])
  assert.deepEqual(own('class'), [])
  /* กลุ่มใกล้เคียงขึ้นก่อนกลุ่มไกล: หน้าวิ่ง → รีวิวกีฬาก่อนโรงเรียน */
  const run = planReviews('running', REVIEWS, V2.running.contexts.tabs).board.map((x) => x.use)
  assert.ok(run.lastIndexOf('sport') < run.indexOf('school'), 'หน้าวิ่ง: กีฬาก่อนโรงเรียน')
})

const page = (id) => new URL(`../wp-theme/teamdee/build/pages/${SLUG[id] || id}.body.html`, import.meta.url)
const txt = (html) => html.replace(/<[^>]+>/g, '')
const rvSection = (h) => { const at = h.indexOf('<section class="hm-customer-proof up2-rv"'); return at < 0 ? '' : h.slice(at, h.indexOf('</section>', at)) }
/* 16 พ.ย. 2026 อาร์ต (ภาพการ์ดรีวิว 2 คอลัมน์) "เอารวมมาในแถวเดียวพอครับ มีลูกศรให้กดเลื่อนๆ" → แถวเดียว เลื่อนแนวนอน + ปุ่มลูกศร (review-board.js initReviewRows) */
const rowOk = (sec, id, n) => {
  assert.match(sec, /<div class="rvrow" data-rvrow>/, `${id}: แถวรีวิว`)
  assert.match(sec, /<button type="button" class="rvrow__btn" data-rvrow-prev aria-label="รีวิวก่อนหน้า"/, `${id}: ลูกศรซ้าย`)
  assert.match(sec, /<button type="button" class="rvrow__btn" data-rvrow-next aria-label="รีวิวถัดไป"/, `${id}: ลูกศรขวา`)
  const track = sec.slice(sec.indexOf('class="rvrow__track"'))
  assert.equal((track.match(/data-rvb-item/g) || []).length, n, `${id}: การ์ดในแถว`)
  assert.doesNotMatch(sec, /data-rvb-step|up2-rv__board--all|up2-rv__more/, `${id}: ไม่มีแบบเดิม`)
  /* 16 พ.ย. 2026 อาร์ต "ตัดบรรทัดแปลกๆ": การ์ดแคบ ก้อนวลีที่ห้ามหัก (inline-block) หล่นลงบรรทัดใหม่ทั้งก้อน เหลือ "NT" บรรทัดเดียว → ชื่อกับคำรีวิวตัดตามคำปกติ */
  for (const m of track.matchAll(/<p class="hm-rvb__who"><b>([\s\S]*?)<\/b>|<blockquote class="hm-rvb__q"><p>([\s\S]*?)<\/p>/g)) assert.doesNotMatch(m[1] || m[2], /class="inline-block"/, `${id}: ข้อความการ์ดไม่ห่อก้อนวลี`)
}
test('หน้ากลุ่มลูกค้า: ส่วนรีวิวเป็นแถวเดียวมีลูกศร · การ์ด = รีวิวที่ไม่อยู่ในแท็บ · คำรีวิวครบทุกแท็บ · หน้าไม่มี own ใช้หัวข้อกลาง', { skip: !existsSync(page('corp')) }, () => {
  for (const id of PAGES) {
    const h = readFileSync(page(id), 'utf8')
    const sec = rvSection(h)
    assert.ok(sec, `${id}: ไม่มีส่วนรีวิว`)
    const p = planReviews(id, REVIEWS, V2[id].contexts.tabs)
    rowOk(sec, id, p.board.length)
    if (!p.board.some((x) => x.own)) assert.equal(txt(sec.match(/<h2 id="up2-rv-h">([\s\S]*?)<\/h2>/)[1]), 'รีวิวจากลูกค้าที่สั่งทำเสื้อกับทีมดี', `${id}: หัวข้อกลาง`)
    const cx = h.slice(h.indexOf('<section class="up2-ctx"'), h.indexOf('</section>', h.indexOf('<section class="up2-ctx"')))
    assert.equal((cx.match(/class="up2-ctx__rv"/g) || []).length, V2[id].contexts.tabs.length, `${id}: คำรีวิวในแท็บ`)
    /* แถวรูปบนสุด: 10 รูปเหมือนหน้าที่จัดมือ (2 แถวเต็ม) · ไม่มีรูปซ้ำ */
    const wallSrc = [...sec.slice(sec.indexOf('up2-rv__wall'), sec.indexOf('</ul>', sec.indexOf('up2-rv__wall'))).matchAll(/<img src="([^"]+)"/g)].map((m) => m[1])
    assert.ok(wallSrc.length >= 9, `${id}: แถวรูปรีวิว ${wallSrc.length}`)
    assert.equal(new Set(wallSrc).size, wallSrc.length, `${id}: รูปซ้ำในแถว`)
  }
})

/* 16 พ.ย. อาร์ต (ภาพหน้างานปัก "รีวิวจากลูกค้าองค์กร 1/2") "แก้ตรงภาพแรกด้วย": หน้าสินค้าก็ใช้คลังเดียว รีวิวที่เลือกไว้ก่อน แล้วรีวิวที่เหลือครบทุกราย */
/* 16 พ.ย. 2026 อาร์ตให้หน้าพิมพ์ลายเติมเหมือนกัน (รายที่เห็นเสื้อพิมพ์ลายขึ้นก่อน · tests/pp-v2.test.js) */
test('หน้าสินค้า: งานปักและพิมพ์ลายเติมรีวิวครบทุกราย (ที่เลือกไว้ขึ้นก่อน) · ทั้งสองหน้าเป็นแถวเลื่อน', { skip: !existsSync(page('embroidery')) }, () => {
  const PP = ppV2()
  for (const [id, key, n] of [['embroidery', 'polo', REVIEWS.length], ['sublimation', 'print', REVIEWS.length]]) {
    const sec = rvSection(readFileSync(page(id), 'utf8'))
    rowOk(sec, id, n)
    const ids = [...sec.matchAll(/data-rvb-item data-use="[a-z]+" data-rv-id="([^"]+)"/g)].map((m) => m[1])
    assert.deepEqual(ids.slice(0, PP[key].reviews.items.length), PP[key].reviews.items, `${id}: รีวิวที่เลือกไว้ขึ้นก่อน`)
    assert.equal(new Set(ids).size, n, `${id}: ไม่ซ้ำ`)
  }
})

/* 16 พ.ย. 2026 อาร์ต "ภาพสองรีวิวตรงหน้าปักน้อยๆ" (หน้า /embroidery/ มี 3 รูป) → แถวรูปทุกหน้าเติมให้ครบ 10 ด้วยกติกาเดียว (topUpWall) */
test('topUpWall: เก็บรูปที่จัดไว้ก่อน แล้ววนหยิบรูปที่ 1 ของทุกรีวิว รูปที่ 2 … ไม่ซ้ำ จนครบ', async () => {
  const { topUpWall } = await import('../src/js/review-pool.js')
  const lib = [{ path: '/img/review/b1.webp', w: 900, h: 1200 }]
  const wall = [{ img: 'a1', w: 1200, h: 900, review: 'a' }]
  const rv = [{ id: 'a', img: '/img/review/a1.webp', gallery: [{ img: '/img/review/a1.webp' }, { img: '/img/review/a2.webp' }] }, { id: 'b', img: '/img/review/b1.webp' }, { id: 'c' }]
  const out = topUpWall(wall, rv, lib, 3)
  assert.deepEqual(out.map((w) => w.img), ['a1', 'b1', 'a2'])
  assert.deepEqual(out[1], { img: 'b1', w: 900, h: 1200, review: 'b' })
  assert.equal(wall.length, 1, 'ไม่แก้ของเดิม')
  assert.equal(topUpWall(wall, [], lib, 10).length, 1, 'ไม่มีรูปให้เติม = คงเดิม')
})

test('หน้างานปัก /embroidery/: แถวรูปรีวิวครบ 10 รูป ไม่ซ้ำ', { skip: !existsSync(new URL('../wp-theme/teamdee/build/pages/embroidery.body.html', import.meta.url)) }, () => {
  const h = readFileSync(new URL('../wp-theme/teamdee/build/pages/embroidery.body.html', import.meta.url), 'utf8')
  const wall = h.slice(h.indexOf('id="pp2RvWall"'), h.indexOf('</ul>', h.indexOf('id="pp2RvWall"')))
  const imgs = [...wall.matchAll(/<li[^>]*><button type="button" data-rv-open="[^"]+"><img src="([^"]+)"/g)].map((m) => m[1])
  assert.equal(imgs.length, 10)
  assert.equal(new Set(imgs).size, 10)
})

test('แถวรูปรีวิวบนคอม: 5 รูปแรกแถวบน ที่เหลือแถวล่าง (รูปพาโนรามาไม่ดันรูปสุดท้ายไปอยู่เดี่ยวแถวที่ 3 · เจอหน้างานปัก 16 พ.ย.)', () => {
  const css = readFileSync(new URL('../src/styles/review-wall.css', import.meta.url), 'utf8')
  const desk = css.slice(css.indexOf('@media (min-width: 1024px) { /* wall-rows */'))
  assert.ok(desk.length > 0, 'มีกฎบนคอม')
  assert.match(desk, /\.up2-rv__wall::after \{ content: ''; order: 1; flex: 0 0 100%; height: 0; \}/)
  assert.match(desk, /\.up2-rv__wall > li:nth-child\(n\+6\) \{ order: 2; \}/)
  assert.match(desk, /\.up2-rv__wall > li \{ flex: var\(--r\) 1 0; \}/)
})

/* 17 พ.ย. 2026 B4 npm run new:page: กลุ่มใหม่ยังไม่มีในตาราง OWN/PICK/RELATED → poolFor พัง (own is not a function) build ล้ม
   กลุ่มที่ไม่รู้จัก = ไม่มีรีวิวของกลุ่มเอง ใช้รีวิวทั้งหมดตามลำดับเดิม */
test('poolFor / planReviews: กลุ่มใหม่ที่ยังไม่มีในตาราง ไม่พัง', () => {
  const reviews = [{ id: 'a', use: 'corp', img: 'x' }, { id: 'b', use: 'sport' }]
  assert.deepEqual(poolFor('new-group', reviews).map((r) => [r.id, r.own]), [['a', false], ['b', false]])
  assert.doesNotThrow(() => planReviews('new-group', reviews, []))
})
