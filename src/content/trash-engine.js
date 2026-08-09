import { getProductId, blockGridItem, extractBrandName } from './grid-item.js';
import { TRASH_BUTTON_TEMPLATE } from '../utils/constants.js';
import { blockedGridItems } from './state.js';
import { addBrand } from '../utils/storage.js';

function verifyAndInjectTrashButtons() {
    const favButtons = document.querySelectorAll('[data-testid$="--favourite"]');

    favButtons.forEach((favButton) => {
        const gridItem = favButton.closest('[data-testid="grid-item"]') || favButton.closest('.grid-item');
        if (!gridItem) return;

        // --- ENFORCE BLOCK ON NEW RE-RENDERED NODES ---
        const productId = getProductId(gridItem);
        if (
            (productId && blockedGridItems.has(productId)) ||
            blockedGridItems.has(gridItem)
        ) {
            blockGridItem(gridItem, 'Re-enforced Block', true);
            return;
        }

        const isReady = favButton.getAttribute('aria-pressed') !== null;
        if (!isReady) return;

        const targetParent = favButton.parentElement?.parentElement;
        if (!targetParent) return;

        if (targetParent.querySelector(':scope > .mashinted-trash-container')) return;

        const container = document.createElement('div');
        container.className = 'u-position-absolute u-left u-bottom u-zindex-bump mashinted-trash-container';

        container.innerHTML = TRASH_BUTTON_TEMPLATE;

        container.querySelector('button').addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const brandName = extractBrandName(gridItem);

            if (brandName) {
                console.log(`[Mashinted] Trash clicked. Adding brand to blacklist: "${brandName}"`);

                // 1. Add to chrome.storage.local via your existing storage framework
                await addBrand(brandName);

                // 2. Instantly visually hide this specific item.
                // (Your MutationObserver will catch and hide all other matching brands on the page automatically)
                blockGridItem(gridItem, brandName);
            } else {
                console.warn('[Mashinted] Could not extract brand name from this grid item layout.');
            }
        });

        targetParent.appendChild(container);
    });
}

export function initializeTrashEngine() {
    verifyAndInjectTrashButtons();
    setInterval(() => {
        verifyAndInjectTrashButtons();
    }, 150);
}