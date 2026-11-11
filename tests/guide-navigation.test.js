import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { currentGuideSection, guideSectionURL, guideHashID } from '../src/js/guide-navigation-model.js'

const positions = [{ id: 'fabric', y: 600 }, { id: 'compare', y: 1200 }, { id: 'faq', y: 1800 }]
test('guide scrollspy follows the reading line below the header', () => {
  assert.equal(currentGuideSection(positions, 0, 900, 3000), 'fabric')
  assert.equal(currentGuideSection(positions, 1040, 900, 3000), 'compare')
  assert.equal(currentGuideSection(positions, 1650, 600, 3000), 'faq')
  assert.equal(currentGuideSection(positions, 900, 600, 3000), 'fabric')
})
test('guide scrollspy handles document end, short pages, and no sections', () => {
  assert.equal(currentGuideSection(positions, 2100, 900, 3000), 'faq')
  assert.equal(currentGuideSection(positions, 0, 900, 800), 'fabric')
  assert.equal(currentGuideSection([], 0, 900, 3000), null)
})
test('section sharing preserves the page and query but replaces its previous hash', () => {
  const url = guideSectionURL('https://team-dee.com/guides/fabrics/?source=guide#old', 'ผ้า-กีฬา')
  assert.equal(new URL(url).pathname, '/guides/fabrics/')
  assert.equal(new URL(url).search, '?source=guide')
  assert.equal(guideHashID(new URL(url).hash), 'ผ้า-กีฬา')
  assert.equal(guideHashID('#invalid%'), '')
})
test('shared guide entry keeps article reader and enhances native controls', () => {
  const entry = readFileSync(new URL('../src/js/guide-page.js', import.meta.url), 'utf8')
  const source = readFileSync(new URL('../src/js/guide-navigation.js', import.meta.url), 'utf8')
  assert.match(entry, /initArticleReader\(\)/)
  assert.match(entry, /initGuideNavigation\(\)/)
  assert.match(source, /compact\.addEventListener\('change', setDisclosure\)/)
  assert.match(source, /focus\(\{ preventScroll: true \}\)/)
  assert.match(source, /'aria-current', 'location'/)
  assert.match(source, /'toggle', measure, true/)
  assert.doesNotMatch(source, /innerHTML|execCommand|preventDefault\(/)
})
