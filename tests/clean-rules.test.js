/* ล้างของที่ผิดกฎเหล็ก (อาร์ตเคาะ 24 ต.ค. 2026 · docs/audit/2026-10-24-main-pages-audit.md ข้อ 2.1)
   - works.json: เรื่องเล่าเดิม (โจทย์ · ทีมดีช่วย · จำนวนตัว · คำพูดลูกค้า · วันงาน · ชื่องาน) แต่งขึ้น ไม่ตรงกับรูป → ห้ามมีในข้อมูล
   - แบบ TD-0002 / TD-0003 เป็นแบบของแบรนด์ t around → ลบถาวร ห้ามกลับมา
   - รูปเครื่องปัก / เครื่องพิมพ์ / ป้ายโรงงาน ยังพิสูจน์ที่มาไม่ได้ และทำให้ดูเหมือนทีมดีมีโรงงานเอง → ห้ามใช้
   ตรวจที่ต้นข้อมูลกับแม่แบบ (ไม่ต้อง build) · หน้าที่ export ตรวจซ้ำใน seo-pages.test.js */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATS } from '../src/js/real-grid.js'
import { NARRATIVE_KEYS, OLD_NARRATIVE, BLOCKLIST, MACHINE_IMG } from '../scripts/lib/clean-rules.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const walk = (d, ok) => readdirSync(d).flatMap((f) => {
  const p = join(d, f)
  return statSync(p).isDirectory() ? walk(p, ok) : ok(f) ? [p] : []
})
/* ไฟล์ที่ประกอบเป็นหน้าเว็บ: ข้อมูล แม่แบบ หน้า (รวมหน้าภายใน /ui/ ที่ไม่ได้ export) JS CSS vite.config.js
   และสคริปต์ v22 ที่เขียน src/data ทับ (ถ้าต้นทางยังมี รันสคริปต์ทีเดียวก็กลับมา) */
const sources = () => [
  ...walk(join(root, 'src'), (f) => /\.(json|hbs|js|css)$/.test(f)),
  ...walk(join(root, 'site'), (f) => f.endsWith('.html')),
  ...walk(join(root, 'scripts/v22'), (f) => f.endsWith('.mjs')),
  join(root, 'vite.config.js'),
]
const hits = (re) => sources().flatMap((f) => (readFileSync(f, 'utf8').match(re) || []).map((m) => `${f.slice(root.length + 1)}: ${m}`))

test('works.json: ไม่มีเรื่องเล่าที่แต่งขึ้น · มีแค่รูปจริง หมวดที่เห็นในรูป และคำบรรยายตามที่เห็น', () => {
  const works = read('src/data/works.json')
  const products = new Set(read('src/data/products.json').map((p) => p.id))
  const uses = new Set(read('src/data/uses.json').map((u) => u.id))
  const cats = new Map(CATS.filter((c) => c.id).map((c) => [c.id, c]))
  assert.ok(works.length > 0)
  const bad = []
  for (const w of works) {
    for (const k of NARRATIVE_KEYS) if (k in w) bad.push(`${w.id}: มีฟิลด์ ${k}`)
    if (!w.img || !existsSync(join(root, 'public', w.img))) bad.push(`${w.id}: ไม่มีไฟล์รูป ${w.img}`)
    if (!cats.has(w.cat)) bad.push(`${w.id}: หมวด ${w.cat} ไม่อยู่ในชิปหน้าแรก`)
    if (!/ใส่เสื้อ.*ที่ทีมดีผลิต$/.test(w.alt || '')) bad.push(`${w.id}: คำบรรยายต้องบอกแค่สิ่งที่เห็น`)
    if (/\d/.test(w.alt || '')) bad.push(`${w.id}: คำบรรยายมีตัวเลข ${w.alt}`)
    if (w.product != null && !products.has(w.product)) bad.push(`${w.id}: สินค้า ${w.product} ไม่มี`)
    if (w.use != null && !uses.has(w.use)) bad.push(`${w.id}: กลุ่ม ${w.use} ไม่มี`)
    for (const u of w.alsoUse || []) if (!uses.has(u)) bad.push(`${w.id}: กลุ่ม ${u} ไม่มี`)
  }
  assert.deepEqual(bad, [])
})

/* แม่แบบเคยแสดง โจทย์ / ทีมดีช่วย / ชื่องาน ของ works · ถ้ามีใครเติมฟิลด์กลับมา หน้าเว็บต้องไม่ดึงไปแสดง */
/** เนื้อในบล็อก {{#each X}} … {{/each}} ที่ X เป็นรายการผลงาน (นับบล็อกซ้อนให้ถูก) */
const eachBlocks = (html, isWorks) => {
  const out = []
  const re = /\{\{#each ([^}]+)\}\}|\{\{\/each\}\}/g
  const stack = []
  for (let m; (m = re.exec(html));) {
    if (m[1]) stack.push({ name: m[1].trim(), at: re.lastIndex })
    else { const open = stack.pop(); if (open && isWorks(open.name)) out.push(html.slice(open.at, m.index)) }
  }
  return out
}

test('แม่แบบไม่ดึงฟิลด์เรื่องเล่าของ works ไปแสดง', () => {
  const tpl = [...walk(join(root, 'src/partials'), (f) => f.endsWith('.hbs')), ...walk(join(root, 'site'), (f) => f.endsWith('.html'))]
  const isWorks = (n) => /^(works|up\.work\.real|pp\.work\.real|homeV4\.realGrid\.items|wk\.photos\.items)$/.test(n)
  const re = /\{\{[^}]*\bthis\.(title|brief|helped|qty|quote|result|event|days|spec|groupName)\b[^}]*\}\}/g
  const bad = tpl.flatMap((f) => eachBlocks(readFileSync(f, 'utf8'), isWorks).flatMap((b) => (b.match(re) || []).map((m) => `${f.slice(root.length + 1)}: ${m}`)))
  assert.deepEqual(bad, [])
})

/* ท่อนเรื่องเล่าเดิม (ชื่องาน คำพูดลูกค้า โจทย์) ห้ามเหลือในต้นทาง · seo-pages.test.js ตรวจแค่หน้าที่ export
   หน้าภายในอย่าง /ui/ ไม่ถูก export จึงต้องตรวจที่นี่ (เคยหลุด "เสื้อประจำปี บริษัทประกันภัย" ใน /ui/ ตอนเทสผ่านหมด) */

test('ไม่มีท่อนเรื่องเล่าเดิมของ works ในข้อมูล แม่แบบ หน้า และสคริปต์ที่สร้างข้อมูล', () => {
  const bad = sources().flatMap((f) => {
    const t = readFileSync(f, 'utf8')
    return OLD_NARRATIVE.filter((s) => t.includes(s)).map((s) => `${f.slice(root.length + 1)}: ${s}`)
  })
  assert.deepEqual(bad, [])
})

/* แบบของแบรนด์ในเครือ (t around) ห้ามอยู่ในคลังแบบ ข้อมูล หรือแม่แบบ · ไฟล์รูปต้องถูกลบ */

test('ไม่มีแบบ TD-0002 / TD-0003 หรือชื่อ t around ในข้อมูล แม่แบบ และไฟล์รูป', () => {
  assert.deepEqual(hits(BLOCKLIST), [])
  const files = readdirSync(join(root, 'public/img/design')).filter((f) => /^d0[23][-.]/.test(f))
  assert.deepEqual(files, [])
  const codes = read('src/data/designs.json').map((d) => d.code)
  assert.equal(new Set(codes).size, codes.length, 'รหัสแบบซ้ำ')
  /* ไม่เลื่อนเลข: แบบที่เหลือคงรหัสเดิม */
  assert.ok(codes.includes('TD-0001') && codes.includes('TD-0004'))
})

/* รูปเครื่องปัก เครื่องพิมพ์ ป้ายโรงงาน (scripts/lib/clean-rules.mjs) */

test('ไม่มีรูปเครื่องจักร / ป้ายโรงงานในข้อมูลและแม่แบบ', () => {
  assert.deepEqual(hits(MACHINE_IMG), [])
})
