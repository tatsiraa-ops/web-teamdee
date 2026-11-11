export const companyUses = {
  daily: { name: 'ใส่ทำงานทุกวัน', label: 'EVERYDAY TEAM', title: 'เรียบร้อยตอนพบลูกค้า\nคล่องตัวตลอดวันทำงาน', description: 'เริ่มดูเสื้อโปโลปักสำหรับภาพลักษณ์ที่เป็นระเบียบ แล้วเลือกผ้าและทรงตามงานในอาคารหรือการออกพื้นที่', product: 'เสื้อโปโลปักโลโก้', check: 'ลักษณะงาน · สีองค์กร · ผ้า · ตำแหน่งปัก', alternative: 'เสื้อพิมพ์ลาย เมื่ออยากวางกราฟิกหรือสีเฉพาะทั้งตัว', image: '/img/customer/co03.webp', alt: 'ทีมลูกค้าใส่เสื้อโปโลที่ทีมดีผลิต', caption: 'ภาพลูกค้าเสื้อโปโลของทีมดี · ตัวอย่างแนวทาง ไม่ใช่สเปกตายตัว', path: '/embroidery/', kind: 'polo' },
  booth: { name: 'ออกบูธ / พบลูกค้า', label: 'MAKE YOUR BRAND VISIBLE', title: 'ให้ลูกค้ามองเห็น\nว่าใครคือทีมของคุณ', description: 'เริ่มจากสีองค์กรและระยะที่อยากให้มองเห็นโลโก้ เสื้อพิมพ์ลายช่วยวางกราฟิกได้ทั้งตัว ส่วนโปโลปักเป็นอีกทางเลือกสำหรับงานที่ต้องการความเรียบร้อย', product: 'เสื้อพิมพ์ลายสีองค์กร', check: 'สีแบรนด์ · ขนาดโลโก้ · งานในอาคารหรือกลางแจ้ง', alternative: 'เสื้อโปโลปัก สำหรับทีมต้อนรับหรือพบลูกค้าในบรรยากาศทางการ', image: '/img/real/r23.jpg', alt: 'ทีม S.C. Used Car ใส่เสื้อทีมสีแดง', caption: 'ภาพลูกค้าจริง แสดงการใช้สีร่วมกันทั้งทีม · ไม่ใช่ภาพยืนยันงานออกบูธ', path: '/sublimation/', kind: 'collar' },
  outing: { name: 'Outing / กิจกรรม', label: 'ONE DAY. ONE TEAM.', title: 'วันที่ออกจากโต๊ะทำงาน\nมาอยู่ในภาพเดียวกัน', description: 'เริ่มจากธีมกิจกรรม สี และข้อความที่อยากให้เป็นภาพจำ เสื้อพิมพ์ลายเหมาะกับการเล่าเรื่องผ่านกราฟิกของทีม', product: 'เสื้อพิมพ์ลายตามธีมงาน', check: 'ธีมงาน · ความคล่องตัว · จำนวน · วันที่ต้องรับเสื้อ', alternative: 'เสื้อสกรีน เมื่ออยากเน้นข้อความหรือโลโก้บนเสื้อพื้น', image: '/img/case/fti-team.webp', alt: 'ทีม FTI ใส่เสื้อในกิจกรรม Outing 2026', caption: 'FTI Outing 2026 · ภาพวันใช้งานจริงของลูกค้าทีมดี', path: '/sublimation/', kind: 'round' },
}

export function companyBrief({use='daily',qty='',date=''}, today='') {
  const selected = companyUses[use] ? use : 'daily'
  const work = companyUses[selected]
  const quantity = String(qty).trim()
  const errors = []
  if (quantity && (!/^\d+$/.test(quantity) || Number(quantity)<10 || Number(quantity)>100000)) errors.push('ระบุจำนวนเต็มตั้งแต่ 10 ถึง 100,000 ตัว หรือเว้นไว้คุยกับทีมดี')
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0,10)===date
  if (date && (!validDate || (today && date<today))) errors.push('เลือกวันรับเสื้อตั้งแต่วันนี้เป็นต้นไป หรือเว้นไว้ก่อน')
  const summary = `เสื้อบริษัท · ${work.name} · ${quantity ? quantity+' ตัว' : 'ยังไม่ระบุจำนวน'} · ${date ? 'ต้องการรับ '+date : 'ยังไม่ระบุวันรับ'}`
  const params = new URLSearchParams({u:'corp',p:selected==='daily'?'polo':'print',from:summary})
  if (quantity && !errors.length) params.set('qty',quantity)
  if (date && validDate) params.set('date',date)
  return {errors,summary,contact:'/contact-us/?'+params.toString(),line:'https://line.me/R/oaMessage/@teamdee/?'+encodeURIComponent('สวัสดี ทีมดี ขอปรึกษา'+summary+'\nรบกวนช่วยเลือกแนวเสื้อและตรวจแผนผลิตให้หน่อยครับ/ค่ะ')}
}
