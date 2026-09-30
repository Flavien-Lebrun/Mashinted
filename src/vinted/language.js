/**
 * @file language.js
 * @brief Detects which language Vinted is currently displayed in.
 * @details Sources, most to least reliable:
 *          1. the language selector button label (`FR`, `EN`, ...),
 *          2. `<html lang>`,
 *          3. the domain's country code (vinted.fr -> fr, vinted.co.uk / .com -> en),
 *          4. the browser language (`navigator.language`).
 *          Returns a lowercase ISO 639-1 code, or `null` when nothing matched.
 */

import { LANGUAGE_SELECTOR_BUTTON_SELECTOR, LANGUAGE_SELECTOR_LABEL_SELECTOR } from './selectors.js';

const LANGUAGE_CODE_PATTERN = /^[a-z]{2}$/;

/** Country TLDs whose language code differs from the TLD itself. */
const TLD_TO_LANGUAGE = { com: 'en', uk: 'en', at: 'de', be: 'fr', cz: 'cs', se: 'sv', dk: 'da', gr: 'el' };

function normalizeCode(raw) {
    const code = String(raw || '')
        .trim()
        .toLowerCase()
        .split(/[-_]/)[0];
    return LANGUAGE_CODE_PATTERN.test(code) ? code : null;
}

export function detectFromSelector(root = document) {
    const button = root.querySelector(LANGUAGE_SELECTOR_BUTTON_SELECTOR);
    if (!button) return null;
    const label = button.querySelector(LANGUAGE_SELECTOR_LABEL_SELECTOR);
    return normalizeCode((label || button).textContent);
}

export function detectFromHtmlLang(root = document) {
    return normalizeCode(root.documentElement?.getAttribute('lang'));
}

export function detectFromHostname(hostname = window.location.hostname) {
    const tld = hostname.split('.').pop();
    return normalizeCode(TLD_TO_LANGUAGE[tld] || tld);
}

export function detectFromNavigator(nav = window.navigator) {
    return normalizeCode(nav?.language);
}

/**
 * @returns {string|null} Lowercase language code (e.g. "fr"), or null if undetectable.
 */
export function detectVintedLanguage(root = document, hostname = window.location.hostname) {
    return detectFromSelector(root) || detectFromHtmlLang(root) || detectFromHostname(hostname) || detectFromNavigator();
}
