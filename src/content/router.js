/**
 * @file router.js
 * @brief Maps the current page to the feature set that should run on it.
 * @details Vinted is a SPA: the page changes without a reload. `createRouter().sync()` is called
 *          on DOM changes; when the matching route changes it stops the previous feature set and
 *          starts the new one. Navigating inside the same route keeps its features running.
 */

import { ensureCounterWidgetMounted } from '../features/blacklist/counter-widget.js';
import { startBlacklistRescan, startObserver, startPageTransitionObserver } from '../features/blacklist/observers.js';
import { initializeTrashEngine } from '../features/blacklist/trash-engine.js';
import { startSavedSearchesObserver } from '../features/aggregator/modal-injector.js';
import { startFavouriteListFilter } from '../features/favourites/favourite-filter.js';
import { startInbox } from '../features/inbox/index.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('router');

/** @returns {() => void} One stop function that runs all the given ones. */
function combineStops(...stops) {
    return () => stops.forEach((stop) => stop?.());
}

/**
 * Each route's `start()` returns a function that stops everything it started.
 */
export const routes = [
    {
        name: 'favourites',
        match: (pathname) => pathname.includes('/member/items/favourite_list'),
        start() {
            ensureCounterWidgetMounted();
            return startFavouriteListFilter();
        },
    },
    {
        name: 'inbox',
        match: (pathname) => pathname.startsWith('/inbox'),
        start() {
            return startInbox();
        },
    },
    {
        name: 'default',
        match: () => true,
        start() {
            // Upgrades the loading chip created by fast-widget-loader.js to the real widget
            ensureCounterWidgetMounted();
            return combineStops(
                startObserver(),
                startPageTransitionObserver(),
                startBlacklistRescan(),
                initializeTrashEngine(),
                startSavedSearchesObserver(),
            );
        },
    },
];

/**
 * @param {Array} [routeList]
 * @param {() => string} [getPathname]
 */
export function createRouter(routeList = routes, getPathname = () => window.location.pathname) {
    let active = null;

    return {
        /**
         * @brief Starts the route matching the current path, stopping the previous one if it changed.
         * @returns {string} The active route name.
         */
        sync() {
            const route = routeList.find((candidate) => candidate.match(getPathname()));
            if (active?.route === route) return route.name;

            try {
                active?.stop?.();
            } catch (error) {
                log.error(`Stopping route "${active.route.name}" failed.`, error);
            }

            active = { route, stop: route.start() };
            return route.name;
        },
    };
}
