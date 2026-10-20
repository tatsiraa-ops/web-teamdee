import './page.js'

/* ไฮไลต์หัวข้อที่กำลังอ่านในสารบัญ ให้คนรู้ว่าตัวเองอยู่ตรงไหนในคู่มือยาว

   ไม่ใช้ IntersectionObserver เพราะตอนกระโดดไกลด้วยลิงก์ #anchor มันไม่ยิง callback
   และไม่ใช้ requestAnimationFrame มาคุมจังหวะ เพราะ rAF ถูกหยุดเมื่อแท็บไม่ได้แสดงผล
   ซึ่งจะทำให้ตัวกันรัวค้างแล้วไฮไลต์ไม่ขยับอีกเลย

   วิธีที่เหลือคืออ่าน offsetTop ที่แคชไว้เทียบกับ scrollY ตรงๆ ไม่แตะ layout ระหว่างเลื่อน */
const toc = document.getElementById('guideToc')
const secs = [...document.querySelectorAll('.guide-sec, .art-sec')]

if (toc && secs.length) {
  const links = new Map([...toc.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]))
  let tops = []
  let last = null

  const measure = () => {
    tops = secs.map((s) => {
      let y = 0
      for (let el = s; el; el = el.offsetParent) y += el.offsetTop
      return { id: s.id, y }
    })
  }

  const mark = (id) => {
    if (id === last) return
    last = id
    links.forEach((a, k) => (k === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')))
  }

  const update = () => {
    // ถึงท้ายหน้าแล้วให้ไฮไลต์หัวข้อสุดท้าย ไม่งั้นหัวข้อปิดท้ายจะไม่มีวันถูกไฮไลต์
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) return mark(tops[tops.length - 1].id)

    // หัวข้อที่กำลังอ่าน = อันล่าสุดที่เลื่อนผ่านเส้น 40% ของจอไปแล้ว
    const line = scrollY + innerHeight * 0.4
    let cur = tops[0].id
    for (const t of tops) {
      if (t.y <= line) cur = t.id
      else break
    }
    mark(cur)
  }

  measure()
  update()
  addEventListener('scroll', update, { passive: true })
  addEventListener('resize', () => {
    measure()
    update()
  })
  addEventListener('load', () => {
    measure()
    update()
  })
}
