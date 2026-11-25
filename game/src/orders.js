// Warung Rush orders: customers arrive, wait on the board with a patience
// bar, and leave happy or angry. One job: the life of an order.

import { CUSTOMERS, MAX_BOARD, RECIPES } from './data.js';

let nextId = 1;

export function makeOrder(servedCount, forcedRecipeId, forcedCustomer) {
  const recipe = forcedRecipeId
    ? RECIPES.find((r) => r.id === forcedRecipeId)
    : RECIPES[Math.floor(Math.random() * RECIPES.length)];
  // The rush grows: later orders arrive with less patience, never under 34s.
  const base = Math.max(34, 52 - Math.min(18, servedCount * 1.5));
  const patience = base + Math.random() * 10;
  return {
    id: nextId,
    recipeId: recipe.id,
    customer: forcedCustomer ?? CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
    patience,
    maxPatience: patience,
    status: 'waiting',
    tray: [],
    cooked: null,
    plated: 0,
    misclicks: 0,
    bornAt: Date.now(),
  };
}

export function freshBoard() {
  return { orders: [], spawnIn: 1.2, served: 0, lost: 0 };
}

export function resetOrderIds() {
  nextId = 1;
}

export function orderById(board, id) {
  return board.orders.find((o) => o.id === id) ?? null;
}

export function activeOrder(board) {
  return board.orders.find((o) => o.status === 'active' || o.status === 'cooking' || o.status === 'plating') ?? null;
}

// Advance the board: patience drains, new customers arrive, the impatient
// walk out. Returns the orders that were lost this tick.
export function tickBoard(board, dt, state) {
  const lost = [];
  for (const order of board.orders) {
    if (order.status === 'served' || order.status === 'lost') continue;
    order.patience -= dt;
    if (order.patience <= 0) {
      order.status = 'lost';
      board.lost += 1;
      state.score = Math.max(0, state.score - 50);
      state.combo = 0;
      lost.push(order);
    }
  }
  board.orders = board.orders.filter((o) => o.status !== 'lost' && o.status !== 'served');
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < MAX_BOARD) {
    board.orders.push(makeOrder(board.served));
    // Orders arrive faster as the shift goes on.
    board.spawnIn = Math.max(6, 13 - board.served * 0.7) + Math.random() * 3;
  }
  return lost;
}

export function selectOrder(board, id) {
  const order = orderById(board, id);
  if (!order || order.status === 'ready') return null;
  for (const o of board.orders) {
    if (o.status === 'active' || o.status === 'cooking' || o.status === 'plating') o.status = 'waiting';
  }
  order.status = 'active';
  return order;
}

export function trayComplete(order) {
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  return recipe.needs.every((ing) => order.tray.includes(ing));
}

// Serving pays the menu price plus bonuses: a perfect fry, tidy plating
// (no wrong slot taps) and the patience still left on the ticket.
export function serveOrder(board, state, order) {
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  let pay = recipe.price;
  let bonus = 0;
  if (order.cooked === 'perfect') bonus += 5000;
  if (order.cooked === 'good') bonus += 2000;
  if (order.misclicks === 0) bonus += 3000;
  pay += bonus;
  const speedBonus = Math.round((order.patience / order.maxPatience) * 400);
  state.money += pay;
  state.score += 100 + speedBonus + Math.round(bonus / 100);
  state.combo += 1;
  board.served += 1;
  order.status = 'served';
  board.orders = board.orders.filter((o) => o.id !== order.id);
  return { pay, bonus, speedBonus };
}
