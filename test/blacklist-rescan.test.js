import { beforeAll, describe, expect, it } from 'vitest';

// Minimal chrome.storage stub: the blacklist cache is driven by it.
const store = {};
globalThis.chrome = {
    storage: {
        local: {
            get: (keys, callback) => callback({ ...store }),
            set: (values, callback) => {
                Object.assign(store, values);
                callback?.();
            },
        },
        onChanged: { addListener: () => {} },
    },
};

const card = (id, brand) => `
    <div data-testid="grid-item">
        <a href="/items/${id}-thing"></a>
        <p data-testid="product-item-id-${id}--description-title">${brand}</p>
    </div>`;

const isHidden = (element) => element.getAttribute('data-mashinted-hidden-by-blacklist') === 'true';

describe('blacklist rescan', () => {
    let storage;
    let observers;
    let state;

    beforeAll(async () => {
        storage = await import('../src/shared/storage.js');
        observers = await import('../src/features/blacklist/observers.js');
        state = await import('../src/features/blacklist/state.js');
        await storage.ensureBrandBlacklistStorageReady();
    });

    it('hides cards already on screen when a brand is added, once each', async () => {
        document.body.innerHTML = card(1, 'Foo') + card(2, 'Foo') + card(3, 'Bar');
        const [foo1, foo2, bar] = document.querySelectorAll('[data-testid="grid-item"]');

        let blockedCount = 0;
        state.subscribeToCountChanges((count) => (blockedCount = count));
        observers.startBlacklistRescan();

        await storage.addBrand('foo');
        expect([isHidden(foo1), isHidden(foo2), isHidden(bar)]).toEqual([true, true, false]);
        expect(blockedCount).toBe(2);

        await storage.addBrand('bar');
        expect(isHidden(bar)).toBe(true);
        expect(blockedCount).toBe(3); // the two foo cards were not counted again
    });

    it('does nothing when the list did not change', async () => {
        document.body.innerHTML = card(4, 'Baz');
        await storage.addBrand('foo'); // already blacklisted
        expect(isHidden(document.querySelector('[data-testid="grid-item"]'))).toBe(false);
    });
});

describe('empty blacklist', () => {
    it('stays empty: nothing is seeded from defaults', async () => {
        const storage = await import('../src/shared/storage.js');
        await storage.removeBrand('foo');
        await storage.removeBrand('bar');
        expect(await storage.getAllBrands()).toEqual([]);
        expect(storage.isBlacklistedBrand('zara')).toBe(false);
    });
});
