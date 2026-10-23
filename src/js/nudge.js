/* มุมจอ 2 ฝั่ง ขึ้นทุกหน้า (อาร์ตสั่ง 21 ต.ค. 2026)
   ซ้ายล่าง = การ์ดเด้งชวนไปหน้าอื่น สลับเรื่องเอง · ขวาล่าง = ปุ่มลอย LINE กับโทร (จอคอม · มือถือใช้แถบล่างเดิม)
   การ์ดไม่ชวนไปหน้าที่เปิดอยู่ · ปิดแล้วเงียบ 1 วัน · ชี้หรือโฟกัสแล้วหยุดสลับ · ตั้งค่าลดการเคลื่อนไหว = ไม่สลับ ไม่เด้ง */

const clean = (p = '/') => {
  const path = String(p).split(/[?#]/)[0] || '/'
  return path.endsWith('/') ? path : path + '/'
}

/** การ์ดที่ควรโชว์ในหน้านี้ · ตัดหน้าที่เปิดอยู่ออก */
export const nudgesFor = (items, path) => items.filter((x) => clean(x.href) !== clean(path))

/** การ์ดถัดไปแบบวนรอบ · ไม่มีการ์ด = -1 */
export const nextNudge = (count, i) => (count > 0 ? (i + 1) % count : -1)

/** เลื่อนพ้น hero แล้วหรือยัง (กล่องของ hero เทียบกับจอ) · การ์ดขึ้นหลังจากนี้ จะได้ไม่บังปุ่มใน hero */
export const pastHero = (rect) => rect.bottom <= 0

/** กล่องสองกล่อง (left/top/right/bottom) ทับกันไหม · ชิดขอบพอดีไม่นับ */
export const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/* ของที่กดได้จริงในเนื้อหา · รวม summary (อ่านเพิ่มเติม) และกล่องเลื่อนที่กด Tab เข้าได้ (tabindex=0)
   ไม่รวม main/section ที่ได้โฟกัสจากโค้ด (tabindex=-1) · ตรวจซ้ำ 23 ต.ค.: ปิดการ์ดแนะนำแล้วโฟกัสไป main → ปุ่มลอยหายทั้งหน้า */
export const HIT = 'a[href], button, input, select, textarea, summary, [role="tab"], [tabindex="0"]'
/** ตัวที่โฟกัสอยู่ควรทำให้ปุ่มลอยหลบไหม */
export const blocksFloat = (el) => !!el && el.matches(HIT)
/** ปุ่มลอยควรหลบไหม · stacks = ผลของ elementsFromPoint ทีละจุดใต้ปุ่มลอย · หลบเมื่อเจอปุ่ม/ลิงก์ของเนื้อหา (ไม่ใช่ของปุ่มลอยเอง) */
export const dodgeFrom = (stacks, floats) => stacks.some((stack) => stack.some((el) => !floats.contains(el) && el.closest?.(HIT)))

export const QUIET_MS = 24 * 60 * 60 * 1000

/** ค่าที่เก็บไว้ตอนกดปิด (เวลาเป็นเลข ms) ยังไม่ครบเวลาเงียบ = ยังไม่โชว์ */
export const isDismissed = (stored, now, quiet = QUIET_MS) => {
  const t = Number(stored)
  return stored != null && Number.isFinite(t) && now - t < quiet
}

const KEY = 'td-nudge-off'
const read = () => { try { return localStorage.getItem(KEY) } catch { return null } }
const write = (v) => { try { localStorage.setItem(KEY, v) } catch { /* โหมดส่วนตัว เก็บไม่ได้ก็แค่ขึ้นใหม่รอบหน้า */ } }

export function initFloats({ every = 7000 } = {}) {
  const root = document.querySelector('[data-floats]')
  if (!root) return
  const cta = root.querySelector('[data-float-cta]')
  const box = root.querySelector('[data-nudge]')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const html = document.documentElement

  /* ขึ้นหลังเลื่อนพ้นช่วงแรกของหน้า · ถึง footer ซ่อน เพราะ footer มีช่องทางติดต่อชุดเดียวกันอยู่แล้ว */
  let scrolled = false
  let atFooter = false
  const sync = () => {
    cta?.classList.toggle('is-on', scrolled && !atFooter)
    box?.classList.toggle('is-away', atFooter)
  }
  const onScroll = () => {
    const s = window.scrollY > 240
    if (s !== scrolled) { scrolled = s; sync() }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  /* ปุ่มลอยหลบ (โปร่งและกดทะลุได้) เมื่อทับปุ่ม/ลิงก์ในเนื้อหา หรือทับตัวที่กำลังโฟกัส (WCAG 2.4.11 · ตรวจหน้าแรก 22 ต.ค.: ทับลิงก์ส่วน 11 และปุ่มในกล่องส้ม) */
  const wide = window.matchMedia('(min-width: 1024px)')
  let dodge = false
  let raf = 0
  let boxDodge = false
  const check = () => {
    raf = 0
    /* การ์ดแนะนำ (ทุกขนาดจอ · มือถืออยู่เหนือแถบล่าง): หลบเมื่อทับตัวที่กำลังโฟกัส (WCAG 2.4.11 · ตรวจ 23 ต.ค.) */
    if (box?.isConnected && box.classList.contains('is-on')) {
      const f = document.activeElement
      const b = box.getBoundingClientRect()
      const next = !!b.width && blocksFloat(f) && !box.contains(f) && overlaps(b, f.getBoundingClientRect())
      if (next !== boxDodge) { boxDodge = next; box.classList.toggle('is-dodge', next) }
    }
    if (!cta || !cta.classList.contains('is-on') || !wide.matches) return
    const r = cta.getBoundingClientRect()
    if (!r.width) return
    const xs = [r.left + 8, (r.left + r.right) / 2, r.right - 8]
    const ys = [r.top + 8, (r.top + r.bottom) / 2, r.bottom - 8]
    const stacks = xs.flatMap((x) => ys.map((y) => document.elementsFromPoint(x, y)))
    const focused = document.activeElement
    const onFocus = blocksFloat(focused) && !root.contains(focused) && overlaps(r, focused.getBoundingClientRect())
    const next = onFocus || dodgeFrom(stacks, root)
    if (next !== dodge) { dodge = next; cta.classList.toggle('is-dodge', dodge) }
  }
  const later = () => { if (!raf) raf = requestAnimationFrame(check) }
  window.addEventListener('scroll', later, { passive: true })
  window.addEventListener('resize', later, { passive: true })
  document.addEventListener('focusin', later)
  document.addEventListener('focusout', later)
  /* เลย์เอาต์ขยับโดยไม่เลื่อนจอ (FAQ กาง · hero สลับ · ดูคำถามเพิ่ม) ก็ตรวจใหม่ */
  if ('ResizeObserver' in window) new ResizeObserver(later).observe(document.body)

  const footer = document.querySelector('footer')
  if (footer && 'IntersectionObserver' in window) {
    new IntersectionObserver((list) => { atFooter = list[list.length - 1].isIntersecting; sync() }, { rootMargin: '0px 0px -80px 0px' }).observe(footer)
  }

  if (!box || isDismissed(read(), Date.now())) return
  const all = [...box.querySelectorAll('[data-nudge-item]')]
  const items = nudgesFor(all.map((el) => ({ el, href: el.getAttribute('href') || '' })), location.pathname).map((x) => x.el)
  all.forEach((el) => { if (!items.includes(el)) el.remove() })
  if (!items.length) return

  const count = box.querySelector('[data-nudge-count]')
  let i = 0
  let timer = 0
  let held = false
  let closed = false
  const show = (n) => {
    items.forEach((el, k) => { el.hidden = k !== n })
    if (count) count.textContent = `${n + 1}/${items.length}`
  }
  /* แถบเวลาเริ่มใหม่ทุกครั้งที่นับใหม่ ให้คนเห็นว่าอีกนานแค่ไหนการ์ดจะเปลี่ยน */
  const tick = () => { box.classList.remove('is-tick'); void box.offsetWidth; box.classList.add('is-tick') }
  box.style.setProperty('--nudge-every', `${every}ms`)
  box.classList.toggle('is-still', reduce || items.length < 2)
  const stop = () => { clearInterval(timer); timer = 0 }
  const play = () => {
    stop()
    if (closed || reduce || held || items.length < 2) return
    tick()
    timer = setInterval(() => { i = nextNudge(items.length, i); show(i); tick() }, every)
  }
  const hold = (on) => { held = on; box.classList.toggle('is-held', on); play() }
  box.addEventListener('mouseenter', () => hold(true))
  box.addEventListener('mouseleave', () => hold(box.contains(document.activeElement)))
  box.addEventListener('focusin', () => hold(true))
  box.addEventListener('focusout', (e) => { if (!box.contains(e.relatedTarget)) hold(false) })
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()))

  box.querySelector('[data-nudge-close]')?.addEventListener('click', () => {
    closed = true
    stop()
    /* ปุ่มปิดกำลังจะหายไป · ย้ายโฟกัสไปที่ปุ่ม/ลิงก์แรกที่อยู่ในจอตอนนี้ กด Tab ต่อจากตรงที่อ่านอยู่
       ไม่ใช่ <main> ทั้งก้อน ที่ทำให้ Tab ถัดไปเด้งกลับไปต้นหน้า (agent a11y 23 ต.ค.) */
    const main = document.getElementById('main')
    if (main && box.contains(document.activeElement)) {
      const near = [...main.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].find((el) => {
        const r = el.getBoundingClientRect()
        return r.width && r.top >= 0 && r.bottom <= innerHeight && !el.closest('[inert], [hidden]')
      })
      if (near) near.focus({ preventScroll: true })
      else {
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
        main.focus({ preventScroll: true })
      }
    }
    write(String(Date.now()))
    box.classList.remove('is-on')
    box.addEventListener('transitionend', () => box.remove(), { once: true })
    setTimeout(() => box.remove(), 400)
  })

  /* เด้งขึ้นเมื่อเลื่อนพ้น hero (ส่วนแรกของหน้า) แล้วเท่านั้น · เดิมตั้งเวลา 6 วิ แล้วไปบังปุ่มใน hero ที่จอ 375 และ 1024 (22 ต.ค. 2026)
     หน้าที่ไม่มี hero ขึ้นเมื่อเลื่อนลง 600px · ไม่ขึ้นทับตอนเปิดรูปขยาย */
  let opened = false
  const hero = document.querySelector('[data-hero-team], #main > section, #main > .hero-wrap')
  const open = () => {
    if (opened) return
    opened = true
    window.removeEventListener('scroll', onFirstScroll)
    box.hidden = false
    show(i)
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('is-on')))
    play()
  }
  const ready = () => (hero ? pastHero(hero.getBoundingClientRect()) : window.scrollY > 600)
  const onFirstScroll = () => { if (ready() && !html.classList.contains('lb-on')) open() }
  window.addEventListener('scroll', onFirstScroll, { passive: true })
  onFirstScroll()
}
