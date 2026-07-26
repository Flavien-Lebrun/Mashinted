export const HOMEPAGE_BLOCKS_SELECTOR = [
    '.feed-grid',
    '.catalog-grid',
    '[data-testid="homepage-blocks"]',
    '[data-testid="catalog-grid"]',
    '[data-testid="grid-container"]',
    '.homepage-blocks',
    '.items-grid',
    'main' // Ultimate fallback: target main content area if custom containers fail
].join(', ');

// DOM Selectors for Vinted grid elements and removable cards
export const REMOVABLE_SELECTORS = [
    '[data-testid="grid-item"]',
    '.feed-grid__item',
    '.web_ui__ItemBox__container',
    '[data-testid="homepage-block"]',
    'section.HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item',
    'div.HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item'
].join(', ');

// Chrome Storage Keys
export const BLACKLIST_STORAGE_KEY = 'bannedBrands';
export const FAVORITES_STORAGE_KEY = 'mashinted_favorites';

// Default Fallbacks
export const DEFAULT_BANNED_BRANDS = ['h&m', 'shein', 'zara'];

export const BRAND_NAME_SELECTOR = 'p[data-testid*="description-title"]';
export const HIDDEN_BY_BLACKLIST_ATTRIBUTE = 'data-mashinted-hidden-by-blacklist';
export const HIDDEN_BY_BLACKLIST_CLASS = 'mashinted-hidden-by-blacklist';
export const HIDDEN_BY_BLACKLIST_ACTIVE_CLASS = 'mashinted-hidden-by-blacklist-active';
export const HIDDEN_BY_BLACKLIST_FINAL_CLASS = 'mashinted-hidden-by-blacklist-final';
export const ROOT_OBSERVER_DISCONNECT_DELAY_MS = 5000;
export const GRID_ITEM_RETRY_INTERVAL_MS = 100;
export const GRID_ITEM_RETRY_LIMIT = 30;
export const HIDE_TRANSITION_DURATION_MS = 220;