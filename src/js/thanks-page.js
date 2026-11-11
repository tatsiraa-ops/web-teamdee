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
  document.getElementById('tyHeading').textContent = 'ทีมดีได้รับข้อมูลของคุณแล้ว'
  document.getElementById('tyCrumb').textContent = 'ส่งข้อมูลแล้ว'
  document.getElementById('tyLead').textContent = 'ขอบคุณที่ติดต่อทีมดี ทีมติดต่อกลับในเวลาทำการ · ต้องการคุยต่อ ทัก LINE ได้เลย'
  document.getElementById('tyContact').hidden = true
  document.getElementById('wait-h').textContent = 'ระหว่างรอทีมติดต่อกลับ'
  const box = document.getElementById('tyTel')
  const num = document.getElementById('tyTelNum')
  if (box && num && flag.tel) {
    num.textContent = flag.tel
    box.hidden = false
  }
  if (!flag.counted) {
    trackEvent('form', { td_form: 'contactForm', td_from: flag.from })
    /* นับแล้วไม่เก็บเบอร์ต่อ (ตรวจ PDPA 30 ต.ค. · เดิมเบอร์ค้างในแท็บ 30 นาที) */
    try { sessionStorage.setItem(KEY, JSON.stringify({ ...flag, tel: '', counted: true })) } catch { /* เก็บไม่ได้ก็แค่โหลดซ้ำแล้วนับซ้ำ */ }
  }
} else {
  /* ส่งแบบไม่มี JS: ธีมพาลงหน้านี้พร้อม ?sent=<token> และเขียนหัวข้อ "ได้รับ" ให้แล้ว · นับครั้งเดียวต่อ token (30 ต.ค.) */
  const token = new URLSearchParams(location.search).get('sent')
  if (token && /ได้รับ/.test(document.getElementById('tyHeading')?.textContent || '')) {
    let seen = null
    try { seen = sessionStorage.getItem(`td-sent-${token}`) } catch { seen = null }
    if (!seen) {
      trackEvent('form', { td_form: 'contactForm', td_from: 'nojs' })
      try { sessionStorage.setItem(`td-sent-${token}`, '1') } catch { /* นับซ้ำได้ถ้าเก็บไม่ได้ */ }
    }
  }
}
