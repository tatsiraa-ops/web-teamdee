/* 16 พ.ย. 2026 ตรวจ staging (https://team-dee.com/enterprise/): บทความ 12 เรื่องเนื้อหาครบ แต่ทั้งหน้าเป็นหน้าตาเว็บเก่า
   (หัวเว็บ/เมนู/ท้ายเว็บเดิม) เพราะในหลังบ้านมีเทมเพลต Elementor Pro Theme Builder "Elementor Single Post #2041"
   ตั้งเงื่อนไข "Posts" → Elementor Pro เปลี่ยน template_include (priority 12) ไปใช้หน้าของมันแทน single.php ของธีม
   เนื้อบทความเขียนในหน้าแก้ไขปกติ (ไม่ใช่ Elementor) → ธีมแสดงเองได้ครบ
   แก้ (อาร์ต "ทำทาง ก เลย"): ธีมดึงหน้าบทความ/หน้าหมวดกลับมาใช้ single.php / category.php ของธีมเสมอ
   แม้ใครจะเปิดเทมเพลต Elementor นั้นกลับมาใช้ หรือย้ายฐานข้อมูลจากเว็บจริงมาทับ */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const START = '/* ---------- บทความและหมวด ใช้แม่แบบของธีมเสมอ ---------- */'

test('functions.php มีบล็อกดึงหน้าบทความ/หมวดกลับมาใช้แม่แบบของธีม', () => {
  assert.ok(source.includes(START), 'มีบล็อก')
})

test('หน้าบทความและหน้าหมวดใช้ single.php / category.php ของธีม แม้ Elementor Pro เปลี่ยนแม่แบบไปก่อน · หน้าอื่นไม่แตะ', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  const a = source.indexOf(START)
  const block = a < 0 ? '' : source.slice(a, source.indexOf('/* ---------- ', a + START.length))
  /* add_filter เรียงตาม priority เหมือน WordPress · Elementor Pro (priority 12) คืนหน้าของมันเองให้ทุกหน้าที่มันมีเทมเพลต */
  const stubs = `
    $GLOBALS['F'] = [];
    function add_filter($h, $cb, $p = 10, $n = 1) { $GLOBALS['F'][$h][$p][] = $cb; }
    function apply($h, $v) { $fs = $GLOBALS['F'][$h] ?? []; ksort($fs); foreach ($fs as $list) foreach ($list as $cb) $v = $cb($v); return $v; }
    function get_theme_file_path($f = '') { return '/themes/teamdee/' . $f; }
    function is_singular($t = '') { return ($GLOBALS['is'] ?? '') === 'post' && ($t === '' || $t === 'post'); }
    function is_category() { return ($GLOBALS['is'] ?? '') === 'category'; }
    function file_exists_stub() {}
    add_filter('template_include', function ($t) { return in_array($GLOBALS['is'], ['post', 'category', 'page'], true) ? '/plugins/elementor-pro/canvas.php' : $t; }, 12);
  `
  const code = `<?php ${stubs} ${block}
    $out = [];
    foreach (['post', 'category', 'page', 'product'] as $k) { $GLOBALS['is'] = $k; $out[$k] = apply('template_include', '/themes/teamdee/index.php'); }
    echo json_encode($out);`
  try {
    const r = await php.run({ code })
    assert.equal(r.errors, '')
    const o = JSON.parse(r.text)
    assert.equal(o.post, '/themes/teamdee/single.php', 'บทความใช้ single.php ของธีม')
    assert.equal(o.category, '/themes/teamdee/category.php', 'หน้าหมวดใช้ category.php ของธีม')
    assert.equal(o.page, '/plugins/elementor-pro/canvas.php', 'หน้า (Page) อื่นไม่แตะในบล็อกนี้')
    assert.equal(o.product, '/themes/teamdee/index.php', 'ประเภทอื่นไม่แตะ')
  } finally { php.exit() }
})
