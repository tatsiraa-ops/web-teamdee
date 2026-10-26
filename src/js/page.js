import '../styles/main.css'
/* ชิ้นส่วนชุดเดียวกับหน้าแรก (หัวข้อ ตัวเลข กล่อง CTA ส่วนปิด .hm-end) ใช้ทุกหน้า · 24 ต.ค. */
import '../styles/home.css'
import { initAccordion } from './accordion.js'
import { initNav } from './nav.js'
import './ui-bits.js'
import { initTracking } from './track.js'
import { initFloats } from './nudge.js'

initNav()
initAccordion()
initTracking()
initFloats()
