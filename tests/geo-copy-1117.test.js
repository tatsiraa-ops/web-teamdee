/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A12 (อาร์ต "a7-13 มาได้"): ข้อความข้อเท็จจริงที่ AI หยิบไปตอบได้ · ใช้เฉพาะข้อมูลที่มีใน repo
   ไม่มีราคาพิมพ์ลาย (อาร์ต 17 พ.ย.) · ไม่มีคำว่าโรงงาน · ข้อมูลมาจาก site.json / prices.json ไม่พิมพ์ตัวเลขซ้ำในเทมเพลต */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('ตารางราคาโปโล: caption บอกชื่อผ้า (เดิม 6 ตารางใช้ caption เดียวกันหมด)', () => {
  assert.match(read('src/partials/pp2PoloFabric.hbs'), /<caption>ราคาต่อตัว \{\{this\.name\}\} <span>บาท · รวม VAT<\/span><\/caption>/)
})
test('ท้ายเว็บทุกหน้า: ประโยค "TEAMDEE คือ…" จากข้อมูลจริง', () => {
  const f = read('src/partials/footer.hbs')
  assert.match(f, /<p class="ft__about">\{\{site\.brand\}\} \(ทีมดี\) รับออกแบบและผลิตเสื้อทีม[^<]*ตั้งแต่ปี \{\{site\.foundedYear\}\}[^<]*ขั้นต่ำ \{\{site\.moq\}\} ตัว/)
  assert.doesNotMatch(f, /โรงงาน/)
})
test('/about-us/ กล่องข้อมูลบริษัท: เริ่มดูแลงาน + ขั้นต่ำ', () => {
  const a = read('site/about-us/index.html')
  assert.match(a, /<div><dt>เริ่มดูแลงานเสื้อทีม<\/dt><dd>ปี \{\{site\.foundedYear\}\}<\/dd><\/div>/)
  assert.match(a, /<div><dt>สั่งขั้นต่ำ<\/dt><dd>\{\{site\.moq\}\} ตัว \(สกรีน DFT เริ่ม 1 ตัว\) · ราคารวม VAT<\/dd><\/div>/)
})
test('หน้าแกลเลอรีแบบเสื้อ: บรรทัดข้อเท็จจริงใต้คำนำ (ขั้นต่ำ · รวม VAT · ส่งฟรี · ดูแบบ 3D) ไม่มีราคา', () => {
  const g = read('src/partials/galleryPage.hbs')
  assert.match(g, /<p class="gallery-facts">สั่งทำขั้นต่ำ \{\{site\.moq\}\} ตัว · ราคารวม VAT · ส่งฟรี · ดูแบบ 3D ก่อนผลิต<\/p>/)
})
