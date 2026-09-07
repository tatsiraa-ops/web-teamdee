import '../styles/main.css'
// โหลดเฉพาะปลั๊กอินที่หน้าแรกใช้จริง
import 'preline/plugins/accordion'
import 'preline/plugins/carousel'
import { initNav } from './nav.js'
import { baht, tierFor, unitPrice } from './lib.js'
import './ui-bits.js'

initNav()

/* ---------- แผงเลือกแบบเสื้อ ---------- */
const picker = document.getElementById('prodPicker')
if (picker) {
  const tabs = [...picker.querySelectorAll('[data-pp-tab]')]
  const imgs = [...picker.querySelectorAll('[data-pp-img]')]
  const infos = [...picker.querySelectorAll('[data-pp-info]')]
  let hoverTimer = null

  const select = (n) => {
    tabs.forEach((t, k) => {
      const on = k === n
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
    })
    imgs.forEach((el, k) => {
      el.classList.toggle('is-on', k === n)
      el.toggleAttribute('aria-hidden', k !== n)
    })
    infos.forEach((el, k) => {
      if (k === n) { el.hidden = false; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '' }
      else el.hidden = true
    })
  }

  tabs.forEach((t, k) => {
    t.addEventListener('click', () => select(k))
    // ชี้ค้างสั้นๆ ก่อนค่อยสลับ กันภาพกระพริบตอนลากเมาส์ผ่าน
    t.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => select(k), 90) })
    t.addEventListener('mouseleave', () => clearTimeout(hoverTimer))
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
      if (!d) return
      e.preventDefault()
      const n = (k + d + tabs.length) % tabs.length
      select(n)
      tabs[n].focus()
    })
  })

  select(0)
}

/* ---------- เครื่องมือราคา เลื่อนจำนวนแล้วเห็นราคาทันที ----------
   ใช้เรทเดียวกับ pricing.json ผ่าน lib.js จึงไม่มีตัวเลขซ้ำซ้อนให้หลุดกัน */
const calc = document.getElementById('calc')
if (calc) {
  const range = calc.querySelector('#qty')
  const qtyOut = calc.querySelector('#qtyOut')
  const unitOut = calc.querySelector('#unitOut')
  const totalOut = calc.querySelector('#totalOut')
  const saveOut = calc.querySelector('#saveOut')
  const tierOut = calc.querySelector('#tierOut')
  const qtyBtns = [...calc.querySelectorAll('[data-qty]')]
  const collarBtns = [...calc.querySelectorAll('[data-collar]')]
  const optBtns = [...calc.querySelectorAll('[data-opt]')]
  const rows = [...document.querySelectorAll('.tbl-price tbody tr')]
  const bars = [...document.querySelectorAll('.tbl-price .bar')]

  // แถบยาวในตารางอิงจากราคาสูงสุดในตาราง เพื่อให้สัดส่วนสื่อว่าราคาลงจริง
  const maxPrice = Math.max(...bars.map((b) => Number(b.dataset.v)))
  for (const b of bars) b.style.setProperty('--w', `${Math.round((Number(b.dataset.v) / maxPrice) * 100)}%`)

  let collar = 0

  const render = () => {
    const qty = Number(range.value)
    const opts = optBtns
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
      .reduce((s, b) => s + Number(b.dataset.opt), 0)

    const base = unitPrice(qty, collar === 1)
    const unit = base + opts
    const start = (collar === 1 ? 329 : 279) + opts   // เรทขั้นต่ำสุดของตาราง ใช้เทียบว่าประหยัดไปเท่าไร
    const tier = tierFor(qty)

    qtyOut.textContent = baht(qty) + (qty >= 600 ? '+' : '')
    unitOut.textContent = baht(unit)
    totalOut.textContent = baht(unit * qty)
    saveOut.textContent = baht(Math.max(0, start - unit))
    tierOut.textContent = tier.label

    for (const b of qtyBtns) b.setAttribute('aria-pressed', String(Number(b.dataset.qty) === qty))
    const idx = rows.findIndex((r) => r.querySelector('th').textContent.trim() === tier.label)
    rows.forEach((r, i) => r.classList.toggle('is-on', i === idx))
  }

  range.addEventListener('input', render)
  for (const b of qtyBtns) b.addEventListener('click', () => { range.value = b.dataset.qty; render() })
  for (const b of collarBtns) b.addEventListener('click', () => {
    collar = Number(b.dataset.collar)
    for (const x of collarBtns) x.setAttribute('aria-pressed', String(x === b))
    render()
  })
  for (const b of optBtns) b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))
    render()
  })

  render()
}

/* ---------- จุดบอกสไลด์ให้ใช้คีย์บอร์ดได้ ----------
   Preline สร้างจุดเป็น span เปล่า กด Tab ไม่ถึงและ screen reader ไม่รู้ว่ากดได้
   เลยมาเติมบทบาทกับปุ่มลูกศรให้เองหลังปลั๊กอินสร้างเสร็จ */
{
  const dots = document.getElementById('heroDots')
  if (dots) {
    const upgrade = () => {
      const items = [...dots.children]
      if (!items.length) return false
      items.forEach((d, i) => {
        d.setAttribute('role', 'button')
        d.setAttribute('tabindex', '0')
        d.setAttribute('aria-label', `ไปสไลด์ที่ ${i + 1} จาก ${items.length}`)
        d.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); d.click() }
          if (e.key === 'ArrowRight') { e.preventDefault(); items[(i + 1) % items.length].focus() }
          if (e.key === 'ArrowLeft') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus() }
        })
      })
      return true
    }
    if (!upgrade()) new MutationObserver((_, ob) => { if (upgrade()) ob.disconnect() }).observe(dots, { childList: true })
  }
}
