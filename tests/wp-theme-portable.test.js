/* 16 พ.ย. 2026 ทีมโฮสต์ลงธีมบน staging https://team-dee.com/enterprise/ (WordPress ในโฟลเดอร์ย่อย) แล้ว CSS ไม่ขึ้น
   สาเหตุ: HTML ที่ export ฝัง path ไฟล์เป็น /wp-content/themes/teamdee/build/... (เขียนไว้ว่า WordPress อยู่ที่ราก)
   → บน /enterprise/ เบราว์เซอร์ไปโหลดจากเว็บจริง (ธีม Astra) ไม่เจอไฟล์ · ชื่อโฟลเดอร์ธีมไม่ใช่ teamdee ก็พังแบบเดียวกัน
   แก้: functions.php เปลี่ยน path ตอนส่งหน้าให้ชี้โฟลเดอร์ธีมที่ติดตั้งจริง (ราก + ชื่อ teamdee = ไม่แตะอะไรเลย)
   · CSS ชี้ฟอนต์แบบ relative (อยู่โฟลเดอร์ assets เดียวกัน) จึงไม่ขึ้นกับที่ติดตั้ง */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const fnSrc = (name) => { const a = source.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let depth = 0, i = source.indexOf('{', a); for (; i < source.length; i++) { if (source[i] === '{') depth++; else if (source[i] === '}' && --depth === 0) break } return source.slice(a, i + 1) }

test('ธีมย้ายโฟลเดอร์ได้: path ไฟล์ชี้ไปโฟลเดอร์ธีมที่ติดตั้งจริง · ติดตั้งที่ราก = HTML เดิมทุกตัวอักษร', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const html = '<link rel="stylesheet" href="/wp-content/themes/teamdee/build/assets/a.css"><img src="/wp-content/themes/teamdee/build/img/x.webp" srcset="/wp-content/themes/teamdee/build/img/x-540.webp 540w"><a href="/corporate/">'
    php.writeFile('/in.html', html)
    const run = async (uri) => (await php.run({ code: `<?php function get_template_directory_uri(){ return '${uri}'; } function wp_parse_url($u,$c=-1){ return parse_url($u,$c); } ${fnSrc('td_portable_paths')} echo td_portable_paths(file_get_contents('/in.html'));` }))
    const root = await run('https://team-dee.com/wp-content/themes/teamdee')
    assert.equal(root.errors, ''); assert.equal(root.text, html, 'ราก + ชื่อ teamdee ไม่เปลี่ยนอะไร')
    const sub = await run('https://team-dee.com/enterprise/wp-content/themes/teamdee')
    assert.equal(sub.text, html.replaceAll('/wp-content/themes/teamdee/build/', '/enterprise/wp-content/themes/teamdee/build/'))
    assert.match(sub.text, /<a href="\/corporate\/">/, 'ลิงก์หน้าไม่แตะ')
    const renamed = await run('https://example.test/wp-content/themes/teamdee-final')
    assert.ok(!renamed.text.includes('/themes/teamdee/build/') && renamed.text.includes('/wp-content/themes/teamdee-final/build/img/x.webp'))
  } finally { php.exit() }
})

test('td_read_part ส่งทั้ง head และ body ผ่าน td_portable_paths', () => {
  assert.match(fnSrc('td_read_part'), /td_portable_paths\(/)
})

test('CSS ใน build ชี้ฟอนต์แบบ relative ไม่ฝังโฟลเดอร์ธีม', () => {
  const dir = new URL('../wp-theme/teamdee/build/assets/', import.meta.url)
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.css'))) assert.doesNotMatch(readFileSync(new URL(f, dir), 'utf8'), /\/wp-content\/themes\//, f)
})
