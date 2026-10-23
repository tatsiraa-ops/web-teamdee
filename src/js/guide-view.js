/* คู่มือสั่งทำตามหัวข้อ v22 (src/data/guide-pages.json จาก scripts/v22/guide-pages.mjs) · มีเทส tests/guide-view.test.js
   - ต้นแบบ: หัวข้อ v22 ครบ ช่อง [ ] ยังเห็นเพื่อรู้ว่ารออะไร
   - เว็บจริง: ตัดแถว การ์ด คำถามที่ยังรอ (prunePending) · หัวข้อที่ไม่เหลือเนื้อหาซ่อน แล้วเรียงเลขใหม่
   - เล่มที่ v22 ไม่มี (คู่มือทรงคอ) ใช้ guides.json ตามเดิม */
import { prunePending } from './prune.js'

/* ส่วนที่ดึงข้อมูลกลางมาแสดง (ตารางไซซ์ รายชื่อผ้า ฯลฯ) ถือว่ามีเนื้อหาเสมอ */
const SHARED = new Set(['sizes', 'fabrics', 'props', 'download', 'collars'])
const filled = (s) => SHARED.has(s.kind) || !!(s.body || s.list?.length || s.items?.length || s.rows?.length || s.cards?.length || s.links?.length || s.parts?.some(filled))

export function guideView(item, page, { forWp }) {
  const base = page ? { ...item, h1: page.h1 || item.h1, lead: page.lead, sections: page.sections } : item
  if (!forWp) return base
  const v = prunePending(base)
  const sections = v.sections.map((s) => ({ ...s, parts: (s.parts || []).filter(filled) })).filter(filled).map((s, i) => ({ ...s, no: String(i + 1) }))
  return { ...v, sections }
}
