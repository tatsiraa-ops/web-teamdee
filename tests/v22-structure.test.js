/* เทียบโครงหน้ากับ Wireframe v22 (PAGE-CONTENT.json + PAGE-MAP.json) · build ต้นแบบ (dist) ที่โชว์ทุกส่วน รวมช่องรอข้อมูล
   ทุกหัวข้อ H2 ของ v22 ต้องมีในหน้าเดียวกัน (ข้อความตรง ไม่สนช่องว่าง/เลขข้อนำหน้า) · หน้าเว็บจริงซ่อนส่วนที่ยังไม่มีของจริงได้ ตรวจที่ seo-pages.test.js
   ยกเว้นที่ตั้งใจไว้ (EXCEPT) ต้องมีเหตุผลกำกับ */
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const spec = (f) => JSON.parse(readFileSync(join(root, 'docs/spec/teamdee-v22', f), 'utf8')).pages
const content = Object.fromEntries(spec('PAGE-CONTENT.json').map((p) => [p.id, p]))
const pages = spec('PAGE-MAP.json').filter((p) => !p.id.startsWith('design-wf'))
const norm = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x3D;/g, '=').replace(/\s+/g, '')
/* หน้ากลุ่มลูกค้า: H2 ที่ไม่ใช่หัวข้อแบบเสื้อ/FAQ ใช้ชื่อแรก แทนชื่อเต็ม "ก / ข / ค" (agent ลูกค้า 22 ต.ค. · scripts/v22/use-pages.mjs shortenH2) */
const longNames = JSON.parse(readFileSync(join(root, 'src/data/uses.json'), 'utf8')).map((u) => u.name).filter((n) => n.includes(' / '))
const variants = (h) => {
  const t = h.replace(/^\d+\s*\/\s*/, '') // หน้าแรก v22 ใส่เลขส่วน "02 / " นำหน้า
  return [t, ...longNames.filter((n) => t.includes(n)).map((n) => t.replace(n, n.split(' / ')[0]))].map(norm)
}
const h2Of = (id, re) => content[id].headings.filter((x) => x.level === 'H2' && re.test(x.text)).map((x) => x.text)
const EXCEPT = {
  /* หน้าเนื้อหาเดิมบน CMS เว็บจริง ไม่ export (seo-check.mjs CMS_PAGES) */
  privacy: 'all',
  /* /project/ รอบ 169 (อาร์ต 9 พ.ย. "เสียงจากผู้สั่งฯ + เรื่องราวจากทีมลูกค้า เอามารวมกัน"): เรื่องเด่น 4 เรื่องอยู่ในกระดานรีวิว (H3 + ป้าย "เรื่องเด่นจากทีมลูกค้า") ไม่มี H2 แยก · ตรวจที่ review-book.test.js */
  works: ['เรื่องราวจากทีมลูกค้า'],
  /* /about-us/ รอบ 170v (อาร์ต 9 พ.ย. "ต่อ" แคปข้อมูลบริษัท): ส่วนนัดหมายรวมเข้าส่วนข้อมูลบริษัท (ที่อยู่ แผนที่ ปุ่มนัดเข้าพบ) ไม่มี H2 แยก · ตรวจที่ about-v2.test.js */
  about: ['นัดหมายที่ออฟฟิศทีมดี นนทบุรี'],
  /* การ์ดแนะนำของ v22 เป็นบทความร่าง (noindex) → แนะนำบทความเดิมแทน */
  /* อาร์ตอนุมัติ 27 ต.ค.: บทความสองเส้นทาง เลือกให้เป็น + เห็นไอเดีย; ตรวจหัวข้อใหม่แยกใน blog-model.test.js */
  articles: ['เสื้อโปโลปักกับเสื้อพิมพ์ลาย เลือกแบบไหนสำหรับพนักงาน?', 'เรื่องแนะนำ', 'เลือกเรื่องที่สนใจ'],
  /* หน้าแรก: ชำระเงิน + รับประกัน รวมเข้าส่วน "ทุกออเดอร์ได้ครบ" (อาร์ตเคาะ 23 ต.ค. · ตรวจหน้าแรกกลุ่ม 2 ข้อ A) */
  /* 3 พ.ย. อาร์ตกากบาทส่วนชำระเงินออกจากหน้าแรก (ข้อมูลบัตร วางบิล ใบกำกับภาษี อยู่ใน FAQ และแถบสิทธิประโยชน์) */
  /* 10 พ.ย. 2026 อาร์ต: ส่วน 07 ผลงานเสื้อบนหุ่น → คลังรีวิว (รูปลูกค้าจริง · reviewWall.hbs) "อันนี้เอาคลังรีวิวไปใส่" */
  home: ['ชำระค่าเสื้อและเตรียมเอกสารสำหรับองค์กร', '07 / ผลงานเสื้อโปโลปัก / เสื้อพิมพ์ลาย / เสื้อสกรีน'],
  /* สกรีนของทีมดีมีแค่ DFT ไม่มีหลายวิธีให้เลือก (อาร์ตเคาะ 26 ต.ค.) → H2 เป็น "วางลายสกรีน DFT ตามลาย ผ้า และจำนวน" (claims.mjs) */
  screen: ['เลือกวิธีสกรีนจากลาย ผ้า และจำนวน', 'รีวิวจากลูกค้าเสื้อสกรีน'],
  /* หัวข้อเหนือตัวกรอง /designs/ เดิม "เลือกแบบตามงานที่ใช้" ชนกับหัวข้อตัวกรอง "งาน" (พิมพ์ลาย งานปัก งานสกรีน) → "ค้นหาและกรองแบบเสื้อ" (อาร์ตเคาะ 26 ต.ค. ตรวจคำ SEO) */
  designs: ['เลือกแบบตามงานที่ใช้'],
  /* หน้าสินค้า: รีวิวจริงจากแชท (27 ต.ค.) ไม่ได้บอกว่าลูกค้าสั่งสินค้าอะไร → หัวข้อ "รีวิวจากลูกค้าทีมดี" แทน "รีวิวจากลูกค้าเสื้อ…" ที่จะไม่จริง · ได้รีวิวตามสินค้าแล้วค่อยเอาออก */
  /* polo งานจริง: ยังไม่มีรูปที่ยืนยันว่าเป็นงานปัก · รูปลูกค้าใส่โปโลห้ามเคลมว่าปัก → หัวข้อ "เสื้อโปโลที่ลูกค้าองค์กรใส่จริง" แทน "ผลงานเสื้อโปโลปักจริง" (อาร์ตเคาะ 2 พ.ย.) · ได้รูปงานปักที่ยืนยันแล้วค่อยเอาออก */
  polo: ['รีวิวจากลูกค้าเสื้อโปโลปัก'], printed: ['รีวิวจากลูกค้าเสื้อพิมพ์ลาย', 'ผ้าและสเปกเสื้อพิมพ์ลาย', 'เลือกทรงและแนวแบบเสื้อพิมพ์ลาย', 'เลือกทรงและไซซ์เสื้อพิมพ์ลาย'], /* + ส่วนไซซ์เดิมแทนด้วยตารางไซซ์จริง 6 พ.ย. (pp2Sizes · id size เดิม) */ /* + ส่วนตัวเลือกเดิมแทนด้วยส่วนประเภท+ทรงเสื้อ 6 พ.ย. (pp2Types · id options เดิม) */ /* + ส่วนผ้าเดิมแทนด้วยส่วนเนื้อผ้าตามบอร์ดอาร์ต 6 พ.ย. (pp2Fabric · ตรวจที่ pp-v2.test.js) */
  warmup: ['รีวิวจากลูกค้าเสื้อวอร์มพิมพ์ลาย'], baseball: ['รีวิวจากลูกค้าเสื้อเบสบอล'], oversize: ['รีวิวจากลูกค้าเสื้อเจอร์ซีย์ Oversize'],
  /* ยังไม่มีรีวิวตรงกลุ่ม: เสื้อรุ่นกับเสื้อคณะซ่อนส่วนรีวิว ไม่เอารีวิวกลุ่มอื่นมาแทน (อาร์ตเคาะ 2 พ.ย. 2026) */
  class: h2Of('class', /^รีวิว/), faculty: h2Of('faculty', /^รีวิว/),
  /* /corporate/ โฉมใหม่ (use-v2.json): อาร์ต 3 พ.ย. "ลบ" ส่วนแบบเสื้อเดิมใต้บริบทงาน · โครงอาร์ตมีส่วน "3D ผลงานแบบเสื้อบริษัท" ทีหลัง (ยังไม่ทำ) ใส่กลับแล้วเอาออก */
  business: ['แบบเสื้อบริษัท สำหรับเริ่มคุยกับทีมดี',
    /* อาร์ต 3 พ.ย. "ลบ" หัวข้อทีมดี + ไทม์ไลน์ + การ์ดบริษัท เหลือการ์ดพบทีมดี (up2Team.hbs) */
    'ทีมดี คนที่ช่วยดูแลงานเสื้อของคุณ',
    /* อาร์ต 4 พ.ย. "ลบตามภาพ 1 2 3 4" (use-v2.json corp.drop) · ส่วนปิดหน้าไม่ใช่ H2 ของ v22 จึงไม่อยู่ในรายการนี้ */
    'วางงบและขั้นตอนสั่งเสื้อบริษัท', 'ภาพลูกค้าบริษัทสวมเสื้อในวันใช้งานจริง', 'มีวันที่ต้องใช้เสื้อแล้ว?'],
}

before(() => execSync('npx vite build --logLevel error', { cwd: root, stdio: 'pipe' }))

test('ทุกหน้าในผัง v22 มีไฟล์ · H2 ของ v22 อยู่ครบในต้นแบบ', () => {
  const bad = []
  for (const p of pages) {
    if (EXCEPT[p.id] === 'all' || LEAN.has(p.id)) continue
    const f = join(root, 'dist', p.proposed_url === '/404/' ? '404.html' : `${p.proposed_url}index.html`)
    if (!existsSync(f)) { bad.push(`${p.proposed_url}: ไม่มีหน้า`); continue }
    const html = readFileSync(f, 'utf8')
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    const got = [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => norm(m[1]))
    for (const h of content[p.id].headings.filter((x) => x.level === 'H2').map((x) => x.text)) {
      if ((EXCEPT[p.id] || []).includes(h)) continue
      /* หัวข้อโจทย์ v22 ซ้ำ 9 หน้า · เขียนใหม่รายกลุ่ม (อาร์ตเคาะ 2 พ.ย. · scripts/v22/copy-fixes.mjs PAIN_H) */
      if (/^ช่วยคนสั่งเสื้อ.*จัดการรายละเอียดให้ชัด$/.test(h)) continue
      if (!variants(h).some((v) => got.some((g) => g.includes(v)))) bad.push(`${p.proposed_url}: ไม่มี H2 "${h}"`)
    }
  }
  assert.deepEqual(bad, [])
})

/* หน้ากลุ่มลูกค้า 10 หน้า (อาร์ตเคาะ 2 พ.ย. 2026 · ยกเลิก "หลักฐานขึ้นครึ่งบน" 24 ต.ค. ข้อ 5): ลำดับ H2 ตรง v22 ทุกส่วน
   ส่วนเพิ่มจาก v22 มี 2 ที่เท่านั้น: กล่องหลักฐานแบบ (#design-evidence-h ต่อจากแบบเสื้อ) · ปิดหน้า "เล่าโจทย์ของทีมคุณมา" (#end-h ท้ายสุด) */
const useRoutes = JSON.parse(readFileSync(join(root, 'src/data/routes.json'), 'utf8')).uses
const customers = JSON.parse(readFileSync(join(root, 'src/data/customers.json'), 'utf8'))
const ups = JSON.parse(readFileSync(join(root, 'src/data/use-pages.json'), 'utf8'))
const usePages = Object.entries(useRoutes).map(([id, url]) => ({ id, url, spec: pages.find((p) => p.proposed_url === url) }))
/* โฉมใหม่ (use-v2.json · อาร์ต 3 พ.ย. "ลบ" แถบสิทธิพิเศษ + สารบัญ) ไม่มีแถบและสารบัญ · ตรวจแทนที่ tests/use-v2.test.js */
const v2Ids = new Set(Object.keys(JSON.parse(readFileSync(join(root, 'src/data/use-v2.json'), 'utf8'))).filter((k) => k[0] !== '_'))
const useMain = (url) => { const h = readFileSync(join(root, 'dist', `${url}index.html`), 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const sectionOf = (html, id) => { const at = html.indexOf(`id="${id}"`); return at < 0 ? '' : html.slice(at, html.indexOf('</section>', at)) }
const imgs = (html) => [...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1])
const photoOf = (src) => customers.find((c) => c.img === src || c.imgSmall === src)

test('หน้ากลุ่มลูกค้า: ลำดับ H2 ตรง v22 ทุกส่วน · หลักฐานแบบต่อจากแบบเสื้อ · ปิดหน้าท้ายสุด', () => {
  assert.equal(usePages.length, 10)
  for (const { id, url, spec: p } of usePages) {
    /* โฉมใหม่เรียงตามโครงที่อาร์ตวาง (3 พ.ย.) ไม่ใช่ลำดับ v22 · H2 ยังต้องอยู่ครบ (เทสแรก) · ลำดับตรวจที่ tests/use-v2.test.js */
    if (v2Ids.has(id)) continue
    const h2 = [...useMain(url).matchAll(/<h2([^>]*)>([\s\S]*?)<\/h2>/g)].map((m) => ({ id: (m[1].match(/id="([^"]+)"/) || [])[1], t: norm(m[2]) }))
    assert.equal(h2.at(-1).id, 'end-h', `${url}: ปิดหน้าต้องอยู่ท้ายสุด`)
    const proof = h2.findIndex((h) => h.id === 'design-evidence-h')
    if (proof >= 0) assert.equal(h2[proof - 1].t, norm(ups[id].designs.h), `${url}: หลักฐานแบบต้องต่อจากแบบเสื้อ`)
    const got = h2.filter((h) => !['end-h', 'design-evidence-h'].includes(h.id)).map((h) => h.t)
    const want = content[p.id].headings.filter((x) => x.level === 'H2' && !(EXCEPT[p.id] || []).includes(x.text)).map((x) => x.text)
    assert.equal(got.length, want.length, `${url}: จำนวน H2\n${got.join('\n')}`)
    want.forEach((h, i) => assert.ok(/^ช่วยคนสั่งเสื้อ.*จัดการรายละเอียดให้ชัด$/.test(h) || variants(h).some((v) => got[i].includes(v)), `${url} ลำดับ ${i + 1}: ต้องเป็น "${h}" แต่เจอ "${got[i]}"`))
  }
})

test('หน้ากลุ่มลูกค้า: สารบัญเรียงตามลำดับส่วนจริง · มีรีวิวเมื่อส่วนรีวิวขึ้น', () => {
  for (const { id, url } of usePages) {
    if (v2Ids.has(id)) continue
    const main = useMain(url)
    const toc = main.slice(main.indexOf('ข้ามไปยังหัวข้อในหน้านี้'), main.indexOf('</nav>', main.indexOf('ข้ามไปยังหัวข้อในหน้านี้')))
    const keys = [...toc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1])
    assert.equal(keys.includes('reviews'), main.includes('id="reviews"'), `${url}: สารบัญกับส่วนรีวิวไม่ตรงกัน`)
    assert.deepEqual([...keys].sort((a, b) => main.indexOf(`id="${a}"`) - main.indexOf(`id="${b}"`)), keys, url)
    for (const k of keys) assert.ok(main.includes(`id="${k}"`), `${url}: ไม่มีส่วน #${k}`)
  }
})

test('หน้ากลุ่มลูกค้า: ภาพลูกค้ามาจากกลุ่มของหน้าเท่านั้น เรียง q · คำบรรยายและ alt = occ ไม่ซ้ำกัน', () => {
  const v2All = JSON.parse(readFileSync(join(root, 'src/data/use-v2.json'), 'utf8'))
  for (const { id, url } of usePages) {
    /* ส่วนที่อาร์ตสั่งลบในหน้านั้น (use-v2.json drop) ต้องไม่มีจริง · ตรวจแทนที่ tests/use-v2.test.js */
    if (v2All[id]?.drop?.includes('photos')) { assert.equal(sectionOf(useMain(url), 'photos'), '', url); continue }
    const sec = sectionOf(useMain(url), 'photos')
    const list = imgs(sec).map(photoOf)
    assert.ok(list.length >= 6, `${url}: ภาพลูกค้า ${list.length}`)
    for (const c of list) assert.equal(c?.photoGroup, id, `${url}: ${c?.img} ไม่ใช่ภาพกลุ่มนี้`)
    assert.deepEqual(list.map((c) => c.q), list.map((c) => c.q).sort((a, b) => b - a), `${url}: เรียง q`)
    const alts = [...sec.matchAll(/<img[^>]*\salt="([^"]*)"/g)].map((m) => m[1])
    assert.deepEqual(alts, list.map((c) => c.occ), `${url}: alt`)
    assert.equal(new Set(alts).size, alts.length, `${url}: alt ซ้ำ`)
    const caps = [...sec.matchAll(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g)].map((m) => norm(m[1]))
    assert.deepEqual(caps, list.map((c) => norm(c.occ)), `${url}: คำบรรยาย`)
  }
})

test('หน้ากลุ่มลูกค้า: ส่วนเสื้อจริงมี 3 ภาพ ปุ่ม LINE + ลิงก์สินค้า · 7 หน้าใช้ภาพกลุ่มตัวเอง · ไม่ซ้ำส่วนภาพลูกค้า', () => {
  for (const { id, url } of usePages) {
    /* โฉมใหม่ใช้โชว์รูมหน้าแรกแทน (อาร์ต 3 พ.ย.) · ตรวจที่ tests/use-v2.test.js */
    if (v2Ids.has(id)) continue
    const main = useMain(url)
    const work = sectionOf(main, 'work')
    const src = imgs(work)
    assert.equal(src.length, 3, `${url}: ภาพงานจริง ${src.length}`)
    assert.equal((work.match(/>สนใจงานแนวนี้</g) || []).length, 3, `${url}: ปุ่มสนใจงานแนวนี้`)
    assert.equal((work.match(/href="https:\/\/line\.me\/R\/oaMessage\/[^"]+"/g) || []).length, 3, `${url}: LINE`)
    assert.equal((work.match(/class="up-work__product"/g) || []).length, 3, `${url}: ลิงก์สินค้า`)
    const photos = imgs(sectionOf(main, 'photos')).map((s) => photoOf(s).img)
    for (const s of src) assert.ok(!photos.includes(s), `${url}: ${s} ซ้ำส่วนภาพลูกค้า`)
    if (['shop', 'gov', 'edu', 'class', 'faculty', 'badminton', 'running'].includes(id)) {
      for (const s of src) {
        const c = photoOf(s)
        assert.equal(c?.photoGroup, id, `${url}: ${s}`)
        assert.ok(norm(work).includes(norm(c.occ)), `${url}: คำบรรยาย ${c.occ}`)
      }
    }
  }
})

test('หน้ากลุ่มลูกค้า: รีวิวตรงกลุ่ม · ร้านค้า รีสอร์ท · หน่วยงาน โรงพยาบาลกับ NT · วิ่ง นักวิ่งก่อน · รุ่นกับคณะซ่อน', () => {
  const rv = (url) => imgs(sectionOf(useMain(url), 'reviews')).map((s) => s.match(/rv\d+/)?.[0])
  assert.deepEqual(rv('/custom-staff-shirts/'), ['rv384'])
  assert.deepEqual(rv('/custom-organization-shirts/'), ['rv417', 'rv235'])
  assert.equal(rv('/custom-running-shirts/')[0], 'rv271')
  assert.equal(useMain('/custom-class-shirts/').includes('id="reviews"'), false)
  assert.equal(useMain('/custom-university-shirts/').includes('id="reviews"'), false)
})

test('หน้ากลุ่มลูกค้า: แถบสรุปใต้ hero มีสิทธิพิเศษ (strip ตาม v22 · ราคาออกตามอาร์ต 2 พ.ย.) · ปุ่ม LINE ยังอยู่', () => {
  for (const { id, url } of usePages) {
    if (v2Ids.has(id)) continue
    const main = useMain(url)
    const at = main.search(/class="pp-strip[ "]/)  /* รอบ 64: แถบมีคลาส up-strip ต่อท้าย */
    const strip = main.slice(at, main.indexOf('data-toc'))
    assert.ok(at > 0 && strip.length > 0 && main.indexOf('band-hero') < at, `${url}: แถบสรุป`)
    assert.match(strip, /pp-strip__make/, `${url}: ข้อเท็จจริง`)
    /* อาร์ต 2 พ.ย. รอบ 64: "ลบราคาออก เอาให้เหลือที่สิทธิพิเศษ" → แถบไม่มีราคา (ราคาอยู่ส่วนการ์ดราคา #products) */
    assert.doesNotMatch(strip, /pp-strip__price/, `${url}: ไม่มีราคาในแถบ`)
    assert.ok(main.includes('data-where="use-hero"'), `${url}: ปุ่ม LINE`)
  }
})

/* 4 พ.ย. อาร์ต "ไม่เอารูปลูกค้าจริง" ในส่วนบริบทงานโฉมใหม่ → ข้ามเมื่อ /corporate/ เป็นโฉมใหม่ (ตรวจที่ use-v2.test.js) */
test('/corporate/ บริบทงาน: โรงแรมใช้ภาพรีสอร์ทจริง rv384', { skip: v2Ids.has('corp') && 'โฉมใหม่: ภาพนิ่งเสื้อ ไม่ใช้รูปลูกค้า (use-v2.test.js)' }, () => {
  assert.match(useMain('/corporate/'), /class="up-contexts[\s\S]*?\/img\/review\/rv384[^"]*"/)
})

test('คำค้นทุกคำบนการ์ดผังเว็บ v22 (PAGE-MAP keyword) อยู่ในหน้า', () => {
  const bad = []
  for (const p of pages) {
    if (EXCEPT[p.id] === 'all' || !p.keyword) continue
    const f = join(root, 'dist', p.proposed_url === '/404/' ? '404.html' : `${p.proposed_url}index.html`)
    const html = norm(readFileSync(f, 'utf8'))
    for (const k of p.keyword.split('·').map((x) => x.trim()).filter(Boolean)) if (!html.includes(norm(k))) bad.push(`${p.proposed_url}: "${k}"`)
  }
  assert.deepEqual(bad, [])
})

/* ลำดับส่วนหน้าสินค้า 6 หน้าตาม v22 (อาร์ตเคาะ 2 พ.ย. 2026 · แทนลำดับ 24 ต.ค. ข้อ 5 และ 26 ต.ค.)
   ที่มา: sections ใน extracted/products.json + H2 ใน PAGE-CONTENT.json */
/* หน้าโฉมใหม่ที่จบที่ FAQ (pp-v2.json lean · อาร์ต 6 พ.ย. "ลบทิ้งได้หมดยกเว้น footer") · ตรวจที่ tests/pp-v2.test.js */
const LEAN = new Set(Object.entries(JSON.parse(readFileSync(join(root, 'src/data/pp-v2.json'), 'utf8'))).filter(([, v]) => v && v.lean).map(([id]) => ({ print: 'printed' })[id]).filter(Boolean))
const PRODUCTS = { polo: '/embroidery/', printed: '/sublimation/', screen: '/screen-printing/', warmup: '/custom-printed-warmup-shirts/', oversize: '/custom-oversize-jerseys/', baseball: '/custom-baseball-shirts/' }
const raw = JSON.parse(readFileSync(join(root, 'docs/spec/teamdee-v22/extracted/products.json'), 'utf8'))
/* key ของ wireframe → id ใน HTML · n11 = ส่วน "ตามงานที่ใช้" · quote / contact = ctaBox (id อยู่ที่หัวข้อ) */
const v2Reviews = new Set(Object.entries(JSON.parse(readFileSync(join(root, 'src/data/pp-v2.json'), 'utf8'))).filter(([, v]) => v.reviews).map(([id]) => ({ print: '/sublimation/' })[id]))
/* ส่วนที่หน้าโฉมใหม่ย้ายขึ้นตามบอร์ด (รีวิว 5 พ.ย. · เนื้อผ้า 6 พ.ย.) */
const v2Moved = Object.fromEntries(Object.entries(JSON.parse(readFileSync(join(root, 'src/data/pp-v2.json'), 'utf8'))).map(([id, v]) => [({ print: '/sublimation/' })[id], ['reviews', 'fabric', 'types', 'sizes', 'steps', 'faq'].filter((k) => v && v[k]).map((k) => ({ types: 'options', sizes: 'size', steps: 'order' })[k] || k)]).filter(([r]) => r))
const SECTION_ID = { embroidery: 'detail', n11: 'uses', quote: 'quote-h', contact: 'end-h' }

test('หน้าสินค้า 6 หน้า: id ส่วนเรียงตาม v22 ทุกส่วน', () => {
  for (const [id, route] of Object.entries(PRODUCTS)) {
    if (LEAN.has(id)) continue
    const html = readFileSync(join(root, 'dist', route, 'index.html'), 'utf8')
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    const keys = raw[id].sections.map((s) => SECTION_ID[s.key] || s.key)
    assert.deepEqual(keys, ['options', 'fabric', 'detail', 'price', 'quote-h', 'production', 'work', 'reviews', 'size', 'order', 'faq', 'uses', 'end-h'], `${id}: v22 เปลี่ยน`)
    const at = keys.map((k) => main.indexOf(` id="${k}"`))
    assert.ok(at.every((n) => n >= 0), `${route} ไม่มีส่วน: ${keys.filter((_, i) => at[i] < 0)}`)
    /* หน้าโฉมใหม่ที่มีรีวิวโฉมใหม่ (pp-v2.json reviews · บอร์ดอาร์ต 5 พ.ย.): รีวิวย้ายขึ้นต่อจากส่วนความน่าเชื่อถือ · ส่วนอื่นเรียงตาม v22 */
    const ks = keys.filter((k) => !(v2Moved[route] || []).includes(k))
    assert.deepEqual(ks.slice().sort((a, b) => at[keys.indexOf(a)] - at[keys.indexOf(b)]), ks, route)
  }
})

test('หน้าสินค้า 6 หน้า: H2 ของ v22 เรียงตรงลำดับ (มี H2 เสริมแทรกได้ เช่น ดูแบบให้เห็นภาพ · คลิปงานจริง)', () => {
  for (const [id, route] of Object.entries(PRODUCTS)) {
    if (LEAN.has(id)) continue
    const html = readFileSync(join(root, 'dist', route, 'index.html'), 'utf8')
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    const got = [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => norm(m[1]))
    const want = content[id].headings.filter((x) => x.level === 'H2' && !(EXCEPT[id] || []).includes(x.text)).map((x) => norm(x.text))
    const at = want.map((w) => got.findIndex((g) => g.includes(w)))
    assert.ok(at.every((n) => n >= 0), `${route} ไม่มี ${want.filter((_, i) => at[i] < 0)}`)
    assert.deepEqual(at, at.slice().sort((a, b) => a - b), route)
  }
})

test('หน้าสินค้า 6 หน้า: ใช้แม่แบบเดียว · แถบสรุปอยู่ติดใต้ hero ตาม v22 · ลิงก์สารบัญมีปลายทางครบ', () => {
  const template = readFileSync(join(root, 'src/partials/productPage.hbs'), 'utf8')
  /* หน้าโฉมใหม่ (src/data/pp-v2.json · อาร์ต 5 พ.ย. "ไม่เอา" แถบราคา + สารบัญ) ไม่มีแถบสรุป/สารบัญ · ตรวจที่ tests/pp-v2.test.js */
  const v2Routes = new Set(Object.keys(JSON.parse(readFileSync(join(root, 'src/data/pp-v2.json'), 'utf8'))).filter((k) => !k.startsWith('_')).map((k) => ({ polo: '/embroidery/', print: '/sublimation/', screen: '/screen-printing/' })[k]))
  for (const route of Object.values(PRODUCTS)) {
    assert.match(readFileSync(join(root, 'site', route, 'index.html'), 'utf8'), /\{\{> productPage\}\}/, route)
    if (v2Routes.has(route)) continue
    const html = readFileSync(join(root, 'dist', route, 'index.html'), 'utf8')
    const toc = html.match(/<div class="ab-toc__in">([\s\S]*?)<\/div>/)[1]
    const keys = [...toc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1])
    assert.ok(keys.length >= 6, route)
    for (const k of keys) assert.ok(html.includes(` id="${k}"`), `${route}: สารบัญ #${k}`)
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    const order = keys.filter((k) => k !== 'order' || route === '/screen-printing/').map((k) => main.indexOf(` id="${k}"`))
    assert.deepEqual(order, order.slice().sort((a, b) => a - b), `${route}: สารบัญเรียงตามส่วนในหน้า`)
    assert.ok(main.indexOf('pp-strip') < main.indexOf('data-toc') && main.indexOf('band-hero') < main.indexOf('pp-strip'), `${route}: hero → แถบสรุป → สารบัญ`)
  }
  /* 5 พ.ย. หน้าสินค้าโฉมใหม่ (pp-v2.json) เลือก hero ใหม่ได้ · แถบสรุปยังต้องติดใต้ hero */
  assert.ok(/(\{\{#if pp2\.hero\}\}\{\{> pp2Hero\}\}\{\{else\}\})?\{\{> ppHero\}\}(\{\{\/if\}\})?\s*(\{\{!--[\s\S]*?--\}\}\s*\{\{#unless pp2\.hero\}\})?\{\{> ppPriceStrip\}\}\s*\{\{> ppToc items=ppToc\}\}/.test(template))
})

/* เมนูหลักตาม wireframe v22 (header ของ TEAMDEE-Full-Website-Wireframe.html · อาร์ตส่งภาพยืนยัน 22 ต.ค.) */
const NAV_V22 = [
  /* เพิ่มจาก v22: อาร์ตสั่งให้มีเมนู "หน้าแรก" ให้กดได้ (22 ต.ค. 2026) · v22 ใช้โลโก้อย่างเดียว */
  ['หน้าแรก', '/'],
  ['สั่งทำเสื้อ', [['สั่งทำเสื้อโปโลปัก', '/embroidery/'], ['สั่งทำเสื้อพิมพ์ลาย', '/sublimation/'], ['สั่งทำเสื้อสกรีน', '/screen-printing/'], ['สั่งทำเสื้อวอร์มพิมพ์ลาย', '/custom-printed-warmup-shirts/'], ['สั่งทำเสื้อเบสบอล', '/custom-baseball-shirts/'], ['สั่งทำเสื้อเจอร์ซีย์ Oversize', '/custom-oversize-jerseys/'],
    /* เพิ่มจาก v22: อาร์ตให้หน้าคำนวณราคาอยู่ในเมนู (26 ต.ค. 2026 "หน้านี้ไม่แสดงที่ไหนเลย") */
    ['คำนวณราคาเบื้องต้น', '/calculations/']]],
  ['เสื้อสำหรับทีมคุณ', [['ธุรกิจและหน่วยงาน'], ['สั่งทำเสื้อบริษัท', '/corporate/'], ['สั่งทำเสื้อพนักงานร้านค้า', '/custom-staff-shirts/'], ['สั่งทำเสื้อหน่วยงาน', '/custom-organization-shirts/'],
    ['โรงเรียน รุ่น และชมรม'], ['สั่งทำเสื้อโรงเรียน / เสื้อกีฬาสี', '/education/'], ['สั่งทำเสื้อรุ่น / เสื้อชมรม', '/custom-class-shirts/'], ['สั่งทำเสื้อคณะ / เสื้อมหาวิทยาลัย', '/custom-university-shirts/'],
    ['กีฬา'], ['สั่งทำเสื้อกีฬา', '/sport/'], ['สั่งทำเสื้อแบดมินตัน / เสื้อแบด / เสื้อก๊วนแบด', '/custom-badminton-shirts/'], ['สั่งทำเสื้อวิ่ง / เสื้องานวิ่ง', '/custom-running-shirts/'],
    ['อีเวนต์และกิจกรรม'], ['สั่งทำเสื้ออีเวนต์ / เสื้อกิจกรรม / เสื้อ Outing', '/event/']]],
  ['แบบเสื้อ', '/designs/'],
  ['รีวิวลูกค้า', '/project/'],
  ['คู่มือและบทความ', [['คู่มือสั่งทำ'], ['วิธีสั่งเสื้อพิมพ์ลาย', '/printed-shirt-order-guide/'], ['วิธีสั่งเสื้อสกรีน', '/screen-printing-order-guide/'], ['วิธีสั่งเสื้อโปโลปัก', '/embroidered-polo-order-guide/'], ['เลือกผ้าเสื้อทีม', '/fabric-technology/'], ['ตารางไซซ์และวิธีวัด', '/size-chart/'], ['เตรียมโลโก้และข้อมูล', '/artwork-preparation-guide/'], ['จัดส่งและหลังการขาย', '/delivery-after-sales-guide/'], ['บทความและไอเดีย', '/blog/'], ['คำถามที่พบบ่อย', '/faq/']]],
  ['รู้จักทีมดี', '/about-us/'],
]
const flat = (nav) => nav.flatMap(([t, x]) => (Array.isArray(x) ? [t, ...x.map((i) => i.join(' '))] : [`${t} ${x}`]))

test('เมนูหลัก (เดสก์ท็อปและมือถือ) ชื่อ ลำดับ กลุ่ม และลิงก์ ตรง v22', () => {
  const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
  const txt = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const read = (part) => [...part.matchAll(/<(a|button|p|summary)\b([^>]*)>([\s\S]*?)<\/\1>/g)]
    .filter(([, tag, attrs]) => tag !== 'p' || /dd__group|mnav__head/.test(attrs))
    .map(([, tag, attrs, inner]) => { const href = (attrs.match(/href="([^"]+)"/) || [])[1]; return href && tag === 'a' ? `${txt(inner)} ${href}` : txt(inner) })
  const desk = html.slice(html.indexOf('aria-label="เมนูหลัก"'), html.indexOf('</nav>', html.indexOf('aria-label="เมนูหลัก"')))
  assert.deepEqual(read(desk), flat(NAV_V22))
  /* 11 พ.ย.: ท้ายเมนูมือถือเป็นแผงติดต่อ (.mct · tests/mobile-menu-contact.test.js) ไม่ใช่รายการเมนู → ตรวจถึงก่อนแผง */
  const mob = html.slice(html.indexOf('aria-label="เมนูมือถือ"'), html.indexOf('<div class="mct"', html.indexOf('aria-label="เมนูมือถือ"')))
  assert.deepEqual(read(mob).filter((x) => !/^(ติดต่อทีมดี|ทักไลน์|(LINE )?ทัก LINE|โทร)/.test(x)), flat(NAV_V22))
  assert.match(desk, /href="\/"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/"/)
})

/* อาร์ตเคาะ 2 พ.ย.: ใช้ไฟล์งานปักจริงได้ · ไฟล์เป็นภาพ 3D ไม่ใช่รูปถ่าย → ติดป้ายตรงๆ · /corporate/ ใช้รูปบริษัทจริงตามกลุ่ม */
test('หน้าโปโล: H2 ผลงานตาม v22 · ภาพ 3D ของงานปักจริง 3 แบบ ติดป้ายทุกใบ ไม่ซ้ำแบบในหน้า · รูปลูกค้าแยกหัวข้อย่อย', () => {
  const html = readFileSync(join(root, 'dist/embroidery/index.html'), 'utf8')
  const work = html.slice(html.indexOf(' id="work"'), html.indexOf(' id="clips"') > 0 ? html.indexOf(' id="clips"') : html.indexOf(' id="reviews"'))
  assert.match(work.replace(/<[^>]+>/g, ''), /ผลงานเสื้อโปโลปักจริง/)
  for (const c of ['TD-0133', 'TD-0132', 'TD-0127']) assert.match(work, new RegExp(c), c)
  assert.equal((work.match(/· ภาพ 3D/g) || []).length, 3)
  /* รูปลูกค้าจริงขึ้นก่อนภาพ 3D (2 พ.ย.) */
  assert.ok(work.indexOf('pp-real') < work.indexOf('แบบจากงานลูกค้า'))
  assert.doesNotMatch(work, /งานผลิตจริง/)
  assert.match(work, /<h3[^>]*>[^<]*เสื้อโปโลที่ลูกค้าองค์กรใส่จริง/)
})

test('/corporate/: ผลงานเป็นรูปบริษัทจริง (photoGroup corp) ไม่ใช่ รพ.สต. หรือทหาร', { skip: v2Ids.has('corp') && 'โฉมใหม่: ส่วนผลงานเป็นโชว์รูมหน้าแรก (แบบ + เสื้อบนหุ่น) ตรวจที่ use-v2.test.js' }, () => {
  const html = readFileSync(join(root, 'dist/corporate/index.html'), 'utf8')
  const work = html.slice(html.indexOf(' id="work"'))
  const imgs = [...work.slice(0, work.indexOf('</section>')).matchAll(/<img src="([^"]+)"/g)].map((m) => m[1])
  const cs = JSON.parse(readFileSync(join(root, 'src/data/customers.json'), 'utf8'))
  const list = cs.items || cs
  assert.equal(imgs.length, 3)
  for (const i of imgs) assert.equal(list.find((c) => c.img === i)?.photoGroup, 'corp', i)
})
