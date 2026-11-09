const FAVORITES_KEY = 'extension-switcher:favorites';

function storageCall(method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args, (value) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(value);
    });
  });
}

export async function loadFavorites() {
  if (!chrome.storage?.local) return new Set();
  const stored = await storageCall(chrome.storage.local.get.bind(chrome.storage.local), FAVORITES_KEY);
  const value = stored[FAVORITES_KEY];
  return new Set(Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);
}

export async function saveFavorites(favorites) {
  if (!chrome.storage?.local) throw new Error('Local extension storage is unavailable.');
  await storageCall(chrome.storage.local.set.bind(chrome.storage.local), {
    [FAVORITES_KEY]: [...favorites]
  });
}
