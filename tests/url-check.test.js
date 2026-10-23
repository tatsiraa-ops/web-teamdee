import { test } from 'node:test'
import assert from 'node:assert/strict'
import { judge } from '../scripts/check-urls.mjs'

const keep = { old_url: 'https://team-dee.com/corporate/', new_url: 'https://team-dee.com/corporate/', action: 'KEEP' }
const ok = (over = {}) => ({ status: 200, location: '', robots: '', canonical: 'https://team-dee.com/corporate/', ...over })

test('URL เดิมที่คงไว้: ต้องตอบ 200 ไม่ noindex และ canonical ชี้ตัวเอง', () => {
  assert.deepEqual(judge(keep, ok(), 'https://team-dee.com'), [])
  assert.match(judge(keep, ok({ status: 404 }), 'https://team-dee.com')[0], /404/)
  assert.match(judge(keep, ok({ status: 301, location: '/projects/' }), 'https://team-dee.com')[0], /301/)
  assert.match(judge(keep, ok({ robots: 'noindex, follow' }), 'https://team-dee.com')[0], /noindex/)
  assert.match(judge(keep, ok({ canonical: 'https://team-dee.com/other/' }), 'https://team-dee.com')[0], /canonical/)
})

test('ตรวจกับ staging: เทียบ path ไม่สนโดเมน · staging ยอมให้ noindex ได้', () => {
  const stg = 'https://staging.team-dee.com'
  assert.deepEqual(judge(keep, ok({ canonical: 'https://staging.team-dee.com/corporate/', robots: 'noindex' }), stg, { staging: true }), [])
})

test('KEEP_NOINDEX: ต้องตอบ 200 และมี noindex', () => {
  const row = { ...keep, old_url: 'https://team-dee.com/thank-you/', new_url: 'https://team-dee.com/thank-you/', action: 'KEEP_NOINDEX' }
  assert.deepEqual(judge(row, ok({ robots: 'noindex' })), [])
  assert.match(judge(row, ok())[0], /noindex/)
})

test('PRESERVE_REDIRECT: ต้อง 301/308 ไปปลายทางที่กำหนด', () => {
  const row = { old_url: 'https://team-dee.com/terms/', new_url: 'https://team-dee.com/terms-conditions/', action: 'PRESERVE_REDIRECT' }
  assert.deepEqual(judge(row, { status: 301, location: 'https://team-dee.com/terms-conditions/' }), [])
  assert.deepEqual(judge(row, { status: 301, location: '/terms-conditions/' }), [])
  assert.match(judge(row, { status: 200 })[0], /redirect/)
  assert.match(judge(row, { status: 301, location: '/' })[0], /ปลายทาง/)
})
