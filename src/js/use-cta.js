/* ปุ่มติดต่อบนหน้ากลุ่มลูกค้า · มีเทส tests/use-cta.test.js
   agent ลูกค้า 22 ต.ค. 2026: หน้าเดียวมีปุ่ม 5–6 ชื่อ คนไม่รู้จะกดอันไหน → เหลือ 2 แบบต่อหน้า ให้ตรงวิธีที่กลุ่มนั้นติดต่อจริง
   - บริษัท หน่วยงาน ร้านค้า โรงเรียน คณะ: ต้องมีเอกสารจัดซื้อ → ขอใบเสนอราคา + โทร
   - กีฬา ก๊วน วิ่ง อีเวนต์ รุ่น: คุยในแชทเร็วกว่า → ทักไลน์ (มีข้อความตั้งต้น) + ฟอร์มขอราคา */

import { lineMessageUrl } from './contact-send.js'
import { thaiDate } from './need-by.js'

export { lineMessageUrl }
/* ลิงก์ tel: และ line.me นับผลอัตโนมัติใน track.js ไม่ต้องใส่ data-track */
/* อาร์ตเคาะ 30 ต.ค. (ตรวจมือถือ): LINE เป็นปุ่มหลักทุกกลุ่ม · กลุ่มที่ต้องมีเอกสารจัดซื้อ ทางรองเขียนว่าขอใบเสนอราคา */
const QUOTE_FIRST = new Set(['corp', 'gov', 'shop', 'edu', 'faculty'])

export function useCta(item, site, contactHref) {
  const form = (label) => ({ href: `${contactHref}?u=${item.id}`, label })
  const tel = { href: `tel:${site.phonePrimaryTel}`, label: site.phonePrimary }
  const line = { href: lineMessageUrl(`สนใจทำเสื้อ${item.shortName} ขอราคาและดูแบบ`), label: 'ทัก LINE ขอราคา' }
  const docs = QUOTE_FIRST.has(item.id)
  return { mode: 'line', docs, primary: line, secondary: form(docs ? 'ขอใบเสนอราคา (ฟอร์ม)' : 'ขอราคาผ่านฟอร์ม'), tel }
}

/* ข้อความ LINE ของปุ่มส่วนกลาง (แถบล่างมือถือ · เมนู · hero · ปุ่มลอย · ท้ายเว็บ) ตามหน้า (ตรวจมือถือ 30 ต.ค.)
   บรรทัดว่างให้ลูกค้าพิมพ์ต่อ (ไม่ใช้ "..." ที่ต้องลบเอง) · ต่อท้ายหน้าที่มาให้ฝ่ายขายรู้บริบท */
const FILL = 'ใช้กับงาน: \nจำนวนประมาณ:  ตัว\nต้องใช้วันที่: '
const short = (name) => String(name || '').split(' / ')[0]
export function pageLineText(page, names, at) {
  const { kind, id } = page || {}
  const from = `\n(จากหน้า ${at})`
  if (kind === 'products' && names.products?.[id]) return `สวัสดี ทีมดี ขอราคา${names.products[id]}\n${FILL}${from}`
  if (kind === 'uses' && names.uses?.[id]) return `สวัสดี ทีมดี สนใจทำ${short(names.uses[id])}\n${FILL}${from}`
  if (kind === 'galleries' && names.uses?.[id]) return `สวัสดี ทีมดี ดูแบบ${short(names.uses[id])}แล้วสนใจ\n${FILL}${from}`
  if (['guides', 'faq'].includes(kind)) return `สวัสดี ทีมดี อ่านคู่มือบนเว็บแล้วมีคำถาม\nคำถาม: \n${FILL}${from}`
  if (['articles', 'posts', 'blog'].includes(kind)) return `สวัสดี ทีมดี อ่านบทความบนเว็บแล้วมีคำถาม\nคำถาม: \n${FILL}${from}`
  const general = `สวัสดี ทีมดี สนใจทำเสื้อทีม\nประเภทเสื้อ: \n${FILL}`
  return kind === 'home' || at === '/' ? general : general + from
}

export const REORDER_TEXT = 'สวัสดี ทีมดี ลูกค้าเดิม ขอสั่งซ้ำ / เพิ่มจำนวน\nเลขออเดอร์เดิม (ถ้ามี): \nชื่อหน่วยงาน / ทีม: \nจำนวนและไซซ์: \nต้องได้วันที่: '
export const TRACK_TEXT = 'สวัสดี ทีมดี ขอติดตามงาน\nเลขออเดอร์ / ชื่อหน่วยงาน: \nเบอร์ที่ใช้สั่ง: '

/* ช่องวันที่ในข้อความตั้งต้น (FILL · REORDER_TEXT · design-picks.js) ที่ยังว่าง */
const DATE_SLOT = /(ต้องใช้วันที่|ต้องได้วันที่|อยากได้รับวันที่): *(?=\n|$)/

/** วันที่ต้องใช้เสื้อ (ช่อง "มีวันใช้แล้ว?" · ช่องวางแผนวันใช้บนหน้าสินค้า) ติดไปกับปุ่ม · ฟอร์ม: ?date= · LINE: เติมในช่องวันที่ของข้อความ ไม่มีช่องต่อบรรทัดใหม่ · ลิงก์อื่นไม่แตะ
    note (ไม่ใส่ก็ได้): ต่อท้ายในวงเล็บ เช่น "ยืนยันแบบภายใน 26 มี.ค. 2569" จาก need-by.js (ตรวจมือถือ 30 ต.ค. ข้อ 35) · ฟอร์มไม่รับ note
    2 พ.ย.: เดิมต่อท้าย "(จากหน้า …)" ทำให้ช่องวันที่ว่างค้างและวันซ้ำในข้อความ */
export function hrefWithDate(href, iso, note) {
  const day = thaiDate(iso)
  if (!day) return href
  if (href.startsWith('https://line.me/R/oaMessage/')) {
    const [base, q] = href.split('?')
    const text = decodeURIComponent(q)
    const when = note ? `${day} (${note})` : day
    return `${base}?${encodeURIComponent(DATE_SLOT.test(text) ? text.replace(DATE_SLOT, (m, k) => `${k}: ${when}`) : `${text}\nต้องใช้วันที่: ${when}`)}`
  }
  if (href.includes('/contact-us/')) return `${href}${href.includes('?') ? '&' : '?'}date=${iso}`
  return href
}
