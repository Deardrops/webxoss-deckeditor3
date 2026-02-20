# WEBXOSS Deck Editor 3

A modern, GPU-accelerated deck builder for the [WIXOSS](https://en.wikipedia.org/wiki/Wixoss) trading card game, built with TypeScript and Pixi.js. This is the third-generation rewrite of the WEBXOSS deck editor, featuring a fully responsive layout, multi-language card search, and a clean event-driven architecture.

[中文文档](./README.zh.md)

---

## Features

- **GPU-accelerated UI** — Rendered with Pixi.js v8 for smooth card grid rendering
- **Responsive layout** — Three-column desktop view, two-column tablet, tab-based mobile
- **Advanced card search** — Filters by color, card type, rarity, and free-text across multiple languages (JP/EN/ZH/KO/RU/IT/SP)
- **Deck validation** — Checks main deck (40 cards), LRIG deck (max 10), duplicate limits (max 4 copies), and Mayu's Room restrictions
- **Import / Export** — Save and load decks as `.webxoss` JSON files or sharable text codes
- **LocalStorage persistence** — Decks are saved automatically in the browser
- **Card detail view** — Shows card image, stats, cost, level, power, and effect text

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.7 (strict mode) |
| Rendering | Pixi.js 8 + @pixi/ui |
| Build tool | Vite 6 |
| Runtime target | ES2020, modern browsers |

## Project Structure

```
src/
├── main.ts                 # Entry point — loads scripts, initializes Pixi app
├── data/
│   ├── types.ts            # Core interfaces: CardInfo, Deck, CardType
│   ├── CardDatabase.ts     # Wrapper around the global card database
│   ├── DeckManager.ts      # Deck CRUD, validation, localStorage persistence
│   └── Searcher.ts         # Rule-based multi-language card search engine
└── ui/
    ├── App.ts              # Root component, layout, import/export modal
    ├── DeckEditorState.ts  # Centralized state + event emission
    ├── EventBus.ts         # Lightweight pub/sub event system
    ├── components/
    │   ├── Button.ts
    │   ├── FilterChip.ts
    │   ├── ScrollContainer.ts
    │   └── CardThumbnail.ts
    └── panels/
        ├── SearchPanel.ts
        ├── DeckPanel.ts
        └── DetailPanel.ts
```

## Prerequisites

- Node.js 18+
- npm 9+
- A running WEBXOSS server (or local copies of the card database scripts) for the card data

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd webxoss-deck-editor3

# Install dependencies
npm install

# Start the development server (http://localhost:3000)
npm run dev
```

## Build

```bash
npm run build
```

Output is written to `dist/`. The build is self-contained and uses relative paths (`base: './'`), so it can be served from any subdirectory.

## Integration with WEBXOSS

DeckEditor3 is designed to be embedded inside the WEBXOSS client page. It loads the following scripts dynamically from the parent directory at runtime:

| Script | Purpose |
|---|---|
| `../lib/util.js` | Shared utility helpers (`toArr`, etc.) |
| `../CardInfo.js` | Card database — exposes `window.CardInfo` (≈3.8 MB) |
| `../Localize.min.js` | Multi-language localization (JP/EN/ZH/KO/RU/IT/SP) |
| `../ImageFileCache.js` | Optional image caching layer (loaded if present) |

When running standalone in development, you will need to either:
- Serve these files from the parent directory via the Vite dev server, or
- Provide mock implementations for local testing.

Card images are fetched from the WEBXOSS media server using the URL pattern:
```
http://<server>/images/<deckid>/<wxid>.jpg
```

## Deck Format

Decks are stored as JSON with the following shape:

```json
{
  "format": "WEBXOSS Deck",
  "version": "1",
  "content": {
    "mainDeck": ["WX01-001", ...],
    "lrigDeck": ["WX01-T01", ...]
  }
}
```

Exported `.webxoss` files use this same format.

## Deck Rules

| Rule | Constraint |
|---|---|
| Main deck | Exactly 40 cards |
| LRIG deck | Must include a Level 0 LRIG; max 10 cards total |
| Duplicates | Max 4 copies of any single card |
| Mayu's Room | Certain card combinations are forbidden |

## License

[MIT](./LICENSE)
