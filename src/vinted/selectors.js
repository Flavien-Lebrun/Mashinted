/**
 * @file selectors.js
 * @brief Single source of truth for every selector that targets Vinted-owned markup.
 *
 * Vinted's CSS-module class names contain hashes that change on every deploy, so
 * prefer `data-testid` and stable prefix/suffix matches. When Vinted changes its
 * markup, fix it here, never at the call sites. Extension-owned classes
 * (`mashinted*`) are not listed here.
 */

const join = (...selectors) => selectors.join(', ');

// --- Grid & cards -----------------------------------------------------------

export const GRID_ITEM_SELECTOR = join(
    '[data-testid="grid-item"]',
    '[data-testid*="other_user_items-"]',
    '[data-testid*="similar_items-"]',
);

export const HOMEPAGE_BLOCKS_SELECTOR = join(
    '.feed-grid',
    '.catalog-grid',
    '[data-testid="homepage-blocks"]',
    '[data-testid="catalog-grid"]',
    '[data-testid="grid-container"]',
    '[data-testid="item-view-items"]',
    '.homepage-blocks',
    '.items-grid',
    'main', // Ultimate fallback: target main content area if custom containers fail
);

/** Cards and blocks the clean-guard is allowed to hide in the native feed. */
export const REMOVABLE_SELECTORS = join(
    '[data-testid="grid-item"]',
    '[data-testid*="other_user_items-"]',
    '[class$="__feed-grid__item"]',
    '[class$="web_ui__ItemBox__container"]',
    '[data-testid="homepage-block"]',
    '[class$="__homepage-blocks__item"]',
);

/** Homepage feed container (aggregator target). Ordered by specificity. */
export const HOMEPAGE_FEED_SELECTORS = [
    '[data-testid="homepage-blocks"]',
    '[class*="__homepage-blocks"]',
    '[class$="__feed-grid--compact"]',
];

/** Grid container on the favourites page. */
export const FAVOURITES_GRID_SELECTOR = 'div[class*="__feed-grid"], div[class*="__feed-grid--compact"]';

export const FEED_LOAD_MORE_SELECTOR = '[data-testid="feed-load-more-button"]';

// --- Card contents ----------------------------------------------------------

export const BRAND_NAME_SELECTOR = 'p[data-testid*="description-title"]';
export const ITEM_LINK_SELECTOR = 'a[href^="/items/"]';
export const CARD_INNER_CONTAINER_SELECTOR = join(
    '[data-testid^="product-item-id-"]',
    '[data-testid^="other_user_items-"]',
    '[data-testid^="similar_items-"]',
);
export const FAVOURITE_BUTTON_SELECTOR = '[data-testid$="--favourite"]';
export const FAVOURITE_BUTTON_OR_SIMILAR_SELECTOR = join(FAVOURITE_BUTTON_SELECTOR, '[data-testid*="similar_items-"]');
export const FAVOURITE_COUNT_SELECTOR = '[data-testid="favourite-count-text"]';
export const ITEM_STATUS_SELECTOR = '[data-testid$="--status"]';

/** Card parts on an already-rendered card (strict, testid-suffix based). */
export const CARD_PART = {
    brand: '[data-testid$="--description-title"]',
    subtitle: '[data-testid$="--description-subtitle"]',
    priceText: '[data-testid$="--price-text"]',
    totalPrice: '[data-testid="total-combined-price"]',
    image: 'img[data-testid$="--image--img"]',
    link: 'a[data-testid$="--overlay-link"]',
};

/** Card parts inside fetched catalog HTML (looser, with legacy class fallbacks). */
export const CATALOG_PART = {
    container: join(GRID_ITEM_SELECTOR, '.feed-grid__item', '.web_ui__ItemBox__container'),
    brand: join('[data-testid$="--description-title"]', '[data-testid*="description-title"]', '.new-item-box__description p'),
    subtitle: join('[data-testid$="--description-subtitle"]', '[data-testid*="description-subtitle"]'),
    price: join('[data-testid$="--price-text"]', '[data-testid*="price-text"]', '.title-content p', '.web_ui__ItemBox__title--price'),
    totalPrice: join('[data-testid="total-combined-price"]', '[data-testid*="total-combined-price"]'),
    image: join('[data-testid$="--image--img"]', '[data-testid*="image--img"]', 'img'),
    link: 'a[href*="/items/"]',
};

// --- Saved searches ---------------------------------------------------------

export const SAVED_SEARCH_LINK_SELECTOR = 'a[data-testid^="saved-search-"]';
export const SAVED_SEARCH_BOOKMARK_SELECTOR = '[data-testid="saved-search-bookmark"]';
export const SAVED_SEARCH_COUNT_SELECTOR = '[data-testid="item-count-inline"]';
export const SAVED_SEARCHES_CONTENT_SELECTORS = [
    '[class^="SavedSearchesList"]',
    '[data-testid="saved-searches--content"] > div',
    '[data-testid="saved-searches--content"]',
];

// --- Page-level -------------------------------------------------------------

export const CSRF_META_SELECTOR = 'meta[name="csrf-token"]';
