/**
 * @file scanner.js
 * @brief Scans Vinted DOM containers for saved searches, unread counts, and bookmarked status.
 */

import {
    SAVED_SEARCH_BOOKMARK_SELECTOR,
    SAVED_SEARCH_COUNT_SELECTOR,
    SAVED_SEARCH_LINK_SELECTOR,
} from '../../vinted/selectors.js';

/**
 * @brief Inspects a saved search link row element to verify if it is bookmarked.
 * 
 * @param {HTMLElement} searchRowElement - DOM row element to check.
 * @returns {boolean} True if search is bookmarked, false otherwise.
 */
export function isSearchBookmarked(searchRowElement) {
    if (!searchRowElement || !(searchRowElement instanceof HTMLElement)) return false;

    const hasBookmarkAttr = searchRowElement.querySelector(SAVED_SEARCH_BOOKMARK_SELECTOR);
    if (hasBookmarkAttr) return true;

    const suffix = searchRowElement.querySelector('.web_ui__Cell__suffix');
    if (suffix) {
        return Boolean(suffix.querySelector('svg'));
    }

    return false;
}

/**
 * @brief Scans saved search DOM nodes within a container and compiles item counts.
 * 
 * @param {HTMLElement} containerElement - Parent container element holding saved search rows.
 * @returns {Object} Structured scan results containing active items list and summary texts.
 */
export function scanSavedSearches(containerElement) {
    if (!containerElement || !(containerElement instanceof HTMLElement)) {
        return {
            items: [],
            totalCount: 0,
            totalFormatted: '',
            breakdownText: "You're up to date"
        };
    }

    const searchCells = containerElement.querySelectorAll(SAVED_SEARCH_LINK_SELECTOR);
    const bookmarkedSearches = [];
    let cumulativeCount = 0;

    for (let i = 0; i < searchCells.length; i++) {
        const cell = searchCells[i];

        if (cell.id === 'mashinted-aggregator-a') continue;
        if (!isSearchBookmarked(cell)) continue;

        const countSpan = cell.querySelector(SAVED_SEARCH_COUNT_SELECTOR);
        const rawCountText = countSpan ? countSpan.textContent.trim() : '0';
        const numericCount = parseInt(rawCountText.replace(/\+/g, ''), 10) || 0;

        const titleSpan = cell.querySelector('.web_ui__Cell__title span.u-ellipsis') ||
                          cell.querySelector('.web_ui__Cell__title');
        const searchName = titleSpan ? titleSpan.textContent.trim() : 'Search';
        const searchUrl = cell.getAttribute('href') || '';

        bookmarkedSearches.push({
            element: cell,
            name: searchName,
            url: searchUrl,
            count: numericCount,
            rawCount: rawCountText
        });

        cumulativeCount += numericCount;
    }

    const activeSearches = bookmarkedSearches.filter((s) => s.count > 0);

    let breakdownText = "You're up to date";
    if (activeSearches.length > 0) {
        breakdownText = activeSearches
            .map((s) => `${s.name} (+${s.count > 99 ? '99' : s.count})`)
            .join(', ');
    }

    const totalFormatted = cumulativeCount > 99 ? '+99' : (cumulativeCount > 0 ? `+${cumulativeCount}` : '');

    return {
        items: bookmarkedSearches,
        totalCount: cumulativeCount,
        totalFormatted: totalFormatted,
        breakdownText: breakdownText
    };
}