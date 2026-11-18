/**
 * @file health-report.js
 * @brief Pure helpers behind the dev health panel: merge runs, summarise per page, build the shareable report.
 * @details Stored entries hold ids, statuses and counts only (never page text, tokens or usernames).
 */

import { PAGES } from './selector-checks.js';

/** What to do on each page so its checks can pass. */
export const STEP_TEXT = {
    any: 'Be logged in, on any Vinted page.',
    home: 'Open the home page ( / ) and wait for the feed.',
    feed: 'Show item cards: the home page or any catalog page.',
    'saved-searches': 'On the home page press "Re-run in 5s", then open the header search bar and keep it open.',
    favourites: 'Open Favourites (/member/items/favourite_list), then press Re-run.',
    inbox: 'Open the Inbox (/inbox), then press Re-run.',
};

/**
 * @brief Merges a run into the stored results. A passing check is never replaced by a later miss
 *        (e.g. the saved-searches dropdown was closed during the re-run).
 * @param {Record<string, Object>} stored
 * @param {Array<{id: string, page: string, status: string, count: number, hint: string}>} results
 * @param {string} at ISO timestamp
 */
export function mergeResults(stored, results, at) {
    const next = { ...stored };
    for (const result of results) {
        const previous = next[result.id];
        if (!previous || result.status === 'ok' || previous.status !== 'ok') {
            next[result.id] = { page: result.page, status: result.status, count: result.count, hint: result.hint, at };
        }
    }
    return next;
}

/** @returns {Record<string, 'pending'|'ok'|'problem'>} One state per page key. */
export function summarizePages(stored) {
    const summary = {};
    for (const page of PAGES) {
        const entries = Object.values(stored).filter((entry) => entry.page === page);
        if (entries.length === 0) summary[page] = 'pending';
        else if (entries.some((entry) => entry.status === 'missing' || entry.status === 'invalid'))
            summary[page] = 'problem';
        else summary[page] = 'ok';
    }
    return summary;
}

/**
 * @brief Plain-text report meant to be pasted into a chat.
 * @param {Record<string, Object>} stored
 * @param {{version: string, page: string, at: string}} meta
 */
export function buildReport(stored, { version, page, at }) {
    const summary = summarizePages(stored);
    const lines = [`Mashinted selector report`, `version ${version} | last page: ${page} | ${at}`, ''];

    for (const pageKey of PAGES) {
        const entries = Object.entries(stored).filter(([, entry]) => entry.page === pageKey);
        lines.push(`## ${pageKey}: ${summary[pageKey]}`);
        for (const [id, entry] of entries) {
            const note = entry.status === 'ok' ? '' : ` -> ${entry.hint}`;
            lines.push(`[${entry.status}] ${id} (${entry.count})${note}`);
        }
    }

    const pending = PAGES.filter((pageKey) => summary[pageKey] === 'pending');
    if (pending.length > 0) lines.push('', `Not checked yet: ${pending.join(', ')}`);
    return lines.join('\n');
}
