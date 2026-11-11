/* title / description 22 URL เดิมบนเว็บจริง (Rank Math) · อาร์ตเคาะ "ใช้ตามที่เสนอทั้งหมด" 30 ต.ค. 2026
   ข้อมูล wp-theme/teamdee/seo-legacy.json · ผู้ดูแลกดใช้ในหลังบ้าน (เครื่องมือ > หน้าจากต้นแบบ) · ไม่ทับช่องที่มีคนแก้หลัง 30 ต.ค. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const data = JSON.parse(read('wp-theme/teamdee/seo-legacy.json'))
const routes = JSON.parse(read('src/data/routes.json'))
const php = read('wp-theme/teamdee/functions.php')
/* นับตัวที่กินที่บนจอ (สระบน/ล่าง วรรณยุกต์ของไทยไม่นับ) */
const L = (s) => [...s.replace(/\p{Mn}/gu, '')].length

test('ครบ 22 URL ที่ล็อกไว้ · ทุกหน้ามีค่าเดิมบนเว็บจริงไว้เทียบ', () => {
  assert.deepEqual(Object.keys(data.pages).sort(), [...routes.lock].sort())
  for (const [u, p] of Object.entries(data.pages)) {
    assert.equal(typeof p.old.title, 'string', u)
    assert.ok(p.title === null || typeof p.title === 'string', u)
  }
})

test('ข้อความที่จะขึ้น Google (ใหม่ หรือคงเดิม) ไม่มีคำต้องห้าม/ข้อเท็จจริงที่ขัด', () => {
  for (const [u, p] of Object.entries(data.pages)) {
    const title = p.title ?? p.old.title
    const desc = p.description ?? p.old.description
    for (const s of [title, desc]) {
      assert.doesNotMatch(s, /โรงงาน|ไม่มีขั้นต่ำ|100,000|5,000\+|ประสบการณ์ 10 ปี|3D ฟรี|ฟรีค่าออกแบบ|ประเมินราคาฟรี/, `${u}: ${s}`)
    }
    assert.ok(L(title) <= 70, `${u} title ยาว ${L(title)}`)
    assert.ok(title.endsWith('TEAMDEE') || title.includes('TEAMDEE'), `${u} มีชื่อแบรนด์`)
    if (p.description) assert.ok(L(p.description) >= 60 && L(p.description) <= 170, `${u} description ${L(p.description)}`)
  }
  /* หน้าที่ title เดิมติดคำว่าโรงงาน ต้องได้ title ใหม่ */
  assert.ok(data.pages['/'].title && data.pages['/about-us/'].title)
})

test('ธีม: กดใช้เองในหลังบ้าน (สิทธิ์ + nonce) · เขียนเฉพาะช่องว่าง/แม่แบบ/ยังเป็นข้อความเดิม · มีคนแก้แล้วข้าม', () => {
  assert.match(php, /function td_seo_legacy_plan\(\): array/)
  assert.match(php, /'apply' : 'edited'/)
  assert.match(php, /add_action\('admin_post_teamdee_seo_legacy', function \(\) \{\n\tif \(!current_user_can\('manage_options'\)\) wp_die\('ไม่มีสิทธิ์'\);\n\tcheck_admin_referer\('teamdee_seo_legacy'\);/)
  assert.doesNotMatch(php, /add_action\('(init|wp|template_redirect|after_switch_theme)'[^\n]*td_seo_legacy_apply/)
})
