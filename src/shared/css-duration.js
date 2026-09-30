/**
 * @brief Reads a CSS time custom property (e.g. `300ms`, `0.3s`) from :root, in milliseconds.
 * The durations live in `styles/tokens.css`; this keeps JS timers in sync with them.
 */
export function getCssDurationMs(propertyName, fallbackMs) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim();
    const value = parseFloat(raw);

    if (Number.isNaN(value)) {
        return fallbackMs;
    }
    return raw.endsWith('ms') ? value : value * 1000;
}
