// Warung Rush verbs: the three things a cook's hands do. Each one is fast
// (a second or two) and answers at once — a mini-game that never becomes
// a chore. One job: the cook, chop and plate interactions.

import { INGREDIENT_BY_ID, LAYOUT, CHOP_NEED, COOK_TIMEOUT_SECONDS, RECIPE_BY_ID } from './data.js';
import { chopSound, perfectSound, popSound, buzzSound, sizzleStart, sizzleStop } from './audio.js';

// --- the wok: a timing bar with a green perfect zone -----------------------

export function startCook(state) {
  const order = state.activeOrder;
  if (order) order.status = 'cooking';
  state.cook = {
    pos: 0,
    dir: 1,
    speed: 0.9 + Math.min(0.5, state.board.served * 0.03),
    perfect: { from: 0.42, to: 0.58 },
    good: { from: 0.28, to: 0.72 },
    locked: false,
    result: null,
    t: 0,
  };
  sizzleStart();
}

export function tickCook(state, dt) {
  const cook = state.cook;
  if (!cook || cook.locked) return;
  cook.t += dt;
  cook.pos += cook.dir * cook.speed * dt;
  if (cook.pos >= 1) {
    cook.pos = 1;
    cook.dir = -1;
  } else if (cook.pos <= 0) {
    cook.pos = 0;
    cook.dir = 1;
  }
  // Dawdling burns the rice: the bar only forgives a few seconds.
  if (cook.t > COOK_TIMEOUT_SECONDS) lockCook(state, true);
}

export function lockCook(state, burnt) {
  const cook = state.cook;
  if (!cook || cook.locked) return 'none';
  cook.locked = true;
  sizzleStop();
  const order = state.activeOrder;
  if (!order) {
    state.cook = null;
    return 'none';
  }
  if (burnt) {
    order.cooked = 'burnt';
    order.status = 'active';
    buzzSound();
    state.floats.push({ x: 700, y: 420, text: 'BURNT!', colour: '#ff5a4e', born: performance.now() });
    state.cook = null;
    return 'burnt';
  }
  const p = cook.pos;
  let result = 'good';
  if (p >= cook.perfect.from && p <= cook.perfect.to) result = 'perfect';
  else if (p < cook.good.from || p > cook.good.to) result = 'burnt';
  order.cooked = result;
  if (result === 'perfect') {
    perfectSound();
    state.floats.push({ x: 700, y: 420, text: 'PERFECT! +Rp5.000', colour: '#ffd76a', born: performance.now() });
    state.particles.push({ kind: 'stars', x: 700, y: 470, born: performance.now() });
  } else if (result === 'good') {
    popSound();
    state.floats.push({ x: 700, y: 420, text: 'Done!', colour: '#b8e986', born: performance.now() });
  } else {
    order.status = 'active';
    buzzSound();
    state.floats.push({ x: 700, y: 420, text: 'BURNT! Cook again', colour: '#ff5a4e', born: performance.now() });
  }
  state.cook = null;
  return result;
}

// --- the chopping board: three quick taps ----------------------------------

export function startChop(state, ingId) {
  state.chop = { ing: ingId, hits: 0, need: CHOP_NEED, t: 0 };
}

export function hitChop(state) {
  const chop = state.chop;
  if (!chop) return false;
  chop.hits += 1;
  chop.t = 0;
  chopSound();
  const order = state.activeOrder;
  const board = LAYOUT.chopping;
  state.particles.push({
    kind: 'slice',
    x: board.x + board.w / 2 + (Math.random() * 40 - 20),
    y: board.y + board.h / 2,
    born: performance.now(),
  });
  if (chop.hits >= chop.need) {
    const ing = INGREDIENT_BY_ID[chop.ing];
    if (order && !order.tray.includes(chop.ing)) order.tray.push(chop.ing);
    state.floats.push({ x: board.x + board.w / 2, y: board.y - 8, text: `${ing.name} ready!`, colour: '#fff3d6', born: performance.now() });
    state.chop = null;
    return true;
  }
  return false;
}

// --- the plate: three labelled slots, filled in order -----------------------

export const PLATE_SLOTS = ['rice', 'protein', 'garnish'];

export function startPlating(state) {
  const order = state.activeOrder;
  if (order) order.status = 'plating';
  state.plate = { slots: [false, false, false], next: 0, t: 0 };
}

export function clickPlateSlot(state, slotIndex) {
  const plate = state.plate;
  const order = state.activeOrder;
  if (!plate || !order) return false;
  if (slotIndex !== plate.next) {
    order.misclicks += 1;
    buzzSound();
    state.floats.push({ x: 948, y: 420, text: 'Follow the order!', colour: '#ff5a4e', born: performance.now() });
    return false;
  }
  plate.slots[slotIndex] = true;
  plate.next += 1;
  popSound();
  state.particles.push({ kind: 'plop', x: 948, y: 520, born: performance.now() });
  if (plate.next >= PLATE_SLOTS.length) {
    order.plated = 3;
    order.status = 'ready';
    state.plate = null;
    state.readyOrder = order;
    state.floats.push({ x: 948, y: 420, text: 'Ready to serve!', colour: '#b8e986', born: performance.now() });
    return true;
  }
  return false;
}

// Take an ingredient from its bin: only what the active ticket needs —
// grabbing everything would make reading the recipe pointless. Chopped
// ones go to the board first.
export function takeIngredient(state, ingId) {
  const order = state.activeOrder;
  if (!order) {
    state.floats.push({ x: 640, y: 640, text: 'Pick an order first!', colour: '#ffd76a', born: performance.now() });
    return 'no-order';
  }
  const recipe = RECIPE_BY_ID[order.recipeId];
  if (!recipe.needs.includes(ingId)) {
    state.floats.push({ x: 640, y: 640, text: 'Not needed!', colour: '#ff5a4e', born: performance.now() });
    buzzSound();
    return 'not-needed';
  }
  if (order.tray.includes(ingId)) return 'already';
  const ing = INGREDIENT_BY_ID[ingId];
  if (ing.chop) {
    startChop(state, ingId);
    return 'chop';
  }
  order.tray.push(ingId);
  popSound();
  return 'taken';
}
