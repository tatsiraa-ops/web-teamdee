// export ต้นแบบลงธีม WordPress · `npm run export:wp`
// ต้นฉบับยังเป็น Vite + Handlebars (ตกลงแบบ ก. กับอาร์ต 20 ต.ค. 2026) ไฟล์ในธีมเป็นผลลัพธ์ ห้ามแก้มือ
// 1. build ด้วย TD_TARGET=wp → dist-wp/ (ตัด hero ต้นแบบ ไม่ทำ sitemap)
// 2. คัด assets / img / logo / files ลง wp-theme/teamdee/build/
// 3. แต่ละหน้า: เก็บส่วน head (CSS JS ฟอนต์ JSON-LD) กับ body ทั้งก้อน · บอก title / description / robots ไว้ใน pages.json
// 4. เปลี่ยน path ไฟล์ /img/ /assets/ ... ให้ชี้เข้าโฟลเดอร์ธีม (ทั้ง HTML CSS JS)
import { execSync } from 'node:child_process'
import { isExported } from './seo-check.mjs'
import { makeRewrite } from './wp-rewrite.mjs'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist-wp')
const out = join(root, 'wp-theme/teamdee/build')
/* ธีมติดตั้งที่ /wp-content/themes/teamdee ทั้งในเครื่องและเว็บจริง (WordPress อยู่ที่ราก)
   ถ้าเว็บจริงติดตั้งใน sub-folder ต้องเปลี่ยนค่านี้ */
const THEME_URL = process.env.TD_THEME_URL || '/wp-content/themes/teamdee/build'
/* หน้าที่มีไว้ใช้ภายในต้นแบบ ไม่ขึ้นเว็บจริง */

execSync('npx vite build', { cwd: root, stdio: 'inherit', env: { ...process.env, TD_TARGET: 'wp' } })

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'pages'), { recursive: true })

const rewrite = makeRewrite({ themeUrl: THEME_URL, baseUrl: JSON.parse(readFileSync(join(root, 'src/data/site.json'), 'utf8')).baseUrl })

const copyRewritten = (from, to) => {
  for (const e of readdirSync(from, { withFileTypes: true })) {
    const a = join(from, e.name), b = join(to, e.name)
    if (e.isDirectory()) { mkdirSync(b, { recursive: true }); copyRewritten(a, b) }
    else if (/\.(js|css)$/.test(e.name)) writeFileSync(b, rewrite(readFileSync(a, 'utf8')))
    else cpSync(a, b)
  }
}
for (const d of ['assets', 'img', 'logo', 'files']) {
  if (!existsSync(join(dist, d))) continue
  mkdirSync(join(out, d), { recursive: true })
  copyRewritten(join(dist, d), join(out, d))
}
for (const f of ['favicon.svg', 'apple-touch-icon.png']) if (existsSync(join(dist, f))) cpSync(join(dist, f), join(out, f))

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n)
  if (statSync(p).isDirectory()) return ['assets', 'img', 'logo', 'files'].includes(n) && dir === dist ? [] : walk(p)
  return n.endsWith('.html') ? [p] : []
})

const pick = (re, s) => (re.exec(s) || [])[1] ?? null
const decode = (s) => s && s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const pages = {}
for (const file of walk(dist)) {
  const rel = relative(dist, file).replace(/\\/g, '/')
  const route = rel === '404.html' ? '404' : '/' + rel.replace(/index\.html$/, '')
  if (!isExported(route)) continue
  const html = readFileSync(file, 'utf8')
  const head = pick(/<head>([\s\S]*?)<\/head>/, html) || ''
  const body = pick(/<body[^>]*>([\s\S]*)<\/body>/, html) || ''
  const slug = route === '/' ? 'home' : route === '404' ? '404' : route.replace(/^\/|\/$/g, '').replace(/\//g, '--')
  /* ส่วน head ที่ WordPress / ปลั๊กอิน SEO จะใส่เอง ไม่ใส่ซ้ำ: charset viewport title description robots canonical */
  const headExtra = head
    .replace(/<meta charset[^>]*>/i, '')
    .replace(/<meta name="viewport"[^>]*>/i, '')
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta name="description"[^>]*>/i, '')
    .replace(/<meta name="robots"[^>]*>/i, '')
    .replace(/<link rel="canonical"[^>]*>/i, '')
    .replace(/\n\s*\n/g, '\n')
    .trim()
  /* คอมเมนต์ภายใน (โน้ตทีม · ที่มาของข้อมูล) ไม่ต้องหลุดไปเว็บจริง (agent ความเร็ว 23 ต.ค.: หน้าแรกมี 17 จุด) */
  const noNotes = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\n\s*\n/g, '\n')
  writeFileSync(join(out, 'pages', `${slug}.head.html`), rewrite(noNotes(headExtra)) + '\n')
  writeFileSync(join(out, 'pages', `${slug}.body.html`), rewrite(noNotes(body.trim())) + '\n')
  pages[route] = {
    slug,
    title: decode(pick(/<title>([\s\S]*?)<\/title>/, head)),
    description: decode(pick(/<meta name="description" content="([^"]*)"/, head)),
    robots: pick(/<meta name="robots" content="([^"]*)"/, head),
    /* ชื่อสั้นสำหรับสร้างหน้า WordPress · เอาจาก h1 ตัวแรก (ตัดแท็กออก) */
    h1: decode((pick(/<h1[^>]*>([\s\S]*?)<\/h1>/, body) || pick(/role="heading" aria-level="1"[^>]*>([\s\S]*?)<\/p>/, body) || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) || null,
  }
}
writeFileSync(join(out, 'pages.json'), JSON.stringify({ generated: new Date().toISOString(), themeUrl: THEME_URL, pages }, null, 1))
console.log(`export-wp: ${Object.keys(pages).length} หน้า → ${relative(root, out)}`)
