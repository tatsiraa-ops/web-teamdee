/* ลำดับฉาก hero หน้าแรก · A = แบบเสื้อ → ทีมใส่จริง · B = ผนังแบบเสื้อ
   B จะไฮไลต์แบบของคู่ถัดไปบนผนัง แล้วแบบนั้นลอยออกมาเป็นการ์ดของฉาก A ต่อ */
export const buildCycle = (pairCount) => {
  if (!pairCount) return [{ scene: 'B', next: null }]
  const out = []
  for (let i = 0; i < pairCount; i++) out.push({ scene: 'A', pair: i }, { scene: 'B', next: (i + 1) % pairCount })
  return out
}

/** นาฬิกาที่หยุดได้ · นับเฉพาะเวลาที่เล่นอยู่ ใช้คุมว่าฉากค้างครบหรือยัง */
export const makeClock = (now = () => performance.now()) => {
  let acc = 0
  let since = null
  return {
    start() { acc = 0; since = now() },
    reset() { acc = 0; since = since === null ? null : now() },
    pause() { if (since !== null) { acc += now() - since; since = null } },
    resume() { if (since === null) since = now() },
    elapsed() { return acc + (since === null ? 0 : now() - since) },
    get paused() { return since === null },
  }
}

/** ท่าบินของการ์ด (shared element) จากกล่อง from ไปลงที่ตำแหน่งจริงของการ์ด
    ใช้ translate / scale / rotate แยกกัน ห้ามรวม translate ไว้ใน transform
    เพราะ CSS ใช้ rotate ก่อน transform ระยะทางจะถูกหมุนตาม แล้วการ์ดลงพลาดเป้า 37–45px (วัดจริง 2 ต.ค. 2026) */
export const flightFrames = (from, card, fromRotate, toRotate) => {
  const dx = from.left + from.width / 2 - (card.left + card.width / 2)
  const dy = from.top + from.height / 2 - (card.top + card.height / 2)
  const r = (n) => Math.round(n * 100) / 100
  return [
    { translate: `${r(dx)}px ${r(dy)}px`, scale: `${r(from.width / card.width)}`, rotate: fromRotate, opacity: 1 },
    { translate: '0px 0px', scale: '1', rotate: toRotate, opacity: 1 },
  ]
}
