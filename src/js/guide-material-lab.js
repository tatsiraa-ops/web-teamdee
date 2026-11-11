/** Progressive, page-local tools: existing source descriptions remain authoritative. */
export function initGuideMaterialLab(root = document) {
  root.querySelectorAll('[data-fabric-lab]').forEach(lab => {
    if (lab.dataset.ready) return;
    lab.dataset.ready = 'true';
    lab.querySelectorAll('[data-fabric-sample]').forEach(sample => {
      const select = sample.querySelector('[data-fabric-select]');
      if (!select?.options.length) return;
      const initialPhoto = sample.querySelector('[data-fabric-photo]');
      const initialSource = initialPhoto.getAttribute('src') || '';
      const imagePathIndex = initialSource.lastIndexOf('/img/');
      const sourcePrefix = imagePathIndex >= 0 ? initialSource.slice(0, imagePathIndex) : '';
      sample.querySelector('.g-lab__select').hidden = false;
      select.addEventListener('change', () => {
        const option = select.selectedOptions[0];
        const photo = sample.querySelector('[data-fabric-photo]');
        const source = option.value.replace(/\.jpg$/, '-wide.webp');
        photo.src = `${sourcePrefix}${source}`;
        photo.alt = `ภาพระยะใกล้ของ${option.textContent}`;
        sample.querySelector('[data-fabric-name]').textContent = option.textContent;
        sample.querySelector('[data-fabric-use]').textContent = option.dataset.use;
        lab.querySelector('[data-fabric-status]').textContent = `เปลี่ยนเป็น${option.textContent} เหมาะกับ${option.dataset.use}`;
      });
    });
  });
  root.querySelectorAll('[data-measure-lab]').forEach(lab => {
    if (lab.dataset.ready) return;
    lab.dataset.ready = 'true';
    lab.querySelector('.g-lab__measure-buttons').hidden = false;
    const choose = key => {
      lab.querySelectorAll('[data-measure]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.measure === key)));
      lab.querySelectorAll('[data-measure-line]').forEach(line => line.classList.toggle('is-active', line.dataset.measureLine === key));
      lab.querySelectorAll('[data-measure-answer]').forEach(answer => { answer.hidden = answer.dataset.measureAnswer !== key; });
    };
    choose('chest');
    lab.querySelectorAll('[data-measure]').forEach(button => button.addEventListener('click', () => choose(button.dataset.measure)));
  });
}
