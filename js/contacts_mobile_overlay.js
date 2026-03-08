(function () {
  const api = getMobileOverlayApi();

  assignOverlayApi(api);
  assignOverlayMethods(api);
  initOverlayModule(api);
})();

/**
 * Liefert die bestehende Mobile-Overlay-API oder erstellt eine neue Instanz.
 *
 * @returns {object}
 */
function getMobileOverlayApi() {
  if (window.ContactsMobileMQ) return window.ContactsMobileMQ;
  return createMobileOverlayApi();
}

/**
 * Erstellt die Mobile-Overlay-API mit allen Grundwerten und Zuständen.
 *
 * @returns {object}
 */
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

/**
 * Speichert die API global im Window-Objekt.
 *
 * @param {object} api
 * @returns {void}
 */
function assignOverlayApi(api) {
  window.ContactsMobileMQ = api;
}

/**
 * Weist der API die öffentlichen Methoden zu.
 *
 * @param {object} api
 * @returns {void}
 */
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

/**
 * Initialisiert das Overlay-Modul.
 *
 * @param {object} api
 * @returns {void}
 */
function initOverlayModule(api) {
  scheduleOverlayModuleInit(api);
}

/**
 * Plant die Modul-Initialisierung abhängig vom Dokumentstatus.
 *
 * @param {object} api
 * @returns {void}
 */
function scheduleOverlayModuleInit(api) {
  const runInit = () => initializeOverlayModuleWhenReady(api);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit, { once: true });
    return;
  }

  window.setTimeout(runInit, 0);
}

/**
 * Initialisiert das Overlay-Modul, sobald alle Abhängigkeiten verfügbar sind.
 *
 * @param {object} api
 * @returns {void}
 */
function initializeOverlayModuleWhenReady(api) {
  if (!areOverlayDependenciesReady()) {
    window.setTimeout(() => initializeOverlayModuleWhenReady(api), 0);
    return;
  }

  api.setVhVar();
  api.patchBaseFunctions();
  bindGlobalOverlayEvents(api);
  api.syncForBreakpointBase();
}

/**
 * Prüft, ob alle erforderlichen Overlay-Abhängigkeiten vorhanden sind.
 *
 * @returns {boolean}
 */
function areOverlayDependenciesReady() {
  return typeof patchBaseFunctions === 'function'
    && typeof bindGlobalOverlayEvents === 'function'
    && typeof syncForBreakpointBase === 'function';
}

/**
 * Setzt die CSS-Variable für die Viewport-Höhe.
 *
 * @returns {void}
 */
function setVhVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

/**
 * Setzt Inline-Positionen der Detailansicht auf mobilen Geräten zurück.
 *
 * @param {object} api
 * @returns {void}
 */
function resetDetailInlinePositionForMobile(api) {
  if (!api.isMobile()) return;

  resetInlineStyles('.contact_detail_header');
  resetInlineStyles('.contact_detail_root');
}

/**
 * Entfernt positionsrelevante Inline-Styles eines Elements.
 *
 * @param {string} selector
 * @returns {void}
 */
function resetInlineStyles(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  el.style.left = '';
  el.style.right = '';
  el.style.width = '';
  el.getBoundingClientRect();
}

/**
 * Öffnet das Overlay auf mobilen Geräten.
 *
 * @param {object} api
 * @returns {void}
 */
function openOverlay(api) {
  if (!api.isMobile()) return;

  document.body.classList.add(api.BODY_OPEN_CLASS);
  api.resetDetailInlinePositionForMobile();
  api.ensureBackButton();
  api.ensureOverlayFab();
  api.ensureFabMenu();
  refreshSidebarAddFabState(api);
}

/**
 * Schließt das Overlay und setzt den UI-Zustand zurück.
 *
 * @param {object} api
 * @returns {void}
 */
function closeOverlay(api) {
  document.body.classList.remove(api.BODY_OPEN_CLASS);
  api.closeFabMenu();
  api.removeBackButton();
  api.removeOverlayFab();
  api.removeFabMenu();
  refreshSidebarAddFabState(api);
  clearSelectionIfAvailable();
}

/**
 * Löscht eine bestehende Auswahl, falls die Funktion verfügbar ist.
 *
 * @returns {void}
 */
function clearSelectionIfAvailable() {
  if (typeof window.clearSelection === 'function') {
    window.clearSelection();
  }
}

/**
 * Fügt den Sidebar-FAB hinzu, wenn er auf mobilen Geräten angezeigt werden darf.
 *
 * @param {object} api
 * @returns {void}
 */
function ensureSidebarAddFab(api) {
  if (!canShowSidebarFab(api)) return;

  const sidebar = getContactsSidebar();
  if (!sidebar) return;
  if (hasSidebarFab(sidebar, api)) return;

  sidebar.appendChild(createSidebarFab());
}

/**
 * Prüft, ob der Sidebar-FAB angezeigt werden darf.
 *
 * @param {object} api
 * @returns {boolean}
 */
function canShowSidebarFab(api) {
  if (!api.isMobile()) return false;
  return !document.body.classList.contains(api.BODY_OPEN_CLASS);
}

/**
 * Synchronisiert den Zustand des Sidebar-FABs abhängig vom aktuellen Overlay-Zustand.
 *
 * @param {object} api
 * @returns {void}
 */
function refreshSidebarAddFabState(api) {
  if (canShowSidebarFab(api)) {
    api.ensureSidebarAddFab();
    return;
  }

  api.removeSidebarAddFab();
}

/**
 * Liefert die Contacts-Sidebar.
 *
 * @returns {Element|null}
 */
function getContactsSidebar() {
  return document.querySelector('main.content .contacts_sidebar');
}

/**
 * Prüft, ob der Sidebar-FAB bereits vorhanden ist.
 *
 * @param {Element} sidebar
 * @param {object} api
 * @returns {boolean}
 */
function hasSidebarFab(sidebar, api) {
  return !!sidebar.querySelector('.' + api.SIDEBAR_ADD_FAB_CLASS);
}

/**
 * Erstellt den Sidebar-FAB.
 *
 * @returns {HTMLButtonElement}
 */
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

/**
 * Behandelt den Klick auf den Sidebar-FAB.
 *
 * @param {Event} e
 * @returns {void}
 */
function handleSidebarFabClick(e) {
  e.stopPropagation();

  if (typeof window.openDialog === 'function') {
    window.openDialog();
  }
}

/**
 * Reagiert auf Tastatureingaben für Button-Aktionen.
 *
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function handleButtonKeys(e) {
  const isActionKey = e.key === 'Enter' || e.key === ' ';
  if (!isActionKey) return;

  e.preventDefault();
  e.currentTarget.click();
}

/**
 * Entfernt den Sidebar-FAB.
 *
 * @param {object} api
 * @returns {void}
 */
function removeSidebarAddFab(api) {
  const fab = document.querySelector('.' + api.SIDEBAR_ADD_FAB_CLASS);
  if (fab) fab.remove();
}

/**
 * Öffnet das FAB-Menü auf mobilen Geräten.
 *
 * @param {object} api
 * @returns {void}
 */
function openFabMenu(api) {
  if (!api.isMobile()) return;

  api.ensureFabMenu();
  showFabMenu();
  document.body.classList.add(api.BODY_MENU_CLASS);
}

/**
 * Schließt das FAB-Menü.
 *
 * @param {object} api
 * @returns {void}
 */
function closeFabMenu(api) {
  document.body.classList.remove(api.BODY_MENU_CLASS);
  hideFabMenu();
}

/**
 * Zeigt das FAB-Menü an.
 *
 * @returns {void}
 */
function showFabMenu() {
  const menu = document.querySelector('.contacts_fab_menu');
  if (menu) menu.setAttribute('aria-hidden', 'false');
}

/**
 * Blendet das FAB-Menü aus.
 *
 * @returns {void}
 */
function hideFabMenu() {
  const menu = document.querySelector('.contacts_fab_menu');
  if (menu) menu.setAttribute('aria-hidden', 'true');
}

/**
 * Fügt den Zurück-Button im Header hinzu, falls er noch nicht existiert.
 *
 * @param {object} api
 * @returns {void}
 */
function ensureBackButton(api) {
  const header = document.querySelector('.contact_detail_header');
  if (!header) return;
  if (header.querySelector('.contacts_overlay_back')) return;

  header.appendChild(createBackButton(api));
}

/**
 * Erstellt den Zurück-Button für das Overlay.
 *
 * @param {object} api
 * @returns {HTMLButtonElement}
 */
function createBackButton(api) {
  const btn = document.createElement('button');

  btn.type = 'button';
  btn.className = 'contacts_overlay_back';
  btn.setAttribute('aria-label', 'Back');
  btn.innerHTML = '<img src="assets/img/arrow-left-line.svg" alt="" class="contacts_overlay_back_icon">';
  btn.addEventListener('click', () => api.closeOverlay());

  return btn;
}

/**
 * Entfernt den Zurück-Button.
 *
 * @returns {void}
 */
function removeBackButton() {
  const btn = document.querySelector('.contacts_overlay_back');
  if (btn) btn.remove();
}

/**
 * Fügt den Overlay-FAB hinzu, falls er noch nicht existiert.
 *
 * @returns {void}
 */
function ensureOverlayFab() {
  if (document.querySelector('.contacts_overlay_fab')) return;
  document.body.appendChild(createOverlayFab());
}