/* แปลง path ไฟล์ในหน้าที่ build แล้วให้ชี้เข้าโฟลเดอร์ธีม WordPress · ใช้ใน export-wp.mjs · มีเทส tests/wp-rewrite.test.js
   ลิงก์หน้าอย่าง /sublimation/ หรือ canonical ไม่แตะ · รันซ้ำได้ผลเท่าเดิม */
const FILE_DIRS = 'img|assets|logo|files'
const ICONS = 'favicon\\.svg|apple-touch-icon\\.png'
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function makeRewrite({ themeUrl, baseUrl }) {
  const base = esc(baseUrl)
  return (text) =>
    text
      /* path ที่ขึ้นต้นด้วย / (รูป assets โลโก้ ไฟล์ดาวน์โหลด) */
      .replace(new RegExp(`(["'\`(\\s,=])\\/(${FILE_DIRS})\\/`, 'g'), `$1${themeUrl}/$2/`)
      .replace(new RegExp(`(["'(\\s])\\/(${ICONS})`, 'g'), `$1${themeUrl}/$2`)
      /* URL เต็มของไฟล์ (og:image · JSON-LD) ไม่งั้นรูปแชร์และโลโก้เปิดไม่ขึ้นบน WordPress */
      .replace(new RegExp(`(${base})/(${FILE_DIRS})/`, 'g'), `$1${themeUrl}/$2/`)
      .replace(new RegExp(`(${base})/(${ICONS})`, 'g'), `$1${themeUrl}/$2`)
}
