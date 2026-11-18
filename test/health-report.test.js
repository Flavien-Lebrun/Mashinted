import { describe, expect, it } from 'vitest';
import { buildReport, mergeResults, summarizePages } from '../src/dev/health-report.js';

const result = (id, page, status, count = 0) => ({ id, page, status, count, hint: `hint for ${id}` });

describe('health report', () => {
    it('never replaces a passing check with a later miss', () => {
        const first = mergeResults({}, [result('saved-search-link', 'saved-searches', 'ok', 21)], 't1');
        const second = mergeResults(first, [result('saved-search-link', 'saved-searches', 'missing')], 't2');
        expect(second['saved-search-link'].status).toBe('ok');
        expect(second['saved-search-link'].at).toBe('t1');
    });

    it('replaces a miss with a later pass', () => {
        const first = mergeResults({}, [result('inbox-row', 'inbox', 'missing')], 't1');
        const second = mergeResults(first, [result('inbox-row', 'inbox', 'ok', 4)], 't2');
        expect(second['inbox-row']).toMatchObject({ status: 'ok', count: 4 });
    });

    it('summarises pages as pending, ok or problem', () => {
        const stored = mergeResults({}, [result('a', 'home', 'ok'), result('b', 'feed', 'missing'), result('c', 'inbox', 'warn')], 't');
        expect(summarizePages(stored)).toMatchObject({ home: 'ok', feed: 'problem', inbox: 'ok', favourites: 'pending' });
    });

    it('builds a report with hints for failures, pending pages and no extra data', () => {
        const stored = mergeResults({}, [result('a', 'home', 'ok', 1), result('b', 'feed', 'missing')], 't');
        const report = buildReport(stored, { version: '1.0.0', page: 'home', at: '2026-11-18T00:00:00Z' });
        expect(report).toContain('[ok] a (1)');
        expect(report).toContain('[missing] b (0) -> hint for b');
        expect(report).toContain('Not checked yet:');
        expect(report).toContain('version 1.0.0');
    });
});
