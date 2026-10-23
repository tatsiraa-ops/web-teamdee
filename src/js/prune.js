/* ตัดข้อมูลที่ยังรอยืนยัน [วงเล็บ] ออกก่อนขึ้นเว็บจริง · ใช้กับข้อมูลที่ไม่มีตัวประกอบหน้าเฉพาะ (คู่มือ FAQ)
   กติกาเดียวกับ product-view / use-view: รายการที่มี [วงเล็บ] ตัดทั้งรายการ ไม่ลบแค่วงเล็บ
   เพราะวงเล็บมักกำกับว่าประโยคข้างหน้ายังไม่ได้ยืนยัน · มีเทส tests/prune.test.js */
import { pending } from './product-view.js'

export function prunePending(x) {
  if (Array.isArray(x)) {
    return x
      .filter((v) => (typeof v === 'string' ? !pending(v) : Array.isArray(v) ? !v.some((c) => typeof c === 'string' && pending(c)) : !(v && typeof v === 'object' && Object.values(v).some((c) => typeof c === 'string' && pending(c)))))
      .map(prunePending)
  }
  if (x && typeof x === 'object') {
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, typeof v === 'string' ? (pending(v) ? '' : v) : prunePending(v)]))
  }
  return x
}
