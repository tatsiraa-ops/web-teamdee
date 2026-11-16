/* 16 พ.ย. 2026 อาร์ต (ภาพ: กล่องดำ "9 จาก 36 · คุยเรื่องภาพนี้ทาง LINE · เซฟรูป" / กล่องรีวิวขาว / โมเสกรูปลูกค้า)
   "ไม่ต้องให้ popup แบบนี้สิ เอาแบบภาพสอง และทำให้อันนี้กดดูภาพได้มี popup แบบตัวอื่น"
   → รูปลูกค้า/งานจริงที่ไม่ใช่แบบเสื้อ เปิดในกล่องรีวิวขาว (.rvd · review-dialog.js) แทนกล่องดำ (.lb)
   → โมเสกรูปลูกค้าในส่วนรีวิว (หน้าแรก · หน้ากลุ่ม · หน้าผลงาน) เป็นปุ่ม กดแล้วเปิดกล่องเดียวกัน
   แบบเสื้อที่มีรหัส/แบบเสื้อ (data-design) ยังใช้กล่องแบบเสื้อสว่างเดิม (.lb--design) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { splitCaption, isDesignItem, photoMessage } from '../src/js/photo-set.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('คำบรรยายรูป: ส่วนแรก = หัวข้อ · ที่เหลือ = บรรทัดรอง', () => {
  assert.deepEqual(splitCaption('กลุ่มนักเรียนถ่ายรวมในห้องประชุม · เสื้อมหาลัย โรงเรียน'), { title: 'กลุ่มนักเรียนถ่ายรวมในห้องประชุม', small: 'เสื้อมหาลัย โรงเรียน' })
  assert.deepEqual(splitCaption('ภาพงานจริงของลูกค้ากลุ่มบริษัท'), { title: 'ภาพงานจริงของลูกค้ากลุ่มบริษัท', small: '' })
  assert.deepEqual(splitCaption('  ก · ข · ค  '), { title: 'ก', small: 'ข · ค' })
  assert.deepEqual(splitCaption(''), { title: 'ภาพงานจริงจากลูกค้าทีมดี', small: '' }, 'รูปไม่มี alt ยังมีหัวข้อ')
})

test('แบบเสื้อ = มีรหัส TD- หรือ data-design="1" · อย่างอื่นเป็นรูปงานจริง', () => {
  assert.equal(isDesignItem({ code: 'TD-0012' }), true)
  assert.equal(isDesignItem({ design: '1' }), true)
  assert.equal(isDesignItem({ code: 'X-1' }), false)
  assert.equal(isDesignItem({}), false)
})

test('ข้อความ LINE ของรูป: บอกภาพที่ดูและหน้าที่มา', () => {
  assert.equal(photoMessage('ทีมบริษัทใส่โปโล', 'https://team-dee.com', '/'), 'สนใจเสื้อแบบในภาพ: ทีมบริษัทใส่โปโล\nจากหน้า https://team-dee.com/')
})

test('กล่องรีวิวขาวเปิดชุดรูปได้ (openPhotos) · ไม่มีปุ่มเซฟ · แถบรูปย่อเลื่อนแนวนอนเมื่อรูปเยอะ', () => {
  const js = read('src/js/review-dialog.js')
  assert.match(js, /export function openPhotos\(/)
  assert.match(js, /from '\.\/photo-set\.js'/)
  assert.doesNotMatch(js, /เซฟรูป/)
  /* รีวิวเดิมยังเปิดจาก data-rv-open เหมือนเดิม */
  assert.match(js, /closest\('\[data-rv-open\]'\)/)
  const css = read('src/styles/main.css')
  assert.match(css, /\.rvd\.is-set \.rvd__thumbs \{[^}]*flex-wrap: nowrap;[^}]*overflow-x: auto;/)
})

test('lightbox: ชุดที่เป็นรูปงานจริงล้วน → กล่องรีวิวขาว · มีแบบเสื้อ → กล่องแบบเสื้อเดิม', () => {
  const js = read('src/js/lightbox.js')
  assert.match(js, /import \{ openPhotos \} from '\.\/review-dialog\.js'/)
  assert.match(js, /if \(!items\.some\(\(x\) => isDesignItem\(x\.dataset\)\)\) \{[\s\S]*?openPhotos\(/)
})

test('โมเสกรีวิว: รูปเป็นปุ่ม กดเปิดกล่องรีวิวขาว (หน้าแรก)', () => {
  const p = read('src/partials/homeReference-reviews.hbs')
  assert.match(p, /<figure class="hm-rvb__mosaic"[^>]*>\{\{#each this\.photos\}\}<button type="button" class="hm-rvb__tile" aria-label="ดูรูปใหญ่ ภาพงานจริงของลูกค้ากลุ่ม\{\{\.\.\/name\}\}"><img /)
  const css = read('src/styles/home.css')
  assert.match(css, /\.hm-rvb__tile:nth-child\(3\) \{ grid-column: 2; grid-row: 1 \/ 3;/)
  /* review-dialog.js ดักคลิกทั้งหน้าอยู่แล้ว (รีวิว) → รับคลิกรูปโมเสกด้วย · review-board.js ไม่ต้อง import กล่อง (เทส node import ไฟล์นั้นตรงๆ) */
  const dlg = read('src/js/review-dialog.js')
  assert.match(dlg, /closest\('\.hm-rvb__tile'\)/)
  assert.doesNotMatch(read('src/js/review-board.js'), /^import .*review-dialog/m)
  const page = new URL('../wp-theme/teamdee/build/pages/home.body.html', import.meta.url)
  if (existsSync(page)) {
    const html = readFileSync(page, 'utf8')
    const fig = html.match(/<figure class="hm-rvb__mosaic"[^>]*>([\s\S]*?)<\/figure>/)[1]
    assert.equal((fig.match(/<button type="button" class="hm-rvb__tile"/g) || []).length, 5)
  }
})
