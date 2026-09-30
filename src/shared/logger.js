/**
 * @file logger.js
 * @brief Prefixed logger. debug/info are silent in production builds unless
 *        `localStorage['mashinted:debug'] = '1'` is set on the page.
 */

const PREFIX = '[Mashinted]';

function isDebugEnabled() {
    if (import.meta.env?.DEV) return true;
    try {
        return localStorage.getItem('mashinted:debug') === '1';
    } catch {
        return false;
    }
}

/**
 * @brief Creates a logger whose messages are tagged with an optional scope.
 * @param {string} [scope] - Module name shown after the prefix.
 */
export function createLogger(scope) {
    const tag = scope ? `${PREFIX}:${scope}` : PREFIX;
    return {
        debug: (...args) => { if (isDebugEnabled()) console.debug(tag, ...args); },
        info: (...args) => { if (isDebugEnabled()) console.info(tag, ...args); },
        warn: (...args) => console.warn(tag, ...args),
        error: (...args) => console.error(tag, ...args),
    };
}

export const logger = createLogger();
