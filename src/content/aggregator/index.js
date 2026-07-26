import { 
    clearGridProgressively, 
    startGridInterceptorGuard, 
    purgeUnwantedGridItems, 
    hideLoadMoreButton, 
    markAsMashintedElement 
} from './clean-guard.js';
import { isBlacklistedBrand } from '../storage.js';
import { HOMEPAGE_BLOCKS_SELECTOR } from '../constants.js';
import { calculateFetchDistribution } from './distribution.js';
import { fetchExternalCatalogHtml, parseCatalogItems } from './api.js';
import { createAggregatedItemCard, createSearchDividerNode } from './grid-item-transfer.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getActiveGridContainer() {
    const primaryGrid = document.querySelector('.feed-grid, .catalog-grid, [data-testid="catalog-grid"], [data-testid="grid-container"]');
    if (primaryGrid && primaryGrid.isConnected) return primaryGrid;

    const homepageBlocks = document.querySelector(HOMEPAGE_BLOCKS_SELECTOR);
    if (homepageBlocks && homepageBlocks.isConnected) {
        const innerGrid = homepageBlocks.querySelector('.feed-grid, .catalog-grid, [data-testid="grid-container"]');
        if (innerGrid && innerGrid.isConnected) return innerGrid;

        const existingItem = homepageBlocks.querySelector('[data-testid="grid-item"], .feed-grid__item, .web_ui__ItemBox__container');
        if (existingItem?.parentElement?.isConnected) return existingItem.parentElement;

        return homepageBlocks;
    }

    return null;
}

function wrapCardForGrid(cardNode, targetGrid) {
    if (targetGrid.matches('[data-testid="homepage-blocks"], .HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks')) {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item--one-fifth';
        itemWrapper.appendChild(cardNode);
        return itemWrapper;
    }
    return cardNode;
}

export async function processScannedSearches(scannedItems, onProgress) {
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

    await clearGridProgressively(targetGrid, 12);
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

                const validItems = items.filter(itemData =>
                    itemData && (typeof isBlacklistedBrand !== 'function' || !isBlacklistedBrand(itemData.brandName))
                );

                if (validItems.length > 0) {
                    const dividerNode = createSearchDividerNode(search.name, validItems.length);
                    markAsMashintedElement(dividerNode);
                    targetGrid.appendChild(dividerNode);

                    for (const itemData of validItems) {
                        const cardNode = createAggregatedItemCard(itemData);
                        if (!cardNode || !(cardNode instanceof HTMLElement)) continue;

                        const wrapper = wrapCardForGrid(cardNode, targetGrid);
                        markAsMashintedElement(wrapper);

                        targetGrid.appendChild(wrapper);
                        injectedTotal++;
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