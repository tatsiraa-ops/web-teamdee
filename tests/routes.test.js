import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { makeUrl, pageFor } from '../src/js/routes.js'

const routes = JSON.parse(readFileSync(new URL('../src/data/routes.json', import.meta.url), 'utf8'))
const url = makeUrl(routes)

test('หน้าเดี่ยวคืน URL ตรงตามตาราง', () => {
  assert.equal(url('home'), '/')
  assert.equal(url('contact'), '/contact-us/')
  assert.equal(url('calculations'), '/calculations/')
})

test('หน้าที่มีหลายตัวรับได้ทั้ง key คู่ id และแบบจุด', () => {
  assert.equal(url('products', 'print'), '/sublimation/')
  assert.equal(url('products.jersey'), '/custom-oversize-jerseys/')
  assert.equal(url('guides', 'size'), '/size-chart/')
})

test('บทความเติม id ลงแม่แบบ', () => {
  assert.equal(url('articles', 'gov-docs'), '/blog/gov-docs/')
})

test('path ที่เป็นของจริงอยู่แล้วผ่านไปตามเดิม', () => {
  assert.equal(url('/img/a.jpg'), '/img/a.jpg')
  assert.equal(url('https://line.me/x'), 'https://line.me/x')
  assert.equal(url('#top'), '#top')
})

test('key หรือ id ที่ไม่มีต้องพังทันที ไม่ปล่อยลิงก์เสียออกไป', () => {
  assert.throws(() => url('nope'), /nope/)
  assert.throws(() => url('products', 'nope'), /products\.nope/)
  assert.throws(() => url('products'), /products/)
  assert.throws(() => url('articles'), /articles/)
})

test('URL ล็อกทุกตัวต้องมีหน้าอยู่ในตาราง', () => {
  const all = new Set(Object.keys(pageFor(routes, ['x'])))
  for (const u of routes.lock) assert.ok(all.has(u), `ไม่มีหน้าที่ ${u}`)
})

test('แปลง URL กลับเป็นชนิดหน้าและ id ได้', () => {
  const map = pageFor(routes, ['gov-docs'])
  assert.deepEqual(map['/sublimation/'], { kind: 'products', id: 'print' })
  assert.deepEqual(map['/sport/'], { kind: 'uses', id: 'sport' })
  assert.deepEqual(map['/blog/gov-docs/'], { kind: 'articles', id: 'gov-docs' })
  assert.deepEqual(map['/contact-us/'], { kind: 'contact', id: null })
})

test('ตั้ง URL ซ้ำสองหน้าต้องพังทันที', () => {
  const bad = { ...routes, faq: '/contact-us/' }
  assert.throws(() => pageFor(bad, []), /\/contact-us\//)
  assert.doesNotThrow(() => pageFor(routes, ['a']))
})

test('ต่อท้าย #หัวข้อ หรือ ?query ได้ โดยยังเช็ก key ตามปกติ', () => {
  assert.equal(url('guides.size#collect'), '/size-chart/#collect')
  assert.equal(url('designs?product=print'), '/designs/?product=print')
  assert.throws(() => url('guides.nope#x'), /guides\.nope/)
})
