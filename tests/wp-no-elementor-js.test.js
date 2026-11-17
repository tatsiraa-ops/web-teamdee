/* 17 พ.ย. 2026 staging console: "Uncaught ReferenceError: elementorFrontendConfig is not defined" (Elementor frontend.min.js 4.2.4)
   หน้าที่ธีมแสดงเองไม่ใช้ Elementor (ตัด CSS ไปแล้ว 16 พ.ย. · tests/wp-no-elementor-css.test.js) แต่สคริปต์ยังโหลด ค่าตั้งต้นไม่มา → error ทุกหน้า
   อาร์ตเลือกข้อ ก: หน้าที่ธีมแสดงเอง ไม่ใส่สคริปต์ Elementor (และสคริปต์ที่พึ่ง Elementor) ทั้งใน head และท้ายหน้า · บทความและหน้าอื่นไม่แตะ
   รายชื่อ handle/ไฟล์ = ของจริงจาก team-dee.com (17 พ.ย.) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const fnSrc = (name) => { const a = source.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let depth = 0, i = source.indexOf('{', a); for (; i < source.length; i++) { if (source[i] === '{') depth++; else if (source[i] === '}' && --depth === 0) break } return source.slice(a, i + 1) }

const P = '/wp-content/plugins'
const registered = {
  'jquery-core': { src: '/wp-includes/js/jquery/jquery.min.js', deps: [] },
  'jquery-ui-core': { src: '/wp-includes/js/jquery/ui/core.min.js', deps: ['jquery-core'] },
  'astra-theme-js': { src: '/wp-content/themes/astra/assets/js/minified/frontend.min.js', deps: [] },
  'elementor-webpack-runtime': { src: `${P}/elementor/assets/js/webpack.runtime.min.js`, deps: [] },
  'elementor-frontend-modules': { src: `${P}/elementor/assets/js/frontend-modules.min.js`, deps: ['elementor-webpack-runtime', 'jquery-core'] },
  'elementor-frontend': { src: `${P}/elementor/assets/js/frontend.min.js`, deps: ['elementor-frontend-modules', 'jquery-ui-core'] },
  'e-sticky': { src: `${P}/elementor-pro/assets/lib/sticky/jquery.sticky.min.js`, deps: ['jquery-core'] },
  'elementor-pro-frontend': { src: `${P}/elementor-pro/assets/js/frontend.min.js`, deps: ['elementor-frontend'] },
  'pro-elements-handlers': { src: `${P}/elementor-pro/assets/js/elements-handlers.min.js`, deps: ['elementor-pro-frontend'] },
  'addon-widgets': { src: `${P}/some-addon/js/widgets.js`, deps: ['jquery-core', 'elementor-frontend'] },
  'loop-a': { src: `${P}/x/a.js`, deps: ['loop-b'] },
  'loop-b': { src: `${P}/x/b.js`, deps: ['loop-a'] },
  'cmplz-cookiebanner': { src: `${P}/complianz-gdpr/cookiebanner/js/complianz.min.js`, deps: [] },
}
const expected = {
  'jquery-core': false, 'jquery-ui-core': false, 'astra-theme-js': false, 'cmplz-cookiebanner': false, 'loop-a': false, 'loop-b': false,
  'elementor-webpack-runtime': true, 'elementor-frontend-modules': true, 'elementor-frontend': true, 'e-sticky': true,
  'elementor-pro-frontend': true, 'pro-elements-handlers': true, 'addon-widgets': true,
}

test('สคริปต์ Elementor + สคริปต์ที่พึ่ง Elementor (ทางอ้อมก็นับ) · jQuery / ธีม / ปลั๊กอินอื่นไม่นับ · deps วนไม่ค้าง', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const code = `<?php ${fnSrc('td_is_elementor_asset')} ${fnSrc('td_script_needs_elementor')}
      $reg = array_map(fn ($r) => (object) $r, json_decode('${JSON.stringify(registered)}', true));
      $out = []; foreach (array_keys($reg) as $h) $out[$h] = td_script_needs_elementor($h, $reg);
      echo json_encode($out);`
    const r = await php.run({ code })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), expected)
  } finally { php.exit() }
})

test('หน้าที่ธีมแสดงเอง: เอาสคริปต์ Elementor ออกก่อนพิมพ์ทั้งใน head และท้ายหน้า + ตัดแท็กที่หลุด (รวมค่าตั้งต้น inline) · หน้าอื่นไม่แตะ', () => {
  const f = fnSrc('td_dequeue_elementor_scripts')
  assert.match(f, /if \(!td_elementor_free\(\)\) return;/)
  assert.match(f, /wp_dequeue_script\(/)
  assert.match(f, /td_script_needs_elementor\(/)
  assert.match(source, /add_action\('wp_print_scripts', 'td_dequeue_elementor_scripts', 1\)/)
  assert.match(source, /add_action\('wp_print_footer_scripts', 'td_dequeue_elementor_scripts', 1\)/)
  assert.match(source, /add_filter\('script_loader_tag', fn \(\$tag, \$handle\) => \(td_elementor_free\(\) && td_script_needs_elementor\(\$handle, wp_scripts\(\)->registered\)\) \? '' : \$tag, 10, 2\)/)
})

test('CSS กับสคริปต์ใช้กฎแยก Elementor ตัวเดียวกัน', () => {
  assert.match(fnSrc('td_dequeue_elementor_styles'), /td_is_elementor_asset\(/)
  assert.match(source, /add_filter\('style_loader_tag', fn \(\$tag, \$handle, \$href\) => \(td_elementor_free\(\) && td_is_elementor_asset\(\$handle, \(string\) \$href\)\) \? '' : \$tag, 10, 3\)/)
})

/* 17 พ.ย. 2026 ตรวจ staging หลัง v0.4.9: error elementorFrontendConfig ยังขึ้นในหน้าบทความ (single.php ของธีม)
   บทความทั้ง 12 เรื่องไม่ได้สร้างด้วย Elementor (_elementor_edit_mode ว่าง · เนื้อหาไม่มีคลาส elementor) แต่ Elementor Pro (เทมเพลต 2041) ยังโหลดสคริปต์
   → หน้าที่ไม่ใช้ Elementor = หน้าจากต้นแบบ + บทความที่ไม่ได้สร้างด้วย Elementor · บทความที่สร้างด้วย Elementor (builder) คงไว้ */
test('td_elementor_free: หน้าจากต้นแบบ · บทความที่ไม่ได้สร้างด้วย Elementor = true · บทความ builder / หน้าอื่น = false', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const code = `<?php
      $S = ['current' => null, 'post' => false, 'mode' => ''];
      function td_current() { global $S; return $S['current']; }
      function is_singular($t = '') { global $S; return $S['post'] && $t === 'post'; }
      function get_queried_object_id() { return 7; }
      function get_post_meta($id, $k, $single) { global $S; return $id === 7 && $k === '_elementor_edit_mode' ? $S['mode'] : ''; }
      ${fnSrc('td_elementor_free')}
      $r = [];
      $S = ['current' => ['slug' => 'home'], 'post' => false, 'mode' => '']; $r[] = td_elementor_free();
      $S = ['current' => null, 'post' => true, 'mode' => '']; $r[] = td_elementor_free();
      $S = ['current' => null, 'post' => true, 'mode' => 'builder']; $r[] = td_elementor_free();
      $S = ['current' => null, 'post' => false, 'mode' => '']; $r[] = td_elementor_free();
      echo json_encode($r);`
    const r = await php.run({ code })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), [true, true, false, false])
  } finally { php.exit() }
})
