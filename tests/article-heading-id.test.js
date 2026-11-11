import test from 'node:test'
import assert from 'node:assert/strict'
import { createHeadingId } from '../src/js/article-heading-id.js'

test('reader anchors retain Thai letters and tone marks', () => {
  assert.equal(createHeadingId('เลือกผ้า ให้เข้ากับทีม'), 'reader-เลือกผ้า-ให้เข้ากับทีม')
})

test('reader anchors avoid all occupied IDs and repeated headings', () => {
  const occupied = new Set(['reader-size', 'reader-size-2'])
  assert.equal(createHeadingId('Size', occupied), 'reader-size-3')
  assert.equal(createHeadingId('Size', occupied), 'reader-size-4')
})

test('empty or punctuation-only headings get distinct safe anchors', () => {
  const occupied = new Set()
  assert.equal(createHeadingId('?!', occupied), 'reader-section')
  assert.equal(createHeadingId(' ', occupied), 'reader-section-2')
})

test('reader anchors normalize whitespace, punctuation, and case', () => {
  assert.equal(createHeadingId('  DFT / DTF:  Printing?  '), 'reader-dft-dtf-printing')
})
