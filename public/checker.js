// Runs in the page's MAIN world (React internals are invisible from the content script's isolated world).
(function checkHydration() {
  const POLL_INTERVAL_MS = 50;
  const TIMEOUT_MS = 10000;
  const startedAt = Date.now();

  const notify = (timedOut) => window.postMessage({ type: 'MASHINTED_REACT_HYDRATED', timedOut }, '*');

  (function poll() {
    const root = document.querySelector('#root') || document.body;
    const isHydrated = root && Object.keys(root).some((key) =>
      key.startsWith('__reactFiber$') || key.startsWith('__reactContainer$')
    );

    if (isHydrated) return notify(false);
    if (Date.now() - startedAt > TIMEOUT_MS) return notify(true); // Don't hang forever; let the extension start anyway.
    setTimeout(poll, POLL_INTERVAL_MS);
  })();
})();
