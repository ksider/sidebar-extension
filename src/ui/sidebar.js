function iconUrl(extension) {
  const icons = extension.icons || [];
  const icon = [...icons].sort((a, b) => Math.abs(a.size - 24) - Math.abs(b.size - 24))[0];
  return icon?.url || '';
}

function emptyMessage(snapshot) {
  if (!snapshot.available) return 'This browser does not expose extension management.';
  if (snapshot.activeTab === 'favorites' && !snapshot.query) {
    return 'No favorites yet. Use the star in All to keep extensions here.';
  }
  return 'No matching extensions.';
}

function createRow(entry) {
  const row = document.createElement('article');
  row.className = 'extension-row';

  const icon = document.createElement('img');
  icon.className = 'extension-icon';
  icon.width = 24;
  icon.height = 24;
  icon.alt = '';
  icon.src = iconUrl(entry);
  if (!icon.src) icon.classList.add('extension-icon--fallback');
  icon.addEventListener('error', () => {
    icon.removeAttribute('src');
    icon.classList.add('extension-icon--fallback');
  }, { once: true });

  const name = document.createElement('span');
  name.className = 'extension-name';
  name.textContent = entry.name;
  name.title = entry.name;

  const favorite = document.createElement('button');
  favorite.type = 'button';
  favorite.className = `icon-button favorite${entry.favorite ? ' is-favorite' : ''}`;
  favorite.dataset.favorite = entry.id;
  favorite.setAttribute('aria-pressed', String(entry.favorite));
  favorite.setAttribute('aria-label', `${entry.favorite ? 'Remove' : 'Add'} ${entry.name} ${entry.favorite ? 'from' : 'to'} favorites`);
  favorite.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 3.02 6.13 6.76.98-4.89 4.76 1.15 6.72L12 18.22l-6.04 3.17 1.15-6.72-4.89-4.76 6.76-.98L12 2.8Z"/></svg>';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = `toggle${entry.enabled ? ' is-on' : ''}${entry.pending ? ' is-loading' : ''}`;
  toggle.dataset.toggle = entry.id;
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-checked', String(Boolean(entry.enabled)));
  toggle.setAttribute('aria-label', `${entry.enabled ? 'Disable' : 'Enable'} ${entry.name}`);
  toggle.disabled = !entry.mayDisable || entry.pending;
  if (!entry.mayDisable) toggle.title = 'This extension is protected or managed by the browser.';
  toggle.append(document.createElement('span'));

  row.append(icon, name, favorite, toggle);
  return row;
}

export function mountSidebar(state, root) {
  const search = root.querySelector('#search');
  const tabs = root.querySelector('.tabs');
  const list = root.querySelector('#list');
  const status = root.querySelector('#status');
  const clear = root.querySelector('#clear-search');
  const favoritesCount = root.querySelector('#favorites-count');
  const allCount = root.querySelector('#all-count');
  const extensionStatus = root.querySelector('#extension-status');

  function render(snapshot) {
    root.querySelectorAll('.tab').forEach((tab) => {
      const selected = tab.dataset.tab === snapshot.activeTab;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
    if (search.value !== snapshot.query) search.value = snapshot.query;
    clear.hidden = !snapshot.query;
    favoritesCount.textContent = snapshot.favoriteCount;
    allCount.textContent = snapshot.total;
    extensionStatus.textContent = `${snapshot.enabled} активных из ${snapshot.total}`;
    list.setAttribute('aria-labelledby', snapshot.activeTab === 'favorites' ? 'tab-favorites' : 'tab-all');

    status.hidden = !snapshot.error;
    status.textContent = snapshot.error;
    list.replaceChildren();
    if (!snapshot.entries.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = emptyMessage(snapshot);
      list.append(empty);
      return;
    }
    snapshot.entries.forEach((entry) => list.append(createRow(entry)));
  }

  state.subscribe(render);
  render(state.snapshot());

  search.addEventListener('input', () => state.setQuery(search.value));
  clear.addEventListener('click', () => {
    state.setQuery('');
    search.focus();
  });
  tabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab]');
    if (tab) state.setTab(tab.dataset.tab);
  });
  list.addEventListener('click', (event) => {
    const favorite = event.target.closest('[data-favorite]');
    const toggle = event.target.closest('[data-toggle]');
    if (favorite) void state.toggleFavorite(favorite.dataset.favorite);
    if (toggle) void state.toggleEnabled(toggle.dataset.toggle);
  });
}
