/* คลังรูปกลาง (30 ต.ค.) · scripts/media-library.mjs สร้าง src/data/media-library.json · src/js/media-library.js เลือกรูปให้หน้าเว็บ
   - รวมไฟล์ย่อ (-320 -540 …) กับไฟล์ .jpg คู่ .webp เป็นรูปเดียว
   - แท็กกลุ่มลูกค้า/สินค้า มาจากข้อมูลที่มีอยู่เท่านั้น ไม่เดา
   - แกลเลอรีรายกลุ่ม: แบบ TD ก่อน → ภาพแบบอ้างอิง → งานจริงของลูกค้ากลุ่มนั้น */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { groupFiles, imageSize, buildLibrary } from '../scripts/media-library.mjs'
import { mediaFor, galleryFor, filterMedia, GROUPS } from '../src/js/media-library.js'
import { MACHINE_IMG } from '../scripts/lib/clean-rules.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const pub = (p) => readFileSync(join(root, 'public', p))

test('groupFiles: ไฟล์ย่อและ .jpg คู่ .webp รวมเป็นรูปเดียว · ใช้ .webp เป็นไฟล์หลัก', () => {
  const g = groupFiles(['real/r01.jpg', 'real/r01.webp', 'real/r01-320.jpg', 'real/r01-320.webp'])
  assert.deepEqual([...g.keys()], ['real/r01'])
  const r = g.get('real/r01')
  assert.equal(r.main, 'real/r01.webp')
  assert.deepEqual(r.formats, ['jpg', 'webp'])
  assert.deepEqual(r.variants, [{ w: 320, file: 'real/r01-320.webp' }])
})

test('groupFiles: ไม่มีไฟล์ตั้งต้นแต่มีไฟล์ย่อ 2 ขนาด = รูปเดียว ใช้ไฟล์ใหญ่สุดเป็นหลัก', () => {
  const g = groupFiles(['hero/models-company-540.webp', 'hero/models-company-1080.webp'])
  assert.deepEqual([...g.keys()], ['hero/models-company'])
  assert.equal(g.get('hero/models-company').main, 'hero/models-company-1080.webp')
  assert.deepEqual(g.get('hero/models-company').variants.map((v) => v.w), [540])
})

test('groupFiles: เลขท้ายที่เป็นชื่อรูป (studio-440) ไม่นับเป็นไฟล์ย่อ · รูปคนละครอป (-wide) แยกกัน', () => {
  const g = groupFiles(['screen/studio-440.webp', 'screen/studio-440-540.webp', 'screen/real-130.webp', 'fabric/corn.jpg', 'fabric/corn.webp', 'fabric/corn-160.webp', 'fabric/corn-wide.webp'])
  assert.deepEqual([...g.keys()].sort(), ['fabric/corn', 'fabric/corn-wide', 'screen/real-130', 'screen/studio-440'])
  assert.deepEqual(g.get('screen/studio-440').variants.map((v) => v.w), [540])
  assert.deepEqual(g.get('fabric/corn').variants.map((v) => v.w), [160])
})

test('imageSize: อ่านขนาดจากหัวไฟล์ webp / jpg / png / svg', () => {
  assert.deepEqual(imageSize(pub('/img/customer/co01.webp')), { w: 640, h: 640 })
  assert.deepEqual(imageSize(pub('/img/design/d01.webp')), { w: 1080, h: 735 })
  assert.deepEqual(imageSize(pub('/img/hero/models-company-1080.webp')), { w: 1080, h: 1350 })
  assert.deepEqual(imageSize(pub('/img/real/r01.jpg')), { w: 760, h: 760 })
  assert.deepEqual(imageSize(pub('/img/client/c01.png')), { w: 200, h: 200 })
  assert.deepEqual(imageSize(pub('/img/services/screen-placement.svg')), { w: 1080, h: 720 })
})

/* คลังตัวอย่างสำหรับทดสอบตัวเลือก */
const LIB = { items: [
  { path: '/img/customer/a.webp', kind: 'customer', groups: ['running', 'event'], primary: ['event'], q: 3, occ: 'นักวิ่งถ่ายรวม' },
  { path: '/img/customer/b.webp', kind: 'customer', groups: ['running'], primary: ['running'], q: 2, occ: 'นักวิ่งเข้าเส้นชัย' },
  { path: '/img/customer/c.webp', kind: 'customer', groups: ['running'], primary: ['running'], q: 3, occ: 'สตาฟงานวิ่ง' },
  { path: '/img/customer/c2.webp', kind: 'customer', groups: ['running'], primary: ['running'], q: 3, dupOf: '/img/customer/c.webp' },
  { path: '/img/customer/d.webp', kind: 'customer', groups: ['corp'], primary: ['corp'], q: 3 },
  { path: '/img/sport3d/jpark-front.webp', kind: 'mockup3d', groups: ['running'], primary: ['running'], product: ['print'], alt: 'ภาพจำลองเสื้อวิ่ง', w: 1080, h: 1080 },
  { path: '/img/gallery/sport/001.webp', kind: 'gallery', groups: ['sport'], primary: ['sport'], alt: 'แบบเสื้อกีฬา', w: 1080, h: 1080 },
  { path: '/img/design/d13.webp', kind: 'design', code: 'TD-0013', groups: ['event', 'running'], primary: ['event'], product: ['print'] },
  { path: '/img/gallery/edu/050.webp', kind: 'gallery', groups: ['edu'], primary: ['edu'], dupOf: '/img/gallery/corp/073.webp' },
] }

test('mediaFor: กรองกลุ่ม ชนิด สินค้า · ตัดรูปซ้ำ · กลุ่มตรงจากแหล่งหลักขึ้นก่อน แล้วเรียงคุณภาพ', () => {
  const run = mediaFor(LIB, { group: 'running', kind: 'customer' }).map((m) => m.path)
  assert.deepEqual(run, ['/img/customer/c.webp', '/img/customer/b.webp', '/img/customer/a.webp'])
  assert.deepEqual(mediaFor(LIB, { group: 'running', kind: 'customer', limit: 1 }).map((m) => m.path), ['/img/customer/c.webp'])
  assert.deepEqual(mediaFor(LIB, { group: 'running', kind: 'customer', primaryOnly: true }).length, 2)
  assert.deepEqual(mediaFor(LIB, { product: 'print', kind: ['mockup3d'] }).map((m) => m.path), ['/img/sport3d/jpark-front.webp'])
  assert.deepEqual(mediaFor(LIB, { group: 'running', kind: 'customer', exclude: ['/img/customer/c.webp'] }).map((m) => m.path), ['/img/customer/b.webp', '/img/customer/a.webp'])
  assert.equal(mediaFor(LIB.items, { group: 'badminton' }).length, 0)
  /* ใบซ้ำที่ตัวหลักอยู่คนละกลุ่ม ยังใช้ในกลุ่มของมันได้ */
  assert.deepEqual(mediaFor(LIB, { group: 'edu' }).map((m) => m.path), ['/img/gallery/edu/050.webp'])
})

test('galleryFor: แบบ TD ก่อน → ภาพแบบอ้างอิงของกลุ่ม → งานจริงของลูกค้า · นับจำนวนตรง · ไม่ยืมกลุ่มอื่น', () => {
  const coded = [{ code: 'TD-0013', img: '/img/design/d13.webp' }]
  const g = galleryFor(LIB, { group: 'running', shortName: 'วิ่ง', coded })
  assert.deepEqual(g.items.map((x) => x.code || x.img), ['TD-0013', '/img/sport3d/jpark-front.webp', '/img/customer/c.webp', '/img/customer/b.webp', '/img/customer/a.webp'])
  assert.equal(g.codedN, 1)
  assert.equal(g.referenceN, 4)
  assert.equal(g.realN, 3)
  assert.equal(g.items.filter((x) => x.realFirst).length, 1)
  assert.equal(g.items[2].realFirst, true)
  assert.ok(g.items.slice(2).every((x) => x.real && /งานจริงของลูกค้ากลุ่มวิ่ง$/.test(x.alt)), 'คำบรรยายงานจริงบอกกลุ่ม')
  assert.match(g.items[2].alt, /^สตาฟงานวิ่ง/)
  assert.equal(g.items[1].square, true)
  assert.ok(!g.items.some((x) => x.img === '/img/gallery/sport/001.webp'))
  /* เสื้อ 3D ที่เป็นแบบเดียวกับแบบมีรหัส (sameAs) ไม่ซ้ำในหน้า */
  const lib2 = { items: LIB.items.map((m) => (m.kind === 'mockup3d' ? { ...m, sameAs: 'TD-0013' } : m)) }
  assert.equal(galleryFor(lib2, { group: 'running', shortName: 'วิ่ง', coded }).items.some((x) => x.img === '/img/sport3d/jpark-front.webp'), false)
  /* ไม่มีงานจริง = ไม่มีหัวข้องานจริง */
  const none = galleryFor(LIB, { group: 'sport', shortName: 'กีฬา', coded: [] })
  assert.equal(none.realN, 0)
  assert.equal(none.items.some((x) => x.realFirst), false)
})

test('filterMedia: กรองตามชนิด กลุ่ม สินค้า รูปซ้ำ และค้นจาก alt/path/รหัส', () => {
  const f = (s) => filterMedia(LIB.items, s).map((m) => m.path)
  assert.equal(f({}).length, LIB.items.length)
  assert.deepEqual(f({ kind: 'mockup3d' }), ['/img/sport3d/jpark-front.webp'])
  assert.deepEqual(f({ group: 'corp' }), ['/img/customer/d.webp'])
  assert.deepEqual(f({ product: 'print', kind: 'design' }), ['/img/design/d13.webp'])
  assert.deepEqual(f({ dup: true }), ['/img/customer/c2.webp', '/img/gallery/edu/050.webp'])
  assert.deepEqual(f({ q: 'td-0013' }), ['/img/design/d13.webp'])
  assert.deepEqual(f({ q: 'สตาฟ' }), ['/img/customer/c.webp'])
  assert.deepEqual(f({ q: 'jpark' }), ['/img/sport3d/jpark-front.webp'])
  assert.deepEqual(f({ group: 'none' }), [])
})

const lib = read('src/data/media-library.json')

test('media-library.json: ทุกรูปมีไฟล์จริง · ขนาด · md5 · สถิติตรงกับรายการ · ไม่มีรูปเครื่องจักร', () => {
  assert.ok(lib.items.length > 900, `${lib.items.length}`)
  const bad = []
  for (const m of lib.items) {
    if (!existsSync(join(root, 'public', m.path))) bad.push(`ไม่มีไฟล์ ${m.path}`)
    if (!(m.w > 0 && m.h > 0)) bad.push(`ไม่มีขนาด ${m.path}`)
    if (!/^[0-9a-f]{32}$/.test(m.md5)) bad.push(`ไม่มี md5 ${m.path}`)
    for (const v of m.variants) if (!existsSync(join(root, 'public', v.path))) bad.push(`ไม่มีไฟล์ย่อ ${v.path}`)
    if (!lib.kinds[m.kind]) bad.push(`ชนิดไม่รู้จัก ${m.kind} ${m.path}`)
    for (const g of m.groups) if (!GROUPS.includes(g)) bad.push(`กลุ่มไม่รู้จัก ${g} ${m.path}`)
    for (const g of m.primary) if (!m.groups.includes(g)) bad.push(`primary ไม่อยู่ใน groups ${m.path}`)
    if (m.dupOf && !lib.items.some((x) => x.path === m.dupOf && x.md5 === m.md5)) bad.push(`dupOf ผิด ${m.path}`)
  }
  assert.deepEqual(bad, [])
  assert.equal(new Set(lib.items.map((m) => m.path)).size, lib.items.length, 'path ซ้ำ')
  assert.equal(Object.values(lib.stats.byKind).reduce((a, b) => a + b, 0), lib.items.length)
  assert.equal(lib.stats.duplicates, lib.items.filter((m) => m.dupOf).length)
  assert.equal(JSON.stringify(lib).match(MACHINE_IMG), null)
})

test('media-library.json: แท็กกลุ่มของรูปลูกค้ามาจาก customers.json (photoGroup / uses) หรือรูปประจำกลุ่มใน uses.json เท่านั้น', () => {
  const byImg = new Map(read('src/data/customers.json').map((c) => [c.img, c]))
  const useImg = new Map(read('src/data/uses.json').map((u) => [u.img, u.id]))
  const bad = []
  for (const m of lib.items.filter((x) => x.kind === 'customer')) {
    const c = byImg.get(m.path)
    const allowed = new Set([c?.photoGroup, ...(c?.uses || []), useImg.get(m.path)].filter(Boolean))
    for (const g of m.groups) if (!allowed.has(g)) bad.push(`${m.path}: ${g}`)
  }
  assert.deepEqual(bad, [])
  /* แบบ TD: กลุ่มมาจาก designs.json use หรือทรง (แบด/วิ่ง) · หรือคู่ภาพแบบ/เสื้อจริงใน download-designs.json ที่ใช้รูปเดียวกัน */
  const des = new Map(read('src/data/designs.json').map((d) => [d.code, d]))
  const proofUse = (img) => read('src/data/download-designs.json').proofs.filter((p) => p.design?.img === img || p.real?.img === img).flatMap((p) => p.use || [])
  for (const m of lib.items.filter((x) => x.code)) {
    const d = des.get(m.code)
    const allowed = new Set([...(d.use || []), ...(['badminton', 'running'].includes(d.garment) ? [d.garment] : []), ...proofUse(m.path)])
    for (const g of m.groups) assert.ok(allowed.has(g), `${m.code}: ${g}`)
  }
})

test('buildLibrary: รันซ้ำได้ผลเดิม (deterministic)', () => {
  const a = buildLibrary(root, { only: ['case', 'sport3d'] })
  const b = buildLibrary(root, { only: ['case', 'sport3d'] })
  assert.deepEqual(a, b)
  assert.ok(a.items.length >= 9)
  const bpm = a.items.find((m) => m.path === '/img/sport3d/bpm-front.webp')
  assert.deepEqual(bpm.groups, ['badminton'])
})

test('แกลเลอรีรายกลุ่ม: ทุกกลุ่มมีอย่างน้อย 12 ภาพ · งานจริงทุกภาพอยู่ในกลุ่มนั้นจริง', () => {
  const designs = read('src/data/designs.json')
  const uses = read('src/data/uses.json')
  const TAG = { badminton: { garment: 'badminton' }, running: { garment: 'running' } }
  for (const u of uses) {
    const q = TAG[u.id] || { use: u.id }
    const coded = designs.filter((d) => (q.use ? (d.use || []).includes(q.use) : d.garment === q.garment))
    const g = galleryFor(lib, { group: u.id, shortName: u.shortName, coded })
    assert.ok(g.items.length >= 12, `${u.id}: ${g.items.length}`)
    assert.equal(g.codedN + g.referenceN, g.items.length, u.id)
    for (const x of g.items.filter((i) => !i.code)) {
      const m = lib.items.find((i) => i.path === x.img)
      assert.ok(m && m.groups.includes(u.id), `${u.id}: ${x.img}`)
    }
    assert.equal(new Set(g.items.map((x) => x.img)).size, g.items.length, `${u.id}: รูปซ้ำ`)
  }
})
