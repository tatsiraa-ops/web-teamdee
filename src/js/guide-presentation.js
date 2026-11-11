/* Navigation only; factual content stays in the existing guide sources. */
export const guideLabels = {
  print: 'สั่งเสื้อพิมพ์ลาย', screen: 'สั่งเสื้อสกรีน', polo: 'สั่งเสื้อโปโลปัก',
  fabric: 'เลือกผ้า', size: 'ไซซ์และวิธีวัด', logo: 'เตรียมไฟล์และข้อมูล',
  delivery: 'จัดส่งและหลังการขาย', collar: 'เลือกทรงคอ',
}
const shortcuts = {
  print: [['start', 'ยังไม่มีแบบ เริ่มตรงไหน?'], ['options', 'ต้องเลือกสเปกอะไรบ้าง?'], ['confirm', 'ก่อนผลิต ต้องตรวจอะไร?']],
  screen: [['prepare', 'เริ่มสั่งสกรีน ต้องส่งอะไร?'], ['shirt', 'เลือกเสื้อและงานสกรีนอย่างไร?'], ['price', 'อะไรมีผลต่อราคา?']],
  polo: [['options', 'เลือกผ้าและทรงอย่างไร?'], ['artwork', 'โลโก้แบบไหนเหมาะกับงานปัก?'], ['confirm', 'ต้องอนุมัติอะไรบ้าง?']],
  fabric: [['how', 'ผ้าแบบไหนเหมาะกับงาน?'], ['texture', 'ดูเนื้อผ้าจริงได้ที่ไหน?'], ['compare', 'ผ้าแต่ละแบบต่างกันอย่างไร?']],
  size: [['table', 'ขอตารางไซซ์ตามทรงเสื้อ'], ['measure', 'วัดเสื้ออย่างไรให้ตรง?'], ['collect', 'รวมไซซ์ทั้งทีมอย่างไร?']],
  logo: [['files', 'ส่งโลโก้เป็นไฟล์อะไร?'], ['need', 'ข้อมูลอะไรต้องครบก่อนผลิต?'], ['check', 'ก่อนอนุมัติ ต้องเช็กอะไร?']],
  delivery: [['timing', 'ผลิตเสร็จแล้ว ได้เสื้อเมื่อไร?'], ['receive', 'รับเสื้อแล้วต้องตรวจอะไร?'], ['problem', 'พบปัญหา แจ้งอย่างไร?']],
  collar: [['shapes', 'ทรงคอหน้าตาเป็นอย่างไร?'], ['pick', 'งานนี้ควรเลือกคอแบบไหน?'], ['tech', 'ใช้กับเทคนิคอะไรได้บ้าง?']],
}
export function guidePresentation(item, guides) {
  const ids = new Set(item.sections.map(s => s.id))
  return {
    ...item,
    quickLinks: (shortcuts[item.id] || []).filter(([id]) => ids.has(id)).map(([id, label]) => ({ id, label })),
    guideNav: guides.filter(g => !g.hidden).map(g => ({ id: g.id, label: guideLabels[g.id] || g.name, current: g.id === item.id })),
    hasRoles: item.sections.some(s => s.tag || s.items?.some(i => i.tag) || s.parts?.some(p => p.tag)),
  }
}
