import { ensureBrandBlacklistStorageReady } from '../content/storage.js';

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason !== chrome.runtime.OnInstalledReason.INSTALL) {
        return;
    }
    console.log('🚀 Mashinted installed for the first time! Setting up defaults...');
    ensureBrandBlacklistStorageReady().then((defaults) => {
        console.log('💾 Default banned brands successfully initialized:', defaults);
    });
});

// Single unified message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'FETCH_EXTERNAL_PAGE') {
        (async () => {
            try {
                const response = await fetch(message.url, {
                    headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml' }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const html = await response.text();
                sendResponse({ success: true, html });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
        })();
        return true; 
    }
});