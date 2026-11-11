/* Local-only inventory; never interprets a draft or a working build as approval. */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { videoReady } from '../src/js/video-view.js'
import { gallerySelection } from '../src/js/gallery-selection.js'
const root = fileURLToPath(new URL('../', import.meta.url))
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const designs = json('src/data/designs.json')
const routes = json('src/data/routes.json')
const videos = json('src/data/videos.json').items
const migration = json('docs/spec/teamdee-v22/URL-MIGRATION-MAP.json').live_url_rows
const report = {
  checkedAt: new Date().toISOString(),
  scope: 'Local source readiness only. Staging, delivery and analytics remain unverified.',
  galleries: ['shop', 'class', 'faculty'].map(id => ({ id, url: routes.galleries[id], ...gallerySelection(designs, id), status: 'inspiration-only' })).map(({items, ...r}) => ({ ...r, codes: items.map(d => d.code) })),
  designDrafts: designs.map(d => ({ code: d.code, url: `/design-preview/${d.code.toLowerCase()}/`, imageExists: existsSync(resolve(root, 'public' + d.img)), status: 'awaiting-real-code-and-publication-approval' })),
  articles: Object.entries(routes.posts).map(([id, url]) => ({ id, url, status: 'draft-needs-editorial-review' })),
  sizing: { status: json('src/data/sizing.json').status, required: ['ตารางแยกตามสินค้า/ทรง', 'หน่วยและวิธีวัด', 'ค่าคลาดเคลื่อนที่ยืนยัน', 'ผู้ตรวจและวันที่'] },
  videos: videos.map(v => ({ id: v.id, ready: videoReady(v), missing: ['file','poster','duration','date'].filter(k => !v[k]).concat(v.consent !== true ? ['consent'] : [], v.music !== 'ok' ? ['music'] : []), source: v.links?.fb || v.links?.ig || null })),
  cmsPreservation: migration.map(r => ({ url: new URL(r.old_url).pathname, target: new URL(r.new_url).pathname, action: r.action, localTemplate: existsSync(resolve(root, 'site' + new URL(r.old_url).pathname + 'index.html')), stagingVerified: false })),
  externalChecks: ['WordPress staging: all preserved URLs and legacy CMS content', 'Actual form email delivery and success/failure path', 'GTM consent and conversion events without duplicate events'],
}
const out = resolve(root, 'docs/audit/2026-10-28/readiness.json')
mkdirSync(resolve(root, 'docs/audit/2026-10-28'), { recursive: true })
writeFileSync(out, JSON.stringify(report, null, 2) + '\n')
console.log(`Readiness: ${report.designDrafts.length} design drafts; ${report.articles.length} article drafts; ${report.videos.filter(v=>v.ready).length}/${report.videos.length} original videos ready; ${report.cmsPreservation.length} preserved URLs.\n${out}`)
