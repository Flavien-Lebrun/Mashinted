/**
 * @file modal-helpers.js
 * @brief DOM cleanup and interaction helpers for Vinted overlay modals and previous aggregation runs containing utilities for favorites, API synchronization, and progress status banners
 */

/**
 * @brief Programmatically closes the active Vinted search overlay dropdown modal and clears input focus.
 */
export function closeSavedSearchesModal() {
    // 1. Target Vinted's full-screen search backdrop element directly
    const backdrop = document.querySelector('[data-testid="search-bar-background"]') ||
                     document.querySelector('[class*="background"]');

    if (backdrop) {
        // React overlay triggers require full mouse event sequences
        const options = { bubbles: true, cancelable: true, view: window };
        
        backdrop.dispatchEvent(new MouseEvent('mousedown', options));
        backdrop.dispatchEvent(new MouseEvent('mouseup', options));
        backdrop.click();
    }

    // 2. Blur active search inputs to release focus state
    const searchInput = document.querySelector('input[type="search"], input[id*="search"]');
    if (searchInput) {
        searchInput.blur();
    }

    // 3. Fallback: Temporarily apply utility class to hide modal wrapper instantly
    const modalWrapper = document.querySelector('[data-testid="search-bar-background"]')?.parentElement;
    if (modalWrapper) {
        modalWrapper.classList.add('mashinted-u-hidden');
        
        // Remove class after short delay so standard Vinted search functionality is unaffected
        setTimeout(() => {
            modalWrapper.classList.remove('mashinted-u-hidden');
        }, 300);
    }
}

/**
 * @brief Clears all previously injected aggregated card items, section dividers, and status banners from the active DOM.
 */
export function cleanupPreviousAggregation() {
    // 1. Target all nodes explicitly marked as aggregated extension content
    const aggregatedElements = document.querySelectorAll('[data-mashinted-aggregated="true"]');
    for (let i = 0; i < aggregatedElements.length; i++) {
        aggregatedElements[i].remove();
    }

    // 2. Remove leftover section dividers or section item wrappers by section ID
    const sectionElements = document.querySelectorAll('[data-section-id^="mashinted-sec-"]');
    for (let i = 0; i < sectionElements.length; i++) {
        sectionElements[i].remove();
    }

    // 3. Purge active or stale progress status banners
    const existingBanners = document.querySelectorAll(
        '.mashinted-progress-banner, #mashinted-progress-banner, [data-mashinted-progress-banner]'
    );
    for (let i = 0; i < existingBanners.length; i++) {
        existingBanners[i].remove();
    }
}

/**
 * @brief Escapes HTML characters for safety in DOM templates.
 * @param {string} str - String to escape.
 * @returns {string} Sanitized web-safe string.
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
 * @brief Toggles a Vinted item's favorite state using the dynamic CSRF token and full cookie session.
 * 
 * @param {string|number} itemId - Vinted Item ID
 * @param {HTMLElement} [buttonElement=null] - Optional button element to update
 * @returns {Promise<boolean>} Success state
 */
export async function toggleVintedNativeFavorite(itemId, buttonElement = null) {
    const numericId = parseInt(itemId, 10);
    if (isNaN(numericId)) {
        console.error('[Mashinted] Invalid Item ID:', itemId);
        return false;
    }

    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.content : "75f6c9fa-dc8e-4e52-a000-e09dd4084b3e";
    const cookieString = "..."; // Keep your long cookie string here

    try {
        const response = await fetch("https://www.vinted.fr/api/v2/user_favourites/toggle", {
            method: "POST",
            headers: {
                "accept": "application/json,text/plain,*/*",
                "content-type": "application/json",
                "cookie": cookieString,
                "locale": "fr-FR",
                "origin": "https://www.vinted.fr",
                "referer": "https://www.vinted.fr/",
                "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
                "x-anon-id": "5d866158-b39b-4f0c-8c43-e5d520eda669",
                "x-csrf-token": csrfToken,
                "x-requested-with": "XMLHttpRequest"
            },
            body: JSON.stringify({
                type: "item",
                user_favourites: [numericId]
            }),
            mode: "cors",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Mashinted] Favorite toggled successfully:', data);

        if (buttonElement) {
            updateButtonVisualState(buttonElement, true, 1);
        }

        return true;
    } catch (err) {
        console.error('[Mashinted] Favorite request failed:', err);
        return false;
    }
}

/**
 * @brief Updates the visual state, classes, paths, and attributes of a favorite button.
 */
export function updateButtonVisualState(buttonElement, isFavorited, newCount = 1) {
    if (!buttonElement) return;

    const iconSpan = buttonElement.querySelector('.mashinted-fav-icon') || buttonElement.querySelector('span[data-testid^="favourite"]');
    const svgPath = buttonElement.querySelector('path');
    const wrapperDiv = buttonElement.closest('.u-position-absolute');

    const emptyPath = "M3.149 3.247c-1.03.662-1.462 1.67-1.392 2.79.073 1.146.68 2.425 1.797 3.477 1.608 1.515 3.4 2.968 4.31 3.688.081.064.19.064.271 0 .91-.72 2.702-2.173 4.31-3.688 1.117-1.052 1.725-2.331 1.798-3.476.07-1.12-.363-2.13-1.392-2.79-.576-.371-1.113-.498-1.591-.498-.673 0-1.317.366-1.843.819a6 6 0 0 0-.343.322l-.716.736a.5.5 0 0 1-.717 0l-.716-.736a5 5 0 0 0-.342-.322c-.526-.453-1.17-.819-1.843-.819-.48 0-1.015.127-1.591.497m-.811-1.262c.818-.526 1.636-.735 2.402-.735 1.2 0 2.186.634 2.822 1.182A7 7 0 0 1 8 2.845a7 7 0 0 1 .438-.413c.636-.548 1.621-1.182 2.822-1.182.765 0 1.583.21 2.402.735 1.529.983 2.18 2.535 2.078 4.147-.1 1.586-.92 3.206-2.267 4.474-1.654 1.559-3.485 3.043-4.407 3.772a1.715 1.715 0 0 1-2.132 0c-.922-.729-2.754-2.213-4.408-3.772C1.18 9.338.36 7.718.26 6.132.16 4.52.81 2.968 2.338 1.985";
    const filledPath = "M4.74 1.25c-.766 0-1.584.21-2.402.735C.809 2.967.158 4.518.26 6.129c.1 1.585.92 3.204 2.266 4.47 1.654 1.558 3.486 3.042 4.408 3.77a1.716 1.716 0 0 0 2.132 0c.922-.728 2.753-2.211 4.407-3.77 1.346-1.266 2.166-2.885 2.267-4.47.101-1.61-.55-3.162-2.078-4.144-.819-.526-1.637-.735-2.402-.735-1.2 0-2.186.634-2.822 1.182-.164.14-.31.28-.438.412a7 7 0 0 0-.438-.412C6.926 1.884 5.941 1.25 4.74 1.25";

    if (isFavorited) {
        buttonElement.setAttribute("aria-pressed", "true");
        buttonElement.setAttribute("aria-label", `Supprimer des favoris, ajouté aux favoris par ${newCount} utilisateur${newCount > 1 ? 's' : ''}`);
        buttonElement.setAttribute("data-favorited", "true");

        if (iconSpan) {
            iconSpan.setAttribute("data-testid", "favourite-filled-icon");
            iconSpan.classList.remove("web_ui__Icon__greyscale-level-2");
            iconSpan.classList.add("web_ui__Icon__warning-default");
        }

        if (svgPath) {
            svgPath.setAttribute("d", filledPath);
            svgPath.setAttribute("fill", "currentColor");
        }

        if (!buttonElement.querySelector('[data-testid="favourite-count-text"]')) {
            const spacer = document.createElement('div');
            spacer.className = "web_ui__Spacer__small web_ui__Spacer__vertical";
            if (buttonElement.hasAttribute('data-mashinted-aggregated')) {
                spacer.setAttribute('data-mashinted-aggregated', 'true');
            }

            const countText = document.createElement('span');
            countText.className = "web_ui__Text__text web_ui__Text__caption web_ui__Text__left";
            countText.setAttribute("data-testid", "favourite-count-text");
            if (buttonElement.hasAttribute('data-mashinted-aggregated')) {
                countText.setAttribute('data-mashinted-aggregated', 'true');
            }
            countText.textContent = newCount;

            buttonElement.appendChild(spacer);
            buttonElement.appendChild(countText);
        } else {
            buttonElement.querySelector('[data-testid="favourite-count-text"]').textContent = newCount;
        }

        if (wrapperDiv && !wrapperDiv.querySelector('span[aria-live="polite"]')) {
            const srSpan = document.createElement('span');
            srSpan.setAttribute("aria-live", "polite");
            srSpan.className = "u-visually-hidden";
            srSpan.textContent = "Ajouté ! ";
            wrapperDiv.appendChild(srSpan);
        } else if (wrapperDiv) {
            wrapperDiv.querySelector('span[aria-live="polite"]').textContent = "Ajouté ! ";
        }
    } else {
        buttonElement.setAttribute("aria-pressed", "false");
        buttonElement.setAttribute("aria-label", "Favoris");
        buttonElement.setAttribute("data-favorited", "false");

        if (iconSpan) {
            iconSpan.setAttribute("data-testid", "favourite-icon");
            iconSpan.classList.remove("web_ui__Icon__warning-default");
            iconSpan.classList.add("web_ui__Icon__greyscale-level-2");
        }

        if (svgPath) {
            svgPath.setAttribute("d", emptyPath);
        }

        const spacer = buttonElement.querySelector('.web_ui__Spacer__small');
        const countText = buttonElement.querySelector('[data-testid="favourite-count-text"]');
        if (spacer) spacer.remove();
        if (countText) countText.remove();

        const screenReaderSpan = wrapperDiv ? wrapperDiv.querySelector('span[aria-live="polite"]') : null;
        if (screenReaderSpan) screenReaderSpan.textContent = "";
    }
}

/**
 * @brief Creates a progress status banner matching the divider visual design.
 */
export function createAggregatorProgressBanner(initialText = 'Agrégation en cours...') {
    const container = document.createElement('div');
    container.className = 'mashinted-grid-divider mashinted-progress-banner';

    container.innerHTML = `
        <div class="mashinted-divider-left">
            <span class="mashinted-spinner-wrapper">
                <svg class="mashinted-spinner-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <circle 
                        class="mashinted-spinner-circle" 
                        cx="12" 
                        cy="12" 
                        r="9" 
                        fill="none" 
                        stroke="currentColor" 
                        stroke-width="3" 
                        stroke-dasharray="28 28"
                        stroke-linecap="round">
                    </circle>
                </svg>
            </span>
            <div class="mashinted-status-text web_ui__Text__subtitle">
                ${escapeHtml(initialText)}
            </div>
        </div>
        <div class="mashinted-divider-right">
            <span class="mashinted-badge mashinted-item-count-badge">
                En cours
            </span>
        </div>
    `;

    return {
        element: container,
        updateStep(text) {
            const statusEl = container.querySelector('.mashinted-status-text');
            if (statusEl) statusEl.textContent = text;
        },
        complete(message = 'Agrégation terminée') {
            const statusEl = container.querySelector('.mashinted-status-text');
            const spinnerWrapper = container.querySelector('.mashinted-spinner-wrapper');
            const badge = container.querySelector('.mashinted-badge');

            if (statusEl) statusEl.textContent = message;

            if (spinnerWrapper) {
                spinnerWrapper.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#018849" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
            }

            if (badge) {
                badge.textContent = 'Terminé';
                badge.classList.add('mashinted-item-count-badge--complete');
            }

            setTimeout(() => {
                container.style.opacity = '0';
                container.style.transform = 'translateY(-10px)';
                setTimeout(() => container.remove(), 200);
            }, 2500);
        },
        remove() {
            container.remove();
        }
    };
}