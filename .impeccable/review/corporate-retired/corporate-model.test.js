import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { companyUses, companyBrief } from '../src/js/corporate-model.js'

test('company use choices use real local assets and have distinct recommendations', () => {
  assert.equal(Object.keys(companyUses).length,3)
  for(const item of Object.values(companyUses)) assert.ok(existsSync('public'+item.image))
  assert.equal(companyUses.daily.kind,'polo')
  assert.equal(companyUses.outing.kind,'round')
})
test('company brief preserves work, quantity and delivery date for contact and LINE', () => {
  const result=companyBrief({use:'outing',qty:'51',date:'2026-12-10'},'2026-10-27')
  assert.deepEqual(result.errors,[])
  const url=new URL(result.contact,'https://example.test')
  assert.equal(url.searchParams.get('u'),'corp')
  assert.equal(url.searchParams.get('p'),'print')
  assert.equal(url.searchParams.get('qty'),'51')
  assert.equal(url.searchParams.get('date'),'2026-12-10')
  assert.match(url.searchParams.get('from'),/Outing/)
  assert.match(decodeURIComponent(result.line),/51 ตัว/)
})
test('blank fields are allowed; invalid quantities and dates cannot create valid briefs', () => {
  assert.equal(companyBrief({}).errors.length,0)
  for(const qty of ['9','-20','1.5','abc','100001']) assert.ok(companyBrief({qty}).errors.length)
  for(const date of ['2026-02-30','2026-10-26','invalid']) assert.ok(companyBrief({date},'2026-10-27').errors.length)
  assert.equal(companyBrief({use:'unknown'}).errors.length,0)
})
test('company direction preview is isolated and reuses approved page components', () => {
  assert.match(readFileSync('site/corporate/index.html','utf8'),/corporateStudio/)
  assert.match(readFileSync('site/event/index.html','utf8'),/usePage/)
  const template=readFileSync('src/partials/corporateStudio.hbs','utf8')
  for(const component of ['co-title-row','co-cover','co-view-controls','contactBtn','cb cb--s']) assert.ok(template.includes(component))
  assert.ok(template.includes('id="company-work"'))
  assert.ok(template.includes('aria-controls="co-viewer"'))
  assert.doesNotMatch(template,/co-kicker|co-button|data-company-use/)
})
