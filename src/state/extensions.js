import {
  getExtensions,
  isManagementAvailable,
  setExtensionEnabled,
  subscribeToManagementChanges
} from '../browser/management.js';
import { loadFavorites, saveFavorites } from '../storage/preferences.js';

const compareByName = (left, right) =>
  left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });

export class ExtensionsState {
  constructor() {
    this.extensions = [];
    this.favorites = new Set();
    this.activeTab = 'favorites';
    this.query = '';
    this.pending = new Set();
    this.error = '';
    this.available = isManagementAvailable();
    this.listeners = new Set();
    this.unsubscribe = null;
    this.errorTimer = null;
  }

  async initialize() {
    try {
      this.favorites = await loadFavorites();
      if (this.available) await this.refresh();
    } catch (error) {
      this.error = error.message;
      this.emit();
    }
    this.unsubscribe = subscribeToManagementChanges(() => void this.refresh());
    this.emit();
  }

  destroy() {
    this.unsubscribe?.();
    clearTimeout(this.errorTimer);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    this.listeners.forEach((listener) => listener(this.snapshot()));
  }

  snapshot() {
    return {
      activeTab: this.activeTab,
      query: this.query,
      error: this.error,
      available: this.available,
      total: this.extensions.length,
      enabled: this.extensions.filter((extension) => extension.enabled).length,
      favoriteCount: this.extensions.filter((extension) => this.favorites.has(extension.id)).length,
      entries: this.visibleEntries()
    };
  }

  async refresh() {
    if (!this.available) return;
    try {
      const all = await getExtensions();
      const ownId = chrome.runtime.id;
      this.extensions = all.filter((extension) =>
        extension.id !== ownId && extension.type === 'extension'
      );
      this.error = '';
    } catch (error) {
      this.error = error.message;
    }
    this.emit();
  }

  setTab(tab) {
    this.activeTab = tab === 'all' ? 'all' : 'favorites';
    this.emit();
  }

  setQuery(query) {
    this.query = query;
    this.emit();
  }

  resetForOpening() {
    this.activeTab = 'favorites';
    this.query = '';
    this.emit();
  }

  setTemporaryError(message) {
    this.error = message;
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => {
      this.error = '';
      this.emit();
    }, 5000);
  }

  visibleEntries() {
    const needle = this.query.trim().toLocaleLowerCase();
    return this.extensions
      .filter((extension) => this.activeTab === 'all' || this.favorites.has(extension.id))
      .filter((extension) => !needle || extension.name.toLocaleLowerCase().includes(needle))
      .sort((left, right) => {
        const favoriteDifference = Number(this.favorites.has(right.id)) - Number(this.favorites.has(left.id));
        return favoriteDifference || compareByName(left, right);
      })
      .map((extension) => ({
        ...extension,
        favorite: this.favorites.has(extension.id),
        pending: this.pending.has(extension.id)
      }));
  }

  async toggleFavorite(id) {
    const previous = new Set(this.favorites);
    const next = new Set(this.favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);

    this.favorites = next;
    this.error = '';
    this.emit();
    try {
      await saveFavorites(next);
    } catch (error) {
      this.favorites = previous;
      this.setTemporaryError(`Could not save favorites: ${error.message}`);
      this.emit();
    }
  }

  async toggleEnabled(id) {
    const extension = this.extensions.find((item) => item.id === id);
    if (!extension || !extension.mayDisable || this.pending.has(id)) return;

    this.pending.add(id);
    this.error = '';
    this.emit();
    try {
      await setExtensionEnabled(id, !extension.enabled);
    } catch (error) {
      this.setTemporaryError(`Could not change ${extension.name}: ${error.message}`);
    } finally {
      this.pending.delete(id);
      await this.refresh();
      this.emit();
    }
  }
}
