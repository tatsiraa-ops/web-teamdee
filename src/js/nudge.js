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

/** หน้าที่สารบัญติดจอมีปุ่ม LINE อยู่แล้ว (หน้าสินค้า · หน้ากลุ่มลูกค้า) ไม่ขึ้นการ์ดแนะนำและปุ่มลอยซ้ำ
    ตรวจ UI 2 พ.ย.: การ์ดแนะนำ + ปุ่มลอย + แถบติดบน กิน 29% ของจอ 900px และบังปุ่ม/ราคา */
export const quietFloats = (doc) => !!doc.querySelector('.ab-toc__cta')

/** เปิดทำการอยู่ไหม ตามเวลาไทย · hours แบบ schema.org "Mo-Su 08:30-21:00" (site.json openingHours) · อ่านไม่ออก = ไม่อ้างว่าเปิด */
export const openNow = (now, hours) => {
  const m = /(\d{2}):(\d{2})-(\d{2}):(\d{2})/.exec(hours || "")
  if (!m) return false
  const [h, mi] = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false }).split(":").map(Number)
  const t = h * 60 + mi
  return t >= +m[1] * 60 + +m[2] && t < +m[3] * 60 + +m[4]
}

/** ระยะที่ต้องยกปุ่มลอยขึ้นเหนือป้ายคุกกี้ · rect = ขอบของป้าย (null = ไม่ขึ้น) · vh = ความสูงจอ */
/** ซ้อนกันในแนวนอนไหม (ใช้ตัดสินว่าปุ่มลอยฝั่งนั้นต้องยกหนีป้ายคุกกี้ไหม) */
export const overlapsX = (a, b) => a.left < b.right && b.left < a.right

export const liftFor = (rect, vh) => (rect ? Math.max(0, Math.round(vh - rect.top)) : 0)

/** เติมตัวเลขจริงในข้อความการ์ด เช่น {designs} */
export const fillNudge = (text, nums) => text.replace(/\{(\w+)\}/g, (all, k) => (k in nums ? String(nums[k]) : all))

/** ค่าที่เก็บไว้ตอนกดปิด (เวลาเป็นเลข ms) ยังไม่ครบเวลาเงียบ = ยังไม่โชว์ */
export const isDismissed = (stored, now, quiet = QUIET_MS) => {
  const t = Number(stored)
  return stored != null && Number.isFinite(t) && now - t < quiet
}

/* รูปในการ์ดแนะนำ (d05 · fti-team · m08 ~80KB) โหลดเฉพาะการ์ดที่โชว์จริง (ความเร็วมือถือ 30 ต.ค.)
   เทมเพลต (floats.hbs) ใส่ data-src · show() ค่อยตั้ง src ทีละใบ
   ไม่มี JS = การ์ดซ่อนทั้งก้อนอยู่แล้ว (aside hidden) ไม่ต้องมีรูป */

/** ตั้ง src จาก data-src ของรูปใน el (การ์ดที่กำลังโชว์) */
export const loadPics = (el) => {
  for (const img of el?.querySelectorAll('img[data-src]') || []) {
    img.src = img.dataset.src
    img.removeAttribute('data-src')
  }
}

const KEY = 'td-nudge-off'
const read = () => { try { return localStorage.getItem(KEY) } catch { return null } }
const write = (v) => { try { localStorage.setItem(KEY, v) } catch { /* โหมดส่วนตัว เก็บไม่ได้ก็แค่ขึ้นใหม่รอบหน้า */ } }

export function initFloats({ every = 7000 } = {}) {
  /* บรรทัดสถานะในปุ่ม LINE ตามเวลาไทยจริง (อาร์ต 26 ต.ค. ทำให้น่ากด) · ไม่อ้างว่าเปิดอยู่ถ้าอ่านเวลาไม่ออก */
  /* ทุกที่ที่มีบรรทัดสถานะ (ปุ่มขวาจอคอม แถบล่างมือถือ ปุ่มติดต่อบนหัวเว็บ หน้าติดต่อ) · ทำก่อนเช็กปุ่มลอย เพราะหน้าที่ปิดปุ่มลอย (ติดต่อ) ก็มีสถานะ · เวลาทำการอ่านจาก [data-hours] ตัวแรก */
  {
    const hours = document.querySelector("[data-hours]")?.dataset.hours
    const on = openNow(new Date(), hours)
    const from = (/(\d{2}):(\d{2})-/.exec(hours || "") || []).slice(1).map(Number)
    const until = from.length ? `${from[0]}:${String(from[1]).padStart(2, "0")}` : ""
    for (const status of document.querySelectorAll("[data-float-status]")) {
      const short = !!status.closest(".mobilebar")
      status.classList.toggle("is-open", on)
      const t = status.querySelector("[data-float-status-t]")
      if (t) t.textContent = on ? (short ? "ตอบภายใน 5 นาที" : "เปิดอยู่ · ตอบภายใน 5 นาที") : until ? (short ? `ตอบตั้งแต่ ${until} น.` : `ฝากข้อความไว้ ตอบ ${until} น.`) : "ฝากข้อความไว้ได้"
    }
  }

  const root = document.querySelector('[data-floats]')
  if (!root) return
  if (quietFloats(document)) { root.hidden = true; return }
  const cta = root.querySelector('[data-float-cta]')
  const box = root.querySelector('[data-nudge]')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const html = document.documentElement

  /* ขึ้นหลังเลื่อนพ้นช่วงแรกของหน้า · ถึง footer ซ่อน เพราะ footer มีช่องทางติดต่อชุดเดียวกันอยู่แล้ว */
  let scrolled = false
  let atFooter = false
  let inHero = false
  const heroEl = document.querySelector('[data-hero-team], #main > section, #main > .hero-wrap')
  /* ซ้ายกับขวาโผล่พร้อมกันด้วยเงื่อนไขเดียวกัน (อาร์ต 26 ต.ค. "เด้งให้เท่าๆ กัน"): เลื่อนพ้นส่วนแรกของหน้า · ไม่มีส่วนแรก = เลื่อนลง 600px */
  const sync = () => {
    const passed = heroEl ? !inHero : scrolled
    cta?.classList.toggle('is-on', passed && !atFooter)
    /* การ์ดแนะนำหลบทั้งตอนถึง footer และตอนเลื่อนกลับขึ้นมาอยู่ใน hero (ตรวจ 24 ต.ค.: กลับมาทับปุ่ม LINE ของ hero) */
    box?.classList.toggle('is-away', atFooter || inHero)
  }
  const onScroll = () => {
    const s = window.scrollY > (heroEl ? 240 : 600)
    const h = heroEl ? !pastHero(heroEl.getBoundingClientRect()) : false
    if (s !== scrolled || h !== inHero) { scrolled = s; inHero = h; sync() }
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
    const focused = document.activeElement
    const onFocus = blocksFloat(focused) && !root.contains(focused) && overlaps(r, focused.getBoundingClientRect())
    /* หลบเฉพาะตอนบังตัวที่โฟกัสอยู่ (WCAG 2.4.11) · เดิมหลบทุกครั้งที่ทับลิงก์ ทำให้ปุ่มหายเกือบทั้งหน้าที่มีรูปกดได้เต็มหน้า เช่น /project/ (26 ต.ค.)
       (dodgeFrom ยังอยู่ในไฟล์พร้อมเทส ถ้าจะกลับไปใช้) */
    const next = onFocus
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
    /* จอ < 1024 การ์ดถูกซ่อนด้วย CSS (มีแถบล่างแล้ว · 30 ต.ค.) ไม่ต้องโหลดรูป */
    if (!matchMedia('(max-width: 1023px)').matches) loadPics(items[n])
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
  /* คนใช้คีย์บอร์ด: กด Tab ครั้งแรกหยุดสลับการ์ด · Esc ปิดการ์ดได้จากทุกที่ (audit 26 ต.ค. M25 · ไม่ปิดตอนเปิดรูปขยายอยู่) */
  const onKey = (e) => {
    if (e.key === 'Tab' && !closed) { held = true; play() }
    /* Esc ที่ใช้ปิดหน้าต่างอื่น (รีวิว ป๊อปอัป เมนู ตั้งค่าคุกกี้) ไม่นับ · เดิมการ์ดถูกปิดถาวรตามไปด้วย (30 ต.ค.) */
    if (e.key === 'Escape' && !closed && !box.hidden && !html.classList.contains('lb-on') && !document.querySelector('dialog[open], #mobileMenu:not([hidden])') && !e.defaultPrevented) box.querySelector('[data-nudge-close]')?.click()
  }
  document.addEventListener('keydown', onKey)

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
