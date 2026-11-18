import { afterEach, describe, expect, it } from 'vitest';
import { createConfigModal } from '../src/features/blacklist/modal.js';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('config modal counters', () => {
    it('shows the count of a brand added while the modal is open', () => {
        const stats = new Map();
        const modal = createConfigModal({
            bannedBrands: ['foo'],
            getStats: () => stats,
            onAddBrand: () => {},
            onDeleteBrand: () => {},
        });
        expect(document.querySelector('.mashinted-brand-minimal-counter')).toBeNull();

        // A new brand is added: the page rescan counts its cards, then the list refreshes.
        stats.set('bar', 3);
        modal.updateList(['foo', 'bar']);

        const counters = [...document.querySelectorAll('.mashinted-brand-minimal-counter')].map((node) => node.textContent);
        expect(counters).toEqual(['+3']);
    });
});
