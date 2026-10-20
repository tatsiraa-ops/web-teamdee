import { buildCycle, makeClock, flightFrames } from './hero-cycle.js'

/* hero หน้าแรก · ฉาก A (แบบเสื้อ → ทีมใส่จริง) สลับกับฉาก B (ผนังแบบเสื้อ) วนไปเรื่อยๆ
   ตัวเชื่อมสองฉากคือการ์ดแบบเสื้อ: ตอนเข้า B การ์ดบินกลับไปเป็นช่องหนึ่งบนผนัง
   ตอนออกจาก B ช่องที่ถูกไฮไลต์บินออกมาเป็นการ์ดของคู่ถัดไป (shared element)
   ขยับเฉพาะ transform / scale / rotate / translate / opacity · ไม่มีท่าไหนยาวเกิน 600ms
   หยุดได้ด้วยปุ่ม · หยุดเองเมื่อชี้ที่ภาพ แท็บถูกซ่อน หรือเลื่อนพ้นจอ
   ผู้ใช้ขอลดการเคลื่อนไหว = ไม่เริ่มเลย ค้างฉาก A ที่ HTML เรนเดอร์ไว้ */

/* มาร์กเวลาไว้วัดเฟรมตอนพัฒนาเท่านั้น */
const mark = (name) => import.meta.env?.DEV && performance.mark(`hero:${name}`)

const HOLD_A = 5200
const HOLD_B = 4600
const OUT = 'cubic-bezier(0, 0, 0.2, 1)'
const IN = 'cubic-bezier(0.4, 0, 1, 1)'
const MOVE = 'cubic-bezier(0.4, 0, 0.2, 1)'

export function initHero() {
  const hero = document.querySelector('[data-hero]')
  const data = document.getElementById('heroPairs')
  if (!hero || !data) return
  const pairs = JSON.parse(data.textContent)
  if (!pairs.length || !('animate' in Element.prototype)) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const $ = (s) => hero.querySelector(s)
  const wall = $('[data-wall]')
  const tiles = [...wall.querySelectorAll('.hero-tile')]
  const cols = [...wall.querySelectorAll('[data-col]')]
  const area = $('[data-a]')
  const card = $('[data-design]')
  const cardImg = $('[data-design-img]')
  const photo = $('[data-photo]')
  const photoImg = $('[data-photo-img]')
  const arrow = $('[data-arrow]')
  const note = $('[data-note]')
  const codeEl = $('[data-card-code]')
  const whoEl = $('[data-who]')
  const btn = $('[data-hero-pause]')

  /* ---------- หยุด / เล่น ---------- */
  const clock = makeClock()
  const reasons = new Set()
  const apply = () => {
    const stop = reasons.size > 0
    stop ? clock.pause() : clock.resume()
    for (const a of hero.getAnimations({ subtree: true })) {
      if (stop && a.playState === 'running') a.pause()
      if (!stop && a.playState === 'paused') a.play()
    }
  }
  const hold = (key, on) => {
    on ? reasons.add(key) : reasons.delete(key)
    apply()
  }
  const wait = (ms) =>
    new Promise((done) => {
      clock.reset()
      /* ตั้งเวลาตามที่เหลือจริง ไม่วนเช็กทุก 80ms ฉากถัดไปจะเริ่มตรงจังหวะ */
      const tick = () => {
        const left = ms - clock.elapsed()
        left <= 0 ? done() : setTimeout(tick, Math.min(250, Math.max(16, left)))
      }
      tick()
    })
  const run = (el, frames, opt) => {
    const a = el.animate(frames, { fill: 'both', ...opt })
    if (reasons.size) a.pause()
    return a.finished
  }

  btn.hidden = false
  btn.addEventListener('click', () => {
    const user = !reasons.has('user')
    hold('user', user)
    btn.setAttribute('aria-pressed', String(user))
    btn.querySelector('[data-pause-label]').textContent = user ? 'เล่นภาพเคลื่อนไหว' : 'หยุดภาพเคลื่อนไหว'
    btn.querySelector('[data-ico-pause]').hidden = user
    btn.querySelector('[data-ico-play]').hidden = !user
  })
  /* ชี้ที่ภาพ = อยากดูให้ชัด หยุดให้ก่อน · ตัวหนังสืออยู่ชั้นบน เลยวัดจากตำแหน่งเมาส์แทน pointerenter */
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    const r = area.getBoundingClientRect()
    hold('hover', e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom)
  })
  hero.addEventListener('pointerleave', () => hold('hover', false))
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden))
  /* โหลดมาตอนแท็บถูกซ่อนอยู่แล้ว เบราว์เซอร์ไม่เดินภาพเคลื่อนไหว นาฬิกาก็ต้องหยุดด้วย ไม่งั้นฉากข้ามกัน */
  hold('hidden', document.hidden)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => hold('offscreen', !e.isIntersecting), { threshold: 0.15 }).observe(hero)
  }

  /* ผนังโหลดทีหลัง ไม่แย่งแบนด์วิดท์กับรูปฉากแรก · โหลดแล้วถอดรหัสต่อทันที */
  let wallLoaded = false
  let wallDecoded = null
  const loadWall = () => {
    if (wallLoaded) return
    wallLoaded = true
    for (const t of tiles) {
      const img = t.querySelector('img')
      img.src = img.dataset.src
    }
    wallDecoded = Promise.all(tiles.map((t) => t.querySelector('img').decode().catch(() => {})))
  }
  if (document.readyState === 'complete') setTimeout(loadWall, 1200)
  else addEventListener('load', () => setTimeout(loadWall, 1200), { once: true })

  const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2]

  /* ช่องบนผนังที่การ์ดบินเข้า-ออก ต้องอยู่ฝั่งภาพเท่านั้น ห้ามข้ามตัวหนังสือ
     (การ์ดขาวลอยผ่านหลังตัวหนังสือขาว = ตัวหนังสือหายไปชั่วขณะ)
     เลือกช่องแล้วเปลี่ยนรูปในช่องให้ตรงกับแบบของคู่นั้น ผนังจึงไม่ต้องเรียงตามรหัส */
  const stage = $('[data-stage]')
  const wide = window.matchMedia('(min-width: 1024px)')
  const candidates = () => {
    const h = hero.getBoundingClientRect()
    const s = stage.getBoundingClientRect()
    const minX = wide.matches ? h.left + h.width * 0.56 : s.left + 8
    return tiles.filter((t) => {
      const [x, y] = centre(t.getBoundingClientRect())
      return x > minX && x < s.right - 40 && y > s.top + 40 && y < s.bottom - 40
    })
  }
  const nearest = (list, r) => {
    const [cx, cy] = centre(r)
    return [...list].sort((a, b) => {
      const [ax, ay] = centre(a.getBoundingClientRect())
      const [bx, by] = centre(b.getBoundingClientRect())
      return Math.hypot(ax - cx, ay - cy) - Math.hypot(bx - cx, by - cy)
    })
  }
  const dress = (tile, p) => {
    const img = tile.querySelector('img')
    img.src = p.img
    tile.dataset.code = p.code
  }

  let current = pairs[0].code

  /* โหลดและถอดรหัสรูปของคู่ถัดไปไว้ก่อนถึงคิว
     ถ้าไม่ทำ ตอนการ์ดบินเบราว์เซอร์ยังโชว์รูปคู่เก่าค้าง แล้วสลับกลางทาง (จอ 2x ใช้ไฟล์ 1080 ซึ่งยังไม่เคยโหลด)
     รูปทีมก็โผล่ช้ากว่าจังหวะเฟด */
  const ready = new Map()
  const decode = (url) => {
    const i = new Image()
    i.src = url
    return i.decode().catch(() => {})
  }
  const preload = (p) => {
    if (!ready.has(p.code)) ready.set(p.code, Promise.all([p.img, p.img2x, p.photo].map(decode)))
    return ready.get(p.code)
  }
  const atMost = (promise, ms) => Promise.race([promise, new Promise((r) => setTimeout(r, ms))])

  /* ---------- ฉาก A ---------- */
  const enterA = async (p, fromTile) => {
    mark('A:start')
    cardImg.src = p.img
    cardImg.srcset = `${p.img} 540w, ${p.img2x} 1080w`
    cardImg.alt = `แบบเสื้อรหัส ${p.code} ที่ทีมดีออกแบบ`
    codeEl.textContent = p.code
    whoEl.textContent = p.who
    photoImg.src = p.photo
    photoImg.alt = `${p.who}ใส่เสื้อทีมในวันงานจริง`
    note.hidden = p.confirmed
    current = p.code
    run(photo, [{ opacity: 0 }], { duration: 1 })
    run(arrow, [{ opacity: 0 }], { duration: 1 })
    run(note, [{ opacity: 0 }], { duration: 1 })

    if (fromTile) {
      fromTile.style.visibility = 'hidden'
      /* ล้างท่าเก่าของการ์ดก่อนวัด ไม่งั้นวัดได้ตำแหน่งที่การ์ดจอดอยู่บนผนัง ระยะบินจะเป็นศูนย์ */
      for (const a of card.getAnimations()) a.cancel()
    }
    /* ซ้อนจังหวะ ไม่รอให้ท่าหนึ่งจบก่อนเริ่มอีกท่า · การ์ดนำ ลูกศรตามเมื่อการ์ดใกล้ถึง แล้วรูปทีมตามติด */
    const lead = fromTile ? 380 : 0
    await Promise.all([
      fromTile && run(card, flightFrames(fromTile.getBoundingClientRect(), card.getBoundingClientRect(), '-7deg', '-3deg'), { duration: 600, easing: MOVE }),
      fromTile && run(wall, [{ opacity: 1, scale: 1 }, { opacity: 0.001, scale: 1 }], { duration: 320, delay: 160, easing: IN }),
      run(arrow, [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }], { duration: 250, delay: lead, easing: OUT }),
      run(photo, [{ opacity: 0, translate: '0px 24px' }, { opacity: 1, translate: '0px 0px' }], { duration: 450, delay: lead + 60, easing: OUT }),
      run(note, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: lead + 400, easing: OUT }),
    ])
    if (fromTile) {
      fromTile.style.visibility = ''
      fromTile.classList.remove('is-hi')
    }
    run(photoImg, [{ scale: 1 }, { scale: 1.06 }], { duration: HOLD_A + 900, easing: 'linear' })
    mark('A:end')
  }

  /* ---------- ฉาก B ---------- */
  const toB = async (next) => {
    mark('B:start')
    loadWall()
    /* ผนังขึ้นพร้อมกัน 66 รูป ถ้าเบราว์เซอร์ต้องถอดรหัสตอนวาดเฟรมแรกจะกระตุก ถอดไว้ก่อน */
    wallDecoded ??= Promise.all(tiles.map((t) => t.querySelector('img').decode().catch(() => {})))
    await atMost(wallDecoded, 1500)
    if (next !== null) preload(pairs[next])

    /* เลือกช่องปลายทางก่อน แล้วให้ทุกอย่างเริ่มซ้อนกัน: รูปทีมจางออก · ผนังทยอยขึ้น · การ์ดบินกลับเข้าช่อง
       ผนังเริ่มเลื่อนหลังการ์ดลงแล้ว ไม่งั้นช่องขยับหนีระหว่างบิน การ์ดจะลงคลาด */
    const ranked = nearest(candidates(), card.getBoundingClientRect())
    const home = ranked[0]
    if (home) dress(home, pairs.find((p) => p.code === current))
    for (const a of card.getAnimations()) a.cancel()
    const frames = home && flightFrames(home.getBoundingClientRect(), card.getBoundingClientRect(), '-7deg', '-3deg').reverse()
    await Promise.all([
      run(photo, [{ opacity: 1, translate: '0px 0px' }, { opacity: 0, translate: '0px 12px' }], { duration: 220, easing: IN }),
      run(arrow, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: IN }),
      run(note, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: IN }),
      /* ผนังขึ้นทั้งก้อน: จางเข้า + ถอยกล้องออกเล็กน้อย · ไม่ขยับรายช่อง */
      run(wall, [{ opacity: 0.001, scale: 1.12 }, { opacity: 1, scale: 1 }], { duration: 520, delay: 40, easing: OUT }),
      frames && run(card, frames, { duration: 600, delay: 100, easing: MOVE }),
    ])
    run(card, [{ opacity: 0 }], { duration: 1 })
    /* คอลัมน์วิ่งสวนกันช้าๆ ระหว่างค้างฉาก B · 6 ชั้นเท่านั้น */
    cols.forEach((c) => run(c, [{ translate: '0 0' }, { translate: `0 ${c.dataset.col === 'up' ? '-' : ''}60px` }], { duration: HOLD_B + 1200, easing: 'linear' }))
    mark('B:landed')

    await wait(HOLD_B * 0.55)
    /* ช่องของคู่ถัดไป เลือกจากช่องฝั่งภาพที่ไม่ใช่ช่องเดิม ไม่ไกลจากที่การ์ดจะไปลง */
    const pool = ranked.filter((t) => t !== home).slice(0, 8)
    const target = next === null || !pool.length ? null : pool[Math.floor(Math.random() * pool.length)]
    if (target) {
      await atMost(preload(pairs[next]), 1500)
      dress(target, pairs[next])
    }
    if (target) {
      target.classList.add('is-hi')
      run(target, [{ scale: 1 }, { scale: 1.08 }, { scale: 1.04 }], { duration: 500, easing: OUT })
    }
    await wait(HOLD_B * 0.45)
    return target
  }

  /* ใช้ตรวจจังหวะตอนพัฒนาเท่านั้น ไม่ออกไปกับ build จริง */
  if (import.meta.env?.DEV) window.__hero = { enterA, toB, card, tiles, pairs }

  /* ---------- วน ---------- */
  const cycle = buildCycle(pairs.length)
  ;(async () => {
    let fromTile = null
    for (let k = 0; ; k = (k + 1) % cycle.length) {
      const step = cycle[k]
      if (step.scene === 'A') {
        if (fromTile) await enterA(pairs[step.pair], fromTile)
        preload(pairs[(step.pair + 1) % pairs.length])
        await wait(HOLD_A)
      } else {
        fromTile = await toB(step.next)
      }
    }
  })()
}
