import '../styles/sidebar.scss';
import { ExtensionsState } from '../state/extensions.js';
import { mountSidebar } from '../ui/sidebar.js';

const state = new ExtensionsState();
mountSidebar(state, document);
void state.initialize();

window.addEventListener('pagehide', () => state.destroy(), { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') state.resetForOpening();
});
