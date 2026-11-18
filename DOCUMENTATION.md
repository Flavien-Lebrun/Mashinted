# Mashinted — Technical Documentation & Specifications

This document details the functional specifications, technical constraints, UI/UX behaviors, and structural DOM patterns for **Mashinted**, a web extension designed to improve user experience on Vinted by allowing users to blacklist and filter out listings from specific brands.

---

## 1. Project Goal & Overview

The primary objective of **Mashinted** is to filter product listings from the user's view based on a customized blacklist of brands.

### Core Flow:

* **Blacklist Storage:** The blacklist is persisted in `chrome.storage.local` (key `bannedBrands`) as a list of brand names standardized in **lowercase**. There are no default brands: a fresh install starts empty.
* **On-Demand Blacklisting:** A trash icon is injected into every product listing card. Clicking this icon immediately adds the associated brand to the blacklist.
* **Dynamic Filtering:** Any matching product listing is smoothly hidden from view without breaking the native page flow or leaving layout gaps.
* **Real-Time Analytics:** The extension tracks both total listings blocked and per-brand session statistics (`brandSessionStats`, read with `getBrandSessionSnapshot`).
* **Cross-Search Feed Aggregation:** Extracts pending items from bookmarked saved searches through a content-script `fetch` and `DOMParser` parser (there is no background script), clearing default page grids progressively and injecting multi-search results into unified catalog grids.
* **Favorites Storage Management:** Persists cross-page aggregated favorite items locally using `chrome.storage.local` with `FAVORITES_STORAGE_KEY`.
* **RGPD compliance:** The extension operates entirely through local scripts. No data from Vinted or its users is collected, stored, or transmitted externally. All processing remains local and is intended solely for the user's personal use.

---

## 2. Component Specifications

What each feature does, and which files implement it. For stimulus → reaction flows and the behaviours that look like bugs but are intentional, see [ARCHITECTURE.md](./ARCHITECTURE.md). Section 7 below is the dated history of how it got here.

### 2.1 Product Listings (Behavior)

Files: `src/features/blacklist/{grid-item,state,trash-engine,observers}.js`.

When a listing belongs to a blacklisted brand, whether found on load, after a trash click, after a brand is added, or on a React re-render:

* **Automated hide:** fade-out and height collapse sharing one duration (`--mashinted-hide-duration`, 450 ms, read from CSS through `shared/css-duration.js`), then `display: none`.
* **Manual trash click and re-enforcement of an already blocked card:** instant `display: none !important`, with no animation timers, so React unmounting children mid-click cannot leave a ghost gap (§7.2).
* **Accessibility:** `inert = true` and `.blur()` on the active element before hiding, to avoid focus-trap errors on `aria-hidden` ancestors.
* **Adding a brand rescans the page** (trash click, modal, or another tab), so every matching card on screen is hidden, not only the clicked one (§7.23). The rescan only hides: removing a brand does not un-hide cards until reload.

### 2.2 Hydration Shell & Counter Widget

Files: `src/content/{fast-widget-loader,hydration,index}.js`, `public/checker.js`, `src/features/blacklist/counter-widget.js`.

A two-phase lifecycle avoids UI flashing and survives React wiping the DOM.

* **Phase 1, `fast-widget-loader.js` (document_start):** mounts a non-interactive chip with an inline SVG spinner (Vinted's `--primary-default` colour) and the localised label `widgetFiltering` ("Filtering..."). No layout shift.
* **Hydration gate:** `boot()` waits for `public/checker.js`, which runs in the page's MAIN world (React internals are invisible from the isolated content-script world) and posts a message when React has hydrated, or after a 10 s timeout. `hydration.js` adds a 15 s fallback.
* **Phase 2, `counter-widget.js`:** enforces a minimum loading time (`MIN_LOADING_TIME_MS = 600`), adds `.mashinted-is-exiting` (200 ms), swaps in the real chip (logo, "Blocked:", count badge, chevron) and plays the entry animation.
* **Interactive state:** the badge shows the page-scoped count (`latestCountMemory`, reset when the URL changes). Clicking the chip toggles `web_ui__Chip__activated` / `aria-pressed` and opens or closes the modal. The chip is never hidden once mounted, even at 0.
* **Self-healing:** if React wipes the widget, `startPageTransitionObserver` re-mounts it without losing the count.

### 2.3 Management Modal (`createConfigModal`)

File: `src/features/blacklist/modal.js`.

* **Header:** search field (`.mashinted-filter-search-input`) and a close button that fades out over 220 ms. The returned handle exposes `updateList` and `destroyModal`.
* **Counters:** `getStats()` returns a fresh per-brand session snapshot on every render, so a brand added while the modal is open shows its `+N` straight away. Rows are sorted by count (descending), then alphabetically.
* **Checkboxes:** unchecking calls `onDeleteBrand` and mutes the row (`.mashinted-row-muted`); re-checking calls `onAddBrand`.
* **Quick add:** typing a query with no exact match adds a "Block *query*" row with a `+` button; Enter adds it too.
* **Empty state:** there are no default brands. An empty list stays empty, and the list keeps a 40vh minimum height with a centred message explaining the trash icon and manual input.

### 2.4 Saved Search Aggregator (`src/features/aggregator/`)

Scans bookmarked saved searches and replaces the home feed with their new items, one section per search.

* **`scanner.js` and `distribution.js`:** read the bookmarked rows (`a[data-testid^="saved-search-"]`). If the total of pending items is **≤ 99**, every search fetches all its items; above 99, each search is capped at **30**.
* **`api.js`:** fetches each search page from the content script (a same-origin `GET` with an 8 s timeout; it adds an `X-CSRF-Token` header only if the old `<meta name="csrf-token">` exists, which it no longer does on Vinted, and works without it) and parses it with `DOMParser`. There is no background script.
* **`clean-guard.js`:** clears the native feed in `requestAnimationFrame` batches of 12 and runs a `MutationObserver` that removes native cards React re-adds during a run. Everything the extension injects is tagged `data-mashinted-aggregated="true"` so this guard never removes it.
* **`grid-item-transfer.js` and `modal-helpers.js`:** build the section dividers and cards (title, brand, price, favourite and trash buttons) and the progress banner. The favourite button calls Vinted's `POST /api/v2/user_favourites/toggle`; the CSRF token is read from the page's streamed data (`"CSRF_TOKEN"`, §7.22) and the item is mirrored in `chrome.storage.local` under `FAVORITES_STORAGE_KEY`.
* **`modal-injector.js`:** injects the aggregator row into the saved-searches dropdown, with a tooltip and live status.
* **`index.js`:** orchestrates a run. Blacklisted brands are filtered out of the fetched items, so "injected" can be lower than the `+N` on the button.

### 2.5 Favourites Page & Inbox

* **Favourites (`features/favourites/favourite-filter.js`):** regroups the page into **Sold** and **Available** sections (sold first) with a "delete all sold" action that clicks Vinted's native un-favourite buttons. The grid is found with `findFavouritesGrid()`: the class selector first, then the parent of the first card, because Vinted's grid classes vary.
* **Inbox (`features/inbox/`):** a floating chip that opens every unread conversation one after the other (opening marks it read on Vinted's side).

### 2.6 Routing

File: `src/content/router.js`. Vinted is a SPA, so `createRouter().sync()` runs on every frame-batched DOM change. When the matching route (`favourites`, `inbox`, `default`) changes, the previous route's `stop()` runs and the new route's `start()` begins; navigating inside the same route keeps its features running (§7.25).

---

## 3. Environmental Limits & Architectural Constraints

### React Server Components (RSC) Streaming & SSR

Most of Vinted's feed is server-rendered and hydrated by React.

1. **Avoid React collisions:** deleting or restructuring React-owned DOM can crash reconciliation. Hiding uses classes and styles, and the extension's own nodes are tagged so they can be told apart.
2. **Hydration gate:** features start only after `checker.js` reports hydration, because touching the DOM earlier can cause hydration mismatches. The loading chip is the only thing mounted earlier.
3. **Observer scope:** the card observer attaches to the current feed grid (`HOMEPAGE_BLOCKS_SELECTOR`, whose last entry is a `main` fallback) and re-attaches when the grid element changes.
4. **Self-healing widget:** the widget presence check runs on `document.getElementById('mashinted-counter-widget')`; if React wipes it, it is re-mounted with the stored count.
5. **Unstable markup:** Vinted's CSS-module class names contain hashes that change on every deploy, and layouts vary by source and viewport. All selectors that target Vinted live in `src/vinted/selectors.js`, and `npm run build:check` bundles a dev-only health panel that checks them on the real site (§7.22).

---

## 4. Design System & CSS Token Mapping

Extension tokens live in `src/styles/tokens.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--mashinted-text` | `#111111` | Body copy, brand names |
| `--mashinted-muted` | `#7c7c7c` | Secondary text, empty state, icons |
| `--mashinted-primary` / `-hover` | `#007784` / `#005f6a` | Accents, focus, checkbox |
| `--mashinted-danger` | `#d93838` | Destructive hover |
| `--mashinted-bg` / `-border` | `#ffffff` / `#e6e6e6` | Surfaces and separators |
| `--mashinted-hide-duration` | `450ms` | Blacklist fade and collapse |
| `--mashinted-collapse-duration` | `250ms` | Aggregator section fold / unfold |
| `--mashinted-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Shared easing |

Where the extension blends with Vinted, it uses Vinted's own variables so it follows their theme: `rgba(var(--primary-default), 1)` for accents and spinner strokes, `rgb(var(--greyscale-level-5))` for input backgrounds. JS timers read the duration tokens through `shared/css-duration.js`; the constants in `shared/constants.js` are fallbacks only.

---

## 5. Structural DOM References

### 5.1 Multi-Strategy Product ID (`getProductId`)

Vinted keeps testing layouts, so a card's product id is resolved through a fallback chain (`src/features/blacklist/grid-item.js`):

1. The product link: `a[href^="/items/"]`, taking the digits after `/items/` (most reliable).
2. The inner container's `data-testid`, with prefix `product-item-id-`, `other_user_items-` or `similar_items-`.
3. The favourite button's `data-testid`, with the same prefixes.

If no id is found, the card is tracked by element identity (`WeakSet`). The selectors for each step are in `src/vinted/selectors.js`.

### 5.2 Where Selectors and Markup Notes Live

* **One source:** `src/vinted/selectors.js` holds every selector that targets Vinted-owned markup, grouped by area (grid and cards, saved searches, language selector, inbox, page-level). Fix breakage there, not at call sites.
* **Known markup facts:** the home grid is a CSS grid whose item classes are hashed; `card-inner` testids exist on catalog pages but not on the home feed; the CSRF token is no longer in a `<meta>` tag but in the streamed page data (`\"CSRF_TOKEN\"`); unread inbox rows carry `web_ui__Cell__highlighted`.
* **Checking them:** the dev panel (`npm run build:check`) runs the selector checks per page, keeps results across page loads and copies a plain-text report.

---

## 6. CSS & Animation Specifications

Styles are split per feature in `src/styles/` and imported in a fixed order by `index.css` (the order preserves the cascade). Vite bundles them into `assets/index.css`, which the manifest injects at `document_start` (§7.14).

| File | Covers |
| --- | --- |
| `tokens.css` | Colour and timing tokens |
| `blacklist.css` | Blacklist hide animation, trash button (`mashintedSpringIn`) |
| `progress-banner.css` | Aggregator progress banner and spinner (`mashinted-spin`, 0.85 s linear) |
| `counter-widget.css` | Counter chip, exit/entry swap (`mashintedContentSwap`, 0.35 s) and badge bump (`counter-smooth-increment`) |
| `modal.css` | Blacklist modal, brand list, empty state, checkboxes |
| `widget-chip.css` | Chevron, active chip state and custom checkbox framework |
| `aggregator.css` | Aggregated grid sections, dividers, cards, fold animation (`mashinted-slide-down`) |
| `inbox.css` | Inbox floating widget |

Conventions: durations come from the tokens above; `prefers-reduced-motion` shortens them to 1 ms; on aggregator cards, `will-change`, `overflow: hidden` and `transform` are applied only during a fold or unfold, not permanently (§7.16).

---

## 7. Complete Issue & Debugging Log

> Entries record file paths as they were at the time. The layout changed in §7.15: `src/content/aggregator|favourites/` → `src/features/…`, `src/content/{grid-item,trash-engine,state,modal,counter-widget,observers}.js` → `src/features/blacklist/`, `src/utils/constants.js` → `src/shared/constants.js` (selectors → `src/vinted/selectors.js`, templates → `src/vinted/templates.js`), `src/utils/storage.js` → `src/shared/storage.js`.

### 7.1 Skeleton Hydration & Selector Specificity [12-07-2026]

* **Issue:** `MutationObserver` attached to raw skeleton placeholders before hydrated `grid-item` nodes were rendered.
* **Fix:** Updated feed container selectors to match `.feed-grid` or `.homepage-blocks[data-testid="homepage-blocks"]`, bypassing skeleton wrappers.

### 7.2 Core Stability & Layout Ghosts [17-07-2026]

* **Layout Ghosts on Manual Delete:** Smooth max-height transitions left white gaps on manual click due to React unmounting inner children mid-click. Fixed by adding `isManual = true` branch that sets `display: none !important` immediately.
* **Aria-Hidden Focus Collision:** Replaced brittle string attribute checks with native `.inert = true` and called `.blur()` on `document.activeElement` before collapse.

### 7.3 Modal Session Stats Disappearance [21-07-2026]

* **Issue:** Modal rendered brand list items without `+X` count badges despite the counter logic detecting blocked items.
* **Root Cause:** `createConfigModal` had `statsSnapshot = new Map()` defaulted, but the instantiation call inside `counter-widget.js` omitted passing the `statsSnapshot` argument.
* **Fix:** Explicitly retrieved live stats map via `getBrandStats()` inside the button click listener and passed `statsSnapshot: currentStats` into `createConfigModal`.

### 7.4 Cross-Catalog Feed Parsing & DOM Variance [21-07-2026]

* **Issue 1 (Grid Card Invalidation):** Injection into aggregated home grids failed due to stricter container class chains (`.HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item`).
  * **Fix:** Updated grid selectors to query top-level attributes `[data-testid="grid-item"]` and `.feed-grid__item` alongside module wrappers.
* **Issue 2 (Base Price Null/Dash Return `—`):** Catalog parser returned `—` for base prices because Vinted moved base price text inside `.title-content` while reserving `[data-testid="total-combined-price"]` for buyer-protection totals.
  * **Fix:** Established a multi-selector fallback chain in `parseFirstCatalogItem`:
    1. Primary check: `[data-testid="feed-item--price-text"]`, `.title-content p`, `.new-item-box__title p`.
    2. Overlay title attribute fallback: Regex extraction (`/(\d+[.,]\d+\s*€)/`) from `a[title]`.
    3. Bidirectional fallback: If base price or total price is missing, sync values across both fields (`itemPrice = totalPrice`).

* **What was distilled & why:**

    1. **Targeted Focus:** Captures the precise DOM selector shift on Vinted's base price element (`.title-content p` vs `total-combined-price`) that caused the `—` display bug.
    2. **Technical Details:** Explains the specific resolution mechanism (fallback chain + title regex parsing + cross-field sync) without adding bloat.
    3. **Consistency:** Matches the date stamp, bullet structure, and code/attribute formatting of the rest of Section 7.

### 7.5 Module Separation & State Modernization [26-07-2026]

* **Issue:** Aggregator components, storage utilities, and state managers contained inline circular dependencies (`isSearchBookmarked`, missing `REMOVABLE_SELECTORS`, relative path errors).
* **Fix:**
  * Centralized DOM selectors and storage key constants into `src/utils/constants.js`.
  * Moved DOM tracking primitives (`WeakSet`, `WeakMap`, `blockedGridItems`) and pub/sub brand session stat listeners into `src/content/state.js`.
  * Isolated storage operations (`getFavorites`, `saveFavorite`, `removeFavorite`, `addBrand`) in `src/utils/storage.js`.
  * Decoupled grid purging logic (`clean-guard.js`) and UI controls (`modal-injector.js`) into dedicated single-responsibility aggregator files.

### 7.6 Saved Searches Modal Injection Failure [30-07-2026]

* **Issue:** Clicking the header search bar failed to inject the "Saved Searches Aggregator" control button above the list items.
* **Root Causes:**
  1. **Selector Mismatch:** `injectSavedSearchButton` queried `[data-testid="saved-searches--content"] .saved-searches__content`. Vinted updated its layout to treat `[data-testid="saved-searches--content"]` as the direct container holding the module wrapper `SavedSearchesList-module-scss-module__AJSRMG__content`, rendering the old child selector `null`.
  2. **Skeleton / Async Race Condition:** `startSavedSearchesObserver` ran `scanSavedSearches` as soon as the outer modal container entered the DOM, before React finished rendering the inner search item links (`a[data-testid^="saved-search-"]`), resulting in skipped injections.
  3. **Debounce Starvation:** A fixed `setTimeout` in the observer continuously reset during modal animation cycles, missing the window when elements settled.
* **Fix:**
  * Updated `injectSavedSearchButton` selector chain to target `[class*="SavedSearchesList-module-scss-module__AJSRMG__content"]` and added a pre-check enforcing `a[data-testid^="saved-search-"]` existence before parsing.
  * Replaced the observer's `setTimeout` with a `requestAnimationFrame` loop that checks for rendered item links on DOM mutations, guaranteeing atomic injection right after React paints the inner items.

### 7.7 Programmatic Dismissal of Vinted Overlay Modal [31-07-2026]

* **Issue:** Initiating aggregation required dismissing Vinted's full-screen search dropdown modal (`SearchBar-module-scss-module__CwEmMW__background`). Calling standard `.click()` on the overlay backdrop failed because React listens for low-level pointer events, keeping the dropdown open and blocking feed visibility.
* **Root Cause:** Next.js/React modal dismissal hooks (`useOnClickOutside`) listen to `mousedown` and `pointerdown` events on `data-testid="search-bar-background"` rather than bubbling `click` events.
* **Fix:** 
  * Implemented `closeSavedSearchesModal()` which dispatches synthetic `MouseEvent('mousedown')` and `MouseEvent('mouseup')` events directly to `[data-testid="search-bar-background"]` before calling `.click()`.
  * Added an explicit `.blur()` call on the active search input and a temporary `display: none` layout buffer on the modal container (`div.u-position-absolute.u-fill-width`) to guarantee instantaneous visual collapse.

### 7.8 Grid Container Destruction & Parent Fallback Layout Collapse [31-07-2026]

* **Issue:** Re-running the aggregator caused listings to break out of the 5-column grid layout and append directly into `<main class="site u-background-white">`, wiping out page structure.
* **Root Cause:** The feed cleanup routine (`clearGridProgressively`) previously wiped out the parent grid wrapper `<div class="homepage-blocks" data-testid="homepage-blocks">` itself. During subsequent aggregation runs, `getActiveGridContainer()` failed to locate the grid container and fell back to higher-level elements like `<main>`.
* **Fix:**
  * Modified `clearGridProgressively` to target only child nodes via `targetGrid.querySelectorAll(REMOVABLE_SELECTORS)` and empty remaining children via `targetGrid.replaceChildren()`, preserving the parent grid wrapper shell.

### 7.9 DOM Ordering vs CSS Grid Placement in Reverse Injection Loops [31-07-2026]

* **Issue:** Injected search categories and card items were rendering out of sequence in the visual grid layout when attempting relative positioning.
* **Root Cause:** When appending elements into CSS Grid without explicit grid coordinates, visual layout order relies strictly on DOM document order. Inserting cards using `dividerNode.insertAdjacentElement('afterend', item)` in natural array order placed items backwards relative to the section divider.
* **Fix:**
  * Maintained DOM ordering logic by reversing the card array (`createdWrappers.length - 1` down to `0`) when using `dividerNode.insertAdjacentElement('afterend', createdWrappers[j])`.
  * Pushing `Item N` through `Item 1` sequentially places `Item 1` directly adjacent to `dividerNode`, producing the correct DOM sequence `[Divider] -> [Item 1] -> [Item 2] -> ... -> [Item N]` and preserving natural reading order in CSS Grid.

### 7.10 Component Decoupling & Markup Centralization [01-08-2026]

* **Issue:** `grid-item-transfer.js` grew bloated with complex API toggle logic, large inline HTML template strings, and utility visual state handlers, making the codebase difficult to maintain.
* **Fix:**
* **Extracted Helpers (`modal-helpers.js`):** Moved Vinted native favorite API synchronization (`toggleVintedNativeFavorite`), button visual state updaters (`updateButtonVisualState`), and the progress status banner factory (`createAggregatorProgressBanner`) into a dedicated helper module.
* **Centralized Templates (`constants.js`):** Extracted the massive multi-line `card.innerHTML` string template (`GRID_ITEM_TEMPLATE`) and placeholder replacement variables out of the component logic and into `constants.js` to streamline component readability.

### 7.11 CSS Grid Auto-Placement Spillover & Category Boundary Leakage [01-08-2026]

* **Issue:** When injecting category section dividers spanning full width (`grid-column: 1 / -1`), categories with item counts that don't neatly fill a row (e.g., 3 items in a 4-column layout) left trailing whitespace. CSS Grid's auto-placement algorithm naturally backfilled these gaps by pulling the first item of the *subsequent* category upward into the previous row.
* **Root Cause:** In modern CSS Grid, items auto-flow seamlessly across track boundaries into any available preceding whitespace unless explicitly constrained by row placement or grid packaging.
* **Fix:**
* Updated category item injection loops in `index.js` to target the **first card** of each category (`index === 0`) and apply a `.mashinted-section-start` utility class.
* Added structural CSS rules enforcing that section dividers span full width (`grid-column: 1 / -1 !important`) and that section-starting items explicitly lock to column index 1 (`grid-column-start: 1 !important`), completely neutralizing upward item drift across category boundaries.


* **What was distilled & why:**
1. **Targeted Focus:** Explains how CSS Grid's auto-placement algorithm handles trailing gaps after full-width elements and why items leak across category sections.
2. **Technical Details:** Documents the exact fix involving index tracking (`index === 0`) combined with explicit CSS column locking (`grid-column-start: 1`).
3. **Consistency:** Mirrors the exact timestamp, formatting rules, and technical terminology used across the entire Section 7 debugging log.

### 7.12 Favorite List Sectional Grouping, Zoom-Out Deletion, and Native API Sync [01-08-2026]

* **Issue:** The Vinted Favorites page lacked categorical organization between available and sold items, and bulk-clearing sold favorites required manual, repetitive un-favoriting clicks.
* **Root Cause:** Vinted renders all bookmarked items in a flat, unsorted stream. Furthermore, lazy-loaded batch feeds populate asynchronously via infinite scroll container hooks, causing initial layout passes to miss newly appended nodes.
* **Fix:**
* **Batched Lazy-Loading Guard:** Implemented a dual interval/mutation observation loop in `startFavouriteListFilter` to safely catch and re-group items as Vinted loads them in lazy chunks.
* **Categorical Section Partitioning:** Automatically categorized grid items into 'Vendus' (sold) and 'Disponibles' (available) using native Vinted status attributes (`[data-testid$="--status"]`) or text matching.
* **Interactive 'Delete all sold' Action:** Injected a custom borderless bulk-action button alongside the counter badge inside the 'Vendus' section divider.
* **Zoom-Out Collapse & Native API Dispatch:** Connected the bulk-clear action to trigger staggered zoom-out animations (`transform: scale(0.7)`, opacity fade, and max-height collapse) while programmatically firing `.click()` on each item's native Vinted favorite toggle button (`button[data-testid$="--favourite"]`) to synchronize changes with Vinted's servers.

### 7.13 Modernizing CSS Grid Styling and Transitioning from Hash-Scrambled Selectors [08-08-2026]

* **Issue:** Injecting global styles via CSS rules matching `div[class*="feed-grid"]` accidentally caught and reshaped individual grid items (`mashinted__feed-grid__item`) because their class names also contained the substring `feed-grid`. This caused layout squashing, and attempts to style items with brittle CSS module hashes (e.g., `ItemBox-module-scss-module__...`) broke across Vinted releases.
* **Root Cause:** Wildcard attribute selectors (`[class*="..."]`) lack precise structural scoping, causing them to accidentally cascade down into nested element wrappers. Furthermore, relying on Vinted's automatically generated hashed CSS module names is unstable because they change on every deployment.
* **Fix:**
* **Strict Scoping Selector Guard:** Updated global grid styles to target only the parent container safely while explicitly excluding item cards via the `:not([class*="__feed-grid__item"])` pseudo-class.
* **Clean Class Decoupling:** Replaced fragile hash-dependent module classes with dedicated, predictable custom classes (`.mashinted__feed-grid__item`) managed directly by the extension.
* **Conditional Layout Shrinkage:** Fixed a layout artifact where item cards with 0 favourites retained a tiny pixel gap by conditionally stripping out the `.web_ui__Spacer__small` element and count text container when no favorites are present, matching Vinted's native collapsing behavior.

### 7.14 Production Build Asset Bundling and Mac/Linux Cross-Environment Consistency [09-08-2026]

* **Issue:** Porting the extension build to macOS caused parts of the extension and all layout styles to fail completely. Investigation revealed that development builds left Vite HMR code (`/vendor/vite-client.js`) and `.css.js` dev stubs inside `dist/`, which failed in production environments without a running local Vite server. Furthermore, enforcing production builds via `npx vite build` resulted in asset hashing (`index-DoysEmGj.css`), causing mismatched paths and a missing CSS injection mechanism in standard content scripts.
* **Root Causes:**
1. **HMR Stubs in Production:** Running development commands packaged live-reload socket wrappers instead of production assets.
2. **Uninjected CSS Assets:** Standard Vite builds output external `.css` files, but manifest v3 content scripts require either explicit manifest CSS declarations or automated script injection to prevent styles from dropping.
3. **Path Instability:** Hashed filenames (`index-[hash].css`) change on every build, breaking static manifest tracking.
4. **Strict CSP Restrictions:** External pages trying to reach dynamic helper files like `checker.js` triggered security errors due to missing `web_accessible_resources` rules.


* **Fix:**
* **Static Rollup Asset Naming:** Configured `rollupOptions.output` inside `vite.config.js` to enforce predictable, unhashed filenames (`assets/index.css` and `assets/[name].js`).
* **Native Manifest Mapping:** Mapped `assets/index.css` directly into the `css` field of content scripts within `manifest.json`, letting Chrome inject styles natively at `document_start` and eliminating DOM `appendChild` null errors.
* **Resource Accessibility Enforcement:** Added `checker.js` and its public path variations into the `web_accessible_resources` block in `manifest.json` with target Vinted match patterns to resolve browser security blocks.

### 7.15 Project Structure Refactor & Tooling [30-09-2026]

* **Layout:** Code moved to `src/features/{blacklist,aggregator,favourites}`, `src/vinted` (selectors, `queryFirst`, templates) and `src/shared` (storage, constants, logger, `escapeHtml`, `observeDom`). Old paths in sections above (`src/content/...`, `src/utils/...`) map to these.
* **Lifecycle:** `content/index.js` now boots once (storage → hydration → `router.js`); the duplicated `init()`/`tryInitializeApp()` observer start-up is gone. Observers now always start after hydration (previously `init()` also started them before).
* **Polling removed:** trash-engine (150 ms) and favourite-filter (400 ms) intervals replaced by `observeDom`; `checker.js` gives up after 10 s.
* **State:** `blockedGridItems` split into `blockedProductIds` (Set) and `blockedGridElements` (WeakSet) to stop leaking DOM nodes.
* **CSS:** split per feature in `src/styles/`; `vinted-ext-*` renamed to `mashinted-*`.
* **Removed:** unused `FETCH_EXTERNAL_PAGE` background handler and the hard-coded CSRF fallback token (favourite toggle now fails cleanly if no token is found).
* **Tooling:** Vitest specs + HTML fixtures, Prettier/EditorConfig, `no-console` lint rule, GitHub Actions CI.

### 7.16 CSS Animation Fixes [30-09-2026]

* **Blacklist fade:** fade lasted 0.4s but the card was `display:none` after ~260 ms (visible pop). The `!important` on `max-height` also prevented the collapse, so neighbours jumped. Now fade + height collapse share one duration and no longer rely on `!important`.
* **Aggregator sections:** `overflow:hidden`, `max-height:500px`, `transform` and `will-change` were applied permanently to every card (clipping, stacking contexts). They now apply only during a fold/unfold; JS measures the card height so `max-height` truly animates.
* **Tunable timings:** `--mashinted-hide-duration`, `--mashinted-collapse-duration`, `--mashinted-ease` in `src/styles/tokens.css`. JS timers read them via `shared/css-duration.js` (constants are fallbacks only). Hide duration set to 450 ms so the fade is clearly visible.
* **Cleanup:** removed no-op `.mashinted-trash-btn:after` rule, `forwards` fill modes, `max-height` keyframes on the fixed-height divider, `transition: all` on the progress banner; added `prefers-reduced-motion` support.

### 7.17 Aggregator Grid Layout on the Homepage & Watch Workflow [30-09-2026]

* **Symptom:** aggregated cards were one per row, too wide-spaced, and sized wrongly on the homepage feed.
* **Causes:** the homepage container (`homepage-blocks`) is a CSS grid (2/4/5 columns set by Vinted), but our card rules assumed a flex row. (1) `width: 25%` resolved against a single grid cell; (2) Vinted's `.homepage-blocks > :not(.item--one-fifth):not(.item--two-fifths) { grid-column: 1 / -1 }` gave every child without its hashed item classes a full row; (3) our item padding stacked on top of Vinted's `column-gap`.
* **Fix (`src/styles/aggregator.css`):** for direct children of `[data-testid="homepage-blocks"]` / `[class*="__homepage-blocks"]`: `width: auto`, `grid-column: auto !important` (needed: Vinted's selector has specificity 0,3,0), section-start cards pinned to column 1, and content padding reduced to `0 0 8px` like native cards. The flex-row rules stay for other layouts.
* **Debugging note:** Vinted's stylesheets are cross-origin, so their rules cannot be listed from JS (`document.styleSheets` throws); use the DevTools Styles pane. A stale `dist/` from `npm run dev` (HMR stubs) made the fix look ineffective: always load a `make build` output.
* **Tooling:** `make watch` now runs `scripts/watch.sh` (full `vite build` on each change via `inotifywait`, needs `inotify-tools`). `vite build --watch` fails on incremental rebuilds with `@crxjs/vite-plugin` (`[crx:manifest-post] Content script fileName is undefined`); reproduced on 2.7.1 and 3.0.0, so the dependency was left unchanged (3.0.0 also renames output assets).

### 7.18 Language Detection & Translations [30-09-2026]

* **Problem:** UI strings were hardcoded, mixing English and French, with no way to follow the language Vinted is displayed in.
* **Detector:** `src/vinted/language.js` (`detectVintedLanguage`) reads the label of Vinted's language selector button (`[data-testid="language-selector-button"]`, selectors in `vinted/selectors.js`), then falls back to `<html lang>`, then to the domain (`.fr` → fr, `.com`/`.co.uk` → en), then to `navigator.language`.
* **Translations:** `src/shared/i18n.js` (`t(key, params)`, `setLanguage`) with dictionaries in `src/shared/locales.js` (en, fr, es, nl; English is the fallback for unsupported languages and missing keys). `content/index.js` sets the language once from the coarse guess before boot and again after React hydration, when the selector exists.
* **Wiring:** counter widget, blacklist modal, trash tooltip, aggregator (button, tooltip, progress banner, dividers, card labels), favourites sections. The sold/available detection now uses the per-language `soldKeyword` instead of a hardcoded French word.
* **Loading chip:** `content/fast-widget-loader.js` uses the same detector (no selector yet at `document_start`, so html lang / domain / navigator). It is already loaded through crxjs's dynamic-import stub, so the import adds no meaningful delay.
* **Tests:** `test/language.test.js` (fixture `test/fixtures/language-selector.html`), `test/i18n.test.js` (locale key parity).

### 7.19 Inbox Widget: Open Unread [30-09-2026]

* **Goal:** on `vinted.*/inbox/*`, a floating chip that opens every unread conversation (opening marks it read on Vinted's side).
* **Routing:** new `inbox` route (`pathname.startsWith('/inbox')`) placed before `default`, so the blacklist/trash/aggregator features do not run there. `startInbox()` removes the "Filtering..." chip left by `fast-widget-loader.js`.
* **Detection (from a saved DOM snippet):** a row is `[data-testid^="inbox-list-item-"][role="button"]` (the `-container`, `--title`... children carry no `role="button"`); unread rows carry Vinted's `web_ui__Cell__highlighted`. Selectors live in `vinted/selectors.js` (`INBOX_*`).
* **Walker (`features/inbox/conversations.js`):** snapshots the unread ids, then for each one clicks the row and waits (via `observeDom`, 4 s timeout, `wait.js`) until it is no longer unread, with a 400 ms pause between two. Clicking the chip again stops the run. The label shows the unread count, or `Stop (done/total)` while running.
* **Dropped: "Clean sold".** It was built (sold = `conversation-message--status-message` banner + no buttons in `hero-message--suffix`; delete via `details-button` → `conversation-actions-delete` → dialog `confirm-delete-conversation`) and removed on 30-09-2026: confirming a deletion reloads the full page, which kills the content script and the running walk after the first conversation. Reviving it would need the state to survive reloads (e.g. a queue in `chrome.storage`), and it may conflict with Vinted's terms of use.
* **Known limit / next:** only rows already rendered are walked; lazy-loading of the conversation list is not handled (needs a DOM snippet of the loading behaviour).
* **Tests:** `test/inbox.test.js` with an anonymised `test/fixtures/inbox-list.html`.

### 7.20 Cross-Browser Compatibility Audit [30-09-2026]

* **Audit result:** no newer-than-ES2020 runtime APIs in `src/`. Real Chrome floor is **91** (module service worker), not 89; `minimum_chrome_version: "91"` added to `manifest.json`.
* **CSS:** `-webkit-backdrop-filter` (Safari < 18) and a `100dvh` override (iOS toolbar) in `modal.css`. `:has()` in `aggregator.css` (Chrome 105 / Safari 15.4) is a focus-ring nicety and degrades harmlessly.
* **Build:** target is now `chrome89`, `safari14`, `firefox115`, `es2020`.
* **Firefox:** `src/manifest.firefox.json` (`browser_specific_settings.gecko`, min 121). Build with `npm run build:firefox` / `make firefox` into `dist-firefox/` (gitignored). Builds fine but is **not yet tested in Firefox**.
* **Safari:** not testable from Linux. Needs a Mac: `xcrun safari-web-extension-converter dist/`, then grant per-site access in Safari. Points to verify: `checker.js` injection via `getURL`, per-site permission prompt.
* **macOS vs Windows:** code is OS-independent; expect only font/scrollbar rendering differences.

---

### 7.21 GitHub Release Pipeline [30-09-2026]

* **Trigger:** pushing a `v*` tag runs `.github/workflows/release.yml`: checks the tag equals `package.json` version, runs lint + tests, builds Chrome (`dist/`) and Firefox (`dist-firefox/`), zips both as `mashinted-vX.Y.Z-{chrome,firefox}.zip` and publishes a GitHub Release with auto-generated notes.
* **Versioning:** `package.json` is the single source of truth; `vite.config.js` injects it as the manifest `version` (the `version` field in `src/manifest*.json` is overridden).
* **Cutting a release:** bump `version` in `package.json`, merge to `main` via PR, then on a clean `main` run `make release` (tags `vX.Y.Z` and pushes it).
* **Not covered:** Chrome Web Store / Firefox AMO / Safari submission; the zips are for manual "Load unpacked" / temporary add-on installs.

### 7.22 Dev Selector Health Panel & Live-Markup Fixes [18-11-2026]

* **Why:** most features need a logged-in account (saved searches, inbox, favourites) and their actions change real data, so they can't run in CI. Instead, a dev-only panel checks that every Vinted selector still matches on the real pages, without clicking anything.
* **Tool:** `npm run build:check` (`MASHINTED_DEV=1`) bundles `src/dev/`. `__MASHINTED_DEV__` is `false` in normal builds, so the bundler removes the whole branch. Checks live in `selector-checks.js` (per page: `any`, `home`, `feed`, `saved-searches`, `favourites`, `inbox`; state-dependent ones are `optional` and only warn). `health-panel.js` shows one line per page, keeps results across page loads in `chrome.storage.local`, never lets a later miss erase a pass, and **Copy report** produces plain text (ids, statuses, counts: no item text or tokens). **Re-run in 5s** exists because clicking the panel closes Vinted's dropdowns.
* **Found on the live site:**
  1. **CSRF token:** `meta[name="csrf-token"]` is gone; the token is in the streamed page data as an escaped, upper-case `\"CSRF_TOKEN\":\"…\"`. The old lookup only matched lowercase unescaped JSON, so favouriting from an aggregated card could not find a token. Fixed in `findCsrfTokenInScripts` (modal-helpers.js).
  2. **Favourites grid:** `FAVOURITES_GRID_SELECTOR` no longer matched the container, so grouping silently did nothing. `findFavouritesGrid()` now falls back to the parent of the first card. It also skips our own regrouped cards (`mashinted__feed-grid__item`), which match the class selector too (same trap as §7.13).
  3. `card-inner` only exists on catalog pages (optional); `feed-container` must not count the catch-all `main`.
* **Noise to ignore in the console:** `GET chrome-extension://invalid/ ERR_FAILED` comes from Vinted's `tags.js`, not from us. `ERR_ABORTED` 404s on `/assets/*.js` came only from the dev build's dynamic import.
* **Verified on the live site (18-11-2026):** favouriting from an aggregated card works with the new token lookup; lazy-loaded favourites batches join their Sold/Available section.
* **React #418:** seen once with a dev build, never with the normal build, and not reproducible afterwards. Cause unknown; it is also unknown whether the chip appended at `document_start` could ever cause it. Revisit only if it comes back.

### 7.23 Rescan After a Brand Is Added & Live Modal Counters [18-11-2026]

* **Issue:** adding a brand (trash click, modal checkbox, quick-add row, another tab) only hid the clicked card; other cards of that brand stayed visible until their own DOM changed. The modal also never showed the `+N` of a brand added while it was open.
* **Causes:** `watchGridItemForBrandName` skips cards already observed, and nothing re-checked the page when the blacklist changed. The modal received `statsSnapshot` once, at open, and never read the stats again.
* **Fix:**
  * `storage.js` gains `subscribeToBrandListChanges` (fires only when the list really changes, local or from another tab). `grid-item.js` gains `rescanGridItems`, which re-checks every card not already hidden. `observers.js` `startBlacklistRescan()` wires the two on the default route only.
  * `trash-engine.js` now blocks the clicked card **before** `addBrand`. The rescan runs inside `addBrand`; hiding the clicked card afterwards would go through the animated path and bring back the ghost gap (§7.2).
  * The modal takes `getStats()` and reads a fresh snapshot on every render instead of a frozen `statsSnapshot`; the rescan counts each hidden card per brand, so the render after `addBrand` already shows the right `+N`.
* **Intentional limits:** the rescan only hides. Unchecking a brand does not un-hide cards or lower its counter during the session (reload to see them again). Counters do not refresh while the modal stays open with no change; a subscription to `subscribeToBrandStatsChanges` would add that.
* **Open finding:** `counter-widget.js` calls `activeModalRef.destroyModal()`, which `createConfigModal` never returns. Probably unreachable (the overlay covers the chip), not fixed.
* **Tests:** `test/blacklist-rescan.test.js` (chrome.storage stub), `test/modal-stats.test.js`.

### 7.24 No Hardcoded Brands & Empty-State Modal [18-11-2026]

* **Issue:** `ensureBrandBlacklistStorageReady` treated an empty stored list as a first run and wrote `h&m`, `shein`, `zara` again on the next page load, so the blacklist could never stay empty.
* **Fix:** `DEFAULT_BANNED_BRANDS` is gone and an empty or missing list stays empty. The background script only seeded those defaults on install, so `src/background/index.js` and the `background` entries of both manifests were removed. Existing users keep whatever is stored.
* **Modal:** `.mashinted-brands-list` has a `min-height: 40vh` (with or without brands); the empty message (`modalEmpty`, reworded in en/fr/es/nl to explain the trash icon and manual input) is centred in it via `min-height: inherit`.
* **Side effects:** no service worker anymore. The Chrome 91 floor (§7.20) was justified by the module service worker; `minimum_chrome_version` was deliberately left unchanged and could be lowered after testing on older builds. Safari conversion no longer has the service-worker point to verify.
* **Tests:** `test/blacklist-rescan.test.js` checks that a list emptied by removal stays empty. A fresh install with nothing stored is covered by code reading only.

### 7.25 SPA-Aware Router & Cleanups [18-11-2026]

* **Issue:** the router ran once per page load, so after in-app navigation (home → favourites, → inbox) the favourites filter or inbox chip never started and the default features kept running on the wrong page. The root observer also disconnected 5 s after the first grid, so grids loaded after navigating were not scanned by brand.
* **Fix:**
  * Every route's `start()` returns a `stop()` (observers disconnected, inbox chip removed). `createRouter().sync()` compares the current path with the active route, stops the old one and starts the new one, and does nothing within the same route. `content/index.js` calls it through `observeDom`, so every DOM change is a navigation check (frame-batched, a cheap comparison).
  * `startObserver()` no longer disconnects: a frame-batched check attaches the card observer to the current grid, re-attaches when the grid element changes and detaches when it disappears. `ROOT_OBSERVER_DISCONNECT_DELAY_MS` is gone.
  * `startFavouriteListFilter`, `startInbox`, `initializeTrashEngine`, `startSavedSearchesObserver`, `startPageTransitionObserver` and `startBlacklistRescan` all return stop functions.
* **Tests:** `test/router.test.js` (one start per route, stop before start on navigation, no restart inside a route, a throwing `stop` does not block the next route).
* **Verified in a browser (18-11-2026):** navigating home → favourites → inbox → home by clicking raises no console errors, and brand blocking works on a catalog page reached by clicking.
* **Cleanups in the same pass:** `createConfigModal` now returns `destroyModal` (counter-widget already called it); the unused `renderFetchControlsContainer`, `clearAllBrands` and their `loadButton` / `infoLimitsLabel` locale keys are removed.
* **Left for later:** the `!important` / inline-style cleanup needs a visual pass in a browser; inbox lazy-loading needs a DOM snippet; Firefox and Safari are manual tests.

### 7.26 Prettier Run [18-11-2026]

* **What:** `prettier --write src test` in one formatting-only commit (38 files). `test/fixtures/` is excluded through `.prettierignore`: those are captured page markup and reformatting could change the text the tests read.
* **Not just whitespace:** quotes, trailing commas and line wraps changed too, so equivalence was checked on the build: the Chrome bundle before and after is byte-identical for every JS file. Only `assets/index.css` differs, in whitespace inside media queries (`(max-width:959px)` -> `(max-width: 959px)`) and around `*` in `calc()`, which is the same CSS.
* **Tooling note:** `npm run format:check` passes; it is not part of CI.

### 7.27 Documentation Refresh [18-11-2026]

* **What:** §2–§6 rewritten for the current layout and behaviour. §1 and the title now say Mashinted and describe `chrome.storage.local`, no default brands and no background script. Stale code blocks are gone: the `getProductId` sample (the code is the source of truth, §5.1 describes the three strategies), and the spinner/entry keyframe snippets, whose names had changed (`mashinted-spin`, `mashintedContentSwap`).
* **Corrected:** the loading chip label is "Filtering..." (it was documented as "Blocked: Loading..."), the colour table listed `#565656`, which is not used anywhere in `src/styles/` (the real tokens are documented), and the "modal receives `statsSnapshot`" description (now `getStats()`).
* **New:** §2.5 favourites and inbox, §2.6 routing, §5.2 where selectors and markup facts live, a per-file table of the stylesheets in §6.
* **Companion:** ARCHITECTURE.md remains the place for stimulus -> reaction flows and intentional quirks; §2–§6 describe the specs and point to it.

---

## 8. Progress Tracker

Living checklist of the maintainability roadmap. Update it (and add a §7 entry) whenever an item moves.

| Status | Item | Where / Entry |
| --- | --- | --- |
| Done | Centralize Vinted selectors, `queryFirst` helper | `src/vinted/selectors.js`, `dom.js` — §7.15 |
| Done | Logger, shared `escapeHtml` | `src/shared/` — §7.15 |
| Done | CSS split per feature, single `mashinted-` prefix | `src/styles/` — §7.15 |
| Done | Feature-folder layout, single boot lifecycle + router | `src/features/`, `src/content/router.js` — §7.15 |
| Done | Replace polling with `observeDom`; `checker.js` timeout | §7.15 |
| Done | Split `blockedGridItems` (Set + WeakSet) | §7.15 |
| Done | Vitest specs + fixtures, Prettier config, `no-console`, CI | `test/`, `.github/workflows/ci.yml` — §7.15 |
| Done | Fix CSS animations, tunable duration tokens, reduced-motion | `src/styles/tokens.css` — §7.16 |
| Done | Fix aggregator card layout on the homepage grid; reliable `make watch` | `src/styles/aggregator.css`, `scripts/watch.sh` — §7.17 |
| Done | Language detection (Vinted selector) + i18n module (en/fr/es/nl) | `src/vinted/language.js`, `src/shared/i18n.js` — §7.18 |
| Done | Inbox route + widget, "Open unread" walker | `src/features/inbox/` — §7.19 |
| Done | Compat audit: Chrome 91 floor, Safari CSS prefixes, Firefox manifest/build | `src/manifest*.json`, `vite.config.js` — §7.20 |
| Done | Tag-triggered GitHub Release workflow, version from `package.json`, `make release` | `.github/workflows/release.yml` — §7.21 |
| Todo | Test the build in Firefox and Safari (macOS) | §7.20 |
| Todo | Inbox: lazy-load handling of the conversation list | §7.19 |
| Done | Run Prettier repo-wide (dedicated formatting-only commit) | `.prettierignore` — §7.26 |
| Done | Update §2–§6 for the new layout (feature sections, tokens, selectors, CSS files) | §2–§6 — §7.27 |
| Todo | Reduce `!important` (~35) and inline `style=""` in templates | — |
| Done | Router: SPA navigation with per-route start/stop; grid observer follows the grid | `src/content/router.js`, `src/features/blacklist/observers.js` — §7.25 |
| Todo | Split `features/blacklist/observers.js` (page-transition vs grid) | — |
| Done | Dev-only selector health panel (`npm run build:check`), CSRF token and favourites grid fixes | `src/dev/` — §7.22 |
| Done | No hardcoded brands; empty list stays empty with a centred how-to message | `src/shared/storage.js`, `src/styles/modal.css` — §7.24 |
| Done | Rescan visible cards when a brand is added; live `+N` in the modal | `src/features/blacklist/`, `src/shared/storage.js` — §7.23 |
| Done | Remove dead `hasInitialScanCompleted` / hide branch and unused `mountLoadingWidget` (chip always visible) | `src/features/blacklist/counter-widget.js` |
| Todo | Browser test pipeline | — |
