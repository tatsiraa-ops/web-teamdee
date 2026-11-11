# ตรวจทั้งเว็บ TEAMDEE — 28–29 ตุลาคม 2026

## ผลตัดสิน

โครงสร้างหลักและการใช้งานที่ทดสอบผ่าน แต่ยังไม่ควรรับรองว่าพร้อมทุกหน้าหรือพร้อมเผยแพร่: ชุด WordPress ในเครื่องขาดเนื้อหา CMS, บางหน้ามีคำสัญญาที่ข้อมูลยังไม่รองรับ และมีรายละเอียด UI ที่ควรปรับต่อ

## ขอบเขตที่ตรวจจริง

- 159 HTML ต้นฉบับ: แยกทะเบียนหน้าที่ส่งออกกับหน้าร่าง/ภายใน ไม่เปิดเผยหน้าที่ตั้งใจซ่อน
- 48 หน้าที่ export สู่ WordPress :9400 ตรวจ DOM ที่ 320 / 375 / 768 / 1440px รวม 192 ชุด: H1, document overflow, ID ซ้ำ, anchor และภาพที่โหลดแล้ว
- ภาพหน้าจอส่วนบนครบ 48 หน้า × มือถือ 375px และคอม 1280px รวม 96 ภาพ; ตรวจภาพรวมทั้งสองขนาด แผ่นรวม 8 ไฟล์
- ตรวจอีก 18 URL ที่เว็บลิงก์ไปและต้องใช้ CMS เดิม
- ตรวจสถานะเริ่มต้นหน้าแรก team / classic / scroll ที่ 375 และ 1440px (ไม่ใช่การรับรองทุกเฟรมของ animation)
- ทดสอบเส้นทางใช้งานร่วม: เมนูมือถือ/Escape, ฟอร์มว่าง, รหัสแบบเข้าฟอร์ม, เลือก/ยกเลิกแบบ, ภาพใหญ่, FAQ พบ/ไม่พบ, ค้นหา DFT, จำนวนและช่วงราคา, เทียบผ้า, เปิดแผงคุกกี้, thank-you เข้าโดยตรง
- ตรวจไฟล์ภาพ src และ anchor ข้ามหน้าจาก build: ไม่พบไฟล์หายหรือ static anchor หาย
- npm test รอบนี้: 314 tests / ผ่าน 313 / ไม่ผ่าน 0 / ข้าม 1 (PHP CLI ไม่พร้อม)

ข้อจำกัด: viewport มือถือ/แท็บเล็ตใช้ iframe บนเบราว์เซอร์เดียว ไม่ใช่ iPhone/Android จริง ไม่ได้จำลอง offline/slow network, zoom 200%, screen reader หรือทุกรูปแบบการตั้งค่าระบบ ไม่ได้ตรวจทุกภาพลูกค้าแบบเปิดเต็มจอในรอบนี้ ภาพ lazy ที่ยังไม่โหลดไม่ถูกนับว่าโหลดผ่าน ตรวจการมีไฟล์แยกต่างหาก ไม่ได้ส่งฟอร์มจริง/ข้อความ LINE หรือทดสอบ GTM กับบัญชีจริง และไม่มี staging URL ให้ตรวจ จึงไม่อ้างว่าครบทุกสถานะที่เป็นไปได้

## สิ่งที่ควรจัดการตามลำดับ

### P1 — ชุดทดสอบ WordPress ขาดเนื้อหา CMS ที่หน้าเว็บพาไป

บทความเดิม 12 หน้า, category 3 หน้า และ /terms-conditions/ รวม 16 URL ขึ้นหน้าไม่พบข้อมูล ตรวจผ่านการเปิดหน้าแล้ว นี่เป็นช่องว่างใน local environment ไม่ใช่หลักฐานว่าเว็บจริง 404 ทั้งหมด ต้องนำเนื้อหา CMS เดิมมาไว้ในชุดทดสอบหรือทดสอบกับ staging ก่อนรับรองเส้นทางจากบทความ/ค้นหา/หน้าแรก

/privacy-policy/ เป็นหน้าเริ่มต้นภาษาอังกฤษของ WordPress ที่มี “Suggested text” และ URL localhost ส่วน /collar-styles/ มีแค่ชื่อหน้าและวันที่ ลิงก์จากเครื่องคำนวณกับหน้าสินค้าจึงพาไปเนื้อหาที่ยังช่วยตัดสินใจไม่ได้ คงข้อกำหนดเดิมว่าไม่เปิดเผยคู่มือที่ยังไม่พร้อม

### P2 — หน้าไซซ์ชวนดูตารางที่ยังไม่มี

/size-chart/ ใช้ชื่อ “ตารางไซซ์” ปุ่ม “ดูตารางขนาดอ้างอิง” และข้อความว่าคู่มือนี้มีตาราง แต่ส่วนจริงแจ้งรอยืนยันฝ่ายผลิต การรอข้อมูลเป็นไปตามคำสั่งผู้ใช้เดิม ปัญหาคือคำอธิบาย/CTA ต้องตรงสถานะ ควรพาไปขอตารางตามทรงและสินค้า จนกว่ามีข้อมูลยืนยัน

### P2 — หน้าเสื้อวอร์มส่วนบนยังเว้นพื้นที่สินค้าเปล่า

/custom-printed-warmup-shirts/ บนคอมมีข้อความซ้ายและพื้นที่ขวาว่าง ไม่มีภาพสินค้าเหมือนหน้าพิมพ์ลาย/เบสบอล ทำให้หน้าดูยังไม่เสร็จ ทั้งที่มีภาพทรงอยู่ส่วนล่างแล้ว ควรนำภาพที่ระบุชัดว่าเป็นภาพประกอบทรงมาจัดส่วนบน หรือปรับเป็น hero เต็มความกว้างที่ตั้งใจเว้นพื้นที่

### P2 — หน้าแบบเสื้อใช้ส่วนหัวสูงก่อนเห็นแบบ

เช่น /corporate-shirts/, /educations-shirt/, /staff-shirt-designs/ และหมวดอื่นส่วนใหญ่ บนมือถือจอแรกหมดไปกับชื่อ คำอธิบาย และปุ่มกลับบริการ ภาพแบบที่เป็นเหตุผลหลักในการเข้าหน้าอยู่ล่างจอ ควรย่อส่วนหัวและนำภาพ/ตัวเลือกขึ้นก่อน ปุ่มกลับบริการเป็นลิงก์รอง

### P2 — การพร้อมด้าน SEO ยังมีงานค้างโดยตั้งใจ

/polo-vs-printed-shirts/, /team-shirt-design-ideas/, /team-shirt-fabric-guide/, /team-shirt-order-checklist/ ยัง noindex ตามคอมเมนต์รอผู้ตรวจ/ผู้เขียน ไม่ควรเอา noindex ออกอัตโนมัติ แต่ต้องแยกสถานะ “เปิดอ่านได้” กับ “พร้อม SEO” ในรายการส่งมอบ

### P3 — ID ของกล่องภาพขยายซ้ำ

lightbox.js ใช้ id="lbCap" ทุก instance จึงซ้ำบนหน้าที่มีหลายแกลเลอรี ไม่พบว่าทำให้ภาพเปิดผิดในเส้นทางที่ลอง แต่ HTML ไม่สะอาดและการอ้าง ID ในอนาคตอาจจับผิดตัว ควรใช้ ID เฉพาะ instance หรือเอา ID ที่ไม่ได้ใช้ออก

### ข้อสังเกต UX ที่ต้องพิจารณา ไม่ใช่บั๊กจากความยาวอย่างเดียว

หน้าสินค้า/กลุ่มลูกค้าหลายหน้ายาว 14,000–17,000px บนมือถือ โดยมี CTA และคำอธิบายต่อกันหลายส่วน ควรตรวจการซ้ำของเนื้อหาและระยะจากหลักฐานถึงจุดขอราคา ความยาวอย่างเดียวไม่ใช่เหตุผลให้ตัดข้อมูล ส่วนหัวคู่มือและเมนูมือถือมีพื้นที่/รายการมาก ควรทดสอบกับผู้ซื้อเพื่อจัดลำดับ ไม่ต้องรื้อรูปแบบทั้งเว็บเพียงเพราะผ่าน/ไม่ผ่านตัวเลข

## สิ่งที่ลองแล้วผ่าน

- ทุกหน้า exported มี H1 เดียว; ไม่พบ document overflow ทั้ง 192 ชุด
- ไฟล์ภาพ src ใน build มีครบ; ไม่พบ static anchor ข้ามหน้าหาย
- สารบัญบทความทั้ง 4 หน้า anchor ภาษาไทยตรง ID หลัง decode (รายการตรวจดิบใน JSON ที่เป็น percent encoding ไม่ใช่ลิงก์เสีย)
- จำนวน 51 ตัวโปโลจูติ = 210 บาท/ตัว รวม 10,710 บาท; พิมพ์ 1 แล้วออกจากช่องจริงปรับเป็นขั้นต่ำ 10 พร้อมคำเตือนและรวม 2,200 บาท
- เลือก TD-0103 เปิดภาพใหญ่ เลือก/ยกเลิก และพารหัสเข้ารายละเอียดฟอร์มถูกต้อง นำรายการทดสอบออกแล้ว
- ฟอร์มว่างบังคับชื่อและเบอร์ ไม่ส่งข้อมูล; เปิด thank-you ตรง ๆ แจ้งว่ายังไม่มีข้อมูลยืนยันการส่ง
- FAQ คำว่า “ขั้นต่ำ” พบ 1 คำตอบ และคำที่ไม่มีผลลัพธ์มีทางเลือกต่อ
- ค้นหารวม DFT พบ 5 รายการรวมบทความ/สินค้า/คู่มือ แต่บทความปลายทางยังขาดใน local CMS ตามข้อ P1
- เครื่องมือเทียบผ้าเปลี่ยนเป็นดรายเทคแล้วรูป 1200px โหลดได้
- เมนูมือถือเปิดและ Escape ปิด/คืน focus; แผงคุกกี้เปิดได้ ไม่เปลี่ยนความยินยอมในรอบนี้

## ถอนข้อสรุปที่เกิดจากเครื่องมือทดสอบ

เครื่องมือ fill ค่า 1 ไม่ส่ง change event เหมือนการพิมพ์จริง ทำให้ภาพ calculator-stale.png แสดงยอดเก่าชั่วคราว เมื่อยืนยันด้วยการพิมพ์คีย์บอร์ดและ Tab ระบบทำงานถูกต้อง จึง **ไม่ถือเป็นบั๊กที่ยืนยันแล้ว** และห้ามนำภาพนี้ไปอ้างว่าเครื่องคิดผิด ผลนี้ได้แจ้งแก้ไขแก่ผู้ใช้แล้ว

## รายการ URL ที่เนื้อหาขาดใน local CMS

- /terms-conditions/
- /what-is-dft-shirt-printing-durability-guide/
- /sublimation-sportswear-designs/
- /event-sports-day-t-shirt-timeline-management/
- /polo-shirt-size-chart-uniform-guide/
- /how-to-start-clothing-brand-production-guide/
- /garment-production-cost-structure-bulk-order/
- /how-to-choose-garment-factory-checklist/
- /choose-uniform-manufacturer-checklist/
- /sports-running-shirt-fabric-guide/
- /polo-shirt-fabric-guide/
- /shirt-production-techniques-guide/
- /how-to-design-sportswear-color-guide/
- /category/purchasing-guide/
- /category/fabric-technique/
- /category/sportswear-sublimation/

## หน้าที่พบ ID ซ้ำ

- /corporate/
- /custom-baseball-shirts/
- /custom-class-shirts/
- /custom-organization-shirts/
- /custom-university-shirts/
- /education/
- /event/
- /project/
- /sport/
- /sublimation/

## ทะเบียนตรวจ 48 หน้า

| หน้า | 320 / 375 / 768 / 1440 | ภาพคอม/มือถือ | หมายเหตุ |
|---|---|---|---|
| /audit-missing-page/ | ไม่ล้น | screens/00.png และ desktop-00.png | ทดสอบ 404 โดยตั้งใจ |
| /about-us/ | ไม่ล้น | screens/01.png และ desktop-01.png | โครงสร้างผ่าน |
| /artwork-preparation-guide/ | ไม่ล้น | screens/02.png และ desktop-02.png | โครงสร้างผ่าน |
| /badminton-shirt-designs/ | ไม่ล้น | screens/03.png และ desktop-03.png | โครงสร้างผ่าน |
| /blog/ | ไม่ล้น | screens/04.png และ desktop-04.png | โครงสร้างผ่าน |
| /calculations/ | ไม่ล้น | screens/05.png และ desktop-05.png | โครงสร้างผ่าน |
| /class-shirt-designs/ | ไม่ล้น | screens/06.png และ desktop-06.png | โครงสร้างผ่าน |
| /contact-us/ | ไม่ล้น | screens/07.png และ desktop-07.png | โครงสร้างผ่าน |
| /corporate/ | ไม่ล้น | screens/08.png และ desktop-08.png | ID lbCap ซ้ำ |
| /corporate-shirts/ | ไม่ล้น | screens/09.png และ desktop-09.png | โครงสร้างผ่าน |
| /custom-badminton-shirts/ | ไม่ล้น | screens/10.png และ desktop-10.png | โครงสร้างผ่าน |
| /custom-baseball-shirts/ | ไม่ล้น | screens/11.png และ desktop-11.png | ID lbCap ซ้ำ |
| /custom-class-shirts/ | ไม่ล้น | screens/12.png และ desktop-12.png | ID lbCap ซ้ำ |
| /custom-organization-shirts/ | ไม่ล้น | screens/13.png และ desktop-13.png | ID lbCap ซ้ำ |
| /custom-oversize-jerseys/ | ไม่ล้น | screens/14.png และ desktop-14.png | โครงสร้างผ่าน |
| /custom-printed-warmup-shirts/ | ไม่ล้น | screens/15.png และ desktop-15.png | โครงสร้างผ่าน |
| /custom-running-shirts/ | ไม่ล้น | screens/16.png และ desktop-16.png | โครงสร้างผ่าน |
| /custom-staff-shirts/ | ไม่ล้น | screens/17.png และ desktop-17.png | โครงสร้างผ่าน |
| /custom-university-shirts/ | ไม่ล้น | screens/18.png และ desktop-18.png | ID lbCap ซ้ำ |
| /delivery-after-sales-guide/ | ไม่ล้น | screens/19.png และ desktop-19.png | โครงสร้างผ่าน |
| /designs/ | ไม่ล้น | screens/20.png และ desktop-20.png | โครงสร้างผ่าน |
| /education/ | ไม่ล้น | screens/21.png และ desktop-21.png | ID lbCap ซ้ำ |
| /educations-shirt/ | ไม่ล้น | screens/22.png และ desktop-22.png | โครงสร้างผ่าน |
| /embroidered-polo-order-guide/ | ไม่ล้น | screens/23.png และ desktop-23.png | โครงสร้างผ่าน |
| /embroidery/ | ไม่ล้น | screens/24.png และ desktop-24.png | โครงสร้างผ่าน |
| /event/ | ไม่ล้น | screens/25.png และ desktop-25.png | ID lbCap ซ้ำ |
| /event-shirts/ | ไม่ล้น | screens/26.png และ desktop-26.png | โครงสร้างผ่าน |
| /fabric-technology/ | ไม่ล้น | screens/27.png และ desktop-27.png | โครงสร้างผ่าน |
| /faq/ | ไม่ล้น | screens/28.png และ desktop-28.png | โครงสร้างผ่าน |
| / | ไม่ล้น | screens/29.png และ desktop-29.png | โครงสร้างผ่าน |
| /organization-shirt-designs/ | ไม่ล้น | screens/30.png และ desktop-30.png | โครงสร้างผ่าน |
| /polo-vs-printed-shirts/ | ไม่ล้น | screens/31.png และ desktop-31.png | โครงสร้างผ่าน |
| /printed-shirt-order-guide/ | ไม่ล้น | screens/32.png และ desktop-32.png | โครงสร้างผ่าน |
| /project/ | ไม่ล้น | screens/33.png และ desktop-33.png | ID lbCap ซ้ำ |
| /running-shirt-designs/ | ไม่ล้น | screens/34.png และ desktop-34.png | โครงสร้างผ่าน |
| /screen-printing/ | ไม่ล้น | screens/35.png และ desktop-35.png | โครงสร้างผ่าน |
| /screen-printing-order-guide/ | ไม่ล้น | screens/36.png และ desktop-36.png | โครงสร้างผ่าน |
| /search/ | ไม่ล้น | screens/37.png และ desktop-37.png | โครงสร้างผ่าน |
| /size-chart/ | ไม่ล้น | screens/38.png และ desktop-38.png | โครงสร้างผ่าน |
| /sport/ | ไม่ล้น | screens/39.png และ desktop-39.png | ID lbCap ซ้ำ |
| /sports-shirt/ | ไม่ล้น | screens/40.png และ desktop-40.png | โครงสร้างผ่าน |
| /staff-shirt-designs/ | ไม่ล้น | screens/41.png และ desktop-41.png | โครงสร้างผ่าน |
| /sublimation/ | ไม่ล้น | screens/42.png และ desktop-42.png | ID lbCap ซ้ำ |
| /team-shirt-design-ideas/ | ไม่ล้น | screens/43.png และ desktop-43.png | โครงสร้างผ่าน |
| /team-shirt-fabric-guide/ | ไม่ล้น | screens/44.png และ desktop-44.png | โครงสร้างผ่าน |
| /team-shirt-order-checklist/ | ไม่ล้น | screens/45.png และ desktop-45.png | โครงสร้างผ่าน |
| /thank-you/ | ไม่ล้น | screens/46.png และ desktop-46.png | โครงสร้างผ่าน |
| /university-shirt-designs/ | ไม่ล้น | screens/47.png และ desktop-47.png | โครงสร้างผ่าน |

## หลักฐาน

- page-matrix.json: 192 ชุดตรวจ DOM
- cms-matrix.json: 18 URL นอก export
- static.json: ไฟล์และ anchor
- excluded-pages.json: 111 หน้าที่ไม่ส่งออก (91 design previews, 9 draft blog, 4 case previews, 2 internal UI, 5 CMS/internal อื่น)
- mobile-sheet-0.jpg ถึง mobile-sheet-3.jpg และ desktop-sheet-0.jpg ถึง desktop-sheet-3.jpg
- tests.log

รอบนี้ตรวจและเขียนรายงานเท่านั้น ไม่แก้โค้ดเว็บไซต์ ไม่ publish ไม่ commit/push
