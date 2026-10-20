import uses from '../data/uses.json'
import pricing from '../data/pricing.json'
import routes from '../data/routes.json'
import { makeUrl } from './routes.js'
import { planFor } from './home-plan.js'

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
