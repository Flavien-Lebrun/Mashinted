import { createSearchDividerNode } from '../aggregator/grid-item-transfer.js';
import { observeDom } from '../../shared/dom-observer.js';
import { createLogger } from '../../shared/logger.js';
import {
    FAVOURITES_GRID_SELECTOR,
    FAVOURITE_BUTTON_SELECTOR,
    GRID_ITEM_SELECTOR,
    ITEM_STATUS_SELECTOR,
} from '../../vinted/selectors.js';

const log = createLogger('favourites');

let isProcessing = false;

/**
 * Injects global styles with zoom-out animation timings, borderless button styling,
 * and appropriate section layout ordering.
 */
function injectGridStyles() {
    if (document.getElementById('mashinted-grid-fix-styles')) return;
    const style = document.createElement('style');
    style.id = 'mashinted-grid-fix-styles';
    style.textContent = `
        .mashinted-grid-divider {
            grid-column: 1 / -1 !important;
            width: 100% !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            grid-column-start: 1 !important;
            grid-column-end: -1 !important;
        }
        .mashinted__feed-grid__item--one-fifth {
            width: 100% !important;
            grid-column: auto !important;
            transition: opacity 0.6s ease, transform 0.6s ease, max-height 0.6s ease, padding 0.6s ease, margin 0.6s ease;
            max-height: 1000px;
            opacity: 1;
            transform: scale(1);
            transform-origin: center center;
            overflow: hidden;
        }
        .mashinted-item-hiding {
            opacity: 0 !important;
            transform: scale(0.7) !important;
            max-height: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            border: none !important;
            pointer-events: none !important;
        }
        .mashinted-clear-sold-btn {
            background: transparent;
            border: none;
            color: rgba(var(--primary-default), 1);
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 500;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.2s ease, opacity 0.2s ease;
            margin-right: 12px;
        }
        .mashinted-clear-sold-btn:hover {
            background-color: rgba(var(--primary-extra-light), 0.5);
            opacity: 0.85;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Checks if a grid item is marked as sold
 */
function isItemSold(gridItem) {
    const statusElement = gridItem.querySelector(ITEM_STATUS_SELECTOR);
    if (statusElement) {
        return true;
    }
    
    const textContent = gridItem.textContent?.toLowerCase() || '';
    return textContent.includes('vendu');
}

/**
 * Reorganizes the favorite page grid into sections safely, with 'Vendus' first followed by 'Disponibles'
 */
function organizeFavouriteGrid() {
    if (isProcessing) {
        return false;
    }

    const gridContainer = document.querySelector(FAVOURITES_GRID_SELECTOR); 
    if (!gridContainer) {
        return false; 
    }

    const gridItems = Array.from(gridContainer.querySelectorAll(`:scope > ${GRID_ITEM_SELECTOR}`));
    if (gridItems.length === 0) {
        return false;
    }

    const trackedCount = parseInt(gridContainer.getAttribute('data-mashinted-item-count') || '0', 10);

    if (gridContainer.getAttribute('data-mashinted-grouped') === 'true' && trackedCount === gridItems.length) {
        return true;
    }

    isProcessing = true;
    injectGridStyles();
    log.debug(`Organizing/Updating batch of ${gridItems.length} favorite items into sections...`);

    const oldDividers = gridContainer.querySelectorAll('.mashinted-grid-divider');
    oldDividers.forEach(div => div.remove());

    const availableItems = [];
    const soldItems = [];

    gridItems.forEach((item) => {
        if (isItemSold(item)) {
            soldItems.push(item);
        } else {
            availableItems.push(item); 
        }
    });

    gridItems.forEach(item => item.remove());

    /**
     * Helper function to append a divider followed by its wrapped items cleanly
     */
    function appendSectionBlock(title, items) {
        if (items.length === 0) return;

        // 1. Create Divider Node
        const divider = createSearchDividerNode(title, items.length);

        // If it's the 'Vendus' section, place our borderless button *before* the item count badge/info
        if (title === 'Vendus') {
            const countBadge = divider.querySelector('.mashinted-item-count-badge');
            if (countBadge) {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'mashinted-clear-sold-btn';
                clearBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete all sold
                `;
                
                clearBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    const sectionId = divider.getAttribute('data-section-id');
                    const currentSoldItems = Array.from(gridContainer.querySelectorAll(`[data-section-id="${sectionId}"]${GRID_ITEM_SELECTOR}`));
                    
                    currentSoldItems.forEach((soldCard, index) => {
                        window.setTimeout(() => {
                            // 1. Trigger the native Vinted favorite toggle button click to un-favorite the item
                            const favBtn = soldCard.querySelector(`button${FAVOURITE_BUTTON_SELECTOR}`);
                            if (favBtn) {
                                favBtn.click();
                            }

                            // 2. Start visual zoom-out and hide transition
                            soldCard.classList.add('mashinted-item-hiding');
                            
                            window.setTimeout(() => {
                                soldCard.style.display = 'none';
                                
                                // Update remaining count dynamically in the badge
                                const remainingItems = currentSoldItems.filter(card => card.style.display !== 'none').length;
                                countBadge.textContent = `${remainingItems} item${remainingItems > 1 ? 's' : ''}`;

                                // Hide divider and clear button if all sold items are gone
                                if (remainingItems === 0) {
                                    divider.style.display = 'none';
                                }
                            }, 600);
                        }, index * 120);
                    });
                });

                // Insert the button before the count badge so it appears on the left side of the counter
                countBadge.parentNode.insertBefore(clearBtn, countBadge);
            }
        }

        gridContainer.appendChild(divider);
        const dividerSectionId = divider.getAttribute('data-section-id');

        // 2. Format wrapper and attributes directly on the outer grid item
        items.forEach((item, index) => {
            // Ensure the outer root grid item retains its correct classification
            item.className = 'mashinted__feed-grid__item mashinted-section-start';
            item.setAttribute('data-mashinted-aggregated', 'true');
            
            if (dividerSectionId) {
                item.setAttribute('data-section-id', dividerSectionId);
            }
            
            if (index !== 0) {
                item.classList.remove('mashinted-section-start');
            }

            gridContainer.appendChild(item);
        });
    }

    // Switch section insertion order: 'Vendus' first, then 'Disponibles'
    appendSectionBlock('Vendus', soldItems);
    appendSectionBlock('Disponibles', availableItems);

    gridContainer.setAttribute('data-mashinted-grouped', 'true');
    gridContainer.setAttribute('data-mashinted-item-count', gridItems.length.toString());
    isProcessing = false;
    log.debug('Grid batch layout successfully reorganized.');
    return true;
}

/**
 * Starts the mutation observer that regroups the grid as lazy-loaded batches arrive
 */
export function startFavouriteListFilter() {
    log.debug('Initializing Favourite List Grouping Module...');

    // organizeFavouriteGrid() is idempotent and bails out when the grid is missing.
    observeDom(organizeFavouriteGrid);
}