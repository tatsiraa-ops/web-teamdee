/* สลับ hero หน้าแรก 3 แบบ · ทีม (team ตามแบบ Figma Present 2026 · ค่าเริ่มต้น) · เลื่อนเล่าเรื่อง (scroll) · แบบเดิม (classic วน A → B)
   ลำดับความสำคัญ: ?hero= ในลิงก์ > ค่าที่ผู้ใช้เลือกไว้ในเครื่อง > แบบทีม
   ช่วงต้นแบบมีไว้เทียบภายใน · ก่อนขึ้นจริงต้องเลือกแบบเดียวหรือทำ A/B ที่วัดผล (docs/plans/hero-scroll.md ข้อ 4) */
export const MODES = ['team', 'scroll', 'classic']
/* td-hero2 · เปลี่ยนชื่อตอนเพิ่มแบบทีม (20 ต.ค. 2026) ให้ทุกคนเห็นแบบใหม่ก่อน ไม่ติดค่าที่เคยกดไว้ */
export const KEY = 'td-hero2'

export const resolveMode = ({ param, stored }) => {
  if (MODES.includes(param)) return param
  if (MODES.includes(stored)) return stored
  return 'team'
}
