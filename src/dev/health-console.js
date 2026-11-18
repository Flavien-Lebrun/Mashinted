/**
 * @file health-console.js
 * @brief Dev-only entry: runs the selector checks for the current page, logs them and feeds the panel.
 * @details Only bundled with `npm run build:check`.
 */

import { isHealthy, runChecks } from './selector-checks.js';
import { mountHealthPanel } from './health-panel.js';

const AUTO_RUN_DELAY_MS = 3000;

/** @returns {string} The page key matching the current URL. */
export function detectPage(pathname = window.location.pathname) {
    if (pathname.startsWith('/inbox')) return 'inbox';
    if (pathname.includes('/member/items/favourite_list')) return 'favourites';
    if (pathname === '/') return 'home';
    return 'feed';
}

/** The front page and catalog pages show cards and host the saved-searches dropdown. */
function pagesToCheck(page) {
    if (page === 'home') return ['home', 'feed', 'saved-searches'];
    if (page === 'feed') return ['feed', 'saved-searches'];
    return [page];
}

export function runHealthCheck() {
    const page = detectPage();
    const seen = new Set();
    const results = pagesToCheck(page)
        .flatMap((target) => runChecks(document, target))
        .filter((result) => !seen.has(result.id) && seen.add(result.id));

    const verdict = isHealthy(results) ? 'OK' : 'PROBLEMS';
    console.groupCollapsed(`[Mashinted] selector health on "${page}": ${verdict}`);
    console.table(results.map(({ id, status, count, hint }) => ({ id, status, count, hint })));
    console.groupEnd();
    return results;
}

export function startHealthConsole() {
    mountHealthPanel({ run: runHealthCheck, getPage: detectPage, autoRunDelayMs: AUTO_RUN_DELAY_MS });
}
