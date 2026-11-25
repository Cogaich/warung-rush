// Warung Rush boot and loop: input, the fixed-step update, the screens,
// and the click map that turns a pointer position into a kitchen action.
// ?shot=cover|chop|cook|rush stages a screenshot scene instead of playing.

import { VIEW_W, VIEW_H, SHIFT_SECONDS, LAYOUT, INGREDIENTS, binRect, ticketRect, plateSlots } from './data.js';
import { freshBoard, tickBoard, selectOrder, serveOrder, activeOrder, trayComplete } from './orders.js';
import { startCook, tickCook, lockCook, hitChop, clickPlateSlot, takeIngredient, startPlating } from './verbs.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';
import { unlockAudio, setMuted, clickSound, coinSound, dingSound, buzzSound, sizzleStop, startSound } from './audio.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const BEST_KEY = 'warung-rush-best';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

function scaleCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
scaleCanvas();
window.addEventListener('resize', scaleCanvas);

export function newState() {
  return {
    screen: 'title',
    timeLeft: SHIFT_SECONDS,
    money: 0,
    score: 0,
    combo: 0,
    board: freshBoard(),
    activeOrder: null,
    readyOrder: null,
    chop: null,
    cook: null,
    plate: null,
    particles: [],
    floats: [],
    best: readBest(),
    muted: false,
  };
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

const state = newState();

function announce(message) {
  statusEl.textContent = message;
}

function pointerPos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

function inside(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function syncActive() {
  state.activeOrder = activeOrder(state.board);
}

function startShift() {
  const best = state.best;
  const fresh = newState();
  fresh.best = best;
  Object.assign(state, fresh);
  state.screen = 'play';
  startSound();
  announce('Shift started. Serve orders as fast as you can!');
}

function endShift() {
  sizzleStop();
  state.cook = null;
  state.chop = null;
  state.plate = null;
  state.screen = 'over';
  if (state.score > state.best) {
    state.best = state.score;
    saveBest(state.best);
  }
  announce(`Shift over. Earnings ${state.money}. Score ${state.score}.`);
}

function serveReady() {
  if (!state.readyOrder) return;
  const order = state.readyOrder;
  const result = serveOrder(state.board, state, order);
  state.readyOrder = null;
  state.particles.push({ kind: 'coin', x: 1170, y: 480, born: performance.now() });
  state.floats.push({ x: 1170, y: 440, text: `+Rp ${result.pay.toLocaleString('id-ID')}`, colour: '#ffd76a', born: performance.now() });
  coinSound();
  dingSound();
  syncActive();
  announce(`Served to ${order.customer}.`);
}

function clickTicket(p) {
  for (let i = 0; i < state.board.orders.length; i += 1) {
    if (inside(p, ticketRect(i))) {
      const order = state.board.orders[i];
      if (order.status === 'ready') {
        serveReady();
        return true;
      }
      selectOrder(state.board, order.id);
      syncActive();
      clickSound();
      return true;
    }
  }
  return false;
}

function clickBins(p) {
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (inside(p, binRect(i))) {
      if (state.chop || state.cook || state.plate) return true;
      takeIngredient(state, INGREDIENTS[i].id);
      syncActive();
      return true;
    }
  }
  return false;
}

function clickStations(p) {
  if (inside(p, LAYOUT.chopping) && state.chop) {
    hitChop(state);
    syncActive();
    return true;
  }
  if (inside(p, LAYOUT.wok)) {
    if (state.cook) {
      lockCook(state, false);
      if (state.activeOrder && state.activeOrder.cooked && state.activeOrder.cooked !== 'burnt') {
        startPlating(state);
      }
      syncActive();
      return true;
    }
    if (state.activeOrder && trayComplete(state.activeOrder) && !state.chop && !state.plate) {
      startCook(state);
      return true;
    }
    if (state.activeOrder && !trayComplete(state.activeOrder)) {
      state.floats.push({ x: 700, y: 420, text: 'Complete the ticket ingredients first!', colour: '#ffd76a', born: performance.now() });
    }
    return true;
  }
  if (inside(p, LAYOUT.plating) && state.plate) {
    const slots = plateSlots();
    for (let i = 0; i < slots.length; i += 1) {
      const s = slots[i];
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      if (dx * dx + dy * dy <= (s.r + 10) * (s.r + 10)) {
        clickPlateSlot(state, i);
        syncActive();
        return true;
      }
    }
    return true;
  }
  if (inside(p, LAYOUT.serving) && state.readyOrder) {
    serveReady();
    return true;
  }
  return false;
}

function handleClick(event) {
  unlockAudio();
  const p = pointerPos(event);
  if (state.screen === 'title') {
    startShift();
    return;
  }
  if (state.screen === 'over') {
    startShift();
    return;
  }
  if (state.screen !== 'play') return;
  if (state.cook) {
    lockCook(state, false);
    if (state.activeOrder && state.activeOrder.cooked && state.activeOrder.cooked !== 'burnt') startPlating(state);
    syncActive();
    return;
  }
  if (clickTicket(p)) return;
  if (clickBins(p)) return;
  if (clickStations(p)) return;
}

function handleKey(event) {
  unlockAudio();
  const key = event.key.toLowerCase();
  if (key === 'm') {
    state.muted = !state.muted;
    setMuted(state.muted);
    return;
  }
  if (state.screen === 'title' || state.screen === 'over') {
    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      startShift();
    }
    return;
  }
  if (key === 'p') {
    state.screen = state.screen === 'paused' ? 'play' : 'paused';
    return;
  }
  if (state.screen !== 'play') return;
  if (key === ' ') {
    event.preventDefault();
    if (state.cook) {
      lockCook(state, false);
      if (state.activeOrder && state.activeOrder.cooked && state.activeOrder.cooked !== 'burnt') startPlating(state);
      syncActive();
    }
    return;
  }
  if (key === 's') {
    serveReady();
    return;
  }
  const ingIndex = INGREDIENTS.findIndex((ing) => ing.key === key);
  if (ingIndex >= 0 && !state.chop && !state.cook && !state.plate) {
    takeIngredient(state, INGREDIENTS[ingIndex].id);
    syncActive();
  }
}

canvas.addEventListener('pointerdown', handleClick);
window.addEventListener('keydown', handleKey);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.screen === 'play') state.screen = 'paused';
});

function step(dt) {
  if (state.screen !== 'play') return;
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endShift();
    return;
  }
  const lost = tickBoard(state.board, dt, state);
  for (const order of lost) {
    if (state.activeOrder && state.activeOrder.id === order.id) {
      state.activeOrder = null;
      state.chop = null;
      if (state.cook) sizzleStop();
      state.cook = null;
      state.plate = null;
    }
    if (state.readyOrder && state.readyOrder.id === order.id) state.readyOrder = null;
    state.floats.push({ x: 160, y: 200, text: `${order.customer} kabur! -50`, colour: '#ff5a4e', born: performance.now() });
    buzzSound();
  }
  if (state.cook) tickCook(state, dt);
  if (state.chop) state.chop.t += dt;
  if (state.plate) state.plate.t += dt;
  syncActive();
}

if (shot) {
  stageShot(shot, state, { draw: (s, now) => drawGame(ctx, s, now) });
} else {
  announce('Warung Rush. Click or press Space to start.');
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    while (acc >= STEP && state.screen === 'play') {
      step(STEP);
      acc -= STEP;
    }
    if (state.screen !== 'play') acc = 0;
    drawGame(ctx, state, now);
  }
  requestAnimationFrame(frame);
}
