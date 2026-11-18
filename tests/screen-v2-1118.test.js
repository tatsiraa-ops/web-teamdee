/* 18 พ.ย. 2026 อาร์ต "ย้ายเป็น pp2 แบบพิมพ์ลาย" · /screen-printing/ ใช้โครงหน้าโฉมใหม่เดียวกับ /sublimation/ /embroidery/
   hero (เสื้อ Vespa จริง) → จุดเด่น → เบื้องหลังงานจริง → รีวิว → เสื้อ+ขนาดลาย → ราคา → เสื้อของคุณ → ไซซ์ → เสื้อจริงบนหุ่น → ขั้นตอน → คลังรีวิว → ชำระเงิน → FAQ
   ตรวจ HTML ที่ export แล้ว (npm run build && npm run export:wp) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const pub = (p) => existsSync(new URL(`../public${p}`, import.meta.url))
const html = read('wp-theme/teamdee/build/pages/screen-printing.body.html')
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
const S = JSON.parse(read('src/data/prices.json')).products.screen

test('โครงหน้าโฉมใหม่ · ลำดับส่วน', () => {
  const keys = ['class="band-hero pp2-hero"', 'class="pp2-hl"', 'class="pp2-pf"', ' id="reviews"', ' id="options"', ' id="detail"', ' id="price"', ' id="own-shirt"', ' id="size"', ' id="real-shirts"', ' id="order"', ' id="payment"', ' id="faq"']
  const at = keys.map((k) => main.indexOf(k))
  assert.deepEqual(keys.filter((_, i) => at[i] < 0), [])
  assert.deepEqual(at, at.slice().sort((a, b) => a - b))
  assert.doesNotMatch(main, /class="pp-strip|data-toc|id="quote-h"|id="end-h"/, 'ไม่มีแถบสรุป/สารบัญ/กล่องปิดแบบเดิม')
})

test('hero: ภาพเสื้อ Vespa จริง (เดสก์ท็อป + มือถือ) · H1 รับทำเสื้อสกรีน', () => {
  for (const f of ['screen-2304', 'screen-1280', 'screen-800', 'screen-m-768', 'screen-m-480']) assert.ok(pub(`/img/pp-hero/${f}.webp`), f)
  assert.match(text(main.match(/<h1[\s\S]*?<\/h1>/)[0]), /รับทำเสื้อสกรีน/)
  assert.equal((main.match(/<h1[\s>]/g) || []).length, 1)
})

test('ไม่มีภาพแบรนด์อื่น (SAIFAH mockup) · ภาพทุกภาพในส่วนใหม่มีไฟล์', () => {
  assert.doesNotMatch(main, /mockup-3d-(entaneer|chula)/)
  /* export ย้ายรูปไป /wp-content/uploads/teamdee/img → เทียบกับ public/img */
  const srcs = [...main.matchAll(/src="(?:\/wp-content\/uploads\/teamdee)?(\/img\/(?:pp-hero|pp-cz\/scr-|pp-proof\/scr-|real-even\/screen|use-pay\/screen)[^"]+)"/g)].map((m) => m[1])
  assert.ok(srcs.length >= 12, srcs.length)
  for (const s of srcs) assert.ok(pub(s), s)
})

test('เบื้องหลัง ≥9 ภาพ · เสื้อจริงบนหุ่น 10 ตัว (Drive "ตัวอย่างสกรีน") + ภาพใกล้ 4 ภาพ', () => {
  const pf = main.slice(main.indexOf('class="pp2-pf"'), main.indexOf(' id="reviews"'))
  assert.ok((pf.match(/class="pp2-pf__bc/g) || []).length >= 9)
  const rl = main.slice(main.indexOf(' id="real-shirts"'), main.indexOf(' id="order"'))
  for (const n of [1, 2, 3, 4]) assert.match(rl, new RegExp(`/img/real-even/screen-${n}`))
  /* 18 พ.ย. อาร์ต "มีไดร์ฟเสื้อสกรีน เอามาใช้เต็มที่": 10 ตัว = 5×2 คอม · 3×3 มือถือ */
  assert.equal((rl.match(/class="pp2-rl__c"/g) || []).length, 10)
  for (const k of ['scr-speed-front', 'scr-speed-side', 'scr-fit-front', 'scr-fit-back', 'scr-power-front', 'scr-power-back']) {
    assert.match(rl, new RegExp(`/img/real-even/${k}`)); assert.ok(pub(`/img/real-even/${k}-540.webp`) && pub(`/img/real-even/${k}.webp`), k)
  }
  const dt = rl.slice(rl.indexOf('id="pp2RealDetail"'))
  assert.equal((dt.match(/class="pp2-rd__c"/g) || []).length, 4)
  for (const k of ['speed', 'back', 'batch', 'fit']) for (const w of [640, 960]) assert.ok(pub(`/img/screen-real/scr-dt-${k}-${w}.webp`), `${k}-${w}`)
  assert.doesNotMatch(text(rl), /DTF/, 'ภาพจาก Drive ไม่รู้เทคนิคแน่ชัด ไม่เคลมว่าเป็น DTF')
})

test('ขั้นตอน 6 ขั้น · จ่าย 3 จังหวะ (มัดจำขึ้นแบบ 300 → 50% → ก่อนส่ง) · วันผลิตใหม่', () => {
  const st = text(main.slice(main.indexOf(' id="order"'), main.indexOf(' id="payment"')))
  assert.equal((main.match(/class="pp2-stb__s pp2-stb__s--/g) || []).length, 6)
  assert.match(st, new RegExp(`มัดจำขึ้นแบบ ${S.deposit} บาท`)); assert.match(st, /สั่งผลิตจ่าย 50%/); assert.match(st, /ชำระส่วนที่เหลือ/)
  assert.match(st, /1–50 ตัว 1–2 วัน/); assert.match(st, /ผลิต 1–7 วัน/)
  const pay = text(main.slice(main.indexOf(' id="payment"'), main.indexOf(' id="faq"')))
  assert.match(pay, /มัดจำขึ้นแบบ 300 บาท/); assert.doesNotMatch(pay, /มัดจำ 50% ก่อนเริ่มผลิต/)
})

test('ไม่มีข้อมูลภายในจากเอกสาร flow', () => {
  for (const bad of ['HUB', 'มั่ง', 'น้องมัง', 'Saijai', 'Web App', 'หัวหน้าทีม', 'tmkhub', 'KIRIN', 'โรงงาน']) assert.ok(!text(main).includes(bad), bad)
})

test('เบื้องหลัง: คลิปจริงงานสกรีน 7 คลิป แถวเดียว เล่นเองแบบปิดเสียง (อาร์ต "เอาคลิปเล่นมาเลย") · มีไฟล์ mp4 + รูปปกครบ · มีปุ่มหยุดคลิป', () => {
  const pf = main.slice(main.indexOf('class="pp2-pf"'), main.indexOf(' id="reviews"'))
  assert.match(pf, /class="pp2-pf__lp pp2-pf__lp--reel"/)
  const vids = [...pf.matchAll(/<video[^>]*data-loop[^>]*poster="(?:\/wp-content\/uploads\/teamdee)?(\/img\/screen-clip\/[^"]+\.webp)"[^>]*><source src="(?:\/wp-content\/uploads\/teamdee)?(\/img\/screen-clip\/[^"]+\.mp4)"/g)]
  assert.equal(vids.length, 7)
  for (const [tag, poster, mp4] of vids) { assert.ok(pub(mp4), mp4); assert.ok(pub(poster), poster); assert.match(tag, / muted loop playsinline preload="none"/) }
  assert.match(pf, /data-loops-pause/, 'WCAG 2.2.2 ปุ่มหยุดคลิป')
  assert.doesNotMatch(pf, /vslot|vgrid/, 'ไม่มีแถวคลิปแบบกดเล่น/ปุ่มเลื่อนซ้ำ')
})
