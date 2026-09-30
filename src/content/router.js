/**
 * @file router.js
 * @brief Maps the current page to the feature set that should run on it.
 * @details Routes start once per page load. Vinted's SPA navigations re-use the
 *          running features (see features/blacklist/observers.js for URL-change handling).
 */

import { ensureCounterWidgetMounted } from '../features/blacklist/counter-widget.js';
import { startObserver, startPageTransitionObserver } from '../features/blacklist/observers.js';
import { initializeTrashEngine } from '../features/blacklist/trash-engine.js';
import { startSavedSearchesObserver } from '../features/aggregator/modal-injector.js';
import { startFavouriteListFilter } from '../features/favourites/favourite-filter.js';
import { startInbox } from '../features/inbox/index.js';

const routes = [
    {
        name: 'favourites',
        match: (pathname) => pathname.includes('/member/items/favourite_list'),
        start() {
            ensureCounterWidgetMounted();
            startFavouriteListFilter();
        },
    },
    {
        name: 'inbox',
        match: (pathname) => pathname.startsWith('/inbox'),
        start() {
            startInbox();
        },
    },
    {
        name: 'default',
        match: () => true,
        start() {
            // Upgrades the loading chip created by fast-widget-loader.js to the real widget
            ensureCounterWidgetMounted();
            startObserver();
            startPageTransitionObserver();
            initializeTrashEngine();
            startSavedSearchesObserver();
        },
    },
];

/**
 * @brief Starts the first route matching `pathname`.
 * @returns {string} The name of the route that was started.
 */
export function startRoute(pathname = window.location.pathname) {
    const route = routes.find((candidate) => candidate.match(pathname));
    route.start();
    return route.name;
}
