/* ท่าทางของตัวดูรูป ใช้ร่วมกัน lightbox.js + review-dialog.js (audit มือถือ 30 ต.ค. ข้อ 17)
   - ลากซ้ายขวา ภาพตามนิ้ว 1:1 · ปล่อยแล้วตัดสินจากระยะ + ความเร็ว (project แบบ Apple) · รูปแรก/สุดท้ายเป็นยางยืด
   - ปัดลงปิด ฉากหลังจางตามระยะ · ลากขึ้น = เลื่อนหน้าต่างไปดูรายละเอียด (ถ้ามีตัวเลื่อน)
   - บีบสองนิ้ว / แตะสองครั้ง ซูมรอบจุดนิ้ว · ซูมอยู่ลากได้แค่เลื่อนภาพ ไม่เปลี่ยนรูป ไม่ปิด
   - ปล่อยนิ้วแล้วเคลื่อนต่อด้วยสปริง critically damped รับความเร็วนิ้ว (ไม่มีรอยต่อ) · จับใหม่กลางทางได้
   - prefers-reduced-motion: ไม่มีสปริง กระโดดไปตำแหน่งปลายทันที (ลากตามนิ้วยังทำงาน เพราะผู้ใช้เป็นคนขยับเอง)
   ส่วนบนเป็นฟังก์ชันล้วน ทดสอบด้วย node (tests/swipe-pager.test.js) · createSwipePager เป็นส่วน DOM */

export const SLOP = 10
const GAP = 24
const MIN_SCALE = 1
const MAX_SCALE = 4
const TAP_ZOOM = 2.5

/** ขยับเกิน slop แล้วล็อกแกนที่ขยับมากกว่า · เท่ากัน = แนวตั้ง */
export function lockAxis(dx, dy, slop = SLOP) {
  if (Math.abs(dx) < slop && Math.abs(dy) < slop) return null
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
}

/** ยิ่งเลยขอบยิ่งต้าน ไม่หยุดแข็ง (สูตร UIScrollView) */
export function rubberband(over, dim, c = 0.55) {
  if (!over) return 0
  const a = Math.abs(over)
  return Math.sign(over) * (a * dim * c) / (dim + c * a)
}

/** ระยะที่ภาพจะไหลต่อจากความเร็วตอนปล่อย (px/s) · สูตรจาก Designing Fluid Interfaces */
export function project(v, rate = 0.998) {
  return ((v / 1000) * rate) / (1 - rate)
}

/** ตำแหน่งภาพระหว่างลากซ้ายขวา: ตามนิ้ว 1:1 · ทิศที่ไม่มีรูปให้ไป = ยางยืด */
export function dragOffset(dx, { canPrev, canNext, width }) {
  if ((dx > 0 && !canPrev) || (dx < 0 && !canNext)) return rubberband(dx, width)
  return dx
}

/** -1 รูปก่อนหน้า · 1 รูปถัดไป · 0 เด้งกลับ · ไม่วนที่ปลายชุด */
export function decidePage({ dx, vx, width, canPrev, canNext }) {
  if (!dx) return 0
  const end = dx + project(vx, 0.995)
  /* ลากไปแล้วสะบัดกลับ = ยกเลิก ไม่กระโดดไปอีกทาง */
  if (Math.sign(end) !== Math.sign(dx) || Math.abs(end) < width / 2) return 0
  const dir = dx < 0 ? 1 : -1
  if ((dir === 1 && !canNext) || (dir === -1 && !canPrev)) return 0
  return dir
}

/** ปัดลงไกลพอ หรือสะบัดลงเร็วพอ · กำลังดึงกลับขึ้น = ไม่ปิด */
export function decideDismiss({ dy, vy, height }) {
  if (dy <= 0 || vy < -200) return false
  return dy + project(Math.max(0, vy), 0.995) > Math.min(height * 0.2, 140)
}

/** 0–1 ใช้จางฉากหลัง/ย่อภาพตอนปัดลง · ครบที่ครึ่งจอ */
export function dismissProgress(dy, height) {
  return Math.min(1, Math.max(0, dy / (height * 0.5)))
}

/** ความเร็ว px/s จากจุดช่วง 100ms ล่าสุด · นิ้วหยุดก่อนยก = 0 */
export function velocity(samples, win = 100) {
  const last = samples[samples.length - 1]
  if (!last) return { vx: 0, vy: 0 }
  const first = samples.find((s) => last.t - s.t <= win)
  const dt = (last.t - first.t) / 1000
  if (first === last || dt <= 0) return { vx: 0, vy: 0 }
  return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt }
}

export function clampScale(s, lo = MIN_SCALE, hi = MAX_SCALE) {
  return Math.min(hi, Math.max(lo, s))
}

/** เลื่อนใหม่หลังเปลี่ยนสเกล ให้จุด focal (วัดจากกลางภาพ) อยู่ที่เดิมบนจอ */
export function zoomAbout(s0, t0, s1, focal) {
  return focal - ((focal - t0) * s1) / s0
}

/** เลื่อนได้สุดเท่าไรต่อแกน (ภาพอยู่กลางกรอบ) */
export function panLimit(size, scale, box) {
  return Math.max(0, (size * scale - box) / 2)
}

export function clampPan(t, size, scale, box) {
  const lim = panLimit(size, scale, box)
  return Math.min(lim, Math.max(-lim, t))
}

const softPan = (t, size, scale, box) => {
  const lim = panLimit(size, scale, box)
  if (Math.abs(t) <= lim) return t
  return Math.sign(t) * (lim + rubberband(Math.abs(t) - lim, box))
}

export function isDoubleTap(prev, cur, ms = 300, px = 30) {
  if (!prev) return false
  return cur.t - prev.t <= ms && Math.hypot(cur.x - prev.x, cur.y - prev.y) <= px
}

/** สปริง critically damped (damping 1.0) แบบสูตรปิด · response = วินาทีโดยประมาณที่เข้าเป้า
    รับความเร็วตั้งต้นจากนิ้ว ไม่ทะลุเป้าเมื่อเริ่มจากนิ่ง */
export function springStep({ x, v }, target, dt, response = 0.35) {
  const w = (2 * Math.PI) / response
  const x0 = x - target
  const b = v + w * x0
  const e = Math.exp(-w * dt)
  return { x: target + (x0 + b * dt) * e, v: (v - w * b * dt) * e }
}

/** ท่าทางตอนนี้คืออะไร · ซูมอยู่ลากได้แค่เลื่อนภาพ */
export function gestureMode({ pointers, scale, axis, dy, scrolled }) {
  if (pointers >= 2) return 'pinch'
  if (scale > 1.01) return 'pan'
  if (!axis) return null
  if (axis === 'x') return 'page'
  return dy > 0 && !scrolled ? 'dismiss' : 'scroll'
}

/* ---------- DOM ---------- */

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/* สปริงหลายค่าพร้อมกัน (แยกแกน x/y ตามแนว Apple) · stop() หยุดที่ค่าปัจจุบัน finish() กระโดดไปปลายทาง */
function spring(vals, onFrame, onDone, response = 0.35) {
  const st = Object.fromEntries(Object.entries(vals).map(([k, [from, to, v = 0]]) => [k, { x: from, v, to }]))
  const cur = () => Object.fromEntries(Object.entries(st).map(([k, s]) => [k, s.x]))
  let raf = 0
  let last = 0
  let done = false
  let guard = 0
  const end = () => { done = true; cancelAnimationFrame(raf); clearTimeout(guard) }
  const ctl = {
    stop: end,
    finish() { if (done) return; end(); for (const s of Object.values(st)) s.x = s.to; onFrame(cur()); onDone?.() },
  }
  if (reduced()) { ctl.finish(); return ctl }
  const tick = (now) => {
    const dt = last ? Math.min(0.064, (now - last) / 1000) : 1 / 60
    last = now
    let settled = true
    for (const s of Object.values(st)) {
      Object.assign(s, springStep(s, s.to, dt, response))
      if (Math.abs(s.x - s.to) > 0.5 || Math.abs(s.v) > 20) settled = false
    }
    if (settled) { ctl.finish(); return }
    onFrame(cur())
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  /* กันเฟรมหยุด (แท็บเบื้องหลัง/เครื่องค้าง): ไม่ปล่อยให้ค้างครึ่งทาง เช่นเปลี่ยนรูปไม่จบ */
  guard = setTimeout(() => ctl.finish(), 1200)
  return ctl
}

/**
 * ต่อท่าทางเข้ากับตัวดูรูป
 * @param {object} o
 * @param {HTMLElement} o.root     กล่องหน้าต่าง (ตั้ง --vw-fade ตอนปัดลง)
 * @param {HTMLElement} o.stage    พื้นที่รับนิ้ว (ตั้ง touch-action: none ใน viewer.css)
 * @param {HTMLImageElement} o.img ภาพหลัก (ถูกห่อด้วย .vw-track + ภาพข้างเคียง)
 * @param {HTMLElement} [o.scroller] ตัวเลื่อนของหน้าต่าง ลากขึ้น = เลื่อนไปดูรายละเอียด
 * @param {() => number} o.index · @param {() => number} o.count
 * @param {(delta: number) => string} o.peekSrc ภาพรูปข้างเคียง (preload + โชว์ระหว่างลาก)
 * @param {(delta: number) => void} o.onPage · @param {() => void} o.onClose
 */
export function createSwipePager({ root, stage, img, scroller = null, index, count, peekSrc, onPage, onClose }) {
  const track = document.createElement('div')
  track.className = 'vw-track'
  img.replaceWith(track)
  track.append(img)
  img.draggable = false
  const peeks = new Map([-1, 1].map((side) => {
    const box = document.createElement('div')
    box.className = 'vw-peek'
    box.dataset.side = String(side)
    box.setAttribute('aria-hidden', 'true')
    const im = document.createElement('img')
    /* คลาสเดียวกับภาพหลัก ขนาดจึงเท่ากันพอดี (อยู่หลังภาพหลัก querySelector ของเดิมยังได้ภาพหลัก) */
    im.className = img.className
    im.alt = ''
    im.decoding = 'async'
    im.draggable = false
    box.append(im)
    track.append(box)
    return [side, im]
  }))

  const pos = { x: 0, y: 0 }
  const zoom = { s: 1, tx: 0, ty: 0 }
  let fade = 1
  let anim = null
  let committing = false
  let pendingSync = false
  let g = null
  let lastTap = null
  let suppressClick = false
  const pts = new Map()

  const canPrev = () => index() > 0
  const canNext = () => index() < count() - 1

  const render = () => {
    const p = dismissProgress(pos.y, innerHeight)
    track.style.transform = pos.x || pos.y ? `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${1 - 0.2 * p})` : ''
    img.style.transform = zoom.s !== 1 || zoom.tx || zoom.ty ? `translate3d(${zoom.tx}px, ${zoom.ty}px, 0) scale(${zoom.s})` : ''
    if (fade < 1) root.style.setProperty('--vw-fade', fade.toFixed(3))
    else root.style.removeProperty('--vw-fade')
    stage.classList.toggle('is-zoomed', zoom.s > 1.01)
  }

  const setPeeks = () => {
    for (const [side, im] of peeks) {
      const ok = side < 0 ? canPrev() : canNext()
      const src = ok ? peekSrc(side) || '' : ''
      if (src && im.getAttribute('src') !== src) im.src = src
      else if (!src) im.removeAttribute('src')
    }
  }

  const resetAll = () => {
    anim?.stop(); anim = null
    pts.clear() // ปิดกล่องกลางท่าทาง pointerup ไม่มาถึง · ค้างแล้วเปิดใหม่นับเป็น 2 นิ้ว (2 พ.ย.)
    pos.x = 0; pos.y = 0
    Object.assign(zoom, { s: 1, tx: 0, ty: 0 })
    fade = 1
    track.classList.remove('is-moving')
    render()
  }

  /** เรียกทุกครั้งที่เปลี่ยนรูป (ปุ่ม/คีย์บอร์ด/เปิดใหม่) · ล้างซูม อัปเดตภาพข้างเคียง */
  const sync = () => {
    if (committing) { pendingSync = true; return }
    resetAll()
    setPeeks()
  }

  const geo = () => {
    const r = track.getBoundingClientRect()
    return {
      center: { x: r.left + r.width / 2 - pos.x, y: r.top + r.height / 2 - pos.y },
      box: { w: stage.clientWidth, h: stage.clientHeight },
      size: { w: img.offsetWidth, h: img.offsetHeight },
    }
  }

  const settleZoom = (velo = { vx: 0, vy: 0 }) => {
    const { size, box } = g?.geo || geo()
    let s = clampScale(zoom.s)
    if (s < 1.01) s = 1
    /* ปล่อยตอนเลื่อนภาพซูม: ไหลต่อตามความเร็วแล้วหยุดที่ขอบภาพ */
    const tx = s === 1 ? 0 : clampPan(zoom.tx + project(velo.vx, 0.995), size.w, s, box.w)
    const ty = s === 1 ? 0 : clampPan(zoom.ty + project(velo.vy, 0.995), size.h, s, box.h)
    anim = spring({ s: [zoom.s, s], tx: [zoom.tx, tx, velo.vx], ty: [zoom.ty, ty, velo.vy] }, (c) => { Object.assign(zoom, c); render() }, null)
  }

  const zoomTo = (s, focal) => {
    const { size, box } = geo()
    const fx = focal ? focal.x : 0
    const fy = focal ? focal.y : 0
    const tx = s === 1 ? 0 : clampPan(zoomAbout(zoom.s, zoom.tx, s, fx), size.w, s, box.w)
    const ty = s === 1 ? 0 : clampPan(zoomAbout(zoom.s, zoom.ty, s, fy), size.h, s, box.h)
    anim?.stop()
    anim = spring({ s: [zoom.s, s], tx: [zoom.tx, tx], ty: [zoom.ty, ty] }, (c) => { Object.assign(zoom, c); render() }, null)
  }

  const commit = (delta, vx, width) => {
    committing = true
    const done = async () => {
      onPage(delta)
      /* รอภาพหลักใหม่พร้อมก่อนดึงแถบกลับ ไม่งั้นกระพริบว่าง (ภาพข้างเคียงโหลดไว้แล้ว ส่วนใหญ่เร็ว) */
      await Promise.race([img.decode?.().catch(() => {}), new Promise((r) => setTimeout(r, 160))])
      committing = false
      resetAll()
      setPeeks()
      pendingSync = false
    }
    anim = spring({ x: [pos.x, -delta * width, vx] }, (c) => { pos.x = c.x; render() }, done, 0.3)
    anim.commit = true
  }

  const dismiss = (vy) => {
    const h = innerHeight
    anim = spring({ y: [pos.y, h, vy] }, (c) => { pos.y = c.y; fade = 1 - dismissProgress(pos.y, h); render() }, () => {
      onClose()
      resetAll()
    }, 0.3)
  }

  const springBack = (vx, vy) => {
    anim = spring({ x: [pos.x, 0, vx], y: [pos.y, 0, vy], f: [fade, 1] }, (c) => { pos.x = c.x; pos.y = c.y; fade = c.f; render() }, () => track.classList.remove('is-moving'))
  }

  const begin = (t) => {
    const p = [...pts.values()]
    g = {
      t0: t, start: { ...p[0] }, axis: null, mode: null, moved: false,
      samples: [{ t, x: p[0].x, y: p[0].y }],
      width: track.offsetWidth + GAP, height: innerHeight,
      x0: pos.x, y0: pos.y, z0: { ...zoom }, s0: scroller ? scroller.scrollTop : 0,
      geo: geo(), mouse: g?.mouse,
    }
    if (p.length >= 2) {
      g.mode = 'pinch'; g.moved = true
      g.d0 = dist(p[0], p[1]) || 1
      g.m0 = mid(p[0], p[1])
    } else if (zoom.s > 1.01) g.mode = 'pan'
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.target.closest?.('button, a, input, select, textarea')) return
    if (anim?.commit) anim.finish()
    else anim?.stop()
    anim = null
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try { stage.setPointerCapture(e.pointerId) } catch { /* pointer ปลอม/หายไปแล้ว */ }
    /* นิ้วที่สองแตะระหว่างลากเปลี่ยนรูป: ดึงแถบกลับก่อน แล้วเริ่มบีบ */
    if (pts.size >= 2 && (pos.x || pos.y)) { pos.x = 0; pos.y = 0; fade = 1; track.classList.remove('is-moving'); render() }
    begin(e.timeStamp)
    g.mouse = e.pointerType === 'mouse'
  })

  stage.addEventListener('pointermove', (e) => {
    if (!g || !pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = [...pts.values()]
    if (g.mode === 'pinch' && p.length >= 2) {
      const m = mid(p[0], p[1])
      const s = clampScale((g.z0.s * dist(p[0], p[1])) / g.d0, 0.75, 5)
      const fx = g.m0.x - g.geo.center.x
      const fy = g.m0.y - g.geo.center.y
      zoom.s = s
      zoom.tx = zoomAbout(g.z0.s, g.z0.tx, s, fx) + (m.x - g.m0.x)
      zoom.ty = zoomAbout(g.z0.s, g.z0.ty, s, fy) + (m.y - g.m0.y)
      render()
      return
    }
    const dx = p[0].x - g.start.x
    const dy = p[0].y - g.start.y
    g.samples.push({ t: e.timeStamp, x: p[0].x, y: p[0].y })
    if (g.samples.length > 24) g.samples.shift()
    if (!g.axis) {
      g.axis = lockAxis(dx, dy)
      if (!g.axis) return
      g.moved = true
      if (!g.mode) {
        g.mode = gestureMode({ pointers: 1, scale: zoom.s, axis: g.axis, dy, scrolled: g.s0 > 0 })
        /* เมาส์: ลากเปลี่ยนรูป/ปิดไม่เป็นธรรมชาติ ใช้ปุ่มแทน (ยังดับเบิลคลิกซูม + ลากภาพที่ซูมได้) */
        if (g.mouse && g.mode !== 'pan') g.mode = 'none'
        if (g.mode === 'page' || g.mode === 'dismiss') track.classList.add('is-moving')
      }
    }
    const { size, box } = g.geo
    switch (g.mode) {
      case 'pan':
        zoom.tx = softPan(g.z0.tx + dx, size.w, zoom.s, box.w)
        zoom.ty = softPan(g.z0.ty + dy, size.h, zoom.s, box.h)
        break
      case 'page':
        pos.x = dragOffset(g.x0 + dx, { canPrev: canPrev(), canNext: canNext(), width: g.width })
        break
      case 'dismiss':
        pos.y = dy > 0 ? dy : rubberband(dy, g.height)
        pos.x = dx * 0.6
        fade = 1 - dismissProgress(pos.y, g.height)
        break
      case 'scroll':
        if (scroller) scroller.scrollTop = g.s0 - dy
        else pos.y = rubberband(dy, g.height)
        break
      default:
        return
    }
    render()
  })

  const end = (e) => {
    if (!pts.has(e.pointerId)) return
    pts.delete(e.pointerId)
    if (!g) return
    const cancel = e.type === 'pointercancel'
    if (g.mode === 'pinch') {
      /* เหลือนิ้วเดียว: ซูมค้าง = เลื่อนภาพต่อ · ไม่ซูม = ไม่ทำอะไรจนกว่าจะยกนิ้ว */
      if (pts.size === 1) {
        /* บีบเล็กกว่า 1 เท่า/ใหญ่เกินกำหนด: เด้งเข้าช่วงทันที ไม่รอยกนิ้วสุดท้าย */
        const inRange = zoom.s > 1.01 && zoom.s <= MAX_SCALE
        if (!inRange) settleZoom()
        begin(e.timeStamp)
        g.moved = true
        if (!inRange) g.mode = 'none'
        return
      }
      if (pts.size === 0) { settleZoom(); g = null }
      return
    }
    if (pts.size) return
    g.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY })
    const v = velocity(g.samples)
    const dy = e.clientY - g.start.y
    if (!g.moved) {
      if (!cancel && e.timeStamp - g.t0 < 300) {
        const tap = { t: e.timeStamp, x: e.clientX, y: e.clientY }
        if (isDoubleTap(lastTap, tap)) {
          lastTap = null
          const c = geo().center
          zoomTo(zoom.s > 1.01 ? 1 : TAP_ZOOM, { x: tap.x - c.x, y: tap.y - c.y })
        } else lastTap = tap
      }
      g = null
      return
    }
    suppressClick = true
    setTimeout(() => { suppressClick = false }, 60)
    const mode = g.mode
    const width = g.width
    const height = g.height
    g = null
    if (mode === 'pan') return settleZoom(cancel ? undefined : v)
    if (mode === 'page') {
      const delta = cancel ? 0 : decidePage({ dx: pos.x, vx: v.vx, width, canPrev: canPrev(), canNext: canNext() })
      return delta ? commit(delta, v.vx, width) : springBack(v.vx, 0)
    }
    if (mode === 'dismiss') {
      return !cancel && decideDismiss({ dy, vy: v.vy, height }) ? dismiss(v.vy) : springBack(v.vx, v.vy)
    }
    if (mode === 'scroll') {
      if (scroller && !cancel && Math.abs(v.vy) > 150) scroller.scrollBy({ top: -project(v.vy, 0.995), behavior: reduced() ? 'auto' : 'smooth' })
      if (!scroller) springBack(0, v.vy)
    }
  }
  stage.addEventListener('pointerup', end)
  stage.addEventListener('pointercancel', end)
  /* ลากเสร็จแล้วอย่าให้ click ตามมาปิดหน้าต่าง/กดปุ่ม */
  root.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault() } }, true)
  /* ดับเบิลคลิกเมาส์ใช้ทางเดียวกับแตะสองครั้ง ไม่ให้เบราว์เซอร์เลือกข้อความ */
  stage.addEventListener('dblclick', (e) => e.preventDefault())

  return { sync, reset: resetAll, get zoom() { return zoom.s } }
}
