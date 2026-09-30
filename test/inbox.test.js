import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    findRowById,
    getConversationId,
    getRows,
    getUnreadIds,
    isUnread,
} from '../src/features/inbox/conversations.js';

beforeEach(() => {
    document.body.innerHTML = readFileSync(resolve(__dirname, 'fixtures/inbox-list.html'), 'utf8');
});

describe('inbox conversation list', () => {
    it('only picks the clickable rows, not their wrappers or children', () => {
        expect(getRows().map(getConversationId)).toEqual(['aaaa0001', 'aaaa0002', 'aaaa0003', 'aaaa0004']);
    });

    it('detects unread rows in list order', () => {
        expect(getUnreadIds()).toEqual(['aaaa0002', 'aaaa0004']);
        expect(isUnread(findRowById('aaaa0003'))).toBe(false);
    });

    it('finds a row by id and returns null when it is gone', () => {
        expect(findRowById('aaaa0002')).not.toBeNull();
        expect(findRowById('missing')).toBeNull();
    });
});
