import './page.js'
import site from '../data/site.json'
import routes from '../data/routes.json'
import { qs } from './lib.js'
import { makeUrl } from './routes.js'
import { sendContact, codeFromQuery, dateFromQuery, b2bPrefill, lineUrlFor } from './contact-send.js'
import { trackEvent } from './track.js'

const url = makeUrl(routes)

/* ฟอร์มติดต่อ · บังคับแค่ชื่อกับเบอร์ตาม Brief ข้อ 06
   ต้นแบบยังไม่มีหลังบ้านเก็บข้อมูล จึงประกอบข้อความให้แล้วคัดลอกไว้ให้วางในไลน์
   เขียนตรงๆ ว่าทำแบบนี้ ไม่แกล้งว่าส่งเข้าระบบแล้ว */

const form = document.getElementById('contactForm')
if (form) {
  const $ = (id) => document.getElementById(id)
  const msg = $('formMsg')
  const box = $('formErrs')
  const list = $('formErrsList')
  const done = $('formDone')
  const REQUIRED = ['cName', 'cTel']

  /* hidden field บอกหน้าที่กดมา ให้ทีมขายรู้บริบทก่อนตอบ (Wireframe หน้าติดต่อ)
     ลำดับความน่าเชื่อ: ?from= ที่ปุ่มส่งมา > ?p= ?u= จากหน้าสินค้า/การใช้งาน > หน้าก่อนหน้าในเว็บเดียวกัน */
  const fromProduct = qs('p')
  const fromUse = qs('u')
  /* id แปลกปลอมจาก URL ไม่ทำให้ฟอร์มพัง แค่ไม่ใช้ */
  const safe = (key, id) => {
    try {
      return id ? url(key, id) : ''
    } catch {
      return ''
    }
  }
  let from = qs('from') || safe('products', fromProduct) || safe('uses', fromUse)
  if (!from && document.referrer) {
    try {
      const r = new URL(document.referrer)
      if (r.origin === location.origin) from = r.pathname
    } catch {
      /* referrer อ่านไม่ได้ ก็ปล่อยว่าง */
    }
  }
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

  const b2b = b2bPrefill(fromUse)
  if (b2b) {
    for (const box of document.querySelectorAll('.js-doc')) if (b2b.docs.includes(box.value)) box.checked = true
    const help = $('cMail-help')
    if (help) help.textContent = b2b.emailHelp
  }

  $('cDate').min = new Date().toISOString().slice(0, 10)
  /* มาจากช่อง "วันที่ต้องใช้เสื้อ" บนหน้ากลุ่มลูกค้า (?date=) */
  const wantDate = dateFromQuery(location.search)
  if (wantDate && !$('cDate').value) $('cDate').value = wantDate

  const checkField = (id) => {
    const f = $(id)
    const err = $(`${id}-err`)
    const ok = !!f.value.trim()
    f.classList.toggle('!border-alert', !ok)
    f.setAttribute('aria-invalid', String(!ok))
    if (err) err.hidden = ok
    return ok
  }
  for (const id of REQUIRED) {
    const f = $(id)
    f.addEventListener('blur', () => checkField(id))
    f.addEventListener('input', () => {
      if (f.getAttribute('aria-invalid') === 'true') checkField(id)
    })
  }

  const buildText = () => {
    const lines = ['ขอปรึกษาเรื่องทำเสื้อทีมครับ/ค่ะ', '']
    for (const f of form.querySelectorAll('input[name], select[name], textarea[name]')) {
      if (f.type === 'file' || f.name === 'website') continue
      if (f.type === 'checkbox' && !f.checked) continue
      if (!f.value.trim()) continue
      lines.push(`${f.name}: ${f.value}`)
    }
    const files = [...($('cFiles').files || [])].map((f) => f.name)
    if (files.length) lines.push('', `ไฟล์ที่จะส่งตามมา: ${files.join(', ')}`)
    return lines.join('\n')
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
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
        a.textContent = `ยังไม่ได้กรอก${name}`
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
      msg.textContent = `ยังกรอกไม่ครบ ${bad.length} ช่อง ดูรายการด้านบน`
      return
    }

    box.classList.add('hidden')
    const btn = form.querySelector('[type="submit"]')

    /* ส่งเข้าระบบจริงก่อน (ธีม WordPress ตั้งอีเมลรับฟอร์มแล้ว) · ไม่ได้ก็ใช้ทางสำรองด้านล่าง */
    const fields = {
      name: $('cName').value, tel: $('cTel').value, org: $('cOrg').value, email: $('cMail').value,
      qty: $('cQty').value, date: $('cDate').value, product: pick?.selectedOptions[0]?.value ? pick.selectedOptions[0].text : '', note: $('cNote').value,
      use: useSel?.selectedOptions[0]?.value ? useSel.selectedOptions[0].text : '',
      docs: [...form.querySelectorAll('.js-doc:checked')].map((c) => c.value).join(', '),
      from: $('cFrom').value, files: [...($('cFiles').files || [])].map((f) => f.name).join(', '),
      website: form.elements.website?.value || '',
    }
    btn?.setAttribute('disabled', '')
    btn?.setAttribute('aria-busy', 'true')
    msg.className = 't-xs mt-3'
    msg.textContent = window.TD_FORM?.enabled ? 'กำลังส่งข้อมูล…' : ''
    const sent = await sendContact(fields, window.TD_FORM)
    btn?.removeAttribute('disabled')
    btn?.removeAttribute('aria-busy')
    $('doneLine').href = lineUrlFor(code, site.lineUrl)
    if (sent.ok) {
      trackEvent('form', { td_form: 'contactForm', td_from: fields.from })
      if (sent.redirect) {
        location.assign(sent.redirect)
        return
      }
      $('doneMsg').textContent = 'ส่งข้อมูลให้ทีมดีแล้ว ทีมจะติดต่อกลับตามเบอร์ที่ให้ไว้ ถ้ามีไฟล์แบบหรือโลโก้ ส่งตามได้ทาง LINE'
      form.classList.add('hidden')
      done.classList.remove('hidden')
      done.focus()
      done.scrollIntoView({ block: 'center' })
      msg.textContent = ''
      return
    }
    if (sent.reason === 'error' || sent.reason === 'network') {
      msg.className = 't-xs mt-3 text-alert font-semibold'
      msg.textContent = 'ส่งข้อมูลไม่สำเร็จ ข้อมูลยังอยู่ครบ กดเปิด LINE ด้านล่างแล้ววางข้อความส่งได้เลย หรือโทร ' + site.phonePrimary
    }

    const text = buildText()
    let copied = false
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      copied = false
    }

    /* สถานะสำเร็จแสดงในหน้า ไม่พาไปหน้าใหม่ ข้อมูลที่กรอกยังอยู่ครบถ้าอยากกลับมาแก้ */
    $('doneMsg').textContent = copied
      ? 'คัดลอกข้อมูลที่กรอกไว้ให้แล้ว กดปุ่มด้านล่างเพื่อเปิดไลน์ แล้ววางข้อความส่งได้เลย ถ้ามีไฟล์ก็ส่งตามไปในแชทเดียวกัน'
      : 'กดปุ่มด้านล่างเพื่อเปิดไลน์ แล้วพิมพ์รายละเอียดตามที่กรอกไว้ได้เลย ข้อมูลยังอยู่ในฟอร์ม กดย้อนกลับเพื่อดูได้'
    form.classList.add('hidden')
    done.classList.remove('hidden')
    done.focus()
    done.scrollIntoView({ block: 'center' })
    msg.textContent = ''
  })

  $('doneBack')?.addEventListener('click', () => {
    done.classList.add('hidden')
    form.classList.remove('hidden')
    $('cName').focus()
  })
}
