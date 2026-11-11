/* หน้าแบบเสื้อ แบบ c (อาร์ต 26 ต.ค.): เลือกเก็บหลายแบบ แล้วส่งรหัสทั้งหมดทาง LINE ครั้งเดียว · มีเทส tests/design-picks.test.js
   จำที่เลือกไว้ในเครื่องนี้ (localStorage) · อ่านไม่ได้ (โหมดส่วนตัว) = เริ่มว่าง
   30 ต.ค. (audit มือถือ ข้อ 11): ใช้ทุกแกลเลอรีด้วย · ภาพไม่มีรหัสใช้ป้าย "รูปที่ N จาก /หน้า/ (ไฟล์)" · จำข้ามหน้า
   เทสเพิ่ม tests/design-picks-gallery.test.js */
export const PICK_KEY = 'td-design-picks'
export const MAX_PICKS = 10

import { LINE_CAP } from './contact-send.js'

export const isCode = (id) => /^TD-\d{1,6}$/.test(id)
/** ป้ายภาพที่ไม่มีรหัส (ภาพอ้างอิง · งานจริงลูกค้า) · เลขรูปตามลำดับในหน้า + หน้า + ชื่อไฟล์ ให้ฝ่ายขายหาเจอแม้ลำดับเปลี่ยน */
const LABEL = /^รูปที่ \d{1,4} จาก \/[^\s]{0,80} ?(\([^()\n]{1,120}\))?$/
export const isLabel = (id) => typeof id === 'string' && id.length <= 220 && LABEL.test(id)
export const imageLabel = ({ n, page, file }) => `รูปที่ ${n} จาก ${page}${file ? ` (${file})` : ''}`
/** ชื่อไฟล์จาก src (ตัด query · ถอด %20) */
export const fileOf = (src) => {
  const last = String(src || '').split(/[?#]/)[0].split('/').pop() || ''
  try { return decodeURIComponent(last) } catch { return last }
}
/** ข้อความปุ่มเลือกบนการ์ด (audit ข้อ 11: กดแล้วต้องเห็นว่า "เลือกแล้ว") */
export const pickText = (on) => (on ? 'เลือกแล้ว' : 'เลือก')

/** ป้ายสั้น ตัดชื่อไฟล์ท้ายป้ายออก ("รูปที่ N จาก /หน้า/") · รหัส TD คงเดิม */
export const shortLabel = (id) => (isCode(id) ? id : id.replace(/ \([^()]*\)$/, ''))

/** ข้อความตั้งต้นในแชท LINE · ไม่มีข้อมูลส่วนตัว · มีแต่รหัส = บรรทัดเดียวแบบเดิม · ปนภาพไม่มีรหัส = รายการทีละบรรทัด
 *  ต่อสตริงแทน array สั้นที่มีคำไทย (เทส seo-pages ตรวจ [ไทย] ใน JS ที่ build ว่าเป็นข้อความรอยืนยัน)
 *  ยาวเกินเพดาน LINE ใช้ป้ายย่อ ให้เห็นครบทุกรายการ ไม่โดนตัดท้าย (2 พ.ย.: 10 ภาพเคยได้ 1,809 ตัว) */
export const picksMessage = (ids) => {
  const full = picksText(ids)
  return encodeURIComponent(full).length <= LINE_CAP ? full : picksText(ids.map(tinyLabel))
}
/* "รูปที่ 3 จาก /หน้า/ (ไฟล์)" → "รูป 3 /หน้า/" */
const tinyLabel = (id) => shortLabel(id).replace(/^รูปที่ (\d+) จาก /, 'รูป $1 ')

const picksText = (ids) => {
  const head = !ids.every(isCode) ? `สนใจแบบเสื้อ ${ids.length} แบบ`
    : ids.length > 1 ? `สนใจแบบเสื้อ ${ids.length} แบบ รหัส ${ids.join(', ')}` : `สนใจแบบเสื้อรหัส ${ids[0]}`
  const list = ids.every(isCode) ? '' : ids.map((id, i) => `\n${i + 1}. ${isCode(id) ? `รหัส ${id}` : id}`).join('')
  return `${head}${list}\nจำนวนประมาณ:  ตัว\nอยากได้รับวันที่: `
}

/** เลือกครบแล้วกดเพิ่ม · ใช้ทั้งถาดและกล่องรูปใหญ่ */
export const fullText = (n) => `เลือกได้สูงสุด ${n} แบบ ส่งชุดนี้ก่อน หรือเอาบางแบบออก`

export const togglePick = (list, code) => {
  if (list.includes(code)) return list.filter((c) => c !== code)
  return list.length >= MAX_PICKS ? list : [...list, code]
}

/** ที่จำไว้ · ไม่ซ้ำ · รหัส TD ต้องมีใน catalog (ถ้าส่งมา = หน้าที่มีแบบครบทุกรหัส เช่น /designs/)
 *  catalog = null (แกลเลอรีรายกลุ่ม มีแค่บางรหัส) เก็บรหัสที่รูปร่างถูกทั้งหมด · ป้ายภาพจากแกลเลอรีเก็บไว้เสมอ (จำข้ามหน้า) */
export const readPicks = (getItem, catalog) => {
  try {
    const v = JSON.parse(getItem(PICK_KEY) || '[]')
    if (!Array.isArray(v)) return []
    const ok = catalog ? new Set(catalog) : null
    return [...new Set(v)]
      .filter((c) => typeof c === 'string' && (isCode(c) ? !ok || ok.has(c) : isLabel(c)))
      .slice(0, MAX_PICKS)
  } catch {
    return []
  }
}
