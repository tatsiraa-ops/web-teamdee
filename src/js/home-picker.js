import uses from '../data/uses.json'
import pricing from '../data/pricing.json'
import routes from '../data/routes.json'
import { makeUrl } from './routes.js'
import { planFor } from './home-plan.js'
import { visibleIndexes } from './real-grid.js'

const url = makeUrl(routes)

/* ตัวช่วยเลือก 2 ขั้นหน้าแรก · เปลี่ยนคำแนะนำกับลิงก์คิดราคาตามที่เลือก (ตรรกะอยู่ใน home-plan.js มีเทส) */
export function initHomePicker() {
  const form = document.getElementById('homePick')
  if (!form) return
  const $ = (sel) => form.querySelector(sel)
  const calc = $('[data-pick-calc]')
  const render = () => {
    const p = planFor(uses, pricing, $('input[name="use"]:checked')?.value, $('input[name="band"]:checked')?.value)
    if (!p) return
    $('[data-pick-name]').textContent = p.main.name
    $('[data-pick-qty]').textContent = p.qtyText
    calc.textContent = p.ctaText
    $('[data-pick-when]').textContent = p.main.when
    $('[data-pick-why]').textContent = p.main.why
    const alts = $('[data-pick-alts]')
    alts.hidden = !p.alts.length
    alts.replaceChildren('หรือดู', ...p.alts.map((a) => Object.assign(document.createElement('a'), { href: url('products', a.id), textContent: a.name })))
    calc.href = url('calculations') + p.calcQuery
  }
  form.addEventListener('change', render)
  /* ไม่มี JS ฟอร์มส่งแบบ GET ไปหน้าคิดราคาได้ · มี JS ใช้ลิงก์ที่คำนวณไว้แทน */
  form.addEventListener('submit', (e) => { e.preventDefault(); location.href = calc.href })
  render()
}

/* เนื้อหาค่อยขึ้นตอนเลื่อนถึง · ใส่ html.rv ก่อน แล้วค่อยเปิดทีละชิ้น · ขอลดการเคลื่อนไหว = ไม่ทำเลย */
export function initReveal() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  const els = document.querySelectorAll('[data-rv]')
  const io = new IntersectionObserver((list) => {
    for (const en of list) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
  }, { rootMargin: '0px 0px -8% 0px' })
  /* ชิ้นที่อยู่ในจอตั้งแต่แรกไม่ต้องรอ ไม่งั้นจะกะพริบหายแล้วโผล่ */
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('in')
    else io.observe(el)
  }
  document.documentElement.classList.add('rv')
}

/* แถบผ้า · ปุ่มซ้ายขวาเลื่อนทีละการ์ด ปิดปุ่มเมื่อสุดทาง */
export function initFabricRail() {
  const rail = document.querySelector('[data-fab-rail]')
  if (!rail) return
  const prev = document.querySelector('[data-fab-prev]')
  const next = document.querySelector('[data-fab-next]')
  const step = () => (rail.firstElementChild?.getBoundingClientRect().width || 300) + 18
  const sync = () => {
    prev.disabled = rail.scrollLeft < 4
    next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 4
  }
  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: smooth }))
  next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: smooth }))
  rail.addEventListener('scroll', sync, { passive: true })
  addEventListener('resize', sync)
  sync()
}

/* แผงกลุ่มงาน · ชี้หรือโฟกัสแผงไหน แผงนั้นขยายค้างไว้ (ไม่หดกลับตอนเมาส์ออก ไม่งั้นแผงกระพือไปมา) */
export function initUsePanels() {
  const wrap = document.querySelector('[data-use-panels]')
  if (!wrap) return
  const panels = [...wrap.children]
  const open = (p) => { for (const x of panels) x.classList.toggle('is-on', x === p) }
  for (const p of panels) {
    p.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') open(p) })
    p.addEventListener('focusin', () => open(p))
  }
}

/* ---------- หน้าแรก v4 ---------- */

/* hero 2 สไลด์ · เปลี่ยนเมื่อกดเท่านั้น (ไม่เลื่อนเอง ไม่ต้องมีปุ่มหยุด) · ลูกศรซ้ายขวาสลับแท็บได้ */
export function initHeroSlides() {
  const tabs = [...document.querySelectorAll('[data-slide-tab]')]
  if (!tabs.length) return
  const show = (id, focus) => {
    for (const t of tabs) {
      const on = t.dataset.slideTab === id
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      if (on && focus) t.focus()
    }
    for (const s of document.querySelectorAll('[data-slide]')) s.hidden = s.dataset.slide !== id
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(t.dataset.slideTab))
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
      show(n.dataset.slideTab, true)
    })
  })
}

/* แถวเลื่อนซ้ายขวา (โลโก้ รูปลูกค้า ผลงาน แถบผ้า) · ปุ่มเลื่อนทีละประมาณ 80% ของแถว · ปิดปุ่มเมื่อสุดทาง */
export function initRails() {
  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  for (const rail of document.querySelectorAll('[data-rail]')) {
    const box = rail.closest('.hm-railbox') || rail.parentElement
    const prev = box.querySelector('[data-rail-prev]')
    const next = box.querySelector('[data-rail-next]')
    if (!prev || !next) continue
    const step = () => Math.max(200, rail.clientWidth * 0.8)
    /* aria-disabled ไม่ใช่ disabled · ปุ่มที่ disabled ตอนโฟกัสอยู่ทำให้โฟกัสหลุดไปต้นหน้า (agent a11y 23 ต.ค.) */
    const off = (btn, on) => btn.setAttribute('aria-disabled', String(on))
    const sync = () => {
      const atStart = rail.scrollLeft < 4
      const atEnd = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 4
      off(prev, atStart)
      off(next, atEnd)
      box.classList.toggle('is-static', atStart && atEnd)
    }
    const go = (btn, dir) => btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-disabled') === 'true') return
      rail.scrollBy({ left: dir * step(), behavior: smooth })
    })
    go(prev, -1)
    go(next, 1)
    rail.addEventListener('scroll', sync, { passive: true })
    addEventListener('resize', sync)
    sync()
  }
}

/* แกลเลอรีแบบเสื้อพิมพ์ลายหน้าแรก · กรองตามกลุ่มลูกค้า */
export function initGalleryFilter() {
  const bar = document.querySelector('[data-gallery-filter]')
  if (!bar) return
  const items = [...document.querySelectorAll('#pickGrid [data-uses]')]
  const count = document.querySelector('[data-gallery-count]')
  /* หน้าแรกโชว์ไม่เกิน 10 แบบ (มือถือ 6 แบบ ให้หน้าสั้นลง · อาร์ตเคาะ 23 ต.ค. ข้อ B) ที่เหลือดูต่อในหน้าแบบเสื้อ */
  const small = window.matchMedia('(max-width: 767px)')
  const apply = (b) => {
    const id = b.dataset.use
    const limit = small.matches ? 6 : 10
    const match = items.filter((it) => !id || it.dataset.uses.split(' ').includes(id))
    for (const it of items) it.hidden = !match.slice(0, limit).includes(it)
    if (count) count.textContent = `${id ? b.textContent.trim() : 'ทุกกลุ่มลูกค้า'} · ${Math.min(limit, match.length)} จาก ${match.length} แบบ`
  }
  const current = () => bar.querySelector('[aria-pressed="true"]') || bar.querySelector('[data-use]')
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-use]')
    if (!b) return
    for (const x of bar.querySelectorAll('[data-use]')) x.setAttribute('aria-pressed', String(x === b))
    apply(b)
  })
  small.addEventListener('change', () => apply(current()))
  /* ตอนเปิดหน้าไม่ให้ช่องสถานะ (aria-live) ประกาศเอง · ประกาศเฉพาะตอนผู้ใช้กดกรอง */
  const live = count?.getAttribute('aria-live')
  count?.setAttribute('aria-live', 'off')
  apply(current())
  if (count && live) requestAnimationFrame(() => count.setAttribute('aria-live', live))
}

/* แถบโลโก้ · ปุ่มหยุด/เล่น (WCAG 2.2.2 ของที่เคลื่อนไหวเกิน 5 วินาทีต้องหยุดได้) */
/* แท็บผลงาน 4 หมวด · ลูกศรซ้ายขวาสลับแท็บ · เปลี่ยนแท็บแล้วจัดปุ่มเลื่อนของแถวใหม่ */
export function initTabs() {
  const list = document.querySelector('[data-tabs]')
  if (!list) return
  const tabs = [...list.querySelectorAll('[data-tab]')]
  const show = (t, focus) => {
    for (const x of tabs) {
      const on = x === t
      x.setAttribute('aria-selected', String(on))
      x.tabIndex = on ? 0 : -1
      const panel = document.getElementById(x.getAttribute('aria-controls'))
      if (panel) panel.hidden = !on
    }
    if (focus) t.focus()
    dispatchEvent(new Event('resize'))
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(t))
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      show(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true)
    })
  })
}

/* แถบโลโก้หยุดเมื่ออยู่นอกจอ */
/* แถบที่วิ่งวน (โลโก้ลูกค้า · manifesto) หยุดเมื่อพ้นจอ ไม่กินเครื่องเปล่าๆ */
export function initMarqueeOffscreen() {
  if (!('IntersectionObserver' in window)) return
  const io = new IntersectionObserver((list) => { for (const en of list) en.target.classList.toggle('is-off', !en.isIntersecting) })
  for (const m of document.querySelectorAll('[data-marquee]')) io.observe(m)
}


/* กริดผลงานจริงหน้าแรก · กรองตามกลุ่มลูกค้า · คอม 8 รูป มือถือ 6 รูป (ตรรกะใน real-grid.js มีเทส) */
export function initRealGrid() {
  const bar = document.querySelector('[data-real-filter]')
  const items = [...document.querySelectorAll('#realGrid > li')]
  if (!bar || !items.length) return
  const count = document.querySelector('[data-real-count]')
  const small = window.matchMedia('(max-width: 767px)')
  const cats = items.map((li) => li.dataset.cat)
  const apply = (b, say = false) => {
    const show = new Set(visibleIndexes(cats, b.dataset.cat, small.matches ? 6 : 8))
    items.forEach((li, i) => { li.hidden = !show.has(i) })
    if (say && count) count.textContent = `${b.textContent.trim()} · ${show.size} รูป`
  }
  const current = () => bar.querySelector('[aria-pressed="true"]') || bar.querySelector('[data-cat]')
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]')
    if (!b) return
    for (const x of bar.querySelectorAll('[data-cat]')) x.setAttribute('aria-pressed', String(x === b))
    apply(b, true)
  })
  small.addEventListener('change', () => apply(current()))
  apply(current())
}
