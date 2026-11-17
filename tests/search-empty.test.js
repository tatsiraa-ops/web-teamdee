/* 17 พ.ย. 2026 รอบตรวจ UI: เปิด /search/ ช่องว่าง = หัวข้อ "ผลการค้นหา" แต่ไม่มีอะไรให้กดต่อ (ทางตัน)
   → ช่องว่างโชว์ "ค้นหาบ่อย" เป็นลิงก์ ?q= (ไม่มี JS ก็กดได้) · หัวข้อผลการค้นหาซ่อนจนมีคำค้น · ทุกคำมีผลจริง */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { searchPages, searchDesigns } from '../src/js/site-search.js'

const html = readFileSync(new URL('../site/search/index.html', import.meta.url), 'utf8')
const js = readFileSync(new URL('../src/js/search-page.js', import.meta.url), 'utf8')

test('ช่องค้นหาว่าง: มีคำค้นหาบ่อยเป็นลิงก์ ?q= · JS ซ่อน/โชว์ตามคำค้น', () => {
  const box = html.match(/<div class="sr-pop" id="searchPopular">([\s\S]*?)<\/div>/)
  assert.ok(box, 'มีกล่องค้นหาบ่อย')
  const qs = [...box[1].matchAll(/<a class="sr-pop__chip" href="\{\{url 'search'\}\}\?q=([^"]+)">([^<]+)<\/a>/g)]
  assert.ok(qs.length >= 5, 'อย่างน้อย 5 คำ')
  for (const [, enc, label] of qs) assert.equal(decodeURIComponent(enc), label)
  assert.match(html, /<h2 [^>]*id="searchHead"/)
  assert.match(js, /popular\.hidden = !!q/)
  assert.match(js, /head\.hidden = !q/)
})
