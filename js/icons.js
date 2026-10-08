// Kleine Bild-Symbole statt Text. Farben kommen aus dem Farbthema (CSS-Variablen).
const dots = (xs, y, r, fill) => xs.map((x) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:var(${fill})"/>`).join('');
const barDots = (x0, y, r, fill, step = r * 2.05) => {
  const xs = [];
  for (let i = 0; i < 10; i++) xs.push(+(x0 + i * step + (i >= 5 ? r * 0.7 : 0)).toFixed(2));
  return dots(xs, y, r, fill);
};

/** 10 Einer (2 × 5) → ein Zehner */
export const ICON_BUNDLE = `<svg class="ico ico-bundle" viewBox="0 0 104 34" aria-hidden="true">
  ${dots([6, 12, 18, 24, 30], 10, 2.7, '--one')}${dots([6, 12, 18, 24, 30], 24, 2.7, '--one')}
  <path d="M40 17h13m-5-5.5 5.5 5.5-5.5 5.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="59" y="11" width="43" height="12" rx="6" style="fill:color-mix(in srgb, var(--ten) 22%, transparent)"/>
  ${barDots(62.6, 17, 1.95, '--ten')}
</svg>`;

/** Hammer (Zehner aufbrechen) */
export const ICON_HAMMER = `<svg class="ico ico-hammer" viewBox="0 0 24 24" aria-hidden="true">
  <g transform="rotate(-38 12 12)">
    <rect x="10.7" y="9.5" width="2.6" height="12.5" rx="1.3" fill="currentColor" opacity=".7"/>
    <rect x="4.6" y="3.6" width="14.8" height="6.6" rx="2.2" fill="currentColor"/>
  </g>
  <path d="M19.5 15.5l2.2 1M18 19l1.4 1.8M21.6 12.4l1.8-.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
</svg>`;

/** 10 Zehner → 1 Hunderter */
export const ICON_HUNDRED = `<svg class="ico ico-hundred" viewBox="0 0 92 34" aria-hidden="true">
  <rect x="2" y="5" width="30" height="5" rx="2.5" style="fill:var(--ten)"/><rect x="2" y="14.5" width="30" height="5" rx="2.5" style="fill:var(--ten)"/><rect x="2" y="24" width="30" height="5" rx="2.5" style="fill:var(--ten)"/>
  <path d="M40 17h13m-5-5.5 5.5 5.5-5.5 5.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="60" y="2" width="30" height="30" rx="6" style="fill:var(--hun)"/>
</svg>`;

export const ICON_BAR = `<svg class="ico ico-bar" viewBox="0 0 44 12" aria-hidden="true"><rect x="0.5" y="0.5" width="43" height="11" rx="5.5" style="fill:color-mix(in srgb, var(--ten) 22%, transparent)"/>${barDots(3.6, 6, 1.95, '--ten')}</svg>`;
export const ICON_BEAD = `<svg class="ico ico-bead" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5.5" style="fill:var(--one)"/></svg>`;
export const ICON_PLATE = `<svg class="ico ico-plate" viewBox="0 0 12 12" aria-hidden="true"><rect x=".5" y=".5" width="11" height="11" rx="2.5" style="fill:var(--hun)"/></svg>`;

export const ICON_TARGET = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>`;
export const ICON_AUTO = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 15 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M17 2.5l1.3 3.2 3.2 1.3-3.2 1.3L17 11.5l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="currentColor"/><circle cx="20.5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="9" cy="4.5" r="1.2" fill="currentColor"/></svg>`;
export const ICON_CLEAR = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>`;
export const ICON_CHECK = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>`;
export const ICON_EYE = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>`;
export const ICON_HAND = `<svg class="ico ico-hand" viewBox="0 0 48 56" aria-hidden="true">
  <path d="M18 6.5c0-2.6 2-4.5 4.4-4.5s4.4 1.9 4.4 4.5V24l2.4-.8c2.2-.6 4 .8 4.6 2.6l.4 1.3 1.6-.4c2.3-.5 4.1 1 4.6 3l.3 1.2 1.3-.2c2.6-.3 4.4 1.6 4.4 4.1V42c0 7-5.4 12-12.4 12h-5.2c-4 0-7.4-1.8-9.6-5L6 36.4c-1.4-2.1-.8-4.8 1.3-6.1 2-1.2 4.6-.7 6 1.1l4.7 6V6.5Z"
    style="fill:var(--paper);stroke:var(--ink)" stroke-width="2.6" stroke-linejoin="round"/>
</svg>`;
export const ICON_WAND = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 14 10" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M17 2.5l1.3 3.2 3.2 1.3-3.2 1.3L17 11.5l-1.3-3.2-3.2-1.3 3.2-1.3z" style="fill:var(--one)"/></svg>`;
export const ICON_HEART = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21Z"/></svg>';
