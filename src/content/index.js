import './styles.css';

import { initializeTrashEngine } from './trash-engine.js';
import { startSavedSearchesObserver } from './aggregator/modal-injector.js';
import { ensureBrandBlacklistStorageReady } from '../utils/storage.js';
import { startPageTransitionObserver, startObserver } from './observers.js';
import { startFavouriteListFilter } from './favourites/favourite-filter.js';

import {
    setupCounterWidgetSubscription,
    ensureCounterWidgetMounted
} from './counter-widget.js';

console.log('[Mashinted] Content script loaded.');

let isReactHydrated = false;
let isStorageReady = false;

// Helper to check if current URL is the specific target page
function isFavouriteListPage() {
    return window.location.pathname.includes('/member/items/favourite_list');
}

function tryInitializeApp() {
    if (isReactHydrated && isStorageReady) {
        
        // --- ROUTING LOGIC: Check URL before running standard mashup ---
        if (isFavouriteListPage()) {
            console.log('[Mashinted] On favourite list page: Suspending standard actions and running alternative module.');
            ensureCounterWidgetMounted();
            startFavouriteListFilter();
            return; // Exit so standard observers don't fire
        }

        console.log('[Mashinted] Hydration + Storage ready! Upgrading widget & starting observers.');

        // Upgrades the loading chip created by fast-widget-loader.js to the real interactive widget
        ensureCounterWidgetMounted();

        startObserver();
        startPageTransitionObserver();
        initializeTrashEngine();
    }
}

function checkHydrationInMainWorld() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('checker.js');
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => script.remove();
}

// Listen for signal from public/checker.js
window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data?.type === 'MASHINTED_REACT_HYDRATED') {
        if (isReactHydrated) return;
        console.log('[Mashinted] React hydration confirmed!');
        isReactHydrated = true;
        tryInitializeApp();
    }
});

// Kick off initialization
ensureBrandBlacklistStorageReady()
    .catch((error) => {
        console.error('[Mashinted] Failed to initialize blacklist storage.', error);
    })
    .finally(() => {
        setupCounterWidgetSubscription();
        isStorageReady = true;
        checkHydrationInMainWorld();
        tryInitializeApp();
    });

async function init() {
  await ensureBrandBlacklistStorageReady();

  // Guard `init()` as well to match the same logic if called separately
  if (isFavouriteListPage()) {
      return;
  }

  // Main grid item observers
  startObserver();
  startPageTransitionObserver();

  // Search popover listener
  startSavedSearchesObserver();
}

init();