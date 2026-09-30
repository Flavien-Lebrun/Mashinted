import { describe, expect, it } from 'vitest';
import { calculateFetchDistribution } from '../src/features/aggregator/distribution.js';

describe('calculateFetchDistribution', () => {
    it('returns everything when the total is under the threshold', () => {
        const result = calculateFetchDistribution([{ count: 10 }, { count: 20 }]);
        expect(result.map((r) => r.targetToFetch)).toEqual([10, 20]);
    });

    it('caps each search once the total exceeds the threshold', () => {
        const result = calculateFetchDistribution([{ count: 90 }, { count: 20 }, { count: 5 }]);
        expect(result.map((r) => r.targetToFetch)).toEqual([30, 20, 5]);
    });

    it('ignores empty searches and invalid input', () => {
        expect(calculateFetchDistribution([{ count: 0 }])).toEqual([]);
        expect(calculateFetchDistribution(null)).toEqual([]);
    });
});
