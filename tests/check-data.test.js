/* 16 พ.ย. 2026 A2 ตัวตรวจข้อมูล (`npm run check` · scripts/check-data.mjs): อาร์ตแก้ JSON เอง → บอกเป็นภาษาไทยว่าผิดไฟล์ไหน บรรทัดไหน แก้ยังไง
   ผิดจริง (หยุด): JSON พัง · รูปที่อ้างถึงไม่มีไฟล์ · คำเตือน: title/description ยาวเกินหรือสั้นไป (จากผล export ล่าสุด · ไม่นับหน้า noindex) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { jsonProblem, missingImages, metaWarnings } from '../scripts/check-data.mjs'

test('JSON ถูก = ไม่มีปัญหา', () => {
  assert.equal(jsonProblem('{"a": 1}', 'x.json'), null)
})

test('ลืมจุลภาค: บอกไฟล์ บรรทัด คอลัมน์ บรรทัดที่ผิด และคำแนะนำภาษาไทย', () => {
  const p = jsonProblem('{\n  "a": 1\n  "b": 2\n}', 'src/data/x.json')
  assert.equal(p.file, 'src/data/x.json'); assert.equal(p.line, 3); assert.equal(p.col, 3)
  assert.equal(p.snippet, '  "b": 2')
  assert.match(p.hint, /ลืมจุลภาค/)
})

test('จุลภาคเกินท้ายรายการ · วงเล็บไม่ครบ · ขึ้นบรรทัดในข้อความ: คำแนะนำตรงเรื่อง', () => {
  assert.match(jsonProblem('{\n  "a": 1,\n}', 'x').hint, /จุลภาคเกิน/)
  assert.match(jsonProblem('{"a": [1, 2}', 'x').hint, /ลืมจุลภาค|วงเล็บ/)
  assert.match(jsonProblem('{"a": 1', 'x').hint, /วงเล็บ|ปิดไม่ครบ/)
  assert.match(jsonProblem('{"a": "x\ny"}', 'x').hint, /\\n/)
})

test('รูปที่หาย: เฉพาะ path /img/ ที่มีนามสกุลไฟล์ (path ไม่มีนามสกุล = ชื่อฐานที่ต่อขนาดทีหลัง ไม่ตรวจ)', () => {
  const have = new Set(['/img/a.webp'])
  const out = missingImages('{"a": "/img/a.webp", "b": "/img/b.webp", "c": "/img/base", "d": "/img/b.webp"}', (p) => have.has(p))
  assert.deepEqual(out, ['/img/b.webp'])
})

test('คำเตือน title/description: ยาวเกิน สั้นไป ไม่มี · ข้ามหน้า noindex และ 404', () => {
  const w = metaWarnings({
    '/ok/': { title: 'ก'.repeat(40), description: 'ข'.repeat(120) },
    '/long/': { title: 'ก'.repeat(71), description: 'ข'.repeat(161) },
    '/short/': { title: 'ก', description: 'สั้น' },
    '/none/': { title: '', description: null },
    '/search/': { title: 'x', description: 'x', robots: 'noindex, follow' },
    '404': { title: 'x', description: 'x' },
  })
  assert.deepEqual(w.map((x) => x.route), ['/long/', '/long/', '/short/', '/none/', '/none/'])
  assert.ok(w.every((x) => /title|description/.test(x.msg)))
})

test('รันกับข้อมูลจริงของโปรเจกต์: ไม่มีข้อผิดพลาด (exit 0)', () => {
  const out = execFileSync('node', ['scripts/check-data.mjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
  assert.match(out, /ไม่พบข้อผิดพลาด/)
})

test('ตรวจไฟล์เนื้อหาต่อหน้าด้วย (src/content/** · B2 16 พ.ย.)', () => {
  const out = execFileSync('node', ['scripts/check-data.mjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
  assert.match(out, /เนื้อหาต่อหน้า (\d+) ไฟล์/)
  assert.ok(Number(out.match(/เนื้อหาต่อหน้า (\d+) ไฟล์/)[1]) >= 17)
})
