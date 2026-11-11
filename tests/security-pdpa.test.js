/* ตรวจ security / PDPA (audit 30 ต.ค. · docs/audit/2026-10-30-full-audit.md หมวด Security / PDPA)
   ส่วนแรกอ่านไฟล์ตรงๆ (รันทุกครั้ง) · ส่วน PHP รันฟังก์ชันจริงใน PHP-WASM เมื่อมี PHP_WASM_MODULES (แบบเดียวกับ wp-article-php.test.js) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const contact = read('site/contact-us/index.html')
const php = read('wp-theme/teamdee/functions.php')

test('ฟอร์มติดต่อ: ไม่มี JS ก็ส่งแบบ POST เข้า admin-post.php (ไม่หลุดข้อมูลลง URL) · action ตรงกับ hook ของธีม', () => {
  const form = contact.match(/<form id="contactForm"[^>]*>/)[0]
  assert.match(form, /method="post"/)
  assert.match(form, /action="\/wp-admin\/admin-post\.php"/)
  assert.match(contact, /<input type="hidden" name="action" value="td_contact">/)
  assert.match(contact, /<input type="hidden" name="td_nojs" value="1">/)
  assert.match(php, /add_action\('admin_post_nopriv_td_contact', 'td_contact_handle'\)/)
  /* ธีมแทน action ด้วย admin_url() จริงตอนแสดงหน้า */
  assert.match(php, /str_replace\('action="\/wp-admin\/admin-post\.php"', 'action="' \. esc_url\(admin_url\('admin-post\.php'\)\)/)
})

test('ฟอร์มติดต่อ: maxlength ตรงกับที่ธีมตัด (200 · รายละเอียด 3000) · บอกว่าเสื้อสกรีนเริ่ม 1 ตัว', () => {
  for (const id of ['cName', 'cTel', 'cOrg', 'cMail', 'cOrder']) assert.match(contact, new RegExp(`id="${id}"[^>]*maxlength="200"`), id)
  assert.match(contact, /<textarea[^>]*id="cNote"[^>]*maxlength="3000"/)
  assert.match(php, /0, \$long \? 3000 : 200\)/)
  assert.match(contact, /ขั้นต่ำ 10 ตัว \(เสื้อสกรีนเริ่ม 1 ตัว\)/)
})

test('ธีม: security headers ผ่าน send_headers · Reply-To ไม่ต่อชื่อดิบ · หน้าขอบคุณไม่รับ //host', () => {
  const block = php.slice(php.indexOf("add_action('send_headers'"))
  for (const h of ["'X-Content-Type-Options' => 'nosniff'", "'Referrer-Policy' => 'strict-origin-when-cross-origin'", "'X-Frame-Options' => 'SAMEORIGIN'"]) assert.ok(block.includes(h), h)
  assert.doesNotMatch(php, /'Reply-To: ' \. \$name/)
  assert.match(php, /'sanitize_callback' => 'td_thanks_path'/)
  assert.match(php, /'thanks' => td_form_thanks\(\)/)
})

/* ---------- PHP จริง ---------- */
const runtime = process.env.PHP_WASM_MODULES
/** ตัดฟังก์ชัน / ค่าคงที่ออกมาจาก functions.php ทีละตัว */
const fn = (name) => {
  const a = php.indexOf(`function ${name}(`)
  assert.ok(a >= 0, name)
  return php.slice(a, php.indexOf('\n}\n', a) + 3)
}
const constBlock = (name) => {
  const a = php.indexOf(`const ${name} = [`)
  return php.slice(a, php.indexOf('];\n', a) + 3)
}
const STUBS = `
function apply_filters($n, $v) { return $GLOBALS['filters'][$n] ?? $v; }
function wp_parse_url($u, $c = -1) { return parse_url($u, $c); }
function wp_unslash($v) { return $v; }
function sanitize_key($v) { return preg_replace('/[^a-z0-9_\\-]/', '', strtolower($v)); }
function esc_html($v) { return htmlspecialchars($v, ENT_QUOTES); }
function esc_url($v) { return $v; }
function admin_url($p) { return 'https://teamdee.co.th/wp/wp-admin/' . $p; }
function get_transient($k) { return $k === 'td_sent_Tok3n' ? 1 : false; }
function get_option($k, $d) { return $GLOBALS['opt'][$k] ?? $d; }
`

test('PHP: ไวยากรณ์ functions.php ผ่าน + ตัวช่วยฟอร์มติดต่อทำงานตามที่ตั้งใจ', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const p = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    p.writeFile('/lint.php', php)
    const lint = await p.run({ code: '<?php try { token_get_all(file_get_contents("/lint.php"), TOKEN_PARSE); echo "valid"; } catch (ParseError $e) { echo $e->getMessage(); }' })
    assert.equal(lint.text, 'valid')

    const lib = [STUBS, constBlock('TD_CF_RANGES'), ...['td_ip_in', 'td_client_ip', 'td_rate_bucket', 'td_same_site', 'td_reply_name', 'td_thanks_path', 'td_form_thanks', 'td_body_live', 'td_nojs_fail'].map(fn)].join('\n')
    const run = async (body) => {
      const r = await p.run({ code: `<?php ${lib}\n${body}` })
      assert.equal(r.errors, '')
      return JSON.parse(r.text)
    }

    /* IP ลูกค้า: เชื่อ CF-Connecting-IP เฉพาะตอน REMOTE_ADDR เป็นของ Cloudflare */
    const ip = await run(`
      $o = [];
      $_SERVER = ['REMOTE_ADDR' => '172.70.1.2', 'HTTP_CF_CONNECTING_IP' => '1.2.3.4']; $o[] = td_client_ip();
      $_SERVER = ['REMOTE_ADDR' => '9.9.9.9', 'HTTP_CF_CONNECTING_IP' => '1.2.3.4']; $o[] = td_client_ip();
      $_SERVER = ['REMOTE_ADDR' => '2606:4700:10::1', 'HTTP_CF_CONNECTING_IP' => '2001:db8:1:2:aaaa::1']; $o[] = td_client_ip();
      $_SERVER = ['REMOTE_ADDR' => '172.70.1.2', 'HTTP_CF_CONNECTING_IP' => 'not-an-ip']; $o[] = td_client_ip();
      $GLOBALS['filters']['teamdee_client_ip'] = '5.6.7.8'; $_SERVER = ['REMOTE_ADDR' => '10.0.0.1']; $o[] = td_client_ip(); unset($GLOBALS['filters']);
      echo json_encode($o);`)
    assert.deepEqual(ip, ['1.2.3.4', '9.9.9.9', '2001:db8:1:2:aaaa::1', '172.70.1.2', '5.6.7.8'])

    const cidr = await run(`echo json_encode([td_ip_in('104.16.5.5', '104.16.0.0/13'), td_ip_in('104.24.0.1', '104.16.0.0/13'), td_ip_in('2a06:98c7::1', '2a06:98c0::/29'), td_ip_in('2a06:98c8::1', '2a06:98c0::/29'), td_ip_in('1.2.3.4', '2606:4700::/32')]);`)
    assert.deepEqual(cidr, [true, false, true, false, false])

    /* IPv6 นับทั้ง /64 · IPv4 นับรายตัว */
    const b = await run(`echo json_encode([td_rate_bucket('2001:db8:1:2::1'), td_rate_bucket('2001:db8:1:2:ffff::9'), td_rate_bucket('2001:db8:1:3::1'), td_rate_bucket('1.2.3.4'), td_rate_bucket('::ffff:1.2.3.4')]);`)
    assert.equal(b[0], b[1])
    assert.notEqual(b[0], b[2])
    assert.equal(b[3], '1.2.3.4')
    assert.equal(b[4], '1.2.3.4')

    /* Origin / Referer ต้องเป็นเว็บเรา */
    const same = await run(`$h = 'https://teamdee.co.th/'; echo json_encode([
      td_same_site('https://teamdee.co.th', null, $h), td_same_site('https://evil.example', 'https://teamdee.co.th/contact-us/', $h),
      td_same_site(null, 'https://teamdee.co.th/contact-us/', $h), td_same_site('null', 'https://teamdee.co.th/x', $h),
      td_same_site(null, null, $h), td_same_site('https://teamdee.co.th.evil.example', null, $h), td_same_site('https://TEAMDEE.co.th', null, $h)]);`)
    assert.deepEqual(same, [true, false, true, true, false, false, true])

    /* ชื่อใน Reply-To ไม่มีตัวแยกที่อยู่ */
    const rn = await run(`echo json_encode([td_reply_name('สมชาย "ใจดี", <x@evil.com>; a\\\\b'), td_reply_name('Somchai')]);`)
    assert.doesNotMatch(rn[0], /[",;<>\\]/)
    assert.equal(rn[1], 'Somchai')

    /* หน้าขอบคุณ: ต้องขึ้นต้น / ตัวเดียว · ค่าที่บันทึกไว้ก่อนแก้ก็ถูกกรอง */
    const th = await run(`$GLOBALS['opt'] = ['teamdee_form_thanks' => '//evil.example/x']; echo json_encode([td_thanks_path('/thank-you/'), td_thanks_path('//evil.example'), td_thanks_path('https://evil.example'), td_thanks_path('/a/b_c-d/'), td_form_thanks()]);`)
    assert.deepEqual(th, ['/thank-you/', '/thank-you/', '/thank-you/', '/a/b_c-d/', '/thank-you/'])

    /* หน้าที่แสดง: action ฟอร์มเป็น admin_url · ส่งไม่มี JS แล้วพลาด = กล่องแจ้ง · token จริงเท่านั้นที่ขึ้นว่าได้รับแล้ว */
    const page = await run(`
      $form = '<form id="contactForm" class="cf-form" method="post" action="/wp-admin/admin-post.php" novalidate>';
      $ty = '<span aria-current="page" id="tyCrumb">ยังไม่ได้ส่งข้อมูล</span><h1 id="tyHeading" class="t">ยังไม่มีข้อมูลยืนยันการส่งฟอร์ม</h1><p id="tyLead" class="x">หากยังไม่ได้ส่ง</p><a id="tyContact" class="btn" href="/c/">ไป</a><h2 id="wait-h" class="t">เตรียม</h2>';
      $o = [td_body_live($form)];
      $_GET = ['sent' => '0', 'why' => 'limit']; $o[] = td_body_live($form);
      $_GET = ['sent' => 'Tok3n']; $o[] = td_body_live($ty);
      $_GET = ['sent' => 'guess']; $o[] = td_body_live($ty);
      echo json_encode($o);`)
    assert.match(page[0], /action="https:\/\/teamdee\.co\.th\/wp\/wp-admin\/admin-post\.php"/)
    assert.match(page[1], /<div class="cf-fail" role="alert" id="formNoJs">.*ส่งถี่เกินไป.*<\/div><form id="contactForm"/)
    assert.match(page[2], /<h1 id="tyHeading" class="t">ทีมดีได้รับข้อมูลของคุณแล้ว<\/h1>/)
    assert.match(page[2], /id="tyCrumb">ส่งข้อมูลแล้ว</)
    assert.match(page[2], /<a hidden id="tyContact"/)
    assert.match(page[3], /ยังไม่มีข้อมูลยืนยันการส่งฟอร์ม/)
  } finally { p.exit() }
})
