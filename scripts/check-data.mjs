/* ตัวตรวจข้อมูล (16 พ.ย. 2026 A2) · `npm run check` · เทส tests/check-data.test.js
   ใช้ตอนแก้ไฟล์ข้อมูลเอง: บอกเป็นภาษาไทยว่าผิดไฟล์ไหน บรรทัดไหน แก้ยังไง
   ผิดจริง (exit 1): JSON ใน src/data พัง · รูป /img/… ที่อ้างใน src/data หรือ site ไม่มีไฟล์ใน public/img
   คำเตือน: title / description ของแต่ละหน้า (อ่านจากผล export ล่าสุด wp-theme/teamdee/build/pages.json · ไม่นับหน้า noindex และ 404) */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HINTS = [
  [/Expected double-quoted property name/, 'มีจุลภาคเกินท้ายรายการ (ลบ , ตัวสุดท้ายก่อน } หรือ ]) หรือชื่อช่องไม่มีเครื่องหมายคำพูด "…"'],
  [/after array element/, 'ลืมจุลภาค (,) คั่นระหว่างรายการ หรือวงเล็บ ] ปิดไม่ครบ'],
  [/after property value/, 'ลืมจุลภาค (,) ท้ายบรรทัดก่อนหน้า'],
  [/Bad control character|Bad escaped character/, 'ขึ้นบรรทัดใหม่หรือใส่ \\ กลางข้อความ · ถ้าต้องการขึ้นบรรทัดใหม่ให้พิมพ์ \\n แทนการกด Enter'],
  [/Unterminated string/, 'ข้อความไม่มีเครื่องหมายคำพูดปิด "'],
]

/** ข้อความ JSON → null (ถูก) หรือ { file, line, col, msg, hint, snippet } */
export function jsonProblem(text, file) {
  try { JSON.parse(text); return null } catch (e) {
    const m = /position (\d+)/.exec(e.message)
    const pos = m ? Number(m[1]) : text.length
    const before = text.slice(0, pos)
    const line = before.split('\n').length
    const col = pos - before.lastIndexOf('\n')
    const atEnd = pos >= text.trimEnd().length
    const hint = atEnd ? 'ไฟล์จบก่อนปิดวงเล็บ } หรือ ] ให้ครบ (ปิดไม่ครบ)' : (HINTS.find(([re]) => re.test(e.message)) || [, 'มีตัวอักษรเกินหรือผิดที่ เช่น เครื่องหมายคำพูดแบบโค้ง “ ” แทน " หรือจุลภาคภาษาไทย'])[1]
    return { file, line, col, msg: e.message.replace(/ in JSON at position \d+.*$/, ''), hint, snippet: text.split('\n')[line - 1] ?? '' }
  }
}

/** path รูป /img/… (มีนามสกุลไฟล์) ที่ exists(path) บอกว่าไม่มี · ไม่ซ้ำ ตามลำดับที่เจอ */
export function missingImages(text, exists) {
  const out = []
  for (const m of text.matchAll(/(\/img\/[^"'\s,)?#{}<>]+\.(?:webp|png|jpe?g|svg|gif|mp4|avif))/gi)) {
    if (!out.includes(m[1]) && !exists(m[1])) out.push(m[1])
  }
  return out
}

/** pages.json → คำเตือน [{ route, msg }] · title ไม่มีหรือยาวเกิน 70 · description ไม่มี สั้นกว่า 70 หรือยาวเกิน 160 */
export function metaWarnings(pages) {
  const out = []
  for (const [route, p] of Object.entries(pages)) {
    if (route === '404' || /noindex/.test(p.robots || '')) continue
    const t = p.title || '', d = p.description || ''
    if (!t) out.push({ route, msg: 'ไม่มี title' })
    else if (t.length > 70) out.push({ route, msg: `title ยาว ${t.length} ตัวอักษร (ไม่ควรเกิน 70 · Google ตัดท้าย)` })
    if (!d) out.push({ route, msg: 'ไม่มี description' })
    else if (d.length < 70) out.push({ route, msg: `description สั้น ${d.length} ตัวอักษร (ควร 70–160)` })
    else if (d.length > 160) out.push({ route, msg: `description ยาว ${d.length} ตัวอักษร (ควร 70–160 · Google ตัดท้าย)` })
  }
  return out
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const rel = (p) => relative(root, p)
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)])
  const exists = (p) => existsSync(join(root, 'public', p))
  const lineOf = (text, s) => text.slice(0, text.indexOf(s)).split('\n').length
  const errors = [], warnings = []

  const dataFiles = readdirSync(join(root, 'src/data')).filter((f) => f.endsWith('.json')).map((f) => join(root, 'src/data', f))
  /* B2 16 พ.ย. 2026: เนื้อหาหน้ากลุ่มลูกค้า/สินค้าอยู่ src/content/<use|product>/<id>.json */
  const contentFiles = existsSync(join(root, 'src/content')) ? walk(join(root, 'src/content')).filter((f) => f.endsWith('.json')) : []
  for (const f of [...dataFiles, ...contentFiles]) {
    const text = readFileSync(f, 'utf8')
    const p = jsonProblem(text, rel(f))
    if (p) { errors.push(`${p.file} บรรทัด ${p.line} คอลัมน์ ${p.col}: JSON ผิด\n     ${p.snippet.trim()}\n     → ${p.hint}`); continue }
    for (const img of missingImages(text, exists)) errors.push(`${rel(f)} บรรทัด ${lineOf(text, img)}: ไม่มีไฟล์รูป ${img} (ต้องอยู่ที่ public${img})`)
  }
  for (const f of walk(join(root, 'site')).filter((x) => x.endsWith('.html'))) {
    const text = readFileSync(f, 'utf8')
    for (const img of missingImages(text, exists)) errors.push(`${rel(f)} บรรทัด ${lineOf(text, img)}: ไม่มีไฟล์รูป ${img} (ต้องอยู่ที่ public${img})`)
  }
  const pj = join(root, 'wp-theme/teamdee/build/pages.json')
  let metaNote = 'ยังไม่มีผล export (รัน npm run export:wp ก่อน ถึงจะตรวจ title/description ได้)'
  if (existsSync(pj)) {
    for (const w of metaWarnings(JSON.parse(readFileSync(pj, 'utf8')).pages)) warnings.push(`${w.route}: ${w.msg}`)
    metaNote = `title/description จากผล export เมื่อ ${statSync(pj).mtime.toLocaleString('th-TH')} (แก้แล้วต้อง export ใหม่ถึงจะเห็นผล)`
  }

  console.log(`ตรวจข้อมูล: JSON ${dataFiles.length} ไฟล์ · เนื้อหาต่อหน้า ${contentFiles.length} ไฟล์ · หน้า site · ${metaNote}`)
  if (warnings.length) { console.log(`\nคำเตือน ${warnings.length} ข้อ (ยังใช้งานได้ แต่ควรแก้):`); for (const w of warnings) console.log(`  - ${w}`) }
  if (errors.length) {
    console.log(`\nข้อผิดพลาด ${errors.length} ข้อ (ต้องแก้ก่อน build):`)
    for (const e of errors) console.log(`  ✗ ${e}`)
    process.exit(1)
  }
  console.log('\nไม่พบข้อผิดพลาด')
}
