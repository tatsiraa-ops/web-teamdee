/* หัวข้อภาษาไทย: ห่อแต่ละวลี (คั่นด้วยเว้นวรรค) ด้วย inline-block ให้ตัดบรรทัดได้เฉพาะที่เว้นวรรค
   แทน text-wrap:balance ที่เกลี่ยบรรทัดแล้วหักกลางคำ เช่น "ทีม | ดี" (ตรวจหน้าแรก 22 ต.ค. 2026)
   " / " และ " · " ติดกับวลีหน้า บรรทัดใหม่จึงไม่ขึ้นต้นด้วย "/" หรือ "·" (24 ต.ค.) · ใช้ใน template ด้วย {{{ph ข้อความ}}}
   ใช้กับย่อหน้ายาวได้ · วลีที่ยาวเกินบรรทัด inline-block จะหดเท่ากล่องแล้วตัดข้างในเอง ไม่ล้นจอ
   ตัวเลขล้วน (264 · 30 · 8:30 – 21:00) ติดคำถัดไป ตัวท้ายสุดติดคำก่อนหน้า ไม่ให้ตกบรรทัดเดียวโดดๆ (ตรวจ 23 ต.ค.) */
export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const NUM = /^[\d.,:+%–\u00a0\u2060-]+$/

/* แยกเป็นวลี (ยังไม่ escape) · ใช้ร่วมกับตัวจัดคำตอน build (thai-break.js) */
export const phraseWords = (s) => {
  const raw = String(s ?? '').trim().replace(/ ([/·]) /g, '\u00a0$1 ').split(/ +/).filter(Boolean)
  const words = []
  for (let i = 0; i < raw.length; i++) {
    let g = raw[i]
    let numOnly = NUM.test(g)
    while (NUM.test(raw[i]) && i + 1 < raw.length) { i++; g += ' ' + raw[i]; numOnly = numOnly && NUM.test(raw[i]) }
    if (numOnly && words.length) words[words.length - 1] += ' ' + g
    else words.push(g)
  }
  return words.map((w) => w.replace(/\u00a0/g, ' '))
}

export const phrases = (s) => phraseWords(s).map((w) => `<span class="inline-block">${esc(w)}</span>`).join(' ')

/* บรรทัดข้อมูลที่คั่นด้วย " · " (เช่น ราคาใต้ H1 หน้าคำนวณ): ตัดบรรทัดได้เฉพาะที่จุดคั่น · "·" ติดท้ายก้อนหน้า
   ก้อนที่ยาวเกิน 34 ตัวอักษรไม่บังคับก้อนเดียว (จอ 320 ใส่ไม่พอ) กลับไปห่อทีละวลีแทน (มือถือ 26 ต.ค. "ไม่ตัดบรรทัดแปลกๆ") */
export const chunks = (s) => {
  const parts = String(s ?? '').trim().split(/ · /).filter(Boolean)
  return parts.map((p, i) => {
    const t = i < parts.length - 1 ? `${p} ·` : p
    return t.length > 34 ? phrases(t) : `<span class="inline-block">${esc(t)}</span>`
  }).join(' ')
}
