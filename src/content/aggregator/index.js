/**
 * @file index.js
 * @brief Main execution orchestrator for the Mashinted Feed Aggregator.
 * @details Handles feed clearing, active grid detection/reconstruction, distribution calculation, 
 *          DOM node injection, and mutation guard lifecycles.
 */

import {
    clearGridProgressively,
    startGridInterceptorGuard,
    purgeUnwantedGridItems,
    hideLoadMoreButton,
    markAsMashintedElement
} from './clean-guard.js';
import { isBlacklistedBrand } from '../storage.js';
import { calculateFetchDistribution } from './distribution.js';
import { fetchExternalCatalogHtml, parseCatalogItems } from './api.js';
import { createAggregatedItemCard, createSearchDividerNode } from './grid-item-transfer.js';

/**
 * @brief Delays execution for a specified duration.
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @brief Generates a sanitized web-safe section identifier string.
 * @param {string} searchName - Saved search title.
 * @returns {string} Formatted section ID selector.
 */
function getSectionId(searchName) {
    return 'mashinted-sec-' + String(searchName).toLowerCase().replace(/[^a-z0-9]/g, '-');
}

/**
 * @brief Retrieves or restores the active feed grid container from the document DOM.
 * @returns {HTMLElement|null} The target grid DOM element or null if home layout cannot be found.
 */
export function getActiveGridContainer() {
    // 1. Check if standard Vinted homepage block container exists
    let grid = document.querySelector('[data-testid="homepage-blocks"]') ||
        document.querySelector('.HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks');

    if (grid && document.body.contains(grid)) {
        return grid;
    }

    // 2. Fallback: Locate home layout parent if container was destroyed
    const homeLayout = document.querySelector('.HomeLayout-module-scss-module__XNM03a__homepage') ||
        document.querySelector('.container') ||
        document.querySelector('#content');

    if (homeLayout) {
        console.warn('Mashinted: Grid container missing. Reconstructing target grid node.');

        grid = document.createElement('div');
        grid.className = 'HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks';
        grid.setAttribute('data-testid', 'homepage-blocks');

        homeLayout.appendChild(grid);
        return grid;
    }

    return null;
}

/**
 * @brief Wraps card nodes in layout-compatible grid item containers if required by current grid structure.
 * @param {HTMLElement} cardNode - Card DOM node to wrap.
 * @param {HTMLElement} targetGrid - Active parent grid node.
 * @returns {HTMLElement} Wrapped or direct card element.
 */
function wrapCardForGrid(cardNode, targetGrid) {
    let resultNode = cardNode;

    if (targetGrid.matches('[data-testid="homepage-blocks"], .HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks')) {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item--one-fifth';
        itemWrapper.appendChild(cardNode);
        resultNode = itemWrapper;
    }

    markAsMashintedElement(resultNode);
    return resultNode;
}

/**
 * @brief Inserts a node immediately below the active progress banner, or prepends it to grid.
 * @param {HTMLElement} newNode - Node to insert.
 * @param {HTMLElement} feedGrid - Active catalog grid container.
 * @param {Object|null} progressBanner - Progress banner handle object.
 */
function insertInGrid(newNode, feedGrid, progressBanner) {
    if (progressBanner && progressBanner.element && progressBanner.element.parentNode) {
        progressBanner.element.insertAdjacentElement('afterend', newNode);
    } else {
        feedGrid.prepend(newNode);
    }
}

/**
 * @brief Processes scanned saved searches, fetches items, and injects cards into the feed grid.
 * 
 * @param {Array<Object>} scannedItems - Array of scanned saved search descriptor objects.
 * @param {Function} [onProgress] - Callback function receiving progress status strings.
 * @param {Object} [progressBanner=null] - Interactive progress banner controller.
 * @returns {Promise<number>} Total count of newly injected items.
 * @throws {Error} If active catalog grid is missing from page.
 */
export async function processScannedSearches(scannedItems, onProgress, progressBanner = null) {
    // 1. Get or restore target grid container
    const targetGrid = getActiveGridContainer();
    if (!targetGrid) {
        throw new Error('Catalog grid not found on page.');
    }

    const activeSearches = calculateFetchDistribution(scannedItems, 99, 30);

    if (activeSearches.length === 0) {
        if (onProgress) onProgress("You're up to date");
        return 0;
    }

    if (onProgress) onProgress('Clearing current feed...');

    // 2. Safely clear child nodes of targetGrid while preserving container shell
    await clearGridProgressively(targetGrid, 12);

    // 3. Re-insert progress banner at top of targetGrid
    if (progressBanner && progressBanner.element) {
        targetGrid.prepend(progressBanner.element);
    }

    const gridGuard = startGridInterceptorGuard(targetGrid);
    let injectedTotal = 0;

    try {
        for (let i = 0; i < activeSearches.length; i++) {
            const search = activeSearches[i];
            const statusMsg = `Loading (${i + 1}/${activeSearches.length}): ${search.targetToFetch} item(s) from "${search.name}"...`;

            if (onProgress) onProgress(statusMsg);

            try {
                const html = await fetchExternalCatalogHtml(search.url);
                if (!html) continue;

                const items = parseCatalogItems(html, search.targetToFetch);
                if (!Array.isArray(items) || items.length === 0) continue;

                const validItems = items.filter((itemData) =>
                    itemData && (typeof isBlacklistedBrand !== 'function' || !isBlacklistedBrand(itemData.brandName))
                );

                if (validItems.length > 0) {
                    // Create Divider Section
                    const dividerNode = createSearchDividerNode(search.name, validItems.length, search.url);
                    const sectionId = getSectionId(search.name);
                    dividerNode.setAttribute('data-section-id', sectionId);
                    markAsMashintedElement(dividerNode);

                    // Insert divider below banner
                    insertInGrid(dividerNode, targetGrid, progressBanner);

                    // Build array of card items for section
                    const createdWrappers = [];
                    for (let index = 0; index < validItems.length; index++) {
                        const itemData = validItems[index];
                        const cardNode = createAggregatedItemCard(itemData, search.name);
                        if (!cardNode || !(cardNode instanceof HTMLElement)) continue;

                        const wrapper = wrapCardForGrid(cardNode, targetGrid);
                        wrapper.setAttribute('data-section-id', sectionId);
                        markAsMashintedElement(wrapper);

                        // FIX: Force the first item of this category to start on a new row, 
                        // stopping items from the previous category from filling trailing gaps.
                        if (index === 0) {
                            wrapper.classList.add('mashinted-section-start');
                        }

                        createdWrappers.push(wrapper);
                        injectedTotal++;
                    }

                    // Insert cards in reverse order so DOM sequence matches array order
                    for (let j = createdWrappers.length - 1; j >= 0; j--) {
                        dividerNode.insertAdjacentElement('afterend', createdWrappers[j]);
                    }
                }
            } catch (err) {
                console.error(`[Mashinted Debug] Error processing search "${search.name}":`, err);
            }

            purgeUnwantedGridItems(targetGrid);
            await sleep(300);
        }
    } finally {
        gridGuard.disconnect();
        purgeUnwantedGridItems(targetGrid);
        hideLoadMoreButton(targetGrid);
    }

    return injectedTotal;
}