/**
 * @file dom-observer.js
 * @brief Shared, frame-batched MutationObserver. Replaces setInterval polling.
 */

/**
 * @brief Runs `callback` once now, then once per animation frame in which the DOM
 *        changed under `root`. The callback must be idempotent (it observes its own edits).
 * @param {() => void} callback - Work to run.
 * @param {Object} [options]
 * @param {Node} [options.root] - Subtree to watch (default: document element).
 * @param {string[]} [options.attributeFilter] - Also react to changes of these attributes.
 * @returns {() => void} Stop function.
 */
export function observeDom(callback, { root = document.documentElement, attributeFilter } = {}) {
    let scheduled = false;

    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            callback();
        });
    });

    observer.observe(root, {
        childList: true,
        subtree: true,
        ...(attributeFilter ? { attributes: true, attributeFilter } : {}),
    });

    callback();
    return () => observer.disconnect();
}
