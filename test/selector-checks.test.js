import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHECKS, PAGES, isHealthy, runChecks } from '../src/dev/selector-checks.js';

const load = (name) => {
    document.body.innerHTML = readFileSync(resolve(__dirname, 'fixtures', name), 'utf8');
    return document;
};

describe('selector checks', () => {
    it('only targets known pages and has unique ids', () => {
        expect(CHECKS.every((check) => PAGES.includes(check.page))).toBe(true);
        expect(new Set(CHECKS.map((check) => check.id)).size).toBe(CHECKS.length);
    });

    it('every selector is valid CSS', () => {
        const results = PAGES.filter((page) => page !== 'any').flatMap((page) => runChecks(document, page));
        expect(results.filter((result) => result.status === 'invalid')).toEqual([]);
    });

    it('reports missing elements on an empty page', () => {
        document.body.innerHTML = '';
        const results = runChecks(document, 'inbox');
        expect(results.find((r) => r.id === 'inbox-row').status).toBe('missing');
        expect(results.find((r) => r.id === 'inbox-unread-row').status).toBe('warn');
        expect(isHealthy(results)).toBe(false);
    });

    it('finds the inbox rows in the inbox fixture', () => {
        const results = runChecks(load('inbox-list.html'), 'inbox');
        expect(results.find((r) => r.id === 'inbox-row').status).toBe('ok');
    });

    it('never leaks page text into results', () => {
        const results = runChecks(load('inbox-list.html'), 'inbox');
        expect(Object.keys(results[0]).sort()).toEqual(['count', 'hint', 'id', 'page', 'status']);
    });

    it('does not let the `main` fallback satisfy feed-container', () => {
        document.body.innerHTML = '<main><p>no grid here</p></main>';
        const results = runChecks(document, 'feed');
        expect(results.find((r) => r.id === 'feed-container').status).toBe('missing');
    });

    it('csrf-token passes only when a script carries the token', () => {
        document.body.innerHTML = '<script>self.x = "\\"CSRF_TOKEN\\":\\"fake\\""</script>';
        expect(runChecks(document, 'feed').find((r) => r.id === 'csrf-token').status).toBe('ok');
        document.body.innerHTML = '<script>var a = 1;</script>';
        expect(runChecks(document, 'feed').find((r) => r.id === 'csrf-token').status).toBe('missing');
    });
});

describe('findFavouritesGrid', () => {
    it('prefers the class selector, then falls back to the first card\'s parent', async () => {
        const { findFavouritesGrid } = await import('../src/features/favourites/favourite-filter.js');

        document.body.innerHTML = '<div id="a" class="x__feed-grid"><div data-testid="grid-item"></div></div>';
        expect(findFavouritesGrid().id).toBe('a');

        document.body.innerHTML = '<section><div id="b" class="whatever"><div data-testid="grid-item"></div></div></section>';
        expect(findFavouritesGrid().id).toBe('b');

        document.body.innerHTML = '<div>no cards</div>';
        expect(findFavouritesGrid()).toBeNull();
    });

    it('does not mistake our own regrouped cards for the grid', async () => {
        const { findFavouritesGrid } = await import('../src/features/favourites/favourite-filter.js');

        document.body.innerHTML =
            '<div id="grid" class="plain"><div data-testid="grid-item" class="mashinted__feed-grid__item"></div></div>';
        expect(findFavouritesGrid().id).toBe('grid');
    });
});
