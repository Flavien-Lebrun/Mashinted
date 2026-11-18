# Mashinted — Behaviour Map & Architecture

Living reference of **what the extension does, what triggers it, and which quirks are intentional**.
Companion to [DOCUMENTATION.md](./DOCUMENTATION.md) (dated journal, §7) and [README.md](./README.md) (setup).
Written from a read of the source on 2026-11-17. Items are tagged:

* **[Confirmed in code]**: read directly in the source.
* **[To verify]**: deduced from reading, never observed in a browser.

---

## 1. Mental model in one page

Mashinted is a content script injected on `vinted.fr` / `vinted.com`. It does **not** intercept network traffic (the README's "fetch monkeypatching / MAIN world interception" is outdated; the only MAIN-world script is `public/checker.js`, which just detects React hydration).

Four features, each triggered by something the user (or React) does:

| Feature | Stimulus | Reaction |
| --- | --- | --- |
| **Blacklist** | A card with a blacklisted brand appears; user clicks 🗑 on a card | Card is hidden, counter widget increments |
| **Counter widget + modal** | Page load; click on the chip | Chip shows blocked count; modal edits the blacklist |
| **Aggregator** | User opens the saved-searches dropdown and clicks the Mashinted row | Native feed is wiped and replaced by one section per saved search |
| **Favourites page** | User opens `/member/items/favourite_list` | Items are regrouped into *Sold* / *Available*, with a "delete all sold" action |
| **Inbox** | User opens `/inbox/*` | Floating chip opens every unread conversation one by one |

Features start and stop per route as the user navigates inside the SPA (see §3.2); the boot sequence itself runs once per full page load.

---

## 2. Module map

```
src/
├─ content/
│  ├─ fast-widget-loader.js   document_start: paints the "Filtering…" chip (no layout shift)
│  ├─ index.js                boot(): storage → language → counter subscription → await hydration → router
│  ├─ hydration.js            Injects public/checker.js, resolves on postMessage (or 15 s fallback)
│  └─ router.js               pathname → feature set (favourites | inbox | default)
├─ features/
│  ├─ blacklist/              state · grid-item · trash-engine · observers · counter-widget · modal
│  ├─ aggregator/             scanner · distribution · api · clean-guard · index · grid-item-transfer
│  │                          · modal-helpers · modal-injector
│  ├─ favourites/             favourite-filter
│  └─ inbox/                  index · conversations · wait
├─ shared/                    storage · constants · i18n · locales · logger · dom-observer · css-duration · escape-html
├─ styles/                    one CSS per feature + tokens.css (timings) — injected via manifest at document_start
└─ vinted/                    selectors (ALL Vinted-owned selectors) · dom (queryFirst) · language · templates

public/checker.js             MAIN-world hydration probe (web_accessible_resource)
```

**Rules that keep it contained** (respect them when adding code):

1. Any selector targeting Vinted markup lives in [src/vinted/selectors.js](src/vinted/selectors.js), never inline. *(Violations exist, see §8.)*
2. Anything persisted goes through [src/shared/storage.js](src/shared/storage.js).
3. UI strings go through `t()` ([src/shared/i18n.js](src/shared/i18n.js)); extension-owned CSS classes are prefixed `mashinted-`.
4. Features talk to each other only via `state.js` (blacklist) or `storage.js`; the favourites feature borrows `createSearchDividerNode` from the aggregator.

---

## 3. Boot lifecycle

### 3.1 Sequence

```
document_start ─┬─ fast-widget-loader.js  → appends #mashinted-counter-widget (spinner, "Filtering…")
                └─ content/index.js boot()
                     1. ensureBrandBlacklistStorageReady()   (reads chrome.storage.local, fills cache)
                     2. setLanguage(coarse guess)            (html lang → domain → navigator)
                     3. setupCounterWidgetSubscription()     (listens to count changes)
                     4. await waitForReactHydration()        (checker.js postMessage, max 15 s)
                     5. setLanguage(refined)                 (language selector now rendered)
                     6. startRoute()                         (favourites | inbox | default)
```

Why this order: touching the DOM before React hydrates causes hydration mismatches, so nothing mutates Vinted's tree until step 6. The loading chip is the only thing allowed earlier. **Unverified:** at `document_start` `document.body` is usually still `null`, so the chip is probably attached to `<html>`, and whether that is outside React's hydration root is not confirmed (`checker.js` itself falls back to `body` as the root). A React #418 hydration error was seen once with a dev build and not with the normal build; see the DOCUMENTATION.md journal if it comes back.

### 3.2 Router: SPA-aware, start/stop per route

`createRouter().sync()` is called on every DOM change (frame-batched through `observeDom`). It finds the route matching `location.pathname`:

* **Same route as before:** nothing happens, so features keep running while you move between pages of one route (home → product page → catalog).
* **Different route:** the previous route's `stop()` runs, then the new route's `start()`. Every `start()` returns a function that disconnects its observers and removes what it mounted (inbox chip).
* Home → Favourites or Inbox by clicking a link therefore starts the right features without a reload, and leaving them restores the default ones.

Not verified in a browser yet: this was written with jsdom tests of the router logic only (`test/router.test.js`).

Route table: `favourites` → counter widget + favourites filter **only** (no blacklist observer, no trash buttons, no aggregator). `inbox` → removes the counter chip, mounts the inbox chip. `default` → everything else.

---

## 4. Feature: Blacklist

### 4.1 Data

* Stored in `chrome.storage.local["bannedBrands"]` as lowercase, trimmed, deduplicated strings.
* `storage.js` keeps an in-memory `cachedBannedBrands`, synced across tabs by `chrome.storage.onChanged`. `isBlacklistedBrand()` is **synchronous** and reads only the cache.
* No defaults: a fresh install starts with an empty list, and an emptied list stays empty.

### 4.2 Detection path (automatic)

```
observers.startObserver()
  └─ finds HOMEPAGE_BLOCKS_SELECTOR container (feed/catalog grid… or <main> as last resort)
       └─ MutationObserver → watchGridItemsWithin(node) for every added node
            └─ watchGridItemForBrandName(card)
                 ├─ retryLogBrandNameWithin: polls every 100 ms, up to 30 times, until a brand text exists
                 │     (brand text arrives late after hydration)
                 ├─ if brand ∈ blacklist → blockGridItem(card, brand)      ← animated hide
                 └─ per-card MutationObserver: if React re-renders the card, re-enforce or re-check
```

* `startObserver()` re-checks for the grid on every frame-batched DOM change (`observeDom`) and re-attaches the card observer when the grid element changes, so new grids after in-app navigation are scanned. (It used to disconnect 5 s after the first grid.)
* `getProductId` tries 3 strategies (link href → inner `data-testid` → favourite button `data-testid`) so blocking survives React re-keying the DOM. Falls back to element identity (`WeakSet`) when no id can be found.

### 4.3 Manual path (trash click)

[trash-engine.js](src/features/blacklist/trash-engine.js) watches `aria-pressed` attribute changes (it appears once React hydrates the favourite button) and injects a 🗑 button next to each card's favourite button.

Click → `addBrand(brand)` → `blockGridItem(card, brand, isManual=true)` → **instant** `display:none`.

### 4.4 Two hide modes, on purpose

| Mode | When | Behaviour | Why |
| --- | --- | --- | --- |
| **Animated** (`enforceHiddenGridItem`) | Automatic scan | Fade + height collapse (`--mashinted-hide-duration` 450 ms), then `display:none` | No visual jump while scrolling |
| **Instant** (`isManual = true`) | Trash click **and** "Re-enforced Block" (React re-rendered an already-blocked card) | `display:none !important` immediately | React unmounts children mid-click and leaves a ghost gap with the animated path (§7.2) |

Also intentional: `inert = true` + `blur()` before hiding, to avoid the "aria-hidden ancestor has focus" browser error.

### 4.5 State that is *not* a bug

* `blockedProductIds` / `brandSessionStats` live in memory for the **whole page session** (never reset on SPA navigation). Only the **badge count** resets when the URL changes (`resetPageBlockedCount` in `startPageTransitionObserver`).
  → After navigating, the badge says `0` but the modal can still show `+N` per brand from earlier pages. Different scopes: *page* vs *session*.
* Un-checking a brand in the modal removes it from storage but **does not un-hide already hidden cards** on the current page (their ids stay in `blockedProductIds` and `trash-engine` re-enforces them). Reload to see them again. [Confirmed in code]
* Cards are re-enforced by id: a blocked product stays hidden even if React replaces its DOM node. That is the point of `blockedProductIds`.

---

## 5. Feature: Counter widget & modal

### 5.1 Widget lifecycle

1. `fast-widget-loader.js` creates `#mashinted-counter-widget` with a spinner.
2. `ensureCounterWidgetMounted()` (called from the route and from the page-transition observer) waits until **≥ 600 ms** since script start, plays the exit animation (200 ms), swaps in the real chip (logo, "Blocked", count, chevron) and sets `data-hydrated="true"`.
3. Self-healing: `startPageTransitionObserver` re-mounts the widget if React wipes it, and resets the count on URL change.
4. The 600 ms minimum is a deliberate UX delay, not lag.

### 5.2 Modal ([modal.js](src/features/blacklist/modal.js))

* Opened by the chip; chip toggles `web_ui__Chip__activated` / `aria-pressed`. Clicking the chip again destroys the modal.
* Checkbox uncheck → `removeBrand`; recheck → `addBrand`; no exact match for the search text → a "Block *query*" row.
* `+N` per brand comes from `getBrandSessionSnapshot()` taken **when the modal opens** (live updates go through `subscribeToBrandStatsChanges`).

---

## 6. Feature: Aggregator (saved searches → unified feed)

### 6.1 Stimulus chain

```
startSavedSearchesObserver()  (default route, whole document.body)
  └─ on DOM additions, next animation frame:
       if saved-search links exist and #mashinted-aggregator-a absent → injectSavedSearchButton()
            └─ scanSavedSearches()  → bookmarked searches + unread counts
            └─ button shows total (+99 cap) and breakdown; hidden counter when total = 0
click on button
  ├─ guard: data-loading flag, total > 0
  ├─ closeSavedSearchesModal()   (synthetic mousedown/mouseup + click on the backdrop; React listens to pointer events)
  ├─ cleanupPreviousAggregation()  (removes earlier aggregated cards/dividers/banners)
  ├─ progress banner prepended to the grid
  └─ processScannedSearches()
```

### 6.2 `processScannedSearches`: what happens, in order

1. Needs the grid (`getActiveGridContainer`, `HOMEPAGE_FEED_SELECTORS`). **No grid → throws** "Catalog grid not found" and the banner shows the error (so it only works on pages that have the homepage grid).
2. `calculateFetchDistribution(items, 99, 30)`: only searches with `count > 0`. If the **sum > 99**, each search is capped to **30**; otherwise each fetches exactly its unread count.
3. **Wipes the native feed** (`clearGridProgressively`, 12 nodes per animation frame, skipping nodes tagged `data-mashinted-aggregated`) and hides the "Load more" button. *This destruction is intentional*: the aggregated view replaces the feed.
4. Starts `startGridInterceptorGuard` (MutationObserver) which deletes any native cards React re-adds during the run.
5. For each search: `fetch` its URL (same origin, 8 s timeout, CSRF header) → `DOMParser` → `parseCatalogItems(html, targetToFetch)` → **drop blacklisted brands** → build divider + cards → 300 ms pause.
6. `finally`: disconnect guard, final purge, hide Load more.

### 6.3 Quirks that are by design

* **Items injected ≤ pending count.** Blacklisted brands are filtered out of the aggregated cards, so `✅ X item(s) injected` can be lower than the `+N` on the button. The blacklist applies here too, but through `isBlacklistedBrand`, **not** through the grid blocking pipeline, so these cards are never counted in the "Blocked" badge.
* **Searches are processed in reverse** (`items.slice().reverse()`) because every divider is inserted right under the banner; reversing makes the final top-to-bottom order match the saved-search order.
* **Cards in a section are inserted in reverse** next to their divider so the DOM order equals the visual order (CSS Grid places by DOM order, §7.9).
* **`mashinted-sectioned-grid` + `mashinted-section-start`**: forces sparse row flow and pins the first card of each section to column 1, so Vinted's `grid-auto-flow: dense` can't pull cards across dividers (§7.11; the sparse-flow class came with PR #24).
* **Everything injected is tagged `data-mashinted-aggregated="true"`** (on every descendant too). This tag is the only thing protecting extension cards from the guard observer. Removing the tagging makes the guard delete your own cards.
* **Fetch is a plain HTML scrape**, not the Vinted API. A markup change breaks parsing silently (empty price shows `—`, no items). Fix selectors in `vinted/selectors.js` (`CATALOG_PART`).
* **Favourite on an aggregated card** calls Vinted's real endpoint `POST /api/v2/user_favourites/toggle` (token from `<meta csrf>` or an inline script) and, on success, mirrors the item into `chrome.storage.local["mashinted_favorites"]`. On failure the button reverts.
* **Trash on an aggregated card** adds the brand to the blacklist the same way as on native cards.

---

## 7. Feature: Favourites page & Inbox

### 7.1 Favourites ([favourite-filter.js](src/features/favourites/favourite-filter.js))

* `observeDom(organizeFavouriteGrid)`: runs on every DOM change (frame-batched). Idempotent: skips if the grid is already grouped **and** the item count equals the tracked count; re-groups when lazy-loaded batches add items.
* Sold detection: `ITEM_STATUS_SELECTOR` element, **or** the card text contains the per-language `soldKeyword` (fallback: a card whose title merely contains that word, e.g. "sold out vintage", is treated as sold) [To verify].
* Order is **Sold first, then Available**. The section DOM is rebuilt: cards are removed and re-appended, and their class is overwritten with `mashinted__feed-grid__item`.
* "Delete all sold": clicks each card's native favourite button staggered by 120 ms (this is the real un-favourite, sent to Vinted), plays zoom-out, then `display:none` after 600 ms.
* It injects its own `<style>` tag at runtime (`#mashinted-grid-fix-styles`), unlike every other feature. See §8.

### 7.2 Inbox ([features/inbox/](src/features/inbox/))

* Unread = row with `web_ui__Cell__highlighted`. The chip shows the unread count; click starts a **sequential** walk: click row → wait until it's no longer unread (4 s timeout) → 400 ms pause. Click again to stop.
* Only rows already rendered are walked (no lazy-load scrolling).
* No deletion feature on purpose (page reload kills the content script; see §7.19).

---

## 8. Things that look like bugs (triage list)

### 8.1 Probably intentional, and it's the structure's fault

| Symptom | Real cause |
| --- | --- |
| Badge shows 0 but modal shows `+N` | Page-scoped count vs session-scoped stats (§4.5) |
| Hidden items don't come back after un-checking a brand | Blocked ids persist until reload (§4.5) |
| Aggregator injected fewer items than the `+N` | Blacklist filter applied (§6.3) |
| Native feed disappears after aggregation | By design (§6.2 step 3) |
| Widget stays on "Filtering…" for a moment | Intentional 600 ms minimum + hydration wait |
| No trash buttons / no blocking on Favourites & Inbox | Those routes don't start the blacklist features (§3.2) |
| Aggregated cards never count in "Blocked" | Different pipeline (§6.3) |
| Cards flip from fade to instant disappear | Animated vs manual/re-enforced path (§4.4) |

### 8.2 Real code smells and probable defects found during this read

| # | Finding | Status | Impact |
| --- | --- | --- | --- |
| 1 | **Emptying the blacklist re-seeds the defaults.** `ensureBrandBlacklistStorageReady` treats an empty stored list as "first run" and writes `h&m/shein/zara` again on next page load. | [Confirmed in code] | **Resolved (DOCUMENTATION §7.24):** no hardcoded brands; an empty list stays empty and the modal shows a centred how-to message |
| 2 | `hasInitialScanCompleted` is declared and read but **never set to `true`**; the "hide the widget when count is 0" branch is dead code. `ensureCounterWidgetMounted` also always adds `is-visible`. | [Confirmed in code] | **Decision: leftover from when the widget worked alone.** The chip must always stay visible (loading → count). **Resolved:** dead flag and hide branch removed |
| 3 | Trash click only hides the clicked card; the comment says other cards of that brand are caught by the observer. `addBrand` triggers **no rescan**, and per-card observers only react to mutations inside that card. | [Confirmed by owner] | **Resolved (DOCUMENTATION §7.23):** adding a brand now rescans the page and hides every matching card |
| 4 | The root observer disconnected 5 s after the grid appeared, so new grids after an SPA navigation were not scanned by brand. | [Confirmed in code] | **Resolved (DOCUMENTATION §7.25)**, pending a browser check |
| 5 | `HOMEPAGE_BLOCKS_SELECTOR` ends with `main` as "ultimate fallback", so the observer can attach to the whole page content on unknown layouts. | [Confirmed in code] | Heavier observation, possible unexpected matches |
| 6 | **DOCUMENTATION §7.8 is stale**: it describes `getActiveGridContainer()` rebuilding `homepage-blocks`. The current function only returns the grid or `undefined`. | **Resolved** | Stale claim removed from §7.8. The fallback dates from an earlier version with React resets that no longer occur |
| 7 | Dead code (`mountLoadingWidget` already removed): `renderFetchControlsContainer` (modal-injector.js), `clearAllBrands`, `getFavorites` has no reader outside storage.js. | [Confirmed in code] | Confusing "which one runs?"; favourites mirror is write-only |
| 8 | Duplicated ids/constants: widget id is a literal in `fast-widget-loader.js`, `counter-widget.js`, `observers.js` even though `COUNTER_WIDGET_ID` exists in constants. | [Confirmed in code] | Rename risk |
| 9 | Listener leaks: `injectSavedSearchButton` adds a `document.addEventListener('click', …)` on every injection and never removes it (the button can be re-injected after the modal reopens). | [Confirmed in code] | Small, grows per reopen |
| 10 | `ensureCounterWidgetMounted` is called from the route **and** from `startPageTransitionObserver`; before `data-hydrated` is set, each call schedules its own timers. | [To verify] | Possible double swap; harmless but wasteful |
| 11 | Rule breaks: raw selectors in `modal-injector.js` (`.feed-grid`, `#content`, `data-testid="search-bar-background"`), `scanner.js` (`.web_ui__Cell__suffix`), and a `<style>` injected from JS in `favourite-filter.js`. Many `!important` and inline styles. | [Confirmed in code] | These are the usual breakage points when Vinted ships |
| 12 | README still advertises network interception / `fetch` monkeypatching and "Advanced sorting"; neither exists. | **Resolved** | README rewritten. The claims came from the abandoned idea of blocking during React hydration |
| 13 | `manifest.json` version `1.0` is overridden at build from `package.json`; host permissions cover only `.fr` and `.com` (docs mention `.co.uk`/`.es`/`.nl` detection, but the extension won't run there). | [Confirmed in code] | Language support for es/nl only applies if the user views `.fr`/`.com` in that language |

---

## 9. Where to fix what (cheat sheet)

| Vinted changed… | Edit |
| --- | --- |
| Card markup / test ids | [src/vinted/selectors.js](src/vinted/selectors.js) |
| Catalog HTML parsing (prices missing) | `CATALOG_PART` in selectors + `parseCatalogItems` in [api.js](src/features/aggregator/api.js) |
| Card template for injected cards | [src/vinted/templates.js](src/vinted/templates.js) |
| Animation speed | [src/styles/tokens.css](src/styles/tokens.css) (JS reads it via `css-duration.js`) |
| A string | [src/shared/locales.js](src/shared/locales.js) (en/fr/es/nl; `test/i18n.test.js` enforces key parity) |
| Fetch caps (99 / 30) | `calculateFetchDistribution` call in [aggregator/index.js](src/features/aggregator/index.js) |
| Build / releases | [vite.config.js](vite.config.js), [Makefile](Makefile), `.github/workflows/` |

Always load a **`make build`** output when testing: a stale `dist/` from `npm run dev` contains HMR stubs and makes fixes look ineffective (§7.14, §7.17).
