import { isSearchBookmarked } from './distribution.js';

/**
 * Scans saved search items within the container.
 */
export function scanSavedSearches(containerElement) {
    const searchCells = containerElement.querySelectorAll('a[data-testid^="saved-search-"]');

    const bookmarkedSearches = [];
    let cumulativeCount = 0;

    searchCells.forEach(cell => {
        if (cell.id === 'mashinted-aggregator-a') return;

        // Use imported function directly
        if (!isSearchBookmarked(cell)) return;

        const countSpan = cell.querySelector('[data-testid="item-count-inline"]');
        const rawCountText = countSpan ? countSpan.textContent.trim() : '0';
        const numericCount = parseInt(rawCountText.replace(/\+/g, ''), 10) || 0;

        const titleSpan = cell.querySelector('.web_ui__Cell__title span.u-ellipsis') || cell.querySelector('.web_ui__Cell__title');
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
    });

    const activeSearches = bookmarkedSearches.filter(s => s.count > 0);

    let breakdownText = "You're up to date";
    if (activeSearches.length > 0) {
        breakdownText = activeSearches
            .map(s => `${s.name} (+${s.count > 99 ? '99' : s.count})`)
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