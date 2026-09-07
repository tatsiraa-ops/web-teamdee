import '../styles/main.css'
import 'preline/plugins/accordion'
import { initNav } from './nav.js'
import { baht, tierFor, unitPrice } from './lib.js'

initNav()

const calc = document.getElementById('calc')
if (calc) {
  const num = calc.querySelector('#qtyNum')
  const range = calc.querySelector('#qtyRange')
  const out = {
    unit: calc.querySelector('#unitOut'),
    base: calc.querySelector('#baseOut'),
    opt: calc.querySelector('#optOut'),
    tier: calc.querySelector('#tierOut'),
    total: calc.querySelector('#totalOut'),
    save: calc.querySelector('#saveOut'),
  }
  const toBrief = calc.querySelector('#toBrief')
  const qtyBtns = [...calc.querySelectorAll('[data-qty]')]
  const collarBtns = [...calc.querySelectorAll('[data-collar]')]
  const optBtns = [...calc.querySelectorAll('[data-opt]')]
  const techBtns = [...calc.querySelectorAll('[data-tech]')]
  const rows = [...document.querySelectorAll('.tbl-price tbody tr')]
  const bars = [...document.querySelectorAll('.tbl-price .bar')]

  const maxPrice = Math.max(...bars.map((b) => Number(b.dataset.v)))
  for (const b of bars) b.style.setProperty('--w', `${Math.round((Number(b.dataset.v) / maxPrice) * 100)}%`)

  let collar = 0
  let tech = 'พิมพ์ลาย'

  const readQty = () => {
    const v = parseInt(num.value, 10)
    if (Number.isNaN(v)) return 10
    return Math.min(10000, Math.max(10, v))
  }

  const render = () => {
    const qty = readQty()
    const chosen = optBtns.filter((b) => b.getAttribute('aria-pressed') === 'true')
    const opts = chosen.reduce((s, b) => s + Number(b.dataset.opt), 0)
    const base = unitPrice(qty, collar === 1)
    const unit = base + opts
    const start = (collar === 1 ? 329 : 279) + opts
    const tier = tierFor(qty)

    out.unit.textContent = baht(unit)
    out.base.textContent = baht(base)
    out.opt.textContent = baht(opts)
    out.tier.textContent = tier.label
    out.total.textContent = baht(unit * qty)
    out.save.textContent = baht(Math.max(0, start - unit))

    // แถบเลื่อนรับได้ถึง 600 ถ้าพิมพ์เกินให้ปักหมุดไว้ที่สุดราง
    range.value = String(Math.min(600, Math.max(10, qty)))
    for (const b of qtyBtns) b.setAttribute('aria-pressed', String(Number(b.dataset.qty) === qty))

    const idx = rows.findIndex((r) => r.querySelector('th').textContent.trim() === tier.label)
    rows.forEach((r, i) => r.classList.toggle('is-on', i === idx))

    // ส่งค่าต่อไปหน้าปรึกษาฟรี จะได้ไม่ต้องกรอกซ้ำ
    const p = new URLSearchParams({
      qty: String(qty),
      collar: String(collar),
      tech,
      opts: chosen.map((b) => b.dataset.name).join(','),
      unit: String(unit),
    })
    toBrief.href = `/pages/brief.html?${p}`
  }

  num.addEventListener('input', render)
  range.addEventListener('input', () => { num.value = range.value; render() })
  for (const b of qtyBtns) b.addEventListener('click', () => { num.value = b.dataset.qty; render() })
  for (const b of collarBtns) b.addEventListener('click', () => {
    collar = Number(b.dataset.collar)
    for (const x of collarBtns) x.setAttribute('aria-pressed', String(x === b))
    render()
  })
  for (const b of optBtns) b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))
    render()
  })
  for (const b of techBtns) b.addEventListener('click', () => {
    tech = b.dataset.tech
    for (const x of techBtns) x.setAttribute('aria-pressed', String(x === b))
    render()
  })

  render()
}
