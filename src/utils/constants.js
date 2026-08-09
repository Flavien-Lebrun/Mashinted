/**
 * @file constants.js
 * @brief HTML templates and static selectors used across modules.
 */

// Chrome Storage Keys
export const BLACKLIST_STORAGE_KEY = 'bannedBrands';
export const FAVORITES_STORAGE_KEY = 'mashinted_favorites';

// Default Fallbacks
export const DEFAULT_BANNED_BRANDS = ['h&m', 'shein', 'zara'];
export const BRAND_NAME_SELECTOR = 'p[data-testid*="description-title"]';
export const HIDDEN_BY_BLACKLIST_ATTRIBUTE = 'data-mashinted-hidden-by-blacklist';
export const HIDDEN_BY_BLACKLIST_CLASS = 'mashinted-hidden-by-blacklist';
export const HIDDEN_BY_BLACKLIST_ACTIVE_CLASS = 'mashinted-hidden-by-blacklist-active';
export const HIDDEN_BY_BLACKLIST_FINAL_CLASS = 'mashinted-hidden-by-blacklist-final';
export const ROOT_OBSERVER_DISCONNECT_DELAY_MS = 5000;
export const GRID_ITEM_RETRY_INTERVAL_MS = 100;
export const GRID_ITEM_RETRY_LIMIT = 30;
export const HIDE_TRANSITION_DURATION_MS = 220;

export const HOMEPAGE_BLOCKS_SELECTOR = [
    '.feed-grid',
    '.catalog-grid',
    '[data-testid="homepage-blocks"]',
    '[data-testid="catalog-grid"]',
    '[data-testid="grid-container"]',
    '.homepage-blocks',
    '.items-grid',
    'main' // Ultimate fallback: target main content area if custom containers fail
].join(', ');

// DOM Selectors for Vinted grid elements and removable cards
export const REMOVABLE_SELECTORS = [
    '[data-testid="grid-item"]',
    '[class$="__feed-grid__item"]',
    '[class$="web_ui__ItemBox__container"]',
    '[data-testid="homepage-block"]',
    '[class$="__homepage-blocks__item"]'
].join(', ');

export const LOGO_SVG_STRING = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 392.75 351.31" width="16" height="16" style="flex-shrink: 0; color: rgba(var(--primary-default), 1);">
        <g transform="translate(-3.623756,376.847856) scale(0.100000,-0.100000)" fill="currentColor" stroke="none">
            <path d="M759 3751 c-153 -27 -252 -88 -304 -184 -14 -27 -39 -103 -56 -170 -55 -224 -118 -535 -164 -812 -13 -82 -29 -170 -34 -195 -6 -25 -19 -115 -31 -200 -11 -85 -25 -177 -30 -205 -5 -27 -19 -140 -30 -250 -11 -110 -25 -227 -30 -260 -17 -106 -41 -514 -43 -725 -2 -192 -1 -208 20 -253 44 -96 160 -180 308 -223 84 -25 297 -25 380 0 90 27 148 74 188 151 43 85 49 129 57 450 4 171 13 348 19 395 6 47 18 198 26 335 9 138 21 302 26 365 10 121 30 383 49 635 6 83 15 175 20 205 4 30 11 93 15 140 7 97 14 130 25 130 12 0 79 -183 95 -260 4 -19 11 -41 16 -50 4 -8 20 -64 34 -125 15 -60 39 -162 55 -225 15 -63 37 -160 50 -215 12 -55 28 -122 36 -150 7 -27 21 -86 30 -130 9 -44 22 -102 30 -130 7 -27 25 -99 38 -160 34 -150 78 -328 114 -460 17 -60 44 -161 60 -223 63 -233 109 -358 186 -497 30 -54 74 -60 128 -15 40 33 101 137 113 191 4 19 11 39 15 44 4 6 11 21 15 35 4 14 13 39 21 55 7 17 29 80 48 140 19 61 41 126 49 145 8 19 18 55 22 80 4 25 14 70 22 100 22 82 71 280 99 405 13 61 31 133 38 160 8 28 21 86 30 130 9 44 23 103 30 130 8 28 24 95 36 150 13 55 35 152 50 215 16 63 40 165 55 225 14 61 30 117 34 125 5 9 12 31 16 50 16 77 83 260 95 260 11 0 18 -33 25 -130 4 -47 11 -110 15 -140 5 -30 14 -122 20 -205 19 -252 39 -514 49 -635 5 -63 17 -227 26 -365 8 -137 20 -288 26 -335 6 -47 15 -224 19 -395 8 -321 14 -365 57 -450 40 -77 98 -124 188 -151 83 -25 296 -25 380 0 148 43 264 127 308 223 21 45 22 61 20 253 -2 211 -26 619 -43 725 -5 33 -19 150 -30 260 -11 110 -25 223 -30 250 -5 28 -19 120 -30 205 -12 85 -25 175 -31 200 -5 25 -21 113 -34 195 -46 277 -109 588 -164 812 -17 67 -42 143 -56 170 -56 104 -158 161 -337 189 -104 16 -127 16 -200 4 -354 -56 -604 -274 -764 -664 -14 -33 -29 -70 -34 -81 -44 -99 -159 -537 -196 -747 -8 -48 -20 -48 -28 0 -37 210 -152 648 -196 747 -5 11 -20 48 -34 81 -89 217 -220 398 -364 501 -124 89 -217 129 -367 158 -98 18 -142 18 -266 -4z"/>
        </g>
    </svg>
`;

export const TRASH_BUTTON_TEMPLATE = `
    <button type="button" class="u-background-white u-flexbox u-align-items-center new-item-box__favourite-icon mashinted-trash-btn" title="Blocking this brand">
        <span class="web_ui__Icon__icon" style="width: 16px; height: 16px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="2 4 3.33 4 14 4"></polyline>
                <path d="M12.67 4v9.33a1.33 1.33 0 0 1-1.33 1.33H4.67a1.33 1.33 0 0 1-1.33-1.33V4m2 0V2.67a1.33 1.33 0 0 1 1.33-1.33h2.67a1.33 1.33 0 0 1 1.33 1.33V4"></path>
            </svg>
        </span>
    </button>
`;

export const GRID_ITEM_TEMPLATE = `
    <div class="mashinted__feed-grid__item-content">
        <div class="u-flex-grow u-fill-width">
            <div class="mashinted__new-item-box__container" data-testid="product-item-id-{ITEM_ID}">
                <div class="u-position-relative u-min-height-none u-flex-auto mashinted__new-item-box__image-container">
                    <div class="mashinted__new-item-box__image">
                        <div class="web_ui__Image__image web_ui__Image__cover web_ui__Image__portrait web_ui__Image__rounded web_ui__Image__scaled web_ui__Image__ratio mashinted-image-bg" data-testid="product-item-id-{ITEM_ID}--image">
                            <img alt="{IMAGE_ALT}" class="web_ui__Image__content" data-testid="product-item-id-{ITEM_ID}--image--img" src="{IMAGE_URL}">
                        </div>
                    </div>
                    <a href="{ITEM_URL}" class="mashinted__new-item-box__overlay mashinted__new-item-box__overlay--clickable" data-testid="product-item-id-{ITEM_ID}--overlay-link" title="{TITLE_ALT}" target="_self" rel="noreferrer">
                        <div></div>
                    </a>
                    <div class="u-position-absolute u-right u-bottom u-zindex-bump">
                        <button aria-pressed="false" aria-label="Add to favourites" data-testid="product-item-id-{ITEM_ID}--favourite" type="button" class="u-background-white u-flexbox u-align-items-center ItemBoxFavouriteIcon-module-scss-module__7M3IKq__new-item-box__favourite-icon mashinted__fav-icon" data-id="{ITEM_ID}">
                            <span class="web_ui__Icon__icon web_ui__Icon__greyscale-level-2" data-testid="favourite-icon" style="width:16px">
                                <svg fill="none" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                                    <path fill="currentColor" d="M3.149 3.247c-1.03.662-1.462 1.67-1.392 2.79.073 1.146.68 2.425 1.797 3.477 1.608 1.515 3.4 2.968 4.31 3.688.081.064.19.064.271 0 .91-.72 2.702-2.173 4.31-3.688 1.117-1.052 1.725-2.331 1.798-3.476.07-1.12-.363-2.13-1.392-2.79-.576-.371-1.113-.498-1.591-.498-.673 0-1.317.366-1.843.819a6 6 0 0 0-.343.322l-.716.736a.5.5 0 0 1-.717 0l-.716-.736a5 5 0 0 0-.342-.322c-.526-.453-1.17-.819-1.843-.819-.48 0-1.015.127-1.591.497m-.811-1.262c.818-.526 1.636-.735 2.402-.735 1.2 0 2.186.634 2.822 1.182A7 7 0 0 1 8 2.845a7 7 0 0 1 .438-.413c.636-.548 1.621-1.182 2.822-1.182.765 0 1.583.21 2.402.735 1.529.983 2.18 2.535 2.078 4.147-.1 1.586-.92 3.206-2.267 4.474-1.654 1.559-3.485 3.043-4.407 3.772a1.715 1.715 0 0 1-2.132 0c-.922-.729-2.754-2.213-4.408-3.772C1.18 9.338.36 7.718.26 6.132.16 4.52.81 2.968 2.338 1.985"></path>
                                </svg>
                            </span>
                            {FAVOURITE_COUNT_HTML}
                        </button>
                        <span aria-live="polite" class="u-visually-hidden"></span>
                    </div>
                    <div class="u-position-absolute u-left u-bottom u-zindex-bump mashinted-trash-container">
                        <button type="button" class="u-background-white u-flexbox u-align-items-center mashinted-trash-btn" title="Bloquer cette marque" data-brand="{BRAND_ESCAPED}">
                            <span class="web_ui__Icon__icon" style="width: 16px; height: 16px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="2 4 3.33 4 14 4"></polyline>
                                    <path d="M12.67 4v9.33a1.33 1.33 0 0 1-1.33 1.33H4.67a1.33 1.33 0 0 1-1.33-1.33V4m2 0V2.67a1.33 1.33 0 0 1 1.33-1.33h2.67a1.33 1.33 0 0 1 1.33 1.33V4"></path>
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
                <div class="mashinted__new-item-box__summary mashinted__new-item-box__summary--compact-bottom" data-testid="product-item-id-{ITEM_ID}--summary">
                    <div class="web_ui__Cell__cell web_ui__Cell__tight" role="presentation">
                        <div class="web_ui__Cell__content">
                            <div class="web_ui__Cell__body">
                                <div>
                                    <div class="u-flexbox u-align-items-flex-start u-ui-padding-bottom-regular" data-testid="product-item-id-{ITEM_ID}--spacing">
                                        <div class="u-min-width-none u-flex-grow">
                                            <div class="web_ui__Cell__cell web_ui__Cell__tight" role="presentation" data-testid="product-item-id-{ITEM_ID}--description">
                                                <div class="web_ui__Cell__content">
                                                    <div class="web_ui__Cell__body" data-testid="product-item-id-{ITEM_ID}--description--content">
                                                        {BRAND_HTML}
                                                        {SUBTITLE_HTML}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="u-position-relative">
                                            <div class="mashinted__new-item-box__title" data-testid="product-item-id-{ITEM_ID}--title-container">
                                                <div class="mashinted__title-content">
                                                    <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__muted" data-testid="product-item-id-{ITEM_ID}--price-text">{BASE_PRICE}</p>
                                                </div>
                                            </div>
                                            <div data-testid="product-item-id-{ITEM_ID}--breakdown">
                                                <div class="u-flexbox u-align-items-flex-start">
                                                    <button class="u-flexbox u-align-items-center u-flex-wrap InlinePrice-module-scss-module__lczz_W__price" tabindex="0" aria-label="{TOTAL_PRICE} includes Buyer Protection" type="button">
                                                        <span class="u-flexbox u-align-items-baseline u-flex-wrap">
                                                            <span class="web_ui__Text__text web_ui__Text__subtitle web_ui__Text__left web_ui__Text__primary web_ui__Text__underline-none" data-testid="total-combined-price">{TOTAL_PRICE}</span>
                                                            <span class="web_ui__Spacer__x-small web_ui__Spacer__vertical"></span>
                                                            <span class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__primary web_ui__Text__underline-none" tabindex="-1" data-testid="service-fee-included-title">incl.</span>
                                                        </span>
                                                        <span class="web_ui__Spacer__x-small web_ui__Spacer__vertical"></span>
                                                        <span class="web_ui__Icon__icon web_ui__Icon__primary-default" data-testid="service-fee-included-icon" style="width: 12px;">
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
        </div>
    </div>
`;