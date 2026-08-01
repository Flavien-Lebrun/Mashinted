# Mashup Vinted (Mashinted) — Technical Documentation & Specifications

This document details the functional specifications, technical constraints, UI/UX behaviors, and structural DOM patterns for **Mashup Vinted** (Mashinted), a web extension designed to improve user experience on Vinted by allowing users to blacklist and filter out listings from specific brands.

---

## 1. Project Goal & Overview

The primary objective of **Mashup Vinted** is to filter product listings from the user's view based on a customized blacklist of brands.

### Core Flow:

* **Blacklist Storage:** The blacklist is persisted in the browser's `localStorage` (or extension storage) as a JSON object containing brand names standardized in **lowercase**.
* **On-Demand Blacklisting:** A trash icon is injected into every product listing card. Clicking this icon immediately adds the associated brand to the blacklist.
* **Dynamic Filtering:** Any matching product listing is smoothly hidden from view without breaking the native page flow or leaving layout gaps.
* **Real-Time Analytics:** The extension tracks both total listings blocked and per-brand session statistics (`statsSnapshot`).
* **Cross-Search Feed Aggregation:** Extracts pending items from bookmarked saved searches via a specialized background fetcher/parser, clearing default page grids progressively and injecting multi-search results into unified catalog grids.
* **Favorites Storage Management:** Persists cross-page aggregated favorite items locally using `chrome.storage.local` with `FAVORITES_STORAGE_KEY`.

---

## 2. Component Specifications

### 2.1 Product Listings (Behavior)

When a listing is determined to be from a blacklisted brand—either during initial page load, dynamically via user click on the trash icon, or through real-time updates—the following behavior applies:

* **Automated Scanner Hide:** Uses a smooth CSS `max-height` transition and opacity fade-out to prevent abrupt visual jumps while the user scrolls.
* **Manual Trash Click Collapse:** Bypasses animation timers entirely, applying an instant `display: none !important` hard collapse to prevent layout ghost gaps when React unmounts inner children mid-click.
* **Accessibility Safety:** Sets `inert = true` and explicitly calls `.blur()` on active elements to prevent browser focus-trap exceptions on `aria-hidden` ancestors.

---

### 2.2 Hydration Shell & Counter Widget

To eliminate UI flashing and resist React tree reconciliation wipes, the widget uses a **two-phase mounting lifecycle** (`fast-widget.js` -> `counter-widget.js`).

#### Phase 1: Fast Loading Shell (`fast-widget.js`)

* Executes immediately at `document_start` / early DOM load.
* Mounts a non-interactive loading chip to ensure zero layout shift.
* **Primary Spinner:** Contains an inline SVG circle loader using Vinted's primary color token (`rgba(var(--primary-default), 1)`), animated with CSS keyframe rotation (`@keyframes mashinted-spinner-rotate`).
* Displays label: `Blocked: Loading...`

#### Phase 2: Hydration & Exit Transition (`counter-widget.js`)

* **Guaranteed Visibility Window:** Enforces a minimum artificial delay (`MIN_LOADING_TIME_MS = 600ms`) so users can register the loading state even on ultra-fast network calls.
* **Exit / Entry Animation:**
1. Applies `.mashinted-is-exiting` to fade and slide the "Loading..." text up (`translateY(-4px)`).
2. Swaps the DOM payload after a 200ms delay.
3. Triggers `@keyframes mashintedContentEnter` to spring the interactive badge and chevron up into position (`translateY(0)`).


* **Interactive Counter State:**
* Displays real-time count badge derived from `latestCountMemory`.
* Contains a trailing **Chevron Icon** pointing downwards.
* Clicking toggles active states (`web_ui__Chip__activated`, `aria-pressed="true"`) and opens the Management Modal.



---

### 2.3 Management Modal (`createConfigModal`)

The modal acts as the main control center for managing the local blocklist.

#### Top Section (Header)

* **Search Bar:** Filter box with SVG search icon (`.mashinted-filter-search-input`).
* **Close Action:** Close button (`.vinted-ext-close-btn`) that clears overlay state with a 220ms fade-out transition.

#### Main Body (Brand List)

* **State-Connected Counters (`statsSnapshot`):** Receives a live `statsSnapshot` Map/Object from `state.js`. Items rendering in the list check `statsSnapshot.get(normalizedName)` to render a session counter tag (e.g., `+12`) next to the brand name if count `> 0`.
* **Interactive Checkboxes:** Unchecking a brand removes it from `unselectedBrands`, calls `onDeleteBrand(brand)`, and dims the row (`.mashinted-row-muted`). Re-checking invokes `onAddBrand(brand)`.
* **Inline Quick-Add Row:** Typing a search query with no exact match dynamically injects a `"Block <Query>"` row at the bottom with a `+` action button for 1-click addition.

### 2.4 Saved Search Aggregator & Injection UI (`src/content/aggregator/`)

The aggregator scans bookmarked saved searches and fetches pending updates into a unified view.

#### Architectural Components & Distribution

* **Scan & Distribution (`scanner.js` & `distribution.js`):**
  * Evaluates bookmarked search rows (`a[data-testid^="saved-search-"]`).
  * If the global pending total across all searches is **$\le 99$ items**, all new items are fetched.
  * If the global pending total **$> 99$ items**, an overload cap is triggered, limiting each search to a maximum of **30 items**.
* **Clean & Guard Observer (`clean-guard.js`):**
  * Progressively purges default Vinted feed elements (`REMOVABLE_SELECTORS`) using `requestAnimationFrame` frame batches.
  * Attaches a dedicated `MutationObserver` (`startGridInterceptorGuard`) that intercepts and removes default feed items while background fetching takes place.
  * Tags injected extension cards with `data-mashinted-aggregated="true"` (`markAsMashintedElement`) so the guard observer never removes them.
* **Frame-Buffered Feed Clearance (`getRemovableGridElements` & `removeBatchInFrames`):**
  * Instead of blocking execution with artificial delays (`sleep`), feed purging utilizes `requestAnimationFrame` to batch-remove native Vinted items in 12-element frame windows.
  * Targets native feed elements using `REMOVABLE_SELECTORS` while explicitly skipping any nodes marked with `data-mashinted-aggregated="true"` to ensure custom injected cards are preserved during background sweeps.
* **Card & Divider Factory (`grid-item-transfer.js`):**
  * Constructs aggregated item cards with title, brand, price, user handle, favorite buttons, and search group divider nodes (`createSearchDividerNode`).
  * Integrates favorite toggles directly with `saveFavorite` and `removeFavorite` in `storage.js`.
* **Modal UI Injector (`modal-injector.js`):**
  * Injects the "New items" button (`#mashinted-aggregator-a`) into `.saved-searches__content`.
  * Renders interactive tooltip popups explaining loading limitations and real-time execution statuses (`Fetching items...`, `✅ X item(s) injected!`).

---

## 3. Environmental Limits & Architectural Constraints

### React Server Components (RSC) Streaming & SSR

The majority of Vinted's product display feed is delivered via Server-Side Rendering (SSR) and hydrated dynamically via **React Server Components (RSC) Streaming**.

#### Critical Precautions:

1. **Avoid React Architecture Collision:** Direct DOM deletions crash React's internal shadow/virtual reconciliation engine.
2. **Observer Isolation:** The `MutationObserver` attaches only to hydrated feed containers (`.feed-grid` or `.homepage-blocks[data-testid="homepage-blocks"]`), ignoring raw skeleton containers.
3. **Self-Healing Layout Shell:** The widget presence check runs on `document.getElementById(WIDGET_ID)`. If React wipes the custom DOM node during page transition, the shell instantly snaps back into `document.body` without losing stored count memory (`latestCountMemory`).

---

## 4. Design System & CSS Token Mapping

| Token / Visual Item | Target Usage | Value Mapping |
| --- | --- | --- |
| **Primary Text** | Body copy, brand names, statistics labels | `color: #565656;` |
| **Accent / Hover Green** | Hover states, search borders, spinner stroke | `rgba(var(--primary-default), 1);` |
| **Search Input Background** | Input background filling | `background-color: rgba(var(--greyscale-level-5), 1);` |
| **Light Selection Green** | Highlighted list elements or hover row items | `background-color: rgba(var(--primary-extra-light), 1);` |

---

## 5. Structural DOM References

### 5.1 Multi-Strategy ID Extraction (`getProductId`)

Due to Vinted's continuous layout variation tests, product IDs are resolved through a hierarchical fallback lookup:

```javascript
function getProductId(gridItem) {
    // Strategy 1: Immutable product URL path (Most reliable)
    const itemLink = gridItem.querySelector('a[href^="/items/"]');
    if (itemLink) {
        const href = itemLink.getAttribute('href');
        const match = href.match(/\/items\/(\d+)/);
        if (match) return match[1];
    }

    // Strategy 2: Standard feed template data attribute
    const innerContainer = gridItem.querySelector('[data-testid^="product-item-id-"]');
    if (innerContainer) {
        const match = innerContainer.getAttribute('data-testid')?.match(/product-item-id-(\d+)/);
        if (match) return match[1];
    }
    
    // Strategy 3: Favorite button context signature lookup
    const favBtn = gridItem.querySelector('[data-testid$="--favourite"]');
    if (favBtn) {
        const match = favBtn.getAttribute('data-testid')?.match(/product-item-id-(\d+)/);
        if (match) return match[1];
    }
    
    return null;
}

```

---

## 6. CSS & Animation Specifications

### 6.1 Primary Spinner Keyframes

```css
/* Color and rotation animation for the loading spinner */
.mashinted-spinner-icon {
    animation: mashinted-spinner-rotate 0.85s linear infinite;
    transform-origin: center center;
    color: rgba(var(--primary-default), 1) !important;
    display: inline-block;
    vertical-align: middle;
}

.mashinted-spinner-circle {
    stroke: currentColor;
}

@keyframes mashinted-spinner-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

```

### 6.2 Widget Exit & Entry Transitions

```css
/* Smooth exit transition when swapping out 'Loading...' */
.mashinted-counter-widget-wrapper button .web_ui__Chip__text {
    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), 
                transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, opacity;
}

/* Exit state triggered right before DOM swap */
.mashinted-counter-widget-wrapper button.mashinted-is-exiting .web_ui__Chip__text {
    opacity: 0;
    transform: translateY(-4px) scale(0.95);
}

/* Entry animation for active badge content */
.mashinted-counter-widget-wrapper .web_ui__Chip__suffix,
.mashinted-counter-widget-wrapper[data-hydrated="true"] .web_ui__Chip__text {
    animation: mashintedContentEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes mashintedContentEnter {
    0% {
        opacity: 0;
        transform: translateY(4px) scale(0.95);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

```

---

## 7. Complete Issue & Debugging Log

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
  * Centralized DOM selectors and storage key constants into `src/content/constants.js`.
  * Moved DOM tracking primitives (`WeakSet`, `WeakMap`, `blockedGridItems`) and pub/sub brand session stat listeners into `src/content/state.js`.
  * Isolated storage operations (`getFavorites`, `saveFavorite`, `removeFavorite`, `addBrand`) in `src/content/storage.js`.
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
  * Updated `getActiveGridContainer()` with a self-healing fallback that detects if `homepage-blocks` was destroyed by React hydration and dynamically reconstructs the `<div class="HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks" data-testid="homepage-blocks">` element inside `.HomeLayout-module-scss-module__XNM03a__homepage`.

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