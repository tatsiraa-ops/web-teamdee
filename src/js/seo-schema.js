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

export function businessSchema(site) {
  const abs = (p) => site.baseUrl + p
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.brand,
    legalName: 'บริษัท ดีดี ฟินิกซ์ จำกัด',
    description: 'โรงงานรับผลิตเสื้อโปโล เสื้อยูนิฟอร์ม และเสื้อทีม ทั้งปักโลโก้และพิมพ์ลาย',
    url: abs('/'),
    logo: abs('/logo/teamdee-stacked.svg'),
    image: abs(site.ogImage),
    telephone: site.phonePrimary,
    openingHours: site.openingHours,
    address: { '@type': 'PostalAddress', streetAddress: site.address, addressRegion: 'นนทบุรี', addressCountry: 'TH' },
    areaServed: 'TH',
  }
}

/** JSON สำหรับใส่ใน <script type="application/ld+json"> · กัน </script> ในข้อความปิดแท็กก่อนเวลา */
export const ldJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')
