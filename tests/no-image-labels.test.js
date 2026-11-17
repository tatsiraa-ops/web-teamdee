/* 16 พ.ย. 2026 อาร์ต "ไม่เอาป้ายภาพจำลอง" → "เอาออกทั้งหมด": ไม่มีป้าย ภาพจำลอง / ภาพประกอบ บนรูป (alt · ป้าย · หมายเหตุใต้ส่วน)
   เก็บไว้เฉพาะประโยคที่พูดถึงบริการแบบ 3D / ภาพจำลองแบบเสื้อที่ลูกค้าตรวจก่อนผลิต (เนื้อหา ไม่ใช่ป้ายรูป) และหมายเหตุแผนภาพวัดไซซ์ */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const dir = new URL('../wp-theme/teamdee/build/pages/', import.meta.url)
const KEEP = [
  /ตรวจภาพจำลอง/, /ยืนยันภาพจำลอง/, /ภาพจำลองแบบเสื้อต่างจากเสื้อตัวอย่าง/, /ภาพจำลองใช้แสดงแนวทาง/, /ภาพจำลองกับตัวอย่างเสื้อจริง/,
  /ไม่ใช่ภาพจำลอง/, /สเปกและภาพจำลอง/, /ภาพจำลองแบบเสื้อ/, /ภาพจำลอง(<br>|\s)*ไม่ใช่ชิ้นปักจริง/, /ภาพจำลองใช้ดูภาพรวม/, /ภาพประกอบตำแหน่งวัด/, /ภาพประกอบไม่ใช่มาตราส่วนจริง/, /เทียบภาพจำลองกับตัวอย่าง/,
]
test('หน้าที่ export ไม่มีป้ายภาพจำลอง/ภาพประกอบ (ยกเว้นประโยคเรื่องบริการแบบ 3D)', { skip: !existsSync(dir) }, () => {
  const bad = []
  for (const f of readdirSync(dir)) {
    const s = readFileSync(new URL(f, dir), 'utf8').replace(/<\/?t-[a-z]+>/g, '')
    for (const m of s.matchAll(/ภาพจำลอง|ภาพประกอบ/g)) {
      const ctx = s.slice(Math.max(0, m.index - 40), m.index + 60)
      if (!KEEP.some((re) => re.test(ctx))) bad.push(`${f}: …${ctx.replace(/\s+/g, ' ')}…`)
    }
  }
  assert.deepEqual(bad.slice(0, 8), [], `${bad.length} จุด`)
})

/* 17 พ.ย. 2026 รอบตรวจ SEO: ป้ายใต้รูปคู่มือ (guideProcessStudio) "ภาพจำลองแบบเสื้อ · ใช้ดูภาพรวม ไม่ใช่ภาพถ่ายงานผลิต" หลุดรอบ 16 พ.ย.
   เพราะคำ "ภาพจำลองแบบเสื้อ" อยู่ในรายการยกเว้น (ใช้ในเนื้อหาเรื่องบริการ) → ตรวจ figcaption ทุกอันใน partial ตรงๆ */
test('figcaption ใน partial ไม่มีป้ายภาพจำลอง/ภาพประกอบ', async () => {
  const { readdirSync, readFileSync: rf } = await import('node:fs')
  const dir = new URL('../src/partials/', import.meta.url)
  const bad = []
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.hbs'))) for (const m of rf(new URL(f, dir), 'utf8').matchAll(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g)) if (/ภาพจำลอง|ภาพประกอบ/.test(m[1])) bad.push(`${f}: ${m[1].slice(0, 60)}`)
  assert.deepEqual(bad, [])
})
