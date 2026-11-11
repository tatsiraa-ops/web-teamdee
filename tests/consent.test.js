/* ป้ายยินยอมคุกกี้ PDPA (อาร์ตเลือกแบบ ก แถบล่างจอ · 26 ต.ค. 2026 · PLAN.md "คุกกี้ + ป๊อปอัป")
   3 หมวด (30 ต.ค.): analytics (วัดผล GA4) · marketing (โฆษณา Meta Pixel/Google Ads) · media (ตัวเล่น Facebook · ไม่ให้สิทธิ์โฆษณา)
   ยังไม่เลือก = ปฏิเสธทุกหมวด (Consent Mode default denied) · จำ 12 เดือนแล้วถามใหม่ */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { parseConsent, makeConsent, gtagConsent, needsAsk, CONSENT_DAYS, DENIED, VERSION, staleCookies, cookieDomains } from '../src/js/consent.js'

const now = new Date('2026-10-26T10:00:00Z')
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('ยังไม่เคยเลือก หรือข้อมูลเสีย = ต้องถาม และถือว่าปฏิเสธทุกหมวด', () => {
  for (const raw of [null, '', 'xx', '{"v":0}', '{"v":1,"analytics":"yes"}', '{"v":2,"analytics":true,"marketing":true,"at":"2026-10-26T09:00:00Z"}']) {
    const c = parseConsent(raw, now)
    assert.equal(needsAsk(c), true, String(raw))
    assert.deepEqual(gtagConsent(c), DENIED)
    assert.equal(c.media, false)
  }
})

test('เลือกแล้วจำไว้ 12 เดือน · เกินแล้วถามใหม่', () => {
  assert.equal(CONSENT_DAYS, 365)
  assert.equal(VERSION, 2)
  const c = makeConsent({ analytics: true, marketing: false, media: true }, now)
  assert.equal(c.v, 2)
  const back = parseConsent(JSON.stringify(c), now)
  assert.equal(needsAsk(back), false)
  assert.equal(back.analytics, true)
  assert.equal(back.marketing, false)
  assert.equal(back.media, true)
  const later = new Date(now.getTime() + 366 * 864e5)
  assert.equal(needsAsk(parseConsent(JSON.stringify(c), later)), true)
})

test('แปลงเป็น Consent Mode v2 ของ Google: วัดผล = analytics_storage · โฆษณา = ad_storage ad_user_data ad_personalization', () => {
  assert.deepEqual(gtagConsent(makeConsent({ analytics: true, marketing: false }, now)), {
    analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  })
  assert.deepEqual(gtagConsent(makeConsent({ analytics: false, marketing: true }, now)), {
    analytics_storage: 'denied', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted',
  })
})

test('หมวดสื่อ (ตัวเล่น Facebook) ไม่ให้สิทธิ์โฆษณาหรือวัดผลของ Google เลย (เดิมกดเล่นคลิป = เปิดคุกกี้โฆษณาทั้งเว็บ)', () => {
  const c = makeConsent({ analytics: false, marketing: false, media: true }, now)
  assert.equal(needsAsk(c), false)
  assert.deepEqual(gtagConsent(c), DENIED)
})

test('เฉพาะที่จำเป็น = เลือกแล้ว (ไม่ถามซ้ำ) แต่ปฏิเสธทุกหมวด', () => {
  const c = makeConsent({ analytics: false, marketing: false, media: false }, now)
  assert.equal(needsAsk(c), false)
  assert.deepEqual(gtagConsent(c), DENIED)
})

test('ค่าเก่า v1 (ก่อนแยกหมวดสื่อ): ถามใหม่ · คงแค่วัดผล · โฆษณาและสื่อถือว่าไม่ยินยอมจนกว่าจะเลือกใหม่', () => {
  const v1 = JSON.stringify({ v: 1, analytics: true, marketing: true, at: '2026-10-20T10:00:00Z' })
  const c = parseConsent(v1, now)
  assert.equal(needsAsk(c), true)
  assert.equal(c.analytics, true)
  assert.equal(c.marketing, false)
  assert.equal(c.media, false)
  assert.deepEqual(gtagConsent(c), { ...DENIED, analytics_storage: 'granted' })
  /* v1 หมดอายุ = ไม่เหลืออะไร */
  assert.deepEqual(gtagConsent(parseConsent(v1, new Date('2027-12-01T00:00:00Z'))), DENIED)
})

test('ถอนความยินยอม: เลือกคุกกี้ที่ต้องลบตามหมวดที่ปิด', () => {
  const jar = '_ga=GA1.1.1; _ga_ABC123=GS1; _gid=GA1.2; _gat_UA-1=1; _fbp=fb.1.2; _fbc=fb.1.3; _gcl_au=1.1; _gcl_aw=GCL.1; td_x=1; _gax=keep'
  const none = makeConsent({ analytics: false, marketing: false, media: false }, now)
  assert.deepEqual(staleCookies(jar, none).sort(), ['_fbc', '_fbp', '_ga', '_ga_ABC123', '_gat_UA-1', '_gcl_au', '_gcl_aw', '_gid'])
  const adsOff = makeConsent({ analytics: true, marketing: false }, now)
  assert.deepEqual(staleCookies(jar, adsOff).sort(), ['_fbc', '_fbp', '_gcl_au', '_gcl_aw'])
  const gaOff = makeConsent({ analytics: false, marketing: true }, now)
  assert.deepEqual(staleCookies(jar, gaOff).sort(), ['_ga', '_ga_ABC123', '_gat_UA-1', '_gid'])
  assert.deepEqual(staleCookies(jar, makeConsent({ analytics: true, marketing: true }, now)), [])
  assert.deepEqual(staleCookies('', none), [])
})

test('โดเมนที่ต้องลบคุกกี้: host เอง + โดเมนแม่ · IP / localhost ลบแบบ host เท่านั้น', () => {
  assert.deepEqual(cookieDomains('www.teamdee.co.th'), ['', 'www.teamdee.co.th', 'teamdee.co.th', 'co.th'])
  assert.deepEqual(cookieDomains('teamdee.co.th'), ['', 'teamdee.co.th', 'co.th'])
  assert.deepEqual(cookieDomains('localhost'), [''])
  assert.deepEqual(cookieDomains('127.0.0.1'), [''])
  assert.deepEqual(cookieDomains('[::1]'), [''])
})

/* รันสคริปต์ใน head จริง (ไม่มีเบราว์เซอร์) แล้วเทียบกับ consent.js ว่าตีความค่าที่เก็บไว้ตรงกัน */
const HEAD = read('src/partials/consentHead.hbs').match(/<script>.*<\/script>/)[0]
const runHead = (stored) => {
  const ctx = { localStorage: { getItem: () => stored }, Date, JSON }
  ctx.window = ctx
  vm.runInNewContext(HEAD.replace(/^<script>|<\/script>$/g, ''), ctx)
  return ctx
}
/* JSON ไป-กลับ: object จาก vm คนละ realm กับ assert */
const cmds = (ctx) => JSON.parse(JSON.stringify(ctx.dataLayer.map((a) => [...a])))

test('สคริปต์ใน head: ค่าเริ่ม denied + ads_data_redaction · ตัวแปรไม่หลุดเป็น global ยกเว้น gtag กับ dataLayer', () => {
  const ctx = runHead(null)
  assert.deepEqual(cmds(ctx), [
    ['consent', 'default', { ...DENIED, wait_for_update: 500 }],
    ['set', 'ads_data_redaction', true],
  ])
  assert.equal(typeof ctx.gtag, 'function')
  for (const leak of ['c', 'g', 'a', 'm']) assert.equal(leak in ctx, false, leak)
})

test('สคริปต์ใน head อ่านค่าที่เก็บไว้ (v1 และ v2) ได้ผลเดียวกับ consent.js', () => {
  const at = new Date(Date.now() - 864e5).toISOString()
  const cases = [
    { v: 2, analytics: true, marketing: true, media: true, at },
    { v: 2, analytics: false, marketing: true, media: false, at },
    { v: 2, analytics: true, marketing: false, media: true, at },
    { v: 2, analytics: true, marketing: true, at },
    { v: 1, analytics: true, marketing: true, at },
    { v: 1, analytics: false, marketing: true, at },
    { v: 3, analytics: true, marketing: true, media: true, at },
  ]
  for (const c of cases) {
    const raw = JSON.stringify(c)
    const update = cmds(runHead(raw)).find((x) => x[0] === 'consent' && x[1] === 'update')
    const want = gtagConsent(parseConsent(raw))
    assert.deepEqual(update ? update[2] : DENIED, want, raw)
  }
  assert.equal(cmds(runHead('{bad')).length, 2)
})

test('ค่าเริ่ม Consent Mode ในต้นแบบกับธีม WordPress เป็นสคริปต์เดียวกัน และพิมพ์ก่อน GTM', () => {
  const php = read('wp-theme/teamdee/functions.php')
  const inPhp = php.match(/function td_consent_default\(\): string \{\s*return '(.*)';/)[1].replace(/\\'/g, "'")
  assert.equal(inPhp, HEAD)
  for (const k of ["'default'", "analytics_storage:'denied'", "ad_user_data:'denied'", 'td-consent', 'g<=365', 'g>=0', "typeof c.marketing==='boolean'", "'ads_data_redaction',true"]) assert.ok(HEAD.includes(k), k)
  /* ลำดับ wp_head: consent 0 · GTM 1 */
  assert.match(php, /echo td_consent_default\(\) \. "\\n";\s*\}, 0\);/)
})

test('หน้าตั้งค่าคุกกี้มี 3 หมวดเลือกได้ + บอกของที่ "จำเป็น" เก็บไว้ · ตัวเล่น Facebook ใช้หมวดสื่อ ไม่แตะหมวดโฆษณา', () => {
  const bar = read('src/partials/consentBar.hbs')
  for (const id of ['ckAnalytics', 'ckMarketing', 'ckMedia']) assert.match(bar, new RegExp(`<input type="checkbox" class="ckd__sw" id="${id}"`), id)
  assert.match(bar, /สื่อจากภายนอก \(ตัวเล่น Facebook\)/)
  for (const k of ['การเลือกคุกกี้', 'แบบเสื้อ', 'ไม่ต้องแสดงอีก', 'การ์ดแนะนำ', 'ปิดแท็บ']) assert.ok(bar.includes(k), k)
  const ui = read('src/js/consent-ui.js')
  assert.match(ui, /choose\(\{ analytics: true, marketing: true, media: true \}\)/)
  assert.match(ui, /choose\(\{ analytics: false, marketing: false, media: false \}\)/)
  const vs = read('src/js/video-slot.js')
  assert.doesNotMatch(vs, /marketing: true/)
  assert.match(vs, /c\.media/)
  assert.doesNotMatch(read('src/partials/videoSlot.hbs'), /คุกกี้โฆษณา(?!ของทีมดี)/)
})

/* รีวิว 30 ต.ค.: ผู้ใช้ที่ยังไม่ตอบป้ายคุกกี้ กดเล่นคลิป → เดิมบันทึก { วัดผล: ไม่, โฆษณา: ไม่ } แทนผู้ใช้ ป้ายไม่ถามอีกเลย
   ใหม่: ยังไม่เคยตอบ = เล่นคลิปที่กดครั้งนี้อย่างเดียว ไม่บันทึกการเลือก · เคยตอบแล้ว = เพิ่มหมวดสื่อ คงหมวดอื่นตามเดิม */
test('กดเล่นคลิปก่อนตอบป้ายคุกกี้ ไม่บันทึกการเลือกแทนผู้ใช้', () => {
  const vs = read('src/js/video-slot.js')
  assert.match(vs, /import \{ getConsent, setConsent, onConsent, needsAsk \} from '\.\/consent\.js'/)
  assert.match(vs, /if \(!c\.media && !needsAsk\(c\)\) setConsent\(\{ analytics: c\.analytics, marketing: c\.marketing, media: true \}\)/)
})
