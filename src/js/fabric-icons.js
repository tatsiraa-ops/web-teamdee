/* ไอคอนจุดเด่นผ้า (การ์ดสะสมผ้า /sublimation/ รอบ 185) · SVG เส้น 24×24 วาดเอง ไม่ใช้อีโมจิ
   ใช้ทั้งใน vite.config.js (สร้าง sprite + เลือกไอคอนตอน build) และเทส */
export const FABRIC_ICONS = {
  air: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  dry: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  stretch: '<path d="M3 12h18"/><path d="M7 8l-4 4 4 4"/><path d="M17 8l4 4-4 4"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  crease: '<path d="M3 17h16a2 2 0 0 0 2-2v-1a6 6 0 0 0-6-6H9"/><path d="M3 17l2.5-6H15"/><path d="M7 20h10"/>',
  shape: '<path d="M8.5 3 3 6l2 4 3-1.2V21h8V8.8l3 1.2 2-4-5.5-3a3.5 3.5 0 0 1-7 0z"/>',
  spark: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/><path d="M19 3v3M17.5 4.5h3"/>',
  lint: '<circle cx="12" cy="12" r="8"/><path d="M6.3 6.3l11.4 11.4"/>',
  care: '<path d="M20 6 9 17l-5-5"/>',
  soft: '<path d="M20 4C12 4 6 10 6 18v2"/><path d="M6 18c6 0 12-4 14-14"/><path d="M10 14h5"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
  /* เหมาะกับ (รอบ 186 แทนไอคอน 3D) */
  'u-event': '<path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
  'u-team': '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0 1 21 19"/>',
  'u-corp': '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-3h4v3"/>',
  'u-run': '<circle cx="15" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v5"/><path d="M6 12l3-4 4 1 3 4 3 1"/><path d="M11 15l2-5"/>',
  'u-badminton': '<path d="M14 10 5 19"/><path d="M14 10l2-6 4 4-6 2z"/><path d="M16 4l4 4"/><circle cx="5" cy="19" r="1.5"/>',
  'u-sport': '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/><path d="M12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5 7 18.5M8 10 3.5 8.5"/>',
  'u-uniform': '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M10 4V3h4v1"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 17a3.5 3.5 0 0 1 7 0"/>',
  'u-work': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M3 12h18"/>',
  'u-craft': '<path d="M4 15a8 8 0 0 1 16 0"/><path d="M2 15h20v2H2z"/><path d="M10 7V4h4v3"/>',
  'u-fashion': '<path d="M12 6a2 2 0 1 1 2 2c-1 0-2 .7-2 2"/><path d="M12 10 3 17h18z"/>',
}

/* คำเหมาะกับ → ไอคอนเส้น */
export const USE_ICON = { 'กิจกรรม': 'u-event', 'ทีม': 'u-team', 'องค์กร': 'u-corp', 'หน่วยงาน': 'u-corp', 'วิ่ง': 'u-run', 'แบดมินตัน': 'u-badminton', 'กีฬา': 'u-sport', 'ออกกำลังกาย': 'u-sport', 'ยูนิฟอร์ม': 'u-uniform', 'ทำงาน': 'u-work', 'ช่าง': 'u-craft', 'แฟชั่น': 'u-fashion' }

/* คำจุดเด่น → ไอคอน · เรียงลำดับสำคัญ คำที่มีหลายเรื่องใช้เรื่องแรกที่ตรง */
const RULES = [
  ['crease', /ยับ|รีด/],
  ['dry', /แห้ง/],
  ['drop', /เหงื่อ/],
  ['air', /ระบาย|อับ/],
  ['stretch', /ยืด/],
  ['shield', /ทน/],
  ['lint', /ขน/],
  ['shape', /ทรง|คงรูป|แนบ/],
  ['spark', /ลาย|มิติ/],
  ['care', /ดูแล/],
  ['soft', /นุ่ม|เบา|บาง|สัมผัส|เงา/],
]

export const iconFor = (tag) => (RULES.find(([, re]) => re.test(tag)) || ['dot'])[0]
