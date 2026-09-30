/**
 * @file modal-injector.js
 * @brief Injector component that attaches the Mashinted aggregator action button and tooltips into Vinted's saved searches modal.
 */

import { scanSavedSearches } from './scanner.js';
import { processScannedSearches } from './index.js';
import { LOGO_SVG_STRING } from '../../vinted/templates.js';
import { queryFirst } from '../../vinted/dom.js';
import {
    GRID_ITEM_SELECTOR,
    SAVED_SEARCHES_CONTENT_SELECTORS,
    SAVED_SEARCH_LINK_SELECTOR,
} from '../../vinted/selectors.js';
import { closeSavedSearchesModal, cleanupPreviousAggregation } from './modal-helpers.js';
import { createAggregatorProgressBanner } from './grid-item-transfer.js';
import { createLogger } from '../../shared/logger.js';
import { t } from '../../shared/i18n.js';
import { escapeHtml } from '../../shared/escape-html.js';

const log = createLogger('aggregator');

/**
 * @brief Helper to generate consistent aggregator tooltip markup.
 * @returns {string} Safe HTML string for aggregator info tooltips.
 */
function createAggregatorTooltipContent() {
    return `
        <div class="web_ui__Text__text web_ui__Text__left web_ui__Text__primary mashinted-tooltip-title">
            ${escapeHtml(t('tooltipTitle'))}
        </div>
        <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__secondary mashinted-tooltip-desc">
            ${escapeHtml(t('tooltipDesc'))}<br>
            ${escapeHtml(t('tooltipLimits'))}
        </p>
        <ul class="mashinted-tooltip-list">
            <li><span class="web_ui__Text__amplified">${escapeHtml(t('tooltipUnderCapLabel'))}</span> ${escapeHtml(t('tooltipUnderCapText'))}</li>
            <li><span class="web_ui__Text__amplified">${escapeHtml(t('tooltipOverCapLabel'))}</span> ${escapeHtml(t('tooltipOverCapBefore'))} <span class="web_ui__Text__amplified">${escapeHtml(t('tooltipOverCapBold'))}</span> ${escapeHtml(t('tooltipOverCapAfter'))}</li>
        </ul>
    `;
}

/**
 * @brief Injects the primary Mashinted aggregator trigger row into Vinted's saved searches modal dropdown.
 */
export function injectSavedSearchButton() {
    // 1. Locate the container
    const savedSearchesContent = queryFirst(document, SAVED_SEARCHES_CONTENT_SELECTORS, 'saved-searches content');

    if (!savedSearchesContent || document.querySelector('#mashinted-aggregator-a')) {
        return;
    }

    // 2. Ensure Vinted has loaded saved search links inside
    const hasItems = savedSearchesContent.querySelector(SAVED_SEARCH_LINK_SELECTOR);
    if (!hasItems) {
        return;
    }

    const scanData = scanSavedSearches(savedSearchesContent);

    const outerContainer = document.createElement('div');
    const innerContainer = document.createElement('div');

    const link = document.createElement('a');
    link.id = 'mashinted-aggregator-a';
    link.className = 'web_ui__Cell__cell web_ui__Cell__default web_ui__Cell__navigating web_ui__Cell__link u-position-relative';
    link.href = '#';
    link.setAttribute('aria-label', t('aggregatorLabel', { total: scanData.totalFormatted, breakdown: scanData.breakdownText }));
    link.setAttribute('data-testid', 'mashinted-aggregator-button');

    const displayStyle = scanData.totalCount > 0 ? '' : 'mashinted-u-hidden';

    link.innerHTML = `
        <div class="web_ui__Cell__content">
            <div class="web_ui__Cell__heading">
                <div class="web_ui__Cell__title" data-testid="mashinted-aggregator-title">
                    <div class="u-flexbox">
                        <div class="u-ui-padding-right-small u-no-wrap mashinted-aggregator-count-wrapper ${displayStyle}" id="mashinted-count-wrapper">
                            <span class="web_ui__Text__text web_ui__Text__body web_ui__Text__left web_ui__Text__primary u-flexbox u-align-items-center mashinted-aggregator-icon" data-testid="item-count-inline">
                                ${LOGO_SVG_STRING}
                            </span>
                        </div>
                        <span class="u-ellipsis u-flex-1 mashinted-title-text">${escapeHtml(t('aggregatorTitle'))}</span>
                    </div>
                </div>
            </div>
            <div class="web_ui__Cell__body" data-testid="mashinted-aggregator-content">
                <span class="web_ui__Text__text web_ui__Text__subtitle web_ui__Text__left web_ui__Text__truncated mashinted-breakdown-text">${scanData.breakdownText}</span>
            </div>
        </div>
        <div class="web_ui__Cell__suffix" data-testid="mashinted-aggregator-suffix">
            <div class="u-position-relative u-zindex-bump">
                <div class="u-padding-medium mashinted-suffix-wrapper">
                    <button type="button" id="mashinted-info-btn" class="mashinted-info-btn" aria-label="${escapeHtml(t('infoLoadingLabel'))}">?</button>
                </div>
            </div>
        </div>
    `;

    const tooltip = document.createElement('div');
    tooltip.className = 'mashinted-tooltip-box web_ui__Card__card web_ui__Card__flat';
    tooltip.innerHTML = createAggregatorTooltipContent();

    link.appendChild(tooltip);

    const infoBtn = link.querySelector('#mashinted-info-btn');
    let isClickOpen = false;

    const setTooltipState = (visible) => {
        tooltip.classList.toggle('mashinted-tooltip--visible', visible);
        infoBtn.classList.toggle('mashinted-info-btn--active', visible);
    };

    infoBtn.addEventListener('mouseenter', () => setTooltipState(true));
    infoBtn.addEventListener('mouseleave', () => {
        if (!isClickOpen) setTooltipState(false);
    });

    infoBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    infoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isClickOpen = !isClickOpen;
        setTooltipState(isClickOpen);
    });

    document.addEventListener('click', (e) => {
        if (!link.contains(e.target)) {
            isClickOpen = false;
            setTooltipState(false);
        }
    });

    link.addEventListener('mousedown', (e) => e.stopPropagation());
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (link.getAttribute('data-loading') === 'true') return;

        const currentScan = scanSavedSearches(savedSearchesContent);
        if (currentScan.totalCount === 0) return;

        link.setAttribute('data-loading', 'true');

        closeSavedSearchesModal();

        const feedGrid = document.querySelector('.feed-grid') ||
                         document.querySelector(GRID_ITEM_SELECTOR)?.parentElement ||
                         document.querySelector('#content');

        if (!feedGrid) {
            log.error('Feed grid target container not found.');
            link.removeAttribute('data-loading');
            return;
        }

        cleanupPreviousAggregation();

        const progressBanner = createAggregatorProgressBanner(t('progressInitial'));
        feedGrid.prepend(progressBanner.element);

        try {
            const itemsToProcess = currentScan.items.slice().reverse();

            const count = await processScannedSearches(itemsToProcess, (statusText) => {
                progressBanner.updateStep(statusText);
            }, progressBanner);

            progressBanner.complete(t('progressInjected', { count }));

        } catch (err) {
            log.error('Aggregator error:', err);
            progressBanner.updateStep(t('progressError', { message: err.message || t('aggregationFailed') }));
            setTimeout(() => progressBanner.remove(), 4000);
        } finally {
            link.removeAttribute('data-loading');
        }
    });

    innerContainer.appendChild(link);
    outerContainer.appendChild(innerContainer);
    savedSearchesContent.prepend(outerContainer);
}

/**
 * @brief Renders a secondary fetch control button with tooltip container.
 * @param {HTMLElement} parentElement - DOM container to receive controls.
 */
export function renderFetchControlsContainer(parentElement) {
    if (!parentElement) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'mashinted-controls-wrapper';

    const actionBtn = document.createElement('button');
    actionBtn.id = 'mashinted-load-btn';
    actionBtn.className = 'web_ui__Button__button web_ui__Button__primary';
    actionBtn.innerText = t('loadButton');

    const infoContainer = document.createElement('div');
    infoContainer.className = 'mashinted-info-tooltip-container';

    const infoIcon = document.createElement('button');
    infoIcon.type = 'button';
    infoIcon.className = 'mashinted-info-btn';
    infoIcon.innerText = '?';
    infoIcon.setAttribute('aria-label', t('infoLimitsLabel'));

    const tooltip = document.createElement('div');
    tooltip.className = 'mashinted-controls-tooltip';
    tooltip.innerHTML = createAggregatorTooltipContent();

    let isOpen = false;

    const setControlTooltipState = (visible) => {
        tooltip.classList.toggle('mashinted-tooltip--visible', visible);
        infoIcon.classList.toggle('mashinted-info-btn--active', visible);
    };

    infoIcon.addEventListener('mouseenter', () => setControlTooltipState(true));
    infoIcon.addEventListener('mouseleave', () => {
        if (!isOpen) setControlTooltipState(false);
    });

    infoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        setControlTooltipState(isOpen);
    });

    document.addEventListener('click', () => {
        isOpen = false;
        setControlTooltipState(false);
    });

    infoContainer.appendChild(infoIcon);
    infoContainer.appendChild(tooltip);

    wrapper.appendChild(actionBtn);
    wrapper.appendChild(infoContainer);

    parentElement.appendChild(wrapper);
}

/**
 * @brief Starts observing the DOM body for saved search overlay arrivals and auto-injects the action button.
 */
export function startSavedSearchesObserver() {
    let animationFrameId = null;

    const checkAndInject = () => {
        const hasSavedItems = document.querySelector(SAVED_SEARCH_LINK_SELECTOR);
        const alreadyInjected = document.querySelector('#mashinted-aggregator-a');

        if (hasSavedItems && !alreadyInjected) {
            injectSavedSearchButton();
        }
    };

    const observer = new MutationObserver((mutations) => {
        const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
        if (!hasNewNodes) return;

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(checkAndInject);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    checkAndInject();
}