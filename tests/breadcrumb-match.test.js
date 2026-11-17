/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A7: breadcrumb ที่เห็นบนหน้า (nav.crumb2) ต้องตรงกับ BreadcrumbList ใน JSON-LD ทุกหน้า
   รอบตรวจเจอไม่ตรง 21–23 หน้า: หน้าสินค้ามี "สินค้าและบริการ" ที่ไม่ใช่ลิงก์ · ชื่อใน schema ยาวกว่าที่เห็น
   /blog/ ใช้ 2 ชื่อ ("คู่มือและบทความ" / "บทความและไอเดีย") · about / contact / blog / project ไม่มี schema */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const dir = new URL('../wp-theme/teamdee/build/pages/', import.meta.url)
const pagesJson = new URL('../wp-theme/teamdee/build/pages.json', import.meta.url)
const BASE = 'https://team-dee.com'
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

test('ทุกหน้า: breadcrumb ที่เห็น = BreadcrumbList (ชื่อ + ลิงก์ + ลำดับ)', { skip: !existsSync(dir) }, () => {
  const bad = []
  const meta = Object.values(JSON.parse(readFileSync(pagesJson, 'utf8')).pages)
  const noindex = new Set(meta.filter((p) => /noindex/.test(p.robots || '')).map((p) => p.slug))
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.body.html'))) {
    const slug = f.replace('.body.html', '')
    if (noindex.has(slug)) continue
    const body = readFileSync(new URL(f, dir), 'utf8')
    const head = existsSync(new URL(`${slug}.head.html`, dir)) ? readFileSync(new URL(`${slug}.head.html`, dir), 'utf8') : ''
    const nav = body.match(/<nav class="(?:crumb2|td-reader__crumb)[^"]*"[^>]*>([\s\S]*?)<\/nav>/)
    const ld = [...(head + body).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((d) => d['@type'] === 'BreadcrumbList')
    if (!nav && !ld) continue
    if (!nav) { if (slug !== 'designs') bad.push(`${slug}: มี schema แต่ไม่มี crumb บนหน้า`); continue }
    if (!ld) { bad.push(`${slug}: มี crumb แต่ไม่มี BreadcrumbList`); continue }
    const seen = [...nav[1].matchAll(/<(a|span)\b([^>]*)>([\s\S]*?)<\/\1>/g)].filter((m) => !/aria-hidden="true"/.test(m[2]))
      .map((m) => ({ name: text(m[3]), href: (m[2].match(/href="([^"]*)"/) || [])[1] }))
    const items = ld.itemListElement.map((x) => ({ name: x.name, href: x.item ? x.item.replace(BASE, '') : undefined }))
    if (JSON.stringify(seen) !== JSON.stringify(items)) bad.push(`${slug}: เห็น ${seen.map((x) => x.name).join(' / ')} · schema ${items.map((x) => x.name).join(' / ')}`)
  }
  assert.deepEqual(bad, [])
})
