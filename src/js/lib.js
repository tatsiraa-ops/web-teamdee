/* ตัวช่วยเล็กๆ ที่ใช้ร่วมกันหลายหน้า
   ฟังก์ชันคำนวณราคาและระยะผลิตแบบเดิมถูกเอาออกแล้ว เพราะใช้ตัวเลขที่ยังไม่อนุมัติ (Brief ข้อ 08)
   ราคาไปอยู่ที่ estimate.js ซึ่งไม่คิดตัวเลขจนกว่าจะยืนยัน */

export const baht = (n) => Number(n).toLocaleString('en-US')

export const qs = (k) => new URLSearchParams(location.search).get(k)
