/* ข้อมูลเฉพาะหน้าเคสลูกค้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e)
   คืนข้อมูลของหน้า หรือไม่คืน (undefined) = ใช้ข้อมูลกลาง base ต่อ */
/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */
import { videoView } from '../../../src/js/video-view.js'
import { url } from '../shared.js'

export function casesPage({ data, base, at, page, kind, id, rel, sizeCharts, pagePath }) {
          /* หน้าเคสลูกค้าจากคลิป (แนวทาง ก · 26 ต.ค.) · คลิปคือเนื้อหาหลัก · ข้อมูลจาก videos.json อย่างเดียว ไม่แต่งเพิ่ม
             ยังไม่พร้อม = noindex + ไม่ export (seo-check isExported) */
          const v = data.videos.find((x) => x.id === id)
          const cs = videoView(v)
          const use = data.uses.find((u) => u.id === v.use)
          const product = data.allProducts.find((p) => p.id === v.product)
          const qtyPending = /\[[^\]]*\]/.test(v.qty || '')
          return {
            ...base,
            cs: { ...cs, qtyPending, useName: use?.name, useHref: use && url('uses', use.id), productName: product?.menuName || product?.name, productHref: product && url('products', product.id) },
          }
}
