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
