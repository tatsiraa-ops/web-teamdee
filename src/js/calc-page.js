import './page.js'
import '../styles/page-calculations.css' // CSS เฉพาะหน้านี้ ย้ายออกจาก main.css (30 ต.ค. รอบ 48)
import prices from '../data/prices.json'
import { estimate, readCalcQuery, calcSearch, lineText, fromText, barText, tiers, shareText, lineShareUrl } from './estimate.js'
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
  /* ส่งให้หัวหน้าดู · มีเมนูแชร์ของเครื่อง (มือถือ) ใช้อันนั้น · ไม่มี = ลิงก์ LINE share */
  const share = $('sShare')
  let shareUrl = location.href
  let shareBody = ''
  share?.addEventListener('click', (e) => {
    if (!navigator.share) return
    e.preventDefault()
    navigator.share({ title: 'ใบประเมินราคาเบื้องต้น TEAMDEE', text: shareBody, url: shareUrl }).catch(() => {})
  })
  const optStep = $('optStep')
  const fabSets = [...form.querySelectorAll('[data-fab-for]')]
  const minus = form.querySelector('[data-q-step="-1"]')
  const chips = [...form.querySelectorAll('[data-q]')]
  /* ปุ่ม LINE ทุกจุดของหน้านี้ใช้ข้อความเดียวกัน (การ์ดสรุป · ใต้ FAQ · แถบล่างมือถือ · ปุ่มลอย) · audit calc-02 */
  const lines = [$('sLine'), ...document.querySelectorAll('[data-calc-line], [data-where="mobile-bar"] a[data-track="line"], [data-float-cta] a[data-track="line"]')]
  const bar = document.querySelector('[data-bar-live]')
  const tierBox = $('tiers')
  const tierRow = $('tierRow')
  /* วันที่บนหัวใบประเมิน */
  $('sDate').textContent = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

  const MAX = Number(qty.max) || 99999
  /* ค่าที่พิมพ์ · ว่าง/ไม่ใช่ตัวเลข = NaN ให้ estimate บอกว่าต่ำกว่าขั้นต่ำ */
  const typed = () => (qty.value.trim() === '' ? NaN : Number(qty.value))
  const minimum = () => K.kinds.find(k => k.id === form.querySelector('input[name="kind"]:checked').value)?.minQty || K.minQty
  const clamp = (n) => Math.min(MAX, Math.max(minimum(), Math.round(Number.isFinite(n) ? n : minimum())))

  const state = () => ({
    kind: form.querySelector('input[name="kind"]:checked').value,
    fabric: form.querySelector('input[name="fabric"]:checked')?.value,
    qty: typed(),
    options: [...form.querySelectorAll('input[name="opt"]:checked')].map((x) => x.value),
  })

  const show = (el, on) => { el.hidden = !on }
  /* true = ผู้ใช้ใส่ต่ำกว่าขั้นต่ำแล้วเราปรับให้ · โชว์บรรทัด "สั่งผลิตขั้นต่ำ 10 ตัว" */
  let raised = false

  let sayT = 0
  const render = () => {
    const s = state()
    const r = estimate(K, s)
    const k = r.kind
    qty.min = r.minQty
    $('qErr').textContent = `สั่งผลิตขั้นต่ำ ${r.minQty} ตัว`

    /* ขั้นที่ไม่เกี่ยวกับสินค้านี้ซ่อนและปิด (ผ้าเฉพาะโปโล · ออปชันเฉพาะสินค้าที่ prices.json ตั้ง options) */
    for (const f of fabSets) { const on = f.dataset.fabFor === k.id; f.hidden = !on; f.disabled = !on }
    optStep.hidden = !k.options
    optStep.disabled = !k.options

    /* ขั้น 2 · ช่วงราคาที่ใช้ · ขั้นต่ำ */
    /* 2 ก้อน ตัดบรรทัดได้เฉพาะระหว่างก้อน (มือถือ) */
    const chunk = (t) => Object.assign(document.createElement('span'), { className: 'inline-block', textContent: t })
    const qBand = $('qBand')
    qBand.replaceChildren()
    if (r.band) qBand.append(chunk(`ใช้ราคาช่วง ${r.band.qty} ·`), ' ', chunk('แตะช่วงอื่นเพื่อเปลี่ยนจำนวน'))
    else qBand.append(chunk('ราคาต่อตัวตามจำนวน (ตัว)'))
    /* แถบช่วงราคาสด (รื้อหน้า 26 ต.ค.) · ปุ่มมี data-q = ต้นช่วง ใช้ตัวจับคลิกเดียวกับชิปจำนวน */
    const t = tiers(r)
    /* สร้างปุ่มใหม่ทุกครั้ง · ถ้ากำลังโฟกัสปุ่มช่วงอยู่ ย้ายโฟกัสไปปุ่มช่วงที่เลือกใหม่ ไม่ให้โฟกัสหลุด */
    const hadFocus = tierRow.contains(document.activeElement)
    tierBox.hidden = !t.length
    tierRow.replaceChildren(...t.map((x) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'tier' })
      b.dataset.q = x.min
      b.setAttribute('aria-pressed', String(x.on))
      const price = x.unit === null ? 'ทักถาม' : baht(x.unit)
      b.setAttribute('aria-label', `${x.qty} ${x.unit === null ? 'ทักถามราคา' : `${price} บาทต่อตัว`}`)
      /* ป้ายบนปุ่มตัดคำว่า "ตัว" ออก (หัวแถบบอกหน่วยแล้ว) ให้ "1,001–2,000" อยู่บรรทัดเดียวบนจอ 320 · ชื่อเต็มอยู่ใน aria-label */
      const short = x.qty.replace(' ตัวขึ้นไป', ' ขึ้นไป').replace(/ ตัว$/, '')
      b.append(Object.assign(document.createElement('span'), { textContent: short }), Object.assign(document.createElement('b'), { textContent: price }))
      return b
    }))
    if (hadFocus) tierRow.querySelector('[aria-pressed="true"]')?.focus()
    show($('qErr'), raised)
    minus.disabled = !(typed() > r.minQty)
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
      ? `สั่งผลิตขั้นต่ำ ${r.minQty} ตัว ใส่จำนวนตั้งแต่ ${r.minQty} ตัวขึ้นไป`
      : r.byDesign
        ? 'เสื้อสกรีนราคาขึ้นกับขนาดลายและจำนวนจุด ทีมดีประเมินให้ · ส่งโลโก้ + ตำแหน่งลาย + จำนวนตัว ทาง LINE'
        : !r.ok ? `${r.band.qty} ${r.ask}` : ''
    $('sPending').textContent = pending
    show($('sPending'), !!pending)
    /* ประกาศยอดรวมครั้งเดียวหลังหยุดกด 0.5 วิ */
    clearTimeout(sayT)
    sayT = setTimeout(() => { $('calcSay').textContent = r.ok ? `ยอดรวมประมาณ ${baht(r.total)} บาท สำหรับ ${baht(r.qty)} ตัว` : pending }, 500)

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
    /* ส่งให้หัวหน้าดู: ลิงก์ที่เปิดแล้วเห็นค่าเดิม (?kind=&qty=…) */
    shareUrl = location.origin + location.pathname + calcSearch(K, { ...state(), qty: r.qty })
    share.href = lineShareUrl(shareText(r, shareUrl))
    /* เมนูแชร์ของเครื่องต่อ url ท้ายข้อความเอง → ตัดบรรทัดลิงก์ออก ไม่ให้ซ้ำ */
    shareBody = shareText(r, shareUrl).replace(/\nดูใบประเมิน: .*$/, '')
    /* ฟอร์มเลือกสินค้าและเติมจำนวนให้ (?p= ?qty=) · ติ๊กใบเสนอราคาเพราะมาจากหน้าคำนวณ (audit 26 ต.ค. M1) */
    quote.href = `${quoteBase}?from=${encodeURIComponent(fromText(r))}${r.kind?.product ? `&p=${r.kind.product}` : ''}${r.qty ? `&qty=${r.qty}` : ''}`

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
    if (!(Number.isInteger(n) && n >= minimum())) raised = true
    qty.value = clamp(n)
  }
  form.addEventListener('change', (e) => {
    /* เปลี่ยนสินค้า: ขั้นต่ำเปลี่ยนตาม · สกรีน 1 ตัว → โปโล ปรับเป็นขั้นต่ำและบอกเหตุผล (2 พ.ย.) */
    if (e.target.name === 'kind') raised = false
    if (e.target === qty || e.target.name === 'kind') settle()
    changed()
  })
  /* ระหว่างพิมพ์ต่ำกว่าขั้นต่ำ: บอก "ขั้นต่ำ" ทันที และทำยอดรวมให้จาง (ลองใช้จริง 30 ต.ค.: พิมพ์ 5 แล้วยอดยังโชว์ 30 ตัวเดิม) */
  const stale = (on) => document.documentElement.classList.toggle('calc-stale', on)
  qty.addEventListener('input', () => {
    const n = typed()
    if (Number.isInteger(n) && n >= minimum() && n <= MAX) { raised = false; stale(false); changed(); return }
    const low = Number.isFinite(n) && n < minimum()
    show($('qErr'), low)
    stale(low)
  })
  qty.addEventListener('blur', () => stale(false))
  form.addEventListener('click', (e) => {
    const step = e.target.closest('[data-q-step]')
    const chip = e.target.closest('[data-q]')
    if (step) qty.value = clamp((Number.isFinite(typed()) ? typed() : minimum()) + Number(step.dataset.qStep))
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

