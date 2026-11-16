/* ข้อมูลเฉพาะบทความ (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e)
   คืนข้อมูลของหน้า หรือไม่คืน (undefined) = ใช้ข้อมูลกลาง base ต่อ */
/* ข้อมูลของแต่ละหน้า (แยกจาก vite.config.js · 16 พ.ย. 2026 B1e) · pageContext(pagePath) คืนข้อมูลที่เทมเพลตของหน้านั้นใช้
   ส่วนที่ทุกหน้าใช้ร่วม (base) อยู่ที่นี่ · ส่วนเฉพาะประเภทหน้าอยู่ใน src/build/pages/<ประเภท>.js */
import { json } from '../shared.js'

export function postsPage({ data, base, at, page, kind, id, rel, sizeCharts, pagePath }) {
          /* บทความใหม่ตาม v22 · หัวข้อ/ร่างจาก posts.json ต่อด้วยบทความเดิมที่เรื่องตรงกัน · ลิงก์บทความเกี่ยวข้องชี้กันเองใน 4 เรื่องนี้ */
          const all = json('posts.json')
          const p = all[id]
          const src = data.articles.items.find((x) => x.id === p.base)
          const item = { ...src, title: p.h1, lead: p.lead || src.lead, sections: [...p.sections.filter((x) => x.body), ...src.sections].map((x) => ({ ...x, t: x.t || x.title })) }
          const related = Object.entries(all).filter(([k]) => k[0] !== '_' && k !== id).map(([k, x]) => {
            const b = data.articles.items.find((a) => a.id === x.base)
            return { ...b, title: x.h1, excerpt: x.lead, to: `posts.${k}` }
          })
          /* ส่วนท้ายตาม v22: ลิงก์ต่อ · หัวข้อบทความเกี่ยวข้อง · หัวข้อปิดท้าย */
          return { ...base, item, related, more: p.more, relatedH: p.relatedH, cta: p.cta }
}
