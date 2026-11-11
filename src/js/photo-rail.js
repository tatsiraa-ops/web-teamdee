/* รางภาพลูกค้า /project/ (รอบ 167 · อาร์ต "อย่างละ 30-40 รูป กดดูเพิ่มค่อยเปิดรูปเพิ่มขึ้นอีก แล้วเลื่อนซ้ายขวาไปดูอีก")
   AUTO = จำนวนรูปที่ราง "มี" เมื่อเลื่อนมาใกล้ (เติมจาก template เอง) · STEP = เพิ่มต่อการกดดูอีกหนึ่งครั้ง */
export const AUTO = 36
export const STEP = 24
export const takeCount = (shown, remaining, target) => Math.max(0, Math.min(remaining, target - shown))
