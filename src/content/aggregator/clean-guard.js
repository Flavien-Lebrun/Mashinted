import { REMOVABLE_SELECTORS } from '../constants.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Explicitly tags an element and all child elements so guard observer never purges them
 */
export function markAsMashintedElement(element) {
    if (!element || !(element instanceof HTMLElement)) return;
    element.setAttribute('data-mashinted-aggregated', 'true');
    element.dataset.mashintedAggregated = 'true';

    const children = element.querySelectorAll('*');
    for (let i = 0; i < children.length; i++) {
        children[i].setAttribute('data-mashinted-aggregated', 'true');
    }
}

export function isMashintedElement(node) {
    if (!node || !node.hasAttribute) return false;
    return node.hasAttribute('data-mashinted-aggregated') || Boolean(node.closest && node.closest('[data-mashinted-aggregated]'));
}

export function isUnwantedGridElement(element) {
    if (!element || !element.matches) return false;
    if (isMashintedElement(element)) return false;
    return element.matches(REMOVABLE_SELECTORS);
}

export function purgeUnwantedGridItems(container) {
    if (!container) return;

    const unwantedNodes = Array.from(container.querySelectorAll(REMOVABLE_SELECTORS))
        .filter(node => !isMashintedElement(node));

    for (const node of unwantedNodes) {
        node.remove();
    }
}

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

export async function clearGridProgressively(gridContainer, batchSize = 12) {
    if (!gridContainer) return;

    hideLoadMoreButton(gridContainer);

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        const itemsToRemove = getRemovableGridElements(gridContainer);
        if (itemsToRemove.length === 0) break;

        await removeBatchInFrames(itemsToRemove, batchSize);
        await sleep(100);
        attempts++;
    }

    purgeUnwantedGridItems(gridContainer);
}

function getRemovableGridElements(container) {
    return Array.from(container.querySelectorAll(REMOVABLE_SELECTORS)).filter(
        node => !isMashintedElement(node)
    );
}

function removeBatchInFrames(elements, batchSize) {
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

export function hideLoadMoreButton(gridContainer) {
    const loadMoreBtn = document.querySelector('[data-testid="feed-load-more-button"]')
        || gridContainer?.querySelector('[data-testid="feed-load-more-button"]');

    if (!loadMoreBtn) return;

    loadMoreBtn.style.display = 'none';

    const wrapper = loadMoreBtn.closest('.u-flexbox.u-align-items-center.u-flex-direction-column')
        || loadMoreBtn.parentElement;

    if (wrapper) {
        wrapper.style.display = 'none';
        wrapper.setAttribute('data-mashinted-hidden', 'true');
    }
}