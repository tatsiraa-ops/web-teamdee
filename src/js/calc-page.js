import './page.js'
import pricing from '../data/pricing.json'
import { estimate } from './estimate.js'
import { baht } from './lib.js'

/* เครื่องประมาณราคา 3 ขั้น (Wireframe v2 /calculations/)
   ราคาที่ยังไม่ยืนยันจะไม่ถูกคิด สรุปขึ้น [ยืนยัน] แทนตัวเลข */
const form = document.getElementById('calc')
if (form) {
  const $ = (id) => document.getElementById(id)
  const quote = $('sQuote')
  const base = quote.getAttribute('href').split('?')[0]

  const render = () => {
    const kind = form.querySelector('input[name="kind"]:checked').value
    const band = form.querySelector('input[name="band"]:checked').value
    const options = [...form.querySelectorAll('input[name="opt"]:checked')].map((x) => x.value)
    const r = estimate(pricing, { kind, band, options })

    $('sBand').textContent = `${r.band.label} ตัว`
    $('rUnit').hidden = !r.ok
    $('rTotal').hidden = !r.ok
    $('sPending').hidden = r.ok
    if (r.ok) {
      $('sUnit').textContent = `${baht(r.perUnit)} บาท`
      $('sTotal').textContent = r.high === null ? `ตั้งแต่ ${baht(r.low)} บาท` : `${baht(r.low)}–${baht(r.high)} บาท`
    } else {
      $('sUnit').innerHTML = `<span class="text-ink-3">[ยืนยันจาก${pricing.source}]</span>`
      $('sTotal').innerHTML = '<span class="text-ink-3 text-[20px]">[ยอดประมาณ] บาท</span>'
    }

    /* ส่งสิ่งที่เลือกไปกับปุ่มขอใบเสนอราคา ทีมขายจะเห็นในฟอร์มว่าลูกค้าดูอะไรมา */
    const k = pricing.kinds.find((x) => x.id === kind)
    const opt = options.map((id) => pricing.options.find((o) => o.id === id).name)
    const from = ['/calculations/', k.name, `${r.band.label} ตัว`, ...opt].join(' · ')
    quote.href = `${base}?from=${encodeURIComponent(from)}`
  }

  form.addEventListener('change', render)
  render()
}
