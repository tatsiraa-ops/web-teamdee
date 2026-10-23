/* คู่มือสั่งทำ 7 เล่มตามหัวข้อ Wireframe v22 → src/data/guide-pages.json · มีเทส tests/guide-view.test.js
   รัน: node scripts/v22/guide-pages.mjs (อ่าน docs/spec/teamdee-v22/extracted/info.json + src/data/guides.json)
   - หัวข้อ H2 และลำดับตาม v22 ทุกเล่ม
   - เนื้อหาเดิมใน guides.json (ละเอียดกว่า ยืนยันแล้ว และมีผลกับ SEO เดิม) ไม่ทิ้ง: ใช้แทนเนื้อหา v22 ที่ยังเป็นช่องว่าง (main)
     หรือวางต่อเป็นหัวข้อย่อย H3 ใต้หัวข้อ v22 ที่ตรงเรื่อง (parts)
   - ข้อความ v22 ผ่าน claims.mjs เหมือนหน้าอื่น · ช่อง [ ] ของ v22 เว็บจริงตัดทิ้ง (src/js/guide-view.js) */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { claim } from './claims.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const info = JSON.parse(readFileSync(join(root, 'docs/spec/teamdee-v22/extracted/info.json'), 'utf8'))
const old = Object.fromEntries(JSON.parse(readFileSync(join(root, 'src/data/guides.json'), 'utf8')).map((g) => [g.id, g]))

const clean = (s) => claim(String(s || '').replace(/\s*(?:→\s*)?↗\s*$/, '').replace(/\s+/g, ' ').trim())
const LINK = { printed: 'products.print', screen: 'products.screen', polo: 'products.polo', 'guide-fabric': 'guides.fabric', 'guide-size': 'guides.size', 'guide-files': 'guides.logo', contact: 'contact' }

/* เนื้อหา v22 ของหัวข้อหนึ่ง → บล็อกแบบเดียวกับ guides.json */
const fromV22 = (s) => {
  if (s.tables?.length) return { kind: 'table', head: s.tables[0].head.map(clean), rows: s.tables[0].rows.map((r) => r.map(clean)), body: clean(s.intro?.[0]) }
  if (s.cards?.length) return { kind: 'cards', cards: s.cards.map((c) => ({ t: clean(c.h), d: clean(c.p[0]), ph: c.ph ? c.ph.t : '' })), body: clean(s.intro?.[0]) }
  if (s.lists?.length) return { kind: 'text', list: s.lists[0].items.map(clean), body: clean(s.intro?.[0]) }
  return { kind: 'text', body: clean(s.intro?.[0]) }
}

/* old ส่วนเดิมใน guides.json · "size:collect" = ส่วนของคู่มือเล่มอื่น */
const part = (gid, ref) => {
  const [g, sid] = ref.includes(':') ? ref.split(':') : [gid, ref]
  const s = old[g].sections.find((x) => x.id === sid)
  if (!s) throw new Error(`ไม่พบส่วน ${ref} ใน ${gid}`)
  const { no, ...rest } = s
  return rest
}

/* ต่อเล่ม: [หัวข้อ v22, id ของส่วน, ส่วนเดิมที่ใช้แทน (main), ส่วนเดิมที่วางต่อเป็น H3 (parts)] */
const MAP = {
  print: ['guide-print', [['s1', 'overview', 'overview'], ['s2', 'start', 'start', ['info']], ['s3', 'options', 'options', ['sizes']], ['s4', 'artwork', 'artwork'], ['s5', 'confirm', 'confirm', ['time']], ['s6', 'after', 'after']]],
  screen: ['guide-screen', [['s1', 'prepare', 'prepare'], ['s2', 'shirt', null], ['s3', 'confirm', 'confirm'], ['s4', 'price', 'spec'], ['s5', 'after', 'after']]],
  polo: ['guide-embroider', [['s1', 'overview', null, ['start', 'info']], ['s2', 'options', 'options'], ['s3', 'artwork', 'artwork'], ['s4', 'mockup', null], ['s5', 'confirm', 'confirm', ['sizes']], ['s6', 'pay', null, ['time', 'after']]]],
  fabric: ['guide-fabric', [['s1', 'how', 'how'], ['s2', 'tech', 'tech'], ['s3', 'texture', null], ['s4', 'compare', 'list', ['props']], ['s5', 'sample', 'sample']]],
  size: ['guide-size', [['s1', 'table', 'table'], ['s2', 'measure', 'measure'], ['s3', 'tips', 'tips'], ['s4', 'photos', null], ['s5', 'collect', 'collect']]],
  logo: ['guide-files', [['s1', 'start', null, ['nofile']], ['s2', 'files', 'files'], ['s3', 'need', null, ['names']], ['s4', 'collect', null, ['size:collect']], ['s5', 'check', 'check']]],
  delivery: ['guide-delivery', [['s1', 'ship', 'ship'], ['s2', 'timing', null], ['s3', 'before', 'before'], ['s4', 'receive', 'receive'], ['s5', 'problem', 'problem'], ['s6', 'reorder', 'reorder']]],
}

/* ดูผิวและการทิ้งตัวของผ้า (คู่มือผ้า): v22 เป็นช่อง [ผ้า A / รหัส] → ใช้ผ้าจริงใน sizing.json + ภาพผิวผ้าจริง (ตัดจากภาพผ้าบนเว็บจริง เฉพาะเนื้อผ้า) */
const sizing = JSON.parse(readFileSync(join(root, 'src/data/sizing.json'), 'utf8'))
const fabricCards = sizing.fabrics.filter((f) => f.img).map((f) => ({ t: f.name, d: `เหมาะกับ${f.use}`, img: f.img.replace(/\.jpg$/, '-wide.webp') }))

const out = { _note: 'สร้างจาก Wireframe v22 + guides.json ด้วย scripts/v22/guide-pages.mjs · รันใหม่จะทับ · แก้เนื้อหาที่ guides.json แล้วรันใหม่' }
for (const [gid, [vid, rows]] of Object.entries(MAP)) {
  const v = info[vid]
  const sec = Object.fromEntries(v.sections.map((s) => [s.key, s]))
  const sections = rows.map(([key, id, main, parts = []], i) => {
    const base = main ? part(gid, main) : gid === 'fabric' && id === 'texture' ? { kind: 'cards', cards: fabricCards } : fromV22(sec[key])
    return { ...base, id, no: String(i + 1), title: clean(sec[key].h), parts: parts.map((r) => part(gid, r)) }
  })
  /* FAQ: ของเดิม + ข้อของ v22 ที่ยังไม่มี */
  const oldFaq = old[gid].sections.find((s) => s.kind === 'faq')
  const v22Faq = (sec.faq?.faq || []).map((f) => [clean(f.q).replace(/\?$/, ''), clean(f.a)])
  const items = [...(oldFaq?.items || []), ...v22Faq.filter(([q]) => !(oldFaq?.items || []).some(([x]) => x.replace(/\?$/, '') === q))]
  sections.push({ id: 'faq', no: String(sections.length + 1), title: clean(sec.faq.h), kind: 'faq', items, parts: [] })
  /* ข้อมูลที่ใช้ต่อได้ (v22) · ลิงก์ไปเล่มตัวเองตัดทิ้ง */
  const more = v.sections.find((s) => s.h === 'ข้อมูลที่ใช้ต่อได้')
  const links = more.links.map((l) => ({ t: clean(l.t), to: LINK[l.href.replace(/^#/, '')] })).filter((l) => l.to && l.to !== `guides.${gid}`)
  sections.push({ id: 'more', no: String(sections.length + 1), title: clean(more.h), kind: 'links', links, parts: [] })
  out[gid] = { h1: clean(v.hero.h1), lead: clean(v.hero.lead), sections }
}
writeFileSync(join(root, 'src/data/guide-pages.json'), JSON.stringify(out, null, 2) + '\n')
console.log('guide-pages.json:', Object.keys(out).filter((k) => k[0] !== '_').join(', '))
