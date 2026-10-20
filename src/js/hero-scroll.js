import { MODES, KEY, resolveMode } from './hero-mode.js'

/* hero แบบเลื่อนเล่าเรื่อง · ภาพผูกกับการเลื่อนด้วย CSS (animation-timeline) ไม่ต้องใช้ JS
   ไฟล์นี้ทำแค่ 2 อย่าง
   1. สลับแบบเลื่อน ↔ แบบเดิม และจำค่าที่เลือก
   2. เบราว์เซอร์ที่ไม่รองรับ scroll timeline · คำนวณความคืบหน้าเองแล้วใส่ --hsp ให้ CSS
*/

export function initHeroSwitch(onClassic) {
  const root = document.documentElement
  const stored = (() => {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  })()
  const apply = (mode, remember) => {
    root.setAttribute('data-hero-mode', mode)
    for (const b of document.querySelectorAll('[data-hero-set]')) b.setAttribute('aria-pressed', String(b.dataset.heroSet === mode))
    if (remember) {
      try {
        localStorage.setItem(KEY, mode)
      } catch {
        /* โหมดส่วนตัว เก็บไม่ได้ก็ไม่เป็นไร */
      }
    }
    if (mode === 'classic') onClassic()
  }
  apply(resolveMode({ param: new URLSearchParams(location.search).get('hero'), stored }), false)
  for (const b of document.querySelectorAll('[data-hero-set]')) {
    b.addEventListener('click', () => {
      if (!MODES.includes(b.dataset.heroSet)) return
      apply(b.dataset.heroSet, true)
      /* กดสลับแล้วพากลับไปต้น hero ของแบบที่เลือก ไม่ค้างอยู่กลางเรื่อง */
      document.querySelector('.hero-wrap')?.scrollIntoView({ block: 'start' })
    })
  }
}

export function initHeroScroll() {
  const track = document.querySelector('[data-hs-track]')
  if (!track) return

  if (!(window.CSS && CSS.supports('animation-timeline: view()'))) {
    const stage = track.firstElementChild
    let queued = false
    const update = () => {
      queued = false
      const top = parseFloat(getComputedStyle(stage).top) || 0
      const r = track.getBoundingClientRect()
      const span = r.height - stage.offsetHeight
      const p = Math.min(1, Math.max(0, (top - r.top) / (span || 1)))
      track.style.setProperty('--hsp', p.toFixed(4))
    }
    const ask = () => {
      if (!queued) {
        queued = true
        requestAnimationFrame(update)
      }
    }
    addEventListener('scroll', ask, { passive: true })
    addEventListener('resize', ask)
    update()
  }
}

/* บนคอม เสื้อตัวเอกเอียงตามเมาส์เล็กน้อย (±5°) ให้รู้สึกว่าเป็นของจริงที่จับหมุนได้
   ไหลเข้าหาตำแหน่งเมาส์ทีละนิดทุกเฟรม ไม่กระตุกตามเมาส์ · หยุดเมื่อเมาส์นิ่งแล้ว */
export function initHeroTilt() {
  const el = document.querySelector('[data-hs-tilt]')
  if (!el) return
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  if (!fine.matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  let tx = 0, ty = 0, x = 0, y = 0, running = false
  const step = () => {
    x += (tx - x) * 0.08
    y += (ty - y) * 0.08
    el.style.setProperty('--ry', `${x.toFixed(2)}deg`)
    el.style.setProperty('--rx', `${y.toFixed(2)}deg`)
    running = Math.abs(tx - x) > 0.01 || Math.abs(ty - y) > 0.01
    if (running) requestAnimationFrame(step)
  }
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    tx = (e.clientX / innerWidth - 0.5) * 10
    ty = -(e.clientY / innerHeight - 0.5) * 7
    if (!running) {
      running = true
      requestAnimationFrame(step)
    }
  }, { passive: true })
}
