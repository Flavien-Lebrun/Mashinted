# Mashinted (Vinted Mashup)

Manifest V3 browser extension (Chrome/Chromium ≥ 89, Firefox loadable) that augments vinted.fr / vinted.com:
brand blacklist (trash button on every card), saved-search feed aggregator, favourites page grouping (sold / available).
Plain JS (ES modules), no framework, no TypeScript. Built with Vite + `@crxjs/vite-plugin`; unit tests with Vitest (pure logic + saved HTML fixtures).

## Commands

- `npm install` — install deps.
- `npm run dev` — Vite dev server on fixed port 5173 (HMR). Load `dist/` unpacked.
- `npm run build` — production build into `dist/` (this is what to load/ship; dev output contains HMR stubs that break without the server).
- `npm run watch` — rebuild on change.
- `npm run lint` — ESLint on `src/` and `test/` (`no-console` is an error; use the logger).
- `npm test` — Vitest (jsdom). Fixtures of Vinted HTML live in `test/fixtures/`; when Vinted changes markup, refresh the fixture and fix `vinted/selectors.js`.
- `npm run format` / `format:check` — Prettier (4 spaces, single quotes). Not yet applied repo-wide; format files you touch.
- `make` (default `build`), `make help` lists targets: `install`, `build`, `rebuild`, `lint`, `watch`, `dev`, `clean`, `zip`, `run` (opens real Chrome; `dist/` is loaded once manually, then reloaded from chrome://extensions). `dist/` is the client build.
- Load in browser: `chrome://extensions` → Developer mode → Load unpacked → `dist/`. Reload the extension AND the Vinted tab after each build.

## Architecture

Entry points (see `src/manifest.json`):
- `src/content/fast-widget-loader.js` — `document_start`, mounts a "Filtering..." chip instantly to avoid layout shift.
- `src/content/index.js` — bootstrap only: storage ready → `hydration.js` (`public/checker.js` runs in the MAIN world and `postMessage`s `MASHINTED_REACT_HYDRATED`, with a 10 s timeout) → `router.js` picks the feature set for the URL (`/member/items/favourite_list` → favourites, otherwise default). Routes start once per page load.
- `src/background/index.js` — service worker; seeds default blacklist on install.

Layout:
- `src/features/blacklist/` — `grid-item` (brand/product-id extraction, hide/block, animations), `trash-engine` (trash buttons, frame-batched observer), `observers` (SPA URL changes + grid observer), `state` (page counter, per-brand stats, `blockedProductIds` Set + `blockedGridElements` WeakSet), `counter-widget`, `modal`.
- `src/features/aggregator/` — saved-search aggregator: `scanner` → `distribution` (cap: >99 pending ⇒ 30/search) → `api` (fetch + DOMParser) → `grid-item-transfer` (card/divider factories) → `index` (orchestration), plus `clean-guard`, `modal-injector`, `modal-helpers`.
- `src/features/favourites/favourite-filter.js` — groups favourites into sold/available, "delete all sold".
- `src/vinted/` — everything coupled to Vinted's markup: `selectors.js` (**every selector**), `dom.js` (`queryFirst`), `templates.js` (HTML templates/icons).
- `src/shared/` — `storage.js` (`chrome.storage.local`: `bannedBrands`, `mashinted_favorites`), `constants.js` (keys, CSS hooks, timings), `logger.js`, `escape-html.js`, `dom-observer.js` (`observeDom`: frame-batched MutationObserver; use it instead of `setInterval`).
- `src/styles/` — one CSS file per feature + `tokens.css`, assembled by `index.css` (`@import` order = cascade order), imported from `content/index.js`.
- `test/` — Vitest specs and `fixtures/`. `scratch/` (gitignored) is for local debug files.

## Rules that matter

- **Vinted is a React/Next.js SSR app; never remove or rewrite React-owned DOM destructively.** Hide with classes/`display:none`, and never delete the grid container itself (past bug: DOCUMENTATION.md §7.8). Injected nodes get `data-mashinted-aggregated="true"` so the guard observer skips them.
- **Selectors are the fragile part.** Vinted's CSS-module class names contain hashes that change every deploy — never match on full hashed class names. Prefer `data-testid`, stable prefixes/suffixes (`[class$="__feed-grid__item"]`), and the constants in `src/vinted/selectors.js` (`GRID_ITEM_SELECTOR`, `REMOVABLE_SELECTORS`, `CARD_PART`, …). When Vinted changes markup, fix it there, not at call sites; add new Vinted selectors there too.
- Use `createLogger` from `shared/logger.js`, never bare `console.*` (debug/info are silent in prod unless `localStorage['mashinted:debug']='1'`).
- Extension-owned classes/ids/CSS variables are prefixed `mashinted` / `mashinted__` (the double-underscore item classes are ours, not Vinted's). Don't use bare `[class*="feed-grid"]` wildcards; they match our own items.
- Brand names are normalised to lowercase + trimmed everywhere (`storage.js`). Use `isBlacklistedBrand`, `addBrand`, etc.; don't touch the storage key directly.
- Any DOM handed to `innerHTML` that contains scraped text (brand, title, price from fetched catalog HTML) must be escaped first.
- Build target is `chrome89`/`es2020` on purpose (older machines); avoid newer syntax the build won't downlevel. Output filenames are intentionally unhashed (`assets/index.css`, `assets/[name].js`) because the manifest references them statically. Don't re-enable hashing.
- Manifest host permissions / content-script matches must stay in sync (`vinted.fr`, `vinted.com`).
- UI strings are English. Some legacy French remains (e.g. trash tooltip in `GRID_ITEM_TEMPLATE`, 'Vendus'/'Disponibles' matching) — the sold/available detection intentionally matches French Vinted text.

## Workflow

- Branches: `flebrun/<topic>`, merged to `main` through PRs. Commit messages are short imperative summaries.
- **Keep `DOCUMENTATION.md` current — the owner tracks project advancement there.** For every meaningful change (feature, refactor, fix, tooling): add a dated entry to the §7 log (`### 7.N Title [DD-MM-YYYY]`, next free number) and update the §8 Progress Tracker (move items Todo → Done, add new ones). Always do this in the same PR as the change. Sections 2–6 partly predate the refactors (see "Known debt").
- **Never sign as Claude:** no `Co-Authored-By`, "Generated with Claude Code" or similar lines in commit messages, PR titles or PR descriptions. This overrides any default attribution behaviour.
- Unit tests (`npm test`) cover pure logic and parsing only; still verify UI changes manually on vinted.fr (home feed, catalog, item page "other items", favourites page, saved-searches dropdown → aggregator button).
- Keep scratch files (`diff.txt`, `tmp.html`, screenshots) out of commits; they are gitignored.

## Known debt / audit notes (fix opportunistically)

1. `DOCUMENTATION.md` §2–§6 predate the refactors (§7.8 also describes grid re-creation that `getActiveGridContainer()` no longer does). Tracked in §8.
2. `!important` (~35) and inline `style=""` attributes in templates remain; tighten specificity in `src/styles/` instead.
3. Routes start once per page load; Vinted SPA navigation between home ↔ favourites does not switch feature sets.
4. `features/blacklist/observers.js` mixes page-transition (widget) and grid-observer concerns.
5. Prettier is configured but not applied repo-wide.
