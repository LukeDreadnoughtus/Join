(function () {
  const api = getMobileOverlayApi();

  assignOverlayApi(api);
  assignOverlayMethods(api);
  initOverlayModule(api);
})();

function getMobileOverlayApi() {
  if (window.ContactsMobileMQ) return window.ContactsMobileMQ;
  return createMobileOverlayApi();
}

function createMobileOverlayApi() {
  const mq = window.matchMedia('(max-width: 1024px)');
  return {
    mq,
    BODY_OPEN_CLASS: 'contacts-overlay-open',
    BODY_MENU_CLASS: 'contacts-fab-menu-open',
    SIDEBAR_ADD_FAB_CLASS: 'contacts_sidebar_add_fab',
    initDone: false,
    dialogInitDone: false,
    observer: null,
    isMobile() {
      return mq.matches;
    }
  };
}

function assignOverlayApi(api) {
  window.ContactsMobileMQ = api;
}

function assignOverlayMethods(api) {
  api.setVhVar = () => setVhVar();
  api.resetDetailInlinePositionForMobile = () => resetDetailInlinePositionForMobile(api);
  api.openOverlay = () => openOverlay(api);
  api.closeOverlay = () => closeOverlay(api);
  api.ensureSidebarAddFab = () => ensureSidebarAddFab(api);
  api.removeSidebarAddFab = () => removeSidebarAddFab(api);
  api.openFabMenu = () => openFabMenu(api);
  api.closeFabMenu = () => closeFabMenu(api);
  api.ensureBackButton = () => ensureBackButton(api);
  api.removeBackButton = () => removeBackButton();
  api.ensureOverlayFab = () => ensureOverlayFab(api);
  api.removeOverlayFab = () => removeOverlayFab();
  api.ensureFabMenu = () => ensureFabMenu(api);
  api.removeFabMenu = () => removeFabMenu(api);
  api.syncForBreakpointBase = () => syncForBreakpointBase(api);
  api.patchBaseFunctions = () => patchBaseFunctions(api);
}

function initOverlayModule(api) {
  api.setVhVar();
  api.patchBaseFunctions();
  bindGlobalOverlayEvents(api);
  syncForBreakpointBase(api);
}

function setVhVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function resetDetailInlinePositionForMobile(api) {
  if (!api.isMobile()) return;
  resetInlineStyles('.contact_detail_header');
  resetInlineStyles('.contact_detail_root');
}

function resetInlineStyles(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.left = '';
  el.style.right = '';
  el.style.width = '';
  el.getBoundingClientRect();
}

function openOverlay(api) {
  if (!api.isMobile()) return;
  document.body.classList.add(api.BODY_OPEN_CLASS);
  api.resetDetailInlinePositionForMobile();
  api.ensureBackButton();
  api.ensureOverlayFab();
  api.ensureFabMenu();
}

function closeOverlay(api) {
  document.body.classList.remove(api.BODY_OPEN_CLASS);
  api.closeFabMenu();
  api.removeBackButton();
  api.removeOverlayFab();
  api.removeFabMenu();
  api.ensureSidebarAddFab();
  clearSelectionIfAvailable();
}

function clearSelectionIfAvailable() {
  if (typeof window.clearSelection === 'function') {
    window.clearSelection();
  }
}

function ensureSidebarAddFab(api) {
  if (!canShowSidebarFab(api)) return;

  const sidebar = getContactsSidebar();
  if (!sidebar) return;
  if (hasSidebarFab(sidebar, api)) return;

  sidebar.appendChild(createSidebarFab());
}

function canShowSidebarFab(api) {
  if (!api.isMobile()) return false;
  return !document.body.classList.contains(api.BODY_OPEN_CLASS);
}

function getContactsSidebar() {
  return document.querySelector('main.content .contacts_sidebar');
}

function hasSidebarFab(sidebar, api) {
  return !!sidebar.querySelector('.' + api.SIDEBAR_ADD_FAB_CLASS);
}

function createSidebarFab() {
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'contacts_sidebar_add_fab';
  fab.setAttribute('aria-label', 'Add new contact');
  fab.innerHTML = '<img src="assets/img/person_add.svg" alt="">';
  fab.addEventListener('click', handleSidebarFabClick);
  fab.addEventListener('keydown', handleButtonKeys);
  return fab;
}

function handleSidebarFabClick(e) {
  e.stopPropagation();
  if (typeof window.openDialog === 'function') {
    window.openDialog();
  }
}

function handleButtonKeys(e) {
  const isActionKey = e.key === 'Enter' || e.key === ' ';
  if (!isActionKey) return;
  e.preventDefault();
  e.currentTarget.click();
}

function removeSidebarAddFab(api) {
  const fab = document.querySelector('.' + api.SIDEBAR_ADD_FAB_CLASS);
  if (fab) fab.remove();
}

function openFabMenu(api) {
  if (!api.isMobile()) return;
  api.ensureFabMenu();
  showFabMenu();
  document.body.classList.add(api.BODY_MENU_CLASS);
}

function closeFabMenu(api) {
  document.body.classList.remove(api.BODY_MENU_CLASS);
  hideFabMenu();
}

function showFabMenu() {
  const menu = document.querySelector('.contacts_fab_menu');
  if (menu) menu.setAttribute('aria-hidden', 'false');
}

function hideFabMenu() {
  const menu = document.querySelector('.contacts_fab_menu');
  if (menu) menu.setAttribute('aria-hidden', 'true');
}

function ensureBackButton(api) {
  const header = document.querySelector('.contact_detail_header');
  if (!header) return;
  if (header.querySelector('.contacts_overlay_back')) return;
  header.appendChild(createBackButton(api));
}

function createBackButton(api) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'contacts_overlay_back';
  btn.setAttribute('aria-label', 'Back');
  btn.innerHTML = '<img src="assets/img/arrow-left-line.svg" alt="" class="contacts_overlay_back_icon">';
  btn.addEventListener('click', () => api.closeOverlay());
  return btn;
}

function removeBackButton() {
  const btn = document.querySelector('.contacts_overlay_back');
  if (btn) btn.remove();
}

function ensureOverlayFab() {
  if (document.querySelector('.contacts_overlay_fab')) return;
  document.body.appendChild(createOverlayFab());
}
