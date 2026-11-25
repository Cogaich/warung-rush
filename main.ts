// Warung Rush's hand-in program (Node 22, standard library only). The game
// is the plain static files under game/ beside this file — a desktop browser
// opens game/index.html and plays offline, no network, no build step — and
// the screenshots are the real renders under screenshots/. This program
// copies both folders to the output directory and writes the dossier the
// judge reads, using the vendored make.fun library, byte for byte the way
// the scorer writes it. It refuses early where the gate would refuse, so a
// local run that passes is one the scorer accepts.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function countEntries(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    n += 1;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) n += countEntries(full);
  }
  return n;
}

function checkShots(dir) {
  const names = existsSync(dir) ? readdirSync(dir).filter((n) => !n.startsWith('.')) : [];
  if (names.length < 3 || names.length > 4) {
    throw new Error(`screenshots/: ${names.length} images, the gate wants 3 or 4`);
  }
  for (const name of names) {
    const size = statSync(join(dir, name)).size;
    if (size > 262144) throw new Error(`screenshots/${name}: ${size} bytes, over the 256 KiB cap`);
  }
  return names;
}

mkdirSync(outDir, { recursive: true });
const gameDir = join(root, 'game');
const shotDir = join(root, 'screenshots');
if (!existsSync(gameDir)) throw new Error('game/: no such directory');
const indexSize = statSync(join(gameDir, 'index.html')).size;
if (indexSize > 1048576) throw new Error(`game/index.html: ${indexSize} bytes, over the 1 MiB cap`);
const shots = checkShots(shotDir);
if (countEntries(gameDir) > 993) throw new Error('game/: more than 993 files and directories');

cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotDir, join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Warung Rush handed in: ${shots.length} screenshots, dossier written to ${join(outDir, 'dossier.json')}`);
