import './page.js'
import prices from '../data/prices.json'
import { estimate, readCalcQuery, calcSearch, lineText, fromText, barText } from './estimate.js'
import { lineMessageUrl } from './contact-send.js'
import { baht } from './lib.js'
import { calcKinds } from './prices.js'

/* ราคาทั้งหมดมาจาก prices.json ไฟล์เดียว (src/js/prices.js) · ตรรกะคิดราคา/ข้อความอยู่ใน estimate.js มีเทส */
const K = calcKinds(prices)

/* เครื่องคำนวณ 3 ขั้น (audit 3.4): เลือกเสื้อ 6 แบบ (+ผ้าโปโล) → ใส่จำนวนจริง → ออปชัน
   ยอดรวมเป็นตัวเลขเดียว · ปุ่มหลักส่งใบประเมินเข้า LINE · ตัวเลือกเก็บใน URL (replaceState) */
const form = document.getElementById('calc')
if (form) {
  const $ = (id) => document.getElementById(id)
  const qty = $('qty')
  const quote = $('sQuote')
  const quoteBase = quote.getAttribute('href').split('?')[0]
  const optStep = $('optStep')
  const fabSets = [...form.querySelectorAll('[data-fab-for]')]
  const minus = form.querySelector('[data-q-step="-1"]')
  const chips = [...form.querySelectorAll('[data-q]')]
  /* ปุ่ม LINE ทุกจุดของหน้านี้ใช้ข้อความเดียวกัน (การ์ดสรุป · ใต้ FAQ · แถบล่างมือถือ · ปุ่มลอย) · audit calc-02 */
  const lines = [$('sLine'), ...document.querySelectorAll('[data-calc-line], [data-where="mobile-bar"] a[data-track="line"], [data-float-cta] a[data-track="line"]')]
  const bar = document.querySelector('[data-bar-live]')

  const MAX = Number(qty.max) || 99999
  /* ค่าที่พิมพ์ · ว่าง/ไม่ใช่ตัวเลข = NaN ให้ estimate บอกว่าต่ำกว่าขั้นต่ำ */
  const typed = () => (qty.value.trim() === '' ? NaN : Number(qty.value))
  const clamp = (n) => Math.min(MAX, Math.max(K.minQty, Math.round(Number.isFinite(n) ? n : K.minQty)))

  const state = () => ({
    kind: form.querySelector('input[name="kind"]:checked').value,
    fabric: form.querySelector('input[name="fabric"]:checked')?.value,
    qty: typed(),
    options: [...form.querySelectorAll('input[name="opt"]:checked')].map((x) => x.value),
  })

  const show = (el, on) => { el.hidden = !on }
  /* true = ผู้ใช้ใส่ต่ำกว่าขั้นต่ำแล้วเราปรับให้ · โชว์บรรทัด "สั่งผลิตขั้นต่ำ 10 ตัว" */
  let raised = false

  const render = () => {
    const s = state()
    const r = estimate(K, s)
    const k = r.kind

    /* ขั้นที่ไม่เกี่ยวกับสินค้านี้ซ่อนและปิด (ผ้าเฉพาะโปโล · ออปชันเฉพาะสินค้าที่ prices.json ตั้ง options) */
    for (const f of fabSets) { const on = f.dataset.fabFor === k.id; f.hidden = !on; f.disabled = !on }
    optStep.hidden = !k.options
    optStep.disabled = !k.options

    /* ขั้น 2 · ช่วงราคาที่ใช้ · ขั้นต่ำ */
    $('qBand').textContent = r.band ? `ใช้ราคาช่วง ${r.band.qty}` : ''
    show($('qErr'), raised)
    minus.disabled = !(typed() > K.minQty)
    for (const c of chips) c.setAttribute('aria-pressed', String(Number(c.dataset.q) === r.qty))

    /* การ์ดสรุป */
    $('sProd').textContent = r.fabric ? `${k.name} · ผ้า${r.fabric.name}` : k.name
    $('sInc').textContent = k.include || ''
    show($('sInc'), !!k.include)
    show($('sRows'), r.ok)
    if (r.ok) {
      $('sBand').textContent = `ช่วง ${r.band.qty}`
      $('sBase').textContent = `${baht(r.base)} บาท`
      show($('rOpt'), r.opts.length > 0)
      $('sOptNames').textContent = r.opts.map((o) => o.name).join(' · ')
      $('sOpt').textContent = `+${baht(r.add)} บาท`
      $('sQty').textContent = `${baht(r.qty)} ตัว`
      $('sTotal').textContent = `${baht(r.total)} บาท`
    }
    const pending = r.belowMin
      ? `สั่งผลิตขั้นต่ำ ${K.minQty} ตัว ใส่จำนวนตั้งแต่ ${K.minQty} ตัวขึ้นไป`
      : r.byDesign
        ? 'เสื้อสกรีนราคาขึ้นกับจำนวนสีและขนาดลาย ทีมดีประเมินให้ · ส่งโลโก้ + จำนวนสี + จำนวนตัว ทาง LINE'
        : !r.ok ? `${r.band.qty} ${r.ask}` : ''
    $('sPending').textContent = pending
    show($('sPending'), !!pending)

    /* ชวนสั่งเพิ่ม · ขึ้นเฉพาะเมื่อยอดรวมลดลงจริง (estimate.js) */
    const next = $('sNext')
    show(next, !!r.next)
    if (r.next) {
      const btn = Object.assign(document.createElement('button'), {
        type: 'button',
        className: 'font-bold underline decoration-orange decoration-2 underline-offset-4 min-h-[44px] tabular-nums',
        textContent: `เปลี่ยนเป็น ${baht(r.next.qty)} ตัว`,
      })
      btn.addEventListener('click', () => { qty.value = r.next.qty; raised = false; changed() })
      next.replaceChildren(`สั่งเพิ่มอีก ${baht(r.next.more)} ตัว ยอดรวมลดเหลือ ${baht(r.next.total)} บาท (${baht(r.next.unit)} บาท/ตัว) `, btn)
    }

    /* ปุ่ม · ข้อความ LINE ไม่มีข้อมูลส่วนตัว (estimate.js lineText) · ฟอร์มได้สรุปไปใน ?from= */
    $('sLineText').textContent = r.byDesign ? 'ส่งโลโก้ให้ประเมินทาง LINE' : 'ส่งใบประเมินนี้ทาง LINE'
    const href = lineMessageUrl(lineText(r))
    for (const a of lines) a.href = href
    quote.href = `${quoteBase}?from=${encodeURIComponent(fromText(r))}`

    /* แถบล่างมือถือ ช่อง 3 · ยอดรวมสด แตะแล้วไปการ์ดสรุป (audit calc-03) */
    if (bar) {
      const t = barText(r)
      bar.querySelector('[data-bar-ico]').hidden = true
      bar.querySelector('[data-bar-main]').textContent = t.main
      const sub = bar.querySelector('[data-bar-sub]')
      sub.textContent = t.sub
      sub.hidden = !t.sub
      bar.setAttribute('aria-label', `ดูสรุปราคา ${t.main} ${t.sub}`.trim())
    }
    return r
  }

  /* สัญญาณวัดผล td_calc_result · ยิงหลังผู้ใช้หยุดเปลี่ยนตัวเลือก 1.5 วินาที ไม่ยิงทุกครั้งที่กด −/+ · ไม่นับตอนเปิดหน้า (track.js นับครั้งเดียว) */
  let timer = 0
  const changed = () => {
    const r = render()
    const s = state()
    history.replaceState(history.state, '', location.pathname + calcSearch(K, { ...s, qty: r.qty }) + location.hash)
    clearTimeout(timer)
    timer = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('td:calc', { detail: { td_product: r.kind.id, td_qty: r.qty } }))
    }, 1500)
  }

  /* ค่าจาก URL (ตัวช่วยเลือกหน้าแรก · ลิงก์หน้าสินค้า · ลิงก์ที่แชร์มา) · ไม่เลื่อนจอเอง */
  const pre = readCalcQuery(K, location.search)
  const tick = (name, v) => { const el = v && form.querySelector(`input[name="${name}"][value="${CSS.escape(v)}"]`); if (el) el.checked = true }
  tick('kind', pre.kind)
  tick('fabric', pre.fabric)
  if (pre.qty) qty.value = pre.qty
  qty.value = clamp(typed())
  for (const id of pre.options) tick('opt', id)

  /* พิมพ์จำนวน: คิดใหม่ทันทีเมื่อเป็นจำนวนที่สั่งได้ · ระหว่างพิมพ์ (เช่น "1" ก่อนจะเป็น "100") ไม่เตือน
     ออกจากช่อง/กด Enter แล้วยังต่ำกว่าขั้นต่ำ → ปรับเป็นขั้นต่ำและบอกเหตุผล */
  const settle = () => {
    const n = typed()
    /* Enter ยิงทั้ง change และ submit · ตั้งธงอย่างเดียว ไม่ล้าง (ล้างตอนพิมพ์จำนวนที่ถูก/กดปุ่ม) */
    if (!(Number.isInteger(n) && n >= K.minQty)) raised = true
    qty.value = clamp(n)
  }
  form.addEventListener('change', (e) => {
    if (e.target === qty) settle()
    changed()
  })
  qty.addEventListener('input', () => {
    const n = typed()
    if (Number.isInteger(n) && n >= K.minQty && n <= MAX) { raised = false; changed() }
  })
  form.addEventListener('click', (e) => {
    const step = e.target.closest('[data-q-step]')
    const chip = e.target.closest('[data-q]')
    if (step) qty.value = clamp((Number.isFinite(typed()) ? typed() : K.minQty) + Number(step.dataset.qStep))
    else if (chip) qty.value = chip.dataset.q
    else return
    raised = false
    changed()
  })
  /* กด Enter ในช่องจำนวน = ไม่ส่งฟอร์ม (ไม่ใช้ onsubmit เพราะเว็บจริงตัด inline script) · audit calc-11 */
  form.addEventListener('submit', (e) => { e.preventDefault(); settle(); changed() })

  /* การ์ดสรุปอยู่บนจอแล้ว ช่องยอดในแถบล่างจางลง */
  if (bar && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { bar.style.opacity = en.isIntersecting ? '0.55' : '' }).observe($('calcCard'))
  }
  render()
}
