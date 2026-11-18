import { describe, expect, it } from 'vitest';
import { findCsrfTokenInScripts } from '../src/features/aggregator/modal-helpers.js';

const script = (textContent) => ({ textContent });

describe('findCsrfTokenInScripts', () => {
    it('reads the plain JSON form', () => {
        expect(findCsrfTokenInScripts([script('{"csrf_token":"abc-123"}')])).toBe('abc-123');
    });

    it('reads the escaped, upper-case form used by streamed page data', () => {
        const streamed = String.raw`self.__next_f.push([1,"{\"NEXT_JS\":\"true\",\"CSRF_TOKEN\":\"fake-token-42\",\"X\":1}"])`;
        expect(findCsrfTokenInScripts([script(streamed)])).toBe('fake-token-42');
    });

    it('skips scripts without a token and returns an empty string when none match', () => {
        expect(findCsrfTokenInScripts([script('var a = 1;'), script('')])).toBe('');
        expect(findCsrfTokenInScripts([script('var a = 1;'), script('{"csrf_token":"ok"}')])).toBe('ok');
    });
});
