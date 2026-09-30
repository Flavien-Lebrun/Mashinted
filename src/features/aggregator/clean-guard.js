/**
 * @file clean-guard.js
 * @brief DOM Interceptor and Feed Cleaning Utilities for Mashinted Aggregator.
 * @details Handles progressive clearing of native Vinted feed elements, mutation guard observation, 
 *          and custom node tagging to prevent extension card removal.
 */

import { REMOVABLE_SELECTORS } from '../../utils/constants.js';

/**
 * @brief Explicitly tags an element and all its children so guard observers do not purge them.
 * @param {HTMLElement} element - The root DOM element to mark as aggregated extension content.
 */
export function markAsMashintedElement(element) {
    if (!element || !(element instanceof HTMLElement)) return;

    element.setAttribute('data-mashinted-aggregated', 'true');

    const children = element.querySelectorAll('*');
    for (let i = 0; i < children.length; i++) {
        children[i].setAttribute('data-mashinted-aggregated', 'true');
    }
}

/**
 * @brief Checks if a given node or its parents are marked as custom Mashinted content.
 * @param {Node|HTMLElement} node - The DOM node to evaluate.
 * @returns {boolean} True if the node belongs to an aggregated extension component.
 */
export function isMashintedElement(node) {
    if (!node || !node.hasAttribute) return false;
    return node.hasAttribute('data-mashinted-aggregated') || 
           Boolean(node.closest && node.closest('[data-mashinted-aggregated]'));
}

/**
 * @brief Evaluates whether an element matches native feed selectors and is not an extension item.
 * @param {HTMLElement} element - The element to check against removable selectors.
 * @returns {boolean} True if the element is an unwanted native feed card.
 */
export function isUnwantedGridElement(element) {
    if (!element || !element.matches) return false;
    if (isMashintedElement(element)) return false;
    return element.matches(REMOVABLE_SELECTORS);
}

/**
 * @brief Collects all removable native feed elements inside a container.
 * @param {HTMLElement} container - Target container holding grid elements.
 * @returns {HTMLElement[]} Array of non-Mashinted removable DOM elements.
 */
export function getRemovableGridElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(REMOVABLE_SELECTORS)).filter(
        (node) => !isMashintedElement(node)
    );
}

/**
 * @brief Synchronously purges unwanted native feed cards from a container.
 * @param {HTMLElement} container - Target container to clean.
 */
export function purgeUnwantedGridItems(container) {
    if (!container) return;

    const unwantedNodes = getRemovableGridElements(container);
    for (let i = 0; i < unwantedNodes.length; i++) {
        unwantedNodes[i].remove();
    }
}

/**
 * @brief Starts a MutationObserver to intercept and immediately remove newly injected native feed cards.
 * @param {HTMLElement} gridContainer - The active grid container to observe.
 * @returns {MutationObserver} Active observer instance.
 */
export function startGridInterceptorGuard(gridContainer) {
    const observer = new MutationObserver((mutations) => {
        let needsPurge = false;

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (isMashintedElement(node)) {
                        continue;
                    }

                    if (isUnwantedGridElement(node) || node.querySelector(REMOVABLE_SELECTORS)) {
                        needsPurge = true;
                        break;
                    }
                }
            }
            if (needsPurge) break;
        }

        if (needsPurge) {
            purgeUnwantedGridItems(gridContainer);
            hideLoadMoreButton(gridContainer);
        }
    });

    observer.observe(gridContainer, { childList: true, subtree: true });
    return observer;
}

/**
 * @brief Removes array of elements across multiple requestAnimationFrame frames to ensure 60fps smoothness.
 * @param {HTMLElement[]} elements - Array of DOM elements to remove.
 * @param {number} batchSize - Number of elements to remove per animation frame.
 * @returns {Promise<void>} Resolves when all elements are removed.
 */
export function removeBatchInFrames(elements, batchSize) {
    return new Promise((resolve) => {
        let index = 0;

        function step() {
            const end = Math.min(index + batchSize, elements.length);
            for (let i = index; i < end; i++) {
                const el = elements[i];
                if (el && el.isConnected) {
                    el.remove();
                }
            }
            index = end;

            if (index < elements.length) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }

        step();
    });
}

/**
 * @brief Progressively clears standard feed elements from the target grid without deleting the container shell.
 * @param {HTMLElement} targetGrid - Target container to progressively clear.
 * @param {number} [batchSize=12] - Elements per frame batch.
 * @returns {Promise<void>}
 */
export async function clearGridProgressively(targetGrid, batchSize = 12) {
    if (!targetGrid) return;

    const removableElements = getRemovableGridElements(targetGrid);
    if (removableElements.length > 0) {
        await removeBatchInFrames(removableElements, batchSize);
    }
}

/**
 * @brief Hides native "Load More" pagination buttons in the grid to prevent infinite scroll overlap.
 * @param {HTMLElement} gridContainer - Container element or document context.
 */
export function hideLoadMoreButton(gridContainer) {
    const loadMoreBtn = document.querySelector('[data-testid="feed-load-more-button"]') ||
                        gridContainer?.querySelector('[data-testid="feed-load-more-button"]');

    if (!loadMoreBtn) return;

    loadMoreBtn.classList.add('mashinted-u-hidden');

    const wrapper = loadMoreBtn.closest('.u-flexbox.u-align-items-center.u-flex-direction-column') ||
                    loadMoreBtn.parentElement;

    if (wrapper) {
        wrapper.classList.add('mashinted-u-hidden');
        wrapper.setAttribute('data-mashinted-hidden', 'true');
    }
}