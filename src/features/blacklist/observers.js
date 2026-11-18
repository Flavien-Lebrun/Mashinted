import { HOMEPAGE_BLOCKS_SELECTOR } from '../../vinted/selectors.js';
import { observeDom } from '../../shared/dom-observer.js';

import {
    watchGridItemsWithin,
    stopRetryingGridItem,
    stopHideFinalization,
    rescanGridItems,
} from './grid-item.js';
import { subscribeToBrandListChanges } from '../../shared/storage.js';

import { resetPageBlockedCount } from './state.js';
import { ensureCounterWidgetMounted } from './counter-widget.js';
import { createLogger } from '../../shared/logger.js';

const log = createLogger('observers');

let lastObservedUrl = window.location.href;

/**
 * @brief Resets the page counter on URL changes and re-mounts the counter widget if React wiped it.
 * @returns {() => void} Stop function.
 */
function startPageTransitionObserver() {
    // Initial mount on script start
    ensureCounterWidgetMounted();

    const routeObserver = new MutationObserver(() => {
        if (window.location.href !== lastObservedUrl) {
            lastObservedUrl = window.location.href;
            log.debug('Page transition detected, resetting counter.');
            resetPageBlockedCount();
            ensureCounterWidgetMounted();
            return;
        }

        // Extremely light checks — no loop overhead or structural side-effects
        if (!document.getElementById('mashinted-counter-widget')) {
            ensureCounterWidgetMounted();
        }
    });

    routeObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    return () => routeObserver.disconnect();
}

/**
 * @brief Scans the cards of a grid now and whenever React adds or removes some.
 * @returns {() => void} Stop function.
 */
function observeHomepageBlocks(homepageBlocks) {
    // 1. Run your brand-name / blacklist checker immediately on load
    watchGridItemsWithin(homepageBlocks);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Check newly added nodes for brand matching
            for (const node of mutation.addedNodes) {
                if (node instanceof Element) {
                    watchGridItemsWithin(node);
                }
            }
            // Memory cleanups when React unmounts items
            for (const node of mutation.removedNodes) {
                if (node instanceof Element) {
                    stopRetryingGridItem(node);
                    stopHideFinalization(node);
                }
            }
        }
    });

    observer.observe(homepageBlocks, {
        childList: true,
        subtree: true,
    });

    return () => observer.disconnect();
}

/**
 * @brief Keeps a card observer attached to the current feed grid, following it across in-app
 *        navigations: re-attaches when the grid element changes, detaches when it disappears.
 * @returns {() => void} Stop function.
 */
function startObserver() {
    log.debug('Starting grid observer.');

    let attachedGrid = null;
    let stopGridObserver = null;

    // Frame-batched, so looking for the grid on every DOM change stays cheap.
    const stopWatchingDom = observeDom(() => {
        const grid = document.querySelector(HOMEPAGE_BLOCKS_SELECTOR);
        if (grid === attachedGrid) return;

        stopGridObserver?.();
        stopGridObserver = null;
        attachedGrid = grid;

        if (grid) {
            log.debug('Feed grid detected. Attaching observer.');
            stopGridObserver = observeHomepageBlocks(grid);
        }
    });

    return () => {
        stopWatchingDom();
        stopGridObserver?.();
    };
}

/**
 * @brief Hides cards already on screen whenever a brand is added (trash click, modal, other tab).
 * @returns {() => void} Stop function.
 */
function startBlacklistRescan() {
    return subscribeToBrandListChanges(() => rescanGridItems());
}

export {
    startPageTransitionObserver,
    startObserver,
    startBlacklistRescan
};
