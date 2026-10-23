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
  return { streetAddress: m[1], addressLocality: m[3], addressRegion: m[4], postalCode: m[5] }
}
/** 0975495941 → +66975495941 */
const intl = (tel = '') => (/^0\d{8,9}$/.test(tel) ? '+66' + tel.slice(1) : tel)

export function businessSchema(site) {
  const abs = (p) => site.baseUrl + p
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    /* @id ให้ Google รวมเป็นธุรกิจเดียวกับ schema ที่ปลั๊กอิน SEO ใส่ ไม่นับเป็น 2 ธุรกิจ */
    '@id': abs('/#business'),
    name: site.brand,
    legalName: 'บริษัท ดีดี ฟินิกซ์ จำกัด',
    description: 'รับทำเสื้อทีม เสื้อบริษัท โปโลปักโลโก้ เสื้อพิมพ์ลาย และเสื้อสกรีน',
    url: abs('/'),
    logo: abs('/logo/teamdee-stacked.svg'),
    image: abs(site.ogImage),
    telephone: intl(site.phonePrimaryTel) || site.phonePrimary,
    openingHours: site.openingHours,
    ...(site.foundedYear ? { foundingDate: String(site.foundedYear) } : {}),
    address: { '@type': 'PostalAddress', addressRegion: 'นนทบุรี', ...thaiAddress(site.address), addressCountry: 'TH' },
    ...(site.lineUrl ? { sameAs: [site.lineUrl] } : {}),
    areaServed: 'TH',
  }
}

/** JSON สำหรับใส่ใน <script type="application/ld+json"> · กัน </script> ในข้อความปิดแท็กก่อนเวลา */
export const ldJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')
