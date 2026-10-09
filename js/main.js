// Einstieg + einfacher Hash-Router.
import { renderJourney } from './screens/journey.js?v=8';
import { renderWerkstatt } from './screens/werkstatt.js?v=8';
import { renderGame } from './screens/game.js?v=8';
import { renderEltern } from './screens/eltern.js?v=8';
import { applySettings, mountSettings } from './settings.js?v=8';
import { initSizing } from './sizing.js?v=8';

const app = document.getElementById('app');
applySettings();
initSizing();
mountSettings();

// Sicherheitsnetz: Wurde das Stylesheet wirklich angewendet? Sonst frisch nachladen.
function stylesApplied() {
  return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() !== '';
}
function ensureStyles(attempt = 0) {
  if (stylesApplied() || attempt > 3) return;
  const old = document.querySelector('link[rel="stylesheet"]');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `css/style.css?v=${window.GZW_VERSION || '0'}&r=${Date.now()}`;
  link.onload = () => old?.remove();
  document.head.append(link);
  setTimeout(() => ensureStyles(attempt + 1), 1500);
}
if (document.readyState === 'complete') ensureStyles();
else window.addEventListener('load', () => ensureStyles());
let cleanup = null;

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [page, ...rest] = hash.split('/');
  try { cleanup?.(); } catch (e) { console.warn(e); }
  cleanup = null;
  app.replaceChildren();
  window.scrollTo(0, 0);
  document.body.dataset.page = page === 'eltern' ? 'eltern' : page === 'werkstatt' || page === 'spiel' ? page : 'reise';
  document.body.classList.toggle('is-activity', page !== 'eltern');
  if (page === 'werkstatt') cleanup = renderWerkstatt(app);
  else if (page === 'spiel') cleanup = renderGame(app, rest[0], Number(rest[1]) || 1);
  else if (page === 'eltern') cleanup = renderEltern(app);
  // Reise = Startseite. „#/lernen“ (alte Links) und „#/schatz“ (Schatz offen) landen ebenfalls hier.
  else cleanup = renderJourney(app, { treasure: page === 'schatz', phase: page === 'phase' ? rest[0] : null });
}

window.addEventListener('hashchange', route);
// iPad: kein Zoomen durch Doppeltippen oder Pinch mitten im Spiel.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
route();
