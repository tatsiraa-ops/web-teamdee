/* ส่งฟอร์มติดต่อเข้าระบบจริงบน WordPress + ลิงก์ LINE ที่แนบรหัสแบบ · มีเทส tests/contact-send.test.js
   - cfg มาจาก window.TD_FORM ที่ธีมพิมพ์ไว้ (functions.php) · ยังไม่ตั้งอีเมลรับฟอร์ม = enabled false → หน้าใช้ทางสำรอง (ส่งต่อทาง LINE)
   - ไม่มีช่องแนบไฟล์แล้ว (อาร์ตเคาะ 24 ต.ค. ข้อ 6) ไฟล์โลโก้/แบบส่งทาง LINE หลังส่งฟอร์ม (หน้า /thank-you/)
   - ผลการส่ง 3 ทาง: สำเร็จ → /thank-you/ · off → ส่งต่อทาง LINE · ล้ม → กล่อง "ยังส่งไม่ถึงทีมดี" (audit C2) */

const OA = '@teamdee'

/* เพดานข้อความ LINE (นับหลัง encode) · ข้อความอยู่ใน URL · เกิน ~2,000 ตัวเริ่มโดนตัด/เปิดไม่ขึ้นในเบราว์เซอร์ในแอป · ไทย 1 ตัว = 9 ตัวหลัง encode */
export const LINE_CAP = 1500
const enc = (t) => encodeURIComponent(t).length
/* ตัดทีละอักขระเต็ม (ไม่ผ่ากลางอีโมจิ · encodeURIComponent โยน error) · 2 พ.ย.: คำค้นยาวเคยได้ URL 45,260 ตัว */
const fitLine = (text) => {
  if (enc(text) <= LINE_CAP) return text
  const c = [...text]
  let lo = 0
  let hi = c.length
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1
    if (enc(`${c.slice(0, m).join('')}…`) <= LINE_CAP) lo = m
    else hi = m - 1
  }
  return `${c.slice(0, lo).join('').trimEnd()}…`
}

/** เปิดแชท LINE พร้อมข้อความตั้งต้น */
export const lineMessageUrl = (text) => `https://line.me/R/oaMessage/${OA}/?${encodeURIComponent(fitLine(text))}`

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
const B2B = new Set(['corp', 'gov', 'shop', 'edu', 'faculty', 'class'])
const B2B_HELP = 'แนะนำให้ใส่ ทีมดีส่งใบเสนอราคาและเอกสารจัดซื้อเป็นไฟล์ทางอีเมล ให้ส่งต่อฝ่ายจัดซื้อได้เลย'
export function b2bPrefill(use) {
  if (!B2B.has(use)) return null
  return { docs: ['ใบเสนอราคา'], emailHelp: B2B_HELP }
}

/** บริบทจากปุ่มที่ส่งมา (audit 26 ต.ค. M1) · คืน null ถ้าไม่ต้องเตรียมอะไร
    - from=company-docs (ขอข้อมูลบริษัทประกอบการจัดซื้อ) → ติ๊กใบเสนอราคา หนังสือรับรอง ภ.พ.20 + กางกล่ององค์กร
    - from=quote / มาจากหน้าคำนวณ / ?p=polo (หน้าโปโลปักมีปุ่มขอใบเสนอราคา) / กลุ่มองค์กร → ติ๊กใบเสนอราคา + กางกล่อง
    - from=reorder → โหมดสั่งซ้ำ (หัวฟอร์ม + ช่องเลขออเดอร์เดิม) */
export function prefillFor({ use = '', from = '', product = '' } = {}) {
  const f = String(from || '')
  if (f === 'reorder') return { reorder: true, openOrg: false, docs: [] }
  if (f === 'company-docs') return { reorder: false, openOrg: true, docs: ['ใบเสนอราคา', 'หนังสือรับรองบริษัท', 'ภ.พ.20'], emailHelp: B2B_HELP }
  const b2b = b2bPrefill(use)
  if (b2b || f === 'quote' || f.startsWith('/calculations/') || product === 'polo') return { reorder: false, openOrg: true, docs: ['ใบเสนอราคา'], emailHelp: B2B_HELP }
  return null
}

/** สินค้าและงานจากหน้าที่กดมา (ตรวจมือถือ 30 ต.ค.) · แกลเลอรี/หน้าแบบเสื้อ = เสื้อพิมพ์ลาย · หน้าที่ไม่รู้จัก = ว่าง */
export function contextFromPath(path, routes) {
  const p = String(path || '')
  const hit = (map) => Object.entries(map || {}).find(([, u]) => u === p)?.[0] || ''
  const product = hit(routes.products)
  const use = hit(routes.uses) || hit(routes.galleries)
  const designs = p === routes.designs || p.startsWith('/design-preview/') || !!hit(routes.galleries)
  return { product: product || (designs ? 'print' : ''), use }
}

/** อีเมลที่พิมพ์มาดูถูกรูปแบบไหม · ใช้เตือนเฉยๆ ไม่บล็อกการส่ง (ว่าง = ไม่เตือน) */
export const emailLooksOk = (v) => !String(v || '').trim() || /^[^\s@,]+@[^\s@,]+\.[^\s@,]{2,}$/.test(String(v).trim())

/** จำนวนจากหน้าคำนวณ (?qty=) · จำนวนเต็ม 1–99,999 */
export function qtyFromQuery(search) {
  const v = new URLSearchParams(search || '').get('qty') || ''
  return /^[1-9]\d{0,4}$/.test(v) ? v : ''
}

/** ส่งข้อมูล · คืน { ok, redirect } หรือ { ok: false, reason: 'off' | 'error' | 'network' } */
export async function sendContact(fields, cfg, fetchImpl = globalThis.fetch, timeoutMs = 20000) {
  if (!cfg || !cfg.enabled || !cfg.endpoint) return { ok: false, reason: 'off' }
  const body = new URLSearchParams({ action: 'td_contact', ...fields })
  /* เน็ตค้างเกิน 20 วิ = ยกเลิก แล้วให้ลองใหม่/ทัก LINE ได้ (30 ต.ค. · เดิมปุ่มค้าง "กำลังส่ง" ตลอด) */
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetchImpl(cfg.endpoint, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, credentials: 'same-origin', signal: ctl.signal })
    const data = await res.json().catch(() => ({}))
    /* ธีมบอกเหตุผลมาด้วย (limit 429 · invalid 400 · mail 500) ส่งต่อเป็น code ให้กล่องบอกสาเหตุตรงๆ */
    if (!res.ok || !data.ok) return typeof data.reason === 'string' && data.reason ? { ok: false, reason: 'error', code: data.reason } : { ok: false, reason: 'error' }
    return { ok: true, redirect: cfg.thanks || null }
  } catch {
    return { ok: false, reason: 'network' }
  } finally {
    clearTimeout(timer)
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
  /* ธีมตรวจแล้วว่าไม่ได้ส่งจากหน้าเว็บนี้ (เปิดค้างจากที่อื่น/แคช) · 30 ต.ค. */
  if (code === 'origin') return 'ส่งจากหน้านี้ไม่ได้ ส่งทาง LINE / โทรได้เลย หรือรีเฟรชหน้าแล้วกรอกใหม่'
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

/* สรุปจากหน้าคำนวณ (estimate.js fromText) · ตัวอักษร เลข และเครื่องหมายที่สรุปใช้จริง · ไม่มี : < > จึงใส่ลิงก์/แท็กไม่ได้ (2 พ.ย.: เดิมโดนตัดทิ้ง ทีมขายไม่เห็นยอด) */
const CALC_SUMMARY = /^\/calculations\/ · [\p{L}\p{M}\p{Nd} ·,./()+%-]+$/u
const CALC_MAX = 300

/** ?from= ที่ใส่ในอีเมลทีมและ GA: path ของเว็บ คำสั้นที่หน้าเว็บใช้ (quote reorder collar-options …) หรือสรุปจากหน้าคำนวณ · อย่างอื่นตัดทิ้ง (30 ต.ค.) */
export const cleanFrom = (v) => {
  const t = String(v || '').trim()
  if (t.length <= CALC_MAX && CALC_SUMMARY.test(t)) return t
  if (t.length > 100) return ''
  return /^\/(?!\/)[a-z0-9/_-]*$/i.test(t) || /^[a-z][a-z0-9-]{1,30}$/.test(t) ? t : ''
}

/** เลขไทย ๐–๙ → 0–9 · ใช้ทั้งตอนเช็กและก่อนส่ง (ตรวจละเอียด 30 ต.ค.: server นับเฉพาะเลขอารบิก เบอร์เลขไทยเลยโดนตีกลับ) */
export const toAsciiDigits = (v) => String(v ?? '').replace(/[\u0E50-\u0E59]/g, (c) => String(c.charCodeAt(0) - 0x0E50))

/** เบอร์ไทย 9–10 หลักขึ้นต้น 0 · รับ +66 / 66 / +66 (0) นำหน้า · ขีด จุด เว้นวรรค วงเล็บได้ (ธีมรับตั้งแต่ 9 หลัก)
    เบอร์องค์กรมักมีเบอร์ต่อ ("ต่อ 12" "#12" "ext 5" "x12") ตัดก่อนเช็ก แต่ส่งค่าเดิมให้ทีมขาย (audit 26 ต.ค. M2)
    ใส่สองเบอร์คั่นด้วย / หรือ , เช็กเบอร์แรก (30 ต.ค. · ให้ตรงกับที่ server รับ) */
export function telOk(v) {
  let d = toAsciiDigits(v).split(/[/,]/)[0].replace(/\s*(?:ต่อ|ext\.?|x|#)\s*\d{1,6}\s*$/i, '').replace(/[\s\-().]/g, '')
  if (/[^0-9+]/.test(d)) return false
  if (/^\+?660/.test(d)) d = d.replace(/^\+?66/, '')
  else if (/^\+?66/.test(d)) d = '0' + d.replace(/^\+?66/, '')
  return /^0\d{8,9}$/.test(d)
}

/* ธงที่หน้าติดต่อฝากไว้ให้หน้าขอบคุณ (sessionStorage) · หน้าขอบคุณแสดงเบอร์ และยิง td_form_submit เอง
   ไม่ยิงก่อนเปลี่ยนหน้า เพราะ tag ของ GTM อาจยิงไม่ทัน (audit 2.7) */
const FLAG_MAX_AGE = 30 * 60 * 1000

export function thanksFlag({ tel = '', from = '' } = {}, now = Date.now()) {
  return JSON.stringify({ tel: toAsciiDigits(tel).replace(/[^0-9+\- ]/g, '').trim().slice(0, 20), from: String(from).slice(0, 200), t: now, counted: false })
}

export function readThanksFlag(raw, now = Date.now(), maxAge = FLAG_MAX_AGE) {
  if (!raw) return null
  let d
  try { d = JSON.parse(raw) } catch { return null }
  if (!d || typeof d.tel !== 'string' || !Number.isFinite(d.t) || now - d.t > maxAge || now < d.t) return null
  return { tel: d.tel, from: typeof d.from === 'string' ? d.from : '', t: d.t, counted: d.counted === true }
}
