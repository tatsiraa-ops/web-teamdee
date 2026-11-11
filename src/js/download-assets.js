import { initLightbox } from './lightbox.js'
initLightbox('#downloadDesignGrid', 'figure', 'ดูแบบเสื้อโปโล')
initLightbox('#warmupShapeGrid', 'figure', 'ดูทรงเสื้อวอร์ม')
document.querySelectorAll('[data-proof-grid]').forEach((grid) => {
  initLightbox(`#${grid.id}`, 'figure', 'ดูภาพแบบและเสื้อจริง')
})

// Use the same keyboard-accessible tabs as the product specification sections.
import { initTabs } from './tabs.js'
document.querySelectorAll('[data-proof-tabs]').forEach((root) => {
  if (root.querySelector('[role="tab"]')) initTabs(root)
})

// Keep all examples available without JavaScript; mobile enhancement shows one at a time.
const sampleGrid = document.querySelector('#downloadDesignGrid')
const choices = document.querySelector('.sample-choices')
if (sampleGrid && choices) {
  choices.hidden = false
  sampleGrid.classList.add('has-selection')
  const figures = [...sampleGrid.querySelectorAll('figure')]
  const buttons = [...choices.querySelectorAll('button')]
  const choose = (index) => {
    figures.forEach((figure, i) => figure.classList.toggle('is-selected', i === index))
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)))
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => choose(index)))
  choose(0)
}

document.querySelectorAll('.design-proof').forEach((article) => {
  const controls = article.querySelector('.proof-view')
  if (!controls) return
  controls.hidden = false
  article.dataset.view = 'design'
  controls.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    article.dataset.view = button.dataset.proofView
    controls.querySelectorAll('button').forEach((other) => other.setAttribute('aria-pressed', String(other === button)))
  }))
})
