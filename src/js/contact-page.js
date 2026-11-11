import './page.js'
import '../styles/page-contact.css'
import '../styles/line-cta.css' // แบนเนอร์ LINE ใช้ร่วม /designs/ /project/ /contact-us/
import site from '../data/site.json'
import routes from '../data/routes.json'
import { qs, todayLocal } from './lib.js'
import { makeUrl } from './routes.js'
import { contextFromPath, sendContact, codeFromQuery, dateFromQuery, prefillFor, emailLooksOk, qtyFromQuery, lineMessageUrl, lineSummary, outcomeOf, failText, telOk, thanksFlag, toAsciiDigits, cleanFrom } from './contact-send.js'
import { trackEvent } from './track.js'
import { openNow } from './nudge.js'

const url = makeUrl(routes)

/* ฟอร์มติดต่อ · บังคับแค่ชื่อกับเบอร์ตาม Brief ข้อ 06
   ผลการส่ง 3 ทาง (อาร์ตเคาะ 24 ต.ค. ข้อ 6 · audit C2) · สีเขียวหรือคำว่า "ส่งแล้ว" ใช้ได้เฉพาะตอนส่งเข้าระบบสำเร็จจริง
   - สำเร็จ → ฝากธง (เบอร์ที่กรอก) ใน sessionStorage แล้วไป /thank-you/ · หน้าขอบคุณยิง td_form_submit เอง
   - off (ธีมยังไม่ตั้งอีเมลรับฟอร์ม) → แผง #formOff ส่งต่อทาง LINE ที่พิมพ์ข้อความไว้ให้ · บอกตรงๆ ว่ายังไม่ถึงทีมดี
   - error / network → กล่อง #formFail ใต้ปุ่มส่ง · ฟอร์มและข้อมูลอยู่ครบ มี LINE โทร และลองส่งอีกครั้ง
   คัดลอกข้อความเฉพาะตอนลูกค้ากดปุ่มเอง (เบราว์เซอร์ไม่ให้คัดลอกหลัง await และไม่ควรเขียนคลิปบอร์ดโดยไม่ถาม) */

const form = document.getElementById('contactForm')
if (form) {
  const $ = (id) => document.getElementById(id)
  const msg = $('formMsg')
  const box = $('formErrs')
  const list = $('formErrsList')
  const off = $('formOff')
  const fail = $('formFail')
  const REQUIRED = ['cName', 'cTel']

  /* hidden field บอกหน้าที่กดมา ให้ทีมขายรู้บริบทก่อนตอบ (Wireframe หน้าติดต่อ)
     ลำดับความน่าเชื่อ: ?from= ที่ปุ่มส่งมา > ?p= ?u= จากหน้าสินค้า/การใช้งาน > หน้าก่อนหน้าในเว็บเดียวกัน */
  const qProduct = qs('p')
  const qUse = qs('u')
  /* id แปลกปลอมจาก URL ไม่ทำให้ฟอร์มพัง แค่ไม่ใช้ */
  const safe = (key, id) => {
    try {
      const u = id ? url(key, id) : ''
      return typeof u === 'string' ? u : '' // ?p=__proto__ ได้ object จากตาราง routes
    } catch {
      return ''
    }
  }
  let from = cleanFrom(qs('from')) || safe('products', qProduct) || safe('uses', qUse)
  if (!from && document.referrer) {
    try {
      const r = new URL(document.referrer)
      if (r.origin === location.origin) from = r.pathname
    } catch {
      /* referrer อ่านไม่ได้ ก็ปล่อยว่าง */
    }
  }
  /* ไม่มี ?p= ?u= → เดาจากหน้าที่มา (แกลเลอรี/หน้าแบบ = พิมพ์ลาย + กลุ่มนั้น · ตรวจมือถือ 30 ต.ค.) */
  const ctx = qProduct || qUse ? { product: '', use: '' } : contextFromPath(from, routes)
  const fromProduct = qProduct || ctx.product
  const fromUse = qUse || ctx.use
  /* มาจากกล่องดูแบบ / ปุ่มขอราคาแบบนี้ (?code=) ใส่รหัสแบบไว้ให้ในรายละเอียด */
  const code = codeFromQuery(location.search)
  if (code && !$('cNote').value) $('cNote').value = `แบบที่สนใจ: ${code}\n`
  $('cFrom').value = (from || 'เข้าหน้าติดต่อโดยตรง') + (code ? ` · แบบ ${code}` : '')
  /* มาจากหน้าสินค้า (?p=) เลือกสินค้าในฟอร์มให้ก่อน · หน้ารวมเสื้อแบบพิเศษไม่มีในรายการ ปล่อยเป็นให้ช่วยเลือก */
  const pick = $('cProduct')
  if (pick && fromProduct && [...pick.options].some((o) => o.value === fromProduct)) pick.value = fromProduct
  /* มาจากหน้ากลุ่มลูกค้า (?u=) เลือกงานให้ และเดาสินค้าที่กลุ่มนั้นใช้บ่อย (ลูกค้าเปลี่ยนเองได้) */
  const USE_PRODUCT = { corp: 'polo', gov: 'polo', shop: 'polo', faculty: 'polo', edu: 'print', class: 'print', sport: 'print', badminton: 'print', running: 'print', event: 'print' }
  const useSel = $('cUse')
  if (useSel && fromUse && [...useSel.options].some((o) => o.value === fromUse)) {
    useSel.value = fromUse
    if (pick && !pick.value && USE_PRODUCT[fromUse]) pick.value = USE_PRODUCT[fromUse]
  }

  /* บริบทจากปุ่มที่ส่งมา (audit 26 ต.ค. M1): ขอเอกสาร / ขอใบเสนอราคา / หน้าคำนวณ / โปโลปัก / กลุ่มองค์กร / สั่งซ้ำ */
  const pre = prefillFor({ use: fromUse, from: qs('from') || '', product: fromProduct })
  if (pre) {
    for (const box of document.querySelectorAll('.js-doc')) if (pre.docs.includes(box.value)) box.checked = true
    const help = $('cMail-help')
    if (help && pre.emailHelp) help.textContent = pre.emailHelp
    /* กล่องข้อมูลองค์กรและเอกสารจัดซื้อพับไว้ (audit C3) · มาจากปุ่มที่ต้องมีเอกสารจัดซื้อ กางให้เลย */
    const orgBox = $('cOrgBox')
    if (orgBox && pre.openOrg) orgBox.open = true
    if (pre.reorder) {
      const h = $('form-h')
      if (h) h.textContent = 'สั่งซ้ำ / เพิ่มจำนวน · ฝากข้อมูลให้ติดต่อกลับ'
    }
  }
  /* จำนวนจากหน้าคำนวณ (?qty=) */
  const wantQty = qtyFromQuery(location.search)
  if (wantQty && !$('cQty').value) $('cQty').value = wantQty
  /* อีเมลผิดรูปแบบ: เตือนใต้ช่อง ไม่บล็อกการส่ง */
  const mail = $('cMail')
  const mailBad = $('cMail-bad')
  mail?.addEventListener('blur', () => { if (mailBad) mailBad.hidden = emailLooksOk(mail.value) })

  $('cDate').min = todayLocal()
  /* มาจากช่อง "วันที่ต้องใช้เสื้อ" บนหน้ากลุ่มลูกค้า (?date=) */
  const wantDate = dateFromQuery(location.search)
  /* วันย้อนหลังจากลิงก์เก่าไม่เข้าฟอร์ม (2 พ.ย.) */
  if (wantDate && wantDate >= todayLocal() && !$('cDate').value) $('cDate').value = wantDate

  /* ช่องว่าง = ข้อความ "ยังไม่ได้กรอก" · เบอร์กรอกแล้วแต่หลักไม่ครบ = ข้อความแยก (ธีมรับตั้งแต่ 9 หลัก ส่งไปก็ตีกลับ 400) */
  const checkField = (id) => {
    const f = $(id)
    const err = $(`${id}-err`)
    const badMsg = $(`${id}-bad`)
    const filled = !!f.value.trim()
    const valid = id === 'cTel' ? telOk(f.value) : true
    const ok = filled && valid
    f.classList.toggle('!border-alert', !ok)
    f.setAttribute('aria-invalid', String(!ok))
    if (err) err.hidden = filled
    if (badMsg) badMsg.hidden = !filled || valid
    return ok
  }
  /* ตรวจตอนออกจากช่องเฉพาะช่องที่พิมพ์แล้ว หรือหลังกดส่งครั้งแรก · แตะแล้วออกเฉยๆ ไม่ขึ้นแดง (ตรวจมือถือ 30 ต.ค.) */
  let tried = false
  for (const id of REQUIRED) {
    const f = $(id)
    f.addEventListener('blur', () => { if (tried || f.value.trim()) checkField(id) })
    f.addEventListener('input', () => {
      if (f.getAttribute('aria-invalid') === 'true') checkField(id)
    })
  }

  /* ข้อความเต็มสำหรับปุ่มคัดลอก (ลูกค้าวางเอง ไม่ผ่าน URL) · มีชื่อและเบอร์ได้ */
  const buildText = () => {
    const lines = ['ขอปรึกษาเรื่องทำเสื้อทีมครับ/ค่ะ', '']
    for (const f of form.querySelectorAll('input[name], select[name], textarea[name]')) {
      if (f.name === 'website' || f.type === 'hidden') continue
      if (f.type === 'checkbox' && !f.checked) continue
      if (!f.value.trim()) continue
      lines.push(`${f.name}: ${f.tagName === 'SELECT' ? f.selectedOptions[0].text : f.value}`)
    }
    return lines.join('\n')
  }

  const readFields = () => ({
    /* เลขไทย → อารบิกก่อนส่ง (server นับเฉพาะเลขอารบิก · 30 ต.ค.) */
    name: $('cName').value, tel: toAsciiDigits($('cTel').value), org: $('cOrg').value, email: $('cMail').value,
    qty: toAsciiDigits($('cQty').value), date: $('cDate').value, order: $('cOrder')?.value || '', product: pick?.selectedOptions[0]?.value ? pick.selectedOptions[0].text : '', note: $('cNote').value,
    use: useSel?.selectedOptions[0]?.value ? useSel.selectedOptions[0].text : '',
    docs: [...form.querySelectorAll('.js-doc:checked')].map((c) => c.value).join(', '),
    from: $('cFrom').value,
    website: form.elements.website?.value || '',
  })
  /* ลิงก์ LINE ที่พิมพ์ข้อความงานไว้ให้ · ไม่มีชื่อ เบอร์ อีเมล (อยู่ใน URL) */
  const lineHref = (fields) => lineMessageUrl(lineSummary({ ...fields, code }))

  /* ปุ่ม "คัดลอกข้อความ" · ลูกค้ากดเองเท่านั้น · clipboard API ไม่ได้ (http ในเครื่อง / เบราว์เซอร์เก่า) ใช้ textarea ชั่วคราว */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const t = document.createElement('textarea')
      t.value = text
      t.setAttribute('readonly', '')
      t.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
      document.body.append(t)
      t.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch { ok = false }
      t.remove()
      return ok
    }
  }
  for (const b of document.querySelectorAll('[data-copy]')) {
    b.addEventListener('click', async () => {
      const ok = await copyText(buildText())
      const out = b.closest('#formOff, #formFail')?.querySelector('[data-copy-msg]')
      if (out) out.textContent = ok ? 'คัดลอกแล้ว วางในแชท LINE ได้เลย' : 'คัดลอกไม่ได้ พิมพ์รายละเอียดในแชท LINE แทนได้เลย'
    })
  }

  const showFail = (sent, fields) => {
    $('failMsg').textContent = failText(sent)
    $('failLine').href = lineHref(fields)
    for (const m of fail.querySelectorAll('[data-copy-msg]')) m.textContent = ''
    fail.classList.remove('hidden')
    fail.focus()
  }

  form.addEventListener('submit', async (e) => {
    tried = true
    e.preventDefault()
    fail.classList.add('hidden')
    const bad = REQUIRED.filter((id) => !checkField(id))

    if (bad.length) {
      list.innerHTML = ''
      for (const id of bad) {
        const label = form.querySelector(`label[for="${id}"]`)
        const name = label ? label.textContent.replace('*', '').trim() : id
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.href = `#${id}`
        a.className = 'font-semibold text-alert underline underline-offset-4 decoration-2 inline-flex items-center min-h-[44px]'
        a.textContent = $(id).value.trim() ? `${name}ควรมี 9–10 หลัก` : `ยังไม่ได้กรอก${name}`
        a.addEventListener('click', (ev) => {
          ev.preventDefault()
          $(id).focus()
        })
        li.append(a)
        list.append(li)
      }
      box.classList.remove('hidden')
      box.focus()
      msg.className = 't-xs mt-3 text-alert font-semibold'
      msg.textContent = `ยังต้องแก้ ${bad.length} ช่อง ดูรายการด้านบน`
      return
    }

    box.classList.add('hidden')
    const btn = form.querySelector('[type="submit"]')
    const fields = readFields()
    btn?.setAttribute('disabled', '')
    btn?.setAttribute('aria-busy', 'true')
    msg.className = 't-xs mt-3'
    msg.textContent = window.TD_FORM?.enabled ? 'กำลังส่งข้อมูล…' : ''
    const sent = await sendContact(fields, window.TD_FORM)
    msg.textContent = ''
    const out = outcomeOf(sent)
    /* ส่งสำเร็จแล้วกำลังไปหน้าขอบคุณ: ปุ่มยังปิดไว้ กันกดซ้ำได้ข้อมูลซ้ำ (30 ต.ค.) */
    if (out.view !== 'thanks') {
      btn?.removeAttribute('disabled')
      btn?.removeAttribute('aria-busy')
    }

    if (out.view === 'thanks') {
      /* ฝากเบอร์ให้หน้าขอบคุณแสดง และให้หน้านั้นยิง td_form_submit · เก็บไม่ได้ (โหมดส่วนตัว) ยิงที่นี่แทน ดีกว่าไม่นับ */
      let flagged = false
      try {
        sessionStorage.setItem('td-thanks', thanksFlag({ tel: fields.tel, from: fields.from }))
        flagged = true
      } catch {
        flagged = false
      }
      if (!flagged) trackEvent('form', { td_form: 'contactForm', td_from: fields.from })
      location.assign(out.to)
      return
    }

    if (out.view === 'off') {
      $('offLine').href = lineHref(fields)
      for (const m of off.querySelectorAll('[data-copy-msg]')) m.textContent = ''
      form.classList.add('hidden')
      off.classList.remove('hidden')
      off.focus()
      off.scrollIntoView({ block: 'center' })
      return
    }

    showFail(sent, fields)
  })

  $('failRetry')?.addEventListener('click', () => form.requestSubmit())

  $('offBack')?.addEventListener('click', () => {
    off.classList.add('hidden')
    form.classList.remove('hidden')
    $('cName').focus()
  })
}

/* สถานะเปิด/ปิดในการ์ดออฟฟิศ (รอบ 170c · บอร์ด "เปิดให้บริการตามปกติ") ตามเวลาไทยจริง · ไม่มี JS = แสดงเวลาทำการเฉยๆ */
for (const el of document.querySelectorAll('[data-open-status]')) {
  const hours = el.dataset.hours || ''
  const on = openNow(new Date(), hours)
  const m = /(\d{2}):(\d{2})-/.exec(hours)
  const t = el.querySelector('[data-open-t]')
  el.classList.toggle('is-open', on)
  if (t) t.textContent = on ? 'เปิดให้บริการอยู่ตอนนี้' : m ? `ตอนนี้ปิดแล้ว · เปิดอีกครั้ง ${+m[1]}:${m[2]} น.` : t.textContent
}
