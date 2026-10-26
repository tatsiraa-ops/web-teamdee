import '../styles/main.css'
import '../styles/home.css'
import { initAccordion } from './accordion.js'
import { initNav } from './nav.js'
import { initLightbox } from './lightbox.js'
import { initHeroSwitch } from './hero-scroll.js'
import { initReveal, initRails, initGalleryFilter, initMarqueeOffscreen, initTabs, initRealGrid } from './home-picker.js'
import { initTracking } from './track.js'
import { initFloats } from './nudge.js'
import { initHeroSets } from './hero-sets.js'
import { initFaqMore } from './faq-more.js'
import { initCountUp } from './count-up.js'

/* ทีมดี เข้าใจคนสั่ง · ขีดฆ่าปัญหาทีละข้อตอนเลื่อนมาเห็น · ไม่มี JS / ลดการเคลื่อนไหว = เห็นขีดฆ่าและคำตอบนิ่งๆ */
function initPainStrike() {
  const box = document.querySelector('[data-pain]')
  if (!box || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  box.classList.add('is-armed')
  const io = new IntersectionObserver((list) => { if (list.some((e) => e.isIntersecting)) { box.classList.add('is-in'); io.disconnect() } }, { rootMargin: '0px 0px -25% 0px' })
  io.observe(box)
}

/* แต่ละส่วนเริ่มแยกกัน ตัวหนึ่งพังไม่ลากตัวอื่นพังตาม (ตรวจโค้ด 23 ต.ค.) */
const safe = (fn) => { try { fn() } catch (err) { console.error(err) } }
;[initNav, initAccordion, initTracking, initFloats, initHeroSets, initFaqMore, initCountUp, initPainStrike].forEach(safe)

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

;[initRails, initMarqueeOffscreen, initTabs, initGalleryFilter, initRealGrid, initReveal].forEach(safe)

/* แถบล่างมือถือหลบลงขณะปุ่ม LINE ของ hero ยังอยู่ในจอ (critique 24 ต.ค. · CSS html.is-hero-cta ใน main.css) */
safe(() => {
  const btn = document.querySelector('[data-where="hero"]')
  if (!btn || !('IntersectionObserver' in window)) return
  new IntersectionObserver(([en]) => document.documentElement.classList.toggle('is-hero-cta', en.isIntersecting)).observe(btn)
})
