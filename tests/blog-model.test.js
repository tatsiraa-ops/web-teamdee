import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { blogView, blogMatches, normalizeBlogQuery } from '../src/js/blog-model.js'
const original = JSON.parse(readFileSync(new URL('../src/data/legacy-posts.json', import.meta.url)))
const view = blogView(original)
/* แนวนิตยสาร (อาร์ตเลือก 27 ต.ค. "ข นิตยสาร") · เรื่องปก 1 + เรื่องข้าง 2 · ที่เหลือแยกตามหัวข้อหลัก ไม่ซ้ำกัน ครบ 12 เรื่อง */
test('magazine: cover + 2 side stories, every other post appears once under its first topic', () => {
  const m = view.magazine
  assert.equal(m.main.slug, 'what-is-dft-shirt-printing-durability-guide')
  assert.equal(m.side.length, 2)
  const listed = [m.main, ...m.side, ...m.blocks.flatMap((x) => x.items)].map((p) => p.url)
  assert.equal(listed.length, 12)
  assert.equal(new Set(listed).size, 12)
  for (const blk of m.blocks) for (const p of blk.items) assert.equal(p.topics[0], blk.id)
  assert.ok(m.blocks.every((x) => x.items.length > 0))
  assert.equal(m.blocks[0].items.length, Math.max(...m.blocks.map((x) => x.items.length)), 'หัวข้อที่มีเรื่องมากสุดขึ้นก่อน (คอลัมน์กว้าง)')
})
test('blog page keeps every article link, search grid and v22 headings', () => {
  const html = readFileSync(new URL('../site/blog/index.html', import.meta.url), 'utf8')
  for (const title of ['ต้องการขั้นตอนสั่งทำ?']) assert.ok(html.includes(title))
  assert.ok(html.includes('id="artGrid"'))
  assert.ok(html.includes('href="{{this.url}}"'))
})
test('blog redesign preserves every published URL and category; highlights do not repeat immediately', () => {
  assert.deepEqual(view.items.map((p) => p.url), original.items.map((p) => p.url))
  assert.deepEqual(view.items.map((p) => p.cat), original.items.map((p) => p.cat))
  assert.equal(new Set(view.library.map((p) => p.url)).size, 12)
  assert.equal(view.featured.slug, 'what-is-dft-shirt-printing-durability-guide')
  assert.equal(view.idea.slug, 'sublimation-sportswear-designs')
  assert.notEqual(view.library[0].slug, view.featured.slug)
  assert.equal(view.cats.reduce((n, c) => n + c.n, 0), 12)
})
test('fabric intent includes polo fabric without changing CMS purchasing category', () => {
  const matches = view.items.filter((p) => blogMatches(p, { topic: 'fabric' }))
  assert.equal(matches.length, 2)
  assert.equal(matches.find((p) => p.slug === 'polo-shirt-fabric-guide').cat, 'purchasing-guide')
})
test('query, topic and category combine; Thai, Latin and empty results are predictable', () => {
  assert.equal(normalizeBlogQuery('  DFT   ผ้า  '), 'dft ผ้า')
  assert.equal(view.items.filter((p) => blogMatches(p)).length, 12)
  assert.ok(view.items.some((p) => blogMatches(p, { q: 'dft', topic: 'technique' })))
  assert.equal(view.items.filter((p) => blogMatches(p, { topic: 'fabric', cat: 'purchasing-guide' })).length, 1)
  assert.equal(view.items.filter((p) => blogMatches(p, { q: 'ไม่มีคำนี้abcdef' })).length, 0)
  assert.equal(view.items.filter((p) => blogMatches(p, { topic: 'missing' })).length, 0)
})
/* รอบ 48 (ตรวจละเอียด 30 ต.ค.): ปกบทความเดิมโหลดไฟล์เต็ม 0.5–0.7MB บนมือถือ · WordPress มีขนาดย่อยอยู่แล้ว */
test('ปกบทความเดิมมี srcset จากขนาดที่ WordPress ทำไว้ · ไม่ใช้ไฟล์ต้นฉบับเต็มเป็น src', () => {
  for (const p of view.items) {
    assert.match(p.img, /-\d+x\d+\.(png|jpg|webp)$/, `${p.slug} src เป็นไฟล์ย่อย`)
    const ws = (p.srcset || '').split(', ').map((s) => +s.match(/ (\d+)w$/)?.[1])
    assert.ok(ws.length >= 2 && ws[0] === 300 && ws.every((w, i) => i === 0 || w > ws[i - 1]), `${p.slug} srcset ${p.srcset}`)
  }
  const page = readFileSync(new URL('../site/blog/index.html', import.meta.url), 'utf8')
  assert.equal((page.match(/<img src="\{\{img\}\}"/g) || []).length, (page.match(/srcset="\{\{srcset\}\}" sizes="/g) || []).length)
})
