/* 17 พ.ย. 2026 งาน B4 (อาร์ต "งานโครงสร้างที่ค้าง B4 npm run new:page"): เพิ่มหน้ากลุ่มลูกค้าใหม่โดยไม่ต้องไล่แก้ 4 ที่เอง
   npm run new:page -- use <id> --from <id เดิม> --route /path/ --name "ชื่อกลุ่ม"
   สร้าง: src/content/use/<id>.json (สำเนาจากหน้าเดิม) · site/<route>/index.html (title/description ร่าง + noindex) · routes.json uses · uses.json
   หน้าใหม่เริ่มเป็น noindex เสมอ (เนื้อหายังเป็นของหน้าเดิม) · แก้เนื้อหาเสร็จค่อยลบบรรทัด noindex */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { planUsePage } from '../scripts/new-page.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const state = () => ({
  routes: JSON.parse(read('src/data/routes.json')),
  uses: JSON.parse(read('src/data/uses.json')),
  content: (id) => JSON.parse(read(`src/content/use/${id}.json`)),
  html: (route) => read(`site${route}index.html`),
})

test('planUsePage: สร้างครบ 4 ที่ · หน้าใหม่ noindex · ไม่แตะกลุ่มเดิม', () => {
  const s = state()
  const p = planUsePage({ id: 'pet', from: 'shop', route: '/custom-pet-shop-shirts/', name: 'เสื้อร้านสัตว์เลี้ยง' }, s)
  assert.equal(p.routes.uses.pet, '/custom-pet-shop-shirts/')
  assert.equal(p.routes.uses.shop, s.routes.uses.shop)
  const u = p.uses.find((x) => x.id === 'pet')
  assert.equal(u.name, 'เสื้อร้านสัตว์เลี้ยง'); assert.deepEqual(u.legacyIds || [], [])
  assert.equal(p.uses.length, s.uses.length + 1)
  assert.deepEqual(p.content, s.content('shop'))
  assert.equal(p.files.content, 'src/content/use/pet.json'); assert.equal(p.files.html, 'site/custom-pet-shop-shirts/index.html')
  assert.match(p.html, /<meta name="robots" content="noindex">/)
  assert.match(p.html, /<title>ร่าง: เสื้อร้านสัตว์เลี้ยง \| TEAMDEE<\/title>/)
  assert.doesNotMatch(p.html, new RegExp(s.html(s.routes.uses.shop).match(/<title>([^<]+)<\/title>/)[1].replace(/[|/()]/g, '\\$&')))
  assert.match(p.html, /\{\{> usePage\}\}/)
})

test('planUsePage: กันพลาด · id ซ้ำ · route ซ้ำ/รูปแบบผิด · หน้าต้นแบบไม่มี · id ผิดรูป', () => {
  const s = state()
  const ok = { id: 'pet', from: 'shop', route: '/custom-pet-shop-shirts/', name: 'x' }
  assert.throws(() => planUsePage({ ...ok, id: 'shop' }, s), /มีอยู่แล้ว/)
  assert.throws(() => planUsePage({ ...ok, route: '/sport/' }, s), /ใช้แล้ว/)
  assert.throws(() => planUsePage({ ...ok, route: 'no-slash' }, s), /ขึ้นต้นและลงท้ายด้วย \//)
  assert.throws(() => planUsePage({ ...ok, from: 'nope' }, s), /ไม่มีหน้าต้นแบบ/)
  assert.throws(() => planUsePage({ ...ok, id: 'Pet Shop' }, s), /ตัวพิมพ์เล็ก/)
  assert.throws(() => planUsePage({ ...ok, name: '' }, s), /ชื่อกลุ่ม/)
})

test('package.json มีคำสั่ง new:page', () => {
  assert.equal(JSON.parse(read('package.json')).scripts['new:page'], 'node scripts/new-page.mjs')
})
