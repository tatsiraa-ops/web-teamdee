/* 17 พ.ย. 2026 อาร์ตเลือกข้อ ข: /collar-styles/ (Elementor เดิม ฟอนต์ Inter/Prompt ที่ไม่ได้โหลด · ป้ายอังกฤษ) → หน้าคู่มือของธีม
   คง URL · title · H1 · description · เนื้อหา · รูปคอเสื้อ 12 รูป ตามเว็บจริง (ติด Google อันดับ 6.2) · ใช้บล็อกการ์ดชุดเดียวกับ /fabric-technology/
   + เพิ่มลิงก์ในเมนู "คู่มือและบทความ" (เดิมเข้าได้ทางท้ายเว็บอย่างเดียว)
   ห้ามหลุด: ข้อความต้นแบบ "หน้านี้ยังเป็นต้นแบบ…" / ช่อง [ยืนยัน] จากร่างคู่มือทรงคอเดิม (guides.json) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { isExported } from '../scripts/seo-check.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const pages = JSON.parse(read('src/data/guide-pages.json'))
const guides = JSON.parse(read('src/data/guides.json'))
const nav = JSON.parse(read('src/data/nav.json'))

const LIVE = {
  title: 'รูปแบบคอเสื้อ ทรงคอปกเสื้อโปโล และเสื้อกีฬาพิมพ์ลายพรีเมียม | TEAMDEE',
  desc: 'เลือกทรงคอเสื้อและปกเสื้อที่ใช่สำหรับทีมคุณ มีให้เลือกครบทั้งคอกลม คอจีนซิป คอวีไขว้ และบริการทอปกแจ็คการ์ด ขลิบสีตามแบรนด์ พร้อมดีไซน์ตอบโจทย์ทุกสไตล์',
  h1: 'รูปแบบคอเสื้อและทรงปกเสื้อพรีเมียมสำหรับสั่งตัดพิเศษ',
  lead: 'เลือกทรงคอเสื้อที่ใช่ เพื่อสะท้อนเอกลักษณ์และภาพลักษณ์ที่โดดเด่นของทีมคุณ เรามีแบบคอเสื้อและตัวเลือกการทอปกที่หลากหลาย พร้อมตอบโจทย์ทุกดีไซน์',
  collars: [
    ['round', 'คอกลม', 'สปอร์ตคลาสสิก สวมใส่สบาย คล่องตัวทุกการเคลื่อนไหว'],
    ['round-double', 'คอกลม 2 ชั้น', 'เพิ่มมิติและเลเยอร์ให้ลำคอ โดดเด่นไม่ซ้ำใคร'],
    ['trapezoid', 'คอคางหมู (ไม่มีปก)', 'ดีไซน์โฉบเฉี่ยว ทันสมัย ปราดเปรียวสไตล์อีสปอร์ต'],
    ['trapezoid-collar', 'คอคางหมู (มีปก)', 'สมาร์ทดูดี ผสมผสานความสปอร์ตและความเป็นทางการ'],
    ['mandarin-button', 'คอจีนกระดุม', 'เรียบหรู สุภาพ เรียบร้อยสไตล์มินิมอลคลาสสิก'],
    ['mandarin-zip', 'คอจีนซิป', 'สปอร์ตโมเดิร์น ปรับระดับความกระชับและลุคได้ง่าย'],
    ['v-neck', 'คอวี (V-Neck)', 'ทรงมาตรฐาน โปร่งสบาย ช่วยให้ช่วงคอดูเพรียวขึ้น'],
    ['v-cross', 'คอวีไขว้', 'เท่และกระชับ เสริมความดุดันและแข็งแกร่งให้ทีม'],
    ['v-cut', 'คอวีตัด', 'ทรงคอตัดโดดเด่น ทันสมัยและดูกระฉับกระเฉง'],
    ['v-collar', 'คอวี (มีปก)', 'ภูมิฐาน เรียบหรู ใส่ทำงานหรือลงสนามก็มั่นใจ'],
    ['v-collar-insert', 'คอวี (มีปกผ้าแทรก)', 'เพิ่มดีเทลลูกเล่นผ้าแทรก ยกระดับความพรีเมียม'],
    ['pentagon', 'คอห้าเหลี่ยม', 'รูปทรงเรขาคณิตสะดุดตา ล้ำสมัยสไตล์อนาคต'],
  ],
  details: [
    ['รับทอปกแจ็คการ์ด', 'เพิ่มเอกลักษณ์ขั้นสุดด้วยการทอลายโลโก้ หรือข้อความขององค์กรลงบนคอปกเสื้อโดยตรง สวยงามและทนทาน'],
    ['แต่งขลิบสีตามองค์กร', 'สร้างความโดดเด่นด้วยการสั่งทอขลิบสีที่คอปกและปลายแขน สามารถแมตช์ให้ตรงกับสีประจำแบรนด์ของคุณได้เป๊ะ'],
    ['กระดุม หรือ ซิป', 'เลือกออปชันคอเสื้อที่ตรงกับสไตล์คุณ ไม่ว่าจะเป็นคอปกกระดุมสุดคลาสสิก หรือคอปกรูดซิปสไตล์โมเดิร์นสปอร์ต'],
  ],
}

test('guide-pages.json collar: H1 · บทนำ · คอเสื้อ 12 แบบ · ดีเทลเสริม 3 อย่าง ตามเว็บจริงทุกตัวอักษร', () => {
  const p = pages.collar
  assert.ok(p, 'มีหน้า collar')
  assert.equal(p.h1, LIVE.h1)
  assert.equal(p.lead, LIVE.lead)
  const styles = p.sections.find((s) => s.id === 'styles')
  assert.equal(styles.kind, 'cards')
  assert.equal(styles.title, 'รวมแบบคอเสื้อสปอร์ตและแฟชั่นยอดฮิตทุกลุค')
  assert.deepEqual(styles.cards.map((c) => [c.img, c.t, c.d]), LIVE.collars.map(([id, t, d]) => [`/img/collar/${id}.webp`, t, d]))
  for (const c of styles.cards) {
    assert.equal(c.alt, `เสื้อทีม${c.t} ภาพงานจริงจากทีมดี`)
    assert.equal(c.w, 1200); assert.equal(c.h, 1200)
  }
  const details = p.sections.find((s) => s.id === 'details')
  assert.equal(details.kind, 'cards')
  assert.equal(details.title, 'ดีเทลเสริมความพรีเมียม')
  assert.deepEqual(details.cards.map((c) => [c.t, c.d]), LIVE.details)
  assert.ok(p.sections.some((s) => s.kind === 'links'))
  const texts = []; const walk = (v) => (typeof v === 'string' ? texts.push(v) : v && typeof v === 'object' && Object.values(v).forEach(walk)); walk(p)
  assert.deepEqual(texts.filter((t) => /\[|ต้นแบบ|โรงงาน/.test(t)), [], 'ไม่มีช่องรอยืนยัน [..] / คำว่าต้นแบบ / โรงงาน')
})

test('รูปคอเสื้อ 12 รูป: webp ขนาดเต็ม + 480 + 760 (srcset) อยู่ใน public/img/collar', () => {
  for (const [id] of LIVE.collars) for (const s of ['', '-480', '-760']) assert.ok(existsSync(new URL(`../public/img/collar/${id}${s}.webp`, import.meta.url)), `${id}${s}`)
})

test('หน้า /collar-styles/: title + description ตามเว็บจริง · export ขึ้นธีม · คู่มือไม่ซ่อน · เมนู "คู่มือและบทความ" มีลิงก์', () => {
  const html = read('site/collar-styles/index.html')
  assert.match(html, new RegExp(`<title>${LIVE.title.replace(/[()|]/g, '\\$&')}</title>`))
  assert.ok(html.includes(`<meta name="description" content="${LIVE.desc}">`))
  assert.match(html, /\{\{> guidePage\}\}/)
  assert.equal(isExported('/collar-styles/'), true)
  assert.notEqual(guides.find((g) => g.id === 'collar').hidden, true)
  const learn = nav.learn.groups.flatMap((g) => g.items)
  assert.ok(learn.some(([t, to]) => t === 'ทรงคอเสื้อและปกเสื้อ' && to === 'guides.collar'))
})

test('การ์ดในคู่มือ: alt / ขนาดรูปต่อการ์ดได้ (เดิมผูก "ผิว…ระยะใกล้" 1200×558 ของรูปผ้า) · มี data-sizes ให้ build เติม srcset', () => {
  const block = read('src/partials/guideBlock.hbs')
  const cards = block.slice(block.indexOf("{{#if (eq this.kind 'cards')}}"))
  assert.match(cards, /alt="\{\{#if this\.alt\}\}\{\{this\.alt\}\}\{\{else\}\}ผิว\{\{this\.t\}\}ระยะใกล้\{\{\/if\}\}"/)
  assert.match(cards, /width="\{\{#if this\.w\}\}\{\{this\.w\}\}\{\{else\}\}1200\{\{\/if\}\}" height="\{\{#if this\.h\}\}\{\{this\.h\}\}\{\{else\}\}558\{\{\/if\}\}"/)
  assert.match(cards, /data-sizes="/)
})

test('ข้อความต้นแบบของคู่มือทรงคอเดิม (ภาพวาด · "หน้านี้ยังเป็นต้นแบบ") ไม่อยู่ในแม่แบบแล้ว', () => {
  assert.doesNotMatch(read('src/partials/guideProcessStudio.hbs'), /eq item\.id 'collar'|หน้านี้ยังเป็นต้นแบบ/)
})

test('CSS: การ์ดคอเสื้อรูปจัตุรัส 3 คอลัมน์ (มือถือ 2) · ใช้เฉพาะหน้า collar', () => {
  const css = read('src/styles/guide-blocks.css')
  assert.match(css, /\.td-guide--collar #styles \.gblock-cards \{ grid-template-columns: repeat\(3, ?minmax\(0, ?1fr\)\);/)
  assert.match(css, /\.td-guide--collar #styles \.gblock-card__image \{ aspect-ratio: 1 \/ 1;/)
  assert.match(css, /@media \(max-width: 767px\) \{[^}]*\.td-guide--collar #styles \.gblock-cards \{ grid-template-columns: repeat\(2, ?minmax\(0, ?1fr\)\);/)
})

test('guides.json collar: ร่างคู่มือทรงคอเดิม (ช่อง [ยืนยัน] · ตาราง/ภาพวาด) ออกหมด · คำแนะนำตรงกับเนื้อหาจริง · ชื่อตรงเมนู', () => {
  const c = guides.find((g) => g.id === 'collar')
  assert.equal(c.name, 'ทรงคอเสื้อและปกเสื้อ')
  assert.deepEqual(c.sections, [])
  assert.equal(c.intro, 'รวมทรงคอเสื้อ 12 แบบจากงานจริงของทีมดี พร้อมดีเทลเสริมอย่างทอปกแจ็คการ์ด แต่งขลิบสี และเลือกกระดุมหรือซิป')
  assert.equal(c.updated, '17 พ.ย. 2026')
  assert.doesNotMatch(JSON.stringify(c), /\[ยืนยัน|ใช้กับสินค้าไหนได้/)
})
