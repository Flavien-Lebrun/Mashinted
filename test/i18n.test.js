import { afterEach, describe, expect, it } from 'vitest';
import { getLanguage, setLanguage, t } from '../src/shared/i18n.js';
import { LOCALES } from '../src/shared/locales.js';

afterEach(() => setLanguage('en'));

describe('i18n', () => {
    it('translates and interpolates', () => {
        setLanguage('fr');
        expect(t('sectionSold')).toBe('Vendus');
        expect(t('itemCount', { count: 2 })).toBe('2 articles');
    });

    it('falls back to English for unsupported languages', () => {
        expect(setLanguage('de')).toBe('en');
        expect(getLanguage()).toBe('en');
        expect(setLanguage(null)).toBe('en');
    });

    it('returns the key when it is unknown', () => {
        expect(t('nope')).toBe('nope');
    });

    it('has every English key in every locale', () => {
        const keys = Object.keys(LOCALES.en);
        for (const [code, locale] of Object.entries(LOCALES)) {
            expect(Object.keys(locale).sort(), code).toEqual([...keys].sort());
        }
    });
});
