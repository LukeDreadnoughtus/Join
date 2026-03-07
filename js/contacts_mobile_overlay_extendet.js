
function createOverlayFab() {
  const fab = document.createElement('div');
  fab.className = 'contacts_overlay_fab';
  fab.setAttribute('role', 'button');
  fab.setAttribute('tabindex', '0');
  fab.setAttribute('aria-label', 'More actions');
  fab.innerHTML = '<img src="assets/img/3points.svg" alt="">';
  fab.addEventListener('click', handleOverlayFabClick);
  fab.addEventListener('keydown', handleButtonKeys);
  return fab;
}

function handleOverlayFabClick(e) {
  e.stopPropagation();
  toggleFabMenu();
}

function toggleFabMenu() {
  const api = window.ContactsMobileMQ;
  const isOpen = document.body.classList.contains(api.BODY_MENU_CLASS);
  if (isOpen) api.closeFabMenu();
  else api.openFabMenu();
}

function removeOverlayFab() {
  const fab = document.querySelector('.contacts_overlay_fab');
  if (fab) fab.remove();
}

function ensureFabMenu(api) {
  if (document.querySelector('.contacts_fab_menu')) return;
  document.body.appendChild(createFabMenu(api));
}

function createFabMenu(api) {
  const menu = document.createElement('div');
  menu.className = 'contacts_fab_menu';
  menu.setAttribute('aria-hidden', 'true');
  menu.innerHTML = getFabMenuMarkup();
  bindFabMenuActions(menu, api);
  menu.addEventListener('click', stopEventPropagation);
  return menu;
}

function getFabMenuMarkup() {
  return [
    '<div class="detail_edit"><img src="assets/img/edit.svg" class="detail_action_icon">Edit</div>',
    '<div class="detail_delete"><img src="assets/img/delete.svg" class="detail_action_icon">delete</div>'
  ].join('');
}

function bindFabMenuActions(menu, api) {
  bindFabEdit(menu, api);
  bindFabDelete(menu, api);
}

function bindFabEdit(menu, api) {
  const edit = menu.querySelector('.detail_edit');
  if (edit) edit.addEventListener('click', (e) => handleFabEdit(e, api));
}

function bindFabDelete(menu, api) {
  const del = menu.querySelector('.detail_delete');
  if (del) del.addEventListener('click', (e) => handleFabDelete(e, api));
}

function handleFabEdit(e, api) {
  e.stopPropagation();
  api.closeFabMenu();

  const hiddenEdit = document.querySelector('.contact_detail_root .detail_actions .detail_edit');
  if (hiddenEdit) {
    hiddenEdit.click();
    return;
  }

  const idx = window.__contacts_selected_idx;
  if (typeof window.openEdit === 'function' && typeof idx === 'number') {
    window.openEdit(idx);
  }
}

function handleFabDelete(e, api) {
  e.stopPropagation();
  api.closeFabMenu();

  const hiddenDelete = document.querySelector('.contact_detail_root .detail_actions .detail_delete');
  if (hiddenDelete) hiddenDelete.click();
}

function removeFabMenu(api) {
  const menu = document.querySelector('.contacts_fab_menu');
  if (menu) menu.remove();
  api.closeFabMenu();
}

function syncForBreakpointBase(api) {
  if (!api.isMobile()) {
    syncDesktopBase(api);
    return;
  }

  api.ensureSidebarAddFab();

  if (detailRootHasContent()) return;

  document.body.classList.remove(api.BODY_OPEN_CLASS);
  api.closeFabMenu();
  api.removeBackButton();
  api.removeOverlayFab();
  api.removeFabMenu();
  api.ensureSidebarAddFab();
}

function detailRootHasContent() {
  const root = document.querySelector('.contact_detail_root');
  return !!(root && root.children && root.children.length);
}

function syncDesktopBase(api) {
  document.body.classList.remove(api.BODY_OPEN_CLASS);
  api.closeFabMenu();
  api.removeBackButton();
  api.removeOverlayFab();
  api.removeFabMenu();
  api.removeSidebarAddFab();
  repositionDetailRootIfAvailable();
}

function repositionDetailRootIfAvailable() {
  if (typeof window.positionDetailRoot === 'function') {
    window.positionDetailRoot();
  }
}

function patchBaseFunctions(api) {
  patchSelectUserAt(api);
  patchClearSelection(api);
  patchPositionDetailRoot(api);
}

function patchSelectUserAt(api) {
  const orig = window.selectUserAt;
  if (!isPatchableFunction(orig)) return;
  if (orig.__contactsMobilePatched) return;

  const patched = function (...args) {
    storeSelectedContactIndex(args);
    const result = orig.apply(this, args);
    api.openOverlay();
    return result;
  };

  markAsPatched(patched);
  window.selectUserAt = patched;
}

function patchClearSelection(api) {
  const orig = window.clearSelection;
  if (!isPatchableFunction(orig)) return;
  if (orig.__contactsMobilePatched) return;

  const patched = function (...args) {
    const result = orig.apply(this, args);
    if (api.isMobile()) api.syncForBreakpointBase();
    return result;
  };

  markAsPatched(patched);
  window.clearSelection = patched;
}

function patchPositionDetailRoot(api) {
  const orig = window.positionDetailRoot;
  if (!isPatchableFunction(orig)) return;
  if (orig.__contactsMobilePatched) return;

  const patched = function (...args) {
    if (api.isMobile()) return;
    return orig.apply(this, args);
  };

  markAsPatched(patched);
  window.positionDetailRoot = patched;
}

function isPatchableFunction(fn) {
  return typeof fn === 'function';
}

function markAsPatched(fn) {
  fn.__contactsMobilePatched = true;
}

function storeSelectedContactIndex(args) {
  if (typeof args[0] === 'number') {
    window.__contacts_selected_idx = args[0];
  }
}

function bindGlobalOverlayEvents(api) {
  if (api.initDone) return;

  document.addEventListener('keydown', (e) => handleEscape(e, api));
  document.addEventListener('click', () => handleOutsideFabClick(api));
  window.addEventListener('resize', () => handleViewportChange(api));
  window.addEventListener('orientationchange', () => handleViewportChange(api));

  bindMediaQueryChange(api);

  api.initDone = true;
}

function bindMediaQueryChange(api) {
  if (api.mq.addEventListener) {
    api.mq.addEventListener('change', () => syncForBreakpointBase(api));
    return;
  }

  api.mq.addListener(() => syncForBreakpointBase(api));
}

function handleEscape(e, api) {
  const isEscape = e.key === 'Escape';
  const isOpen = document.body.classList.contains(api.BODY_OPEN_CLASS);
  if (isEscape && isOpen) api.closeOverlay();
}

function handleOutsideFabClick(api) {
  const isMenuOpen = document.body.classList.contains(api.BODY_MENU_CLASS);
  if (isMenuOpen) api.closeFabMenu();
}

function handleViewportChange(api) {
  api.setVhVar();
  if (api.isMobile()) {
    api.resetDetailInlinePositionForMobile();
  }
}

function stopEventPropagation(e) {
  e.stopPropagation();
}