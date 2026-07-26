/**
 * Calculates item allocation:
 * - If total pending items across ALL searches > 99: hard cap every search to 30 items.
 * - Otherwise: fetch the exact amount reported per search.
 */
export function calculateFetchDistribution(scannedItems, thresholdCapTrigger = 99, maxCappedPerSearch = 30) {
    const activeSearches = scannedItems.filter(item => item.count > 0);
    if (activeSearches.length === 0) return [];

    const grandTotalCount = activeSearches.reduce((sum, item) => sum + (item.count || 1), 0);
    const isOverloaded = grandTotalCount > thresholdCapTrigger;

    return activeSearches.map(item => {
        let fetchCount = item.count;

        if (isOverloaded) {
            fetchCount = Math.min(item.count, maxCappedPerSearch);
        }

        return {
            ...item,
            targetToFetch: fetchCount
        };
    });
}

export function isSearchBookmarked(searchRowElement) {
    const hasBookmarkAttr = searchRowElement.querySelector('[data-testid="saved-search-bookmark"]');
    if (hasBookmarkAttr) return true;

    const suffix = searchRowElement.querySelector('.web_ui__Cell__suffix');
    if (suffix) {
        return Boolean(suffix.querySelector('svg'));
    }

    return false;
}