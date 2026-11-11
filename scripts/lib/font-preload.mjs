/* preload ฟอนต์ไทย (Noto Sans Thai ชุด thai) ด้วยชื่อไฟล์จริงหลัง Vite ใส่ hash · ใช้ใน vite.config.js (teamdee-font-preload)
   ใส่ใน head.hbs ตรงๆ ไม่ได้: Vite ไม่แปลง href ของ preload (ได้ /src/... = 404) · export WP แปลง /assets/ เข้าโฟลเดอร์ธีมเอง (wp-rewrite.mjs)
   ความเร็วมือถือ 30 ต.ค.: เบราว์เซอร์รู้จักไฟล์ฟอนต์ตั้งแต่อ่าน head ไม่ต้องรอ CSS โหลดเสร็จ */

const THAI = /(^|\/)noto-sans-thai-thai-[\w-]+\.woff2$/

/** names = ชื่อไฟล์ใน bundle (เช่น assets/noto-sans-thai-thai-AbC.woff2) · ไม่เจอ = '' */
export const fontPreloadTag = (names) => {
  const file = [...names].find((n) => THAI.test(n))
  return file ? `<link rel="preload" href="/${file.replace(/^\//, '')}" as="font" type="font/woff2" crossorigin>` : ''
}

/** ใส่ tag ก่อน stylesheet ตัวแรก (ไม่มี = ก่อน </head>) · มีอยู่แล้วไม่ใส่ซ้ำ */
export const injectFontPreload = (html, tag) => {
  if (!tag || html.includes(tag)) return html
  const css = html.search(/<link\b[^>]*\brel="stylesheet"/)
  if (css >= 0) return `${html.slice(0, css)}${tag}\n${html.slice(css)}`
  return html.replace('</head>', `${tag}\n</head>`)
}
