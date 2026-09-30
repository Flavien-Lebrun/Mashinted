import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/shared/escape-html.js';

describe('escapeHtml', () => {
    it('escapes markup and quotes', () => {
        expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe(
            '&lt;img src=x onerror=&quot;a(&#039;b&#039;)&quot;&gt;&amp;',
        );
    });

    it('returns an empty string for falsy input', () => {
        expect(escapeHtml(undefined)).toBe('');
        expect(escapeHtml('')).toBe('');
    });
});
