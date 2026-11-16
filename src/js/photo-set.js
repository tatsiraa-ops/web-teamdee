/* ชุดรูปงานจริงในกล่องรีวิวขาว (16 พ.ย. 2026 · อาร์ต "เอาแบบภาพสอง") · ฟังก์ชันล้วน ไม่แตะ DOM (tests/photo-dialog.test.js) */

/** alt "กลุ่มนักเรียนถ่ายรวมในห้องประชุม · เสื้อมหาลัย โรงเรียน" → หัวข้อ + บรรทัดรอง */
export function splitCaption(alt) {
  const parts = String(alt || '').trim().split(' · ')
  const title = (parts.shift() || '').trim()
  return { title: title || 'ภาพงานจริงจากลูกค้าทีมดี', small: parts.join(' · ').trim() }
}

/** แบบเสื้อ = มีรหัส TD- หรือ data-design="1" (ใช้กล่องแบบเสื้อเดิม) · นอกนั้นเป็นรูปงานจริง */
export const isDesignItem = (ds = {}) => (!!ds.code && /^TD-/.test(ds.code)) || ds.design === '1'

/** ข้อความเริ่มแชท LINE จากรูปที่ดูอยู่ */
export const photoMessage = (caption, origin, path) => `สนใจเสื้อแบบในภาพ: ${caption}\nจากหน้า ${origin}${path}`
