/* แพ็กไฟล์สำหรับ Release (16 พ.ย. 2026 C1 ระยะ 1 · รูปอยู่นอกธีม) · `npm run pack` · `npm run pack -- --full`
   1. export ธีมใหม่ (scripts/export-wp.mjs)
   2. release/teamdee-theme-vX.zip           ธีม ~10MB (อัปโหลดผ่านหลังบ้านได้)
   3. release/teamdee-images-new-vX.zip      รูปที่เพิ่ม/แก้ใน public/img ตั้งแต่ tag ก่อน (ไม่มีรูปใหม่ = ไม่สร้าง)
   4. --full: release/teamdee-images-full-vX.zip  รูปทั้งหมด (ครั้งแรก หรือกู้เซิร์ฟเวอร์)
   zip รูปมีโฟลเดอร์ teamdee/img/… → แตกไฟล์ในโฟลเดอร์ wp-content/uploads/ ของเว็บ */
import { execSync, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** ผลของ `git diff --name-status -M` → path รูปใต้ public/img ที่เพิ่ม แก้ หรือเปลี่ยนชื่อ (ไม่เอาที่ลบ · ไม่เอา .DS_Store) */
export function imagesFromGitDiff(text) {
  const out = []
  for (const line of text.split('\n')) {
    const cols = line.split('\t')
    const st = cols[0]
    if (!st || st.startsWith('D')) continue
    const p = st.startsWith('R') || st.startsWith('C') ? cols[2] : cols[1]
    if (!p || !p.startsWith('public/img/') || p.endsWith('.DS_Store')) continue
    out.push(p.slice('public/img/'.length))
  }
  return out
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const sh = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf8' }).trim()
  const args = process.argv.slice(2)
  const full = args.includes('--full')
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  const tag = `v${version}`
  const cmp = (a, b) => { const x = a.slice(1).split('.').map(Number), y = b.slice(1).split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0 }
  const since = args.includes('--since') ? args[args.indexOf('--since') + 1] : sh('git tag --list "v*"').split('\n').filter((t) => /^v\d+\.\d+\.\d+$/.test(t) && cmp(t, tag) < 0).sort(cmp).pop()

  execSync('node scripts/export-wp.mjs', { cwd: root, stdio: 'inherit' })
  const out = join(root, 'release')
  mkdirSync(out, { recursive: true })
  const zip = (name, cwd, list) => {
    const f = join(out, name)
    rmSync(f, { force: true })
    if (list) execFileSync('zip', ['-q', f, '-@'], { cwd, input: list.join('\n') })
    else execFileSync('zip', ['-qr', f, 'teamdee', '-x', '*.DS_Store'], { cwd })
    return `${name} (${(statSync(f).size / 1e6).toFixed(1)} MB)`
  }
  const lines = [zip(`teamdee-theme-${tag}.zip`, join(root, 'wp-theme'))]
  const uploads = join(root, 'wp-theme/uploads')
  if (full) lines.push(zip(`teamdee-images-full-${tag}.zip`, uploads))
  let fresh = []
  if (since) {
    fresh = imagesFromGitDiff(sh(`git diff --name-status -M ${since} HEAD -- public/img`))
    const missing = fresh.filter((p) => !existsSync(join(uploads, 'teamdee/img', p)))
    if (missing.length) throw new Error(`รูปใหม่ไม่อยู่ในผล export: ${missing.slice(0, 5).join(', ')}`)
    if (fresh.length) lines.push(zip(`teamdee-images-new-${tag}.zip`, uploads, fresh.map((p) => `teamdee/img/${p}`)))
  }
  const dirty = sh('git status --porcelain -- public/img')
  console.log(`\npack ${tag}${since ? ` · รูปใหม่ตั้งแต่ ${since}: ${fresh.length} ไฟล์` : ' · ไม่มี tag ก่อนหน้า (ใช้ --full)'}`)
  for (const l of lines) console.log(`  release/${l}`)
  if (dirty) console.log('  ระวัง: มีรูปใน public/img ที่ยังไม่ commit · รูปพวกนี้ไม่อยู่ใน zip รูปใหม่ (commit ก่อนแล้วแพ็กใหม่)')
  console.log('ติดตั้ง: 1) แตก zip รูป (ถ้ามี) ในโฟลเดอร์ wp-content/uploads/  2) อัปโหลดธีมทับ (Appearance → Themes → Upload)  3) ล้างแคช LiteSpeed')
}
