/**
 * @file constants.js
 * @brief storage keys, CSS hooks and timings used across modules.
 */

// Chrome Storage Keys
export const BLACKLIST_STORAGE_KEY = 'bannedBrands';
export const FAVORITES_STORAGE_KEY = 'mashinted_favorites';

// Default Fallbacks
export const HIDDEN_BY_BLACKLIST_ATTRIBUTE = 'data-mashinted-hidden-by-blacklist';
export const HIDDEN_BY_BLACKLIST_CLASS = 'mashinted-hidden-by-blacklist';
export const HIDDEN_BY_BLACKLIST_ACTIVE_CLASS = 'mashinted-hidden-by-blacklist-active';
export const HIDDEN_BY_BLACKLIST_FINAL_CLASS = 'mashinted-hidden-by-blacklist-final';
export const ROOT_OBSERVER_DISCONNECT_DELAY_MS = 5000;

// Fallback only: the real value is --mashinted-hide-duration in styles/tokens.css.
export const HIDE_TRANSITION_DURATION_MS = 450;
export const COLLAPSE_TRANSITION_DURATION_MS = 250;

export const GRID_ITEM_RETRY_INTERVAL_MS = 100;
export const GRID_ITEM_RETRY_LIMIT = 30;

export const DEFAULT_BANNED_BRANDS = ['h&m', 'shein', 'zara'];
