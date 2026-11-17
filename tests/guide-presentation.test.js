import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { guideView } from '../src/js/guide-view.js'
import { guidePresentation } from '../src/js/guide-presentation.js'
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const guides = read('../src/data/guides.json')
const pages = read('../src/data/guide-pages.json')
for (const forWp of [true, false]) {
  test(`guide presentation preserves content and only links existing sections (${forWp ? 'WP' : 'preview'})`, () => {
    for (const item of guides) {
      const before = guideView(item, pages[item.id], { forWp })
      const after = guidePresentation(before, guides)
      assert.deepEqual(after.sections, before.sections)
      assert.equal(after.h1, before.h1)
      assert.equal(after.hidden, before.hidden)
      /* 17 พ.ย. 2026: คู่มือทรงคอเปิดแล้ว (ย้ายจาก Elementor) → 8 เล่ม */
      assert.equal(after.guideNav.length, 8)
      assert.ok(after.quickLinks.every(q => after.sections.some(s => s.id === q.id)))
      assert.ok(after.quickLinks.length >= 2, item.id)
    }
  })
}
