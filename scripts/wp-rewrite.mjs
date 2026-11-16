/* แปลง path ไฟล์ในหน้าที่ build แล้วให้ชี้เข้าโฟลเดอร์ธีม WordPress · ใช้ใน export-wp.mjs · มีเทส tests/wp-rewrite.test.js
   ลิงก์หน้าอย่าง /sublimation/ หรือ canonical ไม่แตะ · รันซ้ำได้ผลเท่าเดิม
   16 พ.ย. 2026 C1 ระยะ 1: รูป (/img/) ชี้ imgUrl (โฟลเดอร์ wp-content/uploads/teamdee/img นอกธีม) · ไม่ส่ง imgUrl = รูปอยู่ในธีมเหมือนเดิม */
const THEME_DIRS = 'assets|logo|files'
const ICONS = 'favicon\\.svg|apple-touch-icon\\.png'
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function makeRewrite({ themeUrl, imgUrl = `${themeUrl}/img`, baseUrl }) {
  const base = esc(baseUrl)
  return (text) =>
    text
      /* path ที่ขึ้นต้นด้วย / (รูป assets โลโก้ ไฟล์ดาวน์โหลด) */
      .replace(/(["'`(\s,=])\/img\//g, `$1${imgUrl}/`)
      .replace(new RegExp(`(["'\`(\\s,=])\\/(${THEME_DIRS})\\/`, 'g'), `$1${themeUrl}/$2/`)
      .replace(new RegExp(`(["'(\\s])\\/(${ICONS})`, 'g'), `$1${themeUrl}/$2`)
      /* URL เต็มของไฟล์ (og:image · JSON-LD) ไม่งั้นรูปแชร์และโลโก้เปิดไม่ขึ้นบน WordPress */
      .replace(new RegExp(`(${base})/img/`, 'g'), `$1${imgUrl}/`)
      .replace(new RegExp(`(${base})/(${THEME_DIRS})/`, 'g'), `$1${themeUrl}/$2/`)
      .replace(new RegExp(`(${base})/(${ICONS})`, 'g'), `$1${themeUrl}/$2`)
}
