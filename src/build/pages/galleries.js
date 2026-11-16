/* ข้อมูลเฉพาะแกลเลอรีแบบเสื้อตามกลุ่ม (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e)
   คืนข้อมูลของหน้า หรือไม่คืน (undefined) = ใช้ข้อมูลกลาง base ต่อ */
/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */
import { gallerySelection } from '../../../src/js/gallery-selection.js'
import { galleryFor } from '../../../src/js/media-library.js'
import { json, designsFor, mediaLib } from '../shared.js'

export function galleriesPage({ data, base, at, page, kind, id, rel, sizeCharts, pagePath }) {
          const dp = json('design-pages.json').groups[id]
          /* คลังรูปกลาง 30 ต.ค. (แกลเลอรีเดิมบาง 1–4 รูป): แบบมีรหัส TD ก่อน → ภาพแบบของกลุ่มนี้ (เสื้อ 3D · แกลเลอรีเว็บเดิม)
             → งานจริงของลูกค้ากลุ่มนี้ (customers.json / works.json ไม่เกิน 12) · ทุกภาพต้องมีแท็กกลุ่มนี้ในคลัง ไม่ยืมกลุ่มอื่น */
          const item = data.uses.find((x) => x.id === id)
          const sel = gallerySelection(data.designs, id, designsFor(data.designs, id))
          return { ...base, item, dp, gallery: { ...galleryFor(mediaLib(), { group: id, shortName: item.shortName, coded: sel.items }), inspiration: sel.inspiration } }
}
