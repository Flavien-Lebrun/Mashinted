/**
 * @file index.js
 * @brief Inbox route: floating widget with the inbox actions.
 */

import { observeDom } from '../../shared/dom-observer.js';
import { COUNTER_WIDGET_ID, INBOX_WIDGET_ID } from '../../shared/constants.js';
import { createLogger } from '../../shared/logger.js';
import { t } from '../../shared/i18n.js';
import { getUnreadIds, openUnreadConversations } from './conversations.js';

const log = createLogger('inbox');

const WIDGET_TEMPLATE = `
    <button class="web_ui__Chip__chip web_ui__Chip__outlined web_ui__Chip__round" type="button" data-mashinted-action="open-unread">
        <div class="web_ui__Chip__text">
            <span class="web_ui__Text__text web_ui__Text__subtitle web_ui__Text__left web_ui__Text__amplified"></span>
        </div>
    </button>
`;

function mountWidget() {
    if (document.getElementById(INBOX_WIDGET_ID)) return null;

    const wrapper = document.createElement('div');
    wrapper.id = INBOX_WIDGET_ID;
    wrapper.className = 'mashinted-counter-widget-wrapper mashinted-inbox-widget';
    wrapper.innerHTML = WIDGET_TEMPLATE;
    document.body.appendChild(wrapper);
    requestAnimationFrame(() => wrapper.classList.add('is-visible'));
    return wrapper;
}

function wireOpenUnread(button) {
    const label = button.querySelector('span');
    let running = false;
    let stopRequested = false;

    const renderIdle = () => {
        const count = getUnreadIds().length;
        label.textContent = t('inboxOpenUnread', { count });
        button.disabled = count === 0;
    };

    button.addEventListener('click', async () => {
        if (running) {
            stopRequested = true;
            return;
        }
        running = true;
        stopRequested = false;
        button.disabled = false;
        try {
            const opened = await openUnreadConversations({
                onProgress: (done, total) => {
                    label.textContent = t('inboxStop', { done, total });
                },
                shouldStop: () => stopRequested,
            });
            log.debug(`Opened ${opened} unread conversation(s).`);
        } catch (error) {
            log.error('Opening unread conversations failed.', error);
        } finally {
            running = false;
            renderIdle();
        }
    });

    // Keeps the count in sync while the list loads / changes; the run drives the label itself.
    observeDom(
        () => {
            if (!running) renderIdle();
        },
        { attributeFilter: ['class'] },
    );
}

export function startInbox() {
    // The "Filtering..." chip from fast-widget-loader.js is meaningless here.
    document.getElementById(COUNTER_WIDGET_ID)?.remove();

    const wrapper = mountWidget();
    if (wrapper) wireOpenUnread(wrapper.querySelector('[data-mashinted-action="open-unread"]'));
}
