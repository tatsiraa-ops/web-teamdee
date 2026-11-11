import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { gallerySelection } from '../src/js/gallery-selection.js'
import { isExported } from '../scripts/seo-check.mjs'
import Handlebars from 'handlebars'
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const designs = JSON.parse(read('src/data/designs.json'))

test('empty galleries have existing-image suggestions without altering actual customer tags', () => {
  const original = JSON.stringify(designs)
  for (const id of ['shop', 'class', 'faculty']) {
    const selection = gallerySelection(designs, id)
    assert.equal(selection.inspiration, true)
    assert.equal(selection.items.length, 4)
    for (const d of selection.items) assert.ok(existsSync(new URL('../public' + d.img, import.meta.url)))
    const actual = [designs[0]]
    assert.deepEqual(gallerySelection(designs, id, actual), { items: actual, inspiration: false })
  }
  assert.equal(JSON.stringify(designs), original)
})

test('every catalog design has a noindex local detail preview excluded from WordPress', () => {
  for (const d of designs) {
    const route = `/design-preview/${d.code.toLowerCase()}/`
    assert.equal(isExported(route), false)
    assert.match(read('site' + route + 'index.html'), /name="robots" content="noindex"/)
  }
  assert.equal(isExported('/ui/readiness/'), false)
  assert.equal(isExported('/corporate/'), true)
})

test('unapproved size numbers remain in local draft but never in production size block', () => {
  const h = Handlebars.create()
  h.registerHelper('eq', (a,b) => a === b)
  const render = h.compile(read('src/partials/guideBlock.hbs'))
  const sizing = JSON.parse(read('src/data/sizing.json'))
  const local = render({kind:'sizes', sizing})
  const wp = render({kind:'sizes', sizing, wp:true, sizeDraftHidden:true})
  assert.match(local, /<td>34<\/td>/)
  assert.doesNotMatch(wp, /<table|<td>/)
  assert.match(wp, /ทักแอดมินเพื่อขอตารางไซซ์ล่าสุด/)
  assert.doesNotMatch(wp, /รอยืนยัน/)
})

test('draft articles do not make up a modification date or canonical article identity', () => {
  const s = read('src/partials/articlePage.hbs')
  assert.doesNotMatch(s, /dateModified.*2026-10-01/)
  assert.match(s, /unless articleDraft/)
  assert.match(s, /mainEntityOfPage.*articleHref/)
})
