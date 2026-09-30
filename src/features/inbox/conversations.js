/**
 * @file conversations.js
 * @brief Reads the conversation list of the inbox (`/inbox/*`) and opens conversations.
 */

import { INBOX_OPEN_TIMEOUT_MS, INBOX_STEP_DELAY_MS } from '../../shared/constants.js';
import { INBOX_ROW_SELECTOR, INBOX_ROW_TESTID_PREFIX, INBOX_UNREAD_ROW_SELECTOR } from '../../vinted/selectors.js';
import { sleep, waitFor } from './wait.js';

/** @returns {string} The conversation UUID carried by the row's `data-testid`. */
export function getConversationId(row) {
    return row.getAttribute('data-testid').slice(INBOX_ROW_TESTID_PREFIX.length);
}

export function findRowById(id, root = document) {
    return root.querySelector(`[data-testid="${INBOX_ROW_TESTID_PREFIX}${id}"][role="button"]`);
}

export function getRows(root = document) {
    return Array.from(root.querySelectorAll(INBOX_ROW_SELECTOR));
}

export function isUnread(row) {
    return row.matches(INBOX_UNREAD_ROW_SELECTOR);
}

/** @returns {string[]} Ids of the unread conversations currently rendered, in list order. */
export function getUnreadIds(root = document) {
    return Array.from(root.querySelectorAll(INBOX_UNREAD_ROW_SELECTOR), getConversationId);
}

/**
 * @brief Clicks a conversation row and waits until Vinted has opened it (row no longer unread).
 * @returns {Promise<boolean>} False when the row disappeared or the wait timed out.
 */
export async function openConversation(id) {
    const row = findRowById(id);
    if (!row) return false;
    row.scrollIntoView({ block: 'nearest' });
    row.click();
    return waitFor(() => {
        const current = findRowById(id);
        return !current || !isUnread(current);
    }, INBOX_OPEN_TIMEOUT_MS);
}

/**
 * @brief Opens every conversation that is unread right now, one after the other.
 * @param {Object} hooks
 * @param {(done: number, total: number) => void} hooks.onProgress - Called before each conversation.
 * @param {() => boolean} hooks.shouldStop - Checked between conversations.
 * @returns {Promise<number>} How many conversations were opened.
 */
export async function openUnreadConversations({ onProgress, shouldStop }) {
    const ids = getUnreadIds();
    let opened = 0;
    for (const id of ids) {
        if (shouldStop()) break;
        onProgress(opened + 1, ids.length);
        if (await openConversation(id)) opened += 1;
        await sleep(INBOX_STEP_DELAY_MS);
    }
    return opened;
}
