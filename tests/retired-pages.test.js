/* หน้าเดิมที่ต้นแบบไม่มีแทน (อาร์ตเคาะ 30 ต.ค. รอบ 48 ข้อ 12: "ใส่ลิงก์ใน footer หรือ redirect ไปหน้าใหม่")
   เนื้อหาเดิมฝังหัวเว็บ/ท้ายเว็บของธีมเก่าไว้ในตัวหน้า ถ้าแสดงในธีมใหม่จะมีเมนูซ้อน 2 ชั้น → 301 ไปหน้าที่หัวข้อเดียวกัน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { isExported, CMS_PAGES } from '../scripts/seo-check.mjs'

const php = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const want = { '/pdpa/': '/privacy-policy/', '/production-techniques/': '/shirt-production-techniques-guide/', '/services/': '/', '/serviecs/': '/' }

test('หน้าเดิม 3 หน้า + ลิงก์สะกดผิด 301 ไปหน้าใหม่หัวข้อเดียวกัน (ไม่ต่อทอด 2 ทอด)', () => {
  const block = php.match(/const TD_RETIRED = \[([\s\S]*?)\];/)?.[1] || ''
  for (const [from, to] of Object.entries(want)) assert.match(block, new RegExp(`'${from}' => '${to}'`), from)
  assert.doesNotMatch(php, /'\/serviecs\/' => 'services'/)
  assert.match(php, /wp_safe_redirect\(home_url\(\$to\)[^;]*, 301, 'TEAMDEE retired page'\)/)
})

/* รีวิว 30 ต.ค.: เดิมชี้ /blog/print-vs-embroidery/ ซึ่งมีแค่ในต้นแบบ (ไม่ export ขึ้น WP) = เว็บจริง 301 ไป 404 */
test('ปลายทางมีบน WordPress จริง: หน้าที่ export · หน้า CMS · บทความเดิม', () => {
  const legacy = new Set(JSON.parse(readFileSync(new URL('../src/data/legacy-posts.json', import.meta.url), 'utf8')).items.map((p) => p.url))
  for (const to of Object.values(want)) {
    const exported = isExported(to) && existsSync(new URL(`../dist${to}index.html`, import.meta.url))
    assert.ok(exported || CMS_PAGES.has(to) || legacy.has(to), to)
  }
})

test('ธีมไม่ 301 ไปหน้าที่ไม่มี · คง query string (utm)', () => {
  assert.match(php, /function td_target_exists\(string \$to\): bool/)
  assert.match(php, /if \(\$to === null \|\| !td_target_exists\(\$to\)\) return;/)
  assert.match(php, /\$_SERVER\['QUERY_STRING'\]/)
})

test('หน้าที่ 301 แล้วไม่อยู่ใน sitemap', () => {
  assert.match(php, /td_retired_target\(td_route_of_post\(\$object\)\)/)
  assert.match(php, /array_keys\(\(array\) apply_filters\('teamdee_retired_pages', TD_RETIRED\)\)/)
})
