/* ปุ่มย้อนกลับของมือถือ (Android) ปิดหน้าต่างซ้อน แทนที่จะออกจากหน้า (30 ต.ค. รอบ 46 · ลองใช้จริงข้อ 3)
   เปิดหน้าต่าง → เพิ่มประวัติ 1 ขั้น (URL เดิม · state บอกความลึก) · กดย้อนกลับ → ปิดเฉพาะหน้าต่างที่ลึกกว่าขั้นที่ถอยไป
   ปิดด้วยปุ่มในหน้าต่าง → ถอยขั้นของตัวเองออก · กดลิงก์ในหน้าต่างไปหน้าอื่น → แทนที่ขั้นนั้น ไม่ทิ้งประวัติค้าง
   รอบ 47 (ตรวจละเอียด): ซ้อนกัน 2 ชั้น (ป๊อปอัปทับเมนู) เดิมย้อนกลับครั้งเดียวปิดทั้งคู่และค้างประวัติ 1 ขั้น
   ใช้กับรูปใหญ่ (lightbox.js) รีวิว (review-dialog.js) เมนูมือถือ (nav.js) ป๊อปอัปโปร (promo-popup.js) */

/** env = { push(state), back(), listen(fn), state() } · ทดสอบด้วย history จำลองได้ */
export function createBackStack(env) {
  const stack = []
  /* reload ตอนหน้าต่างเปิดอยู่ = ขั้นประวัติของหน้าต่างค้างแต่ไม่มีหน้าต่างเปิด · ลบขั้นด้วย JS ไม่ได้ → ล้าง state แล้วถอยออก ไม่งั้นย้อนกลับครั้งแรกไม่ทำอะไร (2 พ.ย.: 30 ต.ค. ล้างอย่างเดียวไม่พอ) */
  if (env.state()?.tdOverlay && env.replace) { env.replace(null); env.back() }
  env.listen(() => {
    const depth = env.state()?.tdOverlay || 0
    while (stack.length > depth) {
      const entry = stack.pop()
      if (!entry.pushed) continue
      entry.pushed = false
      if (entry.isOpen()) entry.close()
    }
  })
  const drop = (entry) => {
    const i = stack.indexOf(entry)
    if (i >= 0) stack.splice(i, 1)
    return i
  }
  /** isOpen() = เปิดอยู่ไหม · close() = ฟังก์ชันปิดเดิมของหน้าต่าง · root = กล่องหน้าต่าง (ดักลิงก์ที่พาออกจากหน้า) */
  return (isOpen, close, root = null) => {
    const entry = { isOpen, close, pushed: false }
    const ctl = {
      opened() {
        if (entry.pushed) return
        entry.pushed = true
        stack.push(entry)
        env.push({ tdOverlay: stack.length })
      },
      closed() {
        if (!entry.pushed) return
        entry.pushed = false
        const wasTop = stack[stack.length - 1] === entry
        drop(entry)
        /* ปิดตัวล่างขณะมีตัวบนเปิด (ไม่ควรเกิด) ไม่ถอย กันปิดตัวบนตามไปด้วย */
        if (wasTop) env.back()
      },
      /** ออกจากหน้าแล้ว ไม่ต้องถอยประวัติ */
      forget() {
        if (!entry.pushed) return
        entry.pushed = false
        drop(entry)
      },
    }
    /* ลิงก์ในหน้าต่างที่เปิดแท็บเดิม: แทนที่ขั้นของหน้าต่าง (ย้อนกลับจากหน้าใหม่ = กลับหน้าเดิมทันที) */
    root?.addEventListener('click', (e) => {
      const a = e.target.closest?.('a[href]')
      if (!a || !entry.pushed || e.defaultPrevented || a.target === '_blank' || a.hasAttribute('download')) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const raw = a.getAttribute('href')
      if (/^(tel:|mailto:|#)/.test(raw)) return
      e.preventDefault()
      const url = new URL(a.href, location.href)
      const samePage = url.origin === location.origin && url.pathname === location.pathname && url.search === location.search
      ctl.forget()
      /* ลิงก์ #ส่วน ในหน้าเดียวกัน: ปิดหน้าต่างแล้วเลื่อนไป (replace ไม่โหลดหน้าใหม่) */
      if (samePage) close()
      location.replace(url.href)
    })
    return ctl
  }
}

const browser = {
  push: (state) => history.pushState(state, ''),
  replace: (state) => history.replaceState(state, ''),
  back: () => history.back(),
  listen: (fn) => addEventListener('popstate', fn),
  state: () => history.state,
}

let shared = null
/** ตัวเดียวทั้งหน้า (ทุกหน้าต่างใช้ stack เดียวกัน) */
export function backClose(isOpen, close, root) {
  if (!shared) shared = createBackStack(browser)
  return shared(isOpen, close, root)
}
