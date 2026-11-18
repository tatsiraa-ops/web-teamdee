/* 18 พ.ย. 2026 อาร์ต "ทำ seo แบบสุดๆ" หน้า /screen-printing/ · ตรวจ HTML ที่ export แล้ว (npm run build && npm run export:wp)
   title/description ใช้คำค้นหลัก · schema Product + Service (ราคาเป็นช่วงจาก prices.json) · FAQ ความรู้ DTF · ลิงก์ภายใน · หัวข้อมีคีย์เวิร์ด */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const head = read('wp-theme/teamdee/build/pages/screen-printing.head.html')
const body = read('wp-theme/teamdee/build/pages/screen-printing.body.html')
const site = read('site/screen-printing/index.html')
const S = JSON.parse(read('src/data/prices.json')).products.screen
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
const lds = [...(head + body).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
const all = lds.flatMap((j) => j['@graph'] || [j])

test('title/description: คำค้นหลัก รับสกรีนเสื้อ + เสื้อสกรีน · ความยาวไม่เกินที่ Google ตัด', () => {
  const title = site.match(/<title>(.*?)<\/title>/)[1]
  const desc = site.match(/<meta name="description" content="([^"]+)"/)[1]
  assert.match(title, /^รับสกรีนเสื้อ ทำเสื้อสกรีน DTF/); assert.ok(title.length <= 60, title.length)
  for (const k of ['รับสกรีนเสื้อ', 'เสื้อสกรีน', 'DTF', 'เริ่ม 5 ตัว', 'รวม VAT']) assert.ok(desc.includes(k), k)
  assert.ok(desc.length <= 170, desc.length)
})

test('schema: Product + Service ในก้อนเดียว · ราคาเป็นช่วงจาก prices.json · ไม่มีดาวรีวิว', () => {
  const p = all.find((x) => x['@type'] === 'Product')
  const s = all.find((x) => x['@type'] === 'Service')
  assert.ok(p && s)
  const own = Object.values(S.own.first).flat(); const cus = Object.values(S.customer.first).flat()
  assert.equal(p.offers.lowPrice, Math.min(...own)); assert.equal(p.offers.highPrice, Math.max(...own))
  assert.equal(p.offers.eligibleQuantity.minValue, S.minQty)
  assert.ok(Array.isArray(p.image) && p.image.length >= 3)
  assert.ok(p.description && s.description)
  assert.equal(s.provider['@id'], 'https://team-dee.com/#business')
  const [o1, o2] = s.hasOfferCatalog.itemListElement
  assert.deepEqual([o1.lowPrice, o1.highPrice, o1.eligibleQuantity.minValue], [Math.min(...own), Math.max(...own), S.minQty])
  assert.deepEqual([o2.lowPrice, o2.highPrice, o2.eligibleQuantity.minValue], [Math.min(...cus), Math.max(...cus), S.customer.minQty])
  assert.ok(!JSON.stringify(all).includes('aggregateRating'))
  for (const t of ['FAQPage', 'BreadcrumbList', 'VideoObject', 'LocalBusiness']) assert.ok(all.some((x) => x['@type'] === t), t)
})

test('FAQ: มีข้อ "สกรีน DTF คืออะไร" ทั้งบนหน้าและใน FAQPage · DFT ไม่เพิ่ม', () => {
  const faq = all.find((x) => x['@type'] === 'FAQPage')
  assert.ok(faq.mainEntity.some((q) => /สกรีน DTF คืออะไร/.test(q.name)))
  assert.match(text(body), /สกรีน DTF คืออะไร/)
  assert.equal((text(body).match(/DFT/g) || []).length, 1)
})

test('หัวข้อ H2 มีคำค้น (สกรีนเสื้อ) · ลิงก์ภายในไปหน้าที่เกี่ยวข้องครบ', () => {
  const h2 = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]))
  assert.ok(h2.some((h) => /ขั้นตอนสั่งสกรีนเสื้อ/.test(h)), 'ขั้นตอน')
  assert.ok(h2.some((h) => /สกรีนเสื้อ DTF/.test(h)), 'FAQ')
  for (const href of ['/sublimation/', '/embroidery/', '/size-chart/', '/screen-printing-order-guide/', '/corporate/', '/custom-staff-shirts/', '/event/', '/calculations/']) assert.ok(body.includes(`href="${href}`), href)
})

/* 18 พ.ย. 2026 หลังเช็คมือถือบน staging: อาร์ต "แก้ทั้งสองอย่าง ปิดป๊อปอัปหน้าคำนวณ" */
test('หน้าคำนวณไม่มีป๊อปอัปโปรโมชัน · การ์ดเสื้อของลูกค้าไม่เขียนขั้นต่ำซ้ำ', () => {
  const calc = read('wp-theme/teamdee/build/pages/calculations.body.html')
  assert.doesNotMatch(calc, /class="promo /)
  assert.match(read('wp-theme/teamdee/build/pages/corporate.body.html'), /class="promo /, 'หน้าอื่นยังมีป๊อปอัป')
  const own = body.slice(body.indexOf('id="own-shirt"'), body.indexOf('class="scw__cta"'))
  assert.match(text(own), /20 ตัว ?เริ่มสั่ง/)
  assert.doesNotMatch(text(own), /ขั้นต่ำ 20 ตัว/)
})
