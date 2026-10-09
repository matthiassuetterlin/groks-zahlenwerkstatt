// Kleine, runde Strich-Symbole (24er Raster)
const s = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const I = {
  home: s('<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v8.5h11V10"/><path d="M10.2 18.5v-4.6h3.6v4.6"/>'),
  broom: s('<path d="M14.5 3.5 11 11"/><path d="M7.5 10.5h7l2 3.5-1 6.5h-9L5.5 14z"/><path d="M9.5 15.5v4.5M12.5 15.5v4.5"/>'),
  hammer: s('<path d="M14 6.5 6 14.5l3.5 3.5 8-8"/><path d="M12.5 4.5 16 3l5 5-1.5 3.5-2-2-2.5 2.5-3.5-3.5 2.5-2.5z"/>'),
  bundle: s('<path d="M4 8h3M4 12h3M4 16h3"/><path d="M10 12h4"/><path d="m12.5 9.5 2.5 2.5-2.5 2.5"/><rect x="17.5" y="4" width="3" height="16" rx="1.5"/>'),
  arrow: s('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  back: s('<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>'),
  close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
  drawer: s('<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M3.5 12h17"/><path d="M10 15.5h4"/>'),
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.9 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.4 3.4 4.2 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1L3.2 9.2l6.1-.8z"/></svg>',
  eye: s('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><path d="M12 9.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z"/>'),
  wrench: s('<path d="M14.5 5.5a4 4 0 0 0 4.9 4.9l-9 9a2 2 0 0 1-2.8-2.8l9-9a4 4 0 0 0-2.1-2.1z"/>'),
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.7L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>',
  swipeUp: s('<path d="M12 20V6"/><path d="m7 10 5-5 5 5"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  again: s('<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.5 4.5v4h4"/>'),
  gem: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 3.5h10l4 5.5-9 11.5L3 9z"/><path fill="#fff" opacity=".45" d="M7 3.5h10l-2 5.5H9z"/></svg>',
};
