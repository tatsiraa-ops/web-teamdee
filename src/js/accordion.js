/* FAQ แบบกดเปิดปิด (preline accordion)
   ห้าม import 'preline/plugins/accordion' เฉยๆ · package.json ของ preline ประกาศ sideEffects ไว้แค่ index
   ตอน build Vite จึงตัดไฟล์นั้นทิ้งทั้งก้อน FAQ บนเว็บจริงกดไม่ได้ (เจอ 21 ต.ค. 2026 · dev ไม่เป็น)
   ใช้รุ่น non-auto ที่ export คลาสออกมา แล้วเรียก autoInit เอง · tests/seo-pages.test.js ตรวจว่า build ยังมีโค้ดนี้ */
import HSAccordion from 'preline/plugins/accordion-non-auto'

export function initAccordion() {
  window.HSAccordion = HSAccordion
  HSAccordion.autoInit()
}
