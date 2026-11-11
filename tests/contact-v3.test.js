/* หน้าติดต่อโฉมใหม่ ทาง ก. ตามบอร์ด (รอบ 170b · 9 พ.ย. อาร์ต "ยังไม่ได้ … ไปคิดมาดีๆ" → เลือก "ทาง ก. ตามบอร์ด"):
   hero "ติดต่อทีมดี" + ภาพ 3D · แถวช่องทาง: การ์ด LINE เขียวกระชับ (นาฬิกา 3D + มือถือแชท) คู่การ์ดโทร
   แถบติดตามบรรทัดเดียว · แถบออฟฟิศกว้าง (ข้อมูลซ้าย แผนที่ขึ้นทันที + รูปจริงขวา) · ฟอร์ม 2 คอลัมน์กระชับ
   แต่ละช่องทางมีที่เดียว (ไม่มีปุ่มทางลัดซ้ำใน hero · แถบติดตามไม่มี LINE ซ้ำ) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')
const page = read('site/contact-us/index.html')
const main = page.slice(page.indexOf('<main'), page.indexOf('</main>'))
const block = (id) => {
  const m = main.match(new RegExp(`<(section|div)[^>]*id="${id}"[\\s\\S]*?<!-- /${id} -->`))
  assert.ok(m, `ไม่พบบล็อก #${id} (ปิดท้ายด้วย <!-- /${id} -->)`)
  return m[0]
}

test('ลำดับตามบอร์ด: hero → LINE + โทร → ติดตาม → ออฟฟิศ → ฟอร์ม', () => {
  const at = ['cx-h1', 'line', 'call', 'follow', 'location', 'form'].map((id) => main.indexOf(`id="${id}"`))
  assert.ok(at.every((x) => x > 0), JSON.stringify(at))
  assert.deepEqual([...at].sort((a, b) => a - b), at)
})

test('hero (รอบ 170c): H1 "มีโจทย์เสื้อทีม คุยกับทีมดีได้เลย." ท้ายส้ม + "ติดต่อทีมดี" + คำค้น · ตัวละคร 3D พนักงานตกแต่ง · ไม่มีปุ่มทางลัดซ้ำ', () => {
  const h1 = main.match(/<h1[\s\S]*?<\/h1>/)[0]
  assert.match(h1, /มีโจทย์เสื้อทีม/)
  assert.match(h1, /class="[^"]*\bhm-hl\b[^"]*"[^>]*>คุยกับทีมดีได้เลย\./)
  assert.match(h1, /ติดต่อทีมดี/)
  assert.match(h1, /ปรึกษาและขอราคาสั่งทำเสื้อทีม/)
  assert.match(main, /<img[^>]*src="\/img\/contact\/agent-900\.webp"[^>]*alt=""/)
  for (const w of [560, 900]) assert.ok(existsSync(join(root, `public/img/contact/agent-${w}.webp`)), `agent-${w}`)
  assert.doesNotMatch(main, /cx-jump/)
})

test('การ์ด LINE: H2 เริ่มคุยกับทีมดี (v22) · ตอบภายใน 5 นาที · บริการ 3 อย่าง · ปุ่มขาวเต็มแถว · นาฬิกา 3D · มือถือแชทเป็น HTML', () => {
  assert.match(main, /<h2[^>]*>[\s\S]*?เริ่มคุยกับทีมดี[\s\S]*?<\/h2>/)
  const c = block('line')
  assert.match(c, /แชทผ่าน LINE/)
  assert.match(c, /ตอบไว ภายใน 5 นาที/)
  assert.match(c, /class="cx-lc__sticker"[\s\S]*?ตอบไว[\s\S]*?5[\s\S]*?นาที/, 'นาฬิกาเป็นสติกเกอร์มีคำเป็น HTML')
  for (const t of ['ส่งไฟล์ขอราคา', 'สอบถามเพิ่มเติม', 'สั่งผลิต / ติดตามออเดอร์']) assert.match(c, new RegExp(t), t)
  assert.match(c, /<a class="cx-lc__go"[^>]*href="\{\{\{contactLineUrl\}\}\}"[^>]*>เริ่มแชทเลย/)
  assert.match(c, /<img[^>]*src="\/img\/contact\/stopwatch-240\.webp"[^>]*alt=""/)
  assert.ok(existsSync(join(root, 'public/img/contact/stopwatch-240.webp')))
  assert.match(c, /class="lc__chat" aria-hidden="true"/)
  assert.doesNotMatch(main, /\{\{> lineCta/, 'ไม่ใช้แบนเนอร์ LINE ตัวใหญ่ของ /designs/ บนหน้านี้')
  assert.match(read('vite.config.js'), /base\.contactLineUrl = /)
})

test('การ์ดโทร: 2 เบอร์จาก site.json · เวลาทำการ', () => {
  const c = block('call')
  assert.match(c, /โทรหาทีมดี/)
  assert.match(c, /href="tel:\{\{site\.phonePrimaryTel\}\}"/)
  assert.match(c, /href="tel:0864166449"/)
  assert.match(c, /\{\{site\.phoneSecondary\}\}/)
  assert.match(c, /\{\{site\.hours\}\}/)
  assert.doesNotMatch(c, /dock-phone/, 'การ์ดโทรแบบตัวหนังสือ ไม่มีไอคอน 3D')
})

test('แถบติดตาม: Facebook teamdee + Instagram teamdee_ เท่านั้น · เปิดแท็บใหม่บอกโปรแกรมอ่านจอ · ไม่มี LINE ซ้ำ', () => {
  const row = block('follow')
  assert.match(row, /href="https:\/\/www\.facebook\.com\/teamdee"/)
  assert.match(row, /href="https:\/\/www\.instagram\.com\/teamdee_\/"/)
  const links = row.match(/<a [\s\S]*?<\/a>/g)
  assert.equal(links.length, 2)
  for (const a of links) { assert.match(a, /target="_blank"/); assert.match(a, /rel="noopener"/); assert.match(a, /เปิดแท็บใหม่/) }
  assert.doesNotMatch(row, /lineUrl|href="[^"]*(tiktok|youtube|shopee|lazada)/i)
})

test('ออฟฟิศ: H2 ที่ตั้ง (v22) · ที่อยู่ เวลา · แผนที่ Google ฝังจากที่อยู่ (lazy · มีชื่อ) · รูปจริง 2 รูป · ปุ่มนัดเข้าพบ', () => {
  const loc = block('location')
  assert.match(loc, /<h2[^>]*>[\s\S]*?ที่ตั้งทีมดี นนทบุรี[\s\S]*?<\/h2>/)
  assert.match(loc, /\{\{site\.address\}\}/)
  assert.match(loc, /\{\{site\.hours\}\}/)
  assert.match(loc, /<iframe[^>]*src="https:\/\/www\.google\.com\/maps\?q=\{\{enc site\.address\}\}&amp;output=embed"[^>]*>/)
  const f = loc.match(/<iframe[^>]*>/)[0]
  assert.match(f, /loading="lazy"/)
  assert.match(f, /title="[^"]+"/)
  assert.match(loc, /href="\{\{site\.mapUrl\}\}"/)
  /* รอบ 170d: หัวการ์ด = รูปหน้าออฟฟิศจริง + แถบส้ม · ตัดรูปไลน์ผลิต (ยังไม่ยืนยันว่าอาคารเดียวกับออฟฟิศ) */
  assert.match(loc, /<figure class="cx-office__hero">[\s\S]*?<img[^>]*src="\/img\/visit\/storefront-800\.webp"[^>]*alt="[^"]+"[\s\S]*?<figcaption class="cx-office__band">[\s\S]*?id="loc-h"/)
  for (const w of [480, 800]) assert.ok(existsSync(join(root, `public/img/visit/storefront-${w}.webp`)), `storefront-${w}`)
  assert.doesNotMatch(loc, /heat-press/)
  assert.match(loc, /href="\{\{visitLine\}\}"/)
  assert.match(loc, /data-open-status[^>]*data-hours="\{\{site\.openingHours\}\}"/)
})

test('ออฟฟิศคู่ฟอร์มในแถวเดียวกัน (บอร์ด: การ์ดสาขาซ้าย ฟอร์มขวา) · สถานะเปิด/ปิดตามเวลาไทยจริงจาก openNow', () => {
  const pair = main.match(/<div class="[^"]*\bcx-pair\b[^"]*">[\s\S]*$/)[0]
  assert.ok(pair.indexOf('id="location"') > 0 && pair.indexOf('id="form"') > pair.indexOf('id="location"'))
  const js = read('src/js/contact-page.js')
  assert.match(js, /import \{ openNow \} from '\.\/nudge\.js'/)
  assert.match(js, /\[data-open-status\]/)
})

test('ฟอร์ม: "เล่าเรื่องเสื้อทีมของคุณ" (id form-h) · id ที่ contact-page.js ใช้ครบ · ช่องเอกสารแสดงตลอด · ปุ่มส่งเดิม', () => {
  const f = block('form')
  assert.match(f, /<h2 id="form-h"[^>]*>เล่าเรื่องเสื้อทีมของคุณ<\/h2>/)
  for (const id of ['contactForm', 'cFrom', 'cName', 'cTel', 'cOrg', 'cMail', 'cMail-bad', 'cProduct', 'cUse', 'cQty', 'cDate', 'cNote', 'cOrder', 'cOrgBox', 'formErrs', 'formErrsList', 'formOff', 'offLine', 'offBack', 'formFail', 'failMsg', 'failLine', 'failRetry', 'formMsg'])
    assert.match(f, new RegExp(`id="${id}"`), id)
  assert.doesNotMatch(f, /<details/)
  assert.match(f, /<legend[^>]*>(?:<img[^>]*alt=""[^>]*>)?เอกสารที่ต้องการ/)
  assert.match(f, /ส่งข้อมูลให้ทีมดีติดต่อกลับ/)
})
