# Mashinted — build helpers. The client version is the `dist/` folder.
# Override the npm binary if needed, e.g. `make build NPM="flatpak-spawn --host npm"`.
NPM ?= npm
CHROME ?= flatpak run com.google.Chrome
# Chrome profile folder name (see chrome://version -> Profile Path), e.g. "Default" or "Profile 1"
PROFILE ?= Default
URL ?= https://www.vinted.fr/catalog

.DEFAULT_GOAL := build
.PHONY: help install build rebuild lint test watch dev clean zip run

help: ## Show available targets
	@grep -E '^[a-z]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-9s %s\n", $$1, $$2}'

node_modules: package.json package-lock.json
	$(NPM) install
	@touch node_modules

install: node_modules ## Install dependencies

build: node_modules ## Production build into dist/ (default)
	$(NPM) run build

rebuild: clean build ## Clean then build

lint: node_modules ## Run ESLint on src/
	$(NPM) run lint

test: node_modules ## Run unit tests (Vitest)
	$(NPM) test

watch: node_modules ## Rebuild dist/ on file changes
	$(NPM) run watch

dev: node_modules ## Vite dev server (dist/ then needs the server running)
	$(NPM) run dev

clean: ## Remove dist/
	rm -rf dist

zip: build ## Package dist/ into mashinted.zip
	cd dist && zip -qr ../mashinted.zip .
	@echo "Created mashinted.zip"

run: build ## Build, then open Chrome (your real profile) on Vinted
	$(CHROME) --profile-directory="$(PROFILE)" $(URL) >/dev/null 2>&1 &
	@echo "Chrome opened. First time only: chrome://extensions -> Developer mode -> Load unpacked -> $(CURDIR)/dist"
	@echo "After later builds, just click the reload icon on the extension card and refresh the Vinted tab."
