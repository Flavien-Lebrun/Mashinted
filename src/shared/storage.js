import { BLACKLIST_STORAGE_KEY, FAVORITES_STORAGE_KEY } from './constants.js';
import { createLogger } from './logger.js';

const log = createLogger('storage');

let cachedBannedBrands = [];
let blacklistReadyPromise = null;
let storageListenerRegistered = false;

function normalizeBrandName(brandName) {
    return brandName?.trim().toLowerCase() ?? '';
}

function normalizeBrandList(brandNames) {
    if (!Array.isArray(brandNames)) {
        return [];
    }

    return [...new Set(brandNames.map(normalizeBrandName).filter(Boolean))];
}

const brandListListeners = new Set();

/**
 * @brief Calls `callback` whenever the blacklist changes (this tab, the modal, or another tab).
 * @returns {() => void} Unsubscribe function.
 */
function subscribeToBrandListChanges(callback) {
    brandListListeners.add(callback);
    return () => brandListListeners.delete(callback);
}

function setCachedBrandList(brandNames) {
    const previous = cachedBannedBrands;
    cachedBannedBrands = normalizeBrandList(brandNames);

    const hasChanged =
        previous.length !== cachedBannedBrands.length ||
        previous.some((brandName, index) => brandName !== cachedBannedBrands[index]);

    if (hasChanged) {
        for (const listener of brandListListeners) {
            try {
                listener([...cachedBannedBrands]);
            } catch (error) {
                log.error('Brand list listener failed.', error);
            }
        }
    }

    return [...cachedBannedBrands];
}

function persistBrandList(brandNames) {
    const nextBrandList = setCachedBrandList(brandNames);

    return new Promise((resolve) => {
        chrome.storage.local.set({ [BLACKLIST_STORAGE_KEY]: nextBrandList }, () => {
            resolve([...nextBrandList]);
        });
    });
}

function registerStorageListener() {
    if (storageListenerRegistered) {
        return;
    }

    storageListenerRegistered = true;

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local' || !(BLACKLIST_STORAGE_KEY in changes)) {
            return;
        }

        setCachedBrandList(changes[BLACKLIST_STORAGE_KEY].newValue);
    });
}

function ensureBrandBlacklistStorageReady() {
    if (!blacklistReadyPromise) {
        registerStorageListener();

        blacklistReadyPromise = new Promise((resolve) => {
            chrome.storage.local.get([BLACKLIST_STORAGE_KEY], (result) => {
                // No defaults: an empty (or missing) list simply stays empty.
                resolve(setCachedBrandList(result[BLACKLIST_STORAGE_KEY]));
            });
        });
    }

    return blacklistReadyPromise;
}

async function getAllBrands() {
    await ensureBrandBlacklistStorageReady();
    return [...cachedBannedBrands];
}

async function addBrand(brandName) {
    const normalizedBrandName = normalizeBrandName(brandName);

    if (!normalizedBrandName) {
        return getAllBrands();
    }

    const brandList = await getAllBrands();

    if (brandList.includes(normalizedBrandName)) {
        return brandList;
    }

    return persistBrandList([...brandList, normalizedBrandName]);
}

async function removeBrand(brandName) {
    const normalizedBrandName = normalizeBrandName(brandName);

    if (!normalizedBrandName) {
        return getAllBrands();
    }

    const brandList = await getAllBrands();

    return persistBrandList(brandList.filter((existingBrandName) => existingBrandName !== normalizedBrandName));
}

function isBlacklistedBrand(brandName) {
    return cachedBannedBrands.includes(normalizeBrandName(brandName));
}

// ==========================================
// Favorites Storage Management
// ==========================================

function getFavorites() {
    return new Promise((resolve) => {
        chrome.storage.local.get([FAVORITES_STORAGE_KEY], (result) => {
            resolve(result[FAVORITES_STORAGE_KEY] || {});
        });
    });
}

async function saveFavorite(productId, favoriteData) {
    const favorites = await getFavorites();
    favorites[productId] = favoriteData;

    return new Promise((resolve) => {
        chrome.storage.local.set({ [FAVORITES_STORAGE_KEY]: favorites }, () => {
            resolve(favorites);
        });
    });
}

async function removeFavorite(productId) {
    const favorites = await getFavorites();
    delete favorites[productId];

    return new Promise((resolve) => {
        chrome.storage.local.set({ [FAVORITES_STORAGE_KEY]: favorites }, () => {
            resolve(favorites);
        });
    });
}

export {
    addBrand,
    ensureBrandBlacklistStorageReady,
    getAllBrands,
    isBlacklistedBrand,
    removeBrand,
    subscribeToBrandListChanges,
    getFavorites,
    saveFavorite,
    removeFavorite,
};
