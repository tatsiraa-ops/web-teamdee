/* hero หน้าแรก 2 ชุดตาม Wireframe v22 (01 เสื้อทีม / เสื้อบริษัท · 02 เสื้อกีฬา / เสื้อกิจกรรม) · อาร์ตเคาะ 22 ต.ค. 2026
   H1 ตัวเดียวไม่เปลี่ยน · สลับพาดหัวรอง เสื้อ 5 ตัว และปุ่มรอง ทุก EVERY ms
   ไม่มีปุ่มหยุด (อาร์ตสั่ง 22 ต.ค.) · หยุดเมื่อ: กดเลือกชุดเอง · เมาส์ชี้หรือโฟกัสอยู่ใน hero · แท็บซ่อน · hero พ้นจอ · ตั้งค่าลดการเคลื่อนไหว (WCAG 2.2.2) */

export const EVERY = 6000

/** ชุดถัดไปแบบวนรอบ */
export const nextSet = (count, i) => (count > 0 ? (i + 1) % count : 0)

/** เล่นเองได้ไหม · ทุกเหตุผลที่ต้องหยุดรวมไว้ที่เดียว */
export const canAutoplay = ({ count, reduce, paused, held, offscreen, docHidden }) => count > 1 && !reduce && !paused && !held && !offscreen && !docHidden

/** ชี้ค้างแล้วหยุดสลับเฉพาะเมาส์ · บนจอสัมผัส mouseenter ยิงตอนแตะ แล้วไม่มี mouseleave ตามมา hero จะหยุดถาวร */
export const holdsOnPointer = (type) => type === 'mouse'

/** ปุ่มคีย์บอร์ดบนแถบเลือกชุด (แบบ tablist) · null = ไม่ใช่ปุ่มที่ดูแล */
export const tabKey = (key, i, count) => {
  if (key === 'ArrowRight') return (i + 1) % count
  if (key === 'ArrowLeft') return (i - 1 + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}

export function initHeroSets({ every = EVERY } = {}) {
  const root = document.querySelector('[data-hero-sets]')
  if (!root) return
  const tabs = [...root.querySelectorAll('[data-set-tab]')]
  const panels = [...root.querySelectorAll('[data-set-panel]')]
  const extras = [...root.querySelectorAll('[data-set-only]')]
  if (tabs.length < 2 || tabs.length !== panels.length) return

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  /* พ้นจอ (IntersectionObserver) กับแท็บซ่อน แยกตัวแปร · ไม่งั้นกลับมาที่แท็บแล้วค่าแท็บเขียนทับว่า hero ยังพ้นจอ */
  const state = { i: 0, count: tabs.length, reduce: motion.matches, paused: false, held: false, offscreen: false, docHidden: document.hidden }
  let timer = 0

  /* โหลดรูปเสื้อของชุดนั้น (ดู .is-warm ใน home.css) */
  const warm = (n) => panels[n]?.classList.add('is-warm')
  const show = (n, focus = false) => {
    state.i = n
    warm(n)
    tabs.forEach((t, k) => {
      const on = k === n
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      if (on && focus) t.focus()
    })
    panels.forEach((p, k) => { p.classList.toggle('is-off', k !== n); p.inert = k !== n })
    extras.forEach((el) => { el.hidden = el.dataset.setOnly !== tabs[n].dataset.setTab })
  }
  /* แถบเวลาบนปุ่มชุดที่เปิดอยู่ เริ่มนับใหม่ทุกรอบ */
  const tick = () => { root.classList.remove('is-tick'); void root.offsetWidth; root.classList.add('is-tick') }
  const play = () => {
    clearTimeout(timer)
    const on = canAutoplay(state)
    root.classList.toggle('is-playing', on)
    if (!on) return
    tick()
    timer = setTimeout(() => { show(nextSet(state.count, state.i)); play() }, every)
  }
  root.style.setProperty('--set-every', `${every}ms`)

  tabs.forEach((t, k) => {
    t.addEventListener('click', () => { state.paused = true; show(k); play() })
    t.addEventListener('keydown', (e) => {
      const n = tabKey(e.key, state.i, state.count)
      if (n === null) return
      e.preventDefault()
      state.paused = true
      show(n, true)
      play()
    })
  })


  const hold = (on) => { state.held = on; play() }
  root.addEventListener('pointerenter', (e) => { if (holdsOnPointer(e.pointerType)) hold(true) })
  root.addEventListener('pointerleave', (e) => { if (holdsOnPointer(e.pointerType)) hold(root.contains(document.activeElement)) })
  root.addEventListener('focusin', () => hold(true))
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) hold(false) })
  document.addEventListener('visibilitychange', () => { state.docHidden = document.hidden; play() })
  /* เปิดตั้งค่าลดการเคลื่อนไหวระหว่างดูหน้าอยู่ ก็หยุดทันที */
  motion.addEventListener?.('change', () => { state.reduce = motion.matches; play() })
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((list) => { state.offscreen = !list[list.length - 1].isIntersecting; play() }).observe(root)
  }

  /* ชุดถัดไปโหลดหลังหน้าโหลดเสร็จ ไม่แย่งแบนด์วิดท์กับรูปจอแรก · ชี้/โฟกัสที่แถบเลือกชุดก็โหลดก่อนกด */
  const warmNext = () => setTimeout(() => warm(nextSet(state.count, state.i)), 1200)
  if (document.readyState === 'complete') warmNext()
  else addEventListener('load', warmNext, { once: true })
  tabs.forEach((t, k) => { t.addEventListener('pointerenter', () => warm(k)); t.addEventListener('focus', () => warm(k)) })

  show(0)
  play()
}
