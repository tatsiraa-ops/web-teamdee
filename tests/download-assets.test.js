import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
const read = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'))
const designs = read('src/data/designs.json')
const assets = read('src/data/download-designs.json')
const source = read('handoff/download-designs/sources.json')
test('download assets retain provenance and omit the excluded Thai-pattern group', () => {
  for (const a of source.assets) {
    assert.ok(!a.source.includes('/รวมลาย/'))
    assert.ok(existsSync(new URL('../public' + a.img, import.meta.url)), a.img)
    assert.ok(existsSync(new URL('../public' + a.imgSmall, import.meta.url)), a.imgSmall)
  }
  assert.equal(new Set(designs.map(d => d.code)).size, designs.length)
  assert.equal(new Set(source.assets.map(a => a.sha256)).size, source.assets.length)
})
test('shape illustrations and unverified print-technique references stay outside the coded catalog', () => {
  for (const a of [...assets.shapes, ...assets.references]) assert.ok(!designs.some(d => d.img === a.img))
  for (const d of designs.filter(d => d.tech === 'embroidery')) assert.deepEqual(d.product, ['polo'])
  for (const p of assets.proofs) {
    assert.notEqual(p.design.img, p.real.img)
    assert.ok(source.assets.some(a => a.img === p.design.img))
    assert.ok(source.assets.some(a => a.img === p.real.img))
  }
})
