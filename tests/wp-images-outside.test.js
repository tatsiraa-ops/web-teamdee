/* 16 พ.ย. 2026 C1 ระยะ 1: รูปอยู่นอกธีม (wp-content/uploads/teamdee/img) · ธีมเล็ก อัปโหลดผ่านหลังบ้านได้
   - export: ธีมไม่มีโฟลเดอร์ img · รูปไปอยู่ wp-theme/uploads/teamdee/img (ใช้กับ WordPress ในเครื่อง + แพ็กเป็น zip รูป)
   - ธีมมีรายการรูปที่หน้าเว็บต้องใช้ (build/img-manifest.json) → หลังบ้านเตือนเมื่อรูปบนเซิร์ฟเวอร์ไม่ครบ (ลืมวางชุดรูปเพิ่ม)
   - รูปใหม่ตั้งแต่ Release ก่อน = ไฟล์ใน public/img ที่เพิ่ม/แก้ใน git ตั้งแต่ tag ก่อน (imagesFromGitDiff) */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { imagesFromGitDiff } from '../scripts/pack-release.mjs'

const runtime = process.env.PHP_WASM_MODULES
const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
const fnSrc = (name) => { const a = source.indexOf(`function ${name}(`); assert.ok(a >= 0, name); let depth = 0, i = source.indexOf('{', a); for (; i < source.length; i++) { if (source[i] === '{') depth++; else if (source[i] === '}' && --depth === 0) break } return source.slice(a, i + 1) }
const build = new URL('../wp-theme/teamdee/build/', import.meta.url)

test('รูปใหม่ตั้งแต่ Release ก่อน: เอาเฉพาะไฟล์รูปใน public/img ที่เพิ่ม แก้ หรือเปลี่ยนชื่อ · ไม่เอาที่ลบ', () => {
  const out = imagesFromGitDiff('A\tpublic/img/a/x.webp\nM\tpublic/img/b.webp\nD\tpublic/img/gone.webp\nR087\tpublic/img/old.webp\tpublic/img/new.webp\nM\tsrc/data/x.json\nA\tpublic/img/.DS_Store\n')
  assert.deepEqual(out, ['a/x.webp', 'b.webp', 'new.webp'])
  assert.deepEqual(imagesFromGitDiff(''), [])
})

test('export: ธีมไม่มีโฟลเดอร์รูปแล้ว · รูปอยู่ wp-theme/uploads/teamdee/img · มีรายการรูปในธีม', { skip: !existsSync(new URL('pages.json', build)) }, () => {
  assert.ok(!existsSync(new URL('img', build)), 'ธีมไม่มี build/img')
  const man = JSON.parse(readFileSync(new URL('img-manifest.json', build), 'utf8'))
  assert.ok(man.files.length > 1000, `รายการรูป ${man.files.length}`)
  assert.ok(man.files.every((f) => !f.startsWith('/') && !f.includes('..')), 'path ภายในโฟลเดอร์ img')
  for (const f of man.files.slice(0, 50)) assert.ok(existsSync(new URL(`../wp-theme/uploads/teamdee/img/${f}`, import.meta.url)), f)
  const home = readFileSync(new URL('pages/home.body.html', build), 'utf8')
  assert.match(home, /src="\/wp-content\/uploads\/teamdee\/img\//)
  assert.doesNotMatch(home, /\/wp-content\/themes\/teamdee\/build\/img\//)
})

test('ทุกรูปที่หน้าเว็บเรียกอยู่ในรายการรูป (ไม่มีรูปแตกบนเซิร์ฟเวอร์ถ้าวางรูปครบตามรายการ)', { skip: !existsSync(new URL('pages.json', build)) }, () => {
  const man = new Set(JSON.parse(readFileSync(new URL('img-manifest.json', build), 'utf8')).files)
  const missing = new Set()
  for (const f of readdirSync(new URL('pages/', build))) {
    const h = readFileSync(new URL(`pages/${f}`, build), 'utf8')
    for (const m of h.matchAll(/\/wp-content\/uploads\/teamdee\/img\/([^"'\s,)?#]+)/g)) if (!man.has(decodeURIComponent(m[1]))) missing.add(m[1])
  }
  assert.deepEqual([...missing].slice(0, 10), [])
})

test('ย้ายโฟลเดอร์ได้: path รูปชี้ uploads ที่ติดตั้งจริง · ติดตั้งที่รากไม่เปลี่ยนอะไร', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    const html = '<link href="/wp-content/themes/teamdee/build/assets/a.css"><img src="/wp-content/uploads/teamdee/img/x.webp" srcset="/wp-content/uploads/teamdee/img/x-540.webp 540w">'
    php.writeFile('/in.html', html)
    const run = async (theme, up) => (await php.run({ code: `<?php function get_template_directory_uri(){ return '${theme}'; } function wp_upload_dir(){ return ['baseurl' => '${up}']; } function wp_parse_url($u,$c=-1){ return parse_url($u,$c); } ${fnSrc('td_portable_paths')} echo td_portable_paths(file_get_contents('/in.html'));` }))
    const root = await run('https://team-dee.com/wp-content/themes/teamdee', 'https://team-dee.com/wp-content/uploads')
    assert.equal(root.errors, ''); assert.equal(root.text, html)
    const sub = await run('https://team-dee.com/enterprise/wp-content/themes/teamdee', 'https://team-dee.com/enterprise/wp-content/uploads')
    assert.equal(sub.text, html.replaceAll('/wp-content/', '/enterprise/wp-content/'))
  } finally { php.exit() }
})

test('หลังบ้านเตือนเมื่อรูปบนเซิร์ฟเวอร์ไม่ครบ: นับรูปที่หายจากรายการ', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    php.mkdir('/up/teamdee/img/a'); php.writeFile('/up/teamdee/img/a/x.webp', 'x'); php.writeFile('/man.json', JSON.stringify({ files: ['a/x.webp', 'a/y.webp', 'b.webp'] }))
    const r = await php.run({ code: `<?php ${fnSrc('td_missing_images')} echo json_encode(td_missing_images('/man.json', '/up/teamdee/img'));` })
    assert.equal(r.errors, '')
    assert.deepEqual(JSON.parse(r.text), { total: 3, missing: 2, sample: ['a/y.webp', 'b.webp'] })
  } finally { php.exit() }
})

test('functions.php: เตือนในหลังบ้านเฉพาะแอดมิน · ผลนับเก็บแคชไว้ ไม่ตรวจทุกหน้า', () => {
  assert.match(source, /add_action\('admin_notices'/)
  assert.match(source, /current_user_can\('manage_options'\)/)
  assert.match(source, /get_transient\('td_img_check'\)/)
})
