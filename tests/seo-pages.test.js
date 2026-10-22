/* ตรวจ SEO ทุกหน้าจากไฟล์ที่ build สำหรับธีม WordPress (ตัวที่ขึ้นเว็บจริง) · PLAN ข้อ 5.1
   build ใหม่ทุกครั้งที่รัน ใช้เวลาราว 1 วินาที */
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectPage, INTERNAL_PAGES } from '../scripts/seo-check.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist-wp')
const kw = JSON.parse(readFileSync(join(root, 'src/data/seo-keywords.json'), 'utf8')).pages
let pages = []

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f)
  return statSync(p).isDirectory() ? walk(p) : f.endsWith('.html') ? [p] : []
})

before(() => {
  execSync('npx vite build --logLevel error', { cwd: root, stdio: 'pipe', env: { ...process.env, TD_TARGET: 'wp' } })
  pages = walk(dist).filter((f) => !INTERNAL_PAGES.has(f.slice(dist.length).replace(/index\.html$/, ''))).map((f) => {
    const rel = f.slice(dist.length).replace(/index\.html$/, '')
    return { route: rel === '/404.html' ? '404' : rel, ...inspectPage(readFileSync(f, 'utf8')) }
  })
})

const indexable = () => pages.filter((p) => !p.noindex)
const fails = (fn) => pages.flatMap((p) => fn(p).map((m) => `${p.route}: ${m}`))

test('ทุกหน้ามี title · description · H1 เดียว', () => {
  assert.ok(pages.length >= 40, `หน้าน้อยผิดปกติ: ${pages.length}`)
  assert.deepEqual(fails((p) => [
    !p.title && 'ไม่มี title',
    !p.desc && 'ไม่มี description',
    p.h1.length !== 1 && `H1 มี ${p.h1.length} ตัว`,
  ].filter(Boolean)), [])
})

test('title กับ description ไม่ซ้ำกันข้ามหน้า และไม่มี [วงเล็บ]', () => {
  const dup = (key) => indexable().filter((p, i, a) => a.findIndex((q) => q[key] === p[key]) !== i).map((p) => `${p.route}: ${key} ซ้ำ`)
  assert.deepEqual([...dup('title'), ...dup('desc'), ...fails((p) => (/\[[^\]]*\]/.test(p.title + p.desc) ? ['title/description มี [วงเล็บ]'] : []))], [])
})

test('หน้าที่ให้ Google เก็บ มี canonical', () => {
  assert.deepEqual(indexable().filter((p) => !p.canonical).map((p) => p.route), [])
})

test('รูปทุกรูปมี src กับ alt · ลิงก์ทุกตัวมี href จริง', () => {
  assert.deepEqual(fails((p) => [
    ...p.imgNoAlt.map((s) => `รูปไม่มี alt ${s}`),
    ...p.imgNoSrc.map((s) => `รูป src ว่าง (เปิดไม่ขึ้น) ${s}`),
    ...p.badLinks.map((s) => `ลิงก์ไม่มี href ${s}`),
  ]), [])
})

test('JSON-LD ทุกก้อนอ่านได้', () => {
  assert.deepEqual(fails((p) => p.ldErrors), [])
})

test('คำค้นหลักอยู่ใน title · H1 · description · H2 และไม่มีหน้าไหนใช้คำซ้ำกัน', () => {
  const words = Object.values(kw).map((k) => k.kw)
  assert.equal(new Set(words).size, words.length, 'มีคำค้นหลักซ้ำกัน')
  const out = []
  for (const [route, k] of Object.entries(kw)) {
    const p = pages.find((x) => x.route === route)
    if (!p) { out.push(`${route}: ไม่พบหน้า`); continue }
    if (!p.title.includes(k.kw)) out.push(`${route}: title ไม่มี "${k.kw}"`)
    if (!p.h1.join(' ').includes(k.kw)) out.push(`${route}: H1 ไม่มี "${k.kw}"`)
    if (!p.desc.includes(k.kw)) out.push(`${route}: description ไม่มี "${k.kw}"`)
    if (!p.h2.some((h) => h.includes(k.h2))) out.push(`${route}: ไม่มี H2 ที่มี "${k.h2}"`)
  }
  assert.deepEqual(out, [])
})

test('build ยังมีโค้ด accordion ของ FAQ (preline ถูกตัดทิ้งตอน build ได้ เพราะ sideEffects ใน package.json)', () => {
  const js = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, 'assets', f), 'utf8')).join('\n')
  assert.ok(js.includes('$hsAccordionCollection'), 'ไม่พบโค้ด HSAccordion ใน build · FAQ จะกดเปิดไม่ได้')
  const withFaq = pages.filter((p) => p.hasAccordion).length
  assert.ok(withFaq > 0)
})
