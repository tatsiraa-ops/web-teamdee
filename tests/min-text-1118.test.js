/* 18 พ.ย. 2026 ตรวจทั้งเว็บ (อาร์ต "แก้ข้อ 1–3"): ตัวหนังสือที่ลูกค้าอ่านบนมือถือไม่ต่ำกว่า 12px
   1) ภาพแชท LINE ในแบนเนอร์ (line-cta.css · ย่อตามจอด้วย cqw) 2) การ์ดผ้า/เงื่อนไขหน้าปัก 3) ป้ายเล็กหน้าสกรีน */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const sizes = (css, sel) => [...css.matchAll(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[^}]*?font-size:\\s*([^;}]+)`, 'g'))].map((m) => m[1].trim())
const px = (v) => { const m = v.match(/^([\d.]+)px$/); return m ? +m[1] : null }

test('แชท LINE: ข้อความในจอภาพมือถือมีขั้นต่ำ 12px (max(12px, …cqw))', () => {
  const css = read('src/styles/line-cta.css')
  for (const sel of ['.lc__scr', '.lc__bar b', '.lc__bar small']) assert.ok(sizes(css, sel).some((v) => /^max\(12px,/.test(v)), sel)
})

test('หน้าปักและหน้าสกรีน: กฎที่เคยต่ำกว่า 12px ตอนนี้ ≥ 12px', () => {
  const pp = read('src/styles/product-page.css'); const sc = read('src/styles/screen.css')
  for (const sel of ['.pf5 .pf4__hero figcaption > span', '.pf5 .pf4__ask small', '.pf5__terms span', '.pf5 .pf4__hero small', '.ps2__spn', '.ps2__sps', '.fx__new', '.dz__f small', '.ctz__x span', '.pp2-col__pkp b', '.dz__tag']) {
    for (const v of sizes(pp, sel)) { const n = px(v); if (n !== null) assert.ok(n >= 12, `${sel} ${v}`) }
  }
  assert.ok(sizes(sc, '.scf__cname small').some((v) => px(v) >= 12))
  assert.match(sc, /\.szx__w, \.szx__h \{[^}]*font-size:clamp\(12px/)
  for (const v of sizes(sc, '.screen-page .pp2-stb__time, .screen-page .pp2-stb__s:nth-of-type(even) .pp2-stb__time')) assert.ok(px(v) >= 12, v)
})
