import { ensureBrandBlacklistStorageReady } from '../shared/storage.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('background');

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason !== chrome.runtime.OnInstalledReason.INSTALL) {
        return;
    }
    log.info('Mashinted installed for the first time! Setting up defaults...');
    ensureBrandBlacklistStorageReady().then((defaults) => {
        log.info('Default banned brands successfully initialized:', defaults);
    });
});
