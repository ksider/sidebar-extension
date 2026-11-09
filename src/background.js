const SIDEBAR_PATH = 'dist/src/sidebar/index.html';

function hasSidePanel() {
  return Boolean(chrome.sidePanel?.setPanelBehavior);
}

async function configureSidePanel() {
  if (!hasSidePanel()) return;

  try {
    await chrome.sidePanel.setOptions({ path: SIDEBAR_PATH, enabled: true });
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    // Some Chromium derivatives expose a partial sidePanel API. The toolbar
    // action remains usable through the extension-page fallback below.
    console.warn('Extension Switcher: Side Panel is unavailable.', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void configureSidePanel();
});

chrome.runtime.onStartup.addListener(() => {
  void configureSidePanel();
});

chrome.action.onClicked.addListener(() => {
  if (hasSidePanel()) return;
  chrome.tabs.create({ url: chrome.runtime.getURL(SIDEBAR_PATH) });
});
