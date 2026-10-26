/* หัวข้อภาษาไทย: ห่อแต่ละวลี (คั่นด้วยเว้นวรรค) ด้วย inline-block ให้ตัดบรรทัดได้เฉพาะที่เว้นวรรค
   แทน text-wrap:balance ที่เกลี่ยบรรทัดแล้วหักกลางคำ เช่น "ทีม | ดี" (ตรวจหน้าแรก 22 ต.ค. 2026)
   " / " และ " · " ติดกับวลีหน้า บรรทัดใหม่จึงไม่ขึ้นต้นด้วย "/" หรือ "·" (24 ต.ค.) · ใช้ใน template ด้วย {{{ph ข้อความ}}}
   ใช้กับย่อหน้ายาวได้ · วลีที่ยาวเกินบรรทัด inline-block จะหดเท่ากล่องแล้วตัดข้างในเอง ไม่ล้นจอ
   ตัวเลขล้วน (264 · 30 · 8:30 – 21:00) ติดคำถัดไป ตัวท้ายสุดติดคำก่อนหน้า ไม่ให้ตกบรรทัดเดียวโดดๆ (ตรวจ 23 ต.ค.) */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const NUM = /^[\d.,:+%–\u00a0\u2060-]+$/

export const phrases = (s) => {
  const raw = String(s ?? '').trim().replace(/ ([/·]) /g, '\u00a0$1 ').split(/ +/).filter(Boolean)
  const words = []
  for (let i = 0; i < raw.length; i++) {
    let g = raw[i]
    let numOnly = NUM.test(g)
    while (NUM.test(raw[i]) && i + 1 < raw.length) { i++; g += ' ' + raw[i]; numOnly = numOnly && NUM.test(raw[i]) }
    if (numOnly && words.length) words[words.length - 1] += ' ' + g
    else words.push(g)
  }
  return words.map((w) => `<span class="inline-block">${esc(w.replace(/\u00a0/g, ' '))}</span>`).join(' ')
}
