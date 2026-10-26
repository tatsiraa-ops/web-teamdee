/* ส่งฟอร์มติดต่อเข้าระบบจริงบน WordPress + ลิงก์ LINE ที่แนบรหัสแบบ · มีเทส tests/contact-send.test.js
   - cfg มาจาก window.TD_FORM ที่ธีมพิมพ์ไว้ (functions.php) · ยังไม่ตั้งอีเมลรับฟอร์ม = enabled false → หน้าใช้ทางสำรอง (ส่งต่อทาง LINE)
   - ไม่มีช่องแนบไฟล์แล้ว (อาร์ตเคาะ 24 ต.ค. ข้อ 6) ไฟล์โลโก้/แบบส่งทาง LINE หลังส่งฟอร์ม (หน้า /thank-you/)
   - ผลการส่ง 3 ทาง: สำเร็จ → /thank-you/ · off → ส่งต่อทาง LINE · ล้ม → กล่อง "ยังส่งไม่ถึงทีมดี" (audit C2) */

const OA = '@teamdee'

/** เปิดแชท LINE พร้อมข้อความตั้งต้น */
export const lineMessageUrl = (text) => `https://line.me/R/oaMessage/${OA}/?${encodeURIComponent(text)}`

/** ลิงก์ LINE · มีรหัสแบบ = เปิดแชทพร้อมข้อความตั้งต้น (line.me/R/oaMessage) · ไม่มี = ลิงก์ปกติ */
export function lineUrlFor(code, base) {
  if (!code) return base
  return lineMessageUrl(`สนใจแบบเสื้อรหัส ${code}`)
}

/** รหัสแบบจาก ?code= · รับแค่ตัวอักษร ตัวเลข และขีด เพื่อไม่เอาข้อความแปลกปลอมจาก URL มาใส่ฟอร์ม */
export function codeFromQuery(search) {
  const v = new URLSearchParams(search || '').get('code') || ''
  return /^[A-Za-z0-9-]{3,20}$/.test(v) ? v.toUpperCase() : ''
}

/** วันที่ต้องใช้เสื้อจาก ?date= (มาจากหน้ากลุ่มลูกค้า) · รับแค่ YYYY-MM-DD ที่เป็นวันจริง */
export function dateFromQuery(search) {
  const v = new URLSearchParams(search || '').get('date') || ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return ''
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : ''
}

/** มาจากหน้ากลุ่มที่ต้องมีเอกสารจัดซื้อ (?u=) · ติ๊กใบเสนอราคาให้ และบอกว่าทำไมควรใส่อีเมล (ไม่บังคับ คนที่มีแค่เบอร์ยังส่งได้) */
const B2B = new Set(['corp', 'gov', 'shop', 'edu', 'faculty'])
export function b2bPrefill(use) {
  if (!B2B.has(use)) return null
  return { docs: ['ใบเสนอราคา'], emailHelp: 'แนะนำให้ใส่ ทีมดีส่งใบเสนอราคาและเอกสารจัดซื้อเป็นไฟล์ทางอีเมล ให้ส่งต่อฝ่ายจัดซื้อได้เลย' }
}

/** ส่งข้อมูล · คืน { ok, redirect } หรือ { ok: false, reason: 'off' | 'error' | 'network' } */
export async function sendContact(fields, cfg, fetchImpl = globalThis.fetch) {
  if (!cfg || !cfg.enabled || !cfg.endpoint) return { ok: false, reason: 'off' }
  const body = new URLSearchParams({ action: 'td_contact', ...fields })
  try {
    const res = await fetchImpl(cfg.endpoint, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, credentials: 'same-origin' })
    const data = await res.json().catch(() => ({}))
    /* ธีมบอกเหตุผลมาด้วย (limit 429 · invalid 400 · mail 500) ส่งต่อเป็น code ให้กล่องบอกสาเหตุตรงๆ */
    if (!res.ok || !data.ok) return typeof data.reason === 'string' && data.reason ? { ok: false, reason: 'error', code: data.reason } : { ok: false, reason: 'error' }
    return { ok: true, redirect: cfg.thanks || null }
  } catch {
    return { ok: false, reason: 'network' }
  }
}

const THANKS = '/thank-you/'

/** ผลการส่ง → หน้าจอที่ต้องแสดง · สำเร็จเท่านั้นที่ไปหน้าขอบคุณ ค่าที่ไม่รู้จักถือว่าล้ม (ห้ามตกไปเป็นสำเร็จ) */
export function outcomeOf(sent) {
  if (sent && sent.ok === true) return { view: 'thanks', to: sent.redirect || THANKS }
  if (sent && sent.reason === 'off') return { view: 'off' }
  return { view: 'failed' }
}

/** ข้อความในกล่อง "ยังส่งไม่ถึงทีมดี" · บอกสาเหตุเท่าที่รู้ ไม่บอกว่าส่งแล้ว */
export function failText(sent) {
  const code = sent?.code
  if (code === 'limit') return 'ส่งถี่เกินไป ระบบพักรับชั่วคราว ข้อมูลที่กรอกยังอยู่ครบ รอสักครู่แล้วลองใหม่ หรือส่งทาง LINE / โทรได้เลย'
  if (code === 'invalid') return 'เบอร์โทรหรือชื่อยังไม่ครบ ตรวจอีกครั้งแล้วลองส่งใหม่ หรือส่งทาง LINE / โทรได้เลย'
  if (sent?.reason === 'network') return 'อินเทอร์เน็ตหลุดระหว่างส่ง ข้อมูลที่กรอกยังอยู่ครบ ลองส่งอีกครั้ง หรือส่งทาง LINE / โทรได้เลย'
  return 'ระบบรับข้อมูลขัดข้อง ข้อมูลที่กรอกยังอยู่ครบ ลองส่งอีกครั้ง หรือส่งทาง LINE / โทรได้เลย'
}

/** ข้อความตั้งต้นในแชท LINE (oaMessage) · ข้อความนี้อยู่ใน URL → ใส่แค่เรื่องงาน ห้ามใส่ชื่อ เบอร์ อีเมล องค์กร หรือรายละเอียดที่พิมพ์เอง */
export function lineSummary(f = {}) {
  const rows = [
    ['สินค้า', f.product],
    ['จำนวน', f.qty && `${f.qty} ตัว`],
    ['ใช้กับงาน', f.use],
    ['วันที่ต้องการใช้', f.date],
    ['แบบที่สนใจ', f.code],
    ['เอกสาร', f.docs],
  ].filter(([, v]) => v && String(v).trim())
  return ['ขอปรึกษาทำเสื้อทีม (กรอกฟอร์มบนเว็บ)', ...rows.map(([k, v]) => `${k}: ${String(v).trim()}`)].join('\n')
}

/** เบอร์ไทย 9–10 หลักขึ้นต้น 0 · รับ +66 / 66 นำหน้า · ขีดและเว้นวรรคได้ (ธีมรับตั้งแต่ 9 หลัก) */
export function telOk(v) {
  let d = String(v || '').replace(/[\s-]/g, '')
  if (/[^0-9+]/.test(d)) return false
  if (/^\+?66/.test(d)) d = '0' + d.replace(/^\+?66/, '')
  return /^0\d{8,9}$/.test(d)
}

/* ธงที่หน้าติดต่อฝากไว้ให้หน้าขอบคุณ (sessionStorage) · หน้าขอบคุณแสดงเบอร์ และยิง td_form_submit เอง
   ไม่ยิงก่อนเปลี่ยนหน้า เพราะ tag ของ GTM อาจยิงไม่ทัน (audit 2.7) */
const FLAG_MAX_AGE = 30 * 60 * 1000

export function thanksFlag({ tel = '', from = '' } = {}, now = Date.now()) {
  return JSON.stringify({ tel: String(tel).replace(/[^0-9+\- ]/g, '').trim().slice(0, 20), from: String(from).slice(0, 200), t: now, counted: false })
}

export function readThanksFlag(raw, now = Date.now(), maxAge = FLAG_MAX_AGE) {
  if (!raw) return null
  let d
  try { d = JSON.parse(raw) } catch { return null }
  if (!d || typeof d.tel !== 'string' || !Number.isFinite(d.t) || now - d.t > maxAge || now < d.t) return null
  return { tel: d.tel, from: typeof d.from === 'string' ? d.from : '', t: d.t, counted: d.counted === true }
}
