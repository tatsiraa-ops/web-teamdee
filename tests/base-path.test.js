/* 16 พ.ย. 2026 อาร์ต "เราต้องเปลี่ยน / ในแต่ละหน้าด้วยมั้ย มันยังไปที่หน้าเดิมๆในเว็บเก่า" (staging อยู่ team-dee.com/enterprise/)
   ลิงก์ในต้นแบบเป็น /sublimation/ (เริ่มจากรากโดเมน) → บน staging พาไปเว็บเก่า · เว็บจริงที่อยู่ที่รากไม่มีปัญหา
   แก้: ธีมเติม path โฟลเดอร์ย่อยหน้าลิงก์ตอนส่งหน้า (functions.php td_portable_links) + บอก JS ผ่าน <meta name="td-base">
   JS ที่สร้างลิงก์เองใช้ src/js/base-path.js (withBase / stripBase) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { basePath, withBase, stripBase } from '../src/js/base-path.js'
import { outcomeOf, prefillFor, contextFromPath } from '../src/js/contact-send.js'

const fakeDoc = (content) => ({ querySelector: (s) => (s === 'meta[name="td-base"]' && content != null ? { content } : null) })

test('basePath อ่านจาก <meta name="td-base"> · ไม่มี meta (เว็บที่ราก) = ว่าง', () => {
  assert.equal(basePath(fakeDoc('/enterprise')), '/enterprise')
  assert.equal(basePath(fakeDoc('/enterprise/')), '/enterprise')
  assert.equal(basePath(fakeDoc(null)), '')
  assert.equal(basePath(undefined), '')
})

test('withBase: เติมหน้าลิงก์ภายใน · ไม่แตะลิงก์นอก ลิงก์ที่มีแล้ว และเว็บที่ราก', () => {
  assert.equal(withBase('/thank-you/', '/enterprise'), '/enterprise/thank-you/')
  assert.equal(withBase('/', '/enterprise'), '/enterprise/')
  assert.equal(withBase('/enterprise/a/', '/enterprise'), '/enterprise/a/')
  assert.equal(withBase('//cdn.example/x', '/enterprise'), '//cdn.example/x')
  assert.equal(withBase('https://line.me/x', '/enterprise'), 'https://line.me/x')
  assert.equal(withBase('/thank-you/', ''), '/thank-you/')
})

test('stripBase: ตัด path โฟลเดอร์ย่อยออกก่อนเทียบกับ routes', () => {
  assert.equal(stripBase('/enterprise/calculations/', '/enterprise'), '/calculations/')
  assert.equal(stripBase('/enterprise', '/enterprise'), '/')
  assert.equal(stripBase('/enterprisex/a/', '/enterprise'), '/enterprisex/a/')
  assert.equal(stripBase('/calculations/', ''), '/calculations/')
})

test('ฟอร์มติดต่อบน staging: ส่งสำเร็จไปหน้าขอบคุณในโฟลเดอร์ย่อย · หน้าที่มาจากยังเติมข้อมูลถูก', () => {
  const had = globalThis.document
  globalThis.document = fakeDoc('/enterprise')
  try {
    assert.deepEqual(outcomeOf({ ok: true }), { view: 'thanks', to: '/enterprise/thank-you/' })
    assert.equal(prefillFor({ from: '/enterprise/calculations/?k=print' }).openOrg, true)
    assert.equal(contextFromPath('/enterprise/sublimation/', { products: { print: '/sublimation/' } }).product, 'print')
  } finally { globalThis.document = had }
  assert.deepEqual(outcomeOf({ ok: true }), { view: 'thanks', to: '/thank-you/' }, 'เว็บที่รากเหมือนเดิม')
})

test('JS ที่สร้างลิงก์เองใช้ withBase: ปุ่มเครื่องคำนวณหน้าแรก · ลิงก์ขอราคาในกล่องดูรูป', () => {
  assert.match(readFileSync(new URL('../src/js/home-picker.js', import.meta.url), 'utf8'), /calc\.href = withBase\(url\('calculations'\) \+ p\.calcQuery\)/)
  assert.match(readFileSync(new URL('../src/js/lightbox.js', import.meta.url), 'utf8'), /dlg\.dataset\.contactUrl \|\| withBase\('\/contact-us\/'\)/)
})

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const fnSrc = (name) => { const a = source.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let depth = 0, i = source.indexOf('{', a); for (; i < source.length; i++) { if (source[i] === '{') depth++; else if (source[i] === '}' && --depth === 0) break } return source.slice(a, i + 1) }

test('ธีมเติม path โฟลเดอร์ย่อยหน้าลิงก์ในหน้า · ติดตั้งที่ราก = HTML เดิมทุกตัวอักษร', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const html = '<a href="/corporate/">a</a><a href="/">h</a><a href="#x">x</a><a href="https://line.me/x">l</a><a href="//cdn.example/y">c</a>'
      + '<form action="/wp-admin/admin-post.php"></form><img src="/wp-content/uploads/teamdee/img/a.webp"><link href="/wp-content/themes/teamdee/build/assets/a.css">'
      + '<a href="/contact-us/?from=x">q</a><script type="application/json">[{"u":"/faq/","t":"x"}]</script>'
    php.writeFile('/in.html', html)
    const run = async (home) => (await php.run({ code: `<?php function home_url($p = ''){ return '${home}' . ltrim($p, '/'); } function wp_parse_url($u,$c=-1){ return parse_url($u,$c); } ${fnSrc('td_base_path')} ${fnSrc('td_portable_links')} echo td_portable_links(file_get_contents('/in.html'));` }))
    const root = await run('https://team-dee.com/')
    assert.equal(root.errors, ''); assert.equal(root.text, html, 'ที่รากไม่เปลี่ยนอะไร')
    const sub = (await run('https://team-dee.com/enterprise/')).text
    assert.match(sub, /<a href="\/enterprise\/corporate\/">/)
    assert.match(sub, /<a href="\/enterprise\/">h/)
    assert.match(sub, /<a href="\/enterprise\/contact-us\/\?from=x">/)
    assert.match(sub, /"u":"\/enterprise\/faq\/"/)
    for (const keep of ['href="#x"', 'href="https://line.me/x"', 'href="//cdn.example/y"', 'action="/wp-admin/admin-post.php"', 'src="/wp-content/uploads/teamdee/img/a.webp"', 'href="/wp-content/themes/teamdee/build/assets/a.css"']) assert.ok(sub.includes(keep), keep)
  } finally { php.exit() }
})

test('td_read_part เติมลิงก์ก่อนแก้ path ไฟล์ (ไม่งั้นไฟล์ได้ /enterprise ซ้ำสองชั้น) · head มี meta td-base เฉพาะตอนอยู่ในโฟลเดอร์ย่อย', () => {
  assert.match(fnSrc('td_read_part'), /td_portable_paths\(td_portable_links\(/)
  assert.match(source, /if \(\(\$base = td_base_path\(\)\) !== ''\) printf\("<meta name=\\"td-base\\" content=\\"%s\\">\\n", esc_attr\(\$base\)\);/)
})

test('บทความใหม่บน /blog/: เทียบลิงก์ด้วย path เดียวกับที่เติมแล้ว (ไม่งั้นบน staging บทความเดิมทุกเรื่องขึ้นซ้ำในส่วนใหม่ล่าสุด)', () => {
  assert.match(source, /'key' => td_base_path\(\) \. '\/' \. \$p->post_name \. '\/'/)
})
