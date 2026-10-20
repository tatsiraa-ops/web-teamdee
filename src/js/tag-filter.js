/* แท็กทรงเสื้อในหน้าสินค้า (เสื้อวิ่ง / ฟุตบอล ยังไม่แยกหน้า · Wireframe v2 ส่วน 2b)
   รับรายการทรงของแต่ละรูป คืนว่ารูปไหนโชว์ · แท็กที่ไม่มีจริงถือเป็น "ทั้งหมด" ตารางจะได้ไม่ว่าง */
export const shownFor = (garments, tag, max) => {
  const real = tag && tag !== 'all' && garments.includes(tag) ? tag : 'all'
  let left = max
  return garments.map((g) => {
    if (left <= 0 || (real !== 'all' && g !== real)) return false
    left--
    return true
  })
}
