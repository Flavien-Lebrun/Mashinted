import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCatalogItems } from '../src/features/aggregator/api.js';

const html = readFileSync(resolve(__dirname, 'fixtures/catalog.html'), 'utf8');

describe('parseCatalogItems', () => {
    it('extracts the card fields from catalog HTML', () => {
        const [first] = parseCatalogItems(html);
        expect(first).toMatchObject({
            id: '111',
            brandName: 'Nike',
            subtitle: 'Jacket, M',
            price: '10,00 €',
            totalPrice: '11,20 €',
            imageUrl: 'https://img.test/111.jpg',
        });
        expect(first.itemUrl).toMatch(/\/items\/111-nike-jacket$/);
    });

    it('falls back on the total price when the base price is missing', () => {
        const second = parseCatalogItems(html)[1];
        expect(second.id).toBe('222');
        expect(second.price).toBe('5,00 €');
    });

    it('honours the max limit', () => {
        expect(parseCatalogItems(html, 1)).toHaveLength(1);
    });
});
