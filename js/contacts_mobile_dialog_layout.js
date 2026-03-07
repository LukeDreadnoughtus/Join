// Responsive dialog layout for Contacts (<= 1024px)
// Handles dialog element placement and final responsive initialization.

(function () {
  const api = window.ContactsMobileMQ;
  if (!api) return;

  api.syncDialogCloseButtonPlacement = function syncDialogCloseButtonPlacement() {
    const backdrop = document.querySelector('.contacts_modal_backdrop');
    if (!backdrop) return;
    const closeBtn = backdrop.querySelector('.contacts_modal_close');
    if (!closeBtn) return;
    moveCloseButton(backdrop, closeBtn);
  };

  function moveCloseButton(backdrop, closeBtn) {
    const leftPanel = backdrop.querySelector('.contacts_modal_left_panel');
    const rightHeader = backdrop.querySelector('.contacts_modal_right_panel .contacts_modal_header');
    if (api.isMobile()) return appendIfNeeded(leftPanel, closeBtn);
    appendIfNeeded(rightHeader, closeBtn);
  }

  api.syncDialogAvatarPlacement = function syncDialogAvatarPlacement() {
    const refs = getDialogRefs();
    if (!refs) return;
    if (api.isMobile()) return appendIfNeeded(refs.leftPanel, refs.avatarCol);
    moveAvatarToDesktop(refs);
  };

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

  function moveAvatarToDesktop(refs) {
    if (refs.avatarCol.parentElement === refs.content) return;
    if (refs.rightPanel) refs.content.insertBefore(refs.avatarCol, refs.rightPanel);
    else refs.content.appendChild(refs.avatarCol);
  }

  function appendIfNeeded(parent, child) {
    if (parent && child && child.parentElement !== parent) parent.appendChild(child);
  }

  api.syncForBreakpoint = function syncForBreakpoint() {
    api.syncForBreakpointBase();
    api.syncDialogCloseButtonPlacement();
    api.syncDialogAvatarPlacement();
  };

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

  function handleDialogMutation() {
    api.syncDialogCloseButtonPlacement();
    api.syncDialogAvatarPlacement();
  }

  api.patchDialogFunctions = function patchDialogFunctions() {
    patchDialogOpener('openDialog');
    patchDialogOpener('openEdit');
  };

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

  function runDialogSync() {
    api.syncDialogCloseButtonPlacement();
    api.syncDialogAvatarPlacement();
  }

  function init() {
    if (api.dialogInitDone) return;
    api.patchBaseFunctions();
    api.patchDialogFunctions();
    api.setVhVar();
    api.observeDialog();
    api.syncForBreakpoint();
    api.dialogInitDone = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
