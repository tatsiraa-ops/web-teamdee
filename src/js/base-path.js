/* WordPress ในโฟลเดอร์ย่อย (16 พ.ย. 2026 · staging อยู่ team-dee.com/enterprise/ · tests/base-path.test.js)
   ธีมใส่ <meta name="td-base" content="/enterprise"> เฉพาะตอนอยู่ในโฟลเดอร์ย่อย · เว็บที่รากไม่มี meta = ไม่เปลี่ยนอะไร
   ลิงก์ใน HTML ธีมเติมให้แล้ว (functions.php td_portable_links) · ไฟล์นี้สำหรับลิงก์ที่ JS สร้างเอง */

/** path โฟลเดอร์ย่อยของเว็บ เช่น "/enterprise" · ที่ราก = "" */
export const basePath = (doc = globalThis.document) => String(doc?.querySelector?.('meta[name="td-base"]')?.content || '').replace(/\/+$/, '')

/** เติม path โฟลเดอร์ย่อยหน้าลิงก์ภายในที่เริ่มด้วย / · ลิงก์นอก (https: //cdn) และลิงก์ที่มี path แล้ว ไม่แตะ */
export const withBase = (p, base = basePath()) =>
  base && typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && p !== base && !p.startsWith(`${base}/`) ? `${base}${p}` : p

/** ตัด path โฟลเดอร์ย่อยออก (ก่อนเทียบกับ routes.json) */
export const stripBase = (p, base = basePath()) =>
  base && typeof p === 'string' && (p === base || p.startsWith(`${base}/`)) ? p.slice(base.length) || '/' : p
