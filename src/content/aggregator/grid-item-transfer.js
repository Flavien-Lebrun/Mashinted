import { getFavorites, saveFavorite, removeFavorite } from '../storage.js';

/**
 * Escapes HTML characters for safety.
 */
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Creates a full-width divider spanning across the entire catalog grid.
 */
export function createSearchDividerNode(searchName, itemCount) {
    const dividerContainer = document.createElement('div');
    dividerContainer.className = 'mashinted-grid-divider';

    dividerContainer.style.cssText = `
        grid-column: 1 / -1;
        width: 100%;
        margin: 24px 0 16px 0;
        padding: 12px 16px;
        background-color: #f7f9fa;
        border: 1px solid #e0e6e8;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
    `;

    dividerContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007782" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span style="font-size: 16px;">
                ${escapeHtml(searchName)}
            </span>
        </div>
        <span style="color: #007782; background-color: #e6f4f5; padding: 4px 10px; border-radius: 12px;">
            ${itemCount} item${itemCount > 1 ? 's' : ''}
        </span>
    `;

    return dividerContainer;
}

/**
 * Creates a clean native Vinted-styled item card.
 */
export function createAggregatedItemCard(itemData) {
    const card = document.createElement('div');
    card.setAttribute('data-testid', 'grid-item');
    card.setAttribute('data-mashinted-aggregated', 'true');
    card.className = 'HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item HomeBlocks-module-scss-module__BQ-Taq__homepage-blocks__item--one-fifth';

    const brand = itemData.brandName || '';
    const brandHTML = brand
        ? `<div class="u-flexbox u-justify-content-between">
            <div class="new-item-box__description">
                <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__truncated" data-testid="feed-item--description-title">${escapeHtml(brand)}</p>
            </div>
           </div>`
        : '';

    const subtitle = itemData.subtitle || itemData.title || '';
    const subtitleHTML = subtitle
        ? `<div class="new-item-box__description">
            <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__truncated" data-testid="feed-item--description-subtitle">${escapeHtml(subtitle)}</p>
           </div>`
        : '';

    const basePrice = itemData.price || '—';
    const totalPrice = itemData.totalPrice || basePrice;

    card.innerHTML = `
        <div class="new-item-box__container" data-testid="feed-item">
            <div class="u-position-relative u-min-height-none u-flex-auto new-item-box__image-container">
                <div class="new-item-box__image">
                    <div class="web_ui__Image__image web_ui__Image__cover web_ui__Image__portrait web_ui__Image__rounded web_ui__Image__scaled web_ui__Image__ratio mashinted-image-bg" data-testid="feed-item--image">
                        <img alt="${escapeHtml(brand)} ${escapeHtml(subtitle)}" class="web_ui__Image__content" data-testid="feed-item--image--img" src="${itemData.imageUrl}">
                    </div>
                </div>
                <a href="${itemData.itemUrl}" class="new-item-box__overlay new-item-box__overlay--clickable" data-testid="feed-item--overlay-link" title="${escapeHtml(brand)} ${escapeHtml(subtitle)}" target="_self" rel="noreferrer">
                    <div></div>
                </a>
                <div class="u-position-absolute u-right u-bottom u-zindex-bump">
                    <button aria-pressed="false" aria-label="Ajouter aux favoris" data-testid="feed-item--favourite" type="button" class="u-background-white u-flexbox u-align-items-center new-item-box__favourite-icon mashinted-fav-btn" data-id="${itemData.id}">
                        <span class="web_ui__Icon__icon web_ui__Icon__greyscale-level-2 mashinted-fav-icon" data-testid="favourite-icon">
                            <svg fill="none" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" class="fav-icon-svg">
                                <path fill="currentColor" d="M3.149 3.247c-1.03.662-1.462 1.67-1.392 2.79.073 1.146.68 2.425 1.797 3.477 1.608 1.515 3.4 2.968 4.31 3.688.081.064.19.064.271 0 .91-.72 2.702-2.173 4.31-3.688 1.117-1.052 1.725-2.331 1.798-3.476.07-1.12-.363-2.13-1.392-2.79-.576-.371-1.113-.498-1.591-.498-.673 0-1.317.366-1.843.819a6 6 0 0 0-.343.322l-.716.736a.5.5 0 0 1-.717 0l-.716-.736a5 5 0 0 0-.342-.322c-.526-.453-1.17-.819-1.843-.819-.48 0-1.015.127-1.591.497m-.811-1.262c.818-.526 1.636-.735 2.402-.735 1.2 0 2.186.634 2.822 1.182A7 7 0 0 1 8 2.845a7 7 0 0 1 .438-.413c.636-.548 1.621-1.182 2.822-1.182.765 0 1.583.21 2.402.735 1.529.983 2.18 2.535 2.078 4.147-.1 1.586-.92 3.206-2.267 4.474-1.654 1.559-3.485 3.043-4.407 3.772a1.715 1.715 0 0 1-2.132 0c-.922-.729-2.754-2.213-4.408-3.772C1.18 9.338.36 7.718.26 6.132.16 4.52.81 2.968 2.338 1.985"></path>
                            </svg>
                        </span>
                    </button>
                </div>
                <div class="u-position-absolute u-left u-bottom u-zindex-bump mashinted-trash-container">
                    <button type="button" class="u-background-white u-flexbox u-align-items-center new-item-box__favourite-icon mashinted-trash-btn" title="Bloquer cette marque" data-brand="${escapeHtml(brand)}">
                        <span class="web_ui__Icon__icon web_ui__Icon__greyscale-level-2 mashinted-trash-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="2 4 3.33 4 14 4"></polyline>
                                <path d="M12.67 4v9.33a1.33 1.33 0 0 1-1.33 1.33H4.67a1.33 1.33 0 0 1-1.33-1.33V4m2 0V2.67a1.33 1.33 0 0 1 1.33-1.33h2.67a1.33 1.33 0 0 1 1.33 1.33V4"></path>
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
            <div class="new-item-box__summary new-item-box__summary--compact-bottom" data-testid="feed-item--summary">
                <div class="web_ui__Cell__cell web_ui__Cell__tight" role="presentation">
                    <div class="web_ui__Cell__content">
                        <div class="web_ui__Cell__body">
                            <div>
                                <div class="u-flexbox u-align-items-flex-start u-ui-padding-bottom-regular" data-testid="feed-item--spacing">
                                    <div class="u-min-width-none u-flex-grow">
                                        <div class="web_ui__Cell__cell web_ui__Cell__tight" role="presentation" data-testid="feed-item--description">
                                            <div class="web_ui__Cell__content">
                                                <div class="web_ui__Cell__body" data-testid="feed-item--description--content">
                                                    ${brandHTML}
                                                    ${subtitleHTML}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div class="u-position-relative">
                                        <div class="new-item-box__title" data-testid="feed-item--title-container">
                                            <div class="title-content">
                                                <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__muted" data-testid="feed-item--price-text">${escapeHtml(basePrice)}</p>
                                            </div>
                                        </div>
                                        <div data-testid="feed-item--breakdown">
                                            <div class="u-flexbox u-align-items-flex-start">
                                                <button class="u-flexbox u-align-items-center u-flex-wrap InlinePrice-module-scss-module__lczz_W__price" tabindex="0" aria-label="${escapeHtml(totalPrice)} Protection acheteurs incluse" type="button">
                                                    <span class="u-flexbox u-align-items-baseline u-flex-wrap">
                                                        <span class="web_ui__Text__text web_ui__Text__subtitle web_ui__Text__left web_ui__Text__primary web_ui__Text__underline-none" data-testid="total-combined-price">${escapeHtml(totalPrice)}</span>
                                                        <span class="web_ui__Spacer__x-small web_ui__Spacer__vertical"></span>
                                                        <span class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__primary web_ui__Text__underline-none" tabindex="-1" data-testid="service-fee-included-title">incl.</span>
                                                    </span>
                                                    <span class="web_ui__Spacer__x-small web_ui__Spacer__vertical"></span>
                                                    <span class="web_ui__Icon__icon web_ui__Icon__primary-default mashinted-fee-icon" data-testid="service-fee-included-icon">
                                                        <svg fill="none" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                                                            <path fill="currentColor" d="m7.924 4.114.708.707-2.829 2.828-2.121-2.121.707-.707 1.414 1.414z"></path>
                                                            <path fill="currentColor" fill-rule="evenodd" d="M11 6c0 4.2-5 6-5 6s-5-1.8-5-6V1.8L6 0l5 1.8zM2 6V2.503l4-1.44 4 1.44V6c0 1.66-.98 2.902-2.115 3.787A9.4 9.4 0 0 1 6 10.917a9.368 9.368 0 0 1-1.885-1.13C2.981 8.902 2 7.66 2 6m3.66 5.06" clip-rule="evenodd"></path>
                                                        </svg>
                                                    </span>
                                                </button>
                                            </div>
                                            <div class="web_ui__Spacer__small web_ui__Spacer__horizontal"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Favorites Logic
    const favBtn = card.querySelector('.mashinted-fav-btn');
    const favIconSvg = card.querySelector('.fav-icon-svg path');

    getFavorites().then((favorites) => {
        if (favorites[itemData.id]) {
            favIconSvg?.setAttribute('fill', '#C22C2C');
            favBtn.setAttribute('data-favorited', 'true');
        }
    });

    favBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isFav = favBtn.getAttribute('data-favorited') === 'true';
        if (isFav) {
            await removeFavorite(itemData.id);
            favIconSvg?.setAttribute('fill', 'currentColor');
            favBtn.setAttribute('data-favorited', 'false');
        } else {
            await saveFavorite(itemData.id, itemData);
            favIconSvg?.setAttribute('fill', '#C22C2C');
            favBtn.setAttribute('data-favorited', 'true');
        }
    });

    return card;
}