/* แม่แบบหน้ารายละเอียดแบบ /design-[รหัส]/ ตาม Wireframe v22 · มีเทส tests/design-page.test.js
   v22: ทำหน้าเมื่อได้รหัสแบบจริง ภาพ และสิทธิใช้งานแล้วเท่านั้น → ตอนนี้มีแค่หน้าตัวอย่าง /design-sample/ ในต้นแบบ (ไม่ export · noindex) */

export const designSlug = (code) => `/design-${String(code).toLowerCase()}/`

export function designDetail(d, { uses, contactHref }) {
  const use = uses.find((u) => (d.use || []).includes(u.id)) || null
  const useName = use ? use.name : '[กลุ่มการใช้งาน]'
  return {
    ...d,
    use,
    h1: `แบบ${useName} ${d.techName} รหัส ${d.code}`,
    lead: 'ใช้เป็นจุดเริ่มต้นคุยเรื่องสี โลโก้ และข้อความของทีม',
    rows: [
      ['ประเภทแบบ', `กราฟิกเสื้อ${d.techName}`],
      ['กลุ่มการใช้งาน', useName],
      ['แนวทาง', `${d.garmentName}${d.color ? ` · โทน${d.color}` : ''} — ใช้ภาพประกอบเป็นแนวทางและตรวจองค์ประกอบกับทีมออกแบบ`],
      ['รายละเอียดปรับแบบ', 'ส่งสี โลโก้ และข้อความให้ตรวจความเหมาะสม'],
      ['ทรงและผ้า', 'ยืนยันตามประเภทเสื้อที่ต้องการผลิต'],
    ],
    quoteHref: `${contactHref}?code=${encodeURIComponent(d.code)}&from=design`,
  }
}
