/**
 * - Creates the floating action button used inside the overlay.
 * - Adds accessibility attributes and icon markup.
 * - Attaches click and keyboard event handlers.
 */
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

/**
 * - Handles clicks on the overlay floating action button.
 * - Stops the event from bubbling to outer elements.
 * - Toggles the FAB menu visibility.
 */
function handleOverlayFabClick(e) {
  e.stopPropagation();
  toggleFabMenu();
}

/**
 * - Toggles the floating action button menu.
 * - Checks the current menu state using a body class.
 * - Uses the API to open or close the menu.
 */
function toggleFabMenu() {
  const api = window.ContactsMobileMQ;
  const isOpen = document.body.classList.contains(api.BODY_MENU_CLASS);
  if (isOpen) api.closeFabMenu();
  else api.openFabMenu();
}

/**
 * - Removes the overlay floating action button from the DOM.
 * - Searches the button using its CSS class.
 * - Deletes the element only if it exists.
 */
function removeOverlayFab() {
  const fab = document.querySelector('.contacts_overlay_fab');
  if (fab) fab.remove();
}

/**
 * - Ensures the FAB menu exists only once in the DOM.
 * - Checks if a menu already exists before creating one.
 * - Appends the newly created menu to the document body.
 */
function ensureFabMenu(api) {
  if (document.querySelector('.contacts_fab_menu')) return;
  document.body.appendChild(createFabMenu(api));
}

/**
 * - Creates the floating action button menu element.
 * - Inserts the menu markup dynamically.
 * - Binds menu actions and prevents event bubbling.
 */
function createFabMenu(api) {
  const menu = document.createElement('div');
  menu.className = 'contacts_fab_menu';
  menu.setAttribute('aria-hidden', 'true');
  menu.innerHTML = getFabMenuMarkup();
  bindFabMenuActions(menu, api);
  menu.addEventListener('click', stopEventPropagation);
  return menu;
}

/**
 * - Returns the HTML markup for the FAB menu.
 * - Contains the edit and delete actions.
 * - Combines the entries into a single HTML string.
 */
function getFabMenuMarkup() {
  return [
    '<div class="detail_edit"><img src="assets/img/edit.svg" class="detail_action_icon">Edit</div>',
    '<div class="detail_delete"><img src="assets/img/delete.svg" class="detail_action_icon">delete</div>'
  ].join('');
}

/**
 * - Binds all menu actions to their respective handlers.
 * - Delegates binding to dedicated functions.
 * - Centralizes initialization of menu interactions.
 */
function bindFabMenuActions(menu, api) {
  bindFabEdit(menu, api);
  bindFabDelete(menu, api);
}

/**
 * - Connects the edit menu item to its handler.
 * - Locates the edit element within the menu.
 * - Passes the event and API to the handler.
 */
function bindFabEdit(menu, api) {
  const edit = menu.querySelector('.detail_edit');
  if (edit) edit.addEventListener('click', (e) => handleFabEdit(e, api));
}

/**
 * - Connects the delete menu item to its handler.
 * - Finds the delete element inside the menu.
 * - Passes the event and API to the delete handler.
 */
function bindFabDelete(menu, api) {
  const del = menu.querySelector('.detail_delete');
  if (del) del.addEventListener('click', (e) => handleFabDelete(e, api));
}

/**
 * - Executes the edit action from the FAB menu.
 * - Closes the menu and stops event propagation.
 * - Triggers the hidden edit button or calls openEdit().
 */
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

/**
 * - Executes the delete action from the FAB menu.
 * - Closes the menu and stops event bubbling.
 * - Triggers the hidden delete button if present.
 */
function handleFabDelete(e, api) {
  e.stopPropagation();
  api.closeFabMenu();

  const hiddenDelete = document.querySelector('.contact_detail_root .detail_actions .detail_delete');
  if (hiddenDelete) hiddenDelete.click();
}

/**
 * - Removes the FAB menu from the DOM.
 * - Searches the menu element using its CSS class.
 * - Ensures the menu state is closed via the API.
 */
function removeFabMenu(api) {
  const menu = document.querySelector('.contacts_fab_menu');
  if (menu) menu.remove();
  api.closeFabMenu();
}

/**
 * - Checks whether the contact detail root contains content.
 * - Retrieves the root detail container from the DOM.
 * - Returns true if the container has child elements.
 */
function detailRootHasContent() {
  const root = document.querySelector('.contact_detail_root');
  return !!(root && root.children && root.children.length);
}

/**
 * - Synchronizes the base UI state depending on the breakpoint.
 * - Switches to the desktop base logic if not on mobile.
 * - Cleans overlay and menu states when no detail content exists.
 */
function syncForBreakpointBase(api) {
  if (!api.isMobile()) {
    syncDesktopBase(api);
    return;
  }

  refreshSidebarAddFabState(api);

  if (detailRootHasContent()) return;

  document.body.classList.remove(api.BODY_OPEN_CLASS);
  api.closeFabMenu();
  api.removeBackButton();
  api.removeOverlayFab();
  api.removeFabMenu();
  refreshSidebarAddFabState(api);
}

/**
 * - Resets the UI to its desktop base state.
 * - Removes mobile overlay and FAB related elements.
 * - Repositions the detail root if available.
 */
function syncDesktopBase(api) {
  document.body.classList.remove(api.BODY_OPEN_CLASS);
  api.closeFabMenu();
  api.removeBackButton();
  api.removeOverlayFab();
  api.removeFabMenu();
  refreshSidebarAddFabState(api);
  repositionDetailRootIfAvailable();
}

/**
 * - Repositions the contact detail root if the function exists.
 * - Checks if positionDetailRoot is defined globally.
 * - Prevents runtime errors when the function is missing.
 */
function repositionDetailRootIfAvailable() {
  if (typeof window.positionDetailRoot === 'function') {
    window.positionDetailRoot();
  }
}

/**
 * - Patches important base functions of the application.
 * - Delegates patching to specialized patch functions.
 * - Initializes mobile-specific behavior modifications.
 */
function patchBaseFunctions(api) {
  patchSelectUserAt(api);
  patchClearSelection(api);
  patchPositionDetailRoot(api);
}

/**
 * - Patches selectUserAt to store the selected contact index.
 * - Opens the overlay after executing the original function.
 * - Prevents multiple patches of the same function.
 */
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

/**
 * - Patches clearSelection to resync the UI on mobile.
 * - Calls the original function before applying additional logic.
 * - Ensures breakpoint synchronization when necessary.
 */
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

/**
 * - Patches positionDetailRoot to disable it on mobile devices.
 * - Allows the original function only on desktop.
 * - Avoids duplicate patching.
 */
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

/**
 * - Checks whether a value is a patchable function.
 * - Returns true only if the value is a function.
 * - Prevents patching invalid references.
 */
function isPatchableFunction(fn) {
  return typeof fn === 'function';
}

/**
 * - Marks a function as already patched.
 * - Adds an internal flag to the function.
 * - Prevents multiple patch operations.
 */
function markAsPatched(fn) {
  fn.__contactsMobilePatched = true;
}

/**
 * - Stores the selected contact index globally.
 * - Uses the first argument of the function call.
 * - Updates the value only if it is a number.
 */
function storeSelectedContactIndex(args) {
  if (typeof args[0] === 'number') {
    window.__contacts_selected_idx = args[0];
  }
}

/**
 * - Binds global overlay related events.
 * - Registers listeners for keyboard, clicks and viewport changes.
 * - Ensures initialization runs only once.
 */
function bindGlobalOverlayEvents(api) {
  if (api.initDone) return;

  document.addEventListener('keydown', (e) => handleEscape(e, api));
  document.addEventListener('click', () => handleOutsideFabClick(api));
  window.addEventListener('resize', () => handleViewportChange(api));
  window.addEventListener('orientationchange', () => handleViewportChange(api));

  bindMediaQueryChange(api);

  api.initDone = true;
}

/**
 * - Binds media query change events.
 * - Uses modern addEventListener when available.
 * - Falls back to addListener for older browsers.
 */
function bindMediaQueryChange(api) {
  if (api.mq.addEventListener) {
    api.mq.addEventListener('change', () => syncForBreakpointBase(api));
    return;
  }

  api.mq.addListener(() => syncForBreakpointBase(api));
}

/**
 * - Handles Escape key presses.
 * - Checks whether the overlay is currently open.
 * - Closes the overlay if Escape is pressed.
 */
function handleEscape(e, api) {
  const isEscape = e.key === 'Escape';
  const isOpen = document.body.classList.contains(api.BODY_OPEN_CLASS);
  if (isEscape && isOpen) api.closeOverlay();
}

/**
 * - Handles clicks outside of the FAB menu.
 * - Checks whether the menu is currently open.
 * - Closes the menu when an outside click occurs.
 */
function handleOutsideFabClick(api) {
  const isMenuOpen = document.body.classList.contains(api.BODY_MENU_CLASS);
  if (isMenuOpen) api.closeFabMenu();
}

/**
 * - Handles viewport resize or orientation changes.
 * - Updates the CSS viewport height variable.
 * - Resets the detail position when on mobile devices.
 */
function handleViewportChange(api) {
  api.setVhVar();
  if (api.isMobile()) {
    api.resetDetailInlinePositionForMobile();
  }
}

/**
 * - Stops an event from propagating further.
 * - Used to prevent outside click handlers from firing.
 * - Encapsulates stopPropagation in a helper function.
 */
function stopEventPropagation(e) {
  e.stopPropagation();
}