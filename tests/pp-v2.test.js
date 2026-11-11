/* หน้าสินค้าโฉมใหม่ (อาร์ต 5 พ.ย. บอร์ด "หน้าบริการ : รับผลิตเสื้อพิมพ์ลาย" · src/data/pp-v2.json) · เริ่มที่ /sublimation/
   hero แบนเนอร์แบบหน้าแรก (ภาพ 2304×800 + มือถือ 3:4) · ส่วนจุดเด่นเสื้อพิมพ์ลาย + จุดขายทีมดี (ข้อเท็จจริงในเว็บเท่านั้น) · หน้าที่ไม่มีคีย์ได้ hero เดิม */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
const main = (f) => { const h = readFileSync(`dist-wp/${f}/index.html`, 'utf8'); return h.slice(h.indexOf('<main'), h.indexOf('</main>')) }
const sec = (html, cls) => { const at = html.indexOf(`<section class="${cls}`); assert.ok(at >= 0, cls); return html.slice(at, html.indexOf('</section>', at)) }
const pub = (s) => existsSync(new URL(`../public${s}`, import.meta.url))
const text = (h) => h.replace(/<\/?t-(?:g|nw)>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

test('/sublimation/ hero โฉมใหม่: ภาพ 2304×800 + มือถือ 3:4 · H1 เดิม · ปุ่ม LINE pp-hero · ไม่มี hero เดิม · ไม่มีแถบราคา/สารบัญ', () => {
  const m = main('sublimation')
  const h = sec(m, 'band-hero pp2-hero')
  assert.match(h, /width="2304" height="800"/)
  assert.match(h, /<source media="\(max-width: 767px\)" srcset="\/img\/pp-hero\/print-m-480\.webp 480w, \/img\/pp-hero\/print-m-768\.webp 768w"/)
  for (const s of h.match(/\/img\/pp-hero\/[a-z0-9-]+\.webp/g)) assert.ok(pub(s), s)
  assert.match(h, /fetchpriority="high"/)
  assert.match(text(h), /รับทำเสื้อพิมพ์ลาย/)
  assert.match(h, /<h1 /)
  assert.match(h, /data-track="line" data-where="pp-hero"/)
  assert.equal((m.match(/class="band-hero/g) || []).length, 1, 'hero เดียว')
  // อาร์ต 5 พ.ย. "ไม่เอา" (ภาพแถบราคา + สารบัญใต้ hero) → หน้านี้ไม่มีแถบสรุปและสารบัญ
  assert.doesNotMatch(m, /class="pp-strip|data-toc|ab-toc/)
})

test('/sublimation/ จุดเด่นเสื้อพิมพ์ลาย: ต่อจาก hero ทันทีตามบอร์ด · H2 · การ์ดไอคอน 3D 4 ใบ · ข้อเท็จจริงในเว็บ ไม่เคลมเกิน', () => {
  const m = main('sublimation')
  const s = sec(m, 'pp2-hl')
  assert.ok(m.indexOf('pp2-hero') < m.indexOf('pp2-hl') && m.indexOf('pp2-hl') < m.indexOf('id="options"'))
  assert.equal(m.slice(m.indexOf('</section>', m.indexOf('pp2-hero')), m.indexOf('<section class="pp2-hl')).match(/<section/g), null, 'ไม่มีส่วนคั่นระหว่าง hero กับจุดเด่น')
  assert.match(s, /<h2 /)
  const items = [...s.matchAll(/<li class="pp2-hl__item">([\s\S]*?)<\/li>/g)].map((x) => x[1])
  assert.equal(items.length, 4)
  for (const it of items) { const ico = it.match(/src="([^"]+)"/)[1]; assert.match(ico, /^\/img\/icons\//); assert.ok(pub(ico), ico); assert.match(it, /<h3 /) }
  assert.doesNotMatch(text(s), /อันดับ 1|ISO|โรงงาน|มาตรฐานระดับสากล/, 'ไม่ยกเคลมของ PMK')
  for (const f of ['ไม่ลอก', 'ไม่มีรอยต่อ', '3D ใน 24 ชม.', 'ส่งฟรีทั่วประเทศ']) assert.ok(text(s).includes(f), f)
})

test('หน้าสินค้าอื่นยังใช้ hero เดิม', () => {
  for (const r of ['embroidery', 'screen-printing']) { const m = main(r); assert.doesNotMatch(m, /pp2-hero|pp2-hl/, r); assert.match(m, /class="pp-strip/, `${r}: แถบสรุปยังอยู่`); assert.match(m, /data-toc/, `${r}: สารบัญยังอยู่`) }
})

/* อาร์ต 5 พ.ย. บอร์ด "แบบเสื้อ 3D พิมพ์ลาย" (การ์ดภาพแบบ ref: ภาพเต็ม + ชื่อ + ป้ายส้ม + ปุ่มลูกศร · แถวตามหมวด) · แบบจริงจากคลัง designs.json */
test('/sublimation/ แบบเสื้อ 3D พิมพ์ลาย: ต่อจากจุดเด่น · แถวตามทรงเสื้อ · การ์ดไม่โชว์รหัส รูปใหญ่ · กดดูใหญ่ (lightbox) · ไม่มีกริดแบบเดิมซ้ำ', () => {
  const m = main('sublimation')
  const s = sec(m, 'pp2-dz')
  assert.ok(m.indexOf('pp2-hl') < m.indexOf('pp2-dz') && m.indexOf('pp2-dz') < m.indexOf('id="options"'))
  assert.match(s, /<h2 /)
  assert.match(s, /id="pp2Designs"/)
  const rows = [...s.matchAll(/<div class="pp2-dz__row">([\s\S]*?)<!-- \/row -->/g)].map((x) => x[1])
  assert.ok(rows.length >= 3, 'อย่างน้อย 3 แถว')
  const codes = []
  for (const r of rows) {
    assert.match(r, /<h3 class="pp2-dz__rh">/)
    // 5 พ.ย. อาร์ต "ให้ดูทั้งหมดอีกทีนึง": ลิงก์ดูทั้งหมดพาไปหน้าแบบเสื้อที่กรองทรงของแถวนั้น + บอกจำนวนแบบ
    const all = r.replace(/<\/?t-(?:g|nw)>/g, '').match(/<a class="pp2-dz__all" href="([^"]+)"[^>]*>ดูทั้งหมด (\d+) แบบ/)
    assert.ok(all, 'ลิงก์ดูทั้งหมด + จำนวน')
    assert.match(all[1], /^\/designs\/\?product=print(&amp;|&)garment=[a-z]+$|^\/designs\/\?product=print$/)
    const g = all[1].match(/garment=([a-z]+)/)[1]
    const lib = JSON.parse(readFileSync('src/data/designs.json', 'utf8')).filter((d) => d.product.includes('print') && d.garment === g).length
    assert.equal(+all[2], lib, `${g}: จำนวนตรงกับคลังแบบ (หน้า /designs/)`)
    const cards = [...r.matchAll(/<figure class="pp2-dz__card" data-code="(TD-\d{4})"([^>]*)>([\s\S]*?)<\/figure>/g)].map(([, code, attrs, c]) => [, code, `<i ${attrs}>${c}`])
    assert.ok(cards.length >= 3 && cards.length <= 8, `แถวละ 3–8 ใบ (${cards.length})`)
    for (const [, code, c] of cards) {
      codes.push(code)
      const src = c.match(/<img src="([^"]+)"/)[1]; assert.ok(pub(src), src)
      /* 6 พ.ย. "เอาแค่ด้านหน้าเสื้อ ไม่เอาคำ": ภาพคู่ (หน้า+หลัง) ใช้ไฟล์ตัดตัวหน้า /img/design-front/ · การ์ดไม่มีคำ · lightbox ยังเห็นภาพเต็มหน้า+หลังจาก data-full */
      const full = c.match(/data-full="([^"]+)"/); assert.ok(full && pub(full[1]), 'data-full = ภาพเต็มให้ lightbox')
      if (!/\/loose-/.test(full[1])) assert.match(src, /^\/img\/design-front\/[\w-]+-720\.webp$/, `การ์ดโชว์เฉพาะตัวหน้า (${code})`)
      assert.doesNotMatch(c, /pp2-dz__name|<figcaption/, 'การ์ดไม่มีคำ'); assert.equal(text(c.replace(/alt="[^"]*"/g, '')).trim(), '', 'ไม่มีข้อความบนการ์ด')
      assert.doesNotMatch(text(c.replace(/alt="[^"]*"/g, '')), /TD-\d/, 'การ์ดไม่โชว์รหัส (อาร์ต 6 พ.ย. "ไม่เอารหัส") · รหัสยังอยู่ที่ data-code ให้ lightbox ส่งทาง LINE')
    }
  }
  assert.equal(new Set(codes).size, codes.length, 'ไม่มีแบบซ้ำ')
  assert.ok(!codes.includes('TD-0499'), 'อาร์ต 6 พ.ย. "ลบภาพนี้": ภาพซูมหลังเสื้อ TD-0499 ไม่อยู่ในราง')
  assert.doesNotMatch(m, /id="prodGrid"/, 'กริดแบบเดิมในส่วนตัวเลือกไม่ซ้ำ')
  assert.match(readFileSync('src/js/product-page.js', 'utf8'), /initLightbox\('#pp2Designs', 'figure'/)
})

/* อาร์ต 5 พ.ย. บอร์ด "โชว์ความน่าเชื่อถือการผลิต" → เลือกทาง ก: ของจริงที่มีเท่านั้น · คลิปหลังบ้านทีมดี (FB จริง) + ขั้นตอน 6 ขั้นไอคอน 3D + คลิปเบื้องหลังงานลูกค้า 4 คลิป
   ไม่มีคำว่าโรงงาน · ไม่มีภาพเครื่องจักร/ภาพเจนพื้นที่ผลิต · ข้อความขั้นตอนจากข้อเท็จจริงในเว็บ */
test('/sublimation/ ทำไมต้องสั่งกับทีมดี: แบนเนอร์ใหญ่คำบนภาพ · การ์ดภาพ 6 ขั้นแถบส้มคำบนภาพ · คลิปจริง 4 · บอกว่าเป็นภาพประกอบ · ไม่มีโรงงาน', () => {
  /* อาร์ต 5 พ.ย. "เอาแบบไปเจนรูปจริงมา" → "รูปยังไม่โดน … ใส่คำไปในรูปเลยก็ได้": ภาพสมจริง (Magnific) + คำตัวใหญ่ซ้อนบนภาพ (HTML ไม่ใช่ตัวหนังสือในภาพ) แบบการ์ด PMK */
  const m = main('sublimation')
  const s = sec(m, 'pp2-pf')
  assert.ok(m.indexOf('pp2-dz') < m.indexOf('pp2-pf') && m.indexOf('pp2-pf') < m.indexOf('id="options"'))
  assert.match(text(s).replace(/\s+/g, ''), /ทำไมต้องสั่งทำเสื้อพิมพ์ลายกับทีมดี/)
  const ban = s.match(/<figure class="pp2-pf__ban">([\s\S]*?)<\/figure>/)
  assert.ok(ban, 'แบนเนอร์ใหญ่')
  assert.match(ban[1], /<img [^>]*src="\/img\/pp-proof\/[a-z0-9-]+\.webp"/)
  assert.match(ban[1], /<figcaption class="pp2-pf__bt">/)
  const steps = [...s.matchAll(/<li class="pp2-pf__step">([\s\S]*?)<\/li>/g)].map((x) => x[1])
  assert.equal(steps.length, 6)
  for (const st of steps) {
    const src = st.match(/<img [^>]*src="([^"]+)"/)[1]; assert.match(src, /^\/img\/pp-proof\//); assert.ok(pub(src), src)
    assert.match(st, /<h4 class="pp2-pf__t">/); assert.match(st, /class="pp2-pf__band"/)
  }
  assert.equal((s.match(/class="vslot vslot--fb"/g) || []).length, 6, 'คลิปจริง 6 (หลังบ้าน + แบรนด์ + งานลูกค้า)')
  assert.match(s, /facebook\.com%2Fteamdee%2Fvideos%2F1397876905844445/, 'คลิป Junbi (งานพิมพ์ลาย)')
  /* อาร์ต 5 พ.ย. "แสดงมาเลย": ตัวเล่นขึ้นเองแบบหน้าแรก (video-slot.js autoStart) ไม่ใช่กล่องดำให้กดเล่น */
  assert.match(s, /<div class="pp2-pf__clips" data-embed-auto>/)
  assert.match(s, /facebook\.com%2Fteamdee%2Fvideos%2F1071563669119050/, 'คลิปหลังบ้านทีมดี')
  assert.match(text(s), /ภาพขั้น 01 และ 06 เป็นภาพประกอบ/)
  assert.doesNotMatch(text(s), /โรงงาน|อันดับ 1|ISO/)
  for (const f of ['3D ใน 24 ชม.', '15–20 วัน', '7 วัน']) assert.ok(text(s).includes(f), f)
  assert.match(readFileSync('src/styles/product-page.css', 'utf8'), /\.pp2-pf__vgrid \{ position: relative;[^}]*overflow-x: auto/)
})

test('/sublimation/ ทำไมต้องสั่งกับทีมดี (รอบ "เยอะๆ ดีกว่านี้"): แบนเนอร์โปสเตอร์ภาพเครื่อง · เบื้องหลังงานพิมพ์ลาย 10 การ์ดภาพจริงแถบไล่สี', () => {
  /* อาร์ต 5 พ.ย. "สวยดีอะ ทำให้มันดีกว่านี้หน่อย ทำมาแบบเยอะๆ" + "พวกไล่สี … ความคิดดีนะจำไว้เลย" */
  const s = sec(main('sublimation'), 'pp2-pf')
  /* อาร์ต 5 พ.ย. เลือกแนว B โปสเตอร์ "เอาตัวหนังสือแถวเดียวพอเพราะเราจะให้เครื่องเราเด่นๆ":
     ภาพเครื่องเต็มแบนเนอร์ · หัวข้อบรรทัดเดียว · ข้อเท็จจริง 5 ข้อเป็นบรรทัดเดียว (ไม่ใช่แถบตัวเลข/กล่อง) · ปุ่ม LINE · ไม่มีป้ายเหนือหัวข้อ */
  const ban = s.match(/<figure class="pp2-pf__ban">([\s\S]*?)<\/figure>/)[1]
  assert.match(ban, /<img [^>]*src="\/img\/pp-proof\/print-wide-[0-9]+\.webp"/)
  const bh = ban.match(/<p class="pp2-pf__bh">([\s\S]*?)<\/p>/)
  assert.ok(bh, 'หัวข้อในแบนเนอร์'); assert.doesNotMatch(bh[1], /<br/, 'หัวข้อแถวเดียว')
  assert.equal(text(bh[1]).replace(/\s+/g, ''), 'ตั้งแต่แบบจนเสื้อถึงมือ')
  assert.doesNotMatch(ban, /pp2-pf__stats|pp2-pf__bk/, 'ไม่มีแถบตัวเลข ไม่มีป้ายเหนือหัวข้อ')
  const bs = text(ban.match(/<p class="pp2-pf__bs">([\s\S]*?)<\/p>/)[1])
  for (const f of ['5 นาที', '24 ชม.', '15–20 วัน', 'ส่งฟรี', '7 วัน']) assert.ok(bs.includes(f), f)
  assert.match(ban, /<a class="cb cb--p cb--2l pp2-pf__cta" href="[^"]+" data-track="line" data-where="pp-proof">/)
  assert.doesNotMatch(s, /pp2-vx|class="va"|class="vb"|class="vc"/, 'ลบตัวเลือกชั่วคราวแล้ว')
  const bts = s.match(/<div class="pp2-pf__bts">([\s\S]*?)<!-- \/bts -->/)
  assert.ok(bts, 'เบื้องหลังงานพิมพ์ลาย')
  assert.match(text(bts[1]), /เบื้องหลังงานพิมพ์ลาย/)
  const cards = [...bts[1].matchAll(/<li class="pp2-pf__bc( pp2-pf__bc--[a-z]+)?">([\s\S]*?)<\/li>/g)]
  assert.equal(cards.length, 10)
  for (const [, , c] of cards) {
    const src = c.match(/<img [^>]*src="([^"]+)"/)[1]; assert.match(src, /^\/img\/pp-proof\/bts-/); assert.ok(pub(src), src)
    assert.match(c, /class="pp2-pf__band"/); assert.match(c, /<h4 class="pp2-pf__t">/)
  }
  assert.ok(cards.some((c) => c[1] === ' pp2-pf__bc--big') && cards.some((c) => c[1] === ' pp2-pf__bc--wide'), 'การ์ดใหญ่ + การ์ดกว้าง')
  for (const f of ['พิมพ์ลายตามไฟล์ที่อนุมัติ', 'สีซึมเข้าเส้นใย', 'เทียบลายกับแบบที่อนุมัติ', 'ถ่ายรูปงานจริงส่งให้ดูก่อน', 'ตรวจจำนวนแยกไซซ์']) assert.ok(text(bts[1]).replace(/\s+/g, '').includes(f.replace(/\s+/g, '')), f)
  assert.ok(s.indexOf('pp2-pf__steps') < s.indexOf('pp2-pf__bts') && s.indexOf('pp2-pf__bts') < s.indexOf('pp2-pf__note'))
})

test('/sublimation/ รีวิวลูกค้า (บอร์ด "รีวิวลูกค้า"): ใช้รีวิวโฉมใหม่ของ /corporate/ · เฉพาะรายที่เห็นเสื้อพิมพ์ลายในรูป · ไม่มีช่องรอข้อมูล', () => {
  const m = main('sublimation')
  const s = sec(m, 'hm-customer-proof up2-rv')
  assert.ok(m.indexOf('pp2-pf') < m.indexOf('up2-rv'), 'ต่อจากส่วนทำไมต้องสั่งกับทีมดี')
  assert.equal((m.match(/id="reviews"/g) || []).length, 1, 'ส่วนรีวิวเดียว (ไม่ซ้ำ ppReviews เดิม)')
  assert.match(text(s).replace(/\s+/g, ''), /รีวิวจากลูกค้าเสื้อพิมพ์ลาย/)
  const PRINT = ['print-fabric', 'np-connect', 'krungthai-badminton', 'runners', 'school-sportsday', 'swim-kids', 'outing-fabric', 'hr-outing', 'school-crossword']
  const wall = [...s.matchAll(/data-rv-open="([a-z-]+)"/g)].map((x) => x[1])
  assert.ok(wall.length >= 8, 'กำแพงรูปลูกค้าจริง')
  assert.equal(new Set(wall).size, wall.length, 'รายละรูป ไม่ซ้ำ')
  for (const id of wall) assert.ok(PRINT.includes(id), id)
  const cards = [...s.matchAll(/<article class="hm-rvb__item[^"]*" data-rvb-item/g)]
  assert.equal(cards.length, PRINT.length)
  assert.match(s, /สีที่พิมพ์ลายก็ตรงกับแบบ/, 'รีวิวที่พูดถึงงานพิมพ์ลายโดยตรงอยู่ในชุด')
  assert.doesNotMatch(text(s.replace(/<script[\s\S]*?<\/script>/g, '')), /\[|รอข้อมูล|รีสอร์ท|ศาลเจ้า/)
  assert.match(s, /data-rv-json/)
})

/* 10 พ.ย. 2026 อาร์ต "ไม่ดีเลย เอาแบบง่ายๆ ว่าเสื้อตัวนึงสามารถปรับอะไรได้ · ไม่ต้องดึงข้อมูลเยอะ" → เสนอไอเดีย → "เสื้อวางไว้เฉยๆพอ แยกหรือชี้ก็ได้ว่าปรับอะไรได้"
   → "เอาเสื้อแบบปกติ ไม่ต้องแยก": ภาพเดียว เสื้อทีมดีเย็บเสร็จวางราบหน้า+หลัง + ผ้าตัวอย่าง (Nano Banana 2.1 · ตัวหนังสือตรวจแล้ว)
   ป้ายชี้ 6 จุดเป็น HTML คำเดียว + บรรทัดรองสั้น เส้นส้มบาง · ไม่มีตาราง ไม่มีราคา ไม่มีกล่องอธิบาย · มือถือ เลขบนภาพ + รายการใต้ภาพ */
/* รอบ 177 (10 พ.ย. 2026 อาร์ต "เอาไปรวมกับอันบน และทำทั้งหมดมาดีๆ · เสื้อ teamdee เอาไปถ่ายในสตูดิโอดีๆ สมจริงๆ")
   → การ์ดเดียว: ภาพสตูดิโอคนใส่เสื้อทีมดี หน้า+หลัง (ครอปใต้คาง) + ป้ายชี้ 6 จุด · ใต้ภาพในการ์ดเดียวกัน 3 ทางเริ่มออกแบบ + ขั้นตอนสั้น + ปุ่ม LINE ปุ่มเดียว */
test('/sublimation/ ออกแบบให้เป็นทีมคุณ: การ์ดเดียว ภาพเสื้อทีมดีลอยในสตูดิโอ (ไม่มีคน) + ป้ายชี้ 6 จุด + 3 ทาง + ปุ่ม LINE เดียว · ไม่มีตาราง/ราคา', () => {
  const m = main('sublimation')
  const s = sec(m, 'pp2-cz')
  const t = (h) => text(h.replace(/<\/?t-[a-z]+>/g, ''))
  assert.ok(m.indexOf('up2-rv') < m.indexOf('pp2-cz'), 'ต่อจากรีวิว')
  assert.match(t(s).replace(/\s+/g, ''), /ออกแบบให้เป็นทีมคุณ/)
  assert.doesNotMatch(s, /<table|data-dz|class="bld|class="ba"|<details|<button|role="tab"/, 'ไม่มีตาราง/แผนผังเดิม/ปุ่มสลับ')
  assert.doesNotMatch(t(s), /\d+ บาท/, 'ไม่ใส่ราคา')
  assert.doesNotMatch(s, /class="cz-flow|class="dz__ways|class="fl__cta/, 'ไม่มีแถบส้ม/กล่อง 3 ทางแยก/ปุ่มแยก')
  const card = s.slice(s.indexOf('<div class="czp">'), s.indexOf('<!-- /czp -->'))
  assert.ok(card.length > 500, 'การ์ดเดียวห่อทั้งหมด')
  const fig = card.slice(card.indexOf('<figure class="fl"'), card.indexOf('</figure>'))
  assert.match(fig, /<img src="\/img\/pp-cz\/td-float-1600\.webp" srcset="[^"]*td-float-640\.webp 640w[^"]*td-float-960\.webp 960w[^"]*td-float-1600\.webp 1600w"/)
  for (const w of [640, 960, 1600]) assert.ok(pub(`/img/pp-cz/td-float-${w}.webp`), w)
  assert.match(fig, /alt="[^"]{20,}"/)
  const pins = [...fig.replace(/<\/?t-[a-z]+>/g, '').matchAll(/<li class="fl__p" style="--x:[\d.]+%;--y:[\d.]+%;--lx:[\d.]+%;--ly:[\d.]+%"><span class="fl__n"[^>]*>(\d)<\/span><b>([^<]+)<\/b><span>([^<]+)<\/span><\/li>/g)]
  assert.deepEqual(pins.map((p) => p[1]), ['1', '2', '3', '4', '5', '6'])
  assert.deepEqual(pins.map((p) => p[2].trim()), ['คอ', 'โลโก้', 'แขน', 'สี + ลาย', 'ชื่อ + เบอร์', 'ผ้า'])
  for (const p of pins) assert.ok(p[3].trim().length <= 16, `บรรทัดรองสั้น: ${p[3]}`)
  assert.equal((fig.match(/<line /g) || []).length, 6, 'เส้นชี้ 6 เส้น')
  assert.match(fig, /<svg class="fl__lines"[^>]*aria-hidden="true"/)
  const foot = card.slice(card.indexOf('</figure>'))
  assert.match(t(foot), /เริ่มออกแบบได้ 3 ทาง/)
  assert.equal([...foot.matchAll(/<li class="czp__w">/g)].length, 3, '3 ทางอยู่ในการ์ดเดียวกับภาพ')
  assert.deepEqual([...foot.matchAll(/<li class="czp__s">([\s\S]*?)<\/li>/g)].map((x) => t(x[1]).trim()), ['ดูแบบ', 'บอกจุดที่อยากปรับ', 'ยืนยันลาย'])
  assert.equal((s.match(/data-track="line"/g) || []).length, 1, 'ปุ่ม LINE ปุ่มเดียว')
  assert.match(foot, /data-where="pp-custom"/)
  assert.ok(t(s.slice(0, s.indexOf('<div class="czp">'))).length < 200, 'คำนำสั้น')
  assert.doesNotMatch(t(s), /\[|โรงงาน/)
})

test('/sublimation/ เนื้อผ้า (รอบ 189): 2 แถว ผ้ามาตรฐาน 8 + ผ้าใหม่ 6 · รางเลื่อน ใบกลางขยาย · ใบสเปกทางการ (รูป · ชื่อ · แกรม · เสื้อจริง · ตารางสเปกเหมาะกับ/จุดเด่น ไอคอนเส้น · ปุ่มขอตัวอย่าง)', () => {
  const m = main('sublimation')
  const s = sec(m, 'pp2-fab')
  const P = JSON.parse(readFileSync(new URL('../src/data/prices.json', import.meta.url), 'utf8'))
  assert.deepEqual(P.products.print.fabrics.map((f) => [f.id, f.gsm]), [['micro', 145], ['drytech', 145], ['corn', 145], ['star', 145], ['rain', 145], ['honeycomb', 145], ['square', 145], ['rice', 145], ['stripe', 150], ['golf', 150], ['checker', 150], ['thick', 160], ['tricot', 160], ['endurance', 210]], 'ตรงตารางทางการ "รวมเนื้อผ้าทั้งหมด"')
  assert.ok(m.indexOf('pp2-cz') < m.indexOf('class="pp2-fab'), 'ต่อจากออกแบบให้เป็นทีมคุณ')
  assert.match(text(s.slice(0, s.indexOf('class="fx"'))), /14 ชนิด/)
  assert.doesNotMatch(text(s), /บาท\/ตัว|ไม่บวกเพิ่ม|\+\d+ บาท/, 'ไม่แสดงราคาบวกเพิ่ม (อาร์ต "ไม่ต้องแสดง +ตัง")')
  assert.doesNotMatch(s, /fc__flip|fc__face|fc__hole|fc-ring|data-ring|พลิก/, 'ไม่มีพลิก/ห่วง/วงแหวนเดิม')
  assert.match(s, /<svg[^>]*class="fc-sprite"[^>]*aria-hidden="true"[\s\S]*?<symbol id="fi-air"/)
  /* 2 แถว แยกเก่า/ใหม่ */
  const rows = [...s.matchAll(/<div class="fx" data-fx>([\s\S]*?)<\/div><!-- \/fx -->/g)].map((r) => r[1])
  assert.equal(rows.length, 2, 'แยกเป็น 2 แถว')
  assert.match(text(rows[0].slice(0, rows[0].indexOf('fx__track'))), /ผ้ามาตรฐาน 8 ชนิด[^]*145 แกรม/)
  assert.match(text(rows[1].slice(0, rows[1].indexOf('fx__track'))), /ผ้าใหม่ 6 ชนิด[^]*150–210 แกรม/)
  /* รอบ 191: บอกตำแหน่ง · จุดต่อแถวละ 1 จุดต่อผ้า (กดไปผ้านั้น) + ตัวนับอ่านออกเสียง · สำเนาวนไม่อยู่ใน HTML (JS สร้าง) */
  rows.forEach((r, ri) => {
    const dots = [...r.matchAll(/<button type="button" class="fx__dot" aria-label="ไปที่([^"]+)"/g)].map((d) => d[1])
    assert.equal(dots.length, ri === 0 ? 8 : 6, 'จุดบอกตำแหน่งครบทุกผ้า')
    assert.match(r, /<p class="fx__count" aria-live="polite"><\/p>/)
    assert.doesNotMatch(r, /is-clone|fx__sep/, 'สำเนา/แผ่นคั่น JS สร้าง ไม่อยู่ใน HTML')
  })
  for (const r of rows) {
    assert.match(r, /<button type="button" class="fx__btn fx__btn--prev" aria-label="ผ้าก่อนหน้า"/)
    assert.match(r, /<button type="button" class="fx__btn fx__btn--next" aria-label="ผ้าถัดไป"/)
    assert.match(r, /<ul class="fx__track"/)
  }
  const cardsOf = (r) => [...r.matchAll(/<li class="fx__c"[^>]*>([\s\S]*?)<\/li><!-- \/c -->/g)].map((c) => c[1])
  const oldC = cardsOf(rows[0]); const newC = cardsOf(rows[1])
  assert.equal(oldC.length, 8); assert.equal(newC.length, 6)
  const nm = (c) => text(c.match(/<h4 class="fx__name"[^>]*>([\s\S]*?)<\/h4>/)[1]).trim()
  assert.deepEqual(oldC.map(nm), ['ผ้าเรียบไมโคร', 'ผ้าเม็ดข้าวสาร', 'ผ้าเม็ดข้าวโพด', 'ผ้าดรายเทค', 'ผ้าสายฝน', 'ผ้ารังผึ้ง', 'ผ้าสี่เหลี่ยม', 'ผ้าดาวกระจาย'])
  assert.deepEqual(newC.map(nm), ['ผ้าลายริ้ว', 'ผ้าลายลูกกอล์ฟ', 'ผ้าหมากฮอส', 'ผ้าเรียบหนา', 'ผ้าทรีคอต', 'ผ้า Endurance'])
  const useOf = { 'ผ้ารังผึ้ง': ['วิ่ง', 'แบดมินตัน', 'กีฬา'], 'ผ้าดรายเทค': ['ยูนิฟอร์ม', 'ทำงาน', 'องค์กร'], 'ผ้าเรียบไมโคร': ['แฟชั่น', 'กิจกรรม', 'ช่าง'], 'ผ้าลายริ้ว': ['กีฬา', 'แฟชั่น'], 'ผ้าเรียบหนา': ['ยูนิฟอร์ม', 'หน่วยงาน', 'ทีม'], 'ผ้า Endurance': ['ออกกำลังกาย'] }
  ;[...oldC.map((c) => [c, false]), ...newC.map((c) => [c, true])].forEach(([c, isNew]) => {
    const name = nm(c)
    const art = c.match(/<img class="fx__art" src="([^"]+)"[^>]*alt="([^"]+)"/)
    assert.ok(art, `${name} ภาพผ้า`); assert.ok(pub(art[1]), art[1])
    assert.match(art[1], isNew ? /\/img\/pp-cz\/fabn-[a-z]+-600\.webp$/ : /\/img\/pp-cz\/fabr-[a-z]+-600\.webp$/)
    const k = art[1].match(/fab[rn]-([a-z]+)-600/)[1]
    const pf = P.products.print.fabrics.find((x) => x.id === k)
    assert.ok(pf, `${k} ใน prices.json`); assert.equal(pf.name, name)
    const g = c.match(/<span class="fx__gsm"><b>(\d+)<\/b> แกรม<\/span>/)
    assert.ok(g, `${name} แกรม`); assert.equal(Number(g[1]), pf.gsm)
    if (!isNew) {
      const sh = c.match(/<img class="fx__shirt" src="([^"]+)"[^>]*alt="([^"]+)"/)
      assert.ok(sh, `${name} เสื้อจริง`); assert.equal(sh[1], `/img/pp-cz/fabr-front-${k}-200.webp`); assert.ok(pub(sh[1]) && pub(`/img/pp-cz/fabr-front-${k}-400.webp`)); assert.match(sh[2], /ด้านหน้า/)
    } else {
      assert.match(c, /<span class="fx__new">ใหม่<\/span>/, `${name} ป้ายใหม่`)
      assert.doesNotMatch(c, /fx__shirt/, 'ยังไม่มีเสื้อจริง ไม่ใส่')
    }
    /* ตารางสเปก: dl เหมาะกับ / จุดเด่น · ไอคอนเส้นเล็กทุกคำ */
    assert.match(c, /<dl class="fx__spec">[\s\S]*<dt>เหมาะกับ<\/dt>[\s\S]*<dt>จุดเด่น<\/dt>[\s\S]*<\/dl>/)
    const uses = [...c.matchAll(/<li class="fx__use"><svg class="fx__ti"[^>]*><use href="#fi-(u-[a-z]+)"\/><\/svg>([\s\S]*?)<\/li>/g)].map((u) => ({ icon: u[1], t: text(u[2]).trim() })) /* ข้อความอาจมีแท็กตัดบรรทัดไทย (t-*) */
    assert.ok(uses.length >= (isNew ? 1 : 2) && uses.length <= 3, `${name} เหมาะกับ 1–3`)
    for (const u of uses) assert.match(s, new RegExp(`<symbol id="fi-${u.icon}"`), u.icon)
    if (useOf[name]) assert.deepEqual(uses.map((u) => u.t), useOf[name])
    const tags = [...c.matchAll(/<li class="fx__tag"><svg class="fx__ti"[^>]*><use href="#fi-([a-z]+)"\/><\/svg>([\s\S]*?)<\/li>/g)]
    assert.ok(tags.length >= 2 && tags.length <= 3, `${name} จุดเด่น 2–3`)
    for (const t of tags) assert.match(s, new RegExp(`<symbol id="fi-${t[1]}"`), t[1])
    assert.doesNotMatch(c, /use-[a-z]+\.webp/, 'ไม่มีไอคอน 3D')
    const cta = c.match(/<a class="fx__cta" href="([^"]+)" data-track="line" data-where="pp-fabric-card"/)
    assert.ok(cta, `${name} ขอตัวอย่าง`); assert.match(decodeURIComponent(cta[1]), new RegExp(`ขอตัวอย่าง${name}`))
  })
  assert.match(text(s), /เลือกได้ทุกสีและพิมพ์ได้ทุกลาย/)
  assert.match(text(s), /ตัวอย่างผ้า[^]*ฟรี[^]*ไม่วางมัดจำ/)
  assert.match(s, /href="\/fabric-technology\/"/)
  assert.match(s, /data-where="pp-fabric"/)
  assert.equal((m.match(/ id="fabric"/g) || []).length, 1)
  assert.doesNotMatch(text(s), /ยอดนิยม|เย็น|LPJ|LPP|LPS|Light Plus|\[|โรงงาน/)
  const fcss = readFileSync(new URL('../src/styles/product-page.css', import.meta.url), 'utf8')
  const fb = fcss.slice(fcss.indexOf('แถวใบสเปก'), fcss.indexOf('.pp2-fab__guide'))
  assert.ok(fb.length > 500, 'มีบล็อก CSS แถวใบสเปก')
  assert.match(fb, /\.fx__track \{[^}]*scroll-snap-type: x mandatory;/, 'รางเลื่อนเข้าใบ')
  /* รอบ 190 อาร์ต "กระตุกเยอะในการขยาย · uiux โหล sloppy" → เลือก B เก็บแถวเลื่อน แก้ให้ลื่น
     ต้นเหตุ: ยืดความสูง (grid-template-rows) = layout ทุกเฟรม · --p/scale/เงาเปลี่ยนตามการเลื่อน = repaint ทุกเฟรม */
  assert.doesNotMatch(fb, /grid-template-rows|scale: calc|var\(--p\)|calc\(\.15 \+/, 'ไม่มีการยืด/ย่อ/เงาตามการเลื่อน')
  assert.match(fb, /\.fx__card::after \{[^}]*opacity: 0;[^}]*transition: opacity/, 'เน้นใบกลางด้วยเงาคงที่ที่เฟดเฉพาะ opacity')
  assert.match(fb, /\.fx__c \{[^}]*flex: 0 0 var\(--fx-w\);/, 'ทุกใบกว้างเท่ากัน')
  assert.match(fb, /\.fx__track \{[^}]*gap: /, 'ช่องไฟจริงระหว่างใบ')
  assert.match(fb, /\.fx__sep \{/, 'แผ่นคั่นจุดวนกลับ')
  assert.match(fb, /\.fx:not\(\.is-js\) \.fx__pager \{[^}]*display: none;/, 'ไม่มี JS ไม่โชว์จุด/ตัวนับที่กดไม่ได้')
  assert.match(fb, /\.fx__track \{[^}]*position: relative;/, 'รางเป็นจุดอ้างอิง offsetLeft')
  assert.match(fb, /@media \(prefers-reduced-motion: reduce\)/)
  assert.doesNotMatch(fb, /preserve-3d|mix-blend-mode|conic-gradient/, 'ทางการ: ไม่มี 3D/เงารุ้ง/ขอบหยัก')
  assert.doesNotMatch(fcss, /\.fc-ring|\.fc__hole/, 'ลบ CSS วงแหวน/ห่วงเดิม')
  const js = readFileSync(new URL('../src/js/product-page.js', import.meta.url), 'utf8')
  assert.match(js, /^import \{ initFabricCards \} from '\.\/fabric-cards\.js'/m)
})

test('/sublimation/ แผงเลือกเสื้อ รอบ 196 (อาร์ต "รวมให้ครบในที่เดียว") + 196e (อาร์ต "ไม่ต้องแสดงราคา และทำมาให้ดีๆ"): ทรง 3 ทรง (ซ้าย กดเลือก) + คอ 13 ทรงตามตระกูล 5×3 (ขวา) · รูปคอจริง · ไม่มีราคา', () => {
  const m = main('sublimation')
  const all = sec(m, 'pp2-ty')
  assert.equal((m.match(/ id="options"/g) || []).length, 1, 'id options เดียว')
  assert.match(all, /^<section class="pp2-ty" id="options"/)
  assert.ok(m.indexOf('class="pp2-fab') < m.indexOf('class="pp2-ty'), 'ต่อจากเนื้อผ้า')
  assert.doesNotMatch(m, /<section class="pp2-col/, 'ไม่มีส่วนคอเสื้อแยก')
  assert.doesNotMatch(all, /pp2-ty__mo|pp2-col__more|class="cfr|<dialog class="cv"|pp2-col__go|pp2-col__grid|class="pp2-col__o"|ctz__ask|spk__sts/, 'ไม่มีของรอบก่อน')
  /* หัวส่วน */
  const tyHead = all.match(/<header class="pp2-ty__head">([\s\S]*?)<\/header>/)[1]
  assert.equal(text(tyHead.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]).trim(), 'เสื้อทีมพิมพ์ลาย เลือกทรงและคอให้เข้ากับทีม')
  assert.equal(text(tyHead.match(/<span class="hm-hl">([\s\S]*?)<\/span><\/h2>/)[1]).trim(), 'เลือกทรงและคอให้เข้ากับทีม')
  /* ไม่มีราคา (196e) */
  assert.doesNotMatch(text(all), /บาท|ราคา/, 'ส่วนนี้ไม่แสดงราคา')
  assert.doesNotMatch(all, /ctz__tb|spk__tp|ctz__p\b|ctz__head|id="ctz-/, 'ไม่มีตารางราคา/ราคาบนภาพทรง/กลุ่มตามราคา')
  /* แผงเดียว: ซ้ายทรง ขวาคอ */
  const p = all.slice(all.indexOf('<div class="spk">'), all.indexOf('<!-- /spk -->'))
  const ty = p.slice(p.indexOf('<div class="spk__ty">'), p.indexOf('<div class="pp2-col" id="collars">'))
  assert.ok(ty.length > 300 && p.indexOf('spk__ty') < p.indexOf('id="collars"'), 'ทรงมาก่อนคอ')
  assert.match(ty, /<header class="pp2-ty__step"><span class="pp2-ty__n" aria-hidden="true">1<\/span>[\s\S]*?<h3[^>]*>เลือกทรงเสื้อ<\/h3>/)
  const tiles = [...ty.matchAll(/<div class="spk__t spk__t--([a-z]+)">([\s\S]*?)<\/div><!-- \/t -->/g)]
  const pick = (t) => t[2].match(/<button type="button" class="spk__pick" aria-pressed="(true|false)" data-ty="([a-z]+)" data-cols="([^"]*)">/)
  assert.deepEqual(tiles.map((t) => pick(t) && pick(t).slice(1)), [['true', 'regular', 'all'], ['false', 'baseball', 'crew v'], ['false', 'jersey', '']], 'ทรงปกติ 13 คอ · เบสบอล คอกลม+คอวี (อาร์ตยืนยัน 10 พ.ย.) · เจอร์ซีย์ ยังไม่ระบุ')
  assert.deepEqual(tiles.map((t) => (t[2].match(/<a class="spk__go" href="([^"]+)" aria-label="ดูหน้า[^"]+">/) || [])[1] || null), [null, '/custom-baseball-shirts/', '/custom-oversize-jerseys/'])
  for (const [, k, t] of tiles) { const [, src, alt] = t.match(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/); assert.ok(pub(src), `${k} ${src}`); assert.ok(alt.trim(), k) }
  assert.match(ty, /<a class="spk__more" href="\/designs\/\?product=print">/)
  /* ขั้น 2: ตระกูลคอ 6 กลุ่ม เต็ม 5×3 (2+3 / 4+1 / 2+2+ถาม) */
  const s = p.slice(p.indexOf('<div class="pp2-col" id="collars">'), p.indexOf('<!-- /pp2-col -->'))
  const head = s.match(/<header class="pp2-ty__step">([\s\S]*?)<\/header>/)[1]
  assert.match(head, /<span class="pp2-ty__n" aria-hidden="true">2<\/span>/); assert.match(text(head.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]), /เลือกคอเสื้อ 13 ทรง/)
  const grid = s.slice(s.indexOf('<div class="cfx">'), s.indexOf('<!-- /cfx -->'))
  const fams = [...grid.matchAll(/<div class="cfm" style="--n:(\d)"><h4 class="cfm__h">([\s\S]*?)<\/h4><div class="cfm__cs">([\s\S]*?)<\/div><\/div><!-- \/fam -->/g)]
  assert.deepEqual(fams.map((f) => text(f[2]).trim()), ['คอกลม', 'คอปก', 'คอวี', 'คอห้าเหลี่ยม', 'คอจีน', 'คอคางหมู'])
  assert.deepEqual(fams.map((f) => Number(f[1])), [2, 3, 4, 1, 2, 2]); assert.equal(fams.reduce((n, f) => n + Number(f[1]), 0) + 1, 15, '15 ช่อง = 5×3 พอดี (รวมถามทรงคอ)')
  for (const [, n, , cs] of fams) assert.equal((cs.match(/<(article class="ctz__c"|figure class="pp2-col__pk")/g) || []).length, Number(n), 'จำนวนช่องตรงกับ --n')
  const cards = [...grid.matchAll(/<article class="ctz__c" data-k="[a-z0-9-]+">([\s\S]*?)<\/article>/g)].map((c) => c[1])
  const nameOf = (c) => text(c.match(/<h5 class="ctz__n">([\s\S]*?)<\/h5>/)[1]).trim()
  const names = cards.map(nameOf)
  assert.deepEqual(names, ['คอกลม', 'คอกลม 2 ชั้น', 'คอปก', 'คอปกซิป', 'คอวี', 'คอวีไขว้', 'คอวีตัด', 'คอวีมีปก', 'คอห้าเหลี่ยม', 'คอจีนซิป', 'คอจีนกระดุม', 'คอคางหมูมีปก', 'คอคางหมูไม่มีปก'])
  const imgs = new Set()
  for (const c of cards) {
    const n = nameOf(c)
    assert.doesNotMatch(c, /<button|ctz__real|colc-|line\.me|data-track/, `${n}: ไม่มีปุ่มสลับ/ภาพเจน/ปุ่ม LINE`)
    const ph = c.match(/<div class="ctz__pic"><img class="ctz__ph" src="([^"]+)" srcset="([^"]+)"[^>]*alt="([^"]+)"/); assert.ok(ph && pub(ph[1]) && /\/col-[a-z0-9-]+-480\.webp$/.test(ph[1]), `${n}: รูปคอจริง`)
    assert.ok(pub(ph[1].replace('-480.', '-800.'))); assert.match(ph[3], /งานจริง/); imgs.add(ph[1])
    assert.match(c, /<span class="ctz__no">ทรงนี้ไม่มี<\/span>/)
    const d = c.match(/<p class="ctz__d">([\s\S]*?)<\/p>/); assert.ok(d && text(d[1]).trim().length >= 8, `${n}: ต่างตรงไหน`)
    assert.match(d[1], /^<span class="inline-block">/, `${n}: ตัดบรรทัดเฉพาะช่องว่าง (ไม่ตัดกลางคำ)`)
  }
  assert.equal(imgs.size, 13)
  const cardOf = (n) => cards[names.indexOf(n)]
  assert.match(text(cardOf('คอวีไขว้')), /ใส่ผ้าแทรกคอได้/); assert.match(text(cardOf('คอวีมีปก')), /ใส่ผ้าแทรกคอได้/); assert.match(text(cardOf('คอปก')), /สาปโชว์สีได้/)
  /* ปก 2 แบบ = ช่องท้ายตระกูลคอปก · ถามทรงคอ = ช่องท้ายตาราง */
  const pk = fams[1][3].match(/<figure class="pp2-col__pk" data-k="pk">([\s\S]*?)<\/figure><!-- \/pk -->/); assert.ok(pk, 'ปก 2 แบบในตระกูลคอปก')
  assert.ok(fams[1][3].indexOf('pp2-col__pk') > fams[1][3].lastIndexOf('<article'), 'ปกอยู่ท้ายกลุ่ม')
  assert.match(text(pk[1]), /ปกทอ[\s\S]*ปกผ้า/); assert.match(text(pk[1]), /โลโก้ที่ปก/)
  for (const src of pk[1].matchAll(/src="([^"]+)"/g)) assert.ok(pub(src[1]), src[1])
  const askc = grid.match(/<div class="pp2-col__ask">([\s\S]*?)<\/div><!-- \/ask -->/); assert.ok(askc && grid.indexOf('pp2-col__ask') > grid.lastIndexOf('<!-- /fam -->'), 'ถามทรงคอ = ช่องสุดท้าย')
  assert.match(askc[1], /href="https:\/\/[^"]+"[^>]*data-track="line"[^>]*data-where="pp-collars"/)
  /* คำ */
  assert.match(text(s), /รูปคอจากงานจริงที่ทีมดีผลิต/); assert.doesNotMatch(text(s), /ภาพจำลอง/)
  assert.match(text(s), /13 ทรง/); assert.doesNotMatch(text(m), /14 ทรง|คอวีมีปกผ้าแทรก/)
  assert.match(text(s), /สีล้วนและมีเส้นขลิบ/); assert.match(text(s), /เสื้อคอปกพิมพ์ลาย/, 'คำค้นผังเว็บ v22')
  assert.doesNotMatch(text(all), /16 แบบ|ไม่ซ้ำใคร|\[|โรงงาน|ลูกค้าจริง/)
  assert.doesNotMatch(all, /pp2-ty__foot|pp2-ty__note|href="#size"/, '196f อาร์ต "ภาพแรกลบ": ไม่มีบรรทัดหมายเหตุไซซ์/ภาพใต้แผง')
  /* CSS + JS */
  const css = readFileSync(new URL('../src/styles/product-page.css', import.meta.url), 'utf8')
  assert.match(css, /@media \(min-width: 1200px\) \{[^@]*\.spk \{[^}]*grid-template-columns:/, 'คอม: ทรงซ้าย คอขวา')
  assert.match(css, /\.cfx \{[^}]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/); assert.match(css, /\.cfm \{[^}]*grid-template-columns: subgrid/); assert.match(css, /\.cfm__cs \{[^}]*display: contents/)
  assert.match(css, /\.ctz__x \{[^}]*margin-top: auto/, 'ป้ายจุดเด่นชิดล่างการ์ด')
  assert.match(css, /@media \(max-width: 767px\) \{[^@]*\.cfm__cs \{[^}]*overflow-x: auto;/, 'มือถือ: ตระกูลคอเป็นแถบปัด')
  assert.match(css, /\.spk__pick\[aria-pressed="true"\]/); assert.match(css, /\.spk__pick:focus-visible \{[^}]*outline:/)
  assert.match(css, /\.is-off \{[^}]*opacity:/); assert.match(css, /\.is-off \.ctz__no \{[^}]*display:/)
  assert.doesNotMatch(css, /\.cfr|\.cv__|dialog\.cv|\.pp2-col__go|\.pp2-col__grid|\.pp2-col__o\b|\.pp2-ty__mo|\.pp2-col__more|\.ctz__real|\.ctz__rl|\.ctz__ask|\.ctz__li|\.ctz__tb|\.spk__tp|\.ctz__head|\.ctz__p\b|\.spk__st/, 'ลบ CSS เดิม')
  const js = readFileSync(new URL('../src/js/product-page.js', import.meta.url), 'utf8')
  assert.doesNotMatch(js, /collar-cards|collar-room|collar-viewer/)
  assert.match(js, /^import \{ initTypeCollars \} from '\.\/type-collars\.js'/m); assert.match(js, /^initTypeCollars\(\)/m)
  const data = JSON.parse(readFileSync(new URL('../src/data/pp-v2.json', import.meta.url), 'utf8')).print
  assert.equal(data.collars.tiers, undefined, 'ไม่มีกลุ่มตามราคาในข้อมูลแล้ว')
})

test('/sublimation/ ตารางไซซ์ (รอบ 133–134): ตัวเลขจากกราฟิกทางการ · ตารางแนวนอน ผู้ใหญ่ SS–7XL / เด็ก No.4–8 · ตัวเลือกไซซ์ + ภาพเสื้อเส้นวัด · วิธีวัด 2 แบบ · เบสบอล/เจอร์ซีย์ขอทาง LINE ไม่แต่งตัวเลข', () => {
  const m = main('sublimation')
  const s = sec(m, 'pp2-sz')
  assert.ok(m.indexOf('class="pp2-ty') < m.indexOf('class="pp2-sz'), 'ต่อจากประเภท + ทรงเสื้อ')
  assert.match(s, /^<section class="pp2-sz" id="size"/); assert.equal((m.match(/ id="size"/g) || []).length, 1, 'ส่วนไซซ์เดิมไม่ซ้ำ')
  const cols = (id) => {
    const t = s.match(new RegExp(`<table class="pp2-sz__t[^"]*" id="${id}">([\\s\\S]*?)</table>`))[1]
    const head = [...t.match(/<thead>([\s\S]*?)<\/thead>/)[1].matchAll(/<th scope="col"[^>]*>([^<]+)<\/th>/g)].map((x) => x[1])
    const row = (k) => [...t.match(new RegExp(`<tr data-row="${k}">([\\s\\S]*?)</tr>`))[1].matchAll(/<td[^>]*>(\d+)<\/td>/g)].map((x) => x[1])
    const c = row('chest'), l = row('len'); return head.map((h, i) => `${h} ${c[i]} ${l[i]}`)
  }
  assert.deepEqual(cols('sz-adult'), ['SS 34 24', 'XS 36 25', 'S 38 26', 'M 40 27', 'L 42 28', 'XL 44 29', '2XL 46 30', '3XL 48 31', '4XL 50 32', '5XL 52 33', '6XL 54 33', '7XL 56 33'])
  assert.deepEqual(cols('sz-kids'), ['No.4 26 18', 'No.5 28 19', 'No.6 30 20', 'No.7 32 21', 'No.8 34 22'])
  const picks = [...s.matchAll(/<button type="button" class="pp2-sz__pick" data-g="(adult|kids)" data-sz="([^"]+)" data-chest="(\d+)" data-len="(\d+)"/g)]
  assert.equal(picks.length, 17, 'ปุ่มเลือกไซซ์ครบ 12 + 5')
  assert.match(s, /data-sz-chest>40<\/b>[\s\S]*data-sz-len>27<\/b>/, 'ค่าตั้งต้นไซซ์ M (ไม่มี JS ก็เห็น)')
  assert.match(text(s), /ใส่ได้ทั้งชายและหญิง/); assert.match(text(s), /ไม่เกิน 1 นิ้ว/)
  assert.match(text(s), /วัดจากเสื้อตัวที่ใส่ประจำ[\s\S]*วัดจากรอบอกจริง[\s\S]*1–2 ไซซ์/)
  const others = [...s.matchAll(/<a class="pp2-sz__o pp2-sz__o--([a-z]+)" href="(https:\/\/line\.me\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
  assert.deepEqual(others.map((o) => o[1]), ['baseball', 'jersey'])
  for (const [, , , o] of others) { assert.ok(pub(o.match(/src="([^"]+)"/)[1])); assert.doesNotMatch(text(o), /\d+ นิ้ว|\d+″/, 'ไม่แต่งตัวเลข') }
  assert.doesNotMatch(text(s), /20 บาท|\[|รอตาราง|โรงงาน/, 'ไม่ใส่ส่วนต่างราคาที่ยังขัดกับ FAQ')
})

test('/sublimation/ เสื้อจริงใส่หุ่น (บอร์ด "แบบเสื้อจริงใส่หุ่น"): รูปถ่ายเสื้อตัวจริง 8 ตัว (ไม่ใช้ภาพเจน work-mannequin) · งานที่มีแบบ 3D ก่อนผลิตโชว์คู่กัน + รหัสจริงจากคลัง · กดขยายภาพได้', () => {
  const m = main('sublimation')
  const s = sec(m, 'pp2-rl')
  assert.ok(m.indexOf('class="pp2-sz') < m.indexOf('class="pp2-rl'), 'ต่อจากตารางไซซ์')
  const cards = [...s.matchAll(/<li class="pp2-rl__c">([\s\S]*?)<\/li>/g)].map((c) => c[1])
  assert.equal(cards.length, 20, 'อาร์ต "ไปหามา ทำหลายๆตัวหลายๆแบบ": เสื้อจริงบนหุ่น 20 ตัว')
  const srcs = cards.map((c) => c.match(/<img class="pp2-rl__real" src="([^"]+)"/)[1]); assert.equal(new Set(srcs).size, 20, 'ไม่ซ้ำกัน')
  assert.doesNotMatch(s, /work-mannequin/, 'ภาพเจนไม่นับเป็นเสื้อจริง')
  const reals = cards.map((c) => c.match(/<img class="pp2-rl__real" src="([^"]+)"[^>]*alt="([^"]+)"/))
  for (const r of reals) { assert.ok(r && pub(r[1]), 'มีรูปจริง'); assert.match(r[2], /เสื้อตัวจริง/) }
  /* 6 พ.ย. อาร์ต "เอาแค่เสื้อใส่หุ่น ทำมาให้เท่าๆกัน เอาเสื้อ 3D ออก แก้ headline": ไม่มีภาพ 3D · ภาพครอปให้เสื้อสัดส่วนเท่ากัน (real-even) */
  assert.doesNotMatch(s, /pp2-rl__pip|pp2-rl__3d/, 'ไม่มีภาพ 3D')
  for (const r of reals) assert.match(r[1], /^\/img\/real-even\/[\w-]+-540\.webp$/, 'ภาพครอปเท่ากัน')
  for (const c of cards) { assert.doesNotMatch(c, /pp2-rl__tag|pp2-rl__m|<figcaption|<small/, 'ไม่มีป้าย/คำบนการ์ด'); assert.equal(text(c.replace(/alt="[^"]*"/g, '')).trim(), '', 'ไม่มีข้อความบนการ์ด') }
  assert.match(s, /id="pp2RealGrid" data-line-url="https:\/\//, 'lightbox ส่งรหัสทาง LINE ได้')
  const codes = cards.map((c) => (c.match(/data-code="(TD-\d{4})"/) || [])[1]).filter(Boolean)
  assert.deepEqual(codes.sort(), ['TD-0282', 'TD-0283', 'TD-0348', 'TD-0364', 'TD-0562'], 'รหัสจริงยังอยู่ใน lightbox · ไม่แต่งรหัสเพิ่ม')
  const rh = s.match(/<header class="pp2-rl__head">([\s\S]*?)<\/header>/)[1]
  assert.equal(text(rh.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]).replace(/\s+/g, ''), 'เสื้อจริงจากออเดอร์ลูกค้า')
  assert.doesNotMatch(text(rh), /ใส่หุ่นให้ดู|ตัวจริง|3D|มุมขวาล่าง/)
  assert.match(s, /id="pp2RealGrid"/)
  assert.doesNotMatch(text(s), /WF-P|\[|โรงงาน/)
  /* 196f อาร์ต "ภาพสอง ทำ cta ดีๆหน่อย" → ปุ่มแคปซูล 2 ปุ่ม รูปจริงวงกลมซ้อน 3 วง (แบบ avatar-stack ดัดให้พื้นสว่าง) · จำนวนแบบนับจาก designs.json */
  assert.doesNotMatch(s, /pp2-rl__links/, 'ไม่มีลิงก์ตัวหนังสือเดิม')
  const go = s.match(/<div class="pp2-rl__go">([\s\S]*?)<\/div><!-- \/go -->/); assert.ok(go, 'แถวปุ่มไปต่อ')
  const ctas = [...go[1].matchAll(/<a class="rlc" href="([^"]+)">([\s\S]*?)<\/a>/g)]
  assert.deepEqual(ctas.map((c) => c[1].replace(/&#x3D;/g, '=')), ['/designs/?product=print', '/project/'], 'href (Handlebars เข้ารหัส = เป็น &#x3D; เบราว์เซอร์อ่านได้ปกติ)')
  const nPrint = JSON.parse(readFileSync(new URL('../src/data/designs.json', import.meta.url), 'utf8')).filter((d) => (d.product || []).includes('print')).length
  assert.match(text(ctas[0][2]), new RegExp(`ดูแบบเสื้อพิมพ์ลายทั้งหมด[\\s\\S]*${nPrint} แบบ`), 'จำนวนแบบจากข้อมูลจริง')
  assert.match(text(ctas[1][2]), /ดูงานจริงทั้งหมด/)
  for (const [i, dir] of [[0, '/img/design-front/'], [1, '/img/real-even/']]) {
    const faces = ctas[i][2].match(/<span class="rlc__faces" aria-hidden="true">([\s\S]*?)<\/span><span class="rlc__t">/); assert.ok(faces, 'รูปวงกลมซ้อน')
    const urls = [...faces[1].matchAll(/background-image:url\(([^)]+)\)/g)].map((u) => u[1])
    assert.equal(urls.length, 3, 'รูป 3 วง'); for (const u of urls) { assert.ok(u.startsWith(dir), u); assert.ok(pub(u), u) }
    assert.match(ctas[i][2], /<svg[^>]*aria-hidden="true"/, 'ลูกศร SVG')
  }
  const rcss = readFileSync(new URL('../src/styles/product-page.css', import.meta.url), 'utf8')
  assert.match(rcss, /\.rlc \{[^}]*min-height: 64px/, 'สูงเท่าปุ่มหลักของเว็บ'); assert.match(rcss, /\.rlc:focus-visible \{[^}]*outline:/); assert.match(rcss, /\.rlc__faces span \+ span \{[^}]*margin-left: -1[0-9]px/)
})

test('/sublimation/ ขั้นตอนสั่งผลิต (รอบ 136–138 อาร์ตเลือกแบบ B "การเดินทางของเสื้อ"): แผนที่ 5 ขั้น · ภาพซิกแซกจากแบบจริง · ป้ายเวลาจากข้อมูลเว็บ · ตั๋วชำระเงินระหว่างขั้นตามกราฟิกทางการ · ภาพปิดท้ายถึงมือทีม', () => {
  const m = main('sublimation')
  const s = sec(m, 'pp2-stb')
  assert.ok(m.indexOf('class="pp2-rl') < m.indexOf('class="pp2-stb'), 'ต่อจากเสื้อจริงใส่หุ่น')
  assert.match(s, /^<section class="pp2-stb" id="order"/)
  assert.doesNotMatch(m, /class="pp2-st"|pp2-st__|ทางเลือก 2|ชั่วคราว/, 'ลบแบบ A และป้ายชั่วคราวแล้ว')
  const map = [...s.matchAll(/<a href="#step-(\d)"/g)].map((x) => x[1]); assert.deepEqual(map, ['1', '2', '3', '4', '5'], 'แผนที่ลิงก์ไปทุกขั้น')
  const steps = [...s.matchAll(/<article class="pp2-stb__s pp2-stb__s--(\d)" id="step-\1">([\s\S]*?)<\/article>/g)]
  assert.deepEqual(steps.map((x) => x[1]), ['1', '2', '3', '4', '5'])
  assert.deepEqual(steps.map((x) => text(x[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]).trim()), ['คุยโจทย์', 'ออกแบบ', 'สรุปออเดอร์', 'ผลิตและอัปเดต', 'จัดส่ง'])
  for (const [, n, x] of steps) {
    for (const [tag] of x.matchAll(/<img[^>]*>/g)) { const src = tag.match(/src="([^"]+)"/)[1]; assert.ok(pub(src), src) }
    assert.ok((x.match(/<li>/g) || []).length >= 3, `ขั้น ${n} ขั้นย่อย ≥ 3`)
  }
  const times = steps.map((x) => (x[2].match(/<span class="pp2-stb__time">([^<]+)<\/span>/) || [, ''])[1])
  assert.deepEqual(times, ['ตอบใน 5 นาที', 'แบบ 3D ใน 24 ชม.', '', 'ผลิต 15–20 วัน', 'ส่งฟรีทั่วประเทศ'])
  const tix = [...s.matchAll(/<div class="pp2-stb__go[^"]*" data-between="(\d-\d)">([\s\S]*?)<\/div><!-- \/go -->/g)].map((t) => [t[1], text(t[2])])
  assert.deepEqual(tix.map((t) => t[0]), ['1-2', '2-3', '3-4', '4-5'])
  const paid = tix.filter((t) => /บาท|%/.test(t[1]))
  assert.deepEqual(paid.map((t) => t[0]), ['1-2', '3-4', '4-5'])
  assert.match(paid[0][1], /มัดจำค่าออกแบบ 500 บาท[\s\S]*หักค่าเสื้อ/); assert.match(paid[1][1], /50%[\s\S]*ก่อนผลิต/); assert.match(paid[2][1], /50%[\s\S]*ก่อนจัดส่ง/)
  const fin = s.match(/<figure class="pp2-stb__fin">([\s\S]*?)<\/figure>/)[1]
  assert.ok(pub(fin.match(/src="([^"]+)"/)[1])); assert.match(fin, /data-where="pp-steps"/)
  assert.match(text(s), /ออกแบบฟรี/); assert.match(text(s), /จำลองจากแบบเสื้อจริงของทีมดี/)
  assert.doesNotMatch(text(s), /\[|โรงงาน/)
})

test('/sublimation/ วิธีชำระเงิน + FAQ (บอร์ด "วิธีชำระเงิน" + "faq"): ใช้ชิ้นโฉมใหม่ของ /corporate/ ทั้งชิ้น (up2Pay · FAQ หน้าแรก) · ข้อมูลจริงของทีมดี (Visa/Mastercard เท่านั้น) · คำถาม 7 ข้อเดิมของหน้า · แทนส่วนเดิม', () => {
  const m = main('sublimation')
  const pay = sec(m, 'up2-pay')
  assert.ok(m.indexOf('class="pp2-stb') < m.indexOf('class="up2-pay'), 'ต่อจากขั้นตอนสั่งผลิต')
  assert.match(text(pay), /ใบกำกับภาษี/); assert.match(text(pay), /บัตรเครดิต/); assert.match(text(pay), /วางบิล/)
  assert.match(pay, /Visa/); assert.match(pay, /Mastercard/); assert.doesNotMatch(pay, /UnionPay|JCB|Delicake/)
  assert.match(text(pay), /มัดจำ 50%/)
  for (const [, src] of pay.matchAll(/src="([^"]+)"/g)) assert.ok(pub(src), src)
  const faq = m.slice(m.indexOf('<section class="wrap hm-sec hm-reference hm-faq pp2-faq"'))
  assert.ok(faq.length > 100, 'มี FAQ โฉมใหม่')
  const f = faq.slice(0, faq.indexOf('</section>'))
  assert.match(f, /id="faq"/); assert.equal((m.match(/ id="faq"/g) || []).length, 1, 'FAQ เดิมไม่ซ้ำ')
  const qs = [...f.matchAll(/<span class="hm-faq__q">([\s\S]*?)<\/span>/g)].map((q) => text(q[1]).trim())
  assert.equal(qs.length, 7)
  assert.match(qs[0], /เปลี่ยนสีหรือใส่โลโก้/); assert.match(qs[6], /งานด่วน/)
  for (const [, src] of f.matchAll(/<img class="hm-faq__art" src="([^"]+)"/g)) assert.ok(pub(src), src)
  assert.match(f, /เช็กคิวตามวันใช้เสื้อ/); assert.match(f, /href="\/delivery-after-sales-guide\/"/)
  assert.match(m, /<script type="application\/ld\+json">[^<]*FAQPage/, 'ยังมี JSON-LD FAQ')
})

/* 6 พ.ย. อาร์ต "ทั้งหน้านี้ทำให้ย่อความห่างหรือกระชับอะไรให้เหมือนกันหน้าแรก"
   หน้าแรก (home.css): ทุกส่วน 40/40 บนจอใหญ่ · 36/36 มือถือ · H2 clamp(30px, 3.06vw, 44px)/800/1.35 · มือถือ 24/800/1.4
   /sublimation/ เดิม: ส่วนละ 56–96 (ช่องระหว่างส่วน 112–192) · H2 ปน 44–68 → ใช้จังหวะเดียวกับหน้าแรก (แบบเดียวกับ use-page.css หน้ากลุ่มลูกค้า) */
test('/sublimation/ ระยะทั้งหน้าเท่าหน้าแรก: ทุกส่วน 40/40 (มือถือ 36/36) · H2 ขนาดเดียวกับหน้าแรก', () => {
  const css = readFileSync('src/styles/product-page.css', 'utf8')
  const block = (q) => { const i = css.indexOf(`@media ${q} {\n  /* pp2-rhythm`); assert.ok(i > -1, `มีชุดระยะ ${q}`); return css.slice(i, css.indexOf('\n}\n', i)) }
  const ids = ['.pp2-hl', '.pp2-dz', '.pp2-pf', '#reviews', '.pp2-cz', '.pp2-fab', '.pp2-ty', '.pp2-sz', '.pp2-rl', '.pp2-stb', '.rvw-sec', '#payment', '#faq'] /* .rvw-sec คลังรีวิว 11 พ.ย. */
  for (const [q, y, h2] of [['(min-width: 768px)', 40, 'font-size: clamp(30px, 3.06vw, 44px); font-weight: 800; line-height: 1.35;'], ['(max-width: 767px)', 36, 'font-size: 24px; font-weight: 800; line-height: 1.4;']]) {
    const b = block(q)
    for (const s of ids) assert.ok(b.includes(s), `${q}: ${s} อยู่ในชุดระยะ`)
    assert.match(b, new RegExp(`padding-top: ${y}px; padding-bottom: ${y}px;`))
    assert.ok(b.includes(`body:has(.pp2-hero) #main section:not(.pp2-hero) h2 { ${h2} }`), `${q}: H2 เท่าหน้าแรก`)
  }
  const m = main('sublimation'); for (const s of ['pp2-hl', 'pp2-dz', 'pp2-pf', 'pp2-cz', 'pp2-fab', 'pp2-ty', 'pp2-sz', 'pp2-rl', 'pp2-stb']) assert.match(m, new RegExp(`<section class="${s}[ "]`), `${s} ยังอยู่ในหน้า`)
  assert.match(m, /id="reviews"/); assert.match(m, /id="payment"/); assert.match(m, /id="faq"/); assert.match(m, /class="band-hero pp2-hero"/)
})

test('/sublimation/ ส่วนผ้า + คอเสื้อ ใช้ความกว้างพิเศษชุดเดียวกับหน้าบริษัท (รอบ 144 · 100% − 64 สูงสุด 1400)', () => {
  const css = readFileSync(new URL('../src/styles/product-page.css', import.meta.url), 'utf8')
  const use = readFileSync(new URL('../src/styles/use-page.css', import.meta.url), 'utf8')
  const ref = use.match(/\.up2-why > \.wrap \{ width: (calc\(100% - \d+px\)); max-width: (\d+px);/)
  assert.ok(ref, 'หน้าบริษัทยังมีความกว้างพิเศษ')
  const mine = css.match(/:is\(\.pp2-fab, \.pp2-ty, \.pp2-rl\) > \.wrap \{ width: (calc\(100% - \d+px\)); max-width: (\d+px);/)
  assert.ok(mine, 'ส่วนผ้า + คอเสื้อมีกฎความกว้างพิเศษ')
  assert.deepEqual([mine[1], mine[2]], [ref[1], ref[2]], 'ค่าเดียวกับหน้าบริษัท')
  assert.doesNotMatch(css, /1520px/, 'ไม่มีความกว้างแปลกปลอม 1520')
})

test('/sublimation/ หัวข้ออยู่กลางทุกส่วนที่ทำได้ (6 พ.ย. อาร์ต "เน้นเอาแบบ headline ตรงกลาง ถ้าอันไหนกลางไม่ได้ไม่เป็นไร")', () => {
  const css = readFileSync(new URL('../src/styles/product-page.css', import.meta.url), 'utf8')
  const block = css.slice(css.indexOf('/* pp2-center'))
  assert.ok(css.includes('/* pp2-center'), 'มีชุดกฎจัดกลาง')
  for (const sel of ['.pp2-dz__head', '.pp2-cz .dz__head', '.pp2-fab__head', '.pp2-ty__head', '.pp2-rl__head', '.pp2-sz__head', '.pp2-faq .hm-faq__head']) assert.ok(block.includes(sel), `${sel} อยู่ในชุดจัดกลาง`)
  assert.match(block, /body:has\(\.pp2-hero\) #main :is\([^)]*\) \{[^}]*text-align: center/, 'จำกัดเฉพาะหน้าที่มี pp2-hero')
  const m = main('sublimation')
  for (const cls of ['pp2-dz__head', 'dz__head', 'pp2-fab__head', 'pp2-ty__head', 'pp2-rl__head', 'pp2-sz__head', 'hm-faq__head']) assert.match(m, new RegExp(`<header class="${cls}"`), `${cls} ยังอยู่ในหน้า`)
})
