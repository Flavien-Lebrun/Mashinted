import { getProductId, blockGridItem, extractBrandName } from './grid-item.js';
import { TRASH_BUTTON_TEMPLATE } from '../../vinted/templates.js';
import { t } from '../../shared/i18n.js';
import { escapeHtml } from '../../shared/escape-html.js';
import { isGridItemBlocked } from './state.js';
import { observeDom } from '../../shared/dom-observer.js';
import { addBrand } from '../../shared/storage.js';
import { createLogger } from '../../shared/logger.js';
import {
    FAVOURITE_BUTTON_SELECTOR,
    GRID_ITEM_SELECTOR,
} from '../../vinted/selectors.js';

const log = createLogger('trash');

function verifyAndInjectTrashButtons() {
    const favButtons = document.querySelectorAll(FAVOURITE_BUTTON_SELECTOR);

    favButtons.forEach((favButton) => {
        const gridItem = favButton.closest(GRID_ITEM_SELECTOR) || favButton.closest('.grid-item');
        if (!gridItem) return;

        // --- ENFORCE BLOCK ON NEW RE-RENDERED NODES ---
        const productId = getProductId(gridItem);
        if (isGridItemBlocked(gridItem, productId)) {
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

        container.innerHTML = TRASH_BUTTON_TEMPLATE.replace('{TRASH_TITLE}', escapeHtml(t('trashTitle')));

        container.querySelector('button').addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const brandName = extractBrandName(gridItem);

            if (brandName) {
                log.debug(`Trash clicked. Adding brand to blacklist: "${brandName}"`);

                // 1. Hide the clicked card first, instantly. addBrand() triggers a rescan that would
                //    otherwise hide it through the animated path and bring back the ghost gap (§7.2).
                blockGridItem(gridItem, brandName);

                // 2. Persist the brand; the blacklist rescan then hides every other card of that brand.
                await addBrand(brandName);
            } else {
                log.warn('Could not extract brand name from this grid item layout.');
            }
        });

        targetParent.appendChild(container);
    });
}

export function initializeTrashEngine() {
    // `aria-pressed` appears once React has hydrated the favourite button.
    observeDom(verifyAndInjectTrashButtons, { attributeFilter: ['aria-pressed'] });
}