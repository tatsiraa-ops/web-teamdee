/* ตรวจ SEO ทุกหน้าจากไฟล์ที่ build สำหรับธีม WordPress (ตัวที่ขึ้นเว็บจริง) · PLAN ข้อ 5.1
   build ใหม่ทุกครั้งที่รัน ใช้เวลาราว 1 วินาที */
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectPage, INTERNAL_PAGES, CMS_PAGES as CMS } from '../scripts/seo-check.mjs'

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
    const html = readFileSync(f, 'utf8')
    return { route: rel === '/404.html' ? '404' : rel, html, ...inspectPage(html) }
  })
})

const indexable = () => pages.filter((p) => !p.noindex)
const fails = (fn) => pages.flatMap((p) => fn(p).map((m) => `${p.route}: ${m}`))

test('ทุกหน้ามี title · description · H1 เดียว', () => {
  assert.ok(pages.length >= 36, `หน้าน้อยผิดปกติ: ${pages.length}`) // v22 ตัด /solutions/ กับ /special/ ออก · เพิ่มขึ้นตามรอบ 4–5
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

/* v22: ห้ามอ้างความเป็นโรงงานของตัวเองจนกว่าจะยืนยัน (อาร์ตสั่ง "เอาตาม v22 ทั้งหมด" 22 ต.ค. 2026)
   ตรวจทั้ง title description H1 เนื้อหา alt และ JSON-LD · ปุ่ม LINE ต้องชี้บัญชีจริง ไม่ใช่ # (เพิ่มเพื่อน ti/p หรือส่งข้อความตั้งต้น oaMessage) */
test('ไม่มีคำว่าโรงงานบนหน้าเว็บจริง · ปุ่ม LINE ชี้บัญชีจริง', () => {
  /* ยกเว้นการ์ดบทความเดิมบนเว็บจริง (data-legacy) · ชื่อบทความเดิมอย่าง "เลือกโรงงานรับผลิตเสื้อ" ไม่ใช่การอ้างว่าเป็นเจ้าของโรงงาน */
  const strip = (h) => h.replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<a [^>]*data-legacy[\s\S]*?<\/a>/g, '')
  assert.deepEqual(fails((p) => (strip(p.html).match(/.{0,30}โรงงาน.{0,30}/g) || [])), [])
  assert.deepEqual(fails((p) => [...p.html.matchAll(/<a [^>]*data-track="line"[^>]*>/g)].map((m) => m[0]).filter((a) => !/href="https:\/\/line\.me\/R\/(ti\/p|oaMessage)\/@teamdee\/?(\?[^"]*)?"/.test(a))), [])
})

/* ข้อความที่ JS เติมทีหลัง (lightbox ฯลฯ) ไม่ได้อยู่ใน HTML · ตรวจไฟล์ JS ที่หน้าเว็บจริงโหลดว่าไม่มี [วงเล็บรอยืนยัน] */
test('JS ที่หน้าเว็บจริงโหลด ไม่มีข้อความ [วงเล็บ] รอยืนยัน', () => {
  const srcs = new Set(pages.filter((p) => !CMS.has(p.route)).flatMap((p) => [...p.html.matchAll(/<(?:script|link)[^>]+(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1])))
  assert.ok(srcs.size > 0)
  const bad = [...srcs].flatMap((f) => (readFileSync(join(dist, f), 'utf8').match(/\[[^\[\]\n]{0,60}[\u0e00-\u0e7f][^\[\]\n]{0,60}\]/g) || []).filter((m) => !m.startsWith('["') && !m.startsWith('[{')).map((m) => `${f}: ${m}`))
  assert.deepEqual(bad, [])
})

/* ข้อความที่เขียนไว้สำหรับต้นแบบ (ร่าง · ยังไม่ได้ต่อระบบ · คุยภายใน) ห้ามหลุดขึ้นเว็บจริง */
test('หน้าที่ export ไม่มีข้อความของต้นแบบ', () => {
  const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '')
  const exported = pages.filter((p) => !CMS.has(p.route) && !/^\/blog\/.+\//.test(p.route))
  assert.deepEqual(exported.flatMap((p) => (strip(p.html).match(/.{0,30}ต้นแบบ.{0,30}/g) || []).map((m) => `${p.route}: ${m}`)), [])
})

/* ลิงก์ภายในบนหน้าที่ export ต้องไปหน้าที่ export ด้วยกัน หรือ URL เดิมที่ v22 สั่งให้คงไว้ (บทความ หมวด หน้าเดิมใน CMS)
   เจอ 22 ต.ค. 2026: /blog/ ลิงก์ไปบทความร่าง /blog/…/ ที่ไม่ได้ export → 404 บน WordPress */
test('ลิงก์ภายในบนหน้าที่ export ไม่พาไปหน้าที่ไม่มีบนเว็บจริง', () => {
  const map = JSON.parse(readFileSync(join(root, 'docs/spec/teamdee-v22/URL-MIGRATION-MAP.json'), 'utf8'))
  const exported = pages.filter((p) => !CMS.has(p.route) && !/^\/blog\/.+\//.test(p.route))
  const ok = new Set([...exported.map((p) => p.route), ...map.live_url_rows.map((r) => new URL(r.old_url).pathname)])
  const bad = exported.flatMap((p) => [...p.html.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)].map((m) => m[1]).filter((h) => !h.startsWith('/wp-') && !/\.[a-z0-9]+$/i.test(h) && !ok.has(h)).map((h) => `${p.route} → ${h}`))
  assert.deepEqual([...new Set(bad)], [])
})

/* หน้าแรกเรียงตาม Wireframe v22 · หัวข้อ H2 ของ v22 (ตัดเลขนำหน้า "02 /") ต้องอยู่ครบและเรียงตามลำดับเดียวกัน
   ส่วนที่ซ่อนบนเว็บจริงเพราะรอข้อมูลไม่นับ */
test('หน้าแรกบนเว็บจริงเรียงหัวข้อตาม v22', () => {
  const v22 = JSON.parse(readFileSync(join(root, 'docs/spec/teamdee-v22/PAGE-CONTENT.json'), 'utf8')).pages.find((p) => p.id === 'home')
  const norm = (t) => t.replace(/^\d+\s*\/\s*/, '').replace(/\s+/g, '')
  /* อาร์ตเคาะ 23 ต.ค. (ตรวจหน้าแรกกลุ่ม 2 ข้อ A): ส่วนชำระเงินกับส่วน 11 รับประกัน รวมเข้า "ทุกออเดอร์ได้ครบ" แล้ว ไม่มีหัวข้อแยก
     รีวิว (04) ขึ้นแล้วด้วยเคสจริงจากอัลบั้มรีวิว LINE → ต้องอยู่ในลำดับ */
  const HIDDEN = ['ชำระค่าเสื้อและเตรียมเอกสารสำหรับองค์กร', '11 / การรับประกันเสื้อและบริการหลังการขาย'].map(norm)
  const want = v22.headings.filter((x) => x.level === 'H2').map((x) => norm(x.text)).filter((t) => !HIDDEN.includes(t))
  const home = pages.find((p) => p.route === '/')
  const got = [...home.html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => norm(m[1].replace(/<[^>]+>/g, '')))
  const at = want.map((t) => got.indexOf(t))
  assert.deepEqual(want.filter((t, i) => at[i] < 0), [], 'หัวข้อ v22 ที่หายไป')
  assert.deepEqual(at, [...at].sort((a, b) => a - b), 'ลำดับหัวข้อไม่ตรง v22')
})

/* ทั้งหน้า (ไม่ใช่แค่ <main>) ต้องไม่มีป้ายต้นแบบและ [วงเล็บรอข้อมูล] · เจอ 22 ต.ค. จาก agent ลูกค้า:
   ป้าย pending-ribbon ในส่วนสถิติหน้ากลุ่มลูกค้า และ "[QR ไลน์ …]" ใน footer ทุกหน้า */
test('หน้าที่ export ไม่มีป้ายต้นแบบ และไม่มี [วงเล็บ] ทั้งหน้ารวม header/footer', () => {
  const exported = pages.filter((p) => !CMS.has(p.route) && !/^\/blog\/.+\//.test(p.route))
  const body = (h) => h.slice(h.indexOf('<body')).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '')
  assert.deepEqual(exported.filter((p) => /class="[^"]*pending-ribbon/.test(p.html)).map((p) => p.route), [], 'มีป้ายต้นแบบ')
  const text = (h) => body(h).replace(/<[^>]+>/g, ' ')
  assert.deepEqual(exported.flatMap((p) => (text(p.html).match(/\[[^\]\n]{1,80}\]/g) || []).map((m) => `${p.route}: ${m}`)), [])
})


test('หน้ากลุ่มลูกค้า: ปุ่มติดต่อเหลือ 2 ชื่อ · กลุ่มกีฬา/ก๊วนปุ่มแรกเป็น LINE · มีเบอร์โทรท้ายเนื้อหา', () => {
  const uses = JSON.parse(readFileSync(join(root, 'src/data/uses.json'), 'utf8'))
  const routes = JSON.parse(readFileSync(join(root, 'src/data/routes.json'), 'utf8'))
  const LINE_FIRST = ['sport', 'badminton', 'running', 'event', 'class']
  const bad = []
  for (const u of uses) {
    const path = routes.uses[u.id]
    const pg = pages.find((p) => p.route === path)
    if (!pg) continue
    const main = pg.html.slice(pg.html.indexOf('<main'), pg.html.indexOf('</main>'))
    /* ปุ่ม (.btn) ที่พาไปติดต่อ: ฟอร์ม LINE โทร */
    const btns = [...main.matchAll(/<a class="btn[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
      .filter(([, h]) => /contact-us|line\.me|^tel:/.test(h))
      .map(([, h, t]) => ({ h, t: t.replace(/<[^>]+>/g, '').trim() }))
    const labels = new Set(btns.map((b) => b.t))
    if (labels.size > 2) bad.push(`${path}: ${[...labels].join(' / ')}`)
    if (LINE_FIRST.includes(u.id) !== /line\.me/.test(btns[0]?.h || '')) bad.push(`${path}: ปุ่มแรก ${btns[0]?.h}`)
    if (!/href="tel:/.test(main)) bad.push(`${path}: ไม่มีเบอร์โทรในเนื้อหา`)
  }
  assert.deepEqual(bad, [])
})

test('กล่องที่เลื่อนซ้ายขวาได้ (ตาราง) กด Tab เข้าไปเลื่อนได้ และมีชื่อ (axe scrollable-region-focusable · เจอที่จอ 375)', () => {
  assert.deepEqual(fails((p) => [...p.html.matchAll(/<div class="[^"]*overflow-x-auto[^"]*"[^>]*>/g)].map((m) => m[0]).filter((t) => !/tabindex="0"/.test(t) || !/aria-label="/.test(t))), [])
})

/* ตรวจซ้ำ 23 ต.ค.: ส่วนชำระเงิน/รับประกันรวมเข้า "ทุกออเดอร์ได้ครบ" แล้ว → HTML จริงต้องมีครบ ไม่ใช่แค่ข้อมูล */
test('หน้าแรก: ทุกออเดอร์ได้ครบ 8 ข้อ มีใบกำกับภาษี เคลม 7 วัน สั่งเพิ่ม 30 วัน · ไม่มีส่วนชำระเงิน/รับประกันแยก', () => {
  const home = pages.find((p) => p.route === '/')
  /* อาร์ตลบหัวข้อส่วนนี้ (23 ต.ค.) · เริ่มนับจากรายการการ์ด */
  const get = home.html.slice(home.html.indexOf('hm-benefits--get'), home.html.indexOf('aria-label="ตัวเลขทีมดี"'))
  assert.equal((get.match(/<li\b/g) || []).length, 8)
  for (const t of ['ใบกำกับภาษี', '7 วันหลังรับสินค้า', 'ภายใน 30 วัน']) assert.ok(get.replace(/<[^>]+>/g, '').includes(t), t)
  assert.ok(!home.html.includes('id="pay-h"') && !home.html.includes('id="care-h"'))
})

test('หน้าแรก: ปุ่ม LINE/โทรทุกจุดบอกตำแหน่ง (data-where) ให้ GTM แยกได้ว่าปุ่มไหนทำยอด', () => {
  const home = pages.find((p) => p.route === '/').html
  const missing = ['hero', 'hero-have', 'cta-design', 'cta-have', 'cta-end', 'mobile-menu', 'mobile-bar', 'float'].filter((w) => !home.includes(`data-where="${w}"`))
  assert.deepEqual(missing, [])
})
