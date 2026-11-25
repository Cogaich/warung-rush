// Warung Rush: everything the game is made of — sizes, colours, ingredients,
// recipes, customers and the screen layout. One job: the data. The rules live
// in orders.js and verbs.js, the drawing in render.js, the loop in main.js.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const SHIFT_SECONDS = 180;
export const MAX_BOARD = 3;
export const CHOP_NEED = 3;
// The timing bar only forgives a few seconds before the rice burns.
export const COOK_TIMEOUT_SECONDS = 6;

// Warm warung palette: wok fire, golden egg, red chilli, deep teal.
export const PALETTE = {
  wallTop: '#8a3d2c',
  wallBottom: '#5e2718',
  tileCream: '#f3e3c2',
  tileTeal: '#2f7d6d',
  tileLine: '#d9c49a',
  woodDark: '#6e4423',
  wood: '#8a5a33',
  woodLight: '#a9743f',
  counterTop: '#b98a56',
  counterEdge: '#7c4f27',
  hud: '#2b1a12',
  hudLine: '#e8a13c',
  cream: '#fff3d6',
  ink: '#2b1a12',
  gold: '#f2b234',
  chilli: '#e5322d',
  leaf: '#3f9e4d',
  teal: '#2f7d6d',
  wok: '#3a3a40',
  wokHot: '#ff7a1a',
  plate: '#fdf8ec',
  plateRim: '#2f7d6d',
};

export const INGREDIENTS = [
  { id: 'nasi', name: 'Rice', key: '1', chop: false, colour: '#f5ead0', dark: '#cbb37e' },
  { id: 'kecap', name: 'Sweet Soy', key: '2', chop: false, colour: '#4a2c17', dark: '#2a170a' },
  { id: 'bawang', name: 'Shallot', key: '3', chop: true, colour: '#e9d6f5', dark: '#a97fc4' },
  { id: 'telur', name: 'Egg', key: '4', chop: false, colour: '#ffd76a', dark: '#e0a92e' },
  { id: 'ayam', name: 'Chicken', key: '5', chop: false, colour: '#e8a56b', dark: '#b06a2e' },
  { id: 'udang', name: 'Shrimp', key: '6', chop: false, colour: '#ff8c5a', dark: '#d95a28' },
  { id: 'cabai', name: 'Chili', key: '7', chop: true, colour: '#e5322d', dark: '#9e1b18' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

// Five dishes, one shared pantry: the same ingredients recombine.
export const RECIPES = [
  { id: 'biasa', name: 'Nasi Goreng Classic', price: 15000, needs: ['nasi', 'kecap', 'bawang'], protein: 'bawang', spice: 0 },
  { id: 'telur', name: 'Nasi Goreng Egg', price: 18000, needs: ['nasi', 'kecap', 'bawang', 'telur'], protein: 'telur', spice: 0 },
  { id: 'ayam', name: 'Nasi Goreng Chicken', price: 22000, needs: ['nasi', 'kecap', 'bawang', 'ayam'], protein: 'ayam', spice: 0 },
  { id: 'seafood', name: 'Nasi Goreng Seafood', price: 25000, needs: ['nasi', 'kecap', 'bawang', 'udang'], protein: 'udang', spice: 0 },
  { id: 'pedas', name: 'Nasi Goreng Spicy', price: 20000, needs: ['nasi', 'kecap', 'bawang', 'cabai'], protein: 'cabai', spice: 2 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export const CUSTOMERS = [
  'Bu Sari', 'Pak Budi', 'Mas Agus', 'Mbak Rina', 'Dek Fajar',
  'Pakde Slamet', 'Bu Dewi', 'Mas Joko', 'Mbak Putri', 'Bang Udin',
];

// Where everything sits on the 1280x720 stage. render.js draws here,
// main.js hit-tests here, so the two can never drift apart.
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 16, y: 80, w: 288, h: 330 },
  ticketH: 102,
  ticketGap: 8,
  boardTitleH: 34,
  chopping: { x: 328, y: 440, w: 232, h: 184 },
  wok: { x: 584, y: 440, w: 232, h: 184 },
  plating: { x: 840, y: 440, w: 216, h: 184 },
  serving: { x: 1080, y: 420, w: 184, h: 204 },
  bins: { x: 16, y: 648, w: 1248, h: 60 },
  cookBar: { x: 420, y: 296, w: 440, h: 96 },
};

export const BIN_W = 172;
export const BIN_GAP = 8;

export function binRect(index) {
  return {
    x: LAYOUT.bins.x + index * (BIN_W + BIN_GAP),
    y: LAYOUT.bins.y,
    w: BIN_W,
    h: LAYOUT.bins.h,
  };
}

export function ticketRect(index) {
  return {
    x: LAYOUT.board.x + 8,
    y: LAYOUT.board.y + LAYOUT.boardTitleH + 6 + index * (LAYOUT.ticketH + LAYOUT.ticketGap),
    w: LAYOUT.board.w - 16,
    h: LAYOUT.ticketH,
  };
}

// The three plating slots sit on the same centre the renderer draws the
// plate at, so a click and a picture can never disagree.
export function plateSlots() {
  const c = LAYOUT.plating;
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2 + 10;
  return [
    { id: 'rice', label: 'RICE', x: cx - 52, y: cy - 8, r: 30 },
    { id: 'protein', label: 'MAIN', x: cx + 48, y: cy - 16, r: 28 },
    { id: 'garnish', label: 'TOPPING', x: cx + 4, y: cy + 34, r: 22 },
  ];
}

export function rupiah(n) {
  return `Rp ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function clock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
