/* 16 พ.ย. 2026 ตรวจหน้ากลุ่มลูกค้า 10 หน้า (อาร์ต "ทำข้อ 9 ก่อนเลย"): description หน้า /corporate/ ยาว 174 ตัวอักษร
   Google มักตัดราว 155–160 → ข้อความท้ายหาย · ทุกหน้ากลุ่มลูกค้าต้องไม่เกิน 160 และไม่สั้นจนไม่บอกอะไร (≥ 90) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const PAGES = ['corporate', 'custom-staff-shirts', 'custom-organization-shirts', 'education', 'custom-university-shirts', 'custom-class-shirts', 'sport', 'custom-badminton-shirts', 'custom-running-shirts', 'event']

test('description หน้ากลุ่มลูกค้าทั้ง 10 หน้า ยาว 90–160 ตัวอักษร', () => {
  for (const slug of PAGES) {
    const html = readFileSync(new URL(`../site/${slug}/index.html`, import.meta.url), 'utf8')
    const d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1]
    assert.ok(d, `${slug}: มี description`)
    assert.ok(d.length >= 90 && d.length <= 160, `${slug}: ยาว ${d.length}`)
  }
})

test('/corporate/: description ยังบอกบริการหลักและสิ่งที่ผู้ประสานงานได้', () => {
  const d = readFileSync(new URL('../site/corporate/index.html', import.meta.url), 'utf8').match(/<meta name="description" content="([^"]*)"/)[1]
  for (const w of ['เสื้อบริษัท', 'ยูนิฟอร์มพนักงาน', 'โลโก้', 'ไซซ์']) assert.ok(d.includes(w), w)
})
