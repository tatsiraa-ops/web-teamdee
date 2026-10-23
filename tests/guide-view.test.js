import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { guideView } from '../src/js/guide-view.js'

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const pages = read('../src/data/guide-pages.json')
const v22 = read('../docs/spec/teamdee-v22/extracted/info.json')
const old = { id: 'x', name: 'คู่มือ', who: 'ทุกคน', intro: 'เดิม', sections: [{ id: 'a', no: '1', title: 'เดิม', kind: 'text', body: 'ก' }] }
const page = {
  h1: 'หัวใหม่', lead: 'นำ',
  sections: [
    { id: 'ok', no: '1', title: 'มีของจริง', kind: 'text', body: 'ข้อความ', parts: [] },
    { id: 'gap', no: '2', title: 'ยังว่าง', kind: 'table', head: ['หัวข้อ', 'ข้อมูล'], rows: [['ทรง', '[รอข้อมูล]']], parts: [] },
    { id: 'cards', no: '3', title: 'การ์ด', kind: 'cards', cards: [{ t: '[ผ้า A]', d: 'ก', ph: 'ภาพ' }, { t: 'จริง', d: 'ข', ph: 'ภาพ' }], parts: [] },
    { id: 'faq', no: '4', title: 'คำถาม', kind: 'faq', items: [['ก?', 'ได้'], ['ข?', '[รอ]']], parts: [] },
  ],
}

test('ต้นแบบ: ใช้หัวข้อ v22 ครบ เก็บช่องรอข้อมูลไว้', () => {
  const v = guideView(old, page, { forWp: false })
  assert.equal(v.h1, 'หัวใหม่')
  assert.deepEqual(v.sections.map((s) => s.id), ['ok', 'gap', 'cards', 'faq'])
})

test('เว็บจริง: ตัดแถว/การ์ด/คำถามที่ยังรอ · หัวข้อที่ไม่เหลืออะไรซ่อน · เลขหัวข้อเรียงใหม่', () => {
  const v = guideView(old, page, { forWp: true })
  assert.deepEqual(v.sections.map((s) => [s.no, s.id]), [['1', 'ok'], ['2', 'cards'], ['3', 'faq']])
  assert.deepEqual(v.sections[1].cards.map((c) => c.t), ['จริง'])
  assert.deepEqual(v.sections[2].items, [['ก?', 'ได้']])
})

test('ไม่มีหน้า v22 (เช่น คู่มือทรงคอ) → ใช้ของเดิม', () => {
  assert.deepEqual(guideView(old, undefined, { forWp: true }).sections.map((s) => s.id), ['a'])
})

test('คู่มือ 7 เล่ม: H2 ตรงหัวข้อ v22 ทุกหัวข้อ เรียงตาม v22', () => {
  const V = { print: 'guide-print', screen: 'guide-screen', polo: 'guide-embroider', fabric: 'guide-fabric', size: 'guide-size', logo: 'guide-files', delivery: 'guide-delivery' }
  for (const [id, vid] of Object.entries(V)) {
    const want = v22[vid].sections.map((s) => s.h).filter((h) => !h.startsWith('มีโจทย์เสื้อทีม'))
    assert.deepEqual(pages[id].sections.map((s) => s.title), want, id)
    assert.equal(pages[id].h1, v22[vid].hero.h1, id)
  }
})
