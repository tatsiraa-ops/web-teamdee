/* GTM โหลดหลังหน้าโหลดเสร็จ (อาร์ตอนุญาต 30 ต.ค. รอบ 48 ข้อ 15 · เคาะ 30 ต.ค. ข้อ 5 "ข")
   เดิมรอเพิ่มอีก ~2.5 วิ + ช่วงว่าง → คนกด LINE บนคอมพ์เร็วๆ หน้าเปลี่ยนก่อน GTM มา คลิกไม่ถูกนับ
   ใหม่: โหลดทันทีที่ load (รูปจอแรกโหลดเสร็จแล้ว) หรือเมื่อผู้ใช้แตะ/เลื่อน/กดปุ่มครั้งแรก แล้วแต่อย่างไหนก่อน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const php = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const loader = php.match(/<script>\(function\(w,d,s,l,i\)\{[^\n]*gtm\.js\?id=[^\n]*<\/script>/)?.[0] || ''

test('GTM โหลดตอน load ทันที ไม่รอเพิ่ม · ยังเร็วขึ้นได้เมื่อผู้ใช้แตะก่อน · โหลดครั้งเดียว', () => {
  assert.ok(loader, 'พบตัวโหลด GTM')
  assert.match(loader, /w\.addEventListener\('load',go\)/)
  assert.doesNotMatch(loader, /2500|requestIdleCallback/)
  assert.match(loader, /\['pointerdown','keydown','scroll','touchstart'\]\.forEach/)
  assert.match(loader, /if\(done\)return;done=1;/)
})
