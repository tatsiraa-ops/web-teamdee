import { resolveMode } from './hero-mode.js'

/* hero แบบเลื่อนเล่าเรื่อง · ภาพผูกกับการเลื่อนด้วย CSS (animation-timeline) ไม่ต้องใช้ JS
   ไฟล์นี้ทำแค่ 2 อย่าง
   1. ตั้งแบบ hero จาก ?hero= (ไม่มี = แบบทีม)
   2. เบราว์เซอร์ที่ไม่รองรับ scroll timeline · คำนวณความคืบหน้าเองแล้วใส่ --hsp ให้ CSS
*/

/* ปุ่มสลับ hero เอาออกแล้ว (อาร์ต 21 ต.ค. 2026) · หน้าแรกเป็นแบบทีมเสมอ ไม่จำค่าที่เคยเลือก
   แบบอื่นยังเปิดดูได้ด้วย ?hero=scroll หรือ ?hero=classic */
export function initHeroSwitch(onClassic) {
  const mode = resolveMode({ param: new URLSearchParams(location.search).get('hero'), stored: null })
  document.documentElement.setAttribute('data-hero-mode', mode)
  if (mode === 'classic') onClassic()
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
