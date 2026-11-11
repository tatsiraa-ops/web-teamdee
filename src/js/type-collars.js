/* แผงเลือกเสื้อ /sublimation/ · 196c (10 พ.ย. 2026 อาร์ต "กดแต่ละทรงเสื้อแล้ว บอกว่าทรงเสื้ออันไหนมีคออะไรบ้าง")
   กดภาพทรง (.spk__pick aria-pressed) → คอที่ทรงนี้ไม่มีจาง (.is-off + ป้าย "ทรงนี้ไม่มี") · ราคาทรงอยู่บนภาพทรง · 196d ไม่มีแถบสถานะ (อาร์ต "ไม่เอา")
   data-cols: "all" ทุกคอ · "crew v" เฉพาะคอนั้น · "" ยังไม่ระบุ = ไม่จางคอไหน (ไม่เดาว่าไม่มี)
   ไม่มี JS: ทรงปกติ (ทุกคอ) แสดงอยู่ ↗ ยังไปหน้าทรงได้ */
/** คีย์คอที่ต้องจางสำหรับทรงนี้ */
export const offKeys = (cols, all) => (cols === 'all' || !cols.trim() ? [] : (() => { const on = new Set(cols.trim().split(/\s+/)); return all.filter((k) => !on.has(k)) })())

export function initTypeCollars(root = document) {
  const panel = root.querySelector('.spk')
  if (!panel) return
  const picks = [...panel.querySelectorAll('.spk__pick')]
  const items = [...panel.querySelectorAll('[data-k]')]
  const keys = items.map((el) => el.dataset.k)
  const choose = (b) => {
    picks.forEach((p) => p.setAttribute('aria-pressed', String(p === b)))
    panel.dataset.ty = b.dataset.ty /* CSS ซ่อนราคากลุ่มคอ (ราคาทรงปกติ) เมื่อเลือกทรงอื่น */
    const off = new Set(offKeys(b.dataset.cols, keys))
    items.forEach((el) => el.classList.toggle('is-off', off.has(el.dataset.k)))
  }
  panel.classList.add('is-js')
  picks.forEach((b) => b.addEventListener('click', () => choose(b)))
}
