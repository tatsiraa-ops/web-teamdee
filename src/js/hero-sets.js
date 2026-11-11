/* hero หน้าแรก 2 ชุดตาม Wireframe v22 (01 เสื้อทีม / เสื้อบริษัท · 02 เสื้อกีฬา / เสื้อกิจกรรม) · อาร์ตเคาะ 22 ต.ค. 2026
   3 พ.ย.: เป็นสไลด์แบนเนอร์ · สลับทุก EVERY ms · กดจุด/ลูกศร/ปัดเปลี่ยนเองได้ แล้วนับเวลาใหม่
   ไม่มีปุ่มหยุด (อาร์ตสั่ง 22 ต.ค.) · หยุดเมื่อ: โฟกัสคีย์บอร์ดอยู่ในแบนเนอร์ · แท็บซ่อน · แบนเนอร์พ้นจอ · ตั้งค่าลดการเคลื่อนไหว (WCAG 2.2.2)
   เมาส์ชี้ไม่หยุดแล้ว (อาร์ต 3 พ.ย.) */

export const EVERY = 6000

/** ชุดถัดไปแบบวนรอบ */
export const nextSet = (count, i) => (count > 0 ? (i + 1) % count : 0)

/** เล่นเองได้ไหม · ทุกเหตุผลที่ต้องหยุดรวมไว้ที่เดียว */
export const canAutoplay = ({ count, reduce, paused, held, offscreen, docHidden }) => count > 1 && !reduce && !paused && !held && !offscreen && !docHidden

/** ชุดก่อนหน้าแบบวนรอบ (ปุ่มลูกศรซ้าย / ปัดขวา) */
export const prevSet = (count, i) => (count > 0 ? (i - 1 + count) % count : 0)

/** ลาก/ปัด: แนวนอนเกิน 40px และมากกว่าแนวตั้ง · 1 = ถัดไป (ลากซ้าย) · -1 = ก่อนหน้า · 0 = ไม่ใช่การปัด (เช่นเลื่อนหน้า) */
export const swipeDir = (dx, dy, min = 40) => (Math.abs(dx) < min || Math.abs(dx) <= Math.abs(dy) ? 0 : dx < 0 ? 1 : -1)

/** 3 พ.ย. อาร์ต: "เอาเมาส์อยู่ในรูปก็ไม่มีผลในการเวลาเปลี่ยน" → ชี้ค้างไม่หยุดสลับ (เดิมหยุดเมื่อเมาส์ชี้) */
export const holdsOnPointer = () => false

/** โหลดชุดถัดไปรอไว้ไหม (30 ต.ค.) · มือถือ/ลดการเคลื่อนไหวไม่เล่นเอง ไม่ต้องเสียเน็ตโหลดชุด 2 ที่อาจไม่มีใครเปิด */
export const warmsAhead = ({ mobile, reduce = false }) => !mobile && !reduce

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
  const mobile = window.matchMedia('(max-width: 767px)')
  /* พ้นจอ (IntersectionObserver) กับแท็บซ่อน แยกตัวแปร · ไม่งั้นกลับมาที่แท็บแล้วค่าแท็บเขียนทับว่า hero ยังพ้นจอ */
  const state = { i: 0, count: tabs.length, reduce: motion.matches, paused: false, held: false, offscreen: false, docHidden: document.hidden }
  let timer = 0

  /* โหลดรูปเสื้อของชุดนั้น (ดู .is-warm ใน home.css) */
  const warm = (n) => panels[n]?.classList.add('is-warm')
  let first = true
  const show = (n, focus = false) => {
    state.i = n
    if (!first) root.classList.add('is-swapped')
    first = false
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
    const on = !mobile.matches && canAutoplay(state)
    root.classList.toggle('is-playing', on)
    if (!on) return
    tick()
    timer = setTimeout(() => { show(nextSet(state.count, state.i)); play() }, every)
  }
  root.style.setProperty('--set-every', `${every}ms`)

  /* กดเปลี่ยนเอง (จุด ลูกศร ปัด คีย์บอร์ด) = ไปสไลด์นั้นแล้วนับเวลาใหม่ สลับต่อ ไม่หยุดถาวร (อาร์ต 3 พ.ย. "เอาแบบกดเลื่อนได้") */
  const go = (n, focus = false) => { warm(n); show(n, focus); play() }
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => go(k))
    t.addEventListener('keydown', (e) => {
      const n = tabKey(e.key, state.i, state.count)
      if (n === null) return
      e.preventDefault()
      go(n, true)
    })
  })
  root.querySelector('[data-set-prev]')?.addEventListener('click', () => go(prevSet(state.count, state.i)))
  root.querySelector('[data-set-next]')?.addEventListener('click', () => go(nextSet(state.count, state.i)))

  /* ลาก/ปัดซ้ายขวาบนภาพ · ถ้าลากจริงไม่ให้ปุ่ม LINE ในสไลด์ถูกกดตอนปล่อยนิ้ว */
  const reel = root.querySelector('.th-reel') || root
  let start = null
  let swiped = false
  reel.addEventListener('pointerdown', (e) => { if (e.button === 0) { start = { x: e.clientX, y: e.clientY }; swiped = false } })
  reel.addEventListener('pointerup', (e) => {
    if (!start) return
    const d = swipeDir(e.clientX - start.x, e.clientY - start.y)
    start = null
    if (!d) return
    swiped = true
    go(d > 0 ? nextSet(state.count, state.i) : prevSet(state.count, state.i))
  })
  reel.addEventListener('pointercancel', () => { start = null })
  reel.addEventListener('click', (e) => { if (swiped) { e.preventDefault(); e.stopPropagation(); swiped = false } }, true)

  /* หยุดเฉพาะตอนโฟกัสด้วยคีย์บอร์ดอยู่ในแบนเนอร์ (คนใช้คีย์บอร์ด/โปรแกรมอ่านหน้าจอ) · คลิกด้วยเมาส์แล้วปุ่มได้โฟกัสไม่นับ */
  const hold = (on) => { state.held = on; play() }
  root.addEventListener('focusin', (e) => hold(e.target.matches?.(':focus-visible') ?? false))
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) hold(false) })
  document.addEventListener('visibilitychange', () => { state.docHidden = document.hidden; play() })
  /* เปิดตั้งค่าลดการเคลื่อนไหวระหว่างดูหน้าอยู่ ก็หยุดทันที */
  motion.addEventListener?.('change', () => { state.reduce = motion.matches; play() })
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((list) => { state.offscreen = !list[list.length - 1].isIntersecting; play() }).observe(root)
  }

  /* ชุดถัดไปโหลดหลังหน้าโหลดเสร็จ ไม่แย่งแบนด์วิดท์กับรูปจอแรก · เฉพาะจอที่เล่นเอง (30 ต.ค.: มือถือเคยโหลดชุด 2 ทิ้งทุกครั้ง)
     แตะ/ชี้/โฟกัสที่แถบเลือกชุดก็โหลดก่อนกด (นิ้วแตะไม่มี pointerenter จึงต้องมี pointerdown/touchstart) */
  const warmNext = () => setTimeout(() => { if (warmsAhead({ mobile: mobile.matches, reduce: state.reduce })) warm(nextSet(state.count, state.i)) }, 1200)
  if (document.readyState === 'complete') warmNext()
  else addEventListener('load', warmNext, { once: true })
  tabs.forEach((t, k) => {
    t.addEventListener('pointerdown', () => warm(k))
    t.addEventListener('touchstart', () => warm(k), { passive: true })
    t.addEventListener('pointerenter', () => warm(k))
    t.addEventListener('focus', () => warm(k))
  })

  mobile.addEventListener('change', play)
  show(0)
  play()
}
