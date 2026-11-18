/* 18 พ.ย. 2026 ข้อความทั้งเว็บตามสไลด์ "ขายงานสกรีน DTF" (17 พ.ย. 2026)
   ชื่อหลัก DTF · "DFT" เหลือ 1 จุดในวงเล็บบนหน้าสกรีน + คำค้น · สกรีนเริ่ม 5 ตัว · ผลิต 1–7 วัน (ไม่เกิน 300 ตัว)
   สเปก docs/superpowers/specs/2026-11-18-screen-dtf-pricing-design.md · รัน npm run build && npm run export:wp ก่อน */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { faqHits } from '../src/js/faq-search.js'
import { searchPages } from '../src/js/site-search.js'
import { maxDays } from '../src/js/need-by.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(join(root, p), 'utf8')
const walk = (d, ok) => readdirSync(join(root, d)).flatMap((n) => {
  const p = join(d, n)
  return statSync(join(root, p)).isDirectory() ? walk(p, ok) : ok(p) ? [p] : []
})
/* ตัดคอมเมนต์ทิ้งก่อนตรวจ (คอมเมนต์อ้างประวัติได้) */
const strip = (s) => s.replace(/\{\{!--[\s\S]*?--\}\}|<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|(^|[^:'"`])\/\/[^\n]*/g, '$1')
const files = [...walk('src', (p) => /\.(json|hbs|js|css)$/.test(p) && !p.endsWith('legacy-posts.json')), ...walk('site', (p) => p.endsWith('.html')), ...walk('scripts', (p) => /\.m?js$/.test(p))]
const hits = (re, allow = () => false) => files.flatMap((f) => (strip(read(f)).match(re) || []).filter((m) => !allow(f, m)).map((m) => `${f}: ${m}`))

test('ชื่อหลัก DTF · DFT เหลือ 1 จุดในวงเล็บบนหน้าสกรีน + คำค้น', () => {
  const allow = (f, m) => (f === 'src/content/product/screen.json' && /หลายคนเรียก DFT/.test(m)) || f === 'src/data/search-synonyms.json'
  assert.deepEqual(hits(/.{0,20}DFT.{0,20}/g, allow), [])
})

test('ไม่เหลือสกรีน "เริ่ม 1 ตัว" · "ไม่มีขั้นต่ำ" · "3–14 วัน"', () => {
  assert.deepEqual(hits(/.{0,20}(เริ่ม(สั่งได้)? ?1 ตัว|สกรีน[^"\n]{0,12}1 ตัว|ไม่มีขั้นต่ำ|3–14 วัน).{0,20}/g), [])
})

test('ทุกหน้าที่ export + llms.txt ไม่มีข้อมูลภายในจากสไลด์', () => {
  const dir = 'wp-theme/teamdee/build/pages'
  const out = readdirSync(join(root, dir)).filter((n) => n.endsWith('.html')).map((n) => join(dir, n))
  for (const p of [...out, 'wp-theme/teamdee/build/llms.txt'].filter((p) => existsSync(join(root, p)))) {
    const t = read(p).replace(/<script[\s\S]*?<\/script>|<!--[\s\S]*?-->/g, '')
    for (const bad of ['HUB', 'มั่ง', 'หัวหน้าทีม', 'เซลห้าม', 'DFT ฟิล์ม']) assert.ok(!t.includes(bad), `${p}: ${bad}`)
  }
})

test('FAQ สกรีน: เริ่ม 5 ตัว · 2XL ขึ้นไป +20 · วันผลิตใหม่', () => {
  const faq = JSON.parse(read('src/data/faq.json'))
  const screen = faq.screen.map(([, a]) => a).join(' ')
  assert.match(screen, /5 ตัว/); assert.match(screen, /2XL ขึ้นไป \+20/); assert.match(screen, /1–2 วัน/)
  const all = JSON.stringify(faq)
  assert.match(all, /สกรีน(?:เริ่ม| DTF เริ่ม) 5 ตัว/)
  assert.doesNotMatch(all, /ทุกไซซ์ราคาเดียวกัน เลือกดูช่วงจำนวน/)
})

test('คู่มือสกรีน: ไม่มี [ยืนยัน… · ราคาตามตารางใหม่ · ตอบเรื่องเสื้อลูกค้า', () => {
  for (const f of ['src/data/guides.json', 'src/data/guide-pages.json']) {
    const s = read(f)
    const sec = s.slice(s.indexOf('"screen"'))
    assert.doesNotMatch(s, /\[ยืนยันว่ารับเสื้อลูกค้า/, f)
    assert.doesNotMatch(s, /ราคาเริ่ม 290 บาท/, f)
    assert.match(sec, /ขั้นต่ำ 20 ตัว/, f)
  }
  assert.match(read('src/partials/guideProcessStudio.hbs'), /Premium C32 \(8 สี\)/)
})

test('ค้นหา "dft" / "dtf" ได้หน้าสกรีนอันดับแรก', () => {
  const pages = JSON.parse(read('wp-theme/teamdee/build/pages.json')).pages
  const list = Object.entries(pages).map(([u, p]) => ({ u, t: p.title, d: p.description, k: '' }))
  const routes = JSON.parse(read('src/data/routes.json'))
  for (const q of ['dft', 'dtf', 'DTF']) {
    const r = searchPages(q, list, routes)
    assert.equal(r[0]?.u, '/screen-printing/', q)
  }
  assert.ok(faqHits('dtf', ['สกรีน DTF ทนไหม'])[0])
})

test('วันผลิตสกรีนสูงสุด 7 วัน (วางแผนวันใช้เสื้อ)', () => {
  const lead = JSON.parse(read('src/data/lead-times.json'))
  assert.equal(maxDays(lead.screen.days), 7)
})
