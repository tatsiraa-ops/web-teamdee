/* ข้อมูลโครงสร้าง (JSON-LD) ของหน้าแรก · ใช้ตอน build ใน vite.config.js
   คำตอบที่ยังมี [วงเล็บ] = ยังไม่ยืนยัน ห้ามส่งให้ Google (กติกาเนื้อหา PLAN ข้อ 5) */

const pending = (s) => /\[[^\]]*\]/.test(String(s))

/** FAQPage จากรายการ [คำถาม, คำตอบ] · ไม่มีข้อที่ยืนยันแล้วเลย = null */
export function faqSchema(items = []) {
  const ok = items.filter(([q, a]) => !pending(q) && !pending(a))
  if (!ok.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ok.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
}

/** ที่อยู่ไทยแยกช่อง: เลขที่+ถนน · ตำบล · อำเภอ · จังหวัด · รหัสไปรษณีย์ */
const thaiAddress = (s = '') => {
  const m = /^(.*?)\s+ตำบล(\S+)\s+(อำเภอ\S+)\s+จังหวัด(\S+)\s+(\d{5})$/.exec(s)
  if (!m) return { streetAddress: s }
  /* 17 พ.ย. 2026 A4: ตำบลอยู่ใน streetAddress (เดิมหายไป · PostalAddress ไม่มีช่องตำบล) */
  return { streetAddress: `${m[1]} ตำบล${m[2]}`, addressLocality: m[3], addressRegion: m[4], postalCode: m[5] }
}
/** 0975495941 → +66975495941 */
const intl = (tel = '') => (/^0\d{8,9}$/.test(tel) ? '+66' + tel.slice(1) : tel)

const DAYS = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' }
const DAY_KEYS = Object.keys(DAYS)
/** "Mo-Su 08:30-21:00" หรือ "Mo-Fr 08:30-18:00, Sa 09:00-12:00" → openingHoursSpecification (17 พ.ย. 2026 A4) */
export function openingHoursSpec(s = '') {
  return String(s).split(',').map((x) => x.trim()).filter(Boolean).map((part) => {
    const m = /^([A-Z][a-z])(?:-([A-Z][a-z]))?\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(part)
    if (!m) return null
    const a = DAY_KEYS.indexOf(m[1]), b = m[2] ? DAY_KEYS.indexOf(m[2]) : a
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_KEYS.slice(a, b + 1).map((d) => DAYS[d]), opens: m[3], closes: m[4] }
  }).filter(Boolean)
}
/** ช่วงราคาต่อตัวจาก prices.json · ไม่รวมพิมพ์ลาย (อาร์ต 17 พ.ย. 2026 ไม่เปิดราคาพิมพ์ลาย) → "฿170–390 ต่อตัว" */
export function priceRangeOf(prices, skip = ['print', 'warmup']) {
  const all = Object.entries(prices.products || {}).filter(([id]) => !skip.includes(id))
    .flatMap(([, p]) => (p.bands || []).flatMap((b) => Object.values(b.price || {}))).filter((v) => typeof v === 'number')
  return all.length ? `฿${Math.min(...all)}–${Math.max(...all)} ต่อตัว` : undefined
}

/** หน้าสินค้า: Product + AggregateOffer จาก prices.json (17 พ.ย. 2026 A5)
    ช่วงราคาต่อตัวทุกช่วงจำนวน · ขั้นต่ำ = ช่วงจำนวนแรก · ผู้ขาย = ธุรกิจ /#business
    สินค้าที่ไม่เปิดราคา (พิมพ์ลาย อาร์ต 17 พ.ย. · วอร์มไม่มีราคา) = null · ไม่ใส่ดาวรีวิว (Google ไม่นับรีวิวที่ธุรกิจเก็บเอง) */
export function productSchema(item, prices, site, path, description, skip = ['print']) {
  const p = prices.products?.[item.id]
  if (!p || skip.includes(item.id)) return null
  const bands = (p.bands || []).filter((b) => Object.values(b.price || {}).some((v) => typeof v === 'number'))
  const all = bands.flatMap((b) => Object.values(b.price)).filter((v) => typeof v === 'number')
  if (!all.length) return null
  const abs = (x) => site.baseUrl + x
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    ...(description ? { description } : {}),
    ...(item.img ? { image: abs(item.img) } : {}),
    brand: { '@type': 'Brand', name: site.brand },
    offers: { '@type': 'AggregateOffer', priceCurrency: 'THB', lowPrice: Math.min(...all), highPrice: Math.max(...all), eligibleQuantity: { '@type': 'QuantitativeValue', minValue: bands[0].min, unitText: 'ตัว' }, url: abs(path), seller: { '@id': abs('/#business') } },
  }
}

export function businessSchema(site, extra = {}) {
  const abs = (p) => site.baseUrl + p
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    /* @id ให้ Google รวมเป็นธุรกิจเดียวกับ schema ที่ปลั๊กอิน SEO ใส่ ไม่นับเป็น 2 ธุรกิจ */
    '@id': abs('/#business'),
    name: site.brand,
    alternateName: 'ทีมดี',
    legalName: 'บริษัท ดีดี ฟินิกซ์ จำกัด',
    description: 'รับทำเสื้อทีม เสื้อบริษัท โปโลปักโลโก้ เสื้อพิมพ์ลาย และเสื้อสกรีน',
    url: abs('/'),
    /* PNG สี่เหลี่ยม 180px (Google ไม่อ่าน SVG ที่ใช้สี currentColor · ขั้นต่ำ 112px) */
    logo: abs('/apple-touch-icon.png'),
    image: abs(site.ogImage),
    telephone: intl(site.phonePrimaryTel) || site.phonePrimary,
    ...(openingHoursSpec(site.openingHours).length ? { openingHoursSpecification: openingHoursSpec(site.openingHours) } : {}),
    ...(extra.priceRange ? { priceRange: extra.priceRange } : {}),
    ...(site.foundedYear ? { foundingDate: String(site.foundedYear) } : {}),
    address: { '@type': 'PostalAddress', addressRegion: 'นนทบุรี', ...thaiAddress(site.address), addressCountry: 'TH' },
    /* 17 พ.ย. 2026: LINE + Facebook + Instagram (site.json social) ให้ Google ผูกบัญชีเป็นธุรกิจเดียวกัน */
    ...([site.lineUrl, ...(site.social || [])].filter(Boolean).length ? { sameAs: [site.lineUrl, ...(site.social || [])].filter(Boolean) } : {}),
    ...(site.mapUrl ? { hasMap: site.mapUrl } : {}),
    ...(site.geo ? { geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng } } : {}),
    areaServed: 'TH',
  }
}

/** ชื่อแบบเสื้อแบบเดียวกับ alt รูป: "แบบ<ทรง> งาน<เทคนิค> รหัส TD-xxxx" */
export const designName = (d) => `แบบ${d.garmentName} งาน${d.techName} รหัส ${d.code}`

/** ItemList แบบเสื้อที่มีรหัส (หน้า /designs/ · ตรวจคำ SEO 26 ต.ค.) · ไม่มีแบบ = null */
export function designListSchema(designs = [], baseUrl = '') {
  if (!designs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: designs.length,
    itemListElement: designs.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: designName(d), image: baseUrl + d.img })),
  }
}

/** JSON สำหรับใส่ใน <script type="application/ld+json"> · กัน </script> ในข้อความปิดแท็กก่อนเวลา */
export const ldJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')
