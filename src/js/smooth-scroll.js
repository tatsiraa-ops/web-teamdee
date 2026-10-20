import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/* เลื่อนนุ่มด้วยแรงเฉื่อย (Lenis) · ใช้ในหน้าที่มีภาพผูกกับการเลื่อน
   เหตุผล: ล้อเมาส์บนคอมเลื่อนทีละขั้น ~100px ภาพที่ผูกกับระยะเลื่อนเลยกระโดดตาม
   วัดได้เสื้อตัวเอกกระโดด 197px ในเฟรมเดียว (2 ต.ค. 2026) · เลื่อนนุ่มแล้วภาพไหลตามแทน
   ไม่ยุ่งกับจอสัมผัส (เลื่อนตามนิ้วอยู่แล้ว) และไม่ทำงานถ้าผู้ใช้ขอลดการเคลื่อนไหว */
export function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  const lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
    syncTouch: false,
    anchors: { offset: -77 },
    /* กล่องรูปใหญ่กับเมนูมือถือเลื่อนเองข้างใน ไม่ให้หน้าหลังเลื่อนตาม */
    prevent: (node) => !!node.closest?.('dialog, #mobileMenu, [data-lenis-prevent]'),
  })
  const raf = (t) => {
    lenis.raf(t)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  /* เมนูมือถือเปิด = ล็อกหน้า */
  const menu = document.getElementById('mobileMenu')
  if (menu) new MutationObserver(() => (menu.hidden ? lenis.start() : lenis.stop())).observe(menu, { attributes: true, attributeFilter: ['hidden'] })
  return lenis
}
