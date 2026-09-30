#!/bin/sh
# Full rebuild of dist/ on every change in src/ and public/.
# `vite build --watch` breaks with @crxjs/vite-plugin on incremental rebuilds
# ("Content script fileName is undefined"), so each change runs a clean `vite build`.
# Needs inotifywait (inotify-tools). Override the npm binary with NPM="flatpak-spawn --host npm".
NPM=${NPM:-npm}

command -v inotifywait >/dev/null 2>&1 || {
    echo "inotifywait not found (install inotify-tools)." >&2
    exit 1
}

$NPM run build
while inotifywait -qq -r -e close_write,create,delete,moved_to,moved_from src public; do
    # Let editors finish a save burst before rebuilding.
    sleep 0.3
    $NPM run build
done
