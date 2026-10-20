import '../styles/main.css'
import '../styles/hero-scroll.css'
import 'preline/plugins/accordion'
import { initNav } from './nav.js'
import { initLightbox } from './lightbox.js'
import { initHero } from './hero.js'
import { initHeroSwitch } from './hero-scroll.js'
import { initPrintStory } from './print-story.js'
import { initSmoothScroll } from './smooth-scroll.js'
import './ui-bits.js'

initNav()
/* hero 2 แบบ · แบบเดิมเริ่มเดินภาพเคลื่อนไหวเฉพาะตอนถูกเลือก ไม่โหลดผนังเปล่าๆ ตอนดูแบบเลื่อน */
let classicStarted = false
initHeroSwitch(() => {
  if (classicStarted) return
  classicStarted = true
  initHero()
})
const smoothScroll = initSmoothScroll()
initPrintStory(smoothScroll)

/* แบบเสื้อที่คัดมาหน้าแรก กดขยายได้เหมือนหน้าแกลเลอรี
   เป็นจุดที่ลูกค้าเริ่มลูป ขยาย → เซฟรูปที่มีรหัส → ส่งคุยใน LINE */
initLightbox('#pickGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่')
