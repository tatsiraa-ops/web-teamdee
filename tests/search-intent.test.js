/* ค้นหาแบบเข้าใจคำที่ลูกค้าพิมพ์จริง (ตรวจมือถือ 30 ต.ค. ข้อ 6–7 · docs/audit/2026-10-30-mobile-ux-audit.md)
   ตารางคำพ้อง/เจตนาอยู่ที่ src/data/search-synonyms.json ใช้ร่วมกันทั้ง /faq/ (faq-search.js) และ /search/ (site-search.js)
   เดิม "ส่งกี่วัน" "กี่วัน" "สกรีน 1 ตัว" "ติดตามงาน" ได้ 0 ผล */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normFaq, faqHit, faqHits, faqAskText, askText, queryActions, queryIntents } from '../src/js/faq-search.js'
import { searchPages } from '../src/js/site-search.js'
import { REORDER_TEXT, TRACK_TEXT } from '../src/js/use-cta.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const syn = JSON.parse(read('src/data/search-synonyms.json'))
const faq = JSON.parse(read('src/data/faq.json'))
const routes = JSON.parse(read('src/data/routes.json'))

/* ข้อความค้นของแต่ละข้อ FAQ แบบเดียวกับ faq-page.js (คำถาม + คำตอบ + ชื่อหมวด) */
const FAQ = faq.full.flatMap((c) => c.items.map(([q, a], i) => ({ id: `${c.id}-${i}`, q, hay: `${q} ${a} ${c.name}` })))
const faqIds = (q) => FAQ.filter((x) => faqHit(q, x.hay)).map((x) => x.id)
/* ที่หน้า /faq/ แสดงจริง (faqHits ตัดรอบ: มีข้อตรงตัว = เฉพาะข้อนั้น) */
const shownIds = (q) => { const h = faqHits(q, FAQ.map((x) => x.hay)); return FAQ.filter((x, i) => h[i]).map((x) => x.id) }

/* ดัชนีหน้า /search/ แบบที่ site/search/index.html สร้าง (ส่วนที่เกี่ยว) */
const PAGES = [
  { t: 'เสื้อสกรีน', d: 'บริการสกรีนลาย โลโก้ หรือข้อความบนตัวเสื้อ', u: '/screen-printing/', k: 'สินค้า' },
  { t: 'คู่มือไซซ์และการวัด', d: 'วัดตัวก่อนสั่ง', u: '/size-chart/', k: 'คู่มือ' },
  { t: 'คำนวณราคาเบื้องต้น', d: 'เลือกคอ จำนวน และออปชัน ดูงบประมาณโดยประมาณ', u: '/calculations/', k: 'คู่มือ' },
  { t: 'คำถามที่พบบ่อย', d: 'คำตอบ 7 หมวดเรื่องสั่งทำเสื้อ', u: '/faq/', k: 'ข้อมูล' },
  ...faq.full.flatMap((c) => c.items.map(([q, a], i) => ({ t: q, d: a, u: `/faq/#${c.id}-${i}`, k: 'คำถาม' }))),
]
const urls = (q) => searchPages(q, PAGES, routes).map((p) => p.u)

test('ตารางคำพ้องเป็น JSON ไฟล์เดียว มีเจตนาครบตามที่ตรวจเจอ', () => {
  const ids = syn.intents.map((i) => i.id)
  for (const id of ['leadtime', 'minqty', 'price', 'dft', 'track', 'reorder', 'docs', 'payment', 'size']) assert.ok(ids.includes(id), id)
  for (const i of syn.intents) {
    assert.ok(i.label && i.triggers.length && i.terms.length, i.id)
  }
  assert.ok(Array.isArray(syn.spell) && syn.spell.length >= 6)
  /* ใช้ร่วมกันจริง ไม่ copy ตารางไว้ในสคริปต์ */
  assert.match(read('src/js/faq-search.js'), /search-synonyms\.json/)
  assert.match(read('src/js/search-page.js'), /from '\.\/site-search\.js'/)
  assert.doesNotMatch(read('src/js/search-page.js'), /const ALIAS = /)
})

test('normFaq: NFKC · เลขไทย → เลขอารบิก · สระอำแยกตัว (ของเดิมยังเหมือนเดิม)', () => {
  assert.equal(normFaq('๑ ตัว'), '1ตัว')
  assert.equal(normFaq('ＤＴＦ'), 'dtf')
  assert.equal(normFaq('ขั้นตํา'), 'ขั้นตำ')
  assert.equal(normFaq('VAT 7%'), 'vat7')
})

test('ระยะเวลา: กี่วัน / ส่งกี่วัน / นานไหม / ใช้เวลา / ได้ของเมื่อไหร่ เจอข้อ "ผลิตและส่งใช้เวลานานแค่ไหน"', () => {
  for (const q of ['กี่วัน', 'ส่งกี่วัน', 'ส่ง กี่วัน', 'นานไหม', 'นานแค่ไหน', 'ใช้เวลา', 'ได้ของเมื่อไหร่', 'กี่วันคะ', 'ผลิตกี่วัน', 'กี่วันได้ของ']) {
    assert.ok(faqIds(q).includes('produce-0'), q)
  }
  /* ไม่เจอข้อที่ไม่เกี่ยว */
  assert.ok(!faqIds('กี่วัน').includes('spec-2'))
  assert.ok(!faqIds('กี่วัน').includes('price-0'))
})

test('ขั้นต่ำ: สกรีน 1 ตัว / สกรีน1ตัว / ตัวเดียว / สั่งน้อย / น้อยสุด เจอข้อ "สั่งขั้นต่ำกี่ตัว"', () => {
  for (const q of ['สกรีน 1 ตัว', 'สกรีน1ตัว', 'สกรีน ๑ ตัว', 'ตัวเดียว', 'สั่งน้อย', 'น้อยสุดกี่ตัว', 'กี่ตัว']) assert.ok(faqIds(q).includes('start-0'), q)
  /* คำที่เหลือยังต้องเจอทุกคำ: "สกรีน 1 ตัว" ไม่เจอข้อที่ไม่พูดถึงสกรีน */
  assert.ok(!faqIds('สกรีน 1 ตัว').includes('spec-2'))
})

test('ราคา: ราคา / เท่าไหร่ / กี่บาท เจอข้อ "ราคาขึ้นกับอะไร"', () => {
  for (const q of ['ราคา', 'เท่าไหร่', 'กี่บาท', 'ตัวละเท่าไร']) assert.ok(faqIds(q).includes('price-0'), q)
})

test('DTF = DFT (ของเดิม)', () => {
  assert.equal(faqHit('dtf', 'สกรีน DFT ทนไหม'), true)
  assert.ok(faqIds('DTF').includes('produce-0'))
})

test('เอกสาร/ชำระเงิน: ใบกำกับภาษี · ภ.พ.20 · วางบิล · บัตรเครดิต · PromptPay', () => {
  for (const q of ['ภ.พ.20', 'ภพ 20', 'ภพ.20']) assert.ok(faqIds(q).includes('company-2'), q)
  assert.ok(faqIds('ใบกำกับภาษี').includes('price-2'))
  for (const q of ['วางบิล', 'บัตรเครดิต', 'จ่ายบัตร']) assert.ok(faqIds(q).includes('price-4'), q)
  for (const q of ['promptpay', 'PromptPay', 'พร้อมเพย์', 'โอนเงิน']) assert.ok(faqIds(q).includes('price-3'), q)
})

test('ไซซ์: ไซซ์ / ไซส์ / size เจอข้อเรื่องไซซ์', () => {
  for (const q of ['ไซซ์', 'ไซส์', 'size', 'SIZE']) assert.ok(faqIds(q).includes('spec-2') && faqIds(q).includes('spec-4'), q)
})

test('ลูกค้าเดิม: สั่งซ้ำ / สั่งเพิ่ม เจอข้อ "สั่งซ้ำต้องคุยใหม่ทั้งหมดไหม"', () => {
  for (const q of ['สั่งซ้ำ', 'สั่งเพิ่ม', 'เพิ่มจำนวน', 'ลูกค้าเดิม']) assert.ok(faqIds(q).includes('after-2'), q)
})

test('หน้า /faq/ แสดงเฉพาะข้อที่ตรงที่สุด: ตรงตัวก่อน ไม่มีค่อยใช้เจตนา', () => {
  assert.deepEqual(shownIds('ภ.พ.20'), ['company-2'])
  assert.deepEqual(shownIds('กี่วัน'), ['produce-0', 'produce-1', 'produce-2'])
  assert.deepEqual(shownIds('ส่งกี่วัน'), ['produce-0', 'produce-1', 'produce-2'])
  assert.deepEqual(shownIds('สกรีน 1 ตัว'), ['start-0'])
  assert.deepEqual(shownIds('ติดตามงาน'), [])
  assert.deepEqual(shownIds('zxqv'), [])
  assert.equal(shownIds('').length, FAQ.length)
})

test('ของเดิมไม่พัง · คำมั่วไม่เจออะไร', () => {
  assert.equal(faqHit('ใบเสร็จ', 'ออกใบกำกับภาษีเต็มรูปแบบได้ไหม'), false)
  assert.equal(faqHit('คละ ภาษี', 'สั่งคละไซซ์ในงานเดียวได้ไหม'), false)
  assert.equal(faqHit('', 'อะไรก็ได้'), true)
  assert.deepEqual(faqIds('zxqv'), [])
  assert.deepEqual(faqIds('ฟหกด่าสว'), [])
  /* พิมพ์แต่คำลงท้าย ไม่ใช่เจอทุกข้อ */
  assert.ok(faqIds('ครับ').length < FAQ.length)
})

test('queryActions / queryIntents: ทางเข้าลูกค้าเดิม', () => {
  assert.deepEqual(queryActions('ติดตามงาน'), ['track', 'reorder'])
  assert.deepEqual(queryActions('งานถึงไหนแล้วครับ'), ['track', 'reorder'])
  assert.deepEqual(queryActions('สั่งซ้ำ'), ['reorder', 'track'])
  assert.deepEqual(queryActions('สั่งเพิ่ม 20 ตัว'), ['reorder', 'track'])
  assert.deepEqual(queryActions('กี่วัน'), [])
  assert.deepEqual(queryActions(''), [])
  assert.deepEqual(queryIntents('ส่งกี่วัน'), ['leadtime'])
  assert.deepEqual(queryIntents('สกรีน 1 ตัว'), ['minqty'])
})

test('askText: ข้อความ LINE ตอนค้นไม่เจอ · ลูกค้าเดิมได้แบบฟอร์มติดตาม/สั่งซ้ำ · อื่นๆ แนบคำค้น', () => {
  assert.equal(askText('ติดตามงาน'), TRACK_TEXT)
  assert.equal(askText('สั่งซ้ำ'), REORDER_TEXT)
  assert.equal(askText('zxqv'), faqAskText('zxqv'))
  /* faqAskText รายข้อ (ปุ่ม LINE ใต้คำตอบ) ไม่เปลี่ยน */
  assert.equal(faqAskText('สั่งซ้ำต้องคุยใหม่ทั้งหมดไหม'), 'สวัสดี ทีมดี สอบถามเรื่อง: สั่งซ้ำต้องคุยใหม่ทั้งหมดไหม\n')
})

test('searchPages (/search/): ค้นคำถาม FAQ ด้วย และเรียงข้อที่ตรงที่สุดก่อน', () => {
  assert.equal(urls('ส่งกี่วัน')[0], '/faq/#produce-0')
  assert.ok(urls('กี่วัน').includes('/faq/#produce-0'))
  assert.ok(urls('สกรีน 1 ตัว').includes('/faq/#start-0'))
  assert.ok(urls('ภ.พ.20').includes('/faq/#company-2'))
  /* ไซซ์ → หน้าตารางไซซ์ขึ้นก่อน · ราคา → หน้าคำนวณ */
  assert.equal(urls('ไซส์')[0], '/size-chart/')
  /* "size" ใน "Oversize" ไม่ใช่ไซซ์ · พิมพ์ oversize / โอเวอร์ไซส์ ยังเจอ Jersey */
  const J = { t: 'Jersey Oversize', d: 'ทรงหลวม ใส่สบาย', u: '/custom-oversize-jerseys/', k: 'สินค้า' }
  assert.ok(!searchPages('ไซส์', [...PAGES, J], routes).includes(J))
  assert.ok(searchPages('oversize', [J], routes).includes(J))
  assert.ok(searchPages('โอเวอร์ไซส์', [J], routes).includes(J))
  assert.equal(urls('ราคา')[0], '/calculations/')
  /* DTF: หน้าเสื้อสกรีนขึ้นก่อน (เดิม alias dtf → สกรีน) */
  assert.equal(urls('DTF')[0], '/screen-printing/')
  assert.deepEqual(urls('zxqv'), [])
  assert.deepEqual(urls(''), [])
})

test('/search/ แม่แบบ: ปุ่มลูกค้าเดิมบนสุด · หน้าไม่พบมี LINE พร้อมคำค้น เบอร์โทร /faq/ /calculations/', () => {
  const html = read('site/search/index.html')
  const js = read('src/js/search-page.js')
  const actions = html.indexOf('data-sr-actions')
  assert.ok(actions > 0 && actions < html.indexOf('id="pageResults"'), 'กล่องลูกค้าเดิมอยู่ก่อนผลลัพธ์')
  assert.ok(html.indexOf('id="faqResults"') > 0 && html.indexOf('id="faqResults"') < html.indexOf('id="pageResults"'), 'คำตอบ FAQ อยู่ก่อนหน้าที่เกี่ยวข้อง')
  const empty = html.slice(html.indexOf('id="searchEmpty"'), html.indexOf('id="searchIndex"'))
  assert.match(empty, /data-sr-ask/)
  assert.match(empty, /href="tel:\{\{site\.phonePrimaryTel\}\}"/)
  assert.match(empty, /href="\{\{url 'faq'\}\}"/)
  assert.match(empty, /href="\{\{url 'calculations'\}\}"/)
  assert.match(js, /lineMessageUrl\(askText\(q\)\)/)
  /* ปุ่มลูกค้าเดิมใช้ลิงก์ชุดเดียวกับเมนู/ท้ายเว็บ (vite.config.js reorderLine / trackLine ← use-cta.js REORDER_TEXT / TRACK_TEXT) */
  const acts = html.slice(actions, html.indexOf('id="faqResults"'))
  assert.match(acts, /href="\{\{reorderLine\}\}" data-sr-act="reorder"/)
  assert.match(acts, /href="\{\{trackLine\}\}" data-sr-act="track"/)
  assert.match(js, /queryActions\(q\)/)
  /* ไม่แก้ main.css · CSS ของหน้าค้นหาอยู่ไฟล์ของหน้าเอง */
  assert.match(js, /^import '\.\/page\.js'\nimport '\.\.\/styles\/page-search\.css'/)
})

test('/faq/ หน้าไม่พบ: ข้อความ LINE ใช้ askText (ลูกค้าเดิมได้แบบฟอร์มติดตาม/สั่งซ้ำ)', () => {
  const js = read('src/js/faq-page.js')
  assert.match(js, /lineMessageUrl\(askText\(q\)\)/)
})
