# Mashinted

> **A third-party enhancement layer for a cleaner, personalized Vinted experience.**

Mashinted is a web browser extension that runs on top of the official Vinted website to make shopping clearer and faster, most notably by hiding listings from brands you never want to see through a **blacklist filtering module**.

---

## 🚀 Key Features

* **Blacklist Filtering:** Hide listings by brand, either automatically or with a one-click trash button on each card. A counter chip shows how many were hidden and opens a modal to manage the list.
* **Saved Search Aggregator:** Gather the new items of all your bookmarked saved searches into one feed, grouped by search.
* **Favourites Grouping:** Split your favourites into *Sold* and *Available*, with a "delete all sold" action.
* **Inbox Helper:** Open all unread conversations in one click.
* **Multilingual UI:** Follows the language Vinted is displayed in (en, fr, es, nl).

## 📖 Project Evolution & History

If you want to follow the step-by-step progression of this extension, every minor milestone, roadblock, and breakthrough is documented in detail.

👉 **Check out the full development journal in [DOCUMENTATION.md](./DOCUMENTATION.md) (section 7).**

---

## 🛠️ Tech Stack & Architecture

* **Context:** Chrome/Web Extension (Manifest V3)
* **Core Mechanics:** Content scripts observing the rendered DOM (`MutationObserver`), `chrome.storage.local` persistence, and a small `MAIN`-world probe (`public/checker.js`) that only waits for React hydration.
* **Architecture & behaviour map:** see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🚀 Getting Started

Follow these steps to set up the project locally and start developing.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (recommended version: 18+ or 20+).

### 1. Install Dependencies
Rebuild the `node_modules` folder by running:
```bash
npm install
```

### 2. Run the Development Server

Start the local development build:

```bash
npm run dev
```

*Note: the dev build writes HMR stubs into `dist/` that only work while the dev server is running. For a standalone build (other machines, Firefox, sharing), run `npm run build` instead.*

### 3. Load the Extension in Your Browser

Because this is a web extension, you need to load it into your browser manually:

#### For Google Chrome / Brave / Edge:

1. Open your browser and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `dist` folder located in the root of this project directory.

#### For Mozilla Firefox:

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file inside the `dist` folder.
