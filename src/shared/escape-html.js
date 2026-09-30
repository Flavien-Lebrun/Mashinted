/**
 * @file escape-html.js
 * @brief HTML escaping for any scraped text that ends up in `innerHTML`.
 */

/**
 * @brief Escapes HTML characters for safety in DOM templates.
 * @param {string} str - String to escape.
 * @returns {string} Sanitized web-safe string.
 */
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
