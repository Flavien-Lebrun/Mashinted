/**
 * @file i18n.js
 * @brief Minimal translation layer: `t(key, params)` resolved against the active language.
 * @details The language is set once at boot from `vinted/language.js`. Unsupported
 *          languages fall back to English, and missing keys fall back to English too.
 */

import { DEFAULT_LANGUAGE, LOCALES } from './locales.js';

let activeLanguage = DEFAULT_LANGUAGE;

/** @returns {string[]} Language codes we ship strings for. */
export function getSupportedLanguages() {
    return Object.keys(LOCALES);
}

/**
 * @param {string|null|undefined} code - Lowercase language code, e.g. "fr".
 * @returns {string} The language actually applied (the default when unsupported).
 */
export function setLanguage(code) {
    activeLanguage = code && LOCALES[code] ? code : DEFAULT_LANGUAGE;
    return activeLanguage;
}

export function getLanguage() {
    return activeLanguage;
}

/**
 * @param {string} key - Key of `locales.js`.
 * @param {Object} [params] - Interpolation values for function entries.
 * @returns {string} Plain text (escape before using in `innerHTML`).
 */
export function t(key, params = {}) {
    const entry = LOCALES[activeLanguage][key] ?? LOCALES[DEFAULT_LANGUAGE][key];
    if (entry === undefined) return key;
    return typeof entry === 'function' ? entry(params) : entry;
}
