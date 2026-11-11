/* ตัวช่วยเล็กๆ ที่ใช้ร่วมกันหลายหน้า
   ฟังก์ชันคำนวณราคาและระยะผลิตแบบเดิมถูกเอาออกแล้ว เพราะใช้ตัวเลขที่ยังไม่อนุมัติ (Brief ข้อ 08)
   ราคาไปอยู่ที่ estimate.js ซึ่งไม่คิดตัวเลขจนกว่าจะยืนยัน */

export const baht = (n) => Number(n).toLocaleString('en-US')

export const qs = (k) => new URLSearchParams(location.search).get(k)
/** วันนี้ YYYY-MM-DD ตามเวลาเครื่อง (toISOString เป็น UTC · ตี 0–7 เวลาไทยได้วันเมื่อวาน · 30 ต.ค.) */
export const todayLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
