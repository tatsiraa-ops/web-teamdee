import { test } from 'node:test'
import assert from 'node:assert/strict'
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
  assert.equal(b.logo, 'https://team-dee.com/logo/teamdee-stacked.svg')
  assert.equal(b.image, 'https://team-dee.com/img/a.jpg')
  assert.equal(b.openingHours, 'Mo-Su 08:30-21:00')
  assert.equal(b.url, 'https://team-dee.com/')
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
  assert.equal(b.address.streetAddress, '264 ถนนเลี่ยงเมืองนนท์')
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
