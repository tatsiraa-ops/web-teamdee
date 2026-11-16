/* /sublimation/ ตารางไซซ์ (partials/pp2Sizes.hbs) · รอบ 134
   เลือกกลุ่ม (ผู้ใหญ่/เด็ก) · หน่วย (นิ้ว/ซม.) · ไซซ์ → ตัวเลขบนภาพเสื้อ + ไฮไลต์คอลัมน์ในตาราง
   ไม่มี JS = ตารางนิ้วครบ + ค่าตั้งต้นไซซ์ M บนภาพ */

/** ค่าตามหน่วย: นิ้วคงเดิม · ซม. = ×2.54 ปัดเป็นจำนวนเต็ม (ตัวเสื้อคลาดเคลื่อนได้ ±1 นิ้วอยู่แล้ว) */
export function fmtSize(inch, unit) {
  return unit === 'cm' ? String(Math.round(inch * 2.54)) : String(inch)
}

const DEF = { adult: 'M', kids: 'No.6' }

/** ไซซ์ตั้งต้นของกลุ่ม: ที่ขอ (want) ถ้ามี · ไม่มีใช้ M · ไม่มี M ใช้ตัวแรก
    13 พ.ย. หน้าปัก: กลุ่มที่สองคือ "ผู้หญิง" (XS–7XL) ไม่มี No.6 ของเด็ก → เดิมกดปุ่มผู้หญิงแล้วไม่เปลี่ยนอะไร */
export function pickDefault(list, want) {
  if (list.includes(want)) return want
  if (list.includes('M')) return 'M'
  return list[0] || ''
}

export function initSizeChart(root = document) {
  for (const sec of root.querySelectorAll('[data-sz-root]')) {
    const st = { g: 'adult', u: 'in', sz: DEF.adult }
    const $ = (s) => sec.querySelector(s)
    const render = () => {
      const pick = sec.querySelector(`.pp2-sz__pick[data-g="${st.g}"][data-sz="${st.sz}"]`)
      if (!pick) return
      const unit = st.u === 'cm' ? 'ซม.' : 'นิ้ว'
      $('[data-sz-name]').textContent = st.sz
      sec.querySelectorAll('[data-sz-chest]').forEach((el) => { el.textContent = fmtSize(+pick.dataset.chest, st.u) })
      sec.querySelectorAll('[data-sz-len]').forEach((el) => { el.textContent = fmtSize(+pick.dataset.len, st.u) })
      sec.querySelectorAll('[data-sz-fig]').forEach((f) => { f.hidden = f.dataset.szFig !== st.g }) /* v2: ภาพเสื้อตามทรง */
      sec.querySelectorAll('[data-sz-u]').forEach((el) => { el.textContent = unit })
      sec.querySelectorAll('.pp2-sz__picks').forEach((p) => { p.hidden = p.dataset.g !== st.g })
      sec.querySelectorAll('.pp2-sz__pick').forEach((b) => b.setAttribute('aria-pressed', String(b === pick)))
      sec.querySelectorAll('[data-g-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.gBtn === st.g)))
      sec.querySelectorAll('[data-u-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.uBtn === st.u)))
      sec.querySelectorAll('td[data-in]').forEach((td) => { td.textContent = fmtSize(+td.dataset.in, st.u) })
      sec.querySelectorAll('[data-c]').forEach((c) => c.classList.toggle('is-on', c.closest('table').id === `sz-${st.g}` && c.dataset.c === st.sz))
    }
    sec.addEventListener('click', (e) => {
      /* 13 พ.ย. กดช่องในตาราง = เลือกไซซ์นั้น (มือถือไม่มี hover) */
      const c = e.target.closest('[data-c]')
      if (c && c.closest('table') && sec.contains(c)) { st.g = c.closest('table').id.slice(3); st.sz = c.dataset.c; return render() }
      const b = e.target.closest('button'); if (!b || !sec.contains(b)) return
      if (b.dataset.gBtn) { st.g = b.dataset.gBtn; st.sz = pickDefault([...sec.querySelectorAll(`.pp2-sz__pick[data-g="${st.g}"]`)].map((x) => x.dataset.sz), DEF[st.g]) }
      else if (b.dataset.uBtn) st.u = b.dataset.uBtn
      else if (b.classList.contains('pp2-sz__pick')) st.sz = b.dataset.sz
      else return
      render()
    })
    /* ชี้หัวคอลัมน์ในตาราง = เลือกไซซ์นั้น */
    sec.querySelectorAll('th[data-c]').forEach((th) => th.addEventListener('pointerenter', () => { st.g = th.closest('table').id.slice(3); st.sz = th.dataset.c; render() }))
    sec.dataset.szReady = ''
    render()
  }
}
