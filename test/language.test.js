import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    detectFromHostname,
    detectFromNavigator,
    detectFromHtmlLang,
    detectFromSelector,
    detectVintedLanguage,
} from '../src/vinted/language.js';

const selectorHtml = readFileSync(resolve(__dirname, 'fixtures/language-selector.html'), 'utf8');

beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('lang');
});

describe('detectFromSelector', () => {
    it('reads the code from the language selector button', () => {
        document.body.innerHTML = selectorHtml;
        expect(detectFromSelector()).toBe('fr');
    });

    it('returns null when the selector is absent', () => {
        expect(detectFromSelector()).toBeNull();
    });
});

describe('fallbacks', () => {
    it('reads <html lang>, ignoring the region', () => {
        document.documentElement.setAttribute('lang', 'nl-BE');
        expect(detectFromHtmlLang()).toBe('nl');
    });

    it('maps the domain to a language', () => {
        expect(detectFromHostname('www.vinted.fr')).toBe('fr');
        expect(detectFromHostname('www.vinted.com')).toBe('en');
        expect(detectFromHostname('www.vinted.co.uk')).toBe('en');
        expect(detectFromHostname('localhost')).toBeNull();
    });

    it('reads the browser language', () => {
        expect(detectFromNavigator({ language: 'es-ES' })).toBe('es');
    });

    it('prefers the selector over html lang and domain', () => {
        document.body.innerHTML = selectorHtml;
        document.documentElement.setAttribute('lang', 'es');
        expect(detectVintedLanguage(document, 'www.vinted.nl')).toBe('fr');
    });

    it('falls back to html lang, then the domain', () => {
        document.documentElement.setAttribute('lang', 'es');
        expect(detectVintedLanguage(document, 'www.vinted.nl')).toBe('es');
        document.documentElement.removeAttribute('lang');
        expect(detectVintedLanguage(document, 'www.vinted.nl')).toBe('nl');
    });
});
