# Warung Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Cogaich/warung-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Cogaich/warung-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

An original Indonesian street-food cooking game, built for the [best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137) on make.fun. Referral code: `d9dj2dyr`.

You run a nasi goreng warung for one 3-minute shift. Tickets land on the
order board, each with a patience bar. Pick the ticket, grab its ingredients
from the bins, chop the bawang and cabai on the board (three quick taps),
fry everything in the wok (stop the timing bar in the green zone), plate it
in the right order, and serve it at the pass before the customer walks out.

Five dishes share one pantry, so the same ingredients recombine: Nasi Goreng
Biasa, Telur, Ayam, Seafood and Pedas. Orders arrive faster and patience
runs shorter as the shift goes on. A perfect fry pays +Rp5.000, tidy plating
(no wrong slot taps) pays +Rp3.000, and serving fast pays a speed bonus.

## Look

The art is canvas-drawn and deliberately semi-realistic, not flat vector:
gradient rice and egg, glossy kecap, a flickering wok fire with steam, soft
shadows under every plate and warm lamplight over the counter. Every
screenshot is checked shrunk to 768px wide — the size the judge sees — so
the board, the timer and the food still read at a glance.

## Play

Serve `game/` with any static server and open `game/index.html` in a desktop
browser — it plays offline, no network, no build step:

```
node serve.ts
# open http://localhost:8080
```

Mouse and keyboard: click everything, or use keys `1–7` for the ingredient
bins, `Space` for the wok timing bar, `S` to serve, `P` to pause, `M` to mute.
Sounds are WebAudio bleeps made in code; there are no audio files.

## Screenshots

`screenshots/` holds four real renders of the game's own code: the cover
(a full rush — board, wok, a dish mid-plating, the timer, a plate ready to
serve), chopping mid-action, the wok timing bar, and a full board at low
patience. They are staged with `?shot=cover|chop|cook|rush`, the same way
the kit's starter stages its shots.

## Hand in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored make.fun
library:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
