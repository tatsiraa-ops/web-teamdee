/* ปุ่มติดต่อบนหน้ากลุ่มลูกค้า · มีเทส tests/use-cta.test.js
   agent ลูกค้า 22 ต.ค. 2026: หน้าเดียวมีปุ่ม 5–6 ชื่อ คนไม่รู้จะกดอันไหน → เหลือ 2 แบบต่อหน้า ให้ตรงวิธีที่กลุ่มนั้นติดต่อจริง
   - บริษัท หน่วยงาน ร้านค้า โรงเรียน คณะ: ต้องมีเอกสารจัดซื้อ → ขอใบเสนอราคา + โทร
   - กีฬา ก๊วน วิ่ง อีเวนต์ รุ่น: คุยในแชทเร็วกว่า → ทักไลน์ (มีข้อความตั้งต้น) + ฟอร์มขอราคา */

import { lineMessageUrl } from './contact-send.js'

export { lineMessageUrl }
/* ลิงก์ tel: และ line.me นับผลอัตโนมัติใน track.js ไม่ต้องใส่ data-track */
const QUOTE_FIRST = new Set(['corp', 'gov', 'shop', 'edu', 'faculty'])

export function useCta(item, site, contactHref) {
  const form = (label) => ({ href: `${contactHref}?u=${item.id}`, label })
  const phone = { href: `tel:${site.phonePrimaryTel}`, label: `โทร ${site.phonePrimary}` }
  const tel = { href: phone.href, label: site.phonePrimary }
  if (QUOTE_FIRST.has(item.id)) return { mode: 'quote', primary: form('ขอใบเสนอราคา'), secondary: phone, tel }
  const line = { href: lineMessageUrl(`สนใจทำเสื้อ${item.shortName} ขอราคาและดูแบบ`), label: 'ทัก LINE ขอราคา' }
  return { mode: 'line', primary: line, secondary: form('ขอราคาผ่านฟอร์ม'), tel }
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** วันที่ต้องใช้เสื้อ (ช่อง "มีวันใช้แล้ว?") ติดไปกับปุ่ม · ฟอร์ม: ?date= · LINE: ต่อท้ายข้อความตั้งต้น · ลิงก์อื่นไม่แตะ */
export function hrefWithDate(href, iso) {
  const m = ISO.exec(iso || '')
  if (!m) return href
  if (href.startsWith('https://line.me/R/oaMessage/')) {
    const [base, q] = href.split('?')
    return `${base}?${encodeURIComponent(`${decodeURIComponent(q)} · ต้องใช้เสื้อวันที่ ${+m[3]} ${MONTHS[+m[2] - 1]} ${+m[1] + 543}`)}`
  }
  if (href.includes('/contact-us/')) return `${href}${href.includes('?') ? '&' : '?'}date=${iso}`
  return href
}
