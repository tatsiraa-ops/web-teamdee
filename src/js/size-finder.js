/* 12 พ.ย. 2026 หน้า /size-chart/: ตัวช่วยหาไซส์จากรอบอกเสื้อตัวที่ใส่พอดี (tests/size-chart-page.test.js)
   กรอกรอบอก (นิ้ว หรือ ซม.) → ไฮไลต์แถวในทุกตาราง + บอกไซส์ที่ใกล้ที่สุดของแต่ละตาราง
   ตารางทั้งหมดเห็นครบตั้งแต่แรก ไม่ต้องกรอกก็อ่านได้ · ไม่มี JS = ตารางธรรมดา */

/** ไซส์เล็กสุดที่รอบอกไม่น้อยกว่าที่กรอก · rows = [[ไซส์, รอบอกนิ้ว], …] เรียงเล็กไปใหญ่ · ใหญ่เกินตาราง/กรอกผิด = null */
export const sizeFor = (rows, chest) => {
  if (!Number.isFinite(chest) || chest <= 0) return null
  const hit = rows.find((r) => r[1] >= chest)
  return hit ? hit[0] : null
}

export const toCm = (inch) => Math.round(inch * 2.54)

/** ผลที่แสดง · ตารางที่ไม่มีไซส์ตรง ซ่อนถ้ามีตารางอื่นในการ์ดเดียวกันตรงแล้ว (กรอกไซส์ผู้ใหญ่ ไม่ต้องเห็นช่องเด็ก) */
export const visibleResults = (list) => list.filter((r) => r.s || !list.some((o) => o.card === r.card && o.s))

export function initSizeFinder(root = document) {
  const box = root.querySelector('[data-size-finder]')
  if (!box) return
  const input = box.querySelector('#sizeFinder')
  const units = [...box.querySelectorAll('[data-size-unit]')]
  const out = box.querySelector('[data-size-out]')
  const charts = [...root.querySelectorAll('[data-size-chart]')].map((t) => ({
    name: t.dataset.sizeChart,
    card: t.dataset.sizeCard,
    rows: [...t.querySelectorAll('tbody tr')].map((tr) => ({ tr, size: tr.dataset.size, chest: Number(tr.dataset.chest) })),
  }))
  let unit = 'in'
  const run = () => {
    const raw = parseFloat(String(input.value).replace(',', '.'))
    const inch = unit === 'cm' ? raw / 2.54 : raw
    const res = charts.map((c) => {
      const s = sizeFor(c.rows.map((r) => [r.size, r.chest]), inch)
      for (const r of c.rows) r.tr.classList.toggle('is-fit', r.size === s)
      return { name: c.name, card: c.card, s }
    })
    if (!Number.isFinite(inch) || inch <= 0) { out.textContent = ''; return }
    out.innerHTML = visibleResults(res).map((r) => `<li><span>${r.name}</span><b>${r.s || 'ใหญ่กว่าตาราง ทัก LINE'}</b></li>`).join('')
  }
  input.addEventListener('input', run)
  for (const b of units) b.addEventListener('click', () => {
    unit = b.dataset.sizeUnit
    for (const x of units) x.setAttribute('aria-pressed', String(x === b))
    input.placeholder = unit === 'cm' ? 'เช่น 102' : 'เช่น 40'
    run()
  })
}
