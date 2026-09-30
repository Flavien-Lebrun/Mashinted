/**
 * @file dom.js
 * @brief Small DOM helpers for resilient lookups on Vinted's unstable markup.
 */

import { createLogger } from '../shared/logger.js';

const log = createLogger('dom');
const reportedMisses = new Set();

/**
 * @brief Returns the first element matched by any selector, tried in order.
 *        Logs (once per label, debug only) when every strategy fails so a
 *        Vinted markup change is easy to spot.
 * @param {ParentNode} root - Where to search.
 * @param {string[]} selectors - Candidate selectors, most specific first.
 * @param {string} [label] - Name used in the miss log.
 * @returns {Element|null}
 */
export function queryFirst(root, selectors, label) {
    for (const selector of selectors) {
        const found = root.querySelector(selector);
        if (found) return found;
    }
    if (label && !reportedMisses.has(label)) {
        reportedMisses.add(label);
        log.debug(`No selector matched for "${label}":`, selectors);
    }
    return null;
}
