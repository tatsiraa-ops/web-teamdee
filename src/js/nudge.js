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

export const QUIET_MS = 24 * 60 * 60 * 1000

/** ค่าที่เก็บไว้ตอนกดปิด (เวลาเป็นเลข ms) ยังไม่ครบเวลาเงียบ = ยังไม่โชว์ */
export const isDismissed = (stored, now, quiet = QUIET_MS) => {
  const t = Number(stored)
  return stored != null && Number.isFinite(t) && now - t < quiet
}

const KEY = 'td-nudge-off'
const read = () => { try { return localStorage.getItem(KEY) } catch { return null } }
const write = (v) => { try { localStorage.setItem(KEY, v) } catch { /* โหมดส่วนตัว เก็บไม่ได้ก็แค่ขึ้นใหม่รอบหน้า */ } }

export function initFloats({ delay = 6000, every = 7000 } = {}) {
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
  const footer = document.querySelector('footer')
  if (footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { atFooter = e.isIntersecting; sync() }, { rootMargin: '0px 0px -80px 0px' }).observe(footer)
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
    /* ปุ่มปิดกำลังจะหายไป · ย้ายโฟกัสไปที่เนื้อหาหลัก ไม่ให้คนใช้คีย์บอร์ดหลุดกลับไปต้นหน้า */
    const main = document.getElementById('main')
    if (main && box.contains(document.activeElement)) {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
    }
    write(String(Date.now()))
    box.classList.remove('is-on')
    box.addEventListener('transitionend', () => box.remove(), { once: true })
    setTimeout(() => box.remove(), 400)
  })

  /* เด้งขึ้นเมื่อครบเวลา หรือเลื่อนลงไปก่อนก็ขึ้นเลย อย่างไหนถึงก่อน · ไม่ขึ้นทับตอนเปิดรูปขยาย */
  let opened = false
  const open = () => {
    if (opened) return
    opened = true
    window.removeEventListener('scroll', onFirstScroll)
    box.hidden = false
    show(i)
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('is-on')))
    play()
  }
  const onFirstScroll = () => { if (window.scrollY > 600 && !html.classList.contains('lb-on')) open() }
  window.addEventListener('scroll', onFirstScroll, { passive: true })
  setTimeout(open, delay)
}
