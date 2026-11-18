import '../styles/index.css';

import { ensureBrandBlacklistStorageReady } from '../shared/storage.js';
import { setupCounterWidgetSubscription } from '../features/blacklist/counter-widget.js';
import { createLogger } from '../shared/logger.js';
import { setLanguage } from '../shared/i18n.js';
import { detectVintedLanguage } from '../vinted/language.js';
import { waitForReactHydration } from './hydration.js';
import { createRouter } from './router.js';
import { observeDom } from '../shared/dom-observer.js';

const log = createLogger('content');

async function boot() {
    try {
        await ensureBrandBlacklistStorageReady();
    } catch (error) {
        log.error('Failed to initialize blacklist storage.', error);
    }

    // Coarse guess first (html lang / domain); refined once React has rendered the language selector.
    setLanguage(detectVintedLanguage());

    setupCounterWidgetSubscription();

    // Touching the DOM before React hydrates can cause hydration mismatches.
    await waitForReactHydration();
    setLanguage(detectVintedLanguage());

    // Vinted navigates without reloads: re-check the route on every DOM change (frame-batched).
    const router = createRouter();
    let lastRoute = null;
    observeDom(() => {
        const routeName = router.sync();
        if (routeName !== lastRoute) {
            lastRoute = routeName;
            log.debug(`Route: ${routeName}`);
        }
    });

    // Dev-only selector health check; the whole branch is removed from normal builds.
    if (__MASHINTED_DEV__) {
        import('../dev/health-console.js').then((module) => module.startHealthConsole());
    }
}

boot();
