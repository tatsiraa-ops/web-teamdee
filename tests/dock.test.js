/* แถบติดต่อมือถือ + ปุ่มลอยคอม โฉมใหม่ (4 พ.ย. อาร์ต "ทำมาใหม่ครับ เจนมาได้เต็มที่ เผื่อจะได้เอามาปรับใช้กัน desktop ได้ด้วย")
   มือถือ: แท่นลอยขาว ไอคอน 3D โทร/เสื้อ/เอกสาร (สไตล์ชุดไอคอนที่อาร์ตอนุมัติ) · ปุ่ม LINE เขียวทึบ 2 บรรทัด (สถานะเวลาทำการจริง)
   คอม: แท่นขาวเดียวกัน ไอคอนโทร 3D + ปุ่ม LINE เขียว · โครง/คลาสเดิมคง (เทสลำดับ ลิงก์ตามหน้า หน้าคำนวณ) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('ไอคอน 3D แท่นติดต่อมีครบ', () => {
  for (const n of ['phone', 'shirt', 'doc']) assert.ok(existsSync(new URL(`../public/img/icons/dock-${n}.webp`, import.meta.url)), n)
})

test('แถบมือถือใช้ไอคอน 3D · ช่อง data-bar-ico ยังอยู่ (หน้าคำนวณซ่อนได้)', () => {
  const ft = read('src/partials/footer.hbs')
  const bar = ft.slice(ft.indexOf('class="mobilebar'), ft.indexOf('</nav>', ft.indexOf('class="mobilebar')))
  assert.match(bar, /<img src="\/img\/icons\/dock-phone\.webp" alt=""/)
  assert.match(bar, /<img src="\/img\/icons\/dock-shirt\.webp" alt=""/)
  assert.match(bar, /data-bar-ico><img src="\/img\/icons\/dock-doc\.webp" alt=""/)
})

test('ปุ่มโทรคอมใช้ไอคอน 3D', () => {
  assert.match(read('src/partials/floats.hbs'), /fcta__orb fcta__orb--tel" aria-hidden="true"><img src="\/img\/icons\/dock-phone\.webp" alt=""/)
})

test('CSS แท่นชุดเดียว: ไม่มีชั้นแถบขาวติดขอบ/แท่นดำเดิมค้าง', () => {
  const css = read('src/styles/main.css')
  const b = css.slice(css.indexOf('/* ---------- แท่นติดต่อ (โฉมใหม่ 4 พ.ย.'))
  assert.ok(b.length > 100)
  assert.match(b, /\.mobilebar \{ position: fixed;[^}]*border-radius: 24px; background: #fff;/)
  assert.match(b, /\.mb__line \{[^}]*background: #06C755;/)
  assert.doesNotMatch(css, /html \.mobilebar \{ left: 0; right: 0; bottom: 0;/)
  assert.doesNotMatch(css, /background: #121212; box-shadow: inset 0 0 0 1px rgb\(255 255 255 \/ \.12\), 0 18px 40px -14px/)
  assert.doesNotMatch(read('src/styles/home.css'), /\.mobilebar \{ min-height:64px; padding-bottom:env\(safe-area-inset-bottom\); \}/)
})

test('คอม: ปุ่มลอยเป็นแท่นขาวแถวเดียว ไอคอนโทรซ้าย ปุ่ม LINE เขียว', () => {
  const css = read('src/styles/main.css')
  const b = css.slice(css.indexOf('/* คอม: ปุ่มลอยขวาล่างเป็นแท่นขาวชุดเดียวกับมือถือ'))
  assert.match(b, /\.fcta \{ flex-direction: row-reverse;[^}]*border-radius: 24px; background: #fff;/)
  assert.match(b, /\.fcta__btn--line \{[^}]*background: #06C755;/)
})

/* อาร์ต "ไปเจนไอคอนไลน์มาใหม่ … ออกนอกกรอบ" → "โหลมากกกก" → "ชอบก่อนที่คุณจะแก้ เอาแบบนั้นเลย แต่ … ไอคอนไลน์ไปเจนมาใหม่เอาสีขาว"
   → แท่นแบบก่อนล้นกรอบ · ไอคอน LINE 3D ขาว (dock-line.webp) อยู่ในปุ่ม ทั้งมือถือและคอม · ไม่มีไอคอนล้นกรอบค้าง */
/* 6 พ.ย. อาร์ต "อันไหน line ยังเป็น 3D ลบออก แล้วเอาแบบปกติใส่ไป" → โลโก้ LINE แบบเรียบ (icoLine: ฟองขาว ตัว LINE เขียว) แทน dock-line.webp ทุกที่ */
test('ไอคอน LINE ในปุ่มเป็นแบบเรียบ (icoLine) ไม่ใช่ 3D · ไม่ล้นกรอบ', () => {
  assert.match(read('src/partials/footer.hbs'), /<span class="mb__orb" aria-hidden="true">\{\{> icoLine\}\}<\/span>/)
  assert.match(read('src/partials/floats.hbs'), /<span class="fcta__orb" aria-hidden="true">\{\{> icoLine\}\}<\/span>/)
  for (const f of ['src/partials/footer.hbs', 'src/partials/floats.hbs', 'src/partials/lineCta.hbs']) assert.doesNotMatch(read(f), /dock-line\.webp/, `${f} ไม่ใช้ LINE 3D`)
  const css = read('src/styles/main.css')
  assert.match(css, /\/\* ไอคอน LINE ในปุ่ม 4 พ\.ย\./)
  assert.doesNotMatch(css, /\.mb__orb \{ position: absolute;/)
  assert.doesNotMatch(css, /\.fcta__btn--line \.fcta__orb \{ position: absolute;/)
  assert.doesNotMatch(css, /\.mb__line \{ justify-content: flex-start; padding-left: 70px;/)
})

/* อาร์ต 4 พ.ย. ภาพปุ่ม "ติดต่อทีมดี" หัวเว็บ + "แก้มา ตรงแถวบนสุด": เม็ดดำหนัก ไม่เข้ากับเว็บโทนสว่างและแท่นติดต่อขาว
   → เม็ดส้มแบรนด์ ตัวดำ (ตัวบนส้มต้องดำ) · ลูกศรในวงขาว · จุดสถานะขาว · ชี้แล้ววงขาวขยายเต็มปุ่ม ขอบส้มคงรูป */
test('ปุ่มติดต่อทีมดีหัวเว็บ: เม็ดส้ม ตัวดำ ลูกศรในวงขาว ไม่ใช่เม็ดดำ', () => {
  const css = readFileSync('src/styles/main.css', 'utf8')
  const block = css.slice(css.indexOf('/* ---------- ปุ่มติดต่อทีมดี หัวเว็บ โฉมส้ม'))
  assert.ok(block.length > 40, 'มีชุดกฎโฉมใหม่')
  assert.match(block, /\.hcta \{[^}]*background: var\(--color-orange\);[^}]*color: var\(--color-ink\)/)
  assert.match(block, /\.hcta__go \{[^}]*background: #fff/)
  assert.match(block, /\.hcta__go::before \{[^}]*background: #fff/)
  assert.match(block, /\.hcta__dot\.is-open \{[^}]*background: #fff/)
})
