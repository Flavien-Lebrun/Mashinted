import { describe, expect, it } from 'vitest';
import { createRouter } from '../src/content/router.js';

function setup(initialPath) {
    const calls = [];
    let pathname = initialPath;

    const makeRoute = (name, match) => ({
        name,
        match,
        start() {
            calls.push(`start:${name}`);
            return () => calls.push(`stop:${name}`);
        },
    });

    const router = createRouter(
        [
            makeRoute('favourites', (path) => path.includes('/member/items/favourite_list')),
            makeRoute('inbox', (path) => path.startsWith('/inbox')),
            makeRoute('default', () => true),
        ],
        () => pathname,
    );

    return { router, calls, go: (path) => (pathname = path) };
}

describe('router', () => {
    it('starts the matching route once, however often it is synced', () => {
        const { router, calls } = setup('/');
        expect(router.sync()).toBe('default');
        router.sync();
        router.sync();
        expect(calls).toEqual(['start:default']);
    });

    it('stops the previous route before starting the next one on navigation', () => {
        const { router, calls, go } = setup('/');
        router.sync();

        go('/member/items/favourite_list');
        expect(router.sync()).toBe('favourites');

        go('/inbox/123');
        expect(router.sync()).toBe('inbox');

        go('/items/42-thing');
        expect(router.sync()).toBe('default');

        expect(calls).toEqual([
            'start:default',
            'stop:default',
            'start:favourites',
            'stop:favourites',
            'start:inbox',
            'stop:inbox',
            'start:default',
        ]);
    });

    it('keeps the running features when navigating inside the same route', () => {
        const { router, calls, go } = setup('/');
        router.sync();
        go('/items/42-thing');
        router.sync();
        go('/catalog?search_text=jacket');
        router.sync();
        expect(calls).toEqual(['start:default']);
    });

    it('still starts the next route when stopping the previous one throws', () => {
        let pathname = '/';
        const started = [];
        const router = createRouter(
            [
                {
                    name: 'a',
                    match: (path) => path === '/',
                    start: () => () => {
                        throw new Error('boom');
                    },
                },
                {
                    name: 'b',
                    match: () => true,
                    start: () => {
                        started.push('b');
                    },
                },
            ],
            () => pathname,
        );
        router.sync();
        pathname = '/other';
        expect(router.sync()).toBe('b');
        expect(started).toEqual(['b']);
    });
});
