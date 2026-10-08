// Einstieg + einfacher Hash-Router.
import { renderHome } from './screens/home.js';
import { renderWerkstatt } from './screens/werkstatt.js';
import { renderLernen } from './screens/lernen.js';
import { renderGame } from './screens/game.js';
import { renderEltern } from './screens/eltern.js';

const app = document.getElementById('app');
let cleanup = null;

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [page, ...rest] = hash.split('/');
  try { cleanup?.(); } catch (e) { console.warn(e); }
  cleanup = null;
  app.replaceChildren();
  window.scrollTo(0, 0);
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.page === (page === 'spiel' ? 'lernen' : page)));
  document.body.dataset.page = page || 'home';
  if (page === 'werkstatt') cleanup = renderWerkstatt(app);
  else if (page === 'lernen') cleanup = renderLernen(app);
  else if (page === 'spiel') cleanup = renderGame(app, rest[0], Number(rest[1]) || 1);
  else if (page === 'eltern') cleanup = renderEltern(app);
  else cleanup = renderHome(app);
}

window.addEventListener('hashchange', route);
// iPad: kein Zoomen durch Doppeltippen oder Pinch mitten im Spiel.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
route();
