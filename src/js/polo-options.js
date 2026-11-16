import { lineMessageUrl } from './contact-send.js'

export const poloOptionsText = (names) => `สนใจโปโลปัก\n${names.join('\n')}\nจำนวน:  ตัว`

export function initPoloOptions(root = document) {
  const box = root.querySelector('[data-polo-options]')
  if (!box) return
  const choices = [...box.querySelectorAll('[data-polo-option]')]
  const send = box.querySelector('[data-polo-send]')
  const baseHref = send.href
  const clear = box.querySelector('[data-polo-clear]')
  const summary = box.querySelector('[data-polo-summary]')
  const groups = new Set(choices.map(button => button.dataset.group)).size

  const update = () => {
    const selected = choices.filter(button => button.getAttribute('aria-pressed') === 'true')
    summary.replaceChildren(...selected.map(button => {
      const item = document.createElement('li')
      const label = document.createElement('span')
      const name = document.createElement('strong')
      label.textContent = button.dataset.groupLabel
      name.textContent = button.dataset.optionName
      item.append(label, name)
      return item
    }))
    box.querySelector('[data-polo-status]').textContent = selected.length ? `เลือกแล้ว ${selected.length} จาก ${groups} หมวด` : 'ยังไม่แน่ใจ ให้ทีมดีช่วยเลือกได้'
    box.querySelector('[data-polo-send-label]').textContent = selected.length ? 'ส่งแบบที่เลือกให้ทีมดี' : 'ให้ทีมดีช่วยเลือก'
    send.href = selected.length ? lineMessageUrl(poloOptionsText(selected.map(button => button.dataset.optionName))) : baseHref
    clear.disabled = selected.length === 0
  }

  box.addEventListener('click', event => {
    const button = event.target.closest('[data-polo-option]')
    if (button && box.contains(button)) {
      const selected = button.getAttribute('aria-pressed') !== 'true'
      choices.filter(choice => choice.dataset.group === button.dataset.group).forEach(choice => choice.setAttribute('aria-pressed', 'false'))
      button.setAttribute('aria-pressed', String(selected))
      update()
    } else if (event.target.closest('[data-polo-clear]')) {
      choices.forEach(choice => choice.setAttribute('aria-pressed', 'false'))
      update()
    }
  })
}
