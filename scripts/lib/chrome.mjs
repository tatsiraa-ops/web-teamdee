/* เปิด headless Chrome ผ่าน CDP แบบเก็บกวาดครบ (ใช้แทนการ spawn เองในแต่ละสคริปต์)
   เคยมี Chrome ค้างจนดิสก์เต็ม (cdp-* + code_sign_clone) เพราะปิดด้วย SIGKILL และไม่ลบโฟลเดอร์
   ปิด: CDP Browser.close → รอ process จบ → SIGTERM ถ้ายังไม่ปิด → ลบโฟลเดอร์ cdp-* ทุกครั้ง
   ใช้: const c = await launchChrome(); try { await c.send(...) } finally { await c.close() } */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launchChrome({ width = 1440, height = 900 } = {}) {
  const port = 9900 + Math.floor(Math.random() * 90)
  const dir = mkdtempSync(join(tmpdir(), 'cdp-'))
  const chrome = spawn(BIN, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' })
  const exited = new Promise((r) => chrome.once('exit', r))
  let ws, browserWs, closing

  const close = () => closing ??= (async () => {
    try { ws?.close() } catch {}
    try {
      if (browserWs) {
        const b = new WebSocket(browserWs)
        await new Promise((r, j) => { b.addEventListener('open', r, { once: true }); b.addEventListener('error', j, { once: true }) })
        b.send(JSON.stringify({ id: 1, method: 'Browser.close' }))
      }
    } catch {}
    if (chrome.exitCode === null && await Promise.race([exited.then(() => true), sleep(5000).then(() => false)]) === false) {
      chrome.kill('SIGTERM')
      await Promise.race([exited, sleep(5000)])
    }
    rmSync(dir, { recursive: true, force: true })
  })()
  const onSignal = (sig) => close().finally(() => process.exit(sig === 'SIGINT' ? 130 : 143))
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  process.once('exit', () => { if (chrome.exitCode === null) chrome.kill('SIGTERM'); rmSync(dir, { recursive: true, force: true }) })

  try {
    let list
    for (let i = 0; i < 50 && !list; i++) { await sleep(200); try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json() } catch {} }
    if (!list) throw new Error('Chrome ไม่ตอบ CDP')
    browserWs = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl
    ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl)
    await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  } catch (e) { await close(); throw e }

  let id = 0
  const pend = new Map()
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) } })
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.result?.value
  return { send, ev, sleep, close }
}
