/* เก็บไซซ์ทั้งทีม: หน้าจอบน /size-chart/ (partial rosterTool.hbs) · ตัวอ่านรายชื่ออยู่ใน roster.js (มีเทส)
   - ร่างรายชื่อเก็บใน localStorage ของเครื่องนี้เท่านั้น (สะดวกกลับมาแก้ต่อ) · ทุกครั้งที่แตะ storage ห่อ try/catch (โหมดส่วนตัว/ปิด storage ยังใช้ได้)
   - ไม่มีอะไรออกจากเครื่อง จนกว่าผู้ใช้กดลิงก์ LINE เอง */
import './page.js'
import { parseRoster, issueText, rosterLineUrl, rosterTable, rosterCsv, TEMPLATE, DEFAULT_SIZES } from './roster.js'
import { todayLocal } from './lib.js'

export const DRAFT_KEY = 'td-roster-draft'

const store = {
  get() { try { return window.localStorage.getItem(DRAFT_KEY) || '' } catch { return '' } },
  set(v) { try { if (v.trim()) window.localStorage.setItem(DRAFT_KEY, v); else window.localStorage.removeItem(DRAFT_KEY) } catch { /* เก็บร่างไม่ได้ ใช้งานต่อได้ปกติ */ } },
  clear() { try { window.localStorage.removeItem(DRAFT_KEY) } catch { /* ไม่มี storage */ } },
}

/* data-sizes="XS:34 S:36 …" → [{ size, chest }] · อ่านไม่ได้ใช้ค่าตั้งต้น */
const sizesOf = (attr) => {
  const list = String(attr || '').trim().split(/\s+/).filter(Boolean).map((t) => { const [size, chest] = t.split(':'); return { size, chest: Number(chest) || null } })
  return list.length ? list : DEFAULT_SIZES
}

function init(root) {
  const $ = (s) => root.querySelector(s)
  const input = $('#roster-input')
  const status = $('[data-roster-status]')
  const result = $('[data-roster-result]')
  const total = $('[data-roster-total]')
  const people = $('[data-roster-people]')
  const sizesEl = $('[data-roster-sizes]')
  const flags = $('[data-roster-flags]')
  const flagsH = $('[data-roster-flags-h]')
  const flagList = $('[data-roster-flaglist]')
  const line = $('[data-roster-line]')
  const lineNote = $('[data-roster-line-note]')
  const done = $('[data-roster-action-status]')
  const btnTemplate = $('[data-roster-template]')
  const btnClear = $('[data-roster-clear]')
  const btnUndo = $('[data-roster-undo]')
  const sizes = sizesOf(root.dataset.sizes)
  let res = null
  let undo = null
  let timer = 0
  let shown = null

  const say = (t) => { done.textContent = ''; window.setTimeout(() => { done.textContent = t }, 30) }

  function render() {
    const text = input.value
    /* ข้อความเดิม = ไม่สร้างรายการใหม่ (blur ตอนกดรายการที่ต้องตรวจจะได้ไม่ลบลิงก์ที่กำลังกด) */
    if (text === shown) return
    shown = text
    res = parseRoster(text, { sizes })
    btnClear.disabled = !text.trim()
    if (!res.people) {
      result.hidden = true
      input.removeAttribute('aria-invalid')
      status.textContent = text.trim() ? 'ยังอ่านรายชื่อไม่ได้ ใส่ชื่อและไซซ์บรรทัดละคน' : 'ยังไม่มีรายชื่อ วางรายชื่อ หรือกด "เริ่มจากแม่แบบ" เพื่อดูตัวอย่าง'
      return
    }
    result.hidden = false
    total.textContent = String(res.total)
    people.textContent = res.unsized ? `จาก ${res.people} คน · ยังไม่มีไซซ์ ${res.unsized} คน` : `จาก ${res.people} คน`
    sizesEl.replaceChildren(...res.counts.map((c) => {
      const li = document.createElement('li')
      const b = document.createElement('b')
      b.textContent = c.size
      const n = document.createElement('span')
      n.textContent = `${c.n} ตัว`
      li.append(b, n)
      return li
    }))
    sizesEl.hidden = !res.counts.length

    flags.hidden = !res.flagged.length
    flagsH.textContent = `ต้องตรวจ ${res.flagged.length} บรรทัด`
    flagList.replaceChildren(...res.flagged.map((r) => {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = '#roster-input'
      a.dataset.line = String(r.line)
      const head = document.createElement('b')
      head.textContent = `บรรทัด ${r.line}`
      const raw = document.createElement('span')
      raw.className = 'rst__raw'
      raw.textContent = r.raw
      const why = document.createElement('span')
      why.className = 'rst__why'
      why.textContent = r.issues.map((i) => issueText(i)).join(' · ')
      a.append(head, raw, why)
      li.append(a)
      return li
    }))
    /* ช่องรายชื่อชี้ไปหารายการที่ต้องตรวจด้วย ให้โปรแกรมอ่านหน้าจอรู้ว่ามีบรรทัดที่ต้องแก้ */
    input.setAttribute('aria-describedby', res.flagged.length ? 'roster-help roster-status roster-flags-h' : 'roster-help roster-status')

    line.href = rosterLineUrl(res)
    lineNote.textContent = 'ลิงก์ LINE ส่งแค่ยอดต่อไซซ์ ไม่มีชื่อคน กดคัดลอกรายชื่อทั้งหมดแล้ววางในแชทเดียวกัน หรือแนบไฟล์ CSV'

    status.textContent = `รวม ${res.total} ตัว ใน ${res.counts.length} ไซซ์ จาก ${res.people} คน` + (res.flagged.length ? ` · ต้องตรวจ ${res.flagged.length} บรรทัด` : ' · ไม่มีบรรทัดที่ต้องตรวจ')
  }

  /* พิมพ์ = รอให้หยุดก่อนค่อยนับ (ไม่ประกาศทุกตัวอักษร) · วาง / กดปุ่ม = นับทันที */
  const later = () => { window.clearTimeout(timer); timer = window.setTimeout(() => { store.set(input.value); render() }, 500) }
  const now = () => { window.clearTimeout(timer); store.set(input.value); render() }

  input.addEventListener('input', later)
  input.addEventListener('paste', () => window.setTimeout(now, 0))
  input.addEventListener('blur', now)

  const replace = (text, msg) => {
    if (input.value.trim()) { undo = input.value; btnUndo.hidden = false } else { undo = null; btnUndo.hidden = true }
    input.value = text
    now()
    say(msg)
  }
  btnTemplate.addEventListener('click', () => { replace(TEMPLATE, 'ใส่แม่แบบแล้ว แก้ชื่อและไซซ์ในช่องได้เลย'); input.focus() })
  btnClear.addEventListener('click', () => { replace('', 'ล้างรายชื่อแล้ว ร่างในเครื่องนี้ถูกลบด้วย'); store.clear(); input.focus() })
  btnUndo.addEventListener('click', () => {
    if (undo == null) return
    input.value = undo
    undo = null
    btnUndo.hidden = true
    now()
    say('เอารายชื่อเดิมกลับมาแล้ว')
    input.focus()
  })

  /* กดรายการที่ต้องตรวจ → ไปที่ช่องรายชื่อแล้วเลือกบรรทัดนั้น */
  flagList.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-line]')
    if (!a) return
    e.preventDefault()
    const n = Number(a.dataset.line)
    const lines = input.value.split('\n')
    const start = lines.slice(0, n - 1).reduce((s, l) => s + l.length + 1, 0)
    /* เลื่อนเองแทนให้ focus เลื่อน · CSS scroll-margin-top เว้นที่ให้หัวเว็บและสารบัญที่ติดด้านบน */
    input.focus({ preventScroll: true })
    input.scrollIntoView({ block: 'start' })
    input.setSelectionRange(start, start + (lines[n - 1] || '').length)
    /* เลื่อนช่องให้เห็นบรรทัดนั้นโดยประมาณ */
    const lh = parseFloat(getComputedStyle(input).lineHeight) || 28
    input.scrollTop = Math.max(0, (n - 2) * lh)
  })

  $('[data-roster-copy]').addEventListener('click', async () => {
    if (!res?.people) return
    const text = rosterTable(res)
    try {
      await navigator.clipboard.writeText(text)
      say(`คัดลอกรายชื่อ ${res.people} คนแล้ว วางในแชท Excel หรือ Google Sheets ได้เลย`)
    } catch {
      /* คัดลอกอัตโนมัติไม่ได้ (เบราว์เซอร์ในแอปบางตัว) → เลือกข้อความในช่องให้คัดลอกเอง */
      input.focus()
      input.select()
      say('คัดลอกอัตโนมัติไม่ได้ในเบราว์เซอร์นี้ เลือกข้อความในช่องรายชื่อให้แล้ว กดคัดลอกเองได้เลย')
    }
  })

  $('[data-roster-csv]').addEventListener('click', () => {
    if (!res?.people) return
    const blob = new Blob([rosterCsv(res)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teamdee-size-roster-${todayLocal()}.csv`
    document.body.append(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    say(`ดาวน์โหลดไฟล์ CSV ${res.people} คนแล้ว เปิดใน Excel ได้ ภาษาไทยไม่เพี้ยน`)
  })

  line.addEventListener('click', () => say('เปิด LINE แล้ว ตรวจข้อความก่อนกดส่งในแชท'))

  const draft = store.get()
  if (draft) {
    input.value = draft
    render()
  } else render()
}

document.querySelectorAll('[data-roster]').forEach(init)
