import { scanSavedSearches } from './scanner.js';
import { processScannedSearches } from './index.js';

export function injectSavedSearchButton() {
    const savedSearchesContent = document.querySelector('.saved-searches__content')
        || document.querySelector('[data-testid="saved-searches--content"] .saved-searches__content');

    if (!savedSearchesContent || savedSearchesContent.querySelector('#mashinted-aggregator-a')) {
        return;
    }

    const scanData = scanSavedSearches(savedSearchesContent);

    const outerContainer = document.createElement('div');
    const innerContainer = document.createElement('div');

    const link = document.createElement('a');
    link.id = 'mashinted-aggregator-a';
    link.className = 'web_ui__Cell__cell web_ui__Cell__default web_ui__Cell__navigating web_ui__Cell__link u-position-relative';
    link.href = '#';
    link.setAttribute('aria-label', `New items ${scanData.totalFormatted} ${scanData.breakdownText}`);
    link.setAttribute('data-testid', 'mashinted-aggregator-button');

    link.innerHTML = `
        <div class="web_ui__Cell__content">
            <div class="web_ui__Cell__heading">
                <div class="web_ui__Cell__title" data-testid="mashinted-aggregator-title">
                    <div class="u-flexbox">
                        <div class="u-ui-padding-right-small u-no-wrap" id="mashinted-count-wrapper" style="display: ${scanData.totalCount > 0 ? 'block' : 'none'};">
                            <span class="web_ui__Text__text web_ui__Text__body web_ui__Text__left web_ui__Text__primary" data-testid="item-count-inline">${scanData.totalFormatted}</span>
                        </div>
                        <span class="u-ellipsis u-flex-1 mashinted-title-text">New items</span>
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
                    <button type="button" id="mashinted-info-btn" class="mashinted-info-btn" aria-label="Loading limitations info">?</button>
                </div>
            </div>
        </div>
    `;

    const tooltip = document.createElement('div');
    tooltip.className = 'mashinted-tooltip-box web_ui__Card__card web_ui__Card__flat';
    tooltip.innerHTML = `
        <div class="web_ui__Text__text web_ui__Text__subtitle web_ui__Text__left web_ui__Text__primary mashinted-tooltip-title">
            ⚡ Loading Limits
        </div>
        <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__secondary mashinted-tooltip-desc">
            To optimize performance and avoid rate limits:
        </p>
        <ul class="mashinted-tooltip-list">
            <li><strong>Total ≤ 99 items:</strong> All new items are fetched.</li>
            <li><strong>Total > 99 items:</strong> Automatically capped at <strong>30 items max</strong> per search.</li>
        </ul>
    `;

    link.appendChild(tooltip);

    const infoBtn = link.querySelector('#mashinted-info-btn');
    let isClickOpen = false;

    const setTooltipState = (visible) => {
        tooltip.style.display = visible ? 'block' : 'none';
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

        const countWrapper = link.querySelector('#mashinted-count-wrapper');
        const countSpan = link.querySelector('[data-testid="item-count-inline"]');
        const breakdownSpan = link.querySelector('.mashinted-breakdown-text');

        try {
            if (breakdownSpan) breakdownSpan.textContent = 'Fetching items...';

            const count = await processScannedSearches(currentScan.items, (statusText) => {
                if (breakdownSpan) breakdownSpan.textContent = statusText;
            });

            if (breakdownSpan) breakdownSpan.textContent = `✅ ${count} item(s) injected!`;
            if (countSpan) countSpan.textContent = `+${count}`;
            if (countWrapper) countWrapper.style.display = 'block';
        } catch (err) {
            if (breakdownSpan) breakdownSpan.textContent = `❌ ${err.message || 'Error'}`;
        } finally {
            setTimeout(() => {
                const freshScan = scanSavedSearches(savedSearchesContent);
                if (countSpan) countSpan.textContent = freshScan.totalFormatted;
                if (countWrapper) countWrapper.style.display = freshScan.totalCount > 0 ? 'block' : 'none';
                if (breakdownSpan) breakdownSpan.textContent = freshScan.breakdownText;
                link.removeAttribute('data-loading');
            }, 3000);
        }
    });

    innerContainer.appendChild(link);
    outerContainer.appendChild(innerContainer);
    savedSearchesContent.prepend(outerContainer);
}

export function renderFetchControlsContainer(parentElement) {
    const wrapper = document.createElement('div');
    wrapper.className = 'mashinted-controls-wrapper';

    const actionBtn = document.createElement('button');
    actionBtn.id = 'mashinted-load-btn';
    actionBtn.className = 'web_ui__Button__button web_ui__Button__primary';
    actionBtn.innerText = 'Charger les nouveautés';

    const infoContainer = document.createElement('div');
    infoContainer.className = 'mashinted-info-tooltip-container';

    const infoIcon = document.createElement('button');
    infoIcon.type = 'button';
    infoIcon.className = 'mashinted-info-btn';
    infoIcon.innerHTML = '?';
    infoIcon.setAttribute('aria-label', 'Informations sur les limites de chargement');

    const tooltip = document.createElement('div');
    tooltip.className = 'mashinted-controls-tooltip';
    tooltip.innerHTML = `
        <div class="web_ui__Text__text web_ui__Text__subtitle web_ui__Text__left web_ui__Text__primary mashinted-tooltip-title">
            ⚡ Limites de chargement
        </div>
        <p class="web_ui__Text__text web_ui__Text__caption web_ui__Text__left web_ui__Text__secondary mashinted-tooltip-desc">
            Pour éviter les ralentissements et ne pas dépasser les limites de l'API :
        </p>
        <ul class="mashinted-tooltip-list">
            <li><strong>Total ≤ 99 articles :</strong> Tous les nouveaux articles sont récupérés.</li>
            <li><strong>Total > 99 articles :</strong> Chaque recherche est automatiquement plafonnée à <strong>30 articles maximum</strong>.</li>
        </ul>
    `;

    let isOpen = false;

    const setControlTooltipState = (visible) => {
        tooltip.style.display = visible ? 'block' : 'none';
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

export function startSavedSearchesObserver() {
    let timeoutId = null;

    const observer = new MutationObserver(() => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const modalBody = document.querySelector('[data-testid="saved-searches--content"], .saved-searches__content');
            if (modalBody) {
                injectSavedSearchButton();
            }
        }, 150);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}