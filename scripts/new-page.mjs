/* เพิ่มหน้ากลุ่มลูกค้าใหม่ (17 พ.ย. 2026 งาน B4 · tests/new-page.test.js)
   npm run new:page -- use <id> --from <id เดิม> --route /path/ --name "ชื่อกลุ่ม"
   ตัวอย่าง: npm run new:page -- use pet --from shop --route /custom-pet-shop-shirts/ --name "เสื้อร้านสัตว์เลี้ยง"

   สร้าง/แก้ 4 ที่:
   1. src/content/use/<id>.json   สำเนาเนื้อหาของหน้าต้นแบบ → แก้ข้อความเป็นของกลุ่มใหม่
   2. site/<route>/index.html      หน้าเว็บ · title/description ขึ้นต้น "ร่าง" + noindex (Google ไม่เก็บจนกว่าจะลบบรรทัดนั้น)
   3. src/data/routes.json         uses.<id> = route
   4. src/data/uses.json           ข้อมูลกลุ่ม (สำเนาจากต้นแบบ เปลี่ยน id/ชื่อ) → แก้ who / lead / contexts / รูป
   หน้าใหม่ยังเป็นเนื้อหาของหน้าต้นแบบ อย่าเปิด index จนกว่าจะแก้ครบ */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const flat = (o) => Object.values(o).flatMap((v) => (v && typeof v === 'object' ? flat(v) : [v]))

/** แผนการสร้างหน้า (ไม่เขียนไฟล์) · state = { routes, uses, content(id), html(route) } */
export function planUsePage({ id, from, route, name }, state) {
  if (!/^[a-z][a-z0-9-]*$/.test(id || '')) throw new Error(`id "${id}" ต้องเป็นภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข หรือ - เช่น pet-shop`)
  if (!String(name || '').trim()) throw new Error('ต้องใส่ชื่อกลุ่ม --name "…"')
  if (!/^\/[a-z0-9-]+(\/[a-z0-9-]+)*\/$/.test(route || '')) throw new Error(`route "${route}" ต้องขึ้นต้นและลงท้ายด้วย / เช่น /custom-pet-shop-shirts/`)
  const { routes, uses } = state
  if (routes.uses?.[id] || uses.some((u) => u.id === id)) throw new Error(`กลุ่ม "${id}" มีอยู่แล้ว`)
  if (flat(routes).includes(route)) throw new Error(`route ${route} ใช้แล้ว`)
  const src = uses.find((u) => u.id === from)
  if (!src || !routes.uses?.[from]) throw new Error(`ไม่มีหน้าต้นแบบ "${from}" (ใช้ได้: ${Object.keys(routes.uses).join(', ')})`)

  const html = state.html(routes.uses[from])
    .replace(/<title>[^<]*<\/title>/, `<title>ร่าง: ${name} | TEAMDEE</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="ร่าง: ${name} · สร้างจากหน้า ${from} ด้วย npm run new:page · แก้ title / description และเนื้อหาใน src/content/use/${id}.json แล้วลบบรรทัด noindex">`)
    .replace(/(\n\s*)(<\/head>)/, `$1  {{!-- หน้าร่างจาก npm run new:page (${from}) · แก้เนื้อหาครบแล้วลบบรรทัดนี้ --}}\n  <meta name="robots" content="noindex">$1$2`)
  const { legacyIds, ...rest } = src
  return {
    routes: { ...routes, uses: { ...routes.uses, [id]: route } },
    uses: [...uses, { ...rest, id, name }],
    content: state.content(from),
    html,
    files: { content: `src/content/use/${id}.json`, html: `site${route}index.html` },
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const args = process.argv.slice(2)
  const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined }
  const [kind, id] = args
  if (kind !== 'use' || !id) {
    console.log('ใช้: npm run new:page -- use <id> --from <id เดิม> --route /path/ --name "ชื่อกลุ่ม"\nตอนนี้รองรับหน้ากลุ่มลูกค้า (use) · หน้าสินค้าแต่ละหน้าทำเฉพาะ ให้คัดลอกเอง')
    process.exit(1)
  }
  const read = (p) => readFileSync(join(root, p), 'utf8')
  const json = (o) => JSON.stringify(o, null, 2) + '\n'
  try {
    const p = planUsePage({ id, from: opt('from'), route: opt('route'), name: opt('name') }, {
      routes: JSON.parse(read('src/data/routes.json')),
      uses: JSON.parse(read('src/data/uses.json')),
      content: (x) => JSON.parse(read(`src/content/use/${x}.json`)),
      html: (r) => read(`site${r}index.html`),
    })
    for (const f of [p.files.content, p.files.html]) if (existsSync(join(root, f))) throw new Error(`มีไฟล์ ${f} อยู่แล้ว`)
    writeFileSync(join(root, p.files.content), json(p.content))
    mkdirSync(dirname(join(root, p.files.html)), { recursive: true })
    writeFileSync(join(root, p.files.html), p.html)
    writeFileSync(join(root, 'src/data/routes.json'), json(p.routes))
    writeFileSync(join(root, 'src/data/uses.json'), json(p.uses))
    console.log(`สร้างหน้า ${opt('route')} แล้ว (ร่าง · noindex)\n\nขั้นต่อไป:
  1. แก้เนื้อหา: ${p.files.content}
  2. แก้ข้อมูลกลุ่ม (who / lead / contexts / รูป): src/data/uses.json → id "${id}"
  3. แก้ title / description แล้วลบบรรทัด noindex: ${p.files.html}
  4. npm run check · npm test · npm run export:wp แล้วเปิดดูหน้า

npm test จะตกจนกว่าหน้าใหม่จะพร้อม (ตั้งใจ): ข้อความซ้ำกับหน้าต้นแบบ · แกลเลอรีกลุ่มต้องมีแบบอย่างน้อย 12 ภาพ
· route ใหม่ต้องเพิ่มในรายการหน้าที่อนุมัติ (tests/routes-v22.test.js) · ลำดับหัวข้อตาม v22`)
  } catch (e) {
    console.error(`สร้างไม่ได้: ${e.message}`)
    process.exit(1)
  }
}
