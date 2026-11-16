/* ตัวโหลดไฟล์เนื้อหาต่อหน้า (16 พ.ย. 2026 B2 · tests/content-files.test.js)
   หน้ากลุ่มลูกค้า: src/content/use/<id>.json = { page, v2 } · ค่ากลางทุกหน้า src/content/use/_shared.json (เช่น _check ส่วนตรวจตัวอย่าง)
   หน้าสินค้า:     src/content/product/<id>.json = { page, v2? }
   page = ข้อความตาม Wireframe v22 (เดิม use-pages.json / product-pages.json) · v2 = โฉมใหม่ (เดิม use-v2.json / pp-v2.json)
   ฟังก์ชันคืนโครงเดิมของไฟล์รวม (key = id ของหน้า) · อ่านไฟล์ใหม่ทุกครั้ง ผู้เรียกแก้ค่าได้โดยไม่ติดไปครั้งถัดไป
   อยากแก้หน้าไหน เปิด src/content/<use|product>/<id>.json ไฟล์เดียว */
import { existsSync, readdirSync, readFileSync } from 'node:fs'

const CONTENT = new URL('../content/', import.meta.url)
const read = (u) => JSON.parse(readFileSync(u, 'utf8'))
const routes = () => read(new URL('../data/routes.json', import.meta.url))

/** id ตามลำดับใน routes.json ก่อน แล้วไฟล์อื่นในโฟลเดอร์ (ถ้ามี) เรียงตามชื่อ */
const pagesOf = (kind, routeKey) => {
  const dir = new URL(`${kind}/`, CONTENT)
  const ids = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => f.slice(0, -5))
  const order = Object.keys(routes()[routeKey] || {})
  const sorted = [...order.filter((id) => ids.includes(id)), ...ids.filter((id) => !order.includes(id)).sort()]
  return sorted.map((id) => [id, read(new URL(`${id}.json`, dir))])
}
const pick = (pages, part) => Object.fromEntries(pages.filter(([, c]) => c[part] !== undefined).map(([id, c]) => [id, c[part]]))
const shared = (kind) => { const u = new URL(`${kind}/_shared.json`, CONTENT); return existsSync(u) ? read(u) : {} }

/** หน้ากลุ่มลูกค้า: ข้อความตาม Wireframe v22 (โครงเดิม use-pages.json) */
export const usePages = () => pick(pagesOf('use', 'uses'), 'page')
/** หน้ากลุ่มลูกค้า: โฉมใหม่ + ค่ากลาง (โครงเดิม use-v2.json) */
export const useV2 = () => ({ ...shared('use'), ...pick(pagesOf('use', 'uses'), 'v2') })
/** หน้าสินค้า: ข้อความตาม Wireframe v22 (โครงเดิม product-pages.json) */
export const productPages = () => pick(pagesOf('product', 'products'), 'page')
/** หน้าสินค้า: โฉมใหม่ (โครงเดิม pp-v2.json · มีเฉพาะหน้าที่ทำแล้ว) */
export const ppV2 = () => ({ ...shared('product'), ...pick(pagesOf('product', 'products'), 'v2') })
