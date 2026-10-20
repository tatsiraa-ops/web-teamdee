/* สลับ hero หน้าแรก 2 แบบ · แบบเลื่อนเล่าเรื่อง (scroll) กับ แบบเดิม (classic วน A → B)
   ลำดับความสำคัญ: ?hero= ในลิงก์ > ค่าที่ผู้ใช้เลือกไว้ในเครื่อง > แบบเลื่อน
   ช่วงต้นแบบมีไว้เทียบภายใน · ก่อนขึ้นจริงต้องเลือกแบบเดียวหรือทำ A/B ที่วัดผล (docs/plans/hero-scroll.md ข้อ 4) */
export const MODES = ['scroll', 'classic']
export const KEY = 'td-hero'

export const resolveMode = ({ param, stored }) => {
  if (MODES.includes(param)) return param
  if (MODES.includes(stored)) return stored
  return 'scroll'
}
