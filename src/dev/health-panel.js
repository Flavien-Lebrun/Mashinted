/**
 * @file health-panel.js
 * @brief Dev-only floating panel: step-by-step selector checks across pages, with a copyable report.
 * @details Results survive page loads in chrome.storage.local (key below) so one report can cover
 *          home, favourites and inbox. Only bundled with `npm run build:check`.
 */

import { PAGES } from './selector-checks.js';
import { STEP_TEXT, buildReport, mergeResults, summarizePages } from './health-report.js';

const PANEL_ID = 'mashinted-health-panel';
const STORAGE_KEY = 'mashinted_health_report';
// A click on the panel closes Vinted's dropdowns, so state-dependent checks run after a delay.
const DELAYED_RERUN_MS = 5000;
const MARKS ={ ok: '✓', problem: '✗', pending: '○' };

const STYLE = `
#${PANEL_ID} { position: fixed; left: 12px; bottom: 12px; z-index: 2147483647; width: 300px; font: 12px/1.4 system-ui, sans-serif;
  background: #fff; color: #222; border: 1px solid #bbb; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
#${PANEL_ID} button { font: inherit; cursor: pointer; }
#${PANEL_ID} .mh-head { width: 100%; text-align: left; padding: 8px 10px; background: #f3f3f3; border: 0; border-radius: 8px; font-weight: 600; }
#${PANEL_ID} .mh-body { padding: 8px 10px; }
#${PANEL_ID} ul { margin: 0 0 8px; padding: 0; list-style: none; }
#${PANEL_ID} li { margin: 4px 0; }
#${PANEL_ID} .mh-ok { color: #0a7a3d; } #${PANEL_ID} .mh-problem { color: #b3261e; } #${PANEL_ID} .mh-pending { color: #777; }
#${PANEL_ID} .mh-text { display: block; color: #555; margin-left: 16px; }
#${PANEL_ID} .mh-actions { display: flex; flex-wrap: wrap; gap: 6px; }
#${PANEL_ID} .mh-actions button { flex: 1 1 45%; padding: 4px 6px; border: 1px solid #999; border-radius: 4px; background: #fff; }
`;

function el(tag, props = {}, children = []) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
}

const readStored = () => new Promise((resolve) => chrome.storage.local.get([STORAGE_KEY], (r) => resolve(r[STORAGE_KEY] || {})));
const writeStored = (value) => new Promise((resolve) => chrome.storage.local.set({ [STORAGE_KEY]: value }, resolve));

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const area = el('textarea', { value: text });
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand('copy');
        area.remove();
        return copied;
    }
}

/**
 * @param {Object} options
 * @param {() => Array} options.run Runs the checks on the current page and returns the results.
 * @param {() => string} options.getPage Page key of the current URL.
 * @param {number} options.autoRunDelayMs Delay before the first automatic run.
 */
export async function mountHealthPanel({ run, getPage, autoRunDelayMs }) {
    if (document.getElementById(PANEL_ID)) return;

    document.head.appendChild(el('style', { textContent: STYLE }));
    const panel = el('div', { id: PANEL_ID });
    document.body.appendChild(panel);

    let stored = await readStored();
    let collapsed = false;
    let notice = '';

    const rerun = async () => {
        stored = mergeResults(stored, run(), new Date().toISOString());
        await writeStored(stored);
        notice = '';
        render();
    };

    function render() {
        const summary = summarizePages(stored);
        const steps = PAGES.map((page) => {
            const items = [el('span', { className: `mh-${summary[page]}`, textContent: `${MARKS[summary[page]]} ${page}` })];
            if (summary[page] !== 'ok') items.push(el('span', { className: 'mh-text', textContent: STEP_TEXT[page] }));
            return el('li', {}, items);
        });

        const buttons = el('div', { className: 'mh-actions' }, [
            el('button', { type: 'button', textContent: 'Re-run', onclick: rerun }),
            el('button', {
                type: 'button',
                textContent: 'Re-run in 5s',
                onclick: () => {
                    notice = 'Open the dropdown now and keep it open…';
                    render();
                    window.setTimeout(rerun, DELAYED_RERUN_MS);
                },
            }),
            el('button', {
                type: 'button',
                textContent: 'Copy report',
                onclick: async () => {
                    const report = buildReport(stored, {
                        version: chrome.runtime.getManifest().version,
                        page: getPage(),
                        at: new Date().toISOString(),
                    });
                    notice = (await copyText(report)) ? 'Report copied.' : 'Copy failed.';
                    render();
                },
            }),
            el('button', {
                type: 'button',
                textContent: 'Reset',
                onclick: async () => {
                    stored = {};
                    await writeStored(stored);
                    render();
                },
            }),
        ]);

        const head = el('button', {
            type: 'button',
            className: 'mh-head',
            textContent: `Mashinted checks ${collapsed ? '▸' : '▾'}  (page: ${getPage()})`,
            onclick: () => {
                collapsed = !collapsed;
                render();
            },
        });

        const body = collapsed ? [] : [el('div', { className: 'mh-body' }, [el('ul', {}, steps), buttons, el('div', { textContent: notice })])];
        panel.replaceChildren(head, ...body);
    }

    render();
    window.setTimeout(rerun, autoRunDelayMs);
}
