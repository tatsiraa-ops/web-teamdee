/* ปุ่มย้อนกลับ (Android) ปิดหน้าต่างซ้อน แทนที่จะออกจากหน้า (ลองใช้จริง 30 ต.ค. รอบ 46 ข้อ 3)
   รอบ 47 (ตรวจละเอียด): หน้าต่างซ้อนกัน (ป๊อปอัปทับเมนู) ย้อนกลับต้องปิดทีละชั้น ไม่ค้างประวัติ */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBackStack } from '../src/js/back-close.js'

/* จำลอง history: entries = state ของแต่ละขั้น · back() ถอยแล้วยิง popstate */
const fakeHistory = () => {
  const entries = [null]
  let fire = null
  const log = []
  return {
    log,
    depth: () => entries.length,
    env: {
      push: (state) => { entries.push(state); log.push('push') },
      back: () => { entries.pop(); log.push('back'); fire?.() },
      listen: (fn) => { fire = fn },
      state: () => entries[entries.length - 1],
    },
    pressBack: () => { entries.pop(); fire?.() },
  }
}
const overlay = (stack, name, log) => {
  const o = { open: false }
  o.ctl = stack(() => o.open, () => { o.open = false; log.push(`close:${name}`); o.ctl.closed() })
  o.show = () => { o.open = true; o.ctl.opened() }
  return o
}

test('หน้าต่างเดียว: เปิด = เพิ่ม 1 ขั้น · ย้อนกลับ = ปิด · ไม่ถอยซ้ำ', () => {
  const h = fakeHistory(); const s = createBackStack(h.env)
  const a = overlay(s, 'a', h.log)
  a.show(); a.ctl.opened()
  assert.equal(h.depth(), 2)
  h.pressBack()
  assert.equal(a.open, false)
  assert.equal(h.depth(), 1)
  assert.deepEqual(h.log, ['push', 'close:a'])
})

test('ปิดด้วยปุ่มในหน้าต่าง = ถอยขั้นที่เพิ่มไว้ 1 ขั้น', () => {
  const h = fakeHistory(); const s = createBackStack(h.env)
  const a = overlay(s, 'a', h.log)
  a.show(); a.open = false; a.ctl.closed()
  assert.equal(h.depth(), 1)
  assert.deepEqual(h.log, ['push', 'back'])
})

test('ซ้อนกัน (ป๊อปอัปทับเมนู): ย้อนกลับปิดเฉพาะตัวบน · ย้อนอีกครั้งปิดตัวล่าง · ไม่เหลือประวัติค้าง', () => {
  const h = fakeHistory(); const s = createBackStack(h.env)
  const menu = overlay(s, 'menu', h.log); const promo = overlay(s, 'promo', h.log)
  menu.show(); promo.show()
  h.pressBack()
  assert.equal(promo.open, false); assert.equal(menu.open, true)
  h.pressBack()
  assert.equal(menu.open, false)
  assert.equal(h.depth(), 1)
})

test('ซ้อนกัน: ปิดตัวบนด้วยปุ่ม X ตัวล่างยังเปิดอยู่', () => {
  const h = fakeHistory(); const s = createBackStack(h.env)
  const menu = overlay(s, 'menu', h.log); const promo = overlay(s, 'promo', h.log)
  menu.show(); promo.show()
  promo.open = false; promo.ctl.closed()
  assert.equal(menu.open, true)
  assert.equal(h.depth(), 2)
})

test('forget: ออกจากหน้าผ่านลิงก์ในหน้าต่าง ไม่ถอยประวัติ', () => {
  const h = fakeHistory(); const s = createBackStack(h.env)
  const a = overlay(s, 'a', h.log)
  a.show(); a.ctl.forget(); a.open = false; a.ctl.closed()
  assert.deepEqual(h.log, ['push'])
})

test('ทุกหน้าต่างใช้ตัวช่วยเดียวกัน', async () => {
  const { readFileSync } = await import('node:fs')
  /* แผ่นตัวกรอง /designs/ (ตรวจมือถือ 30 ต.ค.: เดิมกดย้อนกลับแล้วออกจากหน้า) */
  for (const f of ['lightbox.js', 'review-dialog.js', 'nav.js', 'promo-popup.js', 'designs-page.js']) {
    assert.match(readFileSync(new URL(`../src/js/${f}`, import.meta.url), 'utf8'), /from '\.\/back-close\.js'/, f)
  }
})

/* reload ตอนหน้าต่างเปิดอยู่: ประวัติค้าง tdOverlay → กดย้อนกลับครั้งแรกไม่ทำอะไร (agent ตัวดูรูป 30 ต.ค.) → ล้างตอนเริ่ม */
test('เริ่มหน้าแล้วเจอ state ค้างจากหน้าต่างก่อน reload: ล้างทิ้ง (replace) แล้วถอยออก ไม่ push เพิ่ม', () => {
  const entries = [{ tdOverlay: 1 }]
  const log = []
  createBackStack({
    push: () => log.push('push'), back: () => log.push('back'), listen: () => {},
    state: () => entries[entries.length - 1],
    replace: (s) => { entries[entries.length - 1] = s; log.push('replace') },
  })
  assert.equal(entries[0], null)
  assert.deepEqual(log, ['replace', 'back'])
})
