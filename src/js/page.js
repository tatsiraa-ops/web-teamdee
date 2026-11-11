import '../styles/main.css'
/* ชิ้นส่วนชุดเดียวกับหน้าแรก (หัวข้อ ตัวเลข กล่อง CTA ส่วนปิด .hm-end) ใช้ทุกหน้า · 24 ต.ค. */
/* home.css โหลดใน head แล้ว (head.hbs · 27 ต.ค.) */
import { initAccordion } from './accordion.js'
import { initNav } from './nav.js'
import './ui-bits.js'
import { initTracking } from './track.js'
import { initFloats } from './nudge.js'
import { initSiteExtras } from './site-extras.js'
import { initReviewDialog } from './review-dialog.js'
import { initReviewMarquee } from './review-marquee.js'
import { initReviewWall } from './review-wall.js'
import { initHeroBar } from './mobile-ui.js'

initNav()
initAccordion()
initTracking()
initFloats()
/* แถบล่างมือถือหลบตอนเห็นปุ่ม LINE ของจอแรก ทุกแม่แบบ (2 พ.ย.) */
try { initHeroBar() } catch (e) { console.error(e) }
/* คลิปทีมดี · ป้ายคุกกี้ PDPA · ป๊อปอัปเข้าเว็บครั้งแรก (26 ต.ค.) */
initSiteExtras()
/* กล่องดูรูปรีวิว · หน้าที่มีการ์ดรีวิว (27 ต.ค.) */
try { initReviewDialog() } catch (e) { console.error(e) }
try { initReviewMarquee() } catch (e) { console.error(e) }
try { initReviewWall() } catch (e) { console.error(e) }
