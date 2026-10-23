/* ตรวจ URL เดิม 44 รายการตาม docs/spec/teamdee-v22/URL-MIGRATION-MAP.json บนเว็บที่ระบุ (staging หรือเว็บจริง) · มีเทส tests/url-check.test.js
   อ่านอย่างเดียว (GET ไม่ตามรีไดเรกต์) · ใช้ก่อนย้าย (เก็บผลไว้เทียบ) วันย้าย และหลังย้าย
   รัน: node scripts/check-urls.mjs https://team-dee.com            → เว็บจริง
        node scripts/check-urls.mjs https://staging.example --staging → staging (ยอมให้ noindex ทั้งเว็บ)
   ผล: แสดงรายการที่ไม่ผ่าน · exit 1 ถ้ามี · เขียนผลเต็มลง docs/reports/url-check-<host>-<วันที่>.json */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const path = (u) => { try { return new URL(u, 'https://x').pathname } catch { return '' } }

/** ตัดสินแถวเดียว · res = { status, location, robots, canonical } · คืนรายการปัญหา (ว่าง = ผ่าน) */
export function judge(row, res, base = 'https://team-dee.com', { staging = false } = {}) {
  const p = path(row.old_url)
  const want = path(row.new_url || row.old_url)
  const out = []
  if (row.action === 'PRESERVE_REDIRECT') {
    if (![301, 308].includes(res.status)) out.push(`${p}: ต้อง redirect 301 ไป ${want} · ได้ ${res.status}`)
    else if (path(res.location) !== want) out.push(`${p}: redirect ผิดปลายทาง · ได้ ${res.location}`)
    return out
  }
  if (res.status !== 200) {
    out.push(`${p}: ต้องตอบ 200 ที่ URL เดิม · ได้ ${res.status}${res.location ? ' → ' + res.location : ''}`)
    return out
  }
  const noindex = /noindex/i.test(res.robots || '')
  if (row.action === 'KEEP_NOINDEX') {
    if (!noindex) out.push(`${p}: ต้องมี noindex`)
  } else if (noindex && !staging) out.push(`${p}: ติด noindex (หน้านี้ต้องให้ Google เก็บ)`)
  if (row.action === 'KEEP' && res.canonical && path(res.canonical) !== p) out.push(`${p}: canonical ชี้ไป ${res.canonical}`)
  return out
}

async function fetchRow(base, row) {
  const target = new URL(path(row.old_url), base).href
  const r = await fetch(target, { redirect: 'manual', headers: { 'User-Agent': 'TEAMDEE-url-check/1.0' } })
  const html = r.status === 200 ? await r.text() : ''
  const head = html.slice(0, html.indexOf('</head>') + 1 || 200000)
  const robots = (head.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)/i) || [])[1] || r.headers.get('x-robots-tag') || ''
  const canonical = (head.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [])[1] || ''
  return { status: r.status, location: r.headers.get('location') || '', robots, canonical }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = process.argv[2]
  const staging = process.argv.includes('--staging')
  if (!base) { console.error('ใส่โดเมน เช่น node scripts/check-urls.mjs https://team-dee.com'); process.exit(2) }
  const map = JSON.parse(readFileSync(new URL('../docs/spec/teamdee-v22/URL-MIGRATION-MAP.json', import.meta.url), 'utf8'))
  const rows = map.live_url_rows
  const results = []
  for (const row of rows) {
    let res
    try { res = await fetchRow(base, row) } catch (e) { res = { status: 0, error: String(e) } }
    results.push({ url: path(row.old_url), action: row.action, ...res, problems: judge(row, res, base, { staging }) })
  }
  const bad = results.filter((r) => r.problems.length)
  const host = new URL(base).host
  const day = new Date().toISOString().slice(0, 10)
  mkdirSync(new URL('../docs/reports/', import.meta.url), { recursive: true })
  writeFileSync(new URL(`../docs/reports/url-check-${host}-${day}.json`, import.meta.url), JSON.stringify({ base, staging, checked: results.length, failed: bad.length, results }, null, 1))
  console.log(`ตรวจ ${results.length} URL บน ${host} · ไม่ผ่าน ${bad.length}`)
  for (const r of bad) for (const p of r.problems) console.log('  -', p)
  process.exit(bad.length ? 1 : 0)
}
