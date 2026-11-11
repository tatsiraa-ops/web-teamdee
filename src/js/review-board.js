/* กระดานรีวิวหน้าแรก (3 พ.ย. 2026 อาร์ต "แบบ Delicake ทำให้ดีกว่า") · ซ้ายโมเสกรูปงานจริงตามกลุ่ม · ขวารีวิวจริงทีละราย (รูปใหญ่ + การ์ดคำรีวิว)
   ชิปกลุ่มงาน = กระโดดไปรีวิวแรกของกลุ่ม · ลูกศร = ทีละรีวิววนรอบ · กดรูป = กล่องดูรูปทั้งชุด (review-dialog.js เดิม)
   ไม่มี JS = รีวิวเรียงต่อกันครบทุกราย (CSS ซ่อนเฉพาะเมื่อ data-rvb-ready) */

export const stepIndex = (count, i, dir) => (count < 1 ? 0 : (i + dir + count) % count)

export const firstOfUse = (uses, use, current) => {
  const i = uses.indexOf(use)
  return i < 0 ? current : i
}

/* โมเสกรูปซ้ายตามกลุ่มของรีวิวที่แสดง (index เกินช่วง = กลุ่มของรีวิวแรก) */
export const groupFor = (uses, i) => uses[i] ?? uses[0]

export function initReviewBoard() {
  const root = document.querySelector('[data-rvb]')
  if (!root) return
  const items = [...root.querySelectorAll('[data-rvb-item]')]
  if (items.length < 2) return
  const uses = items.map((el) => el.dataset.use)
  const chips = [...root.querySelectorAll('[data-rvb-use]')]
  const count = root.querySelector('[data-rvb-count]')
  const groups = [...root.querySelectorAll('[data-rvb-group]')]
  let at = 0

  const show = (i) => {
    at = i
    items.forEach((el, k) => { el.classList.toggle('is-on', k === i); el.hidden = k !== i })
    const g = groupFor(uses, i)
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.rvbUse === g)))
    groups.forEach((el) => { el.hidden = el.dataset.rvbGroup !== g })
    if (count) count.textContent = `${i + 1} / ${items.length}`
  }

  root.addEventListener('click', (e) => {
    const step = e.target.closest('[data-rvb-step]')
    if (step) return show(stepIndex(items.length, at, Number(step.dataset.rvbStep)))
    const chip = e.target.closest('[data-rvb-use]')
    if (chip) show(firstOfUse(uses, chip.dataset.rvbUse, at))
  })
  root.setAttribute('data-rvb-ready', '')
  show(0)
}
