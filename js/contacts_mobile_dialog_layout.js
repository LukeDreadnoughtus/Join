(function () {
  const api = window.ContactsMobileMQ;
  if (!api) return;

  /**
   * Initializes all dialog-related responsive behaviors once.
   * - Patches base and dialog functions for responsive updates.
   * - Sets viewport-related variables and starts observing DOM changes.
   * - Prevents duplicate initialization by using a guard flag.
   */
  function init() {
    if (api.dialogInitDone) return;
    api.patchBaseFunctions();
    api.patchDialogFunctions();
    api.setVhVar();
    api.observeDialog();
    api.syncForBreakpoint();
    api.dialogInitDone = true;
  }

  /**
   * Synchronizes all responsive dialog changes for the current breakpoint.
   * - Runs the shared base breakpoint sync logic first.
   * - Updates the close button position depending on viewport size.
   * - Updates the avatar placement for mobile and desktop layouts.
   */
  api.syncForBreakpoint = function syncForBreakpoint() {
    api.syncForBreakpointBase();
    api.syncDialogCloseButtonPlacement();
    api.syncDialogAvatarPlacement();
  };

  /**
   * Synchronizes the dialog close button placement.
   * - Finds the dialog backdrop and close button in the DOM.
   * - Stops safely if required elements are missing.
   * - Delegates placement logic to the dedicated helper function.
   */
  api.syncDialogCloseButtonPlacement = function syncDialogCloseButtonPlacement() {
    const backdrop = document.querySelector('.contacts_modal_backdrop');
    if (!backdrop) return;

    const closeBtn = backdrop.querySelector('.contacts_modal_close');
    if (!closeBtn) return;

    moveCloseButton(backdrop, closeBtn);
  };

  /**
   * Moves the close button to the correct container for the current layout.
   * - Places the close button in the left panel on mobile screens.
   * - Places the close button in the right header on larger screens.
   * - Uses safe DOM appending to avoid unnecessary re-insertion.
   */
  function moveCloseButton(backdrop, closeBtn) {
    const leftPanel = backdrop.querySelector('.contacts_modal_left_panel');
    const rightHeader = backdrop.querySelector('.contacts_modal_right_panel .contacts_modal_header');

    if (api.isMobile()) {
      return appendIfNeeded(leftPanel, closeBtn);
    }

    appendIfNeeded(rightHeader, closeBtn);
  }

  /**
   * Synchronizes the avatar placement inside the dialog.
   * - Collects the required dialog element references first.
   * - Moves the avatar into the left panel on mobile devices.
   * - Restores the desktop avatar position when not on mobile.
   */
  api.syncDialogAvatarPlacement = function syncDialogAvatarPlacement() {
    const refs = getDialogRefs();
    if (!refs) return;

    if (api.isMobile()) {
      return appendIfNeeded(refs.leftPanel, refs.avatarCol);
    }

    moveAvatarToDesktop(refs);
  };

  /**
   * Collects important dialog element references from the DOM.
   * - Locates the backdrop, avatar column, panels, and content container.
   * - Returns null if essential elements are missing.
   * - Provides a compact reference object for later layout operations.
   */
  function getDialogRefs() {
    const backdrop = document.querySelector('.contacts_modal_backdrop');
    if (!backdrop) return null;

    const avatarCol = backdrop.querySelector('.contacts_modal_avatar_col');
    const leftPanel = backdrop.querySelector('.contacts_modal_left_panel');
    const content = backdrop.querySelector('.contacts_modal_content');
    const rightPanel = backdrop.querySelector('.contacts_modal_right_panel');

    if (!avatarCol || !leftPanel || !content) return null;

    return { avatarCol, leftPanel, content, rightPanel };
  }

  /**
   * Restores the avatar column to its desktop position.
   * - Skips DOM updates if the avatar is already in the correct container.
   * - Inserts the avatar before the right panel when available.
   * - Appends the avatar to the content area as a fallback.
   */
  function moveAvatarToDesktop(refs) {
    if (refs.avatarCol.parentElement === refs.content) return;

    if (refs.rightPanel) {
      refs.content.insertBefore(refs.avatarCol, refs.rightPanel);
    } else {
      refs.content.appendChild(refs.avatarCol);
    }
  }

  /**
   * Appends a child element only when needed.
   * - Checks that both parent and child exist before modifying the DOM.
   * - Prevents duplicate moves when the child is already in the target parent.
   * - Keeps DOM operations minimal and safe.
   */
  function appendIfNeeded(parent, child) {
    if (parent && child && child.parentElement !== parent) {
      parent.appendChild(child);
    }
  }

  /**
   * Starts observing dialog-related DOM changes.
   * - Creates a single MutationObserver instance if none exists yet.
   * - Watches for subtree, child list, and class attribute changes.
   * - Triggers responsive syncing when dialog structure changes.
   */
  api.observeDialog = function observeDialog() {
    if (api.observer) return;

    api.observer = new MutationObserver(handleDialogMutation);
    api.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  };

  /**
   * Handles mutations that affect the dialog layout.
   * - Re-syncs the close button position after DOM changes.
   * - Re-syncs the avatar placement after DOM changes.
   * - Acts as the central observer callback for responsive dialog updates.
   */
  function handleDialogMutation() {
    api.syncDialogCloseButtonPlacement();
    api.syncDialogAvatarPlacement();
  }

  /**
   * Patches dialog opening functions to trigger responsive sync logic.
   * - Wraps known dialog opener functions after they execute.
   * - Ensures layout adjustments run when dialogs are opened dynamically.
   * - Applies patching only to supported function names.
   */
  api.patchDialogFunctions = function patchDialogFunctions() {
    patchDialogOpener('openDialog');
    patchDialogOpener('openEdit');
  };

  /**
   * Wraps a global dialog opener function with post-open sync behavior.
   * - Skips patching if the target is missing or already patched.
   * - Preserves the original function result and execution context.
   * - Schedules dialog synchronization after the original function runs.
   */
  function patchDialogOpener(name) {
    const orig = window[name];
    if (typeof orig !== 'function' || orig.__contactsMobilePatched) return;

    const patched = function (...args) {
      const res = orig.apply(this, args);
      setTimeout(runDialogSync, 0);
      return res;
    };

    patched.__contactsMobilePatched = true;
    window[name] = patched;
  }

  /**
   * Runs all dialog-specific synchronization tasks.
   * - Updates the close button placement after dialog changes.
   * - Updates the avatar placement after dialog changes.
   * - Serves as a shared callback for patched dialog openers.
   */
  function runDialogSync() {
    api.syncDialogCloseButtonPlacement();
    api.syncDialogAvatarPlacement();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();