/* ข้อมูลเฉพาะหน้าบทความรวม (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e)
   คืนข้อมูลของหน้า หรือไม่คืน (undefined) = ใช้ข้อมูลกลาง base ต่อ */
/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */

export function articlesPage({ data, base, at, page, kind, id, rel, sizeCharts, pagePath }) {
          const all = data.articles.items
          const item = all.find((x) => x.id === id)
          /* บทความเกี่ยวข้องเอาหมวดเดียวกันก่อน ถ้าไม่พอค่อยเติมจากหมวดอื่น */
          const same = all.filter((x) => x.id !== id && x.cat === item?.cat)
          const other = all.filter((x) => x.id !== id && x.cat !== item?.cat)
          return { ...base, item, related: [...same, ...other].slice(0, 3) }
}
