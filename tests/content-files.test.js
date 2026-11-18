/* 16 พ.ย. 2026 B2 หนึ่งหน้าหนึ่งไฟล์เนื้อหา: หน้ากลุ่มลูกค้า src/content/use/<id>.json · หน้าสินค้า src/content/product/<id>.json
   ในไฟล์มี page (ข้อความตาม Wireframe v22 · เดิม use-pages.json / product-pages.json) และ v2 (โฉมใหม่ · เดิม use-v2.json / pp-v2.json)
   ค่าที่ทุกหน้ากลุ่มลูกค้าใช้ร่วม (ส่วนตรวจตัวอย่าง _check) อยู่ src/content/use/_shared.json · ตัวโหลดกลาง src/build/content.js */
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { usePages, useV2, productPages, ppV2 } from '../src/build/content.js'

const routes = JSON.parse(readFileSync(new URL('../src/data/routes.json', import.meta.url), 'utf8'))
const file = (k, id) => new URL(`../src/content/${k}/${id}.json`, import.meta.url)

test('ทุกหน้ากลุ่มลูกค้าใน routes มีไฟล์เนื้อหาของตัวเอง (page + v2)', () => {
  for (const id of Object.keys(routes.uses)) {
    assert.ok(existsSync(file('use', id)), id)
    const c = JSON.parse(readFileSync(file('use', id), 'utf8'))
    assert.ok(c.page && c.v2, `${id}: page + v2`)
  }
  assert.ok(useV2()._check, 'ค่ากลาง _check')
  assert.deepEqual(Object.keys(usePages()).sort(), Object.keys(routes.uses).sort())
})

test('ทุกหน้าสินค้าใน routes มีไฟล์เนื้อหา · v2 มีเฉพาะหน้าที่ทำโฉมใหม่แล้ว', () => {
  for (const id of Object.keys(routes.products)) assert.ok(existsSync(file('product', id)), id)
  assert.deepEqual(Object.keys(productPages()).sort(), Object.keys(routes.products).sort())
  assert.deepEqual(Object.keys(ppV2()).sort(), ['polo', 'print', 'screen']) /* 18 พ.ย. 2026 สกรีนย้ายเป็นโฉมใหม่ */
})

test('ไฟล์ข้อมูลรวมแบบเดิมเลิกใช้แล้ว (ไม่มีสองที่ให้แก้)', () => {
  for (const f of ['use-pages', 'use-v2', 'product-pages', 'pp-v2']) assert.ok(!existsSync(new URL(`../src/data/${f}.json`, import.meta.url)), f)
})

test('ตัวโหลดคืนข้อมูลชุดใหม่ทุกครั้ง (แก้ค่าที่ได้ไปแล้วไม่ติดไปครั้งถัดไป)', () => {
  const a = useV2(); a.corp.hero.alt = 'x'
  assert.notEqual(useV2().corp.hero.alt, 'x')
})
