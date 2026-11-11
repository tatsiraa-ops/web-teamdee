/* ตัวดูรูปแบบแอป (audit มือถือ 30 ต.ค. ข้อ 17) · ตรรกะท่าทางล้วนๆ ไม่แตะ DOM ทดสอบได้ใน node
   ลากซ้ายขวาตามนิ้ว 1:1 · ตัดสินเปลี่ยนรูปจากระยะ + ความเร็ว · ยางยืดที่รูปแรก/สุดท้าย · ล็อกแกน
   ปัดลงปิด ฉากหลังจางตามระยะ · บีบ/แตะสองครั้งซูม · ซูมอยู่ห้ามเปลี่ยนรูป */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SLOP, lockAxis, rubberband, project, dragOffset, decidePage, decideDismiss, dismissProgress,
  velocity, clampScale, zoomAbout, panLimit, clampPan, isDoubleTap, springStep, gestureMode,
} from '../src/js/swipe-pager.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('ล็อกแกน: ขยับไม่ถึง slop ยังไม่ตัดสิน · เกินแล้วเลือกแกนที่ขยับมากกว่า', () => {
  assert.equal(SLOP, 10)
  assert.equal(lockAxis(4, 3), null)
  assert.equal(lockAxis(-9, 9), null)
  assert.equal(lockAxis(14, 5), 'x')
  assert.equal(lockAxis(-30, 12), 'x')
  assert.equal(lockAxis(6, 18), 'y')
  assert.equal(lockAxis(3, -25), 'y')
  /* เท่ากันพอดี = แนวตั้ง (เลื่อน/ปิด ปลอดภัยกว่าเปลี่ยนรูปโดยไม่ตั้งใจ) */
  assert.equal(lockAxis(20, 20), 'y')
})

test('ยางยืด: ต้านมากขึ้นเรื่อยๆ ไม่หยุดแข็ง ไม่เกินขนาดจอ เครื่องหมายตามทิศ', () => {
  assert.equal(rubberband(0, 375), 0)
  const a = rubberband(50, 375); const b = rubberband(200, 375); const c = rubberband(2000, 375)
  assert.ok(a > 0 && a < 50, `50 → ${a}`)
  assert.ok(b > a && b < 200)
  assert.ok(c > b && c < 375, 'ลากไกลแค่ไหนก็ไม่เกินขนาดจอ')
  /* ส่วนเพิ่มลดลง = ต้านมากขึ้น */
  assert.ok(rubberband(100, 375) - rubberband(50, 375) < rubberband(50, 375))
  assert.equal(rubberband(-50, 375), -a)
})

test('project: ความเร็ว (px/s) → ระยะที่จะไหลต่อแบบ Apple · ทิศตามความเร็ว', () => {
  assert.equal(project(0), 0)
  assert.ok(project(1000) > 0)
  assert.ok(project(-1000) < 0)
  assert.ok(project(2000) > project(1000))
  assert.ok(Math.abs(project(1000, 0.995) - 199) < 1)
})

test('dragOffset: กลางชุดตามนิ้ว 1:1 · ไม่มีรูปถัดไป/ก่อนหน้า = ยางยืด', () => {
  const mid = { canPrev: true, canNext: true, width: 375 }
  assert.equal(dragOffset(-120, mid), -120)
  assert.equal(dragOffset(90, mid), 90)
  const first = { canPrev: false, canNext: true, width: 375 }
  assert.equal(dragOffset(-120, first), -120, 'รูปแรกลากไปรูปถัดไปได้ปกติ')
  assert.ok(dragOffset(120, first) > 0 && dragOffset(120, first) < 120, 'รูปแรกลากขวา = ยางยืด')
  const last = { canPrev: true, canNext: false, width: 375 }
  assert.ok(dragOffset(-120, last) < 0 && dragOffset(-120, last) > -120, 'รูปสุดท้ายลากซ้าย = ยางยืด')
  const solo = { canPrev: false, canNext: false, width: 375 }
  assert.equal(dragOffset(120, solo), rubberband(120, 375))
})

test('decidePage: ลากเกินครึ่งจอ หรือสะบัดเร็ว = เปลี่ยนรูป · ช้าและสั้น = เด้งกลับ', () => {
  const base = { width: 375, canPrev: true, canNext: true }
  assert.equal(decidePage({ ...base, dx: -200, vx: 0 }), 1, 'ลากซ้ายเกินครึ่ง = รูปถัดไป')
  assert.equal(decidePage({ ...base, dx: 200, vx: 0 }), -1, 'ลากขวาเกินครึ่ง = รูปก่อนหน้า')
  assert.equal(decidePage({ ...base, dx: -60, vx: 0 }), 0, 'ลากสั้นช้า = เด้งกลับ')
  assert.equal(decidePage({ ...base, dx: -40, vx: -1200 }), 1, 'สะบัดเร็วแม้ลากสั้น = ไป')
  assert.equal(decidePage({ ...base, dx: 40, vx: 1200 }), -1)
  assert.equal(decidePage({ ...base, dx: -250, vx: 2500 }), 0, 'ลากไปแล้วสะบัดกลับ = ยกเลิก ไม่กระโดดไปทางตรงข้าม')
  assert.equal(decidePage({ ...base, dx: 0, vx: 0 }), 0)
})

test('decidePage: ปลายชุดไม่มีรูปให้ไป = 0 (ไม่วนเมื่อปัด)', () => {
  assert.equal(decidePage({ width: 375, canPrev: false, canNext: true, dx: 300, vx: 1500 }), 0)
  assert.equal(decidePage({ width: 375, canPrev: true, canNext: false, dx: -300, vx: -1500 }), 0)
})

test('decideDismiss: ปัดลงไกลพอหรือเร็วพอ = ปิด · ปัดขึ้น/ดึงกลับ = ไม่ปิด', () => {
  const h = 812
  assert.equal(decideDismiss({ dy: 160, vy: 0, height: h }), true, 'ลากลงไกล')
  assert.equal(decideDismiss({ dy: 40, vy: 0, height: h }), false, 'ลากนิดเดียว')
  assert.equal(decideDismiss({ dy: 40, vy: 900, height: h }), true, 'สะบัดลงเร็ว')
  assert.equal(decideDismiss({ dy: 200, vy: -800, height: h }), false, 'ลากลงแล้วดึงกลับขึ้น = ไม่ปิด')
  assert.equal(decideDismiss({ dy: -200, vy: -900, height: h }), false, 'ปัดขึ้นไม่ปิด')
})

test('dismissProgress: 0 ตอนเริ่ม · โตตามระยะ · ไม่เกิน 1 · ลากขึ้นไม่นับ', () => {
  assert.equal(dismissProgress(0, 800), 0)
  assert.ok(dismissProgress(100, 800) > 0 && dismissProgress(100, 800) < dismissProgress(200, 800))
  assert.equal(dismissProgress(5000, 800), 1)
  assert.equal(dismissProgress(-100, 800), 0)
})

test('velocity: ใช้จุดช่วง ~100ms ล่าสุด เป็น px/s · จุดเดียว = 0', () => {
  assert.deepEqual(velocity([{ t: 0, x: 0, y: 0 }]), { vx: 0, vy: 0 })
  const s = [{ t: 0, x: 0, y: 0 }, { t: 500, x: 10, y: 0 }, { t: 520, x: 20, y: 4 }, { t: 540, x: 40, y: 8 }, { t: 560, x: 60, y: 12 }]
  const v = velocity(s)
  /* 100ms ล่าสุด (460–560) = จุด 500→560: 50px ใน 60ms ≈ 833 px/s · จุดเก่าที่ t=0 ไม่ถ่วง */
  assert.ok(Math.abs(v.vx - 833) < 5, `vx ${v.vx}`)
  assert.ok(Math.abs(v.vy - 200) < 5, `vy ${v.vy}`)
  /* นิ้วหยุดนิ่งก่อนยก: จุดสุดท้ายห่างจากก่อนหน้านาน = ความเร็ว 0 */
  assert.deepEqual(velocity([{ t: 0, x: 0, y: 0 }, { t: 400, x: 200, y: 0 }]), { vx: 0, vy: 0 })
})

test('ซูม: จำกัดช่วงสเกล · ซูมรอบจุดนิ้วให้จุดนั้นอยู่ที่เดิม', () => {
  assert.equal(clampScale(0.5), 1)
  assert.equal(clampScale(2.2), 2.2)
  assert.equal(clampScale(9), 4)
  assert.equal(clampScale(0.8, 0.75, 5), 0.8)
  /* จุด focal = 100 จากกลาง · สเกล 1 → 2 (เลื่อนเดิม 0): เนื้อภาพที่ 100 ต้องอยู่ที่ 100 → t = -100 */
  assert.equal(zoomAbout(1, 0, 2, 100), -100)
  /* ซูมที่กลางภาพ ไม่เลื่อน */
  assert.equal(zoomAbout(1, 0, 3, 0), 0)
  /* จุดใต้นิ้วคงที่: p = t + s*q */
  const s0 = 2, t0 = -40, s1 = 3, f = 60
  const q = (f - t0) / s0
  assert.ok(Math.abs(zoomAbout(s0, t0, s1, f) + s1 * q - f) < 1e-9)
})

test('panLimit/clampPan: ภาพเล็กกว่ากรอบ = อยู่กลาง · ใหญ่กว่า = เลื่อนได้แค่ถึงขอบภาพ', () => {
  assert.equal(panLimit(300, 1, 375), 0)
  assert.equal(panLimit(300, 2, 375), (600 - 375) / 2)
  assert.equal(clampPan(500, 300, 2, 375), 112.5)
  assert.equal(clampPan(-500, 300, 2, 375), -112.5)
  assert.equal(clampPan(50, 300, 2, 375), 50)
  assert.equal(clampPan(80, 300, 1, 375), 0)
})

test('isDoubleTap: สองครั้งติดกันเร็วและใกล้กัน', () => {
  assert.equal(isDoubleTap(null, { t: 100, x: 0, y: 0 }), false)
  assert.equal(isDoubleTap({ t: 0, x: 10, y: 10 }, { t: 200, x: 20, y: 18 }), true)
  assert.equal(isDoubleTap({ t: 0, x: 10, y: 10 }, { t: 450, x: 10, y: 10 }), false, 'ห่างเกิน 300ms')
  assert.equal(isDoubleTap({ t: 0, x: 10, y: 10 }, { t: 150, x: 90, y: 10 }), false, 'ไกลเกิน 30px')
})

test('springStep: critically damped เข้าเป้าไม่เด้งเกิน · รับความเร็วตั้งต้นได้', () => {
  let st = { x: 0, v: 0 }
  let max = 0
  for (let i = 0; i < 120; i++) { st = springStep(st, 100, 1 / 60); max = Math.max(max, st.x) }
  assert.ok(Math.abs(st.x - 100) < 0.5, `ถึงเป้า ${st.x}`)
  assert.ok(max <= 100.5, `ไม่ทะลุเป้า ${max}`)
  /* ความเร็วตั้งต้นจากนิ้ว: เฟรมแรกขยับไปทางนั้นทันที (ไม่มีรอยต่อระหว่างลากกับแอนิเมชัน) */
  const moved = springStep({ x: 0, v: 3000 }, 0, 1 / 60)
  assert.ok(moved.x > 0)
})

test('gestureMode: ซูมอยู่ = เลื่อนภาพ ไม่เปลี่ยนรูปไม่ปิด · สองนิ้ว = บีบ · แกนตั้งลง = ปิด', () => {
  assert.equal(gestureMode({ pointers: 2, scale: 1, axis: null, dy: 0, scrolled: false }), 'pinch')
  assert.equal(gestureMode({ pointers: 1, scale: 2, axis: 'x', dy: 0, scrolled: false }), 'pan')
  assert.equal(gestureMode({ pointers: 1, scale: 2, axis: 'y', dy: 40, scrolled: false }), 'pan')
  assert.equal(gestureMode({ pointers: 1, scale: 1, axis: null, dy: 0, scrolled: false }), null)
  assert.equal(gestureMode({ pointers: 1, scale: 1, axis: 'x', dy: 0, scrolled: false }), 'page')
  assert.equal(gestureMode({ pointers: 1, scale: 1, axis: 'y', dy: 30, scrolled: false }), 'dismiss')
  /* หน้าต่างเลื่อนลงไปแล้ว ลากลง = เลื่อนกลับขึ้น ไม่ใช่ปิด */
  assert.equal(gestureMode({ pointers: 1, scale: 1, axis: 'y', dy: 30, scrolled: true }), 'scroll')
  assert.equal(gestureMode({ pointers: 1, scale: 1, axis: 'y', dy: -30, scrolled: false }), 'scroll')
})

test('ตัวดูรูปทั้งสองใช้ swipe-pager ตัวเดียว + viewer.css · ยังใช้ back-close · รีวิวไม่ล็อก pan-y แล้ว', () => {
  for (const f of ['lightbox.js', 'review-dialog.js']) {
    const s = read(`src/js/${f}`)
    assert.match(s, /from '\.\/swipe-pager\.js'/, f)
    assert.match(s, /import '\.\.\/styles\/viewer\.css'/, f)
    assert.match(s, /from '\.\/back-close\.js'/, f)
  }
  /* เดิมปัด 40px ตัดสินตอนยกนิ้ว ไม่ตามนิ้ว */
  assert.doesNotMatch(read('src/js/review-dialog.js'), /Math\.abs\(dx\) > 40/)
  const main = read('src/styles/main.css').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.doesNotMatch(main, /\.rvd__img\s*\{[^}]*touch-action:\s*pan-y/, 'pan-y บล็อกการซูม (WCAG 1.4.4)')
  const css = read('src/styles/viewer.css')
  assert.match(css, /prefers-reduced-motion/)
  assert.match(css, /touch-action:\s*none/)
  /* ปุ่มปิดด้านล่างบนมือถือ ขนาดอย่างน้อย 44px */
  assert.match(css, /\.lb__close[^{]*\{[^}]*bottom:/)
  assert.match(css, /\.rvd__x[^{]*\{[^}]*bottom:/)
})

test('ลดการเคลื่อนไหว: swipe-pager อ่าน prefers-reduced-motion แล้วข้ามสปริง', () => {
  const s = read('src/js/swipe-pager.js')
  assert.match(s, /prefers-reduced-motion: reduce/)
  assert.match(s, /setPointerCapture/)
})
