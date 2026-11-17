import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import Handlebars from 'handlebars'
import { guideView } from '../src/js/guide-view.js'
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const data = path => JSON.parse(read(path))
const h = Handlebars.create()
h.registerHelper('eq', (a,b) => a === b)
for (const name of ['collarCrew','collarV','collarPolo','collarMandarin']) h.registerPartial(name, read(`../src/partials/${name}.hbs`))
const material = h.compile(read('../src/partials/guideMaterialLab.hbs'))
const studio = h.compile(read('../src/partials/guideProcessStudio.hbs'))
const guides = data('../src/data/guides.json')
const pages = data('../src/data/guide-pages.json')
const sizing = data('../src/data/sizing.json')
test('all eight guides have a visual opening with valid existing chapter destinations', () => {
  for (const guide of guides) {
    const item = guideView(guide,pages[guide.id],{forWp:true})
    const html = material({item,sizing}) + studio({item,sizing})
    /* 17 พ.ย. 2026: คู่มือทรงคอเปิดด้วยการ์ดรูปคอเสื้อจริง 12 แบบเป็นหัวข้อแรก (ตัดภาพวาดต้นแบบออก · tests/collar-page-1117.test.js) */
    assert.ok(/<section/.test(html) || item.sections[0]?.cards?.some((c) => c.img), guide.id)
    const ids = new Set(item.sections.flatMap(s=>[s.id,...(s.parts||[]).map(p=>`${s.id}-${p.id}`)]))
    for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(id),`${guide.id}: #${id}`)
    for (const [,src] of html.matchAll(/src="(\/img\/[^"?]+)"/g)) assert.ok(existsSync(new URL(`../public${src}`,import.meta.url)),src)
  }
})
test('fabric comparison has two real default photos and the existing fabric choices',()=>{
  const html=material({item:{id:'fabric'},sizing})
  assert.equal((html.match(/data-fabric-photo/g)||[]).length,2)
  assert.equal((html.match(/<option /g)||[]).length,sizing.fabrics.length*2)
  assert.match(html,/ไม่ใช่มาตราส่วนเดียวกัน/)
})
test('size explanation stays illustrative and all measurement instructions exist without JS',()=>{
  const html=material({item:{id:'size'},sizing})
  for(const id of ['chest','length','shoulder']) assert.ok(html.includes(`data-measure-answer="${id}"`))
  assert.doesNotMatch(html,/ไม่ใช่มาตราส่วนจริง/) // 17 พ.ย. อาร์ตให้เอาข้อความใต้รูปวัดไซซ์ออก
  assert.match(html,/ขอตารางไซซ์ที่ตรงกับทรง/)
  assert.doesNotMatch(html,/ดูตารางขนาดอ้างอิง/)
})
test('sample artwork is not presented as client proof or guaranteed vector by extension',()=>{
  const html=studio({item:{id:'logo'}})
  assert.match(html,/ไม่ใช่โลโก้ลูกค้า/)
  assert.match(html,/PDF.*SVG.*ภาพ/)
})
