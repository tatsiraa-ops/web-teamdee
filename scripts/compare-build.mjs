/* ด่านเทียบผล build (16 พ.ย. 2026 · ชุด B จัดโครงโค้ดใหม่) · หน้าเว็บต้องออกมาเหมือนเดิมทุกตัวอักษร
   node scripts/compare-build.mjs --save   build dist (ต้นแบบ) + dist-wp (เว็บจริง) แล้วเก็บไว้ที่ .build-baseline/
   node scripts/compare-build.mjs          build ใหม่ เทียบทีละไฟล์กับ baseline · ต่าง = บอกไฟล์ + exit 1 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = join(root, '.build-baseline')
const TARGETS = [['dist', {}], ['dist-wp', { TD_TARGET: 'wp' }]]
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)])

for (const [dir, env] of TARGETS) execSync('npx vite build --logLevel error', { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } })

if (process.argv.includes('--save')) {
  rmSync(base, { recursive: true, force: true })
  for (const [dir] of TARGETS) cpSync(join(root, dir), join(base, dir), { recursive: true })
  console.log(`เก็บ baseline แล้ว: ${TARGETS.map(([d]) => `${d} ${walk(join(base, d)).length} ไฟล์`).join(' · ')}`)
} else {
  if (!existsSync(base)) { console.error('ยังไม่มี baseline · รัน node scripts/compare-build.mjs --save ก่อน'); process.exit(1) }
  /* Vite ใส่แท็ก <link>/<script type="module"> ใน head สลับลำดับได้ระหว่าง build (เจอ 16 พ.ย. · build ซ้ำโดยไม่แก้อะไรก็สลับ)
     → HTML เทียบ "ชุดแท็กเดียวกัน" แยกจากส่วนที่เหลือ · นับไฟล์ที่ต่างแค่ลำดับไว้ให้เห็น */
  const TAG = /<link\b[^>]*>|<script type="module"[^>]*><\/script>/g
  const norm = (s) => ({ tags: (s.match(TAG) || []).sort().join('\n'), rest: s.replace(TAG, '').replace(/\n\s*\n/g, '\n') })
  const diffs = []
  let orderOnly = 0
  for (const [dir] of TARGETS) {
    const a = new Set(walk(join(base, dir)).map((f) => relative(join(base, dir), f)))
    const b = new Set(walk(join(root, dir)).map((f) => relative(join(root, dir), f)))
    for (const f of a) if (!b.has(f)) diffs.push(`${dir}/${f}: หายไป`)
    for (const f of b) if (!a.has(f)) diffs.push(`${dir}/${f}: ไฟล์ใหม่`)
    for (const f of a) {
      if (!b.has(f)) continue
      const x = readFileSync(join(base, dir, f)), y = readFileSync(join(root, dir, f))
      if (x.equals(y)) continue
      if (f.endsWith('.html')) { const p = norm(x.toString()), q = norm(y.toString()); if (p.tags === q.tags && p.rest === q.rest) { orderOnly++; continue } }
      diffs.push(`${dir}/${f}: เนื้อหาต่าง`)
    }
  }
  if (diffs.length) { console.log(`ผล build ต่างจาก baseline ${diffs.length} ไฟล์:`); for (const d of diffs.slice(0, 40)) console.log(`  ${d}`); process.exit(1) }
  console.log(`ผล build ตรงกับ baseline ทุกไฟล์ (${TARGETS.map(([d]) => d).join(' + ')})${orderOnly ? ` · ${orderOnly} ไฟล์ต่างแค่ลำดับแท็ก CSS/JS ใน head (Vite สลับเองทุก build)` : ''}`)
}
