import '../styles/index.css';

import { ensureBrandBlacklistStorageReady } from '../shared/storage.js';
import { setupCounterWidgetSubscription } from '../features/blacklist/counter-widget.js';
import { createLogger } from '../shared/logger.js';
import { waitForReactHydration } from './hydration.js';
import { startRoute } from './router.js';

const log = createLogger('content');

async function boot() {
    try {
        await ensureBrandBlacklistStorageReady();
    } catch (error) {
        log.error('Failed to initialize blacklist storage.', error);
    }

    setupCounterWidgetSubscription();

    // Touching the DOM before React hydrates can cause hydration mismatches.
    await waitForReactHydration();

    log.debug(`Starting route: ${startRoute()}`);
}

boot();
