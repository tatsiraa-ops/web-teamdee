/* แถวรีวิวเลื่อนเอง (หน้ารีวิวลูกค้า · 28 ต.ค. อาร์ต "แก้มาเลย": มือถือปัดเองไม่ได้)
   เดิมวิ่งด้วย CSS transform → นิ้วปัดไม่ได้ · ตอนนี้แถวเป็นกล่องเลื่อนข้างจริง JS ขยับ scrollLeft ทีละเฟรม
   ชี้เมาส์/โฟกัส/ปุ่มหยุด = หยุด · แตะหรือปัดเอง = หยุดแล้วเดินต่อเองหลังปล่อย 2.5 วิ · ลดการเคลื่อนไหว = ไม่เดินเอง (ปัดเองได้)
   ชุดที่สองของแต่ละแถวซ้ำไว้ (aria-hidden) → ตำแหน่งวนในช่วง 0 ถึงความยาว 1 ชุด */

const MAX_DT = 50
const RESUME_MS = 2500

export const wrapX = (x, period) => (period > 0 ? ((x % period) + period) % period : 0)

export const stepX = (x, dir, speed, dt, period) => wrapX(x + (dir * speed * Math.min(dt, MAX_DT)) / 1000, period)

export function initReviewMarquee() {
  document.querySelectorAll('[data-rvm]').forEach((rvm) => {
    const btn = rvm.nextElementSibling?.querySelector('[data-rvm-pause]')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    const rows = [...rvm.querySelectorAll('.rvm__row')].map((el, i) => ({ el, dir: i % 2 ? -1 : 1, x: 0, set: -1, hold: 0, period: 0, speed: 0 }))
    let paused = false
    let hover = false
    let seen = true
    let last = 0

    /* ความยาว 1 ชุด = ระยะจากการ์ดแรกถึงการ์ดแรกของชุดซ้ำ · ความเร็ว = การ์ด 1 ใบต่อ 9 วิ (เท่าเดิมตอนเป็น CSS) */
    const measure = () => {
      if (rvm.dataset.manualMobile) return
      for (const r of rows) {
        const kids = r.el.querySelector('.rvm__track').children
        const n = kids.length / 2
        r.period = n >= 1 ? kids[n].offsetLeft - kids[0].offsetLeft : 0
        r.speed = n >= 1 ? (kids[1] ? kids[1].offsetLeft - kids[0].offsetLeft : kids[0].offsetWidth) / 9 : 0
        if (r.set < 0) r.x = r.dir < 0 ? r.period / 2 : 0
        r.el.scrollLeft = r.x
        r.set = r.el.scrollLeft
      }
    }

    const holdAll = (until) => rows.forEach((r) => { r.hold = until })

    rows.forEach((r) => {
      /* ปัดเอง: ตำแหน่งที่อ่านได้ไม่ตรงกับที่ตั้งไว้ = ผู้ใช้เลื่อน → หยุดชั่วคราว · เลยขอบชุดก็วนกลับให้ปัดต่อได้ไม่สุด */
      r.el.addEventListener('scroll', () => {
        if (rvm.dataset.manualMobile) return
        if (Math.abs(r.el.scrollLeft - r.set) <= 1) return
        r.hold = performance.now() + RESUME_MS
        if (r.period > 0 && r.el.scrollLeft >= r.period) r.el.scrollLeft -= r.period
        if (r.period > 0 && r.el.scrollLeft < 1) r.el.scrollLeft += r.period
        r.x = r.el.scrollLeft
        r.set = r.x
      }, { passive: true })
      r.el.addEventListener('pointerdown', () => { r.hold = Infinity })
      r.el.addEventListener('touchstart', () => { r.hold = Infinity }, { passive: true })
    })
    const release = () => rows.forEach((r) => { if (r.hold === Infinity) r.hold = performance.now() + RESUME_MS })
    addEventListener('pointerup', release)
    addEventListener('pointercancel', release)
    addEventListener('touchend', release, { passive: true })
    rvm.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true })
    rvm.addEventListener('pointerleave', () => { hover = false })
    rvm.addEventListener('focusin', () => holdAll(Infinity))
    rvm.addEventListener('focusout', () => holdAll(performance.now() + RESUME_MS))

    btn?.addEventListener('click', () => {
      paused = !paused
      btn.dataset.on = String(paused)
      btn.lastElementChild.textContent = paused ? 'เลื่อนต่อ' : 'หยุดเลื่อน'
    })

    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { seen = e.isIntersecting }).observe(rvm)
    addEventListener('resize', measure)
    measure()

    const tick = (t) => {
      const dt = last ? t - last : 0
      last = t
      if (!rvm.dataset.manualMobile && !paused && !hover && seen && !reduce.matches) {
        for (const r of rows) {
          if (r.hold > t || !r.period) continue
          r.x = stepX(r.x, r.dir, r.speed, dt, r.period)
          r.el.scrollLeft = r.x
          r.set = r.el.scrollLeft
        }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}
