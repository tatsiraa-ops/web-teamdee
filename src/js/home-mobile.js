import { addRailControls } from './mobile-ui.js'

/** Mobile-only presentation. Move existing nodes, and restore them on desktop. */
export function initHomeMobile() {
  const mobile = matchMedia('(max-width: 767px)')
  const undo = []
  const move = (node, parent, before = null) => {
    const marker = document.createComment('mobile-position')
    node.before(marker)
    parent.insertBefore(node, before)
    undo.push(() => { marker.replaceWith(node) })
  }
  const fold = (parent, heading, content, className, open = false) => {
    const details = document.createElement('details')
    details.className = `hm-mobile-fold ${className}`
    details.open = open
    const summary = document.createElement('summary')
    const body = document.createElement('div')
    body.className = 'hm-mobile-fold__body'
    details.append(summary, body)
    heading.before(details)
    undo.push(() => details.remove())
    move(heading, summary)
    content.forEach(node => move(node, body))
  }
  const mount = () => {
    // เมนูมือถือพับด้วย <details> ใน siteHeader.hbs ทุกหน้าแล้ว (29 ต.ค.) ไม่ต้องพับด้วยสคริปต์
    // ท้ายเว็บพับด้วย mobile-ui.js ทุกหน้าแล้ว (30 ต.ค.)
    document.querySelectorAll('.hm-care__prepare').forEach(box => {
      fold(box, box.querySelector('h4'), [box.querySelector('ul')], 'hm-mobile-care')
    })
    document.querySelectorAll('.hm-process__panel').forEach((panel, index) => {
      const heading = panel.querySelector('.hm-process__mobile-copy')
      /* ปิดทุกข้อไว้ก่อน กดเปิดทีละข้อ (29 ต.ค. อาร์ต "ทาง ก" · เดิมเปิดข้อแรก รูปสูง ~480px) */
      fold(panel, heading, [...panel.children].filter(el => el !== heading), 'hm-mobile-process', false)
    })
    // ย้ายภาพแบรนด์ไปใต้ .hm-brand-story__lead ถูกตัดแล้ว (4 พ.ย.): ส่วนนี้รื้อใหม่ไม่มี lead แล้ว · เดิม null.nextSibling ทำทั้งฟังก์ชันพังบนมือถือ

    // โลโก้ลูกค้า: มือถือใช้ 2 แถวเลื่อนเองแบบเดียวกับจอใหญ่ (29 ต.ค. อาร์ต) ไม่รวมแถว

    // ผลงาน 4 แถวรวมเป็นรางเดียว (29 ต.ค. อาร์ต "ทาง ก" หน้าแรกมือถือสั้นลง) · คำบรรยายนำด้วยชื่อประเภท · แถวที่ว่างซ่อนด้วย CSS
    const workGroups = [...document.querySelectorAll('#real-work .reference-work-group')]
    const workRail = workGroups[0]?.querySelector('.reference-work-grid')
    if (workRail && workGroups.length > 1) {
      workGroups.forEach((group, gi) => {
        const kind = group.querySelector('h3')?.textContent.trim()
        group.querySelectorAll('.reference-work-grid > figure').forEach(fig => {
          const cap = fig.querySelector('figcaption')
          if (cap && kind) {
            const tag = document.createElement('b')
            tag.className = 'hm-work-kind'
            tag.textContent = kind
            cap.prepend(tag)
            undo.push(() => tag.remove())
          }
          if (gi) move(fig, workRail)
        })
        if (gi) { group.classList.add('is-merged'); undo.push(() => group.classList.remove('is-merged')) }
      })
      const works = document.getElementById('real-work')
      works.classList.add('is-merged-works')
      undo.push(() => works.classList.remove('is-merged-works'))
    }

    // Combine real review cards; the desktop marquee keeps its original nodes on restore.
    const rvm = document.querySelector('#reviews [data-rvm]')
    if (rvm) {
      rvm.dataset.manualMobile = 'true'
      undo.push(() => delete rvm.dataset.manualMobile)
      const tracks = [...rvm.querySelectorAll('.rvm__track')]
      tracks.slice(1).forEach(track => [...track.children].filter(el => !el.classList.contains('rvm__dup')).forEach(el => move(el, tracks[0])))
      rvm.querySelector('.rvm__row').scrollLeft = 0
      const all = document.querySelector('#reviews > header > .hm-more')
      if (all) {
        const holder = document.createElement('div')
        holder.className = 'wrap hm-mobile-review-all'
        rvm.after(holder)
        undo.push(() => holder.remove())
        move(all, holder)
      }
    }
  }
  const sync = () => {
    while (undo.length) undo.pop()()
    if (mobile.matches) mount()
  }
  sync()
  mobile.addEventListener('change', sync)

  // The native select delegates to the existing filter, so counts and lightboxes stay in sync.
  const bar = document.querySelector('[data-gallery-filter]')
  if (bar) {
    const label = document.createElement('label')
    label.className = 'hm-mobile-filter'
    label.textContent = 'เลือกกลุ่มลูกค้า'
    const select = document.createElement('select')
    const buttons = [...bar.querySelectorAll('[data-use]')]
    buttons.forEach(button => {
      const option = document.createElement('option')
      option.value = button.dataset.use
      option.textContent = button.querySelector('b') ? `${button.querySelector('span').textContent} (${button.querySelector('b').textContent})` : button.querySelector('span').textContent /* 3 พ.ย. ชิปหน้าแรกไม่มีจำนวนแล้ว */
      select.append(option)
    })
    label.append(select)
    bar.before(label)
    select.addEventListener('change', () => buttons.find(b => b.dataset.use === select.value)?.click())
    bar.addEventListener('click', e => { const b = e.target.closest('[data-use]'); if (b) select.value = b.dataset.use })
  }

  // A count plus arrow controls work even when a video iframe captures a swipe. (ชุดกลางใน mobile-ui.js · 30 ต.ค.)
  document.querySelectorAll('#services .hm-cats,#home-clips .vgrid,#real-work .reference-work-grid,#homeCustomerPhotos').forEach(rail => addRailControls(rail, 'hm-mobile-rail-controls'))
}
