// Odometer (v8): riesige, dünne Ziffern, die wie ein Kilometerzähler rollen. Hunderter · Zehner · Einer
// in den Stellenfarben. Führende Stellen klappen weg (7 statt 07), 100 zeigt die Hunderter-Stelle.
import { h } from './util.js?v=8';

export function createOdo({ cls = '' } = {}) {
  const col = (k) => {
    const strip = h('span', { class: 'odo-strip' }, ...Array.from({ length: 10 }, (_, d) => h('span', {}, String(d))));
    return { el: h('span', { class: `odo-col is-${k}` }, strip), strip };
  };
  const H = col('h'), T = col('t'), O = col('o');
  const el = h('div', { class: `odo ${cls}`, role: 'img' }, H.el, T.el, O.el);
  function set(n) {
    n = Math.max(0, Math.min(999, Math.round(n)));
    const hd = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    H.strip.style.transform = `translateY(${-hd}em)`;
    T.strip.style.transform = `translateY(${-t}em)`;
    O.strip.style.transform = `translateY(${-o}em)`;
    H.el.classList.toggle('is-off', n < 100);
    T.el.classList.toggle('is-off', n < 10);
    el.setAttribute('aria-label', String(n));
  }
  set(0);
  return { el, set };
}
