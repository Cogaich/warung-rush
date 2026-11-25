// Warung Rush screenshot scenes behind ?shot=cover|chop|cook|rush.
// Each one builds its frame from the game's own rules — real orders, real
// trays, real timers — then paints it twice and sets window.__shotReady,
// the same staging trick the kit's starter uses.

import { makeOrder, selectOrder } from './orders.js';

function seedOrders(state, specs) {
  state.board.orders = [];
  for (const spec of specs) {
    const order = makeOrder(0, spec.recipe, spec.customer);
    order.patience = spec.patience;
    order.maxPatience = spec.maxPatience;
    order.tray = spec.tray ?? [];
    order.cooked = spec.cooked ?? null;
    order.status = spec.status ?? 'waiting';
    state.board.orders.push(order);
  }
}

function paintTwice(renderer, state) {
  let painted = 0;
  function paint() {
    renderer.draw(state, performance.now());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

export function stageShot(name, state, renderer) {
  state.screen = 'play';
  state.timeLeft = 154;
  state.money = 87000;
  state.score = 1250;
  state.combo = 3;
  state.board.served = 6;
  state.board.lost = 1;
  state.cook = null;
  state.chop = null;
  state.plate = null;
  state.readyOrder = null;
  state.particles = [];
  state.floats = [];
  state.board.spawnIn = 9;

  if (name === 'chop') {
    // Mid-chop: bawang on the board, two of three taps done.
    seedOrders(state, [
      { recipe: 'ayam', customer: 'Mas Agus', patience: 34, maxPatience: 52, tray: ['nasi', 'kecap'], status: 'active' },
      { recipe: 'telur', customer: 'Bu Sari', patience: 41, maxPatience: 52, tray: [], status: 'waiting' },
    ]);
    const order = state.board.orders[0];
    selectOrder(state.board, order.id);
    state.activeOrder = order;
    state.chop = { ing: 'bawang', hits: 2, need: 3, t: 0 };
    state.board.served = 4;
    paintTwice(renderer, state);
    return;
  }

  if (name === 'cook') {
    // The timing bar mid-sweep, tray complete, wok lit.
    seedOrders(state, [
      { recipe: 'pedas', customer: 'Mbak Rina', patience: 28, maxPatience: 52, tray: ['nasi', 'kecap', 'bawang', 'cabai'], status: 'active' },
      { recipe: 'biasa', customer: 'Pak Budi', patience: 44, maxPatience: 52, tray: [], status: 'waiting' },
    ]);
    const order = state.board.orders[0];
    selectOrder(state.board, order.id);
    state.activeOrder = order;
    state.cook = { pos: 0.5, dir: 1, speed: 1, perfect: { from: 0.42, to: 0.58 }, good: { from: 0.28, to: 0.72 }, locked: false, result: null, t: 1.2 };
    paintTwice(renderer, state);
    return;
  }

  if (name === 'rush') {
    // Full board, one customer nearly out of patience, wok lit.
    seedOrders(state, [
      { recipe: 'seafood', customer: 'Dek Fajar', patience: 9, maxPatience: 52, tray: ['nasi', 'kecap', 'bawang'], status: 'active' },
      { recipe: 'ayam', customer: 'Pakde Slamet', patience: 22, maxPatience: 52, tray: ['nasi'], status: 'waiting' },
      { recipe: 'telur', customer: 'Bu Dewi', patience: 38, maxPatience: 52, tray: [], status: 'waiting' },
    ]);
    const order = state.board.orders[0];
    selectOrder(state.board, order.id);
    state.activeOrder = order;
    state.timeLeft = 47;
    state.money = 143000;
    state.score = 2310;
    state.combo = 5;
    state.board.served = 9;
    paintTwice(renderer, state);
    return;
  }

  // Cover: everything at once — board with three tickets, a dish mid-assembly
  // on the plate, the timer running, a finished plate at the pass.
  seedOrders(state, [
    { recipe: 'ayam', customer: 'Mas Agus', patience: 30, maxPatience: 52, tray: ['nasi', 'kecap', 'bawang', 'ayam'], cooked: 'perfect', status: 'active' },
    { recipe: 'seafood', customer: 'Bu Sari', patience: 18, maxPatience: 52, tray: ['nasi', 'kecap'], status: 'waiting' },
    { recipe: 'pedas', customer: 'Bang Udin', patience: 44, maxPatience: 52, tray: [], status: 'waiting' },
  ]);
  const order = state.board.orders[0];
  selectOrder(state.board, order.id);
  state.activeOrder = order;
  state.plate = { slots: [true, false, false], next: 1, t: 0 };
  const ready = makeOrder(0, 'telur', 'Mbak Putri');
  ready.cooked = 'good';
  ready.plated = 3;
  ready.status = 'ready';
  state.readyOrder = ready;
  state.floats = [{ text: 'PERFECT! +Rp5.000', colour: '#ffd76a', x: 700, y: 420, born: performance.now() - 200 }];
  paintTwice(renderer, state);
}
