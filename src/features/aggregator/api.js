/**
 * @file api.js
 * @brief Handles external catalog fetch operations and DOM HTML parsing for catalog item extraction.
 */

import { createLogger } from '../../shared/logger.js';
import {
    CATALOG_PART,
    CSRF_META_SELECTOR,
} from '../../vinted/selectors.js';

const log = createLogger('api');

/**
 * @brief Safely fetches external catalog HTML using absolute URL resolution and CSRF headers.
 * 
 * @param {string} urlPath - Relative or absolute search path string.
 * @returns {Promise<string|null>} HTML string on success, or null on failure/timeout.
 */
export async function fetchExternalCatalogHtml(urlPath) {
    try {
        const fullUrl = new URL(urlPath, window.location.origin).toString();
        log.debug(`Executing fetch to URL: ${fullUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const csrfToken = document.querySelector(CSRF_META_SELECTOR)?.getAttribute('content');

        const headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'X-Requested-With': 'XMLHttpRequest'
        };
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: headers,
            signal: controller.signal,
            credentials: 'same-origin'
        });

        clearTimeout(timeoutId);

        log.debug(`Fetch HTTP status: ${response.status} (${response.statusText})`);

        if (!response.ok) {
            log.error(`HTTP error ${response.status} for URL: ${fullUrl}`);
            return null;
        }

        const htmlText = await response.text();
        log.debug(`Received response body (${htmlText.length} characters)`);

        return htmlText;

    } catch (err) {
        if (err.name === 'AbortError') {
            log.error(`Fetch timed out (8s limit reached) for: ${urlPath}`);
        } else {
            log.error(`Network/fetch error for ${urlPath}:`, err);
        }
        return null;
    }
}

/**
 * @brief Parses catalog HTML string into an array of structured item data objects.
 * 
 * @param {string} htmlString - Raw catalog HTML response.
 * @param {number} [maxLimit=15] - Maximum item count to parse.
 * @returns {Array<Object>} Extracted item metadata records.
 */
export function parseCatalogItems(htmlString, maxLimit = 15) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    // Select grid item wrappers
    const itemContainers = doc.querySelectorAll(CATALOG_PART.container);

    const items = [];
    const limit = Math.min(itemContainers.length, maxLimit);

    for (let i = 0; i < limit; i++) {
        const itemContainer = itemContainers[i];

        // 1. Universal Ends-With ($=) and Contains (*=) Selectors for dynamic data-testid attributes
        const brandEl = itemContainer.querySelector(CATALOG_PART.brand);

        const subtitleEl = itemContainer.querySelector(CATALOG_PART.subtitle);

        const priceEl = itemContainer.querySelector(CATALOG_PART.price);

        const totalPriceEl = itemContainer.querySelector(CATALOG_PART.totalPrice);

        const imgEl = itemContainer.querySelector(CATALOG_PART.image);

        const linkEl = itemContainer.querySelector(CATALOG_PART.link);

        // Extract Product URL and ID
        const productUrl = linkEl ? linkEl.getAttribute('href') : '';
        const productIdMatch = productUrl.match(/\/items\/(\d+)/);
        const productId = productIdMatch 
            ? productIdMatch[1] 
            : `agg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        // Text extraction
        const brandName = brandEl?.textContent?.trim() || '';
        const subtitleText = subtitleEl?.textContent?.trim() || '';
        let itemPrice = priceEl?.textContent?.trim() || '';
        let totalPrice = totalPriceEl?.textContent?.trim() || '';

        if (!itemPrice && totalPrice) itemPrice = totalPrice;
        if (!totalPrice && itemPrice) totalPrice = itemPrice;

        const resolvedItemUrl = productUrl
            ? (productUrl.startsWith('http') ? productUrl : `${window.location.origin}${productUrl}`)
            : window.location.origin;

        items.push({
            id: productId,
            brandName: brandName,
            subtitle: subtitleText,
            price: itemPrice || '—',
            totalPrice: totalPrice || itemPrice || '—',
            imageUrl: imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '',
            itemUrl: resolvedItemUrl
        });
    }

    return items;
}