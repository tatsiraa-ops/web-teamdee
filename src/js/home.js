import '../styles/main.css'
import '../styles/home.css'
import { initAccordion } from './accordion.js'
import { initNav } from './nav.js'
import { initLightbox } from './lightbox.js'
import { initHeroSwitch } from './hero-scroll.js'
import { initReveal, initRails, initGalleryFilter, initMarqueeOffscreen, initTabs } from './home-picker.js'
import { initTracking } from './track.js'
import { initFloats } from './nudge.js'
import { initHeroSets } from './hero-sets.js'
import { initFaqMore } from './faq-more.js'

/* แต่ละส่วนเริ่มแยกกัน ตัวหนึ่งพังไม่ลากตัวอื่นพังตาม (ตรวจโค้ด 23 ต.ค.) */
const safe = (fn) => { try { fn() } catch (err) { console.error(err) } }
;[initNav, initAccordion, initTracking, initFloats, initHeroSets, initFaqMore].forEach(safe)

/* ธีม WordPress (TD_WP) ใช้ hero แบบทีมแบบเดียว (ตกลง 20 ต.ค. 2026) · hero ต้นแบบอีก 2 แบบ + Lenis มีเฉพาะในต้นแบบ
   ใช้ import แบบไดนามิก ตอน build ธีมโค้ดส่วนนี้จะถูกตัดทิ้งทั้งก้อน */
if (!import.meta.env.TD_WP) {
  /* ปุ่มสลับ hero ต้นแบบ โชว์เฉพาะตอน dev หรือเปิดด้วย ?proto (ลูกค้าบนเว็บจริงไม่เห็น · ?hero= ยังใช้ได้) */
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('proto')) document.documentElement.classList.add('is-proto')
  import('../styles/hero-scroll.css')
  Promise.all([import('./hero.js'), import('./print-story.js'), import('./smooth-scroll.js')]).then(([{ initHero }, { initPrintStory }, { initSmoothScroll }]) => {
    /* แบบเดิมเริ่มเดินภาพเคลื่อนไหวเฉพาะตอนถูกเลือก ไม่โหลดผนังเปล่าๆ ตอนดูแบบอื่น */
    let classicStarted = false
    initHeroSwitch(() => {
      if (classicStarted) return
      classicStarted = true
      initHero()
    })
    initPrintStory(initSmoothScroll())
  })
}

/* แบบเสื้อที่คัดมาหน้าแรก กดขยายได้เหมือนหน้าแกลเลอรี
   เป็นจุดที่ลูกค้าเริ่มลูป ขยาย → เซฟรูปที่มีรหัส → ส่งคุยใน LINE */
safe(() => initLightbox('#pickGrid', 'figure', 'ดูแบบเสื้อขนาดใหญ่'))

;[initRails, initMarqueeOffscreen, initTabs, initGalleryFilter, initReveal].forEach(safe)
