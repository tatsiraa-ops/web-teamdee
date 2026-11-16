/* 13 พ.ย. 2026 อาร์ตส่ง Drive คลัง Packshot เสื้อจริง (FinixSports) "ใช้ได้ทั้งหมด แค่ลบหรือบังโลโก้หรืออะไรให้มันไม่มีก็จบ"
   แถว "เสื้อตัวจริงที่ทีมดีผลิต" ของหน้าหน่วยงาน โรงเรียน ร้านค้า เดิมเป็นเสื้อบนหุ่น 9 ตัวชุดเดียวกันทุกหน้า (ไม่ใช่ของกลุ่ม)
   → ขึ้นภาพถ่ายเสื้อจริงของลูกค้ากลุ่มนั้นก่อน (จาก Packshot) แล้วตามด้วยชุดเดิม · รูปที่เลือกไม่มีโลโก้ Finix (ซูมตรวจแล้ว · ป้ายคอเป็นป้ายไซส์) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const main = (f) => { const h = read(`dist-wp/${f}/index.html`); return h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<\/?t-[a-z]+>/g, '') }
const P = { gov: ['custom-organization-shirts', 6], edu: ['education', 2], shop: ['custom-staff-shirts', 4], faculty: ['custom-university-shirts', 4], class: ['custom-class-shirts', 4], sport: ['sport', 2], badminton: ['custom-badminton-shirts', 2], running: ['custom-running-shirts', 1], event: ['event', 1] }
const realRow = (f) => { const m = main(f); const at = m.indexOf('id="show-real"'); return m.slice(at, m.indexOf('<!-- /row -->', at)) }
const items = (row) => [...row.matchAll(/<figure class="hm-show__item"><img src="([^"]+)"[^>]*alt="([^"]*)"[^>]*><figcaption>([\s\S]*?)<\/figcaption>/g)].map((x) => ({ src: x[1], alt: x[2], cap: x[3].replace(/<[^>]+>/g, '').trim() }))

for (const [id, [f, n]] of Object.entries(P)) {
  test(`${f}: แถวเสื้อตัวจริงขึ้นภาพถ่ายเสื้อจริงของกลุ่มนี้ก่อน ${n} รูป แล้วตามด้วยชุดเดิม`, () => {
    const row = realRow(f), list = items(row)
    assert.match(row, /up2-show__kind--real">ภาพถ่ายจริง</)
    const own = list.slice(0, n)
    for (const it of own) {
      assert.match(it.src, new RegExp(`^/img/use-real/${id}-[a-z-]+\\.webp$`), it.src)
      assert.ok(pub(it.src), it.src); assert.ok(pub(it.src.replace('.webp', '-540.webp')), `${it.src} 540`)
      assert.match(it.alt, /^ภาพถ่ายเสื้อ/, it.alt); assert.ok(it.cap.length > 4, it.src)
      assert.doesNotMatch(it.src + it.alt + it.cap, /finix|ฟินิกซ์|ภาพจำลอง/i)
    }
    assert.equal(new Set(own.map((x) => x.src)).size, n)
    const rest = list.slice(n)
    assert.ok(rest.length >= 5, `ชุดเดิมยังอยู่ (${rest.length})`)
    for (const it of rest) assert.doesNotMatch(it.src, /use-real/)
  })
}

test('หน้าบริษัทไม่เปลี่ยน · หน้าร้านค้าไม่มีคำของกลุ่มบริษัทในคำบรรยายรูปใหม่', () => {
  assert.doesNotMatch(realRow('corporate'), /use-real/)
  for (const it of items(realRow('custom-staff-shirts')).slice(0, 4)) assert.doesNotMatch(it.cap + it.alt, /บริษัท|องค์กร/)
})
