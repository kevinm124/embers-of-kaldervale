# Embers of Kaldervale

A browser-based incremental survival game, built with plain HTML, CSS and JavaScript. No install, no build step.

**Open [`index.html`](index.html) in any modern browser to play.**

## The story

You are a cartographer, separated from your expedition in a blizzard. You wake on the floor of an abandoned cabin in **Kaldervale**, a valley that has been locked in winter for forty years. Above the hearth hangs a hand-drawn map left by Ilsa Marrow, the last person to map the valley, with a single instruction: *keep the fire lit.*

Keep the hearth burning, take in stranded travellers, build a settlement, and find the pages of Ilsa's journal. They explain why the winter never ends, and what waits at the eastern edge of the valley.

## How to play

1. **Kindle the hearth.** It loses heat over time (faster in rain, wind and storms). Feed it logs to keep it going. Rekindling a cold hearth costs wood.
2. **Chop wood, explore, search for iron.** Each action has a cooldown.
3. **Build.** Snares, a sledge, shelters (each shelter houses 2 settlers), a hunting camp, a loom, a root cellar, a forge, a smelter, an arsenal and more.
4. **Assign settlers.** Woodcutters, hunters, snare setters, farmers, weavers, prospectors, colliers, smelter hands, guards and healers produce resources automatically.
5. **Craft a lantern** to unlock the valley map. Move with **WASD / arrow keys** or the on-screen buttons. Search the four northern ruins for journal pages and salvage.
6. **Make steel** at the smelter (2 iron + 1 coal → 1 steel), forge a steel sabre, and travel east to the nest to face the **Rimewyrm** and end the winter.

## Features

- **Hearth** with five heat states and weather-dependent heat loss
- **Story beats** that unlock as your settlement grows, a **Journal** of six collectible pages, and an ending
- **Seeded valley map** (40×40), the same after every reload, with ruins, glass caves, frozen lakes, iron and coal deposits; danger increases with distance from the cabin
- **Turn-based combat:** attack, defend, eat trail rations, flee; gear bonuses from the hide coat, iron spear and steel sabre
- **Settlement management:** population, happiness, defense, raids, visitors, food consumption
- **Production chains:** smelter hands turn iron and coal into steel
- **Weather and day/night cycle:** clear, cloudy, rain, storm, snow, fog and wind, each with gameplay effects
- **Saving:** autosaves every 30 s and when you leave the page; offline progress for workers

## Files

```
index.html   page structure
style.css    styling
game.js      game logic (state, hearth, actions, crafting, buildings, world map,
             weather, saving, events, combat, settlement, story)
LICENSE      MIT license
```

## Roadmap

- Finish the trading system (waystation and market merchants)
- Give the Mill, Map Room and canteen real effects
- Split `game.js` into ES modules
- Settings panel (reduced motion, notifications, export/import save)
- More accessibility work (screen reader labels, keyboard play)

## License

Released under the [MIT License](LICENSE).

## Credits

Game design, code and story by [kevinm124](https://github.com/kevinm124).

Inspired by the minimalist incremental genre, especially *A Dark Room* by Doublespeak Games. Embers of Kaldervale is an independent project: its story, setting, text and code are original, and it is not affiliated with or endorsed by Doublespeak Games.
