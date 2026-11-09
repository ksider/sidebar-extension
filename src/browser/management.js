function runtimeError() {
  const error = chrome.runtime.lastError;
  return error ? new Error(error.message) : null;
}

function call(method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args, (value) => {
      const error = runtimeError();
      if (error) reject(error);
      else resolve(value);
    });
  });
}

export function isManagementAvailable() {
  return Boolean(chrome.management?.getAll && chrome.management?.setEnabled);
}

export async function getExtensions() {
  if (!isManagementAvailable()) {
    throw new Error('The browser does not provide the extension-management API.');
  }
  return call(chrome.management.getAll.bind(chrome.management));
}

export async function setExtensionEnabled(id, enabled) {
  if (!isManagementAvailable()) {
    throw new Error('The browser does not provide the extension-management API.');
  }
  await call(chrome.management.setEnabled.bind(chrome.management), id, enabled);
}

export function subscribeToManagementChanges(listener) {
  if (!isManagementAvailable()) return () => {};

  const events = [
    chrome.management.onInstalled,
    chrome.management.onUninstalled,
    chrome.management.onEnabled,
    chrome.management.onDisabled
  ];
  events.forEach((event) => event.addListener(listener));
  return () => events.forEach((event) => event.removeListener(listener));
}
