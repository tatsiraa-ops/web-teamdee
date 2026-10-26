import './page.js'
import { readThanksFlag } from './contact-send.js'
import { trackEvent } from './track.js'

/* หน้า /thank-you/ · หน้าติดต่อฝากธงไว้ใน sessionStorage ตอนส่งเข้าระบบสำเร็จจริง (contact-page.js)
   - แสดงเบอร์ที่ลูกค้ากรอก ให้เช็กว่าถูกไหม
   - ยิง td_form_submit ที่นี่ ไม่ยิงก่อนเปลี่ยนหน้า (tag ของ GTM อาจยิงไม่ทัน · audit 2.7) · ยิงครั้งเดียว โหลดซ้ำไม่นับซ้ำ
   - เปิดหน้านี้ตรงๆ (ไม่มีธง) = ไม่แสดงเบอร์ ไม่นับ */

const KEY = 'td-thanks'
let raw = null
try { raw = sessionStorage.getItem(KEY) } catch { raw = null }
const flag = readThanksFlag(raw)

if (flag) {
  const box = document.getElementById('tyTel')
  const num = document.getElementById('tyTelNum')
  if (box && num && flag.tel) {
    num.textContent = flag.tel
    box.hidden = false
  }
  if (!flag.counted) {
    trackEvent('form', { td_form: 'contactForm', td_from: flag.from })
    try { sessionStorage.setItem(KEY, JSON.stringify({ ...flag, counted: true })) } catch { /* เก็บไม่ได้ก็แค่โหลดซ้ำแล้วนับซ้ำ */ }
  }
}
