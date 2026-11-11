/* ตรวจ SEO ทุกหน้าจากไฟล์ที่ build สำหรับธีม WordPress (ตัวที่ขึ้นเว็บจริง) · PLAN ข้อ 5.1
   build ใหม่ทุกครั้งที่รัน ใช้เวลาราว 1 วินาที */
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectPage, INTERNAL_PAGES, CMS_PAGES as CMS } from '../scripts/seo-check.mjs'
import { OLD_NARRATIVE, BLOCKLIST, MACHINE_IMG } from '../scripts/lib/clean-rules.mjs'

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
    /* ถอดแท็กตัดบรรทัดไทย (thai-break.js) ก่อนตรวจข้อความ · แท็กอยู่กลางคำ */
    const html = readFileSync(f, 'utf8').replace(/<\/?t-(?:nw|p|g)>/g, '')
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
test('หน้าแรกบนเว็บจริงมีหัวข้อ v22 ครบ (ลำดับตามบอร์ด 3 พ.ย. ตรวจที่ home-board.test.js)', () => {
  const v22 = JSON.parse(readFileSync(join(root, 'docs/spec/teamdee-v22/PAGE-CONTENT.json'), 'utf8')).pages.find((p) => p.id === 'home')
  const norm = (t) => t.replace(/^\d+\s*\/\s*/, '').replace(/\s+/g, '')
  /* อาร์ตเคาะ 23 ต.ค. (ตรวจหน้าแรกกลุ่ม 2 ข้อ A): ส่วนชำระเงินกับส่วน 11 รับประกัน รวมเข้า "ทุกออเดอร์ได้ครบ" แล้ว ไม่มีหัวข้อแยก
     รีวิว (04) ขึ้นแล้วด้วยเคสจริงจากอัลบั้มรีวิว LINE → ต้องอยู่ในลำดับ */
  /* 3 พ.ย. อาร์ตกากบาทส่วนชำระเงินออกจากหน้าแรก (ข้อมูลอยู่ใน FAQ) */
  /* 10 พ.ย. อาร์ตแทนส่วน 07 ผลงานด้วยคลังรีวิว (รูปลูกค้าจริง) */
  const HIDDEN = [norm('ชำระค่าเสื้อและเตรียมเอกสารสำหรับองค์กร'), norm('ผลงานเสื้อโปโลปัก / เสื้อพิมพ์ลาย / เสื้อสกรีน')]
  const want = v22.headings.filter((x) => x.level === 'H2').map((x) => norm(x.text)).filter((t) => !HIDDEN.includes(t))
  const home = pages.find((p) => p.route === '/')
  const got = [...home.html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => norm(m[1].replace(/<[^>]+>/g, '')))
  const at = want.map((t) => got.indexOf(t))
  assert.deepEqual(want.filter((t, i) => at[i] < 0), [], 'หัวข้อ v22 ที่หายไป')
  /* 3 พ.ย. 2026 อาร์ตสั่งจัดลำดับหน้าแรกใหม่ตามบอร์ด Miro ("ลุยเลย") · ลำดับตรวจที่ tests/home-board.test.js · ที่นี่ตรวจแค่ว่าหัวข้อ v22 อยู่ครบ */
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
  /* อาร์ตเคาะ 30 ต.ค. (ตรวจมือถือ): LINE เป็นปุ่มแรกทุกกลุ่ม (เดิมบริษัท/หน่วยงาน/ร้าน/โรงเรียน/คณะ ใช้ฟอร์มก่อน) */
  const LINE_FIRST = uses.map((u) => u.id)
  const bad = []
  for (const u of uses) {
    const path = routes.uses[u.id]
    const pg = pages.find((p) => p.route === path)
    if (!pg) continue
    const main = pg.html.slice(pg.html.indexOf('<main'), pg.html.indexOf('</main>'))
    /* ปุ่ม (.btn) ที่พาไปติดต่อ: ฟอร์ม LINE โทร */
    const btns = [...main.matchAll(/<a class="(?:btn|cb)[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
      .filter(([, h]) => /contact-us|line\.me|^tel:/.test(h))
      .map(([, h, t]) => ({ h, t: t.replace(/<[^>]+>/g, '').trim() }))
    /* ชื่อปุ่มตาม v22 รายส่วน (อาร์ตเคาะ 2 พ.ย. รอบ 54) จึงไม่จำกัด 2 ชื่อแล้ว · ปุ่มแรกยังต้องเป็น LINE */
    if (LINE_FIRST.includes(u.id) !== /line\.me/.test(btns[0]?.h || '')) bad.push(`${path}: ปุ่มแรก ${btns[0]?.h}`)
    if (!/href="tel:/.test(main)) bad.push(`${path}: ไม่มีเบอร์โทรในเนื้อหา`)
  }
  assert.deepEqual(bad, [])
})

test('กล่องที่เลื่อนซ้ายขวาได้ (ตาราง) กด Tab เข้าไปเลื่อนได้ และมีชื่อ (axe scrollable-region-focusable · เจอที่จอ 375)', () => {
  assert.deepEqual(fails((p) => [...p.html.matchAll(/<div class="[^"]*overflow-x-auto[^"]*"[^>]*>/g)].map((m) => m[0]).filter((t) => !/tabindex="0"/.test(t) || !/aria-label="/.test(t))), [])
})

/* โครง v22 ที่อนุมัติ 29 ต.ค. เก็บสิทธิประโยชน์และส่วนชำระเงิน/หลังการขายแยกไว้ครบ */
test('หน้าแรก: ทุกออเดอร์ได้ครบ 8 ข้อ มีใบกำกับภาษี เคลม 7 วัน สั่งเพิ่ม 30 วัน · มีส่วนชำระเงิน/รับประกันตาม v22', () => {
  const home = pages.find((p) => p.route === '/')
  /* อาร์ตลบหัวข้อส่วนนี้ (23 ต.ค.) · เริ่มนับจากรายการการ์ด */
  /* 3 พ.ย.: ส่วนตัวเลขย้ายไปหลังบริการตามบอร์ด → ตัดถึงท้ายแถบสิทธิประโยชน์แทน */
  const from = home.html.indexOf('hm-benefits--get')
  const get = home.html.slice(from, home.html.indexOf('</section>', from))
  assert.equal((get.match(/<li\b/g) || []).length, 8)
  for (const t of ['ใบกำกับภาษี', '7 วันหลังรับสินค้า', 'ภายใน 30 วัน']) assert.ok(get.replace(/<[^>]+>/g, '').includes(t), t)
  /* 3 พ.ย. อาร์ตลบส่วนชำระเงินบนหน้าแรก · ข้อมูลบัตร/วางบิลยังอยู่ใน FAQ */
  assert.ok(home.html.includes('id="aftercare"'), 'aftercare')
  for (const text of ['Visa / Mastercard', 'วางบิล']) assert.ok(home.html.includes(text), text)
})

test('หน้าแรก: ปุ่ม LINE/โทรทุกจุดบอกตำแหน่ง (data-where) ให้ GTM แยกได้ว่าปุ่มไหนทำยอด', () => {
  const home = pages.find((p) => p.route === '/').html
  const missing = ['hero', 'cta-design', 'cta-have', 'home-process', 'home-aftercare-reorder', 'mobile-menu', 'mobile-bar', 'float'].filter((w) => !home.includes(`data-where="${w}"`))
  assert.deepEqual(missing, [])
})

/* อาร์ตเคาะ 24 ต.ค.: เรื่องเล่าผลงานใน works.json แต่งขึ้น · แบบ TD-0002/0003 เป็นของ t around · รูปเครื่องจักรพิสูจน์ที่มาไม่ได้
   ต้นข้อมูลตรวจที่ tests/clean-rules.test.js · ที่นี่ตรวจของที่ขึ้นเว็บจริงจริงๆ (HTML ทุกหน้า + JS ที่หน้าโหลด) */
test('หน้าที่ export: ไม่มีเรื่องเล่าผลงานที่แต่ง · ไม่มีแบบ t around · ไม่มีรูปเครื่องจักร', () => {
  const works = JSON.parse(readFileSync(join(root, 'src/data/works.json'), 'utf8'))
  /* ถ้ามีใครเติม brief / helped / quote / qty กลับเข้า works.json ข้อความนั้นต้องไม่ขึ้นหน้าไหนเลย */
  const narr = [...OLD_NARRATIVE, ...works.flatMap((w) => [w.brief, w.helped, w.quote, w.title, w.qty && `${Number(w.qty).toLocaleString('en-US')} ตัว`]).filter(Boolean)]
  const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|⁠/g, ' ').replace(/\s+/g, ' ')
  const exported = pages.filter((p) => !CMS.has(p.route))
  assert.deepEqual(exported.flatMap((p) => narr.filter((s) => text(p.html).includes(s) || p.html.includes(s)).map((s) => `${p.route}: ${s}`)), [])
  assert.deepEqual(exported.filter((p) => /<dt[^>]*>\s*(โจทย์|ทีมดีช่วย)\s*<\/dt>/.test(p.html)).map((p) => p.route), [], 'การ์ดผลงานยังมีหัวข้อ โจทย์ / ทีมดีช่วย')
  assert.deepEqual(exported.flatMap((p) => (p.html.match(BLOCKLIST) || []).map((m) => `${p.route}: ${m}`)), [])
  assert.deepEqual(exported.flatMap((p) => (p.html.match(MACHINE_IMG) || []).map((m) => `${p.route}: ${m}`)), [])
  const js = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js'))
  assert.deepEqual(js.flatMap((f) => (readFileSync(join(dist, 'assets', f), 'utf8').match(BLOCKLIST) || []).map((m) => `${f}: ${m}`)), [])
})

/* ฟอร์มติดต่อบอกผลตรงๆ (อาร์ตเคาะ 24 ต.ค. ข้อ 6 · audit C2 C4 C8) */
test('หน้าติดต่อ: ไม่มีช่องแนบไฟล์ · ไม่มีกล่องเขียว · มีกล่องส่งไม่ถึง · ไม่มีปุ่มลอย · หน้าขอบคุณเป็นหน้าธีม noindex', () => {
  const contact = pages.find((p) => p.route === '/contact-us/')
  const ty = pages.find((p) => p.route === '/thank-you/')
  assert.ok(contact && ty, 'ไม่พบ /contact-us/ หรือ /thank-you/')
  assert.ok(!/type="file"/.test(contact.html), 'ยังมีช่องแนบไฟล์')
  assert.ok(!/bg-ok-tint|border-ok/.test(contact.html), 'ยังมีกล่องสีเขียว (ใช้ได้เฉพาะตอนส่งสำเร็จ ซึ่งไปหน้าขอบคุณแล้ว)')
  assert.ok(contact.html.includes('id="formFail"') && contact.html.includes('ยังส่งไม่ถึงทีมดี') && contact.html.includes('id="failRetry"'))
  assert.ok(contact.html.includes('data-copy'), 'ไม่มีปุ่มคัดลอกข้อความ')
  for (const p of [contact, ty]) assert.ok(!/data-floats|data-nudge|data-float-cta/.test(p.html), `${p.route}: ยังมีปุ่มลอย/การ์ดแนะนำ`)
  assert.equal(ty.noindex, true)
  assert.equal(ty.h1.length, 1)
  assert.ok(ty.html.includes('id="tyTel"') && ty.html.includes('ส่งโลโก้ / ไฟล์แบบทาง LINE'))
  assert.ok(ty.html.includes('ยังไม่มีข้อมูลยืนยันการส่งฟอร์ม') && !/หน้าทดสอบ/.test(ty.html))
  assert.ok(!ty.html.includes('ได้รับข้อมูลแล้ว'), 'HTML must not claim receipt before a successful submission')
  /* "5 นาที" บนหน้าขอบคุณผูกกับ LINE เท่านั้น */
  assert.deepEqual((ty.html.replace(/<[^>]+>/g, ' ').match(/.{0,20}5 นาที.{0,5}/g) || []).filter((m) => !/LINE/.test(m)), [])
})

/* หน้าสินค้า 6 หน้าบนเว็บจริง · ตามลำดับ v22 (อาร์ตเคาะ 2 พ.ย. 2026) · ส่วน work ซ่อนได้เฉพาะสินค้าที่ยังไม่มีงานจริงที่ยืนยันเทคนิค */
const PP_ROUTES = ['/embroidery/', '/sublimation/', '/screen-printing/', '/custom-printed-warmup-shirts/', '/custom-oversize-jerseys/', '/custom-baseball-shirts/']
const PP_ORDER = ['options', 'fabric', 'detail', 'price', 'quote-h', 'production', 'work', 'reviews', 'size', 'order', 'faq', 'uses', 'end-h']
/* works.json ยังไม่มีงานของ 3 สินค้านี้ · เว็บจริงซ่อนส่วนผลงาน ไม่แต่งรูป · ได้งานจริงแล้วเอาออกจากรายการ */
const NO_WORK_YET = new Set(['/custom-printed-warmup-shirts/', '/custom-oversize-jerseys/', '/custom-baseball-shirts/'])
const PP2_REVIEWS = new Set(Object.entries(JSON.parse(readFileSync(new URL('../src/data/pp-v2.json', import.meta.url), 'utf8'))).filter(([, v]) => v.reviews).map(([id]) => ({ print: '/sublimation/' })[id]).filter(Boolean))
/* หน้าโฉมใหม่ที่จบที่ FAQ (pp-v2.json lean · อาร์ต 6 พ.ย. "ที่เหลือต่อจากอันนี้ลบทิ้งได้หมดยกเว้น footer") ไม่มีส่วนเดิมของ v22 · ตรวจที่ tests/pp-v2.test.js */
const PP2_LEAN = new Set(Object.entries(JSON.parse(readFileSync(new URL('../src/data/pp-v2.json', import.meta.url), 'utf8'))).filter(([, v]) => v && v.lean).map(([id]) => ({ print: '/sublimation/' })[id]).filter(Boolean))
/* หน้าโฉมใหม่ย้ายส่วนขึ้นตามบอร์ดอาร์ต: รีวิว (5 พ.ย.) · เนื้อผ้า (6 พ.ย.) → ส่วนที่ย้ายไม่นับลำดับ v22 */
const PP2_MOVED = Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL('../src/data/pp-v2.json', import.meta.url), 'utf8'))).map(([id, v]) => [({ print: '/sublimation/' })[id], ['reviews', 'fabric', 'types', 'sizes', 'steps', 'faq'].filter((k) => v && v[k]).map((k) => ({ types: 'options', sizes: 'size', steps: 'order' })[k] || k)]).filter(([r]) => r))
const ppMain = (route) => { const h = pages.find((p) => p.route === route).html; return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }

test('เว็บจริง: ส่วนหน้าสินค้าครบและเรียงตาม v22', () => {
  for (const route of PP_ROUTES) {
    if (PP2_LEAN.has(route)) continue
    const main = ppMain(route)
    const want = PP_ORDER.filter((k) => !(k === 'work' && NO_WORK_YET.has(route)))
    const at = want.map((k) => main.indexOf(` id="${k}"`))
    assert.deepEqual(want.filter((_, i) => at[i] < 0), [], route)
    /* หน้าโฉมใหม่ (pp-v2.json มี reviews · บอร์ดอาร์ต 5 พ.ย.) รีวิวย้ายขึ้นต่อจาก "ทำไมต้องสั่งกับทีมดี" · ส่วนอื่นยังเรียงตาม v22 */
    const ord = at.filter((_, i) => !(PP2_MOVED[route] || []).includes(want[i]))
    assert.deepEqual(ord, ord.slice().sort((a, b) => a - b), route)
  }
})

test('เว็บจริง /embroidery/: แม่แบบ v22 · หัวข้องานปัก · ผ้า 6 ชนิดตามตารางราคา · hero รูปจริงไม่เคลมว่าปัก · แถบล่างไป #price', () => {
  const main = ppMain('/embroidery/')
  const page = pages.find((p) => p.route === '/embroidery/').html
  assert.ok(!/v3h|v3-dark|id="spec"|class="lab-/.test(page), 'เศษ poloV3')
  assert.match(main, /<h2[^>]*>[^]*?วางโลโก้และรายละเอียดงานปัก/)
  const prices = JSON.parse(readFileSync(join(root, 'src/data/prices.json'), 'utf8'))
  const fabric = main.slice(main.indexOf(' id="fabric"'), main.indexOf(' id="detail"'))
  for (const c of prices.products.polo.cols) assert.ok(fabric.includes(c.name), c.name)
  const hero = main.slice(main.indexOf('band-hero'), main.indexOf('pp-trust'))
  assert.match(hero, /<img[^>]+src="[^"]*\/img\/customer\/[^"]+"[^>]+fetchpriority="high"/)
  assert.match(hero, /<img[^>]+srcset="/)
  assert.ok(!/ปัก[^"<]*<\/figcaption>/.test(hero), 'คำบรรยายรูปห้ามเคลมว่าปัก')
  assert.match(page, /class="[^"]*mb__[^"]*"[^>]*href="#price"|href="#price"[^>]*class="[^"]*mb__/)
  for (const m of main.matchAll(/<img[^>]+src="[^"]*\/img\/customer\/[^"]+"[^>]*alt="([^"]*)"/g)) assert.ok(!/ปัก/.test(m[1]), m[1])
  assert.match(main.slice(main.indexOf(' id="work"')), /เสื้อโปโลที่ลูกค้าองค์กรใส่จริง/)
})

test('เว็บจริง: รายละเอียดพิมพ์ลายมีตารางจริง · เบสบอลมีรูปจริง 2 ใบในการ์ด · ผ้าเจอร์ซีย์ยืนยันแล้ว · วอร์ม/เบสบอลไม่โชว์รายการผ้าที่ยังไม่ยืนยัน', () => {
  if (!PP2_LEAN.has('/sublimation/')) {
    const print = ppMain('/sublimation/')
    const printDetail = print.slice(print.indexOf(' id="detail"'), print.indexOf(' id="price"'))
    assert.match(printDetail, /จัดวางลาย โลโก้ ชื่อ และเบอร์|จัดวางลาย/)
    assert.match(printDetail, /<table>/)
    assert.ok(!printDetail.replace(/<[^>]+>/g, '').includes('['), 'มีข้อความรอยืนยัน')
  }
  const ball = ppMain('/custom-baseball-shirts/')
  const ballDetail = ball.slice(ball.indexOf(' id="detail"'), ball.indexOf(' id="price"'))
  for (const f of ['loose-119', 'loose-120']) assert.ok(ballDetail.includes(f), f)
  assert.ok(!ball.slice(0, ball.indexOf(' id="detail"')).includes('loose-119'), 'รูปซ้ำในหลักฐานแบบ')
  const fab = (m) => m.slice(m.indexOf(' id="fabric"'), m.indexOf(' id="detail"'))
  const techniques = JSON.parse(readFileSync(join(root, 'src/data/techniques.json'), 'utf8'))
  for (const n of techniques.sublimation.fabricNames) assert.ok(fab(ppMain('/custom-oversize-jerseys/')).includes(n), n)
  const jersey = ppMain('/custom-oversize-jerseys/')
  assert.ok(!/รอยืนยัน/.test(jersey.slice(jersey.indexOf(' id="fabric"'), jersey.indexOf(' id="price"'))), 'ผ้าเจอร์ซีย์ยังมีรอยืนยัน')
  for (const r of ['/custom-printed-warmup-shirts/', '/custom-baseball-shirts/']) {
    assert.ok(!fab(ppMain(r)).includes('pp-fabrics'), `${r}: รายการผ้า`)
    /* หัวข้อคงไว้ให้ตรงสารบัญ · เนื้อหาคือการขอตัวอย่างผ้า (2 พ.ย.) */
    assert.match(fab(ppMain(r)), /<h2/, r)
    assert.match(fab(ppMain(r)), /ขอดูตัวอย่างผ้า/, r)
  }
})

test('เว็บจริง /screen-printing/: H1 เดิม · มีรีวิว · งานจริงอยู่หลังการผลิต', () => {
  const page = pages.find((p) => p.route === '/screen-printing/')
  assert.match(page.h1[0].replace(/\s+/g, ''), /รับทำเสื้อสกรีน/)
  const main = ppMain('/screen-printing/')
  assert.ok(main.indexOf(' id="production"') < main.indexOf(' id="work"'))
  assert.ok(main.includes(' id="reviews"') && main.includes('id="screenGallery"'))
})

/* All product variants must share the production approval gate, including polo tabs. */
test('unapproved size chart values never ship in product pages', () => {
  const sizing = JSON.parse(readFileSync(join(root, 'src/data/sizing.json'), 'utf8'))
  if (sizing.status === 'approved') return
  for (const route of ['/embroidery/', '/sublimation/', '/screen-printing/', '/custom-printed-warmup-shirts/', '/custom-oversize-jerseys/', '/custom-baseball-shirts/', '/size-chart/']) {
    const page = pages.find(p => p.route === route)
    assert.ok(page, route)
    assert.ok(!/<th scope="row">XS<\/th><td>34<\/td>/.test(page.html), route + ': unapproved sizes leaked')
  }
})
