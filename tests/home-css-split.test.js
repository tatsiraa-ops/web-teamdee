/* 17 พ.ย. 2026 รอบตรวจความเร็ว: home.css (โหลดทุกหน้า) มีกฎที่ใช้เฉพาะหน้าแรก ~127 KB → แยกไป home-page.css (โหลดเฉพาะหน้าแรก)
   CSS กลางทุกหน้า 380 → 275 KB · ตรวจด้วยภาพเต็มหน้า 47 หน้า × 2 ขนาด ก่อน/หลัง ตรงกันทุกพิกเซล
   เทสนี้กันพลาดในอนาคต: กฎใน home-page.css ต้องมี class/id ที่ไม่มีในหน้าอื่นเลย (HTML ที่ build แล้ว + JS + PHP)
   ถ้าเทสนี้ตก = เอาชิ้นส่วนหน้าแรกไปใช้หน้าอื่น → ย้ายกฎที่บอกในข้อความกลับไป home.css
   ระวัง: หน้ากลุ่มลูกค้าใช้ <div class="td-page-home"> ครอบชิ้นส่วนหน้าแรก → :is(.page-home,.td-page-home) ไม่ได้แปลว่าเฉพาะหน้าแรก */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist-wp')
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })
const groups = (sel, fn) => {
  let out = '', i = 0
  while (i < sel.length) {
    const m = /^:(is|where|not|has)\(/.exec(sel.slice(i))
    if (!m) { out += sel[i++]; continue }
    let d = 0, j = i + m[0].length - 1
    for (; j < sel.length; j++) { if (sel[j] === '(') d++; else if (sel[j] === ')' && --d === 0) break }
    out += fn(m[1], sel.slice(i + m[0].length, j)); i = j + 1
  }
  return out
}
const splitTop = (list) => { const parts = []; let d = 0, cur = ''; for (const ch of list) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { parts.push(cur); cur = '' } else cur += ch } parts.push(cur); return parts }

test('home-page.css: ทุกกฎ match นอกหน้าแรกไม่ได้', { skip: !existsSync(join(dist, 'index.html')) }, () => {
  const corpus = [
    ...walk(dist).filter((f) => f.endsWith('.html') && f !== join(dist, 'index.html')),
    ...walk(join(root, 'src/js')).filter((f) => f.endsWith('.js')),
    ...walk(join(root, 'wp-theme/teamdee')).filter((f) => f.endsWith('.php')),
  ].map((f) => readFileSync(f, 'utf8')).join('\n')
  const tokens = new Set(corpus.match(/[A-Za-z_][\w-]*/g))
  const homeOnly = (sel) => {
    let absent = false
    const flat = groups(sel, (kind, inner) => {
      if (kind === 'not' || kind === 'has') return ''
      if (splitTop(inner).every((alt) => homeOnly(alt.trim()))) absent = true
      return ''
    })
    return absent || [...flat.matchAll(/[.#]([A-Za-z_][\w-]*)/g)].some((m) => !tokens.has(m[1]))
  }
  const bad = []
  postcss.parse(readFileSync(join(root, 'src/styles/home-page.css'), 'utf8')).walkRules((r) => {
    if (r.parent.type === 'atrule' && /keyframes/.test(r.parent.name)) return
    for (const s of r.selectors) if (!homeOnly(s)) bad.push(s)
  })
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} selector ใช้ได้นอกหน้าแรก → ย้ายกลับ home.css`)
})

test('home-page.css ไม่ว่าง · home.css ยังมีชิ้นส่วนที่ใช้ร่วม', () => {
  assert.ok(readFileSync(join(root, 'src/styles/home-page.css'), 'utf8').length > 50000)
  assert.match(readFileSync(join(root, 'src/styles/home.css'), 'utf8'), /\.hm-stats-band\.wrap/)
})
