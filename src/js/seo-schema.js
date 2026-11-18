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
/** ราคาต่อตัวทุกตัวของสินค้า · สกรีน DTF (18 พ.ย. 2026) = เสื้อ C32 + สกรีนจุดแรก จากเมทริกซ์ (ไม่รวม Oversize / จุดเพิ่ม / เสื้อของลูกค้า)
    ขั้นต่ำ = ช่วงจำนวนแรก */
const offerPrices = (p) => (p.own
  ? { all: Object.values(p.own.first).flat(), min: p.minQty }
  : (() => {
      const bands = (p.bands || []).filter((b) => Object.values(b.price || {}).some((v) => typeof v === 'number'))
      return { all: bands.flatMap((b) => Object.values(b.price)).filter((v) => typeof v === 'number'), min: bands[0]?.min }
    })())

/** ช่วงราคาต่อตัวจาก prices.json · ไม่รวมพิมพ์ลาย (อาร์ต 17 พ.ย. 2026 ไม่เปิดราคาพิมพ์ลาย) → "฿145–390 ต่อตัว" */
export function priceRangeOf(prices, skip = ['print', 'warmup']) {
  const all = Object.entries(prices.products || {}).filter(([id]) => !skip.includes(id)).flatMap(([, p]) => offerPrices(p).all)
  return all.length ? `฿${Math.min(...all)}–${Math.max(...all)} ต่อตัว` : undefined
}

/** หน้าสินค้า: Product + AggregateOffer จาก prices.json (17 พ.ย. 2026 A5)
    ช่วงราคาต่อตัวทุกช่วงจำนวน · ขั้นต่ำ = ช่วงจำนวนแรก · ผู้ขาย = ธุรกิจ /#business
    สินค้าที่ไม่เปิดราคา (พิมพ์ลาย อาร์ต 17 พ.ย. · วอร์มไม่มีราคา) = null · ไม่ใส่ดาวรีวิว (Google ไม่นับรีวิวที่ธุรกิจเก็บเอง) */
export function productSchema(item, prices, site, path, description, skip = ['print'], extra = {}) {
  const p = prices.products?.[item.id]
  if (!p || skip.includes(item.id)) return null
  const { all, min } = offerPrices(p)
  if (!all.length) return null
  const abs = (x) => site.baseUrl + x
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    ...(description ? { description } : {}),
    ...(item.img ? { image: abs(item.img) } : {}),
    brand: { '@type': 'Brand', name: site.brand },
    offers: { '@type': 'AggregateOffer', priceCurrency: 'THB', lowPrice: Math.min(...all), highPrice: Math.max(...all), eligibleQuantity: { '@type': 'QuantitativeValue', minValue: min, unitText: 'ตัว' }, url: abs(path), seller: { '@id': abs('/#business') } },
    ...extra,
  }
}

/** 18 พ.ย. 2026 SEO รอบ 2 หน้าสกรีน: Product (เสื้อ + สกรีน) + Service (รับสกรีนเสื้อ 2 แบบ) ในก้อนเดียว (@graph)
    ตัวเลขทั้งหมดจาก prices.json products.screen · ไม่มีดาวรีวิว · tests/screen-seo-1118.test.js */
export function screenSchema(item, prices, site, path, description, images = []) {
  const S = prices.products?.screen
  if (!S) return null
  const abs = (x) => site.baseUrl + x
  const prem = S.shirts[0]
  const product = productSchema(item, prices, site, path, description, [], {
    name: 'เสื้อสกรีน DTF สั่งทำ',
    ...(images.length ? { image: images.map(abs) } : {}),
    category: 'เสื้อยืดสกรีน',
    material: 'Cotton 100%',
    color: prem.colors.map((c) => c[0]),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'สั่งขั้นต่ำ', value: `${S.minQty} ตัว` },
      { '@type': 'PropertyValue', name: 'ขนาดลาย', value: `${S.sizes.map((z) => z.id).join(' ')} สูงสุด ${S.extra.maxSpots} จุดต่อตัว` },
      { '@type': 'PropertyValue', name: 'รุ่นเสื้อ', value: S.shirts.map((x) => x.name).join(' · ') },
      { '@type': 'PropertyValue', name: 'ระยะผลิต', value: S.lead.map(([a, b, d]) => `${a}–${b} ตัว ${d}`).join(' · ') },
    ],
  })
  if (!product) return null
  delete product['@context']
  /* ราคาต่อตัวเป็นช่วง (ต่ำสุดที่จำนวนมาก · สูงสุดที่ช่วงแรก) ไม่ใช้ราคาเดียวคู่กับขั้นต่ำ (จะเข้าใจว่าสั่งน้อยได้ราคาต่ำสุด) */
  const range = (m) => { const v = Object.values(m).flat(); return { lowPrice: Math.min(...v), highPrice: Math.max(...v) } }
  const offer = (name, min, m) => ({ '@type': 'AggregateOffer', name, priceCurrency: 'THB', ...range(m), eligibleQuantity: { '@type': 'QuantitativeValue', minValue: min, unitText: 'ตัว' }, url: abs(path) })
  const service = {
    '@type': 'Service',
    name: 'รับสกรีนเสื้อ DTF',
    serviceType: 'สกรีนเสื้อ DTF',
    description,
    url: abs(path),
    provider: { '@id': abs('/#business') },
    areaServed: { '@type': 'Country', name: 'Thailand' },
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'บริการสกรีนเสื้อ DTF', itemListElement: [
      offer('เสื้อ + สกรีน DTF จุดแรก (บาทต่อตัว รวม VAT)', S.minQty, S.own.first),
      offer('สกรีน DTF บนเสื้อของลูกค้า จุดแรก (บาทต่อตัว รวม VAT)', S.customer.minQty, S.customer.first),
    ] },
  }
  return { '@context': 'https://schema.org', '@graph': [product, service] }
}

export function businessSchema(site, extra = {}) {
  const abs = (p) => site.baseUrl + p
  const hours = openingHoursSpec(site.openingHours)
  const sameAs = [site.lineUrl, ...(site.social || [])].filter(Boolean)
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
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    ...(extra.priceRange ? { priceRange: extra.priceRange } : {}),
    ...(site.foundedYear ? { foundingDate: String(site.foundedYear) } : {}),
    address: { '@type': 'PostalAddress', addressRegion: 'นนทบุรี', ...thaiAddress(site.address), addressCountry: 'TH' },
    /* 17 พ.ย. 2026: LINE + Facebook + Instagram (site.json social) ให้ Google ผูกบัญชีเป็นธุรกิจเดียวกัน */
    ...(sameAs.length ? { sameAs } : {}),
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
