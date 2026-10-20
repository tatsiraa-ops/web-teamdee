/* แท็บแบบเข้าถึงได้ตาม WAI-ARIA · ลูกศรซ้ายขวาเลื่อนแท็บ Home/End ไปแท็บแรก/สุดท้าย
   ใช้ chip เดิมของระบบดีไซน์ จะได้หน้าตาเหมือนตัวกรองที่อื่นในเว็บ */
export function initTabs(root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')]
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')))
  // ใช้ aria-pressed ให้ chip ได้สีส้มตอนเลือก โดยไม่ต้องเขียน CSS ซ้ำ
  const select = (i, focus) => {
    tabs.forEach((t, k) => {
      const on = k === i
      t.setAttribute('aria-selected', String(on))
      t.setAttribute('aria-pressed', String(on))
      t.tabIndex = on ? 0 : -1
      if (panels[k]) panels[k].hidden = !on
    })
    if (focus) tabs[i].focus()
  }
  tabs.forEach((t, i) => {
    t.classList.add('chip')
    t.addEventListener('click', () => select(i, false))
    t.addEventListener('keydown', (e) => {
      const last = tabs.length - 1
      const go = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key]
      if (go === undefined) return
      e.preventDefault()
      select(go, true)
    })
  })
  select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')), false)
}
