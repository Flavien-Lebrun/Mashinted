/**
 * @file hydration.js
 * @brief Resolves once Vinted's React app has hydrated (signalled by public/checker.js
 *        running in the MAIN world), or after a safety timeout.
 */

import { createLogger } from '../shared/logger.js';

const log = createLogger('hydration');
const FALLBACK_TIMEOUT_MS = 15000;

export function waitForReactHydration() {
    return new Promise((resolve) => {
        let settled = false;

        const finish = (reason) => {
            if (settled) return;
            settled = true;
            window.removeEventListener('message', onMessage);
            clearTimeout(timer);
            log.debug(`Hydration wait over (${reason}).`);
            resolve();
        };

        const onMessage = (event) => {
            if (event.source !== window) return;
            if (event.data?.type === 'MASHINTED_REACT_HYDRATED') {
                finish(event.data.timedOut ? 'checker timed out' : 'hydrated');
            }
        };

        const timer = setTimeout(() => finish('fallback timeout'), FALLBACK_TIMEOUT_MS);
        window.addEventListener('message', onMessage);

        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('checker.js');
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
    });
}
