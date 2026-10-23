/* เวลาผลิตแยกตามงาน (บทความเว็บเดิม 5 ต.ค. 2026 · อาร์ตให้ใช้ 23 ต.ค.) ต้องขึ้นตรงกันทุกที่ ไม่เหลือช่องรอยืนยัน */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const json = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
const lead = json('lead-times.json')
const pages = json('product-pages.json')

test('ทุกสินค้ามีเวลาผลิตเป็นวันทำการ', () => {
  for (const id of ['polo', 'print', 'screen', 'warmup', 'baseball', 'jersey']) assert.match(lead[id].days, /\d+–\d+ วันทำการ/, id)
})

test('หน้าสินค้า: ช่องระยะผลิตบน hero ใช้ค่าจริง · FAQ "ใช้เวลากี่วัน" มีตัวเลขวันทำการ', () => {
  for (const [id, p] of Object.entries(pages)) {
    if (id.startsWith('_')) continue
    const f = p.hero.facts.find((x) => /ผลิต/.test(x.k))
    assert.ok(f && !/\[/.test(f.v) && f.v.includes(lead[id].days), `${id} hero: ${f?.v}`)
    const q = p.faq.items.find(([q]) => /กี่วัน|เวลาผลิต/.test(q))
    assert.ok(q && /\d+–\d+ วันทำการ/.test(q[1]), `${id} faq: ${q?.[1]}`)
  }
})

test('หน้าแรก FAQ เวลาผลิต บอกตัวเลขแยกตามงาน', () => {
  const [, a] = json('home.json').faq.items.find(([q]) => /เวลาผลิตกี่วัน/.test(q))
  for (const d of ['15–20', '10–15', '7–10']) assert.ok(a.includes(d), d)
})
