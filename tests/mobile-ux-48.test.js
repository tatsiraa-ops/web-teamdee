/* ตรวจการใช้งานมือถือ "ให้ดีกว่า" (30 ต.ค. · docs/audit/2026-10-30-mobile-ux-audit.md) · กลุ่มแก้เร็ว (S) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const main = read('src/styles/main.css')
const head = read('src/partials/head.hbs')

test('iPhone: viewport-fit=cover (env(safe-area-inset-*) ที่ใช้ 14 จุดถึงมีผล) · บอกเบราว์เซอร์ว่าเว็บเป็นโหมดสว่าง', () => {
  assert.match(head, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/)
  assert.match(head, /<meta name="color-scheme" content="light">/)
  /* แนวนอน: เนื้อหาไม่เข้าไปใต้รอยบาก */
  assert.match(main, /padding-inline: env\(safe-area-inset-left\) env\(safe-area-inset-right\)/)
})

test('แถบล่างมือถือหลบตอนพิมพ์ (Android เดิมลอยเหนือคีย์บอร์ด 72px)', () => {
  assert.match(main, /html:has\(:is\(input:not\(\[type=checkbox\], \[type=radio\], \[type=range\]\), textarea, select\):focus\) \.mobilebar \{ display: none; \}/)
})

test('กรอบช่องกรอก ≥ 3:1 บนขาว (WCAG 1.4.11 · เดิม #C4BFB4 = 1.83:1)', () => {
  assert.match(main, /--color-field: +#8C877C;/)
  assert.match(main, /\.input \{ @apply [^}]*border-field/)
})

test('hover ของปุ่มเฉพาะเครื่องที่ชี้ได้จริง (iOS แตะแล้ว hover ค้าง)', () => {
  assert.match(main, /@media \(hover: hover\) \{ \.btn:hover \{ transform: translateY\(-1px\);/)
})

test('ลิงก์ซ้ำชื่อเดียวกันมีชื่อเฉพาะสำหรับโปรแกรมอ่านจอ · เมนูบอกหน้าปัจจุบัน', () => {
  assert.match(read('site/faq/index.html'), /aria-label="ถามต่อใน LINE: \{\{this\.q\}\}"/)
  assert.match(read('src/partials/siteHeader.hbs'), /aria-current="page"/)
})

test('หน้ากลุ่มลูกค้า: ปุ่ม LINE หลักเป็นปุ่มเขียวไอคอน LINE ชุดเดียวกับทั้งเว็บ (เดิมส้ม + ไอคอนแชท)', () => {
  const up = read('src/partials/usePage.hbs')
  assert.match(up, /data-where="use-hero">[\s\S]{0,200}?<a class="cb cb--p max-sm:w-full" href="\{\{cta\.primary\.href\}\}" data-track="line"><span class="cb__ico" aria-hidden="true">\{\{> icoLine\}\}<\/span><span class="cb__t">\{\{cta\.primary\.label\}\}<\/span><\/a>/)
  assert.match(up, /<div class="hm-cta__btns hm-end__btns"><a class="cb cb--p" href="\{\{up\.team\.ask\.line\}\}" data-track="line"><span class="cb__ico" aria-hidden="true">\{\{> icoLine\}\}<\/span>/)
})

test('วิธีชำระที่ยืนยันแล้ว (30 ต.ค.): มัดจำ 50% ทุกงาน · โอน / PromptPay · บัตร · วางบิล · ข้างปุ่มหน้าสินค้าและหน้าคำนวณ', () => {
  const site = JSON.parse(read('src/data/site.json'))
  assert.equal(site.payLine, 'มัดจำ 50% · โอน / PromptPay · บัตร Visa / Mastercard · วางบิลได้')
  assert.match(read('src/partials/ppOrder.hbs'), /<p class="hp-reply hp-pay">\{\{site\.payLine\}\}<\/p>/)
  assert.match(read('site/calculations/index.html'), /<p class="hp-reply hp-pay">\{\{site\.payLine\}\}<\/p>/)
  assert.match(read('src/data/faq.json'), /มัดจำ 50% ก่อนเริ่มผลิตทุกงาน[^"]*โอนเงิน PromptPay/)
})

/* 3 พ.ย. 2026 อาร์ต: "ไม่เอาราคาหรือจำนวนตัว" บนการ์ดบริการหน้าแรก (เดิม 30 ต.ค. "1 ก" ใส่ชิปราคา) · ราคาเต็มยังอยู่ในหน้าสินค้าและเครื่องคำนวณ */
test('หน้าแรก: การ์ดบริการไม่มีชิปราคา/ขั้นต่ำ · hero ไม่มีราคา', () => {
  const idx = read('site/index.html')
  assert.doesNotMatch(idx, /<span class="hm-cat__chip">/)
})
test('ป้ายคุกกี้: "เฉพาะที่จำเป็น" กับ "ยอมรับทั้งหมด" เป็นปุ่มหน้าตาเดียวกัน วางคู่กัน', () => {
  const all = read('src/partials/consentBar.hbs')
  const bar = all.slice(all.indexOf('<div class="ck__btns">'), all.indexOf('</section>'))
  const btns = [...bar.matchAll(/<button type="button" class="([^"]+)" data-ck="(none|all)">([^<]+)<\/button>/g)]
  assert.equal(btns.length, 2)
  assert.equal(btns[0][1], btns[1][1], 'class เดียวกัน')
  assert.deepEqual(btns.map((b) => b[3]), ['เฉพาะที่จำเป็น', 'ยอมรับทั้งหมด'])
  assert.match(main, /\.ck__btns \{ display: grid; grid-template-columns: 1fr 1fr;/)
})

test('หน้าต่างตั้งค่ารายหมวด: บันทึกเฉพาะที่เลือก กับ ยอมรับทั้งหมด ปุ่มเท่ากัน', () => {
  const all = read('src/partials/consentBar.hbs')
  const dlg = all.slice(all.indexOf('<div class="ckd__act ck__btns">'))
  const btns = [...dlg.matchAll(/<button type="button" class="([^"]+)" data-ck="(save|all)">/g)]
  assert.equal(btns.length, 2)
  assert.equal(btns[0][1], btns[1][1])
})

test('ฟอร์มติดต่อ: ปุ่ม Enter บนคีย์บอร์ดมือถือ = ถัดไป · ไม่มี ?p= ?u= เดาสินค้า/งานจากหน้าที่มา', () => {
  const c = read('site/contact-us/index.html')
  for (const id of ['cName', 'cTel', 'cOrg', 'cMail', 'cQty', 'cOrder']) assert.match(c, new RegExp(`id="${id}"[^>]*enterkeyhint="next"`), id)
  assert.match(read('src/js/contact-page.js'), /contextFromPath\(from, routes\)/)
})

test('ฟอร์มติดต่อ: แตะช่องแล้วออกเฉยๆ ไม่ขึ้นแดง · หลังกดส่งครั้งแรกตรวจทุกครั้ง', () => {
  const js = read('src/js/contact-page.js')
  assert.match(js, /f\.addEventListener\('blur', \(\) => \{ if \(tried \|\| f\.value\.trim\(\)\) checkField\(id\) \}\)/)
  assert.match(js, /form\.addEventListener\('submit', async \(e\) => \{\n    tried = true/)
})

test('หน้าคำนวณ: ปุ่มส่งให้หัวหน้า/ทีมดู · ใช้เมนูแชร์ของเครื่องถ้ามี', () => {
  assert.match(read('site/calculations/index.html'), /id="sShare"[^>]*>[\s\S]*?ส่งให้หัวหน้า \/ ทีมดูใบประเมินนี้<\/a>/)
  const js = read('src/js/calc-page.js')
  assert.match(js, /share\.href = lineShareUrl\(shareText\(r, shareUrl\)\)/)
  assert.match(js, /navigator\.share\(\{ title: 'ใบประเมินราคาเบื้องต้น TEAMDEE', text: shareBody, url: shareUrl \}\)/)
})

test('ตัวหนังสือที่ลูกค้าต้องอ่านไม่ต่ำกว่า 12px (แถบล่าง ป้ายบนรูป การ์ดคำนวณ · เดิม 10–11.5px)', () => {
  const css = ['src/styles/main.css', 'src/styles/home.css', 'src/styles/page-calculations.css'].map(read).join('\n')
  for (const sel of ['.mb__sub', '.mb__s', '.tier span', '.sample-choices small', '.hm-cat__image-label', '.hm-journal__video-label', '.kcard__p']) {
    for (const m of css.matchAll(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ?\\{[^}]*font-size: ?([\\d.]+)px`, 'g'))) assert.ok(+m[1] >= 12, `${sel} ${m[1]}px`)
  }
})

test('ปุ่มเลื่อนรางมีชื่อกลุ่มตามหัวข้อส่วน · รางยังเป็นรายการ (ไม่ใส่ role ทับ)', () => {
  const js = read('src/js/mobile-ui.js')
  assert.match(js, /controls\.setAttribute\('role', 'group'\)/)
  assert.match(js, /controls\.setAttribute\('aria-label', heading \? `เลื่อนดู: \$\{heading\}` : 'เลื่อนดูรายการ'\)/)
  assert.doesNotMatch(js, /rail\.setAttribute\('role'/)
})

test('เลขสถิติช่วงวิ่งใช้ส้มที่อ่านได้บนขาว (≥ 3:1 ตัวใหญ่ · เดิม 2.84:1)', () => {
  assert.match(main, /--color-orange-text: #E05F00;/)
  assert.match(read('src/styles/home.css'), /\.is-armed \.hm-stat__n \{ color: var\(--color-orange-text\)/)
  assert.match(read('src/styles/page-project.css'), /\.pj-stats\.is-armed \.pj-stat__n \{ display: inline-block; color: var\(--color-orange-text\)/)
})
