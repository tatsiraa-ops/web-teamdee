/** Progressive enhancement: all concise guidance remains readable without JavaScript. */
export function initGuideProcessStudio(root = document) {
  root.querySelectorAll('[data-guide-studio]').forEach((studio) => {
    if (studio.dataset.studioReady) return;
    const choices = [...studio.querySelectorAll('[data-studio-choice]')];
    const panels = [...studio.querySelectorAll('[data-studio-panel]')];
    if (!choices.length || !panels.length) return;
    const select = (key) => {
      choices.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.studioChoice === key)));
      panels.forEach((panel) => { panel.hidden = panel.dataset.studioPanel !== key; });
      studio.dataset.studioSelection = key;
    };
    studio.dataset.studioReady = 'true';
    choices.forEach((button) => button.addEventListener('click', () => select(button.dataset.studioChoice)));
    select(choices[0].dataset.studioChoice);
  });
}
