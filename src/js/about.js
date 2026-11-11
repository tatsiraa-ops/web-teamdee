import '../styles/main.css'
/* home.css โหลดใน head แล้ว (head.hbs · 27 ต.ค.) */
import { initAccordion } from './accordion.js'
import { initNav } from './nav.js'
import { initTracking } from './track.js'
import { initFloats } from './nudge.js'
import { initSiteExtras } from './site-extras.js'
import { initReveal, initMarqueeOffscreen } from './home-picker.js'
import { initCountUp } from './count-up.js'
import { initToc } from './about-toc.js'

/* หน้ารู้จักทีมดี (รื้อ 23 ต.ค. · อาร์ต "ทำเป็นสวยๆ น่าอ่าน") · ใช้ชิ้นเดียวกับหน้าแรก: ค่อยขึ้นตอนเลื่อน ตัวเลขวิ่ง แถบรูป/โลโก้เลื่อน
   แต่ละส่วนเริ่มแยกกัน ตัวหนึ่งพังไม่ลากตัวอื่นพังตาม */
const safe = (fn) => { try { fn() } catch (err) { console.error(err) } }
;[initNav, initAccordion, initTracking, initFloats, initSiteExtras, initCountUp, initMarqueeOffscreen, initReveal, initToc].forEach(safe)
