/* ความยินยอมคุกกี้ (PDPA · อาร์ตเลือกแบบ ก แถบล่างจอ 26 ต.ค. 2026) · เทส tests/consent.test.js
   เก็บใน localStorage 'td-consent' · หมวด analytics (GA4) · marketing (Meta Pixel / Google Ads) · media (ตัวเล่น Facebook)
   30 ต.ค.: แยกหมวด media ออกจาก marketing (เดิมกดเล่นคลิป 1 ตัว = เปิดคุกกี้โฆษณาทั้งเว็บ) · media ไม่ให้สิทธิ์ ad_* ของ Google
   GTM อ่านผ่าน Consent Mode v2: head ตั้งค่าเริ่ม denied (ดู consentHead.hbs) แล้ว update เมื่อเลือก
   แท็กใน GTM ต้องตั้ง "ต้องมีความยินยอม" ให้ตรงหมวดด้วย (เช็กลิสต์ docs/audit/2026-10-26-checklist.md) */

export const KEY = 'td-consent'
/* 30 ต.ค.: v1 → v2 (เพิ่ม media) · ค่า v1 ต้องถามใหม่ */
export const VERSION = 2
export const CONSENT_DAYS = 365
export const DENIED = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

const fresh = () => ({ asked: false, analytics: false, marketing: false, media: false })
const bool = (v) => typeof v === 'boolean'

/** อ่านค่าที่เก็บไว้ · เสีย/เก่าเกิน 12 เดือน = ถือว่ายังไม่เลือก */
export function parseConsent(raw, now = new Date()) {
  try {
    const c = JSON.parse(raw)
    if (!c || !bool(c.analytics) || !bool(c.marketing) || !c.at) return fresh()
    const age = (now - new Date(c.at)) / 864e5
    if (!(age >= 0 && age <= CONSENT_DAYS)) return fresh()
    if (c.v === VERSION && bool(c.media)) return { asked: true, analytics: c.analytics, marketing: c.marketing, media: c.media, at: c.at }
    /* v1 (ก่อน 30 ต.ค.): marketing อาจมาจากกดเล่นคลิป (มัดรวม) → ถามใหม่ · คงแค่วัดผลที่เลือกเองไว้ระหว่างรอ */
    if (c.v === 1) return { ...fresh(), analytics: c.analytics, at: c.at, prev: 1 }
    return fresh()
  } catch {
    return fresh()
  }
}

/** ค่าที่จะเก็บเมื่อผู้ใช้เลือก */
export const makeConsent = ({ analytics, marketing, media }, now = new Date()) => ({ v: VERSION, analytics: !!analytics, marketing: !!marketing, media: !!media, at: now.toISOString() })

/** เลือกแล้วหรือยัง · รับได้ทั้งค่าที่อ่านแล้ว (asked) และค่าที่เพิ่งสร้าง (v) */
const chosen = (c) => c.asked === true || c.v === VERSION

export const needsAsk = (c) => !chosen(c)

/** Consent Mode v2 ของ Google · media ไม่เกี่ยว (ตัวเล่น Facebook ไม่ใช่โฆษณาของเรา) */
export const gtagConsent = (c) => {
  const a = (chosen(c) || c.prev === 1) && c.analytics ? 'granted' : 'denied'
  const m = chosen(c) && c.marketing ? 'granted' : 'denied'
  return { analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m }
}

/* ถอนความยินยอม (30 ต.ค.): คุกกี้ first-party ที่ต้องลบเมื่อปิดหมวด */
const AD_COOKIE = /^(?:_fbp|_fbc|_gcl_.+)$/
const GA_COOKIE = /^(?:_ga|_ga_.+|_gid|_gat.*)$/

/** ชื่อคุกกี้ใน document.cookie ที่ต้องลบตามหมวดที่ไม่ยินยอม */
export function staleCookies(jar, c) {
  return String(jar || '').split(';').map((s) => s.split('=')[0].trim()).filter((n) => n && ((!c.marketing && AD_COOKIE.test(n)) || (!c.analytics && GA_COOKIE.test(n))))
}

/** โดเมนที่ต้องลบ: '' = host อย่างเดียว · ตามด้วย host และโดเมนแม่ทุกชั้น (GA ตั้งที่โดเมนแม่) · IP / localhost ไม่มีโดเมนแม่ */
export function cookieDomains(host) {
  const h = String(host || '')
  if (!h.includes('.') || /^[\d.]+$/.test(h) || h.includes(':')) return ['']
  const parts = h.split('.')
  return ['', ...parts.slice(0, -1).map((_, i) => parts.slice(i).join('.'))]
}

/* ฝั่งเบราว์เซอร์ */
/* 3 พ.ย. อาร์ตสั่งเอาระบบคุกกี้ออกชั่วคราว (site.json cookieConsent=false → head ใส่ <meta name="td-consent" content="off">)
   ปิด = ตัวเล่น FB เล่นได้เลย · GA/โฆษณาไม่เปิด (GTM ค่าเริ่ม denied) · ต้องเปิดคืนก่อนขึ้นเว็บจริง */
export const consentWhenOff = () => ({ asked: true, analytics: false, marketing: false, media: true })
const consentOff = () => { try { return !!document.querySelector('meta[name="td-consent"][content="off"]') } catch { return false } }
const read = () => { if (consentOff()) return consentWhenOff(); try { return parseConsent(localStorage.getItem(KEY)) } catch { return fresh() } }
const listeners = new Set()

export const getConsent = () => read()

/** ปิดหมวดแล้วล้างของที่ค้าง: บอก Meta Pixel ให้หยุด + ลบคุกกี้ _fbp _gcl_* _ga* (path=/ ทั้ง host และโดเมนแม่) */
function withdraw(c) {
  try { if (typeof window.fbq === 'function') window.fbq('consent', c.marketing ? 'grant' : 'revoke') } catch {}
  try {
    const names = staleCookies(document.cookie, c)
    for (const n of names) for (const d of cookieDomains(location.hostname)) {
      document.cookie = `${n}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`
    }
  } catch {}
}

/** บันทึกการเลือก · แจ้ง GTM · ล้างของหมวดที่ปิด · แจ้งส่วนที่รอ (ตัวเล่น Facebook ป๊อปอัป) */
export function setConsent(choice) {
  const c = makeConsent(choice)
  try { localStorage.setItem(KEY, JSON.stringify(c)) } catch {}
  const now = parseConsent(JSON.stringify(c))
  window.dataLayer = window.dataLayer || []
  /* gtag ต้องส่งเป็น arguments object ไม่ใช่ array ธรรมดา GTM ถึงจะอ่านคำสั่ง consent */
  ;(function () { window.dataLayer.push(arguments) })('consent', 'update', gtagConsent(now))
  withdraw(now)
  window.dataLayer.push({ event: 'td_consent', td_analytics: now.analytics, td_marketing: now.marketing, td_media: now.media })
  for (const fn of listeners) fn(now)
  return now
}

export const onConsent = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
