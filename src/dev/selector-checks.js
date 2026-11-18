/**
 * @file selector-checks.js
 * @brief Dev-only health check: do the selectors from vinted/selectors.js still match Vinted's markup?
 * @details Pure and DOM-only so it runs in jsdom tests and in a live page. Results carry ids and
 *          counts only (never item text, usernames or conversation ids) so a report is safe to share.
 */

import {
    BRAND_NAME_SELECTOR,
    CARD_INNER_CONTAINER_SELECTOR,
    CATALOG_PART,
    FAVOURITE_BUTTON_SELECTOR,
    FAVOURITES_GRID_SELECTOR,
    GRID_ITEM_SELECTOR,
    HOMEPAGE_FEED_SELECTORS,
    HOMEPAGE_BLOCKS_SELECTOR,
    INBOX_ROW_SELECTOR,
    INBOX_UNREAD_ROW_SELECTOR,
    ITEM_LINK_SELECTOR,
    ITEM_STATUS_SELECTOR,
    LANGUAGE_SELECTOR_BUTTON_SELECTOR,
    SAVED_SEARCH_BOOKMARK_SELECTOR,
    SAVED_SEARCH_COUNT_SELECTOR,
    SAVED_SEARCH_LINK_SELECTOR,
    SAVED_SEARCHES_CONTENT_SELECTORS,
} from '../vinted/selectors.js';
import { findCsrfTokenInScripts } from '../features/aggregator/modal-helpers.js';
import { findFavouritesGrid } from '../features/favourites/favourite-filter.js';

/**
 * Pages the check can target.
 * `any` checks apply everywhere; `home` is the front page only; `feed` is every page showing item cards
 * (home included); the others only on their page.
 */
export const PAGES = ['any', 'home', 'feed', 'saved-searches', 'favourites', 'inbox'];

/**
 * @typedef {Object} Check
 * @property {string} id        Stable identifier shown in reports.
 * @property {string} page      One of PAGES.
 * @property {string} [selector]  CSS selector list (any match counts).
 * @property {(root: ParentNode) => number} [count]  Custom counter, used instead of `selector`.
 * @property {string} hint      What to do on the page so the element exists.
 * @property {boolean} [optional] A miss is a warning, not a failure (state-dependent elements).
 */

/** The feed selector without its catch-all `main` fallback, which would always match. */
const STRICT_FEED_CONTAINER = HOMEPAGE_BLOCKS_SELECTOR.split(', ').filter((selector) => selector !== 'main').join(', ');

/** @type {Check[]} */
export const CHECKS = [
    {
        id: 'csrf-token',
        page: 'any',
        count: (root) => (findCsrfTokenInScripts(root.querySelectorAll('script')) ? 1 : 0),
        hint: 'Be logged in. Favourite toggles on aggregated cards need it.',
    },
    { id: 'language-button', page: 'any', selector: LANGUAGE_SELECTOR_BUTTON_SELECTOR, hint: 'Desktop layout, header visible.' },

    { id: 'feed-container', page: 'feed', selector: STRICT_FEED_CONTAINER, hint: 'Open the home page and wait for the feed.' },
    { id: 'feed-aggregator-target', page: 'home', selector: HOMEPAGE_FEED_SELECTORS.join(', '), hint: 'Home page, logged in.' },
    { id: 'grid-item', page: 'feed', selector: GRID_ITEM_SELECTOR, hint: 'Wait until cards render.' },
    { id: 'card-brand', page: 'feed', selector: BRAND_NAME_SELECTOR, hint: 'Cards must show a brand line.' },
    { id: 'card-link', page: 'feed', selector: ITEM_LINK_SELECTOR, hint: 'Cards link to /items/.' },
    { id: 'card-inner', page: 'feed', selector: CARD_INNER_CONTAINER_SELECTOR, hint: 'Catalog and profile pages; the home feed may not have it.', optional: true },
    { id: 'card-favourite-button', page: 'feed', selector: FAVOURITE_BUTTON_SELECTOR, hint: 'Logged in, cards rendered.' },
    { id: 'catalog-container', page: 'feed', selector: CATALOG_PART.container, hint: 'Same markup as fetched search pages.' },
    { id: 'catalog-price', page: 'feed', selector: CATALOG_PART.price, hint: 'Cards show a price.' },

    { id: 'saved-searches-content', page: 'saved-searches', selector: SAVED_SEARCHES_CONTENT_SELECTORS.join(', '), hint: 'Click the header search bar to open the dropdown.' },
    { id: 'saved-search-link', page: 'saved-searches', selector: SAVED_SEARCH_LINK_SELECTOR, hint: 'Have at least one saved search.' },
    { id: 'saved-search-bookmark', page: 'saved-searches', selector: SAVED_SEARCH_BOOKMARK_SELECTOR, hint: 'Bookmark one saved search.', optional: true },
    { id: 'saved-search-count', page: 'saved-searches', selector: SAVED_SEARCH_COUNT_SELECTOR, hint: 'Needs a search with new items.', optional: true },

    { id: 'favourites-grid', page: 'favourites', selector: FAVOURITES_GRID_SELECTOR, hint: 'Class selector only; the grouping falls back to the cards\' parent.', optional: true },
    {
        id: 'favourites-grid-resolved',
        page: 'favourites',
        count: (root) => (findFavouritesGrid(root) ? 1 : 0),
        hint: 'Open /member/items/favourite_list with favourites. Grouping needs this.',
    },
    { id: 'favourites-item', page: 'favourites', selector: GRID_ITEM_SELECTOR, hint: 'Have favourites.' },
    { id: 'favourites-status', page: 'favourites', selector: ITEM_STATUS_SELECTOR, hint: 'Needs at least one sold favourite.', optional: true },

    { id: 'inbox-row', page: 'inbox', selector: INBOX_ROW_SELECTOR, hint: 'Open /inbox with conversations.' },
    { id: 'inbox-unread-row', page: 'inbox', selector: INBOX_UNREAD_ROW_SELECTOR, hint: 'Needs an unread conversation.', optional: true },
];

/**
 * @typedef {Object} CheckResult
 * @property {string} id
 * @property {string} page
 * @property {number} count
 * @property {'ok'|'missing'|'warn'|'invalid'} status
 * @property {string} hint
 */

/**
 * @brief Runs every check of the given page (plus `any`) against a root.
 * @param {ParentNode} root
 * @param {string} page One of PAGES (not `any`).
 * @param {Check[]} [checks]
 * @returns {CheckResult[]}
 */
export function runChecks(root, page, checks = CHECKS) {
    return checks
        .filter((check) => check.page === 'any' || check.page === page)
        .map((check) => {
            let count = 0;
            let status;
            try {
                count = check.count ? check.count(root) : root.querySelectorAll(check.selector).length;
                status = count > 0 ? 'ok' : check.optional ? 'warn' : 'missing';
            } catch {
                status = 'invalid'; // The selector itself is malformed.
            }
            return { id: check.id, page: check.page, count, status, hint: check.hint };
        });
}

/** @returns {boolean} True when nothing is missing or invalid (warnings are allowed). */
export function isHealthy(results) {
    return results.every((result) => result.status === 'ok' || result.status === 'warn');
}
