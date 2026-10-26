/* ตัวหนังสือบนพื้นส้มเป็นดำทั้งเว็บ (อาร์ตเคาะ 24 ต.ค. 2026 · docs/audit/2026-10-24-main-pages-audit.md ข้อ 2.8)
   ขาวบน #FF6C00 ได้ 2.84:1 ไม่ผ่าน AA · ดำบนส้มได้ 7.4:1
   ตรวจที่ต้นทาง (CSS · แม่แบบ · หน้า · JS) ไม่ต้อง build
   - CSS ธรรมดา: กฎเดียวกันที่พื้นส้มและตัวหนังสือขาว
   - คลาส Tailwind (ในแม่แบบและ @apply): สถานะไหนพื้นส้ม (ปกติ hover focus aria-pressed ...) ตัวหนังสือของสถานะนั้นต้องไม่ขาว
     ถ้าสถานะนั้นไม่ได้ตั้งสีตัวหนังสือเอง จะใช้สีของสถานะปกติ
   ยกเว้นหน้าภายใน /ui/ กับ /hero-storyboard/ ที่ตั้งใจโชว์ตัวอย่างผิด */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const walk = (d, ok) => readdirSync(d).flatMap((f) => {
  const p = join(d, f)
  return statSync(p).isDirectory() ? walk(p, ok) : ok(p) ? [p] : []
})
const rel = (p) => p.slice(root.length + 1)
const INTERNAL = [`site${sep}ui${sep}`, `site${sep}hero-storyboard${sep}`]

const ORANGE_BG = /background(?:-color)?\s*:\s*(?:var\(--color-orange\)|#ff6c00)\s*(?:;|$)/i
const WHITE_TEXT = /(?:^|[;\s{])color\s*:\s*(?:var\(--color-paper\)|#fff(?:fff)?|white)\s*(?:;|$)/i
const WHITE_CLS = /^(?:!?text-paper|!?text-white)$/

/* แยกคลาสตามสถานะ (ส่วนหน้า ':' ตัวสุดท้าย) แล้วหาสถานะที่พื้นส้มแต่ตัวหนังสือขาว */
function whiteOnOrange(tokens) {
  const byState = new Map()
  for (const t of tokens) {
    const i = t.lastIndexOf(':')
    const state = i < 0 ? '' : t.slice(0, i + 1)
    const cls = i < 0 ? t : t.slice(i + 1)
    if (!byState.has(state)) byState.set(state, [])
    byState.get(state).push(cls)
  }
  const textOf = (list) => list.filter((c) => /^!?text-(?:paper|white|ink|orange|inherit|\[#)/.test(c)).pop()
  const bad = []
  for (const [state, list] of byState) {
    if (!list.some((c) => /^!?bg-orange$/.test(c))) continue
    const text = textOf(list) ?? textOf(byState.get('') ?? [])
    if (text && WHITE_CLS.test(text)) bad.push(`${state}bg-orange + ${state}${text}`)
  }
  return bad
}

test('whiteOnOrange: จับขาวบนส้มทุกสถานะ รวมถึงสถานะที่สืบสีตัวหนังสือมาจากสถานะปกติ', () => {
  assert.deepEqual(whiteOnOrange(['bg-orange', 'text-ink']), [])
  assert.equal(whiteOnOrange(['bg-orange', 'text-paper']).length, 1)
  assert.equal(whiteOnOrange(['text-paper', 'hover:bg-orange']).length, 1)
  assert.deepEqual(whiteOnOrange(['text-paper', 'hover:bg-orange', 'hover:text-ink']), [])
  assert.equal(whiteOnOrange(['aria-pressed:bg-orange', 'aria-pressed:text-paper']).length, 1)
  assert.deepEqual(whiteOnOrange(['bg-orange', 'text-ink', 'hover:bg-ink', 'hover:text-paper']), [])
})

test('CSS: ไม่มีกฎที่พื้นส้มแล้วตัวหนังสือขาว', () => {
  const bad = []
  for (const f of walk(join(root, 'src/styles'), (p) => p.endsWith('.css'))) {
    const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const name = sel.trim().split('\n').pop()
      if (ORANGE_BG.test(body) && WHITE_TEXT.test(body)) bad.push(`${rel(f)}: ${name}`)
      for (const [, list] of body.matchAll(/@apply\s+([^;]+)/g)) {
        for (const b of whiteOnOrange(list.trim().split(/\s+/))) bad.push(`${rel(f)}: ${name} (${b})`)
      }
    }
  }
  assert.deepEqual(bad, [])
})

test('แม่แบบ หน้า และ JS: ไม่มีคลาสพื้นส้มคู่ตัวหนังสือขาว', () => {
  const files = [
    ...walk(join(root, 'src/partials'), (p) => p.endsWith('.hbs')),
    ...walk(join(root, 'src/js'), (p) => p.endsWith('.js')),
    ...walk(join(root, 'site'), (p) => p.endsWith('.html') && !INTERNAL.some((x) => rel(p).startsWith(x))),
  ]
  const bad = []
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    for (const [, list] of src.matchAll(/class="([^"]*)"/g)) {
      for (const b of whiteOnOrange(list.replace(/\{\{[^}]*\}\}/g, ' ').trim().split(/\s+/))) bad.push(`${rel(f)}: ${b}`)
    }
  }
  assert.deepEqual(bad, [])
})
