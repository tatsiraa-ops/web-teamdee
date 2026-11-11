import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { heroPrice } from '../src/js/prices.js'
import { lineMessageUrl } from '../src/js/contact-send.js'
import { homeView } from '../src/js/home-view.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const data = (p) => JSON.parse(read(`src/data/${p}.json`))

test('หน้าแรกใช้ราคาที่ระบุคอเสื้อและส่วนต่างจากตารางเดียวกัน', () => {
  assert.match(read('vite.config.js'), /const price = heroPrice\(prices, c.id\)/)
  const price = heroPrice(data('prices'), 'print')
  assert.match(price.v, /279.*10–20/)
  assert.match(price.sub, /คอกลม \/ คอวี/)
  assert.match(price.sub, /160.*200/)
  assert.match(price.sub, /คอปก \+50/)
})

test('TD-0008 เป็นทรงโปโล โดยคงเทคนิคและกลุ่มใช้งานเดิม', () => {
  const d = data('designs').find((d) => d.code === 'TD-0008')
  assert.equal(d.garment, 'polo')
  assert.equal(d.garmentName, 'เสื้อโปโล')
  assert.equal(d.tech, 'print')
  assert.deepEqual(d.use, ['corp'])
})

test('FAQ ไซซ์ตรงหน้าอ้างอิง และลิงก์สั่งซ้ำใน 8 คุณสมบัติยังอยู่', () => {
  for (const forWp of [false, true]) {
    const h = homeView(data('home'), { forWp, years: 8 })
    const size = h.faq.items.find(([q]) => q === 'เลือกไซซ์และตรวจแบบอย่างไร?')
    assert.equal(size[1], 'ใช้ตารางตามสินค้าและทรง พร้อมตรวจภาพแบบ โลโก้ จำนวน และรายการไซซ์ก่อนยืนยันผลิต')
    const reorder = h.benefits.items.find((b) => b.h === 'สั่งเพิ่มแบบเดิม ราคาเดิม')
    assert.equal(reorder.link, 'contact')
    assert.equal(reorder.linkQ, '?from=reorder')
  }
  assert.ok(read('src/partials/homeReference-faq.hbs').includes('เลือกไซซ์และตรวจแบบอย่างไร?'))
})

test('ป๊อปอัปขอผ้าตัวอย่าง (30 ต.ค. อาร์ต: เลิกเน้นงานด่วน) แนบช่องให้เติมใน LINE โดยไม่เปลี่ยนข้อความโฆษณา', () => {
  const p = data('promo').items.find((p) => p.id === 'fabric-sample')
  assert.equal(p.cta.to, 'line')
  for (const s of ['ผ้าตัวอย่าง', 'ประเภทเสื้อที่สนใจ:', 'จำนวนประมาณ:', 'ที่อยู่จัดส่งผ้าตัวอย่าง:']) assert.ok(p.cta.message.includes(s), s)
  const href = lineMessageUrl(p.cta.message)
  assert.equal(decodeURIComponent(href.split('?')[1]), p.cta.message)
  assert.ok(read('vite.config.js').includes('p.cta.message ? lineMessageUrl(p.cta.message) : data.site.lineUrl'))
})
