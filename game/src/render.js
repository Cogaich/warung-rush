// Warung Rush renderer: one canvas, painted fresh every frame. Semi-realistic
// on purpose — gradients, soft fake shadows, gloss, steam and warm lamplight,
// never flat vector. One job: what the player sees.

import {
  VIEW_W, VIEW_H, PALETTE, INGREDIENTS, INGREDIENT_BY_ID, RECIPE_BY_ID,
  LAYOUT, binRect, ticketRect, plateSlots, rupiah, clock,
} from './data.js';
import { trayComplete } from './orders.js';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function softShadow(ctx, x, y, w, h, colour = 'rgba(0,0,0,0.35)') {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 4, w / 2.1, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wallGradient(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, PALETTE.wallTop);
  g.addColorStop(0.55, PALETTE.wallBottom);
  g.addColorStop(1, '#3d1a10');
  return g;
}

function woodGradient(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, PALETTE.woodLight);
  g.addColorStop(0.5, PALETTE.wood);
  g.addColorStop(1, PALETTE.woodDark);
  return g;
}

// --- ingredient portraits ---------------------------------------------------

export function drawIngredient(ctx, ingId, x, y, r) {
  const ing = INGREDIENT_BY_ID[ingId];
  ctx.save();
  ctx.translate(x, y);
  if (ingId === 'nasi') {
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#fffbe8');
    g.addColorStop(1, '#e8d5a8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbb37e';
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.3 - r * 0.1, r * 0.16, r * 0.09, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingId === 'kecap') {
    ctx.fillStyle = '#2a170a';
    rr(ctx, -r * 0.42, -r * 0.9, r * 0.84, r * 1.8, r * 0.3);
    ctx.fill();
    ctx.fillStyle = '#6b3418';
    rr(ctx, -r * 0.42, -r * 0.9, r * 0.84, r * 0.5, r * 0.2);
    ctx.fill();
    ctx.fillStyle = '#f2b234';
    rr(ctx, -r * 0.42, -r * 0.1, r * 0.84, r * 0.7, r * 0.15);
    ctx.fill();
    ctx.fillStyle = '#2b1a12';
    ctx.font = `bold ${Math.round(r * 0.55)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('K', 0, r * 0.42);
  } else if (ingId === 'bawang') {
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
    g.addColorStop(0, '#f6e8ff');
    g.addColorStop(1, '#b98ad4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.08, r * 0.85, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.08, r * 0.55, r * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#7fb069';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.quadraticCurveTo(r * 0.3, -r * 1.2, r * 0.55, -r * 1.05);
    ctx.stroke();
  } else if (ingId === 'telur') {
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.05, r * 0.8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(-r * 0.15, -r * 0.1, r * 0.05, 0, 0, r * 0.55);
    g.addColorStop(0, '#ffe066');
    g.addColorStop(1, '#f08c0a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.18, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'ayam') {
    ctx.fillStyle = '#d98a4a';
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, r * 0.1, r * 0.75, r * 0.6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b06a2e';
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, r * 0.22, r * 0.6, r * 0.4, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f3e3c2';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 0.35);
    ctx.lineTo(r * 0.95, -r * 0.75);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.2, r * 0.3, r * 0.16, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'udang') {
    ctx.strokeStyle = '#ff8c5a';
    ctx.lineWidth = r * 0.42;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, Math.PI * 0.15, Math.PI * 1.55);
    ctx.stroke();
    ctx.strokeStyle = '#d95a28';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, Math.PI * 0.3, Math.PI * 1.4);
    ctx.stroke();
    ctx.fillStyle = '#ffb08a';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.5);
    ctx.lineTo(-r * 0.95, -r * 0.85);
    ctx.lineTo(-r * 0.35, -r * 0.85);
    ctx.closePath();
    ctx.fill();
  } else if (ingId === 'cabai') {
    ctx.fillStyle = '#e5322d';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.2);
    ctx.quadraticCurveTo(0, -r * 1.0, r * 0.85, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.5, r * 0.15, r * 0.85, r * 0.45);
    ctx.quadraticCurveTo(0, r * 0.75, -r * 0.8, -r * 0.2);
    ctx.fill();
    ctx.fillStyle = '#ff6b5e';
    ctx.beginPath();
    ctx.ellipse(-r * 0.1, -r * 0.25, r * 0.5, r * 0.14, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f9e4d';
    ctx.lineWidth = r * 0.18;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.2);
    ctx.quadraticCurveTo(-r * 1.15, -r * 0.5, -r * 1.0, -r * 0.85);
    ctx.stroke();
  }
  ctx.restore();
}

// --- the scene ---------------------------------------------------------------

export function drawGame(ctx, state, now) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawWall(ctx, now);
  drawHud(ctx, state, now);
  drawBoard(ctx, state, now);
  drawStations(ctx, state, now);
  drawBins(ctx, state, now);
  drawParticles(ctx, state, now);
  drawFloats(ctx, state, now);
  if (state.cook) drawCookBar(ctx, state, now);
  if (state.screen === 'title') drawTitle(ctx, state, now);
  if (state.screen === 'over') drawOver(ctx, state, now);
  if (state.screen === 'paused') drawPaused(ctx, state, now);
}

function drawWall(ctx, now) {
  ctx.fillStyle = wallGradient(ctx);
  ctx.fillRect(0, 64, VIEW_W, VIEW_H - 64);
  // Backsplash tiles, warm cream and teal.
  const tile = 46;
  for (let x = 0; x < VIEW_W; x += tile) {
    for (let y = 64; y < 64 + tile * 2; y += tile) {
      const teal = ((x / tile + y / tile) % 5) === 0;
      ctx.fillStyle = teal ? PALETTE.tileTeal : PALETTE.tileCream;
      ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
    }
  }
  // Hanging lamps with warm glow.
  for (const lx of [420, 700, 980]) {
    ctx.strokeStyle = '#1d0f08';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 64);
    ctx.lineTo(lx, 96);
    ctx.stroke();
    const glow = ctx.createRadialGradient(lx, 108, 4, lx, 108, 90);
    glow.addColorStop(0, 'rgba(255,190,80,0.5)');
    glow.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 90, 20, 180, 180);
    ctx.fillStyle = '#2b1a12';
    ctx.beginPath();
    ctx.moveTo(lx - 26, 108);
    ctx.lineTo(lx + 26, 108);
    ctx.lineTo(lx + 12, 84);
    ctx.lineTo(lx - 12, 84);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(lx, 110, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  drawMenuPoster(ctx);
  drawShelf(ctx);
  drawStreetWindow(ctx, now);
  // A little warung sign on the wall.
  ctx.save();
  ctx.translate(1100, 118);
  ctx.fillStyle = '#2b1a12';
  rr(ctx, -86, -26, 172, 52, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  rr(ctx, -80, -20, 160, 40, 7);
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WARUNG MBAK SRI', 0, 1);
  ctx.restore();
}

// Chalkboard menu: the five dishes and their prices, so the wall earns
// its keep and the recipes are visible even before the first ticket.
function drawMenuPoster(ctx) {
  const x = 336;
  const y = 172;
  const w = 252;
  const h = 122;
  ctx.fillStyle = '#22302a';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#a9743f';
  ctx.lineWidth = 3;
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("— TODAY'S MENU —", x + w / 2, y + 16);
  const rows = [
    ['Classic', '15k'],
    ['Egg', '18k'],
    ['Chicken', '22k'],
    ['Seafood', '25k'],
    ['Spicy', '20k'],
  ];
  ctx.font = '14px sans-serif';
  rows.forEach(([name, price], i) => {
    const ry = y + 38 + i * 17;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3e3c2';
    ctx.fillText(`Nasi Goreng ${name}`, x + 14, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(price, x + w - 14, ry);
  });
}

// A wooden shelf with sauce bottles, a bawang basket and stacked plates.
function drawShelf(ctx) {
  const x = 636;
  const y = 216;
  const w = 380;
  ctx.fillStyle = '#5e3a1c';
  rr(ctx, x, y, w, 12, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x, y, w, 3);
  // Kecap bottles.
  for (let i = 0; i < 3; i += 1) {
    const bx = x + 34 + i * 44;
    ctx.fillStyle = '#2a170a';
    rr(ctx, bx - 10, y - 52, 20, 52, 6);
    ctx.fill();
    ctx.fillStyle = '#f2b234';
    rr(ctx, bx - 10, y - 30, 20, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#6b3418';
    rr(ctx, bx - 7, y - 62, 14, 12, 4);
    ctx.fill();
  }
  // Chilli sauce bottles.
  for (let i = 0; i < 2; i += 1) {
    const bx = x + 176 + i * 40;
    ctx.fillStyle = '#c22a1e';
    rr(ctx, bx - 9, y - 46, 18, 46, 6);
    ctx.fill();
    ctx.fillStyle = '#f3e3c2';
    rr(ctx, bx - 9, y - 28, 18, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#2b1a12';
    rr(ctx, bx - 6, y - 54, 12, 10, 3);
    ctx.fill();
  }
  // A basket of bawang.
  const bx = x + 268;
  ctx.fillStyle = '#a9743f';
  ctx.beginPath();
  ctx.moveTo(bx - 26, y);
  ctx.lineTo(bx + 26, y);
  ctx.lineTo(bx + 20, y - 26);
  ctx.lineTo(bx - 20, y - 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e9d6f5';
  ctx.beginPath();
  ctx.arc(bx - 10, y - 28, 9, 0, Math.PI * 2);
  ctx.arc(bx + 8, y - 30, 10, 0, Math.PI * 2);
  ctx.fill();
  // Stacked plates.
  const px = x + 340;
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#fdf8ec' : '#e8dcc0';
    ctx.beginPath();
    ctx.ellipse(px, y - 6 - i * 7, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A window onto the evening street: cool blue night against the warm
// kitchen, with a lamp glow and a becak rolling past.
function drawStreetWindow(ctx, now) {
  const x = 1072;
  const y = 182;
  const w = 180;
  const h = 196;
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, '#1d2f52');
  sky.addColorStop(0.6, '#2c4a72');
  sky.addColorStop(1, '#e8963c');
  ctx.fillStyle = sky;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  // Everything outside moves behind the glass: clip the street to the
  // window's inside so the becak never sticks out of the frame.
  ctx.save();
  rr(ctx, x, y, w, h, 10);
  ctx.clip();
  // Moon and a street lamp glow.
  ctx.fillStyle = '#f5ead0';
  ctx.beginPath();
  ctx.arc(x + 34, y + 34, 12, 0, Math.PI * 2);
  ctx.fill();
  const lamp = ctx.createRadialGradient(x + 140, y + 120, 2, x + 140, y + 120, 46);
  lamp.addColorStop(0, 'rgba(255,210,110,0.9)');
  lamp.addColorStop(1, 'rgba(255,210,110,0)');
  ctx.fillStyle = lamp;
  ctx.fillRect(x + 94, y + 74, 92, 92);
  ctx.strokeStyle = '#1d0f08';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 140, y + 166);
  ctx.lineTo(x + 140, y + 120);
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(x + 140, y + 118, 6, 0, Math.PI * 2);
  ctx.fill();
  // A becak silhouette rolling past, slow and steady.
  const bx = x + 20 + ((now / 40) % (w + 80)) - 40;
  ctx.fillStyle = '#101826';
  ctx.beginPath();
  ctx.arc(bx, y + h - 26, 10, 0, Math.PI * 2);
  ctx.arc(bx + 44, y + h - 26, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(bx - 6, y + h - 52, 56, 26);
  ctx.beginPath();
  ctx.moveTo(bx + 50, y + h - 52);
  ctx.lineTo(bx + 66, y + h - 26);
  ctx.lineTo(bx + 50, y + h - 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#5e3a1c';
  ctx.lineWidth = 6;
  rr(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.strokeStyle = '#5e3a1c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
}

function drawHud(ctx, state, now) {
  const hud = LAYOUT.hud;
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(hud.x, hud.y, hud.w, hud.h);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(0, hud.h - 3, VIEW_W, 3);
  ctx.textBaseline = 'middle';
  // Logo.
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WARUNG RUSH', 18, 30);
  drawIngredient(ctx, 'cabai', 252, 30, 13);
  // Shift timer, pulsing red when the shift is almost over.
  const low = state.timeLeft <= 30 && state.screen === 'play';
  const pulse = low ? 0.6 + 0.4 * Math.sin(now / 130) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = low ? '#ff5a4e' : PALETTE.cream;
  ctx.font = `bold ${low ? 36 : 32}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(clock(state.timeLeft), 640, 32);
  ctx.restore();
  ctx.fillStyle = '#c9a98a';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('SHIFT', 640, 56);
  // Money and score.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(rupiah(state.money), 1090, 26);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`Score ${state.score}   •   Served ${state.board.served}   •   Combo x${state.combo}`, 1090, 50);
  if (state.muted) {
    ctx.fillStyle = '#999';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SOUND OFF (M)', 300, 50);
  }
}

function patienceColour(frac) {
  if (frac > 0.55) return '#7bc96f';
  if (frac > 0.28) return '#f2b234';
  return '#ff5a4e';
}

function drawBoard(ctx, state, now) {
  const b = LAYOUT.board;
  ctx.fillStyle = woodGradient(ctx, b.x, b.y, b.w, b.h);
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 19px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORDERS', b.x + 14, b.y + 20);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${state.board.orders.length}/${3} orders`, b.x + b.w - 14, b.y + 20);
  state.board.orders.forEach((order, i) => {
    drawTicket(ctx, state, order, ticketRect(i), now);
  });
  if (state.board.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,243,214,0.75)';
    ctx.font = 'italic 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No orders yet…', b.x + b.w / 2, b.y + 150);
  }
}

function drawTicket(ctx, state, order, r, now) {
  const recipe = RECIPE_BY_ID[order.recipeId];
  const isActive = state.activeOrder && state.activeOrder.id === order.id;
  const isReady = order.status === 'ready';
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.28 && (order.status === 'waiting' || order.status === 'active');
  const shake = urgent ? Math.sin(now / 60) * 2 : 0;
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = isActive ? '#fff8e2' : '#fdf3d0';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = isActive ? PALETTE.chilli : 'rgba(0,0,0,0.18)';
  ctx.lineWidth = isActive ? 3 : 1.5;
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.stroke();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(recipe.name, r.x + 12, r.y + 20);
  ctx.fillStyle = '#7a5a3a';
  ctx.font = '13px sans-serif';
  ctx.fillText(order.customer, r.x + 12, r.y + 40);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(rupiah(recipe.price), r.x + r.w - 12, r.y + 20);
  // Needed ingredients with checkmarks for the ones already in the tray.
  recipe.needs.forEach((ingId, i) => {
    const ix = r.x + 24 + i * 34;
    const iy = r.y + 66;
    const got = order.tray.includes(ingId);
    ctx.globalAlpha = got ? 1 : 0.45;
    drawIngredient(ctx, ingId, ix, iy, 13);
    ctx.globalAlpha = 1;
    if (got) {
      ctx.strokeStyle = '#3f9e4d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ix - 6, iy + 2);
      ctx.lineTo(ix - 1, iy + 7);
      ctx.lineTo(ix + 8, iy - 5);
      ctx.stroke();
    }
  });
  // Patience bar.
  const bar = { x: r.x + 12, y: r.y + r.h - 16, w: r.w - 24, h: 8 };
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  rr(ctx, bar.x, bar.y, bar.w, bar.h, 4);
  ctx.fill();
  ctx.fillStyle = patienceColour(frac);
  if (frac > 0) {
    rr(ctx, bar.x, bar.y, Math.max(8, bar.w * frac), bar.h, 4);
    ctx.fill();
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = isReady ? '#3f9e4d' : '#7a5a3a';
  ctx.font = 'bold 12px sans-serif';
  const label = isReady ? 'READY! Serve!' : order.status === 'active' ? 'COOKING…' : order.status === 'cooking' ? 'IN THE WOK…' : order.status === 'plating' ? 'PLATING…' : 'NEW';
  ctx.fillText(label, r.x + r.w - 12, r.y + 40);
  ctx.restore();
}

function drawStations(ctx, state, now) {
  drawCounterTop(ctx);
  drawChopping(ctx, state, now);
  drawWok(ctx, state, now);
  drawPlating(ctx, state, now);
  drawServing(ctx, state, now);
}

function drawCounterTop(ctx) {
  const y = 420;
  const g = ctx.createLinearGradient(0, y, 0, y + 224);
  g.addColorStop(0, PALETTE.counterTop);
  g.addColorStop(1, PALETTE.counterEdge);
  ctx.fillStyle = g;
  ctx.fillRect(16, y, 1248, 224);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(16, y, 1248, 4);
  // Wood grain.
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(16, y + 40 + i * 38);
    ctx.bezierCurveTo(400, y + 34 + i * 38, 900, y + 46 + i * 38, 1264, y + 40 + i * 38);
    ctx.stroke();
  }
}

function stationLabel(ctx, x, y, text) {
  ctx.fillStyle = 'rgba(43,26,18,0.85)';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawChopping(ctx, state, now) {
  const c = LAYOUT.chopping;
  softShadow(ctx, c.x, c.y + 40, c.w, 110);
  ctx.fillStyle = '#e8c98f';
  rr(ctx, c.x + 8, c.y + 52, c.w - 16, 108, 12);
  ctx.fill();
  ctx.strokeStyle = '#b98a56';
  ctx.lineWidth = 2;
  rr(ctx, c.x + 8, c.y + 52, c.w - 16, 108, 12);
  ctx.stroke();
  stationLabel(ctx, c.x + c.w / 2, c.y + 22, 'CHOPPING BOARD');
  if (state.chop) {
    const cx = c.x + c.w / 2;
    const cy = c.y + 106;
    const squash = 1 + 0.12 * Math.sin(now / 90);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, squash);
    drawIngredient(ctx, state.chop.ing, 0, 0, 34);
    ctx.restore();
    // Knife, tilted, mid-chop.
    ctx.save();
    ctx.translate(cx + 52, cy - 34);
    ctx.rotate(0.5);
    ctx.fillStyle = '#c8ccd4';
    rr(ctx, -8, -34, 16, 52, 4);
    ctx.fill();
    ctx.fillStyle = '#2b1a12';
    rr(ctx, -8, 18, 16, 22, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`TAP ${state.chop.hits}/${state.chop.need}`, cx, c.y + 178);
    for (let i = 0; i < state.chop.need; i += 1) {
      ctx.fillStyle = i < state.chop.hits ? '#3f9e4d' : 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(cx - 24 + i * 24, c.y + 40, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = 'rgba(43,26,18,0.45)';
    ctx.font = 'italic 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Shallot & chili chopped here', c.x + c.w / 2, c.y + 106);
  }
}

function drawWok(ctx, state, now) {
  const c = LAYOUT.wok;
  const cx = c.x + c.w / 2;
  const cy = c.y + 112;
  stationLabel(ctx, cx, c.y + 22, 'WOK — FRY');
  // Fire under the wok, flickering.
  const flick = 0.75 + 0.25 * Math.sin(now / 90) * Math.sin(now / 47);
  const fire = ctx.createRadialGradient(cx, cy + 34, 4, cx, cy + 34, 62 * flick);
  fire.addColorStop(0, 'rgba(255,220,90,0.95)');
  fire.addColorStop(0.5, 'rgba(255,122,26,0.75)');
  fire.addColorStop(1, 'rgba(255,80,10,0)');
  ctx.fillStyle = fire;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 34, 62 * flick, 26 * flick, 0, 0, Math.PI * 2);
  ctx.fill();
  // The wok itself.
  const wokG = ctx.createRadialGradient(cx - 20, cy - 24, 8, cx, cy, 78);
  wokG.addColorStop(0, '#55555e');
  wokG.addColorStop(0.7, '#33333a');
  wokG.addColorStop(1, '#1d1d22');
  ctx.fillStyle = wokG;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 78, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f0f12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 78, 46, 0, 0, Math.PI * 2);
  ctx.stroke();
  // A rim highlight so the steel reads round, not flat.
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 70, 38, 0, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  // Food in the wok: golden fried rice with glints.
  const food = ctx.createRadialGradient(cx - 12, cy - 10, 4, cx, cy - 4, 62);
  food.addColorStop(0, '#ffe9a8');
  food.addColorStop(0.6, '#e8a13c');
  food.addColorStop(1, '#b06a2e');
  ctx.fillStyle = food;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 62, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2 + now / 3000;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * 36, cy - 4 + Math.sin(a) * 16, 5, 3, a, 0, Math.PI * 2);
    ctx.fill();
  }
  // Steam wisps rising off the wok.
  for (let i = 0; i < 3; i += 1) {
    const phase = (now / 900 + i / 3) % 1;
    const sx = cx - 30 + i * 30 + Math.sin(now / 300 + i * 2) * 8;
    const sy = cy - 26 - phase * 66;
    ctx.strokeStyle = `rgba(255,255,255,${0.45 * (1 - phase)})`;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy + 14);
    ctx.quadraticCurveTo(sx + 10, sy, sx - 4, sy - 12);
    ctx.stroke();
  }
  // The cook prompt: glowing only while the tray is complete and uncooked.
  const order = state.activeOrder;
  const ready = order && !order.cooked && trayComplete(order) && !state.cook;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  if (state.cook) {
    ctx.fillStyle = '#ffd76a';
    ctx.fillText('PRESS SPACE / CLICK!', cx, c.y + 178);
  } else if (ready) {
    const glow = 0.65 + 0.35 * Math.sin(now / 160);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText('CLICK THE WOK TO FRY!', cx, c.y + 178);
    ctx.restore();
  } else if (order && order.cooked) {
    ctx.fillStyle = 'rgba(43,26,18,0.55)';
    ctx.fillText('Cooked — plate it up!', cx, c.y + 178);
  } else {
    ctx.fillStyle = 'rgba(43,26,18,0.55)';
    ctx.fillText('Complete the ticket ingredients first', cx, c.y + 178);
  }
}

function drawPlating(ctx, state, now) {
  const c = LAYOUT.plating;
  stationLabel(ctx, c.x + c.w / 2, c.y + 22, 'PLATE — ASSEMBLE');
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2 + 10;
  softShadow(ctx, cx - 74, cy - 6, 148, 96);
  const plateG = ctx.createRadialGradient(cx - 18, cy - 20, 8, cx, cy, 78);
  plateG.addColorStop(0, '#ffffff');
  plateG.addColorStop(0.8, '#fdf8ec');
  plateG.addColorStop(1, '#e8dcc0');
  ctx.fillStyle = plateG;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 76, 56, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.plateRim;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 76, 56, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(47,125,109,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 58, 42, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Plated components or the empty-slot hints.
  const order = state.activeOrder;
  if (state.plate && order) {
    const recipe = RECIPE_BY_ID[order.recipeId];
    plateSlots().forEach((slot, i) => {
      const filled = state.plate.slots[i];
      if (filled) {
        const ingId = i === 0 ? 'nasi' : i === 1 ? recipe.protein : recipe.garnish;
        drawIngredient(ctx, ingId, slot.x, slot.y, slot.r * 0.8);
      } else {
        ctx.save();
        ctx.globalAlpha = i === state.plate.next ? 0.9 : 0.45;
        ctx.strokeStyle = i === state.plate.next ? PALETTE.chilli : '#999';
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, slot.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = i === state.plate.next ? PALETTE.chilli : '#777';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slot.label, slot.x, slot.y + 3);
        ctx.restore();
      }
    });
  } else if (order && order.cooked && order.status !== 'ready') {
    ctx.fillStyle = 'rgba(43,26,18,0.6)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click the plate to arrange', cx, cy + 4);
  } else {
    ctx.fillStyle = 'rgba(43,26,18,0.4)';
    ctx.font = 'italic 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Plate empty', cx, cy + 4);
  }
  if (state.plate) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click slots in order!', cx, c.y + 178);
  }
}

function drawServing(ctx, state, now) {
  const c = LAYOUT.serving;
  // The pass window: a shelf with a bell.
  ctx.fillStyle = '#3d1a10';
  rr(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.fillStyle = '#5e2718';
  rr(ctx, c.x + 8, c.y + 8, c.w - 16, c.h - 16, 8);
  ctx.fill();
  stationLabel(ctx, c.x + c.w / 2, c.y + 26, 'SERVE WINDOW');
  const cx = c.x + c.w / 2;
  const cy = c.y + 108;
  if (state.readyOrder) {
    const recipe = RECIPE_BY_ID[state.readyOrder.recipeId];
    softShadow(ctx, cx - 60, cy - 8, 120, 70, 'rgba(0,0,0,0.5)');
    const plateG = ctx.createRadialGradient(cx - 14, cy - 14, 6, cx, cy, 62);
    plateG.addColorStop(0, '#ffffff');
    plateG.addColorStop(1, '#e8dcc0');
    ctx.fillStyle = plateG;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.plateRim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 44, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawIngredient(ctx, 'nasi', cx - 18, cy - 2, 20);
    drawIngredient(ctx, recipe.protein, cx + 22, cy - 6, 18);
    drawIngredient(ctx, recipe.garnish, cx + 2, cy + 18, 13);
    const glow = 0.6 + 0.4 * Math.sin(now / 180);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK TO SERVE!', cx, c.y + 178);
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(255,243,214,0.5)';
    ctx.font = 'italic 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Serving plate empty', cx, cy);
  }
  // The service bell.
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(cx, c.y + 52, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 12, c.y + 52, 24, 4);
  ctx.fillStyle = '#2b1a12';
  ctx.beginPath();
  ctx.arc(cx, c.y + 60, 3, 0, Math.PI * 2);
  ctx.fill();
}

// The pantry rail: seven bins. A bin glows when the active order still
// needs that ingredient, and dims once it is already in the tray.
function drawBins(ctx, state, now) {
  const bins = LAYOUT.bins;
  ctx.fillStyle = 'rgba(43,26,18,0.55)';
  rr(ctx, bins.x - 4, bins.y - 4, bins.w + 8, bins.h + 8, 10);
  ctx.fill();
  const order = state.activeOrder;
  const needs = order ? RECIPE_BY_ID[order.recipeId].needs : [];
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    const wanted = order && needs.includes(ing.id) && !order.tray.includes(ing.id);
    const taken = order && order.tray.includes(ing.id);
    ctx.save();
    if (wanted) {
      const glow = 0.75 + 0.25 * Math.sin(now / 200);
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#ffe9a8';
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 10);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = taken ? '#6b5a44' : '#fdf3d0';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = wanted ? PALETTE.chilli : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = wanted ? 3 : 1.5;
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.stroke();
    ctx.globalAlpha = taken ? 0.5 : 1;
    drawIngredient(ctx, ing.id, r.x + 30, r.y + r.h / 2, 16);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ing.name, r.x + 54, r.y + r.h / 2 - 8);
    ctx.fillStyle = '#5d4126';
    ctx.font = '12px sans-serif';
    ctx.fillText(ing.chop ? 'chop first' : `key ${ing.key}`, r.x + 54, r.y + r.h / 2 + 12);
    ctx.fillStyle = '#b06a2e';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`[${ing.key}]`, r.x + r.w - 10, r.y + r.h / 2);
    ctx.restore();
  });
}

function drawParticles(ctx, state, now) {
  for (const p of state.particles) {
    const age = (now - p.born) / 600;
    if (age >= 1 || age < 0) continue;
    if (p.kind === 'slice') {
      ctx.save();
      ctx.globalAlpha = 1 - age;
      ctx.translate(p.x, p.y - age * 46);
      ctx.rotate(age * 2.4);
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'stars') {
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        const d = age * 54;
        ctx.save();
        ctx.globalAlpha = 1 - age;
        ctx.fillStyle = '#ffd76a';
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d - age * 20, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (p.kind === 'plop') {
      ctx.save();
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(p.x, p.y - age * 30, 8 * (1 - age * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'coin') {
      ctx.save();
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Rp', p.x, p.y - age * 60);
      ctx.restore();
    }
  }
  state.particles = state.particles.filter((p) => (now - p.born) / 600 < 1);
}

function drawFloats(ctx, state, now) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of state.floats) {
    const age = (now - f.born) / 1400;
    if (age >= 1 || age < 0) continue;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.font = 'bold 17px sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y - age * 42);
    ctx.fillStyle = f.colour;
    ctx.fillText(f.text, f.x, f.y - age * 42);
    ctx.restore();
  }
  state.floats = state.floats.filter((f) => (now - f.born) / 1400 < 1);
}

function drawCookBar(ctx, state, now) {
  const cook = state.cook;
  const bar = LAYOUT.cookBar;
  ctx.fillStyle = 'rgba(20,10,6,0.88)';
  rr(ctx, bar.x, bar.y, bar.w, bar.h, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  rr(ctx, bar.x, bar.y, bar.w, bar.h, 14);
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FRY! Press SPACE in the green zone', bar.x + bar.w / 2, bar.y + 20);
  const track = { x: bar.x + 24, y: bar.y + 48, w: bar.w - 48, h: 22 };
  ctx.fillStyle = '#7a2d1d';
  rr(ctx, track.x, track.y, track.w, track.h, 11);
  ctx.fill();
  ctx.fillStyle = '#f2b234';
  rr(ctx, track.x + track.w * cook.good.from, track.y, track.w * (cook.good.to - cook.good.from), track.h, 11);
  ctx.fill();
  ctx.fillStyle = '#3f9e4d';
  rr(ctx, track.x + track.w * cook.perfect.from, track.y, track.w * (cook.perfect.to - cook.perfect.from), track.h, 11);
  ctx.fill();
  const mx = track.x + track.w * cook.pos;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#2b1a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, track.y - 6);
  ctx.lineTo(mx + 8, track.y + track.h / 2);
  ctx.lineTo(mx, track.y + track.h + 6);
  ctx.lineTo(mx - 8, track.y + track.h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9a98a';
  ctx.font = '12px sans-serif';
  ctx.fillText('Green = PERFECT   •   Yellow = Done   •   Red = Burnt', bar.x + bar.w / 2, bar.y + 82);
}

function drawTitle(ctx, state, now) {
  ctx.fillStyle = 'rgba(20,8,4,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('WARUNG RUSH', 640, 210);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('The fastest fried rice on the street', 640, 268);
  ctx.font = '17px sans-serif';
  ctx.fillStyle = '#e8dcc0';
  const lines = [
    '1. Click an order ticket, then grab its ingredients from the rail below.',
    '2. Shallot & chili must be chopped first: tap 3x on the board.',
    '3. Click the wok, press SPACE right in the green zone.',
    '4. Plate in order, then serve at the pass window.',
    'Keys: 1–7 ingredients  •  Space fry  •  S serve  •  P pause  •  M sound',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 640, 330 + i * 30));
  const pulse = 0.65 + 0.35 * Math.sin(now / 240);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('CLICK OR PRESS SPACE TO START', 640, 560);
  ctx.restore();
}

function drawOver(ctx, state, now) {
  ctx.fillStyle = 'rgba(20,8,4,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('SHIFT OVER!', 640, 220);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`Earnings: ${rupiah(state.money)}`, 640, 300);
  ctx.font = '22px sans-serif';
  ctx.fillText(`Orders served: ${state.board.served}   •   Walked out: ${state.board.lost}   •   Score: ${state.score}`, 640, 350);
  if (state.score >= state.best && state.score > 0) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('NEW RECORD!', 640, 400);
  }
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '18px sans-serif';
  ctx.fillText('Press SPACE to play again', 640, 470);
}

function drawPaused(ctx, state, now) {
  ctx.fillStyle = 'rgba(20,8,4,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', 640, 340);
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P to continue', 640, 390);
}
