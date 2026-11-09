# Extension Switcher

Local-first Manifest V3 extension for quickly enabling, disabling, and favouriting installed extensions in a compact sidebar. It has no backend, telemetry, network requests, or mock data.

The extension ships with a black-and-white schematic management icon in 16, 32, 48, and 128 px PNG variants, plus its editable SVG source.

## Build and install in Vivaldi

1. Install dependencies with `npm install` and create the loadable assets with `npm run build`.
2. Open `vivaldi://extensions`, enable **Developer mode**, select **Load unpacked**, then select this project folder (the folder containing `manifest.json`).
3. Click the Extension Switcher toolbar icon. On Vivaldi builds implementing Chromium's Side Panel API, this opens the native extension side panel.

The native panel needs the `sidePanel` API (Chromium 114+). Vivaldi documents that integrated extension panels can use `chrome.sidePanel`; its Web Panels are also persistent narrow panels. If a Vivaldi build exposes no usable Side Panel API, the toolbar icon opens the same local extension page in a tab. Add that tab to Vivaldi's Web Panel from the page context menu or the panel's **+** button to keep it in the Vivaldi sidebar. The page URL is `chrome-extension://<extension-id>/dist/src/sidebar/index.html`; find `<extension-id>` at `vivaldi://extensions`.

## Use

- **Favorites** is selected whenever the panel or fallback page opens. Click a star in **All** to persist a favorite in `chrome.storage.local`.
- Search filters the active tab only and starts empty on every open.
- Toggle switches call `chrome.management.setEnabled()` and are disabled for browser-protected or policy-managed extensions. The Switcher excludes its own ID, so it cannot disable itself.
- Management events refresh the list after installs, removals, and external enabled-state changes; there is no polling.

## Browser/API boundaries

The extension requires only `management`, `storage`, and `sidePanel`. Chromium decides which extensions may be disabled; `mayDisable: false`, enterprise policy, component extensions, and browser-specific protected items cannot be overridden. The Management API controls extensions, not arbitrary browser features, and the extension cannot force a browser that lacks `chrome.sidePanel` to provide a native panel.

For Vivaldi’s current guidance, see [Web Panels for developers](https://help.vivaldi.com/developers/web/vivaldi-web-panels-for-web-developers/) and [Using Extensions in Vivaldi](https://help.vivaldi.com/desktop/appearance-customization/extensions/).
