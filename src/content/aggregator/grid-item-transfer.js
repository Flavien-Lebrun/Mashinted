/**
 * @file grid-item-transfer.js
 * @brief Factory functions for rendering aggregated cards and section dividers.
 */

import { GRID_ITEM_TEMPLATE } from '../../utils/constants.js';
import { saveFavorite, removeFavorite, addBrand } from '../../utils/storage.js';
import { extractBrandName, blockGridItem } from '../grid-item.js';
import {
    escapeHtml,
    toggleVintedNativeFavorite,
    updateButtonVisualState,
    createAggregatorProgressBanner
} from './modal-helpers.js';

// Re-export progress banner so external modules importing from grid-item-transfer don't break
export { createAggregatorProgressBanner };

/**
 * @brief Generates a consistent, web-safe section identifier from a search name.
 * @param {string} searchName - The label of the saved search.
 * @returns {string} Web-safe CSS selector ID suffix.
 */
function getSectionId(searchName) {
    return 'mashinted-sec-' + String(searchName).toLowerCase().replace(/[^a-z0-9]/g, '-');
}

/**
 * @brief Creates a full-width divider spanning across the entire catalog grid with collapsible toggles and external search links.
 */
export function createSearchDividerNode(searchName, itemCount, searchUrl = '') {
    const sectionId = getSectionId(searchName);
    const dividerContainer = document.createElement('div');
    dividerContainer.className = 'mashinted-grid-divider';
    dividerContainer.setAttribute('data-section-id', sectionId);
    dividerContainer.setAttribute('data-collapsed', 'false');

    const externalLinkHTML = searchUrl
        ? `<a href="${escapeHtml(searchUrl)}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="mashinted-external-link-btn" 
              title="Voir cette recherche sur Vinted"
              onclick="event.stopPropagation();">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
           </a>`
        : '';

    dividerContainer.innerHTML = `
        <div class="mashinted-divider-left">
            <button type="button" class="mashinted-chevron-btn" aria-label="Toggle section">
                <svg class="mashinted-chevron-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="web_ui__Text__subtitle">${escapeHtml(searchName)}</div>
        </div>
        <div class="mashinted-divider-right">
            ${externalLinkHTML}
            <span class="mashinted-item-count-badge">
                ${itemCount} item${itemCount > 1 ? 's' : ''}
            </span>
        </div>
    `;

    dividerContainer.addEventListener('click', () => {
        const isCollapsed = dividerContainer.getAttribute('data-collapsed') === 'true';
        const nextState = !isCollapsed;

        dividerContainer.setAttribute('data-collapsed', String(nextState));

        const chevron = dividerContainer.querySelector('.mashinted-chevron-icon');
        if (chevron) {
            chevron.style.transform = nextState ? 'rotate(-90deg)' : 'rotate(0deg)';
        }

        const targetItems = document.querySelectorAll(`[data-section-id="${sectionId}"]:not(.mashinted-grid-divider)`);
        targetItems.forEach((item) => {
            item.classList.toggle('mashinted-item-collapsed', nextState);
        });
    });

    return dividerContainer;
}

/**
 * @brief Parses raw DOM card from Vinted, correctly handling dynamic product-item IDs.
 */
export function parseVintedCardDOM(cardElement) {
    const brandEl = cardElement.querySelector('[data-testid$="--description-title"]');
    const subtitleEl = cardElement.querySelector('[data-testid$="--description-subtitle"]');
    const priceTextEl = cardElement.querySelector('[data-testid$="--price-text"]');
    const totalPriceEl = cardElement.querySelector('[data-testid="total-combined-price"]');
    const imgEl = cardElement.querySelector('img[data-testid$="--image--img"]');
    const linkEl = cardElement.querySelector('a[data-testid$="--overlay-link"]');

    const itemUrl = linkEl?.href || '#';
    const itemIdMatch = itemUrl.match(/items\/(\d+)/) || cardElement.innerHTML.match(/product-item-id-(\d+)/);
    const id = itemIdMatch ? itemIdMatch[1] : '';

    return {
        id,
        brandName: brandEl?.textContent?.trim() || '',
        subtitle: subtitleEl?.textContent?.trim() || '',
        price: priceTextEl?.textContent?.trim() || '',
        totalPrice: totalPriceEl?.textContent?.trim() || '',
        imageUrl: imgEl?.src || '',
        itemUrl: itemUrl
    };
}

/**
 * @brief Creates a native Vinted-styled item card.
 */
export function createAggregatedItemCard(itemData, searchName = '') {
    const card = document.createElement('div');
    card.setAttribute('data-testid', 'grid-item');
    card.setAttribute('data-mashinted-aggregated', 'true');

    if (searchName) {
        card.setAttribute('data-section-id', getSectionId(searchName));
    }

    card.className = 'HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item--one-fifth';

    let brand = '';
    let subtitle = '';

    if (itemData instanceof HTMLElement) {
        const parsed = parseVintedCardDOM(itemData);
        brand = parsed.brandName;
        subtitle = parsed.subtitle;
        itemData = parsed;
    } else {
        brand = itemData.brandName
            || itemData.brand_title
            || itemData.brand
            || (itemData.element ? parseVintedCardDOM(itemData.element).brandName : '')
            || '';

        subtitle = itemData.subtitle
            || itemData.description
            || [itemData.size, itemData.status || itemData.condition].filter(Boolean).join(' · ')
            || itemData.title
            || (itemData.element ? parseVintedCardDOM(itemData.element).subtitle : '')
            || '';
    }

    const basePrice = itemData.price || '—';
    const totalPrice = itemData.totalPrice || basePrice;

    const brandHTML = brand
        ? `<div class="u-flexbox u-justify-content-between">
            <div class="new-item-box__description">
                <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__truncated" data-testid="feed-item--description-title">${escapeHtml(brand)}</p>
            </div>
           </div>`
        : '';

    const subtitleHTML = subtitle
        ? `<div class="new-item-box__description">
            <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__truncated" data-testid="feed-item--description-subtitle">${escapeHtml(subtitle)}</p>
           </div>`
        : '';

    card.innerHTML = GRID_ITEM_TEMPLATE
        .replace('{IMAGE_ALT}', `${escapeHtml(brand)} ${escapeHtml(subtitle)}`)
        .replace('{IMAGE_URL}', itemData.imageUrl || '')
        .replace('{ITEM_URL}', itemData.itemUrl || '#')
        .replace('{TITLE_ALT}', `${escapeHtml(brand)} ${escapeHtml(subtitle)}`)
        .replace('{ITEM_ID}', itemData.id)
        .replace('{BRAND_ESCAPED}', escapeHtml(brand))
        .replace('{BRAND_HTML}', brandHTML)
        .replace('{SUBTITLE_HTML}', subtitleHTML)
        .replace('{BASE_PRICE}', escapeHtml(basePrice))
        .replace('{TOTAL_PRICE}', escapeHtml(totalPrice))
        .replace('{TOTAL_PRICE}', escapeHtml(totalPrice)); // second instance for aria-label

    // Attach click listener to the favorite button
    const favBtn = card.querySelector('.mashinted-fav-btn');

    favBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        favBtn.disabled = true;

        const isCurrentlyFav = favBtn.getAttribute('data-favorited') === 'true';
        const nextFavState = !isCurrentlyFav;

        updateButtonVisualState(favBtn, nextFavState, 1);

        const success = await toggleVintedNativeFavorite(itemData.id);

        if (!success) {
            updateButtonVisualState(favBtn, isCurrentlyFav, 1);
            console.warn(`[Mashinted] Could not toggle favorite for item ${itemData.id}`);
        } else {
            if (nextFavState) {
                await saveFavorite(itemData.id, itemData);
            } else {
                await removeFavorite(itemData.id);
            }
        }

        favBtn.disabled = false;
    });

    // Attach click listener to the trash button with parent hiding/removal delay
    const trashBtn = card.querySelector('.mashinted-trash-btn');

    if (trashBtn) {
        trashBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const gridItem = card.closest('[data-testid="grid-item"]') || card.closest('.grid-item') || card;
            const brandName = extractBrandName(gridItem) || trashBtn.getAttribute('data-brand');

            if (brandName) {
                console.log(`[Mashinted] Trash clicked. Adding brand to blacklist: "${brandName}"`);

                await addBrand(brandName);
                blockGridItem(gridItem, brandName, false);

                const parentContainer = card.parentElement;
                if (parentContainer) {
                    setTimeout(() => {
                        parentContainer.style.display = 'none';
                    }, 350);
                }
            } else {
                console.warn('[Mashinted] Could not extract brand name from this grid item layout.');
            }
        });
    }

    return card;
}