import { createLogger } from '../../shared/logger.js';

const log = createLogger('state');

// Tracks which DOM elements are currently being watched
const observedGridItems = new WeakSet();

// Product ids blocked by the user or the blacklist (survive React re-renders)
const blockedProductIds = new Set();

// Blocked cards that have no extractable product id (weak: never leaks detached nodes)
const blockedGridElements = new WeakSet();

/**
 * @brief True when the card was blocked, by product id or by element identity.
 */
function isGridItemBlocked(gridItem, productId) {
    return Boolean(productId && blockedProductIds.has(productId)) || blockedGridElements.has(gridItem);
}

// Tracks active retry timers to prevent memory leaks
const gridItemRetryTimers = new WeakMap();
const hideFinalizationTimers = new WeakMap();

let currentPageBlockedCount = 0;
let onCountChangeCallback = null;

function incrementPageBlockedCount() {
    currentPageBlockedCount++;
    if (typeof onCountChangeCallback === 'function') {
        onCountChangeCallback(currentPageBlockedCount);
    }
}

function resetPageBlockedCount() {
    currentPageBlockedCount = 0;
    if (typeof onCountChangeCallback === 'function') {
        onCountChangeCallback(currentPageBlockedCount);
    }
}

function subscribeToCountChanges(callback) {
    onCountChangeCallback = callback;
    // Immediate execution ensures the UI matches initial state upon boot
    callback(currentPageBlockedCount);
}

// 1. Session state storage dictionary mapped to lowercase brand strings
export const brandSessionStats = new Map();

// 2. Pub/Sub registry for brand stats listeners
const brandStatsListeners = new Set();

/**
 * Increments the blocking counter for a specific brand name.
 * @param {string} rawBrandName - The original un-normalized brand text string
 */
export function incrementBrandSessionStat(rawBrandName) {
    if (!rawBrandName) return;
    const normalized = rawBrandName.trim().toLowerCase();
    
    const currentCount = brandSessionStats.get(normalized) || 0;
    brandSessionStats.set(normalized, currentCount + 1);
    
    // Notify all active listeners (e.g., the config modal window)
    notifyBrandStatsListeners();
}

/**
 * Returns a static snapshot clone of the current live stats map
 */
export function getBrandSessionSnapshot() {
    return new Map(brandSessionStats);
}

export function subscribeToBrandStatsChanges(callback) {
    if (typeof callback === 'function') {
        brandStatsListeners.add(callback);
    }
    // Return an unsubscribe function to keep lifecycle hooks clean
    return () => {
        brandStatsListeners.delete(callback);
    };
}

function notifyBrandStatsListeners() {
    const currentSnapshot = getBrandSessionSnapshot();
    for (const listener of brandStatsListeners) {
        try {
            listener(currentSnapshot);
        } catch (err) {
            log.error('Error updating brand stat listener:', err);
        }
    }
}

export {
    observedGridItems,
    blockedProductIds,
    blockedGridElements,
    isGridItemBlocked,
    gridItemRetryTimers,
    hideFinalizationTimers,
    incrementPageBlockedCount,
    resetPageBlockedCount,
    subscribeToCountChanges,
};