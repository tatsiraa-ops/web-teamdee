/* ทุกหน้าต้องมีป้ายคุกกี้ ตัวโหลดคลิป และป๊อปอัป (26 ต.ค. 2026: หน้าแรกกับหน้ารู้จักทีมดีใช้ script ของตัวเอง เคยหลุด) */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : f.endsWith('.html') ? [p] : [] })
const entries = [...new Set(walk(join(root, 'site')).flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/src="\/(src\/js\/[\w-]+\.js)"/g)].map((m) => m[1])))]

test('script หลักทุกตัวของหน้าที่มี footer เรียก initSiteExtras (ตรงๆ หรือผ่าน page.js)', () => {
  const miss = entries.filter((e) => e !== 'src/js/ui.js').filter((e) => {
    const s = readFileSync(join(root, e), 'utf8')
    return !s.includes("'./page.js'") && !/initSiteExtras/.test(s)
  })
  assert.deepEqual(miss, [])
  assert.match(readFileSync(join(root, 'src/js/page.js'), 'utf8'), /initSiteExtras\(\)/)
})
