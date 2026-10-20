import './page.js'
import site from '../data/site.json'
import routes from '../data/routes.json'
import { qs } from './lib.js'
import { makeUrl } from './routes.js'

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
  $('cFrom').value = from || 'เข้าหน้าติดต่อโดยตรง'

  $('cDate').min = new Date().toISOString().slice(0, 10)

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
      if (f.type === 'file') continue
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
      : 'ต้นแบบนี้ยังไม่ได้ต่อระบบส่งข้อมูล กดเปิดไลน์แล้วพิมพ์รายละเอียดตามที่กรอกไว้ได้เลย ข้อมูลยังอยู่ในฟอร์มด้านล่าง'
    $('doneLine').href = site.lineUrl
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
