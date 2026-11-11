/* "ต้องใช้เสื้อวันที่…" → ต้องยืนยันแบบ + โอนมัดจำภายในวันไหน (ตรวจมือถือ 30 ต.ค. 2026 ข้อ 35 · Custom Ink บอกวันส่ง คู่แข่งไทยบอกแค่จำนวนวัน)
   ฟังก์ชันล้วน ไม่แตะ DOM · มีเทส tests/need-by.test.js · ตัวเลขทุกตัวมาจาก src/data/lead-times.json ที่ยืนยันแล้ว
   - วันยืนยันแบบช้าสุด = วันใช้ − วันผลิตมากสุดของสินค้า (เริ่มนับวันถัดจากวันยืนยันแบบ · เปิดทุกวัน ไม่ข้ามวันหยุด)
   - ช่วงผลิตแตะ ต.ค.–ม.ค. → เผื่อเพิ่มตัวบนของ "5–7 วัน" (= 7)
   - ยังไม่รวมวันขนส่ง (ยังไม่มีตัวเลขยืนยัน) · บอกลูกค้าตรงๆ ให้ทีมดียืนยันวันส่งในแชท */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
/* lead-times.json season: "ช่วงตุลาคม–มกราคม" (เทสตรวจข้อความนี้ไว้ ถ้าเปลี่ยนเดือนต้องแก้ตรงนี้ด้วย) */
const SEASON_MONTHS = new Set([10, 11, 12, 1])
const NO_SHIP = 'ยังไม่รวมวันขนส่ง'

const parts = (iso) => ISO.exec(iso || '')

/** YYYY-MM-DD ± n วัน (คิดแบบ UTC ล้วน ไม่โดนเวลาออมแสง/เขตเวลา) */
export function addDays(iso, n) {
  const [, y, m, d] = parts(iso)
  return new Date(Date.UTC(+y, +m - 1, +d + n)).toISOString().slice(0, 10)
}

const diffDays = (a, b) => {
  const t = (iso) => { const [, y, m, d] = parts(iso); return Date.UTC(+y, +m - 1, +d) }
  return Math.round((t(b) - t(a)) / 86400000)
}

/** ตัวเลขมากสุดในข้อความ เช่น "15–20 วัน" → 20 · "เผื่อเพิ่ม 5–7 วัน" → 7 */
export const maxDays = (s) => Math.max(...(String(s).match(/\d+/g) || [0]).map(Number))

/** วันที่ไทยแบบย่อ ปี พ.ศ. เช่น 9 พ.ย. 2569 (ใช้ร่วมกับ use-cta.js hrefWithDate) */
export function thaiDate(iso) {
  const m = parts(iso)
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${+m[1] + 543}` : ''
}

/** ช่วง (from, to] แตะเดือนคิวแน่นไหม */
const inSeason = (from, to) => {
  for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) if (SEASON_MONTHS.has(+d.slice(5, 7))) return true
  return false
}

/**
 * @param {string} need วันที่ต้องใช้เสื้อ YYYY-MM-DD
 * @param {string} today วันนี้ตามเครื่องลูกค้า (lib.js todayLocal)
 * @param {object} lead lead-times.json
 * @param {string} id รหัสสินค้า (polo · print · screen · warmup · baseball · jersey)
 * @returns {null | {status:'ok'|'tight'|'rush'|'late', need, today, approveBy, days, daysText, tech, season, buffer, rushDays}}
 */
export function planNeedBy(need, today, lead, id) {
  const p = lead?.[id]
  if (!p?.days || !parts(need) || !parts(today)) return null
  /* พิมพ์วันย้อนหลังได้แม้ตั้ง min ไว้ (2 พ.ย.) · ไม่คิดแผน ไม่ส่งวันนี้ไป LINE */
  if (need < today) return { status: 'past', need, today }
  const days = maxDays(p.days)
  const base = addDays(need, -days)
  const season = inSeason(base, need)
  const buffer = season ? maxDays(lead.season) : 0
  const approveBy = addDays(base, -buffer)
  const rushDays = maxDays(lead.rush)
  let status
  if (approveBy >= addDays(today, 1)) status = approveBy <= addDays(today, 3) ? 'tight' : 'ok'
  else status = need >= addDays(today, rushDays + 1) ? 'rush' : 'late'
  return { status, need, today, approveBy, days, daysText: p.days, tech: p.tech, season, buffer, rushDays }
}

const TAG = { ok: 'ทันผลิตปกติ', tight: 'ใกล้ถึงวันยืนยันแบบ', rush: 'ต้องเป็นงานด่วน', late: 'อาจไม่ทัน', past: 'วันที่ผ่านไปแล้ว' }

/** ข้อความที่แสดงใต้ช่องวันที่ + ส่วนที่ต่อท้ายข้อความ LINE (note) */
export function needByText(r, lead) {
  if (!r) return null
  if (r.status === 'past') return { status: 'past', tag: TAG.past, need: `ต้องใช้เสื้อวันที่ ${thaiDate(r.need)}`, main: 'วันที่เลือกผ่านไปแล้ว เลือกวันที่ตั้งแต่วันนี้เป็นต้นไป', basis: '', cta: null, note: null }
  const by = thaiDate(r.approveBy)
  const normal = r.status === 'ok' || r.status === 'tight'
  const left = diffDays(r.today, r.approveBy)
  const main = normal
    ? `ยืนยันแบบและโอนมัดจำภายใน ${by}${r.status === 'tight' ? ` (อีก ${left} วัน)` : ''}`
    : r.status === 'rush'
      ? `ไม่ทันเวลาผลิตปกติ (${r.tech} ${r.daysText}) · ${lead.rush}`
      : `เหลือ ${diffDays(r.today, r.need)} วัน งานด่วนเร็วสุด ${r.rushDays} วันหลังยืนยันแบบ · ทักทีมดีเช็กก่อนว่าทันไหม`
  /* ต่อสตริงตรงๆ ไม่ใช้ array ของข้อความไทย (tests/seo-pages.test.js มองว่า [ข้อความไทย] ใน JS เป็นช่องรอยืนยัน) */
  /* 2 พ.ย. รอบ 64 (อาร์ต: ข้อความเยอะไป): เหลือที่มาของตัวเลขบรรทัดเดียว · กติกาการนับวันอยู่ใน "วิธีนับวันผลิต" (nbHow.hbs) */
  const season = r.season ? ` · เผื่อช่วงคิวแน่น ${r.buffer} วันแล้ว` : ''
  const basis = `คิดจาก${r.tech} ${r.daysText}${season} · ${NO_SHIP}`
  return {
    status: r.status,
    tag: TAG[r.status],
    need: `ต้องใช้เสื้อวันที่ ${thaiDate(r.need)}`,
    main,
    basis,
    cta: normal ? null : r.status === 'rush' ? 'ทัก LINE เช็กคิวงานด่วน' : 'ทัก LINE ถามทีมดีว่าทันไหม',
    note: normal ? `ยืนยันแบบภายใน ${by}` : r.status === 'rush' ? 'ไม่ทันผลิตปกติ ขอเช็กคิวงานด่วน' : 'เหลือเวลาน้อย ขอเช็กว่าทันไหม',
  }
}
