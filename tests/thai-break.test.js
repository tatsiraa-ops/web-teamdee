import { test } from 'node:test'
import assert from 'node:assert/strict'
import { glue, thaiBreaks } from '../src/js/thai-break.js'

const strip = (s) => s.replace(/<\/?t-[a-z]+>/g, '')

test('คำที่ตัวตัดคำของเบราว์เซอร์หักผิด (ราย|ละเอียด · เจ|อร์|ซีย์ · สีห|รือ) ห่อห้ามตัด', () => {
  assert.equal(glue('จัดการรายละเอียด'), 'จัดการ<t-nw>รายละเอียด</t-nw>')
  assert.equal(glue('เสื้อเจอร์ซีย์ทรงใหญ่'), 'เสื้อ<t-nw>เจอร์ซีย์</t-nw>ทรงใหญ่')
  assert.equal(glue('เปลี่ยนสีหรือใส่ชื่อ'), 'เปลี่ยน<t-nw>สีหรือ</t-nw>ใส่ชื่อ')
  assert.equal(glue('ไม่มีคำพิเศษ'), 'ไม่มีคำพิเศษ')
  assert.equal(glue('เป็นของก๊วนคุณ'), 'เป็น<t-nw>ของก๊วน</t-nw>คุณ')
  assert.equal(glue('ลายต่าง ๆ ได้'), 'ลาย<t-nw>ต่าง ๆ</t-nw> ได้', '11 พ.ย.: ติดเฉพาะคำเต็มก่อน ๆ (เดิมนับ 8 ตัวอักษร ผ่ากลางคำ)')
  /* หัวข้อกลางบนมือถือ (30 ต.ค.): คำถามท้าย "ๆ แล้ว?" ไม่หลุดไปบรรทัดใหม่คำเดียว · "พิมพ์|ลาย" ไม่ถูกหัก */
  assert.equal(glue('มีโลโก้และ คร่าว ๆ แล้ว?'), 'มีโลโก้และ <t-nw>คร่าว ๆ แล้ว?</t-nw>')
  assert.equal(glue('เสื้อวอร์มพิมพ์ลายให้ทีม'), 'เสื้อวอร์ม<t-nw>พิมพ์ลาย</t-nw>ให้ทีม')
})

test('หัวข้อ: แต่ละวลีห่อ t-p (มือถือเป็น inline-block) · ตัวหนังสือที่อ่านได้ไม่เปลี่ยน', () => {
  const html = '<h2 class="t-display">เลือกแบบเสื้อ ที่เหมาะกับงานของคุณ</h2>'
  const out = thaiBreaks(html)
  assert.equal(out, '<h2 class="t-display"><t-g><t-p>เลือกแบบเสื้อ</t-p> <t-p>ที่เหมาะกับงาน<t-nw>ของคุณ</t-nw></t-p></t-g></h2>')
  assert.equal(strip(out), html)
})

test('คำถามที่ลงท้ายด้วยคำสั้น (ไหม? · ไหน?) ติดกับคำก่อนหน้า ไม่ตกบรรทัดเดียวโดดๆ', () => {
  const out = thaiBreaks('<summary><span class="fq-q__t">เปลี่ยนสีได้ไหม?</span><svg width="24" height="24"></svg></summary>')
  assert.match(out, /เปลี่ยนสี<t-nw>ได้ไหม\?<\/t-nw>/)
  assert.ok(out.includes('<svg width="24" height="24"></svg>'))
})

test('ลิงก์: วลีสั้นห้ามตัด (ภาพจาก|คลังเดิม)', () => {
  assert.equal(thaiBreaks('<li><a href="/x/">ภาพจากคลังเดิม</a></li>'), '<li><a href="/x/"><t-nw>ภาพจากคลังเดิม</t-nw></a></li>')
  /* หลายวลีห่อ t-g ทั้งก้อน (ลิงก์ inline-flex ไม่แตกเป็นคอลัมน์ · เคสแบด 424px) */
  assert.equal(thaiBreaks('<a class="pp-more">เสื้อแบด / เสื้อก๊วนแบด</a>'), '<a class="pp-more"><t-g><t-nw>เสื้อแบด /</t-nw> <t-nw>เสื้อก๊วนแบด</t-nw></t-g></a>')
})

test('ไม่แตะ script · style · title · option · svg · แอตทริบิวต์ · ย่อหน้ายาวแค่ห่อคำที่หักผิด', () => {
  const keep = [
    '<head><title>รายละเอียด เสื้อ</title></head>',
    '<script>const a = "รายละเอียด เสื้อ"</script>',
    '<select><option>รายละเอียด เสื้อ</option></select>',
    '<svg width="10" height="10"><text>รายละเอียด</text></svg>',
    '<h2 aria-label="รายละเอียด เสื้อ" class="sr-only">x</h2>',
  ]
  for (const h of keep) assert.equal(thaiBreaks(h), h)
  assert.equal(thaiBreaks('<p>อ่านรายละเอียด ก่อนสั่ง</p>'), '<p><t-g>อ่าน<t-nw>รายละเอียด</t-nw> <t-nw>ก่อนสั่ง</t-nw></t-g></p>')
})

test('ข้อความที่ห่อวลีไว้แล้ว (inline-block · whitespace-nowrap) ไม่ห่อวลีซ้ำ · ห่อแค่คำที่หักผิดและคำท้ายสั้น', () => {
  const h = '<h2><span class="inline-block">จากจุดเริ่มต้น</span> <span class="inline-block">สู่ทีมดี</span></h2>'
  assert.equal(thaiBreaks(h), h.replace('สู่ทีมดี', '<t-g>สู่<t-nw>ทีมดี</t-nw></t-g>').replace('จากจุดเริ่มต้น', '<t-g>จากจุด<t-nw>เริ่มต้น</t-nw></t-g>'))
  assert.equal(thaiBreaks('<h2><span class="inline-block">เหมาะกับงานของคุณ</span></h2>'), '<h2><span class="inline-block"><t-g>เหมาะกับงาน<t-nw>ของคุณ</t-nw></t-g></span></h2>')
})

test('ข้อความที่แทรกแท็กแล้วห่อ t-g ทั้งก้อน (กล่อง flex เห็นเป็นชิ้นเดียว) · entity แปลกๆ ไม่ถอด · ยังห่อคำที่หักผิดได้', () => {
  assert.equal(thaiBreaks('<h3>A&nbsp;B รายละเอียด</h3>'), '<h3><t-g>A&nbsp;B <t-nw>รายละเอียด</t-nw></t-g></h3>')
  assert.equal(strip(thaiBreaks('<h3>ผ้า &amp; สี ดีไหม?</h3>')), '<h3>ผ้า &amp; สี ดีไหม?</h3>')
})

test('ใน <script> ข้อความหน้าตาเหมือนแท็กปิด ("</div>") ไม่ทำให้โค้ดถูกห่อ t-nw (ตรวจ JS 30 ต.ค. · บั๊กแฝง)', () => {
  const html = '<div><script>var s = "</div>"; var t = "รายละเอียด"</script><p>รายละเอียด</p></div>'
  const out = thaiBreaks(html)
  assert.ok(out.includes('var t = "รายละเอียด"'), out)
  assert.ok(out.includes('<p><t-nw>รายละเอียด</t-nw></p>') || out.includes('<t-nw>รายละเอียด</t-nw>'), out)
})

/* 11 พ.ย. อาร์ต "มันตัดบรรทัดแปลกๆ แก้ อันนี้ในหลายๆที่ด้วย" (/corporate/ การ์ดชวนคุย)
   1) "จำนวนคร่าว ๆ" ตัวติด ๆ นับ 8 ตัวอักษร → "จำ<t-nw>นวนคร่าว ๆ" ผ่ากลางคำ จำ|นวน
   2) ย่อหน้า "…ยังไม่มีแบบก็ | เริ่มคุยได้" วลีสุดท้ายถูกผ่า → วลีหลังเว้นวรรคสุดท้าย (≤26 ตัว) ห้ามตัด ขึ้นบรรทัดใหม่ทั้งวลี
   3) หัวข้อไม่มีเว้นวรรค "ยังไม่แน่ใจว่าเสื้อ | แบบไหน" → แบ่งที่คำเชื่อมใกล้กลาง "ยังไม่แน่ใจว่า | เสื้อแบบไหน" */
test('ไม้ยมก: ติดเฉพาะคำเต็มคำสุดท้าย ไม่ผ่ากลางคำก่อนหน้า (จำ|นวน)', () => {
  const out = glue('และจำนวนคร่าว ๆ ยังไม่มีแบบ')
  assert.equal(out, 'และจำนวน<t-nw>คร่าว ๆ</t-nw> ยังไม่มีแบบ')
  assert.doesNotMatch(out, /จำ<t-nw>/)
})

test('ย่อหน้า: วลีสุดท้ายหลังเว้นวรรค (≤26 ตัว) ห้ามผ่า · ยาวกว่านั้นปล่อยตัดได้ · ตัวหนังสือไม่เปลี่ยน', () => {
  const html = '<p class="hm-talk__lead">บอกลักษณะงาน งบประมาณ และจำนวนคร่าว ๆ ยังไม่มีแบบก็เริ่มคุยได้</p>'
  const out = thaiBreaks(html)
  assert.match(out, /<t-nw>ยังไม่มีแบบก็เริ่มคุยได้<\/t-nw><\/t-g><\/p>$/)
  assert.equal(strip(out), html)
  const long = '<p>สั้น ๆ แล้วต่อด้วยวลีที่ยาวมากเกินยี่สิบหกตัวอักษรแน่นอนครับ</p>'
  assert.doesNotMatch(thaiBreaks(long), /<t-nw>แล้วต่อด้วยวลีที่ยาวมาก/)
  assert.equal(strip(thaiBreaks(long)), long)
})

test('หัวข้อไม่มีเว้นวรรค: แบ่งที่คำเชื่อมใกล้กลาง แต่ละครึ่งห้ามตัด · สั้นหรือไม่มีคำเชื่อม = เหมือนเดิม', () => {
  const h = '<h2 id="x"><span class="inline-block">ยังไม่แน่ใจว่าเสื้อแบบไหน</span></h2>'
  const out = thaiBreaks(h)
  assert.match(out, /<t-nw>ยังไม่แน่ใจว่า<\/t-nw><t-nw>เสื้อแบบไหน<\/t-nw>/)
  assert.equal(strip(out), h)
  assert.equal(thaiBreaks('<h3>ยังไม่แน่ใจว่าเสื้อแบบไหน</h3>').includes('<t-nw>ยังไม่แน่ใจว่า</t-nw><t-nw>เสื้อแบบไหน</t-nw>'), true, 'หัวข้อธรรมดา (ไม่ห่อ ph) ก็แบ่งเหมือนกัน')
  assert.equal(thaiBreaks('<h2><span class="inline-block">เหมาะกับงานของคุณ</span></h2>'), '<h2><span class="inline-block"><t-g>เหมาะกับงาน<t-nw>ของคุณ</t-nw></t-g></span></h2>', 'ไม่มีคำเชื่อมที่กำหนด = เหมือนเดิม')
})
