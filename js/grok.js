// Grok – der Werkstatt-Begleiter. Eine kleine Figur mit Sprechblase. Antippen = Tipp.
import { h, svg, pick } from './util.js?v=2';

export const GROK_SVG = `
<svg class="grok-svg" viewBox="0 0 140 160" aria-hidden="true">
  <g class="g-shadow"><ellipse cx="70" cy="152" rx="38" ry="5" fill="#2A2B3D" opacity=".10"/></g>
  <g class="g-all">
    <g class="g-antenna">
      <path d="M70 30 C70 22 72 17 76 13" stroke="#3B3F6B" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <circle class="g-bead" cx="78" cy="11" r="8" fill="#F0A63A"/>
      <circle cx="75.5" cy="8.5" r="2.4" fill="#fff" opacity=".65"/>
    </g>
    <rect x="44" y="134" width="20" height="14" rx="7" fill="#2E3158"/>
    <rect x="76" y="134" width="20" height="14" rx="7" fill="#2E3158"/>
    <path class="g-arm g-arm-l" d="M28 92 C17 98 15 108 19 116" stroke="#3B3F6B" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path class="g-arm g-arm-r" d="M112 92 C123 98 125 108 121 116" stroke="#3B3F6B" stroke-width="11" fill="none" stroke-linecap="round"/>
    <rect x="22" y="28" width="96" height="114" rx="44" fill="#3B3F6B"/>
    <path d="M40 40 C52 32 88 32 100 40" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".12" fill="none"/>
    <rect x="33" y="42" width="74" height="56" rx="27" fill="#FFF6EA"/>
    <g class="g-eyes">
      <g class="g-eyes-open">
        <ellipse cx="55" cy="68" rx="7.5" ry="8.5" fill="#23253F"/>
        <ellipse cx="85" cy="68" rx="7.5" ry="8.5" fill="#23253F"/>
        <circle cx="57.6" cy="64.6" r="2.6" fill="#fff"/>
        <circle cx="87.6" cy="64.6" r="2.6" fill="#fff"/>
      </g>
      <g class="g-eyes-happy">
        <path d="M47.5 70 Q55 61 62.5 70" stroke="#23253F" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M77.5 70 Q85 61 92.5 70" stroke="#23253F" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
    </g>
    <ellipse cx="44" cy="81" rx="5.5" ry="3.4" fill="#F2A39B" opacity=".75"/>
    <ellipse cx="96" cy="81" rx="5.5" ry="3.4" fill="#F2A39B" opacity=".75"/>
    <path class="g-mouth" d="M63 82 Q70 89 77 82" stroke="#23253F" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <g class="g-five">
      <rect x="39" y="110" width="62" height="16" rx="8" fill="#2E3158"/>
      <circle cx="49" cy="118" r="4.4" fill="#F0A63A"/>
      <circle cx="59.5" cy="118" r="4.4" fill="#F0A63A"/>
      <circle cx="70" cy="118" r="4.4" fill="#F0A63A"/>
      <circle cx="80.5" cy="118" r="4.4" fill="#F0A63A"/>
      <circle cx="91" cy="118" r="4.4" fill="#F0A63A"/>
    </g>
  </g>
</svg>`;

export const grokFigure = (cls = '') => h('div', { class: `grok-figure ${cls}` }, svg(GROK_SVG));

/**
 * Grok mit Sprechblase in einem Platzhalter.
 * say(text, {mood, hold}) · cheer(text) · setHints([...]) · hide()
 */
export function createGrok(slot, { layout = 'column', greeting = null } = {}) {
  const bubbleText = h('div', { class: 'bubble-text' });
  const bubble = h('div', { class: 'bubble', role: 'status', 'aria-live': 'polite' }, bubbleText);
  const fig = h('button', { class: 'grok', type: 'button', 'aria-label': 'Grok antippen für einen Tipp' }, svg(GROK_SVG));
  const wrap = h('div', { class: `grok-wrap grok-wrap--${layout}` }, bubble, fig);
  slot.append(wrap);

  let hints = [];
  let hintIdx = 0;
  let hideTimer = null;
  let moodTimer = null;

  function setMood(m) {
    fig.classList.remove('is-talk', 'is-happy', 'is-think');
    void fig.offsetWidth;
    if (m) fig.classList.add('is-' + m);
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => fig.classList.remove('is-talk', 'is-happy', 'is-think'), m === 'happy' ? 1600 : 1400);
  }

  function say(text, { mood = 'talk', hold = 0 } = {}) {
    clearTimeout(hideTimer);
    bubbleText.innerHTML = text;
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.classList.add('show');
    setMood(mood);
    if (hold) hideTimer = setTimeout(() => bubble.classList.remove('show'), hold);
  }

  fig.addEventListener('click', () => {
    if (hints.length) {
      say(hints[hintIdx % hints.length], { mood: 'think' });
      hintIdx++;
    } else {
      say(pick(['Hallo! Ich bin Grok.', 'Ich helfe dir gern.', 'Bauen macht Spaß!']), { mood: 'happy' });
    }
  });

  if (greeting) say(greeting);

  return {
    el: wrap,
    say,
    cheer: (text) => say(text, { mood: 'happy' }),
    setHints(list) { hints = list || []; hintIdx = 0; },
    hide() { bubble.classList.remove('show'); },
    destroy() { clearTimeout(hideTimer); clearTimeout(moodTimer); wrap.remove(); },
  };
}
