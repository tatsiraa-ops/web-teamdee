/* 16 พ.ย. 2026 staging (ภาพอาร์ต: หน้าแรกพื้นดำ ตัวหนังสือดำหาย) · สาเหตุ: หน้า Elementor เดิม #50 มี CSS เอง
   html, body { background-color:#050505; padding:0 !important } และ Elementor โหลด CSS หน้านั้นหลังธีม → ทับพื้นขาว + ที่เว้นแถบล่างมือถือ
   แก้ที่ธีม: หน้าที่ธีมแสดงเอง (exported.php · td_current) ไม่ใช้ Elementor → ไม่ใส่ CSS ของ Elementor ทั้งใน head และท้ายหน้า */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const fnSrc = (name) => { const a = source.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let depth = 0, i = source.indexOf('{', a); for (; i < source.length; i++) { if (source[i] === '{') depth++; else if (source[i] === '}' && --depth === 0) break } return source.slice(a, i + 1) }

test('แยก CSS ของ Elementor ออกจาก CSS อื่น (ตามชื่อ handle หรือที่อยู่ไฟล์)', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const cases = [
      ['elementor-post-50', '/enterprise/wp-content/uploads/elementor/css/post-50.css', true],
      ['elementor-frontend', '/wp-content/plugins/elementor/assets/css/frontend.min.css', true],
      ['e-sticky', '/wp-content/plugins/elementor-pro/assets/css/modules/sticky.min.css', true],
      ['elementor-icons', '/wp-content/plugins/elementor/assets/lib/eicons/css/elementor-icons.min.css', true],
      ['rank-math', '/wp-content/plugins/seo-by-rank-math/assets/front/css/rank-math.css', false],
      ['admin-bar', '/wp-includes/css/admin-bar.min.css', false],
      ['dashicons', '/wp-includes/css/dashicons.min.css', false],
      ['cmplz-general', '/wp-content/plugins/complianz-gdpr/assets/css/cookieblocker.min.css', false],
    ]
    const r = await php.run({ code: `<?php ${fnSrc('td_is_elementor_asset')} echo json_encode(array_map(fn ($c) => td_is_elementor_asset($c[0], $c[1]), json_decode('${JSON.stringify(cases)}', true)));` })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), cases.map((c) => c[2]))
  } finally { php.exit() }
})

test('หน้าที่ธีมแสดงเอง: เอา CSS ของ Elementor ออกก่อนพิมพ์ทั้งใน head และท้ายหน้า · หน้าอื่นไม่แตะ', () => {
  const f = fnSrc('td_dequeue_elementor_styles')
  assert.match(f, /if \(!td_current\(\)\) return;/)
  assert.match(f, /wp_dequeue_style\(/)
  assert.match(source, /add_action\('wp_print_styles', 'td_dequeue_elementor_styles', 1\)/)
  assert.match(source, /add_action\('wp_print_footer_scripts', 'td_dequeue_elementor_styles', 1\)/)
  assert.match(source, /add_filter\('style_loader_tag', fn \(\$tag, \$handle, \$href\) => \(td_current\(\) && td_is_elementor_asset\(\$handle, \(string\) \$href\)\) \? '' : \$tag, 10, 3\)/)
})
