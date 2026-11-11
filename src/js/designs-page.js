import './page.js'
import '../styles/page-designs.css' // CSS เฉพาะหน้านี้ ย้ายออกจาก main.css (30 ต.ค. รอบ 48)
import '../styles/picks.css' // ถาดเลือกแบบ ใช้ร่วมกับแกลเลอรี (audit 30 ต.ค. ข้อ 11)
import '../styles/line-cta.css' // แบนเนอร์ LINE ใช้ร่วม /designs/ + /project/
import { initLightbox } from './lightbox.js'
import { matches as passes, countFor, activeFilters, holdWhile, chipApply, chipActive, pageSize, moreLabel } from './design-filter.js'
import { initPickTray } from './pick-tray.js'
import { backClose } from './back-close.js'

/* แกลเลอรีแบบเสื้อ · ค้นหา + กรอง + โหลดเพิ่ม
   สถานะทั้งหมดเก็บใน URL เพื่อให้ทีมขายก๊อปลิงก์ส่งลูกค้าได้ตรงชุดที่กรองไว้
   และตอนปิดรูปใหญ่กลับมา ตัวกรองกับตำแหน่งเลื่อนต้องอยู่ที่เดิม (Brief ข้อ 06)
   ตัวกรองแบบแถบด้านข้าง (อาร์ตเลือกแบบ ค จาก 3 แบบ 26 ต.ค. 2026): จอใหญ่ติดซ้าย · มือถือเปิดเป็นแผ่นจากปุ่ม "กรอง"
   ตัวเลขทุกตัวเลือกคิดสดจากตัวกรองอื่น (design-filter.js countFor) · ได้ 0 = เลือกไม่ได้ */

/* product ไม่มีตัวควบคุม (ทุกแบบเป็นพิมพ์ลาย) แต่ยังรับ ?product= จากลิงก์หน้าสินค้า */
const AXES = ['work', 'garment', 'product', 'use', 'style', 'color']
/* แบบต่อหน้า = คอลัมน์ตาราง × 10 แถว (6 พ.ย. เดิม 12) · อ่านตอนโหลดหน้า */
const gridCols = () => { const g = document.getElementById('designGrid'); return g ? getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length : 0 }
const PAGE = pageSize(gridCols())

const grid = document.getElementById('designGrid')
const box = document.getElementById('designFilter')
const count = document.getElementById('designCount')
const empty = document.getElementById('designEmpty')
const moreBtn = document.getElementById('designMore')
const input = document.getElementById('dq')
const facetsEl = document.getElementById('designFacets')

const h = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props)
  for (const k of kids) if (k != null) el.append(k)
  return el
}

if (grid && box && facetsEl) {
  /* แกน "ใช้กับงาน" ไม่ขึ้นในตัวกรอง: การ์ดกลุ่มลูกค้าด้านบนพาไปแกลเลอรีกลุ่มแล้ว (อาร์ตเลือกแบบการ์ด 26 ต.ค.) · ?use= จากลิงก์เดิมยังกรองได้ */
  const allAxes = JSON.parse(facetsEl.textContent).axes
  const facets = allAxes.filter((a) => (a.items.length > 1 || a.id === 'work') && a.id !== 'use')
  const items = [...grid.children].map((el) => ({
    el,
    tags: Object.fromEntries(AXES.map((a) => [a, (el.dataset[a] || '').trim().split(/\s+/).filter(Boolean)])),
    text: (el.dataset.text || '').toLowerCase(),
  }))
  const names = Object.fromEntries(allAxes.map((f) => [f.id, Object.fromEntries(f.items.map((i) => [i.id, i.name]))]))
  const valid = Object.fromEntries(AXES.map((a) => [a, new Set(items.flatMap((it) => it.tags[a]))]))

  const state = Object.fromEntries(AXES.map((a) => [a, 'all']))
  let q = ''
  let shown = PAGE

  const n = (axis, value) => countFor(items, state, q, AXES, axis, value)
  /* เลื่อนตัวเลือกด้วยลูกศรไม่เพิ่มประวัติทีละขั้น (กดย้อนกลับไม่รก · 30 ต.ค.) */
  let keyPick = false
  const pick = (axis, value) => {
    state[axis] = value
    shown = PAGE
    render()
    writeUrl(!keyPick)
  }
  const label = (txt, num) => [h('span', { textContent: txt }), h('span', { className: 'dz-n tabular-nums', textContent: num == null ? '' : String(num) })]

  /* รายการเลือกแบบวิทยุ (ช่องละหนึ่งค่าต่อหัวข้อ) · จอใหญ่อยู่ในแถบซ้าย · มือถือย้ายไปไว้ในแผ่น */
  const mount = (root) => {
    const rows = []
    const sums = []
    const groups = facets.map((f) => {
      const fs = h('fieldset', { className: 'sb' }, h('legend', { className: 'sb__k', textContent: f.label }))
      const cur = h('span', { className: 'dz-fd__v' })
      const sum = h('summary', { className: 'dz-fd__s' }, h('span', { className: 'dz-fd__k', textContent: f.label }), cur)
      const dd = h('details', { className: 'dz-fd' }, sum, fs)
      sums.push({ f, cur, dd })
      for (const v of [{ id: 'all', name: f.all }, ...f.items]) {
        const inp = h('input', { type: 'radio', name: `sb-${f.id}`, value: v.id })
        inp.addEventListener('change', () => pick(f.id, v.id))
        const row = h('label', { className: 'sb__o' }, inp, ...label(v.name, null))
        rows.push({ f, v, inp, row })
        fs.append(row)
      }
      return dd
    })
    root.replaceChildren(...groups)
    /* มือถือ: ย้ายรายการไปไว้ในแผ่น · จอใหญ่: อยู่ในแถบซ้าย */
    const sheet = document.getElementById('dzSheet')
    const body = document.getElementById('dzSheetBody')
    const barEl = document.getElementById('dzBar')
    const mq = matchMedia('(min-width: 1024px)')
    /* จอใหญ่ = แถบบน รายการพับเป็นปุ่ม เปิดทีละอัน · มือถือ (แผ่นตัวกรอง) กางตลอด */
    const toolbar = () => mq.matches
    syncDetails = () => { const t = toolbar(); for (const d of groups) d.open = !t }
    const place = () => {
      if (mq.matches) { box.append(...groups); if (sheet?.open) sheet.close(); if (barEl) barEl.hidden = true }
      else { body?.append(...groups); if (barEl) barEl.hidden = false }
      syncDetails()
    }
    for (const d of groups) {
      d.addEventListener('toggle', () => { if (d.open && toolbar()) for (const o of groups) if (o !== d) o.open = false })
      /* จอใหญ่: ปิดตัวเลือกเมื่อคลิก หรือกด Enter/Space เท่านั้น · ลูกศรเลื่อนดูได้ไม่ปิด (ตรวจละเอียด 30 ต.ค. · WCAG 3.2.2) */
      const fs = d.querySelector('fieldset')
      const done = () => { if (toolbar()) { d.open = false; d.querySelector('summary').focus() } }
      fs.addEventListener('keydown', (e) => {
        if (/^Arrow/.test(e.key)) { keyPick = true; setTimeout(() => { keyPick = false }) }
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('input')) { e.preventDefault(); if (!e.target.checked) e.target.click(); done() }
      })
      let ptr = false
      fs.addEventListener('pointerdown', () => { ptr = true })
      fs.addEventListener('change', () => { if (ptr) done(); ptr = false })
    }
    document.addEventListener('click', (e) => { if (toolbar() && !box.contains(e.target)) for (const d of groups) d.open = false })
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !toolbar()) return
      const o = groups.find((d) => d.open)
      if (o) { o.open = false; o.querySelector('summary').focus() }
    })
    mq.addEventListener?.('change', place)
    place()
    /* แผ่นตัวกรองมือถือ: ปุ่มย้อนกลับปิดแผ่น ไม่ออกจากหน้า (ตรวจมือถือ 30 ต.ค. · back-close.js) */
    sheetEl = sheet
    const sheetBack = sheet && backClose(() => sheet.open, () => sheet.close(), sheet)
    document.getElementById('dzOpen')?.addEventListener('click', () => { sheet?.showModal(); sheetBack?.opened() })
    for (const id of ['dzClose', 'dzDone']) document.getElementById(id)?.addEventListener('click', () => sheet?.close())
    sheet?.addEventListener('click', (e) => { if (e.target === sheet) sheet.close() })
    /* ปิดทุกทาง (ปุ่ม · Esc · แตะฉากหลัง) ถอยขั้นประวัติที่เพิ่มไว้ */
    sheet?.addEventListener('close', () => sheetBack?.closed())
    return () => {
      for (const { f, v, inp, row } of rows) {
        const k = v.id === 'all' ? null : n(f.id, v.id)
        inp.checked = state[f.id] === v.id
        inp.disabled = k === 0 && state[f.id] !== v.id
        row.classList.toggle('is-off', inp.disabled)
        /* งานที่ยังไม่มีแบบในคลัง (งานปัก งานสกรีน) บอกเป็นคำ ไม่ใช่เลข 0 */
        row.querySelector('.dz-n').textContent = k == null ? '' : k === 0 && v.none ? 'ยังไม่มีแบบ' : String(k)
      }
      /* ป้ายบนปุ่มแถบบน = ค่าที่เลือกอยู่ */
      for (const { f, cur, dd } of sums) {
        const on = state[f.id] !== 'all'
        cur.textContent = on ? names[f.id][state[f.id]] : f.all
        dd.classList.toggle('is-set', on)
      }
      const set = AXES.filter((a) => a !== 'product' && state[a] !== 'all').length
      const bn = document.querySelector('[data-bar-n]')
      if (bn) bn.textContent = set ? `(${set})` : ''
    }
  }

  let syncDetails = () => {}
  let sheetEl = null
  /* อ่านตัวกรองจาก URL ก่อนสร้างตัวควบคุม ให้ส่วนที่พับไว้เปิดเองเมื่อลิงก์มีตัวกรองในนั้น */
  { const p0 = new URLSearchParams(location.search); AXES.forEach((a) => { const v = p0.get(a); state[a] = v && valid[a].has(v) ? v : 'all' }) }
  const update = mount(box)
  const activeBar = document.getElementById('designActive')

  /* ชิปกลุ่มลูกค้าบนหัว (รอบ 150): คลิก = กรองทันที ไม่โหลดหน้าใหม่ · ไฮไลต์ตามตัวกรองตอนนี้ (กดลบตัวกรอง / ย้อนกลับก็ตาม) */
  const chipEls = [...document.querySelectorAll('#dgChips .dg-chip')]
  const chipData = chipEls.map((a) => ({ axis: a.dataset.axis, val: a.dataset.val }))
  const syncChips = () => { const on = chipActive(state, chipData); chipEls.forEach((a, i) => (i === on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'))) }
  const render = () => {
    update()
    syncChips()
    const act = activeFilters(state, q, AXES.filter((a) => a !== 'product'), names)
    if (activeBar) {
      activeBar.hidden = act.length === 0
      activeBar.replaceChildren(...act.map((f) => {
        const b = h('button', { type: 'button', className: 'chip chip--active', innerHTML: '<span></span><svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' })
        b.dataset.clear = f.axis
        b.setAttribute('aria-label', `ลบตัวกรอง ${f.label}`)
        b.firstChild.textContent = f.label
        return b
      }))
    }

    const hits = items.filter((it) => passes(it, state, q, AXES))
    items.forEach((it) => (it.el.hidden = true))
    hits.slice(0, shown).forEach((it) => (it.el.hidden = false))

    const clean = AXES.every((a) => state[a] === 'all') && !q
    const msg = hits.length === 0 ? 'ไม่พบแบบที่ตรงกับที่เลือก'
      : clean ? `แสดง ${Math.min(shown, hits.length)} จาก ${hits.length} แบบ`
        : `พบ ${hits.length} แบบ แสดง ${Math.min(shown, hits.length)} แบบ`
    if (count) count.textContent = msg
    const bc = document.querySelector('[data-bar-count]')
    if (bc) bc.textContent = `${hits.length} แบบ`
    const done = document.getElementById('dzDone')
    if (done) done.textContent = `ดู ${hits.length} แบบ`
    if (empty) empty.classList.toggle('hidden', hits.length > 0)
    if (moreBtn) moreBtn.hidden = hits.length <= shown
    if (moreBtn) moreBtn.textContent = moreLabel(shown, hits.length, PAGE)
    const prog = document.getElementById('designProg')
    if (prog) { const n = Math.min(shown, hits.length); prog.hidden = hits.length === 0; prog.setAttribute('aria-valuenow', n); prog.setAttribute('aria-valuemax', hits.length); prog.style.setProperty('--p', hits.length ? n / hits.length : 0); const t = prog.querySelector('[data-prog-t]'); if (t) t.textContent = `ดูแล้ว ${n} จาก ${hits.length} แบบ` }
    const reset = document.getElementById('designReset')
    if (reset) reset.hidden = clean
  }

  activeBar?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-clear]')
    if (!b) return
    if (b.dataset.clear === 'q') { q = ''; if (input) input.value = '' } else state[b.dataset.clear] = 'all'
    shown = PAGE
    render()
    writeUrl(true)
    ;(activeBar.querySelector('button') || box.querySelector('button, select, input'))?.focus()
  })

  const readUrl = () => {
    const p = new URLSearchParams(location.search)
    AXES.forEach((a) => {
      const v = p.get(a)
      state[a] = v && valid[a].has(v) ? v : 'all'
    })
    q = (p.get('q') || '').trim().toLowerCase()
    if (input) input.value = p.get('q') || ''
    const cx = document.getElementById('dqClear')
    if (cx) cx.hidden = !input?.value
    shown = Math.max(PAGE, Number(p.get('n')) || PAGE)
    render()
  }

  const putUrl = (push) => {
    const p = new URLSearchParams(location.search)
    AXES.forEach((a) => (state[a] === 'all' ? p.delete(a) : p.set(a, state[a])))
    if (q) p.set('q', q)
    else p.delete('q')
    if (shown > PAGE) p.set('n', String(shown))
    else p.delete('n')
    const url = location.pathname + (p.toString() ? `?${p}` : '')
    history[push ? 'pushState' : 'replaceState'](null, '', url)
  }
  /* แผ่นมือถือเปิดอยู่ = ขั้นบนสุดของประวัติเป็นของแผ่น (back-close.js) · pushState ทับแล้วปิดแผ่นจะถอยตัวกรองที่เพิ่งเลือกออก
     จึงรอเขียน URL หลังแผ่นปิดและถอยเสร็จ (2 พ.ย. · บั๊กจากการเพิ่มปุ่มย้อนกลับ 30 ต.ค.: กด "ดู N แบบ" แล้วตัวกรองรีเซ็ต) */
  const urlHold = holdWhile(() => !!sheetEl?.open, putUrl)
  const writeUrl = urlHold.write

  const clearAll = () => {
    AXES.forEach((a) => (state[a] = 'all'))
    q = ''
    if (input) input.value = ''
    shown = PAGE
    render()
    writeUrl(true)
  }
  document.getElementById('designReset')?.addEventListener('click', clearAll)
  document.getElementById('designReset2')?.addEventListener('click', clearAll)

  moreBtn?.addEventListener('click', () => {
    shown += PAGE
    render()
    writeUrl(false)
  })

  /* ค้นหาแบบพิมพ์ไปกรองไป ไม่ต้องกดปุ่ม แต่ไม่เขียน URL ทุกตัวอักษร
     กันไม่ให้ประวัติเบราว์เซอร์เต็มไปด้วยคำค้นครึ่งคำ */
  let timer
  const onType = () => {
    q = input.value.trim().toLowerCase()
    shown = PAGE
    render()
    clearTimeout(timer)
    timer = setTimeout(() => writeUrl(false), 400)
  }
  input?.addEventListener('input', onType)
  /* ปุ่มล้างคำค้น · ขึ้นเฉพาะตอนมีคำ */
  const clearQ = document.getElementById('dqClear')
  const syncClear = () => { if (clearQ && input) clearQ.hidden = !input.value }
  input?.addEventListener('input', syncClear)
  clearQ?.addEventListener('click', () => { input.value = ''; onType(); syncClear(); writeUrl(true); input.focus() })
  /* กด / ที่ไหนก็ได้ (ไม่ได้พิมพ์อยู่ในช่องอื่น) = ไปช่องค้นหา */
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]')) return
    e.preventDefault()
    input?.focus()
  })
  /* Esc ในช่องค้นหา = ล้างคำ */
  input?.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { e.preventDefault(); clearQ?.click() } })
  /* กันส่งฟอร์มเองใน JS (เว็บจริงตัด onsubmit ในแท็ก · 30 ต.ค.) */
  document.getElementById('designSearch')?.addEventListener('submit', (e) => {
    e.preventDefault()
    onType()
    writeUrl(true)
  })

  document.getElementById('dgChips')?.addEventListener('click', (e) => {
    const a = e.target.closest('.dg-chip')
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return
    const next = chipApply(state, { axis: a.dataset.axis, val: a.dataset.val })
    if (a.dataset.axis === 'use' && !valid.use.has(next.use)) return /* กลุ่มที่ตัวกรองไม่รู้จัก = ปล่อยให้ลิงก์ทำงาน */
    e.preventDefault()
    Object.assign(state, next)
    shown = PAGE
    render()
    writeUrl(true)
  })
  addEventListener('popstate', () => { if (!urlHold.settle()) readUrl() })
  readUrl()
}


/* เลือกเก็บหลายแบบ (อาร์ตเลือกแบบ ค 26 ต.ค.) แล้วส่งรหัสทั้งหมดทาง LINE ครั้งเดียว · จำไว้ในเครื่องนี้
   ถาดชุดเดียวกับแกลเลอรีรายกลุ่ม ย้ายไป pick-tray.js (audit มือถือ 30 ต.ค. ข้อ 11) · ที่เลือกจากแกลเลอรีมาด้วย */
{
  const grid = document.getElementById('designGrid')
  const catalog = grid ? [...grid.querySelectorAll('.dcard')].map((c) => c.dataset.code) : []
  const pick = initPickTray({ grid, cardSel: '.dcard', catalog })
  /* กล่องดูรูปใหญ่มีปุ่มเลือกเก็บ ใช้รายการเดียวกับการ์ด */
  if (pick) initLightbox('#designGrid', '.dcard', 'ดูแบบเสื้อขนาดใหญ่', { pick })
}
