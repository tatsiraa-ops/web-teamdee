/* 16 พ.ย. 2026 ตรวจ staging (https://team-dee.com/enterprise/ · มี Rank Math): หน้าที่ต้นแบบมีแต่ WordPress ไม่มี Page รองรับ
   (/faq/ /custom-class-shirts/ ฯลฯ ราว 27 หน้า) แสดงเนื้อหาถูก แต่หัวเว็บเป็น "Page Not Found" + noindex ไม่มี description/canonical
   สาเหตุ: ธีมปล่อยให้ WordPress ตั้ง 404 ก่อน แล้วค่อยพลิกใน template_include → Rank Math ตัดสินว่าเป็น 404 ไปแล้ว
   แก้: กัน 404 ตั้งแต่ pre_handle_404 + ส่ง title/description/canonical/robots ของ pages.json ให้ Rank Math (เฉพาะหน้าที่ไม่มี Page) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const START = '/* ---------- หน้าที่ต้นแบบมี แต่ WordPress ไม่มี Page ---------- */'

test('มีบล็อกจัดการหน้าที่ไม่มี Page และ template_include รับหน้าแบบนี้', () => {
  assert.ok(source.includes(START))
  assert.match(source, /add_filter\('pre_handle_404'/)
  assert.match(source, /td_fallback/)
})

test('Rank Math ได้ title/description/canonical/robots จริงของหน้าที่ไม่มี Page · หน้าที่มี Page ไม่แตะ', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  const a = source.indexOf(START)
  const block = source.slice(a, source.indexOf('/* ---------- ', a + START.length))
  const stubs = `
    $GLOBALS['F'] = [];
    function add_filter($h, $cb, $p = 10, $n = 1) { $GLOBALS['F'][$h][] = $cb; } function add_action($h, $cb, $p = 10, $n = 1) {}
    function apply($h, ...$args) { foreach ($GLOBALS['F'][$h] ?? [] as $cb) $args[0] = $cb(...$args); return $args[0]; }
    function is_admin() { return false; }
    function status_header($c) { $GLOBALS['status'] = $c; }
    function home_url($p = '') { return 'https://team-dee.com' . $p; }
    function get_option($k) { return $GLOBALS['blog_public'] ?? '1'; }
    function td_page($r = null) { return ['route' => '/faq/', 'slug' => 'faq', 'title' => 'คำถามที่พบบ่อย | TEAMDEE', 'description' => 'รวมคำตอบ', 'robots' => 'index,follow']; }
    function td_current() { return $GLOBALS['td_current'] ?? null; }
    class Q { public $posts; function __construct($p) { $this->posts = $p; } function is_main_query() { return true; } }
  `
  const code = `<?php ${stubs} ${block}
    $out = [];
    $out['real_page'] = apply('pre_handle_404', false, new Q([1]));
    $out['real_title'] = apply('rank_math/frontend/title', 'ชื่อจาก Rank Math');
    $out['missing'] = apply('pre_handle_404', false, new Q([]));
    $GLOBALS['td_current'] = td_page();
    $out['status'] = $GLOBALS['status'] ?? null;
    $out['title'] = apply('rank_math/frontend/title', 'Page Not Found - TEAMDEE');
    $out['desc'] = apply('rank_math/frontend/description', '');
    $out['canonical'] = apply('rank_math/frontend/canonical', '');
    $out['robots'] = apply('rank_math/frontend/robots', ['index' => 'noindex', 'follow' => 'nofollow']);
    $GLOBALS['blog_public'] = '0';
    $out['robots_staging'] = apply('rank_math/frontend/robots', ['index' => 'noindex', 'follow' => 'nofollow']);
    echo json_encode($out, JSON_UNESCAPED_UNICODE);`
  try {
    const r = await php.run({ code })
    assert.equal(r.errors, '')
    const o = JSON.parse(r.text)
    assert.equal(o.real_page, false, 'หน้าที่ WordPress มีจริง ไม่แตะการตัดสิน 404')
    assert.equal(o.real_title, 'ชื่อจาก Rank Math', 'หน้าที่มี Page ใช้ title ของ Rank Math เดิม')
    assert.equal(o.missing, true, 'หน้าที่ไม่มี Page ไม่ถูกตั้งเป็น 404')
    assert.equal(o.status, 200)
    assert.equal(o.title, 'คำถามที่พบบ่อย | TEAMDEE')
    assert.equal(o.desc, 'รวมคำตอบ')
    assert.equal(o.canonical, 'https://team-dee.com/faq/')
    assert.deepEqual(o.robots, { index: 'index', follow: 'follow' })
    assert.deepEqual(o.robots_staging, { index: 'noindex', follow: 'nofollow' }, 'staging ที่ปิดไม่ให้ Google เก็บ ยังเป็น noindex')
  } finally { php.exit() }
})
