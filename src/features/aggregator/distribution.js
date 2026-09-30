/**
 * @file distribution.js
 * @brief Mathematical distribution and capping algorithms for item fetching across saved search feeds.
 */

/**
 * @brief Calculates target item allocation per saved search based on total item volume.
 * 
 * @param {Array<Object>} scannedItems - List of scanned saved search descriptor records.
 * @param {number} [thresholdCapTrigger=99] - Global threshold count triggering per-search capping.
 * @param {number} [maxCappedPerSearch=30] - Maximum item count cap per search when overloaded.
 * @returns {Array<Object>} Updated search records containing targetToFetch properties.
 */
export function calculateFetchDistribution(scannedItems, thresholdCapTrigger = 99, maxCappedPerSearch = 30) {
    if (!Array.isArray(scannedItems) || scannedItems.length === 0) return [];

    const activeSearches = scannedItems.filter((item) => item && item.count > 0);
    if (activeSearches.length === 0) return [];

    const grandTotalCount = activeSearches.reduce((sum, item) => sum + (item.count || 0), 0);
    const isOverloaded = grandTotalCount > thresholdCapTrigger;

    return activeSearches.map((item) => {
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