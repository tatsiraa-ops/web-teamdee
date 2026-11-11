/* ของที่ต้องมีทุกหน้า (26 ต.ค. 2026): ป้ายคุกกี้ PDPA · ตัวเล่นคลิป (รอความยินยอม) · ป๊อปอัปเข้าเว็บครั้งแรก
   เรียกจาก page.js / home.js / about.js · tests/site-extras.test.js ตรวจว่าทุก script หลักเรียกครบ
   ป้ายคุกกี้เริ่มก่อนเสมอ และแต่ละส่วนพังแยกกัน (ตรวจโค้ด 26 ต.ค. L8: ตัวอื่นพังแล้วป้ายไม่ขึ้น) */
import { initVideoSlots } from './video-slot.js'
import { initConsent } from './consent-ui.js'
import { initPromo } from './promo-popup.js'
import { initSticky } from './sticky-side.js'
import { initMobileUi } from './mobile-ui.js'
import { initMarqueePause } from './marquee-pause.js'
import { initHeaderHide } from './header-hide.js'

const safe = (fn) => { try { fn() } catch (e) { console.error(e) } }

export function initSiteExtras() {
  safe(initConsent)
  safe(initVideoSlots)
  /* ป๊อปอัปรอให้จัดการป้ายคุกกี้ก่อน (promo-popup.js) */
  safe(initPromo)
  /* การ์ดข้างที่ติดตามเวลาเลื่อน ติดใต้หัวเว็บจริง (26 ต.ค.) */
  safe(initSticky)
  /* มือถือ: ท้ายเว็บพับ + รางเลื่อนแนวนอน (30 ต.ค. หน้าสั้นลง) */
  safe(initMobileUi)
  /* ปุ่มหยุดแถวโลโก้ที่เลื่อนเอง (30 ต.ค. · WCAG 2.2.2) */
  safe(initMarqueePause)
  /* มือถือ: หัวเว็บหลบตอนเลื่อนลง (30 ต.ค.) · หลัง initSticky ที่ตั้ง --hdr-b ครั้งแรก */
  safe(initHeaderHide)
}
