/**
 * @file wait.js
 * @brief Promise helpers for stepping through the inbox UI.
 */

import { observeDom } from '../../shared/dom-observer.js';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Resolves true once `predicate()` holds, or false after `timeoutMs`. */
export function waitFor(predicate, timeoutMs) {
    return new Promise((resolve) => {
        let done = false;
        let stop = () => {};
        const finish = (result) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            stop();
            resolve(result);
        };
        const timer = setTimeout(() => finish(false), timeoutMs);
        stop = observeDom(
            () => {
                if (predicate()) finish(true);
            },
            { attributeFilter: ['class'] },
        );
        if (done) stop();
    });
}
