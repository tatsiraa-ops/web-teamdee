/* ชิ้นส่วนที่ใช้ซ้ำหลายหน้า ตัวเลขนับขึ้น และเสาหลักที่ไล่ทีละข้อ */

/* ---------- ตัวเลขนับขึ้นตอนเลื่อนมาถึง ----------
   อ่านค่าปลายทางจากตัวหนังสือเดิม แยกเลขกับส่วนต่อท้ายอย่าง + ออกจากกัน
   ถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว ให้แสดงเลขจริงไปเลยไม่ต้องนับ */
const counters = document.querySelectorAll('[data-count]')
if (counters.length) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const run = (el) => {
    const raw = el.textContent.trim()
    const m = /^([\d,.]+)(.*)$/.exec(raw)
    if (!m) return
    const target = Number(m[1].replace(/,/g, ''))
    const suffix = m[2]
    if (!Number.isFinite(target)) return
    const dur = 1100
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      // ออกตัวเร็วแล้วค่อยๆ หยุด อ่านแล้วเหมือนกำลังนับจริง
      const eased = 1 - Math.pow(1 - p, 3)
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  if (reduce) {
    // ไม่ต้องทำอะไร ตัวเลขจริงอยู่ใน HTML อยู่แล้ว
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        io.unobserve(e.target)
        run(e.target)
      }
    }, { threshold: 0.6 })
    for (const el of counters) {
      // จองความกว้างไว้ก่อนด้วยค่าจริง แล้วค่อยเริ่มจากศูนย์ ไม่ให้เลย์เอาต์ขยับ
      el.style.minWidth = el.getBoundingClientRect().width + 'px'
      el.style.display = 'inline-block'
      io.observe(el)
    }
  }
}

/* ---------- เสาหลักสี่ต้น ไล่ทีละข้อเอง กดเลือกเองได้ ----------
   หยุดเมื่อเอาเมาส์ชี้หรือโฟกัสเข้าไป และไม่ไล่เองถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว */
const pillars = document.getElementById('pillars')
if (pillars) {
  const rows = [...pillars.querySelectorAll('[data-pillar]')]
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let i = 0
  let timer = null
  let paused = false

  const show = (n) => {
    i = (n + rows.length) % rows.length
    rows.forEach((r, k) => r.setAttribute('aria-expanded', String(k === i)))
  }
  const tick = () => { if (!paused) show(i + 1) }
  const start = () => { if (!reduce && !timer) timer = setInterval(tick, 5000) }
  const stop = () => { clearInterval(timer); timer = null }

  rows.forEach((r, k) => {
    r.addEventListener('click', () => { show(k); paused = false })
    r.addEventListener('mouseenter', () => { paused = true })
    r.addEventListener('mouseleave', () => { paused = false })
    r.addEventListener('focus', () => { paused = true; show(k) })
    r.addEventListener('blur', () => { paused = false })
  })

  // เริ่มไล่ต่อเมื่อบล็อกนี้อยู่ในจอ ไม่ต้องวิ่งทิ้งไว้ตอนคนอ่านอย่างอื่น
  new IntersectionObserver((es) => {
    for (const e of es) e.isIntersecting ? start() : stop()
  }, { threshold: 0.25 }).observe(pillars)
}
