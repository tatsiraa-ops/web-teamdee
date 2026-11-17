import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { faqSchema, businessSchema, ldJson } from '../src/js/seo-schema.js'

test('FAQ schema ใส่เฉพาะคำตอบที่ยืนยันแล้ว ไม่มี [วงเล็บ]', () => {
  const s = faqSchema([['ถามหนึ่ง', 'ตอบครบ'], ['ถามสอง', 'ยังรอ [รอยืนยัน]'], ['[ถาม]', 'ตอบ']])
  assert.equal(s['@type'], 'FAQPage')
  assert.deepEqual(s.mainEntity.map((q) => q.name), ['ถามหนึ่ง'])
  assert.equal(s.mainEntity[0].acceptedAnswer.text, 'ตอบครบ')
})

test('ไม่มีคำตอบที่ยืนยันแล้วเลย = ไม่ใส่ FAQ schema', () => {
  assert.equal(faqSchema([['ถาม', '[รอ]']]), null)
  assert.equal(faqSchema([]), null)
})

test('ข้อมูลธุรกิจมีโลโก้ รูป เวลาทำการ เป็น URL เต็ม', () => {
  const b = businessSchema({ brand: 'TEAMDEE', baseUrl: 'https://team-dee.com', phonePrimary: '097', address: 'นนท์', ogImage: '/img/a.jpg', openingHours: 'Mo-Su 08:30-21:00' })
  assert.equal(b['@type'], 'LocalBusiness')
  /* 17 พ.ย. 2026 แผน SEO/GEO A4: โลโก้ PNG สี่เหลี่ยม (Google ไม่อ่าน SVG สี currentColor · ขั้นต่ำ 112px) · เวลาแบบ openingHoursSpecification */
  assert.equal(b.logo, 'https://team-dee.com/apple-touch-icon.png')
  assert.equal(b.image, 'https://team-dee.com/img/a.jpg')
  assert.equal(b.openingHours, undefined)
  assert.deepEqual(b.openingHoursSpecification, [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '08:30', closes: '21:00' }])
  assert.equal(b.alternateName, 'ทีมดี')
  assert.equal(b.url, 'https://team-dee.com/')
})

test('A4: openingHoursSpec แปลงหลายช่วง · priceRange จาก prices.json (ไม่รวมพิมพ์ลาย)', async () => {
  const { openingHoursSpec, priceRangeOf } = await import('../src/js/seo-schema.js')
  assert.deepEqual(openingHoursSpec('Mo-Fr 08:30-18:00, Sa 09:00-12:00'), [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '12:00' },
  ])
  assert.deepEqual(openingHoursSpec(''), [])
  const prices = JSON.parse(readFileSync(new URL('../src/data/prices.json', import.meta.url), 'utf8'))
  assert.equal(priceRangeOf(prices), '฿170–390 ต่อตัว')
  const b = businessSchema({ brand: 'TEAMDEE', baseUrl: 'https://team-dee.com', address: 'x', ogImage: '/a.jpg' }, { priceRange: '฿170–390 ต่อตัว' })
  assert.equal(b.priceRange, '฿170–390 ต่อตัว')
})

test('ldJson กันปิดแท็ก script ในข้อความ', () => {
  assert.ok(!ldJson({ a: '</script>' }).includes('</script>'))
  assert.equal(JSON.parse(ldJson({ a: '</script>' })).a, '</script>')
})

test('LocalBusiness มี @id ให้ Google รวมกับ schema ของปลั๊กอิน · เบอร์ +66 · ที่อยู่แยกช่อง · ปีก่อตั้ง · sameAs (agent SEO 23 ต.ค.)', () => {
  const b = businessSchema({ brand: 'TEAMDEE', baseUrl: 'https://team-dee.com', phonePrimaryTel: '0975495941', address: '264 ถนนเลี่ยงเมืองนนท์ ตำบลตลาดขวัญ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000', ogImage: '/img/a.jpg', foundedYear: 2018, lineUrl: 'https://line.me/R/ti/p/@teamdee' })
  assert.equal(b['@id'], 'https://team-dee.com/#business')
  assert.equal(b.telephone, '+66975495941')
  assert.equal(b.foundingDate, '2018')
  assert.deepEqual(b.sameAs, ['https://line.me/R/ti/p/@teamdee'])
  assert.equal(b.address.postalCode, '11000')
  assert.equal(b.address.streetAddress, '264 ถนนเลี่ยงเมืองนนท์ ตำบลตลาดขวัญ', 'A4 17 พ.ย.: ตำบลไม่หาย')
  assert.equal(b.address.addressLocality, 'อำเภอเมืองนนทบุรี')
  assert.equal(b.address.addressRegion, 'นนทบุรี')
})

test('LocalBusiness มีหมุด Google Maps (hasMap) และพิกัด (geo) เมื่อ site.json มีค่า (อาร์ตให้ใช้หมุดเดิม 23 ต.ค.)', () => {
  const b = businessSchema({ brand: 'TEAMDEE', baseUrl: 'https://team-dee.com', address: 'x', ogImage: '/a.jpg', mapUrl: 'https://maps.app.goo.gl/abc', geo: { lat: 13.85, lng: 100.5 } })
  assert.equal(b.hasMap, 'https://maps.app.goo.gl/abc')
  assert.deepEqual(b.geo, { '@type': 'GeoCoordinates', latitude: 13.85, longitude: 100.5 })
  const none = businessSchema({ brand: 'TEAMDEE', baseUrl: 'https://team-dee.com', address: 'x', ogImage: '/a.jpg' })
  assert.equal(none.hasMap, undefined)
  assert.equal(none.geo, undefined)
})

/* หน้า /designs/ (ตรวจคำ SEO 26 ต.ค.): รายการแบบเสื้อที่มีรหัส ให้ Google รู้ว่าหน้านี้เป็นคลังแบบ */
test('designListSchema: ItemList แบบเสื้อมีรหัส ชื่อบอกรหัส ทรง งาน · รูปเป็น URL เต็ม · ไม่มีแบบ = null', async () => {
  const { designListSchema } = await import('../src/js/seo-schema.js')
  const s = designListSchema([
    { code: 'TD-0001', garmentName: 'เสื้อฟุตบอล Jersey', techName: 'พิมพ์ลาย', img: '/img/design/d01.webp' },
    { code: 'TD-0002', garmentName: 'เสื้อโปโล', techName: 'พิมพ์ลาย', img: '/img/design/d02.webp' },
  ], 'https://team-dee.com')
  assert.equal(s['@type'], 'ItemList')
  assert.equal(s.numberOfItems, 2)
  assert.deepEqual(s.itemListElement[0], { '@type': 'ListItem', position: 1, name: 'แบบเสื้อฟุตบอล Jersey งานพิมพ์ลาย รหัส TD-0001', image: 'https://team-dee.com/img/design/d01.webp' })
  assert.equal(s.itemListElement[1].position, 2)
  assert.equal(designListSchema([], 'https://team-dee.com'), null)
})

/* 17 พ.ย. 2026 รอบตรวจ SEO: Organization ใน /about-us/ (โลโก้ไอคอน 180px · เบอร์ 097-…) กับ LocalBusiness หน้าแรก (+66…) ไม่มี @id ร่วม
   Google อาจนับเป็น 2 ธุรกิจ · sameAs มีแค่ LINE ทั้งที่เว็บลิงก์ Facebook / IG ของทีมดี
   → /about-us/ ใช้ schema ธุรกิจชุดเดียวกับหน้าแรก (@id /#business) · sameAs = LINE + Facebook + Instagram (site.json social) */
test('businessSchema: sameAs รวม LINE + Facebook + Instagram จาก site.json', async () => {
  const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'))
  const s = businessSchema(site)
  assert.deepEqual(s.sameAs, [site.lineUrl, 'https://www.facebook.com/teamdee', 'https://www.instagram.com/teamdee_'])
})
test('ทุกหน้าอ้างธุรกิจเดียวกัน (@id /#business) · head.hbs พิมพ์ businessLd · หน้าแรกใช้ homeLd (มีธุรกิจอยู่แล้ว) · ไม่มี Organization แยก', () => {
  /* 17 พ.ย. 2026 A4: เดิมมีแค่ / และ /about-us/ → AI/Google เห็นว่าทุกหน้าเป็นของธุรกิจเดียวกัน */
  const html = readFileSync(new URL('../site/about-us/index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /"@type":"Organization"|businessLd/)
  assert.match(readFileSync(new URL('../src/partials/head.hbs', import.meta.url), 'utf8'), /\{\{#each businessLd\}\}<script type="application\/ld\+json">\{\{\{this\}\}\}<\/script>\{\{\/each\}\}/)
  const ctx = readFileSync(new URL('../src/build/context.js', import.meta.url), 'utf8')
  assert.match(ctx, /if \(at !== '\/'\) base\.businessLd = \[ldJson\(businessSchema\(data\.site, \{ priceRange: priceRangeOf\(json\('prices\.json'\)\) \}\)\)\]/)
  assert.match(ctx, /base\.homeLd = \[businessSchema\(data\.site, \{ priceRange: priceRangeOf\(json\('prices\.json'\)\) \}\)/)
})

/* 17 พ.ย. 2026 แผน SEO/GEO A5: Product + AggregateOffer หน้าสินค้าที่เปิดราคา (โปโลปัก · สกรีน · เบสบอล · เจอร์ซีย์)
   ไม่ทำพิมพ์ลาย (อาร์ตไม่เปิดราคา) · วอร์มไม่มีราคา · ไม่ใส่ดาวรีวิว (Google ไม่นับรีวิวที่ธุรกิจเก็บเอง) */
test('A5: productSchema · ช่วงราคา + ขั้นต่ำจาก prices.json · ผู้ขาย = /#business · พิมพ์ลาย/วอร์ม = null', async () => {
  const { productSchema } = await import('../src/js/seo-schema.js')
  const prices = JSON.parse(readFileSync(new URL('../src/data/prices.json', import.meta.url), 'utf8'))
  const site = { brand: 'TEAMDEE', baseUrl: 'https://team-dee.com' }
  const polo = productSchema({ id: 'polo', name: 'เสื้อโปโลปัก', img: '/img/a.jpg' }, prices, site, '/embroidery/', 'ปักโลโก้ฟรี 1 จุด')
  assert.equal(polo['@type'], 'Product')
  assert.equal(polo.name, 'เสื้อโปโลปัก')
  assert.deepEqual(polo.brand, { '@type': 'Brand', name: 'TEAMDEE' })
  assert.equal(polo.image, 'https://team-dee.com/img/a.jpg')
  assert.deepEqual(polo.offers, { '@type': 'AggregateOffer', priceCurrency: 'THB', lowPrice: 170, highPrice: 390, eligibleQuantity: { '@type': 'QuantitativeValue', minValue: 10, unitText: 'ตัว' }, url: 'https://team-dee.com/embroidery/', seller: { '@id': 'https://team-dee.com/#business' } })
  assert.equal(productSchema({ id: 'screen', name: 'สกรีน' }, prices, site, '/screen-printing/').offers.eligibleQuantity.minValue, 1)
  assert.equal(productSchema({ id: 'print', name: 'พิมพ์ลาย' }, prices, site, '/sublimation/'), null)
  assert.equal(productSchema({ id: 'warmup', name: 'วอร์ม' }, prices, site, '/x/'), null)
  assert.equal(polo.aggregateRating, undefined); assert.equal(polo.review, undefined)
})
test('A5: หน้าสินค้าพิมพ์ productLd ใน head', () => {
  assert.match(readFileSync(new URL('../src/partials/head.hbs', import.meta.url), 'utf8'), /\{\{#if offerLd\}\}<script type="application\/ld\+json">\{\{\{offerLd\}\}\}<\/script>\{\{\/if\}\}/)
  assert.match(readFileSync(new URL('../src/build/pages/products.js', import.meta.url), 'utf8'), /offerLd: \(\(s\) => s && ldJson\(s\)\)\(productSchema\(item, json\('prices\.json'\), data\.site, at, page\?\.description\)\)/)
})
