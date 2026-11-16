/* โค้ดที่ประกอบหน้าเว็บตอน build (16 พ.ย. 2026 B1: แยก vite.config.js เป็น src/build/**) · เทสที่เคยอ่าน vite.config.js ทั้งไฟล์อ่านจากที่นี่แทน */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : [])

/** path ไฟล์ทั้งหมด: vite.config.js + src/build/**.js */
export const buildFiles = () => [join(root, 'vite.config.js'), ...walk(join(root, 'src/build')).sort()]
/** เนื้อหารวมของ buildFiles() */
export const buildSource = () => buildFiles().map((f) => readFileSync(f, 'utf8')).join('\n')
