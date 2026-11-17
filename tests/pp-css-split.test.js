/* 17 พ.ย. 2026 รอบตรวจความเร็ว: หน้าสินค้าแบบเดิม 4 หน้า (เบสบอล · โอเวอร์ไซส์ · วอร์ม · สกรีน) โหลด product-page.css ทั้งไฟล์ (118 KB) แต่ใช้แค่ ~30 กฎ
   → แยกกฎที่ 4 หน้าใช้ไป pp-base.css (12 KB) · product-page.css @import pp-base.css บนสุด (/sublimation/ /embroidery/ ลำดับกฎเหมือนเดิม)
   ตรวจด้วยภาพเต็มหน้า 6 หน้า × 2 ขนาด ก่อน/หลัง ตรงกัน · เทสนี้กันพลาด: กฎที่เหลือใน product-page.css ต้อง match บน 4 หน้าไม่ได้
   ถ้าตก = 4 หน้าเริ่มใช้ class ใหม่จาก product-page.css → ย้ายกฎที่บอกไป pp-base.css */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const root = fileURLToPath(new URL('..', import.meta.url))
const PAGES = ['custom-baseball-shirts', 'custom-oversize-jerseys', 'custom-printed-warmup-shirts', 'screen-printing']
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })
const groups = (sel, fn) => { let out = '', i = 0; while (i < sel.length) { const m = /^:(is|where|not|has)\(/.exec(sel.slice(i)); if (!m) { out += sel[i++]; continue } let d = 0, j = i + m[0].length - 1; for (; j < sel.length; j++) { if (sel[j] === '(') d++; else if (sel[j] === ')' && --d === 0) break } out += fn(m[1], sel.slice(i + m[0].length, j)); i = j + 1 } return out }
const splitTop = (list) => { const parts = []; let d = 0, cur = ''; for (const ch of list) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { parts.push(cur); cur = '' } else cur += ch } parts.push(cur); return parts }

test('product-page.css (ส่วนที่เหลือ) match บนหน้าสินค้าแบบเดิม 4 หน้าไม่ได้', { skip: !existsSync(join(root, 'dist-wp', PAGES[0], 'index.html')) }, () => {
  const corpus = [...PAGES.map((p) => join(root, 'dist-wp', p, 'index.html')), ...walk(join(root, 'src/js')).filter((f) => f.endsWith('.js'))].map((f) => readFileSync(f, 'utf8')).join('\n')
  const tokens = new Set(corpus.match(/[A-Za-z_][\w-]*/g))
  const absent = (sel) => { let a = false; const flat = groups(sel, (k, inner) => { if (k === 'not' || k === 'has') return ''; if (splitTop(inner).every((x) => absent(x.trim()))) a = true; return '' }); return a || [...flat.matchAll(/[.#]([A-Za-z_][\w-]*)/g)].some((m) => !tokens.has(m[1])) }
  const bad = []
  postcss.parse(readFileSync(join(root, 'src/styles/product-page.css'), 'utf8')).walkRules((r) => {
    if (r.parent.type === 'atrule' && /keyframes/.test(r.parent.name)) return
    for (const s of r.selectors) if (!absent(s)) bad.push(s)
  })
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} selector ใช้บน 4 หน้า → ย้ายไป pp-base.css`)
})

test('4 หน้าโหลด pp-base.css แทน product-page.css · product-page.css import pp-base.css บนสุด', () => {
  for (const p of PAGES) {
    const h = readFileSync(join(root, 'site', p, 'index.html'), 'utf8')
    assert.match(h, /href="\/src\/styles\/pp-base\.css"/, p); assert.doesNotMatch(h, /product-page\.css/, p)
  }
  for (const p of ['sublimation', 'embroidery']) assert.match(readFileSync(join(root, 'site', p, 'index.html'), 'utf8'), /href="\/src\/styles\/product-page\.css"/)
  assert.match(readFileSync(join(root, 'src/styles/product-page.css'), 'utf8'), /^\/\*[^]*?\*\/\n@import '\.\/pp-base\.css';/)
})
