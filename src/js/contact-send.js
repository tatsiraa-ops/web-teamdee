/* ส่งฟอร์มติดต่อเข้าระบบจริงบน WordPress + ลิงก์ LINE ที่แนบรหัสแบบ · มีเทส tests/contact-send.test.js
   - cfg มาจาก window.TD_FORM ที่ธีมพิมพ์ไว้ (functions.php) · ยังไม่ตั้งอีเมลรับฟอร์ม = enabled false → หน้าใช้ทางสำรอง (คัดลอกข้อความ + LINE)
   - ไม่ส่งไฟล์แนบ ส่งแค่ชื่อไฟล์ ให้ลูกค้าส่งไฟล์จริงตามใน LINE */

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
    if (!res.ok || !data.ok) return { ok: false, reason: 'error' }
    return { ok: true, redirect: cfg.thanks || null }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
