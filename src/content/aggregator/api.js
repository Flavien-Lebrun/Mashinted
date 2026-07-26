/**
 * Safely fetches external catalog HTML using absolute URL resolution,
 * standard Vinted request headers, and standard timeout handling.
 */
export async function fetchExternalCatalogHtml(urlPath) {
    try {
        const fullUrl = new URL(urlPath, window.location.origin).toString();
        console.log(`[Mashinted Debug] Executing fetch to absolute URL: ${fullUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

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

        console.log(`[Mashinted Debug] Fetch HTTP status: ${response.status} (${response.statusText})`);

        if (!response.ok) {
            console.error(`[Mashinted Debug] HTTP error response ${response.status} for URL: ${fullUrl}`);
            return null;
        }

        const htmlText = await response.text();
        console.log(`[Mashinted Debug] Received response body (${htmlText.length} characters)`);

        return htmlText;

    } catch (err) {
        if (err.name === 'AbortError') {
            console.error(`[Mashinted Debug] Fetch timed out (8s limit reached) for: ${urlPath}`);
        } else {
            console.error(`[Mashinted Debug] Network/fetch error for ${urlPath}:`, err);
        }
        return null;
    }
}

/**
 * Parses catalog HTML string into structured item objects.
 */
export function parseCatalogItems(htmlString, maxLimit = 15) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const itemContainers = doc.querySelectorAll('[data-testid="grid-item"], .feed-grid__item, .web_ui__ItemBox__container');

    const items = [];

    for (let i = 0; i < Math.min(itemContainers.length, maxLimit); i++) {
        const itemContainer = itemContainers[i];

        const brandEl = itemContainer.querySelector('[data-testid="feed-item--description-title"]');
        const subtitleEl = itemContainer.querySelector('[data-testid="feed-item--description-subtitle"]');
        const priceEl = itemContainer.querySelector('[data-testid="feed-item--price-text"], .title-content p, .web_ui__ItemBox__title--price');
        const totalPriceEl = itemContainer.querySelector('[data-testid="total-combined-price"]');
        const imgEl = itemContainer.querySelector('[data-testid="feed-item--image--img"], img');
        const linkEl = itemContainer.querySelector('a[href*="/items/"]');

        const productUrl = linkEl ? linkEl.getAttribute('href') : '';
        const productIdMatch = productUrl.match(/\/items\/(\d+)/);
        const productId = productIdMatch ? productIdMatch[1] : `agg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

        let brandName = brandEl?.textContent?.trim() || '';
        let subtitleText = subtitleEl?.textContent?.trim() || '';
        let itemPrice = priceEl?.textContent?.trim() || '';
        let totalPrice = totalPriceEl?.textContent?.trim() || '';

        if (!itemPrice && totalPrice) itemPrice = totalPrice;
        if (!totalPrice && itemPrice) totalPrice = itemPrice;

        items.push({
            id: productId,
            brandName: brandName,
            subtitle: subtitleText,
            price: itemPrice || '—',
            totalPrice: totalPrice || itemPrice || '—',
            imageUrl: imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '',
            itemUrl: productUrl ? (productUrl.startsWith('http') ? productUrl : `https://www.vinted.fr${productUrl}`) : 'https://www.vinted.fr',
        });
    }

    return items;
}