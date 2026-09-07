import '../styles/main.css'
import { initNav } from './nav.js'
import site from '../data/site.json'
import { baht, unitPrice, qs, today, addDays, leadDays, fmtFull, TH_MONTH } from './lib.js'

initNav()

const form = document.getElementById('briefForm')
if (form) {
  const $ = (id) => document.getElementById(id)
  const sum = (k) => document.querySelector(`[data-s="${k}"]`)
  const msg = $('formMsg')
  const dateNote = $('dateNote')

  /* ---------- รับค่าที่ส่งต่อมาจากหน้าคำนวณราคา จะได้ไม่ต้องกรอกซ้ำ ---------- */
  const pQty = qs('qty')
  const pCollar = qs('collar')
  const pTech = qs('tech')
  if (pQty) $('bQty').value = pQty
  if (pCollar === '1') $('bCollar').value = 'คอปก / คางหมู'
  if (pTech) {
    const opt = [...$('bTech').options].find((o) => o.value === pTech)
    if (opt) $('bTech').value = pTech
  }

  /* ค่าเริ่มต้นของวันใช้งาน ตั้งไว้ล่วงหน้า 90 วัน ให้เห็นผลทันทีโดยไม่ต้องกรอก */
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  if (!$('bDate').value) $('bDate').value = iso(addDays(today(), 90))
  $('bDate').min = iso(today())

  const collarIsPlacket = () => $('bCollar').value.startsWith('คอปก')

  const render = () => {
    const qty = Math.max(0, parseInt($('bQty').value, 10) || 0)
    sum('group').textContent = $('bGroup').value || '—'
    sum('qty').textContent = qty ? `${baht(qty)} ตัว` : '—'

    if (qty >= 10) {
      const u = unitPrice(qty, collarIsPlacket())
      sum('unit').textContent = `${baht(u)} บาท`
      sum('total').textContent = `${baht(u * qty)} บาท`
    } else {
      sum('unit').textContent = '—'
      sum('total').textContent = '—'
    }

    const v = $('bDate').value
    if (v) {
      const [y, m, d] = v.split('-').map(Number)
      const ev = new Date(y, m - 1, d)
      sum('date').textContent = `${d} ${TH_MONTH[m - 1]} ${y + 543}`
      const start = addDays(ev, -leadDays())
      const left = Math.round((start - today()) / 86400000)
      dateNote.textContent =
        left > 21 ? `เวลาพอสบาย ควรเริ่มบรีฟภายใน ${fmtFull(start)} ยังเหลืออีก ${left} วัน`
        : left >= 0 ? `เริ่มได้แล้ว ควรบรีฟภายใน ${fmtFull(start)} เหลือ ${left} วัน`
        : `วันนี้เลยกำหนดที่ควรเริ่มมา ${Math.abs(left)} วันแล้ว ยังพอมีทาง แต่ต้องคุยเรื่องคิวก่อน`
      dateNote.className = 'help ' + (left >= 0 ? 'text-ok' : 'text-alert')
    } else {
      sum('date').textContent = '—'
    }
  }

  for (const id of ['bGroup', 'bQty', 'bDate', 'bCollar']) $(id).addEventListener('input', render)
  render()

  /* ---------- ประกอบข้อความสรุปให้ก๊อปไปวางในไลน์ได้เลย ----------
     ต้นแบบนี้ยังไม่มีหลังบ้านรับข้อมูล จึงไม่ทำเป็นฟอร์มที่กดแล้วเงียบ
     แต่ให้สรุปเป็นข้อความพร้อมส่ง ซึ่งใช้งานได้จริงตั้งแต่วันนี้ */
  const buildText = () => {
    const lines = ['ขอปรึกษาเรื่องทำเสื้อครับ/ค่ะ', '']
    for (const f of form.querySelectorAll('input[name], select[name], textarea[name]')) {
      if (!f.value) continue
      lines.push(`${f.name}: ${f.value}`)
    }
    const est = sum('total').textContent
    if (est !== '—') lines.push('', `ประเมินจากเว็บ: ${sum('unit').textContent} ต่อตัว รวม ${est}`)
    return lines.join('\n')
  }

  /* ตรวจช่องเดียว คืนค่าว่าผ่านไหม พร้อมโชว์หรือซ่อนข้อความใต้ช่องนั้น */
  const required = ['bQty', 'bDate', 'bName', 'bTel']
  const checkField = (id) => {
    const f = $(id)
    const err = $(`${id}-err`)
    const ok = !!f.value.trim()
    f.classList.toggle('!border-alert', !ok)
    f.setAttribute('aria-invalid', String(!ok))
    if (err) err.hidden = ok
    return ok
  }

  /* ตรวจซ้ำตอนออกจากช่อง ไม่ตรวจระหว่างพิมพ์ จะได้ไม่ขึ้นแดงใส่ตั้งแต่ตัวอักษรแรก
     และพอแก้ถูกแล้วข้อความแดงต้องหายเองทันที ไม่ต้องรอกดส่งใหม่ */
  for (const id of required) {
    const f = $(id)
    f.addEventListener('blur', () => checkField(id))
    f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') checkField(id) })
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const box = $('formErrs')
    const list = $('formErrsList')
    const bad = required.filter((id) => !checkField(id))

    if (bad.length) {
      /* รวมทุกข้อที่ขาดไว้ข้างบน กดแล้วกระโดดไปช่องนั้นได้เลย
         โฟกัสไปที่กล่องสรุปแทนช่องแรก คนใช้ screen reader จะได้ยินครบว่าขาดอะไรบ้าง */
      list.innerHTML = ''
      for (const id of bad) {
        const label = form.querySelector(`label[for="${id}"]`)
        const name = label ? label.textContent.replace('*', '').trim() : id
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.href = `#${id}`
        a.className = 'font-semibold text-alert underline underline-offset-4 decoration-2 inline-flex items-center min-h-[44px]'
        a.textContent = `ยังไม่ได้กรอก${name}`
        a.addEventListener('click', (ev) => { ev.preventDefault(); $(id).focus() })
        li.append(a)
        list.append(li)
      }
      box.hidden = false
      box.focus()
      msg.className = 't-xs mt-3 text-alert font-semibold'
      msg.textContent = `ยังกรอกไม่ครบ ${bad.length} ช่อง ดูรายการด้านบนของฟอร์ม`
      return
    }
    box.hidden = true

    const text = buildText()
    let copied = false
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      copied = false
    }
    msg.className = 't-xs mt-3 text-ok font-semibold'
    msg.textContent = copied
      ? 'คัดลอกโจทย์ไว้ให้แล้ว กดทักไลน์แล้ววางส่งได้เลย'
      : 'ต้นแบบนี้ยังไม่ได้ต่อระบบส่งข้อมูล กดทักไลน์แล้วพิมพ์รายละเอียดตามสรุปด้านบนได้เลย'
    window.open(site.lineUrl, '_blank', 'noopener')
  })
}
