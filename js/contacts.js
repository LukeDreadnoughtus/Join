checkAuth();
(function () {
  // Firebase Realtime Database URL
  // Overlay helper: behaves like registration.html (no layout shift, auto-hide for success messages)
  const showContactsOverlay = (id, ms = 2200) => {
    const el = document.getElementById(id);
    if (!el) return;
    // ensure hidden-class can't be overridden by later CSS
    el.classList.remove('d_none');
    el.style.display = 'flex';
    if (ms) {
      window.clearTimeout(el._hideTimer);
      el._hideTimer = window.setTimeout(() => hideContactsOverlay(id), ms);
    }
  };

  const showContactsOverlayMessages = (id, messages, baseMs = 2200) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (!el.dataset.defaultHtml) el.dataset.defaultHtml = el.innerHTML;

    const list = [].concat(messages || []).filter(Boolean);
    el.innerHTML = list.map(m => `<p>${String(m)}</p>`).join('');

    const ms = baseMs + Math.max(0, list.length - 1) * 1000;
    showContactsOverlay(id, ms);
  };

  const hideContactsOverlay = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.dataset.defaultHtml) {
      el.innerHTML = el.dataset.defaultHtml;
    }

    el.classList.add('d_none');
    el.style.display = 'none';
  };

  const hideAllContactsOverlays = () => {
    ['userfeedback_email', 'userfeedback_contact_created', 'userfeedback_contact_deleted'].forEach(hideContactsOverlay);
  };

  const wireContactsOverlayHiders = () => {
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el._overlayWired) {
        el.addEventListener('input', () => {
          hideContactsOverlay('userfeedback_email');
          hideContactsOverlay('userfeedback_contact_created');
          hideContactsOverlay('userfeedback_contact_deleted');
        });
        el.addEventListener('focus', () => {
          hideContactsOverlay('userfeedback_email');
          hideContactsOverlay('userfeedback_contact_created');
          hideContactsOverlay('userfeedback_contact_deleted');
        });
        el._overlayWired = true;
      }
    });
  };

  const isValidEmail = (email) => {
    if (!email) return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  };

  const isValidName = (name) => {
    if (!name) return false;
    return /^(?=.{2,50}$)[\p{L}]+(?:[ '\-][\p{L}]+)+$/u.test(name.trim());
  };

  const isValidPhoneNumber = (phone) => {
    if (!phone) return true;
    return /^\+?[0-9]{10,15}$/.test(phone.trim());
  };

  function validateContactName(name) {
    if (!name?.trim()) return { error: true, msg: null };
    if (!isValidName(name)) return { error: true, msg: 'Bitte Vor- und Nachname eingeben (nur Buchstaben).' };
    return { error: false };
  }

  function validateContactEmail(email, all = [], editId = null) {
    if (!email?.trim()) return { error: true, msg: null };
    if (!isValidEmail(email)) return { error: true, msg: 'Keine gültige E-Mail-Adresse.' };
    if (findEmailConflict(all, email, editId)) return { error: true, msg: 'Diese E-Mail existiert bereits.' };
    return { error: false };
  }

  function validateContactPhone(phone) {
    if (!phone?.trim()) return { error: false };
    if (!isValidPhoneNumber(phone)) return { error: true, msg: 'Nur Ziffern, 10–15 Stellen, optionales + am Anfang.' };
    return { error: false };
  }

  function showFieldError(inputEl, msg) {
    inputEl.classList.add('input_error'); // roter Rand
    const errorEl = document.getElementById(`error-${inputEl.id}`);
    if (!errorEl) return;
    if (msg) {
      errorEl.textContent = msg;
      errorEl.classList.remove('d_none');
    }
  }

  function clearFieldError(inputEl) {
    inputEl.classList.remove('input_error');
    const errorEl = document.getElementById(`error-${inputEl.id}`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('d_none');
    }
  }

  function handleNameBlur(event) {
    const input = event.target;
    const result = validateContactName(input.value);
    result.error ? showFieldError(input, result.msg) : clearFieldError(input);
  }

  function handleEmailBlur(event) {
    fetchContacts().then(all => {
      const result = validateContactEmail(event.target.value, all, EDIT_ID);
      result.error ? showFieldError(event.target, result.msg) : clearFieldError(event.target);
    });
  }

  function handlePhoneBlur(event) {
    const input = event.target;
    const result = validateContactPhone(input.value);
    result.error ? showFieldError(input, result.msg) : clearFieldError(input);
  }

  function resetFieldOnInput(inputEl) {
    clearFieldError(inputEl);
  }


  const DB = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";
  const BOARD = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

  // Predefined color palette for random color assignment
  const COLOR = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF',
    '#8A2BE2', '#ff8800', '#0f8558', '#00afff', '#cd6839', '#f9c20cff'
  ];

  // In-memory array of contacts in render order
  let ORDER = [];
  let EDIT_ID = null;
  let SELECTED_ID = null;

  const T = window.contactsTemplates || {};

  const normalizeInitial = (name) => {
    // - Grabs the first character of the name and normalizes it for grouping.
    // - Makes sure names that don't start with A-Z/ÄÖÜ end up in the "#" bucket.
    if (!name) return '#';
    const first = name.trim().charAt(0).toUpperCase();
    if ('ÄÖÜ'.includes(first)) return first;
    if (first >= 'A' && first <= 'Z') return first;
    return '#';
  };

  const titleCase = (fullName) => {
    // - Formats a full name nicely (e.g. "mAx mUSTer" -> "Max Muster").
    // - Splits by whitespace so multiple spaces/tabs don't break anything.
    if (!fullName) return "";
    return fullName
      .split(/\s+/)
      .map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "")
      .join(" ");
  };

  const initials = (fullName) => {
    // - Builds initials from the first two name parts (e.g. "Max Mustermann" -> "MM").
    // - Used for the avatar letters, so contacts look consistent in the UI.
    if (!fullName) return "";
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join("");
  };

  const pickColor = () => {
    // - Picks a color based on how many contacts are currently in ORDER.
    // - Cycles through COLOR so you don't run out of colors after a few contacts.
    const idx = ORDER.length % COLOR.length;
    return COLOR[idx];
  };

  const createSidebarAddButton = () => {
    // - Creates the "Add contact" button for the sidebar.
    // - Uses templates if available, otherwise falls back to plain text.
    const btn = document.createElement('button');
    btn.className = 'contacts_sidebar_add';
    btn.setAttribute('onclick', 'openDialog()');
    btn.innerHTML = T.sidebarAddButton ? T.sidebarAddButton() : 'Add contact';
    return btn;
  };

  const createSidebarSkeleton = (content) => {
    // - Builds the sidebar structure (button + list container) once.
    // - Attaches a click handler so clicks outside rows can clear selection.
    const sidebar = document.createElement('div');
    sidebar.className = 'contacts_sidebar';
    sidebar.setAttribute('onclick', 'sidebarClick(event)');
    const addBtn = createSidebarAddButton();
    const list = document.createElement('div');
    list.className = 'contacts_sidebar_list';
    sidebar.append(addBtn, list);
    content.insertBefore(sidebar, content.firstChild);
    return sidebar;
  };

  const ensureSidebar = () => {
    // - Makes sure the sidebar exists before rendering contacts.
    // - Also re-wires the add button/template so it stays correct after re-rendering.
    const content = document.querySelector('main.content');
    if (!content) return null;
    let sidebar = content.querySelector('.contacts_sidebar');
    if (!sidebar) sidebar = createSidebarSkeleton(content);
    const btn = sidebar.querySelector('.contacts_sidebar_add');
    if (btn) {
      btn.setAttribute('onclick', 'openDialog()');
      if (!btn.querySelector('img') && T.sidebarAddButton)
        btn.innerHTML = T.sidebarAddButton();
    }
    return sidebar;
  };

  const mapContact = (key, u) => {
    // - Converts raw Firebase JSON into the contact object the UI expects.
    // - Filters out broken entries (missing user or missing name).
    if (!u || !u.name) return null;
    return {
      id: key,
      name: String(u.name),
      email: u.email || "",
      phone: u.phone || "",
      color: u.color || u.colors || null
    };
  };

  const fetchContacts = async () => {
    // - Loads all contacts from Firebase and turns them into a clean array.
    // - Returns [] if the DB is empty, so the UI doesn't crash.
    const response = await fetch(DB + ".json");
    const data = await response.json();
    if (!data) return [];
    return Object.keys(data)
      .map(k => mapContact(k, data[k]))
      .filter(Boolean);
  };

  const createNameAvatar = (user) => {
    // - Creates the little round avatar with initials.
    // - Uses the saved user color (or a fallback) so each user is recognizable.
    const avatar = document.createElement('div');
    avatar.className = 'contacts_avatar';
    avatar.textContent = initials(user.name);
    avatar.style.background = user.color || '#666';
    return avatar;
  };

  const createNameTexts = (user) => {
    // - Builds the text area next to the avatar (name + email).
    // - Applies title casing so the list looks clean even with messy input.
    const texts = document.createElement('div');
    texts.className = 'contacts_texts';
    const label = document.createElement('h4');
    label.className = 'contacts_name';
    const n = titleCase(user.name);
    const nParts = String(n).split(' ');
    nParts.forEach((part, i) => {
      label.appendChild(document.createTextNode(part));
      if (i < nParts.length - 1) {
        label.appendChild(document.createTextNode(' '));
        label.appendChild(document.createElement('wbr'));
      }
    });
    const email = document.createElement('div');
    email.className = 'contacts_email';
    const e = String(user.email || '');
    const at = e.indexOf('@');
    if (at > -1) {
      email.appendChild(document.createTextNode(e.slice(0, at + 1)));
      email.appendChild(document.createElement('wbr'));
      email.appendChild(document.createTextNode(e.slice(at + 1)));
    } else {
      email.textContent = e;
    }
    texts.append(label, email);
    return texts;
  };

  const createNameRow = (user, idx) => {
    // - Creates one clickable row in the sidebar for a user.
    // - Stores the render index so selection can find the correct user in ORDER.
    const row = document.createElement('div');
    row.className = 'contacts_name_row';
    row.dataset.idx = idx;
    row.setAttribute('onclick', 'selectUserAt(' + idx + ')');
    row.append(createNameAvatar(user), createNameTexts(user));
    return row;
  };

  const groupContactsByInitial = (users) => {
    // - Sorts contacts by name (German locale rules) and groups them by initial.
    // - Returns an object like {A:[...], B:[...], "#":[...] } for rendering sections.
    const groups = {};
    users.slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
      .forEach(u => {
        const letter = normalizeInitial(u.name);
        (groups[letter] || (groups[letter] = [])).push(u);
      });
    return groups;
  };

  const createGroupHeader = (letter) => {
    // - Creates the header for a group section (letter label + divider).
    // - Keeps the markup consistent so CSS can style group separators easily.
    const section = document.createElement('div');
    section.className = 'contacts_group';
    const head = document.createElement('div');
    head.className = 'contacts_group_label';
    head.textContent = letter;
    const divider = document.createElement('div');
    divider.className = 'contacts_divider';
    section.append(head, divider);
    return section;
  };

  const appendUsersToGroup = (section, users) => {
    // - Appends user rows into a given letter section.
    // - Pushes users into ORDER so the sidebar index matches the data index.
    users.forEach(u => {
      const idx = ORDER.push(u) - 1;
      section.appendChild(createNameRow(u, idx));
    });
  };

  const appendGroupToRoot = (root, letter, users) => {
    // - Builds a full group section and attaches it to the sidebar list.
    // - Keeps rendering logic small by delegating header + user row creation.
    const section = createGroupHeader(letter);
    appendUsersToGroup(section, users);
    root.appendChild(section);
  };

  const renderContacts = (root, users) => {
    // - Clears the sidebar list and re-renders everything from scratch.
    // - Rebuilds ORDER so selection always points to the right contact.
    root.innerHTML = '';
    ORDER = [];
    const groups = groupContactsByInitial(users);
    Object.keys(groups).sort().forEach(letter => {
      appendGroupToRoot(root, letter, groups[letter]);
    });
  };

  const ensureDialog = () => {
    // - Ensures the modal backdrop + modal exist in the DOM.
    // - Clicking the backdrop closes the dialog; clicking inside the modal won't.
    let backdrop = document.querySelector('.contacts_modal_backdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.className = 'contacts_modal_backdrop';
    backdrop.setAttribute('onclick', 'closeDialog()');
    const modal = document.createElement('div');
    modal.className = 'contacts_modal';
    modal.setAttribute('onclick', 'event.stopPropagation()');
    modal.innerHTML = T.dialog ? T.dialog() : "";
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    return backdrop;
  };

  const resetDialogInputs = () => {
    // - Clears the input fields when opening the dialog.
    // - Prevents old values from sticking around when creating a new contact.
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    resetErrorBorders();
  };

  const configureCreateMode = (layer) => {
    // - Switches the dialog UI into "create" mode (text, buttons, avatar template).
    // - Adds CSS flags so the modal styling can change between create/edit states.
    // mode flag for CSS (blue separator line under subtitle)
    if (layer) {
      layer.classList.add('mode-create');
      layer.classList.remove('mode-edit');
    }
    const title = document.getElementById('contacts_modal_title');
    const sub = document.getElementById('contacts_modal_subtitle');
    if (title) {
      title.textContent = 'Add contact';
      // Wrap title in a container div if not already wrapped
      if (!title.parentElement.classList.contains('contacts_modal_title_container')) {
        const container = document.createElement('div');
        container.className = 'contacts_modal_title_container';
        title.parentElement.insertBefore(container, title);
        container.appendChild(title);
      }
    }
    if (sub) sub.textContent = 'Tasks are better with a team!';
    if (sub) {
      sub.textContent = 'Tasks are better with a team!';
      sub.className = 'contacts_modal_subtitle add-subtitle';
    }
    const avatarSlot = layer.querySelector('#contacts_modal_avatar_slot');
    if (avatarSlot && T.createDialogAvatar)
      avatarSlot.innerHTML = T.createDialogAvatar();
    const createBtn = layer.querySelector('#contacts_create_btn');
    const saveBtn = layer.querySelector('#contacts_save_btn');
    if (createBtn) {
      createBtn.style.display = 'block';
      createBtn.innerHTML = 'Create contact <span class="contacts-checkmark"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.288 8.775L13.763 0.3C13.963 0.1 14.2005 0 14.4755 0C14.7505 0 14.988 0.1 15.188 0.3C15.388 0.5 15.488 0.7375 15.488 1.0125C15.488 1.2875 15.388 1.525 15.188 1.725L5.988 10.925C5.788 11.125 5.55467 11.225 5.288 11.225C5.02133 11.225 4.788 11.125 4.588 10.925L0.288 6.625C0.088 6.425 -0.00783333 6.1875 0.0005 5.9125C0.00883333 5.6375 0.113 5.4 0.313 5.2C0.513 5 0.7505 4.9 1.0255 4.9C1.3005 4.9 1.538 5 1.738 5.2L5.288 8.775Z" fill="white"/></svg></span>';
    }
    if (saveBtn) saveBtn.style.display = 'none';
    const del = layer.querySelector('#contacts_delete_btn');
    if (del) del.innerHTML = 'Cancel <span class="contacts-x"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.243 6.243L11.486 11.486M1 11.486L6.243 6.243L1 11.486ZM11.486 1L6.242 6.243L11.486 1ZM6.242 6.243L1 1L6.242 6.243Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  };

  const openDialog = () => {
    // - Opens the modal in create mode and resets EDIT_ID.
    // - Clears inputs so you're always starting fresh when adding a contact.
    EDIT_ID = null;
    const layer = ensureDialog();
    if (!layer) return;
    layer.classList.add('is-open');
    resetDialogInputs();
    resetErrorBorders();
    hideContactsOverlay('userfeedback_email');
    wireContactsOverlayHiders();
    configureCreateMode(layer);
  };

  const closeDialog = () => {
    // - Hides the modal by removing the "is-open" class.
    // - Doesn’t destroy elements, so opening again is instant.
    const layer = document.querySelector('.contacts_modal_backdrop');
    if (layer) layer.classList.remove('is-open');
    resetErrorBorders();
  };

  const readContactForm = () => ({
    // - Reads values from the modal inputs and trims whitespace.
    // - Returns a simple object so validation/saving stays clean.
    name: document.getElementById('c_name')?.value.trim(),
    email: document.getElementById('c_email')?.value.trim(),
    phone: document.getElementById('c_phone')?.value.trim()
  });

  const hasRequiredFields = (f) => !!(f.name && f.email);
  // - Quick validation: name + email are required, phone is optional.
  // - Keeps saveContact simple by separating "is form valid?" into one line.

  const findEmailConflict = (all, email, id) => {
    // - Checks if the email already exists (case-insensitive).
    // - Ignores the current contact id so editing your own email won't block you.
    const lower = email.toLowerCase();
    return all.find(u => (u.email || '').toLowerCase() === lower && u.id !== id);
  };

  const isEditMode = (layer) => {
    // - Detects edit mode by checking if the layer has 'mode-edit' class.
    // - More reliable than checking button text since buttons can be hidden.
    return layer?.classList.contains('mode-edit') === true;
  };

  const saveExistingContact = async (all, form) => {
    // - Updates an existing Firebase record using PATCH.
    // - Keeps the previous color if possible so the avatar doesn't randomly change.
    const current = all.find(u => u.id === EDIT_ID);
    const color = current?.color || pickColor();
    const body = { name: form.name, email: form.email, phone: form.phone || '', colors: color };
    await fetch(DB + '/' + EDIT_ID + '.json', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  const createNewContact = async (form) => {
    // - Creates a new contact record using POST to the collection endpoint.
    // - Assigns a color right away so the UI can render the avatar nicely.
    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone || '',
      colors: pickColor()
    };
    const r = await fetch(DB + '.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => null);
    return data?.name || null;
  };

  const refreshContactsUI = async () => {
    // - Pulls the latest contacts from Firebase and re-renders the sidebar.
    // - Used after create/edit/delete so the UI always matches the DB.
    const sidebar = ensureSidebar();
    if (!sidebar) return;
    const list = sidebar.querySelector('.contacts_sidebar_list');
    renderContacts(list, await fetchContacts());
    if (SELECTED_ID) {
      const idx = ORDER.findIndex(u => u.id === SELECTED_ID);
      if (idx > -1) selectUserAt(idx);
      else clearSelection();
    }
  };

  const saveContact = async () => {
    const form = readContactForm();
    const all = await fetchContacts();
    let hasError = false;
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      clearFieldError(document.getElementById(id));
    });

    const nameCheck = validateContactName(form.name);
    if (nameCheck.error) {
      showFieldError(document.getElementById('c_name'), nameCheck.msg);
      hasError = true;
    }

    const emailCheck = validateContactEmail(form.email, all, EDIT_ID);
    if (emailCheck.error) {
      showFieldError(document.getElementById('c_email'), emailCheck.msg);
      hasError = true;
    }

    const phoneCheck = validateContactPhone(form.phone);
    if (phoneCheck.error) {
      showFieldError(document.getElementById('c_phone'), phoneCheck.msg);
      hasError = true;
    }

    if (hasError) return;

    const layer = document.querySelector('.contacts_modal_backdrop');
    if (isEditMode(layer) && EDIT_ID) {

      const current = all.find(u => u.id === EDIT_ID) || null;

      const changedMessages = [];
      if (current) {
        const oldName = (current.name || '').trim();
        const oldEmail = (current.email || '').trim();
        const oldPhone = (current.phone || '').trim();

        const newName = (form.name || '').trim();
        const newEmail = (form.email || '').trim();
        const newPhone = (form.phone || '').trim();

        if (oldName !== newName) changedMessages.push('Name was successfully updated');
        if (oldEmail !== newEmail) changedMessages.push('E-mail was successfully updated');
        if (oldPhone !== newPhone) changedMessages.push('Phone number was successfully updated');
      }

      SELECTED_ID = EDIT_ID;
      await saveExistingContact(all, form);

      if (changedMessages.length) {
        showContactsOverlayMessages('userfeedback_contact_created', changedMessages, 2000);
      }

    } else {
      const newId = await createNewContact(form);
      if (newId) SELECTED_ID = newId;
      showContactsOverlay('userfeedback_contact_created', 2000);
    }
    await refreshContactsUI();
    EDIT_ID = null;
    closeDialog();
  };

  const createDetailHeader = () => {
    // - Builds the fixed detail header ("Contacts" + subtitle) once.
    // - Appends it to the body so it can be positioned independently from the sidebar.
    const h = document.createElement('div');
    h.className = 'contact_detail_header';
    const t = document.createElement('h2');
    t.className = 'cdh_title';
    t.textContent = 'Contacts';
    const line = document.createElement('div');
    line.className = 'cdh_line';
    const sub = document.createElement('div');
    sub.className = 'cdh_sub';
    sub.textContent = 'better with a team';
    h.append(t, line, sub);
    document.body.appendChild(h);
    return h;
  };

  const ensureDetailHeader = () => {
    // - Returns the existing detail header if it’s already there.
    // - Otherwise creates it, so init() can call this safely.
    let h = document.querySelector('.contact_detail_header');
    if (h) return h;
    return createDetailHeader();
  };

  const ensureDetailRoot = () => {
    // - Ensures the detail container exists (where the profile renders).
    // - Creates it once and reuses it, so selection just swaps innerHTML.
    let root = document.querySelector('.contact_detail_root');
    if (root) return root;
    ensureDetailHeader();
    root = document.createElement('div');
    root.className = 'contact_detail_root';
    document.body.appendChild(root);
    return root;
  };

  const positionDetailRoot = () => {
    // - Positions the detail view to the right of the sidebar using DOM measurements.
    // - Also aligns the header so everything stays in one column visually.
    const root = document.querySelector('.contact_detail_root');
    const sidebar = document.querySelector('.contacts_sidebar');
    const head = document.querySelector('.contact_detail_header');
    if (!root || !sidebar) return;
    const rect = sidebar.getBoundingClientRect();
    const left = (rect.right + 20) + 'px';
    root.style.left = left;
    if (head) head.style.left = left;
  };

  const clearSelection = () => {
    // - Removes highlight from selected sidebar row.
    // - Clears the detail panel so nothing is shown when no user is selected.
    SELECTED_ID = null;
    document.querySelectorAll('.contacts_name_row.is-selected')
      .forEach(el => el.classList.remove('is-selected'));
    const root = document.querySelector('.contact_detail_root');
    if (root) root.innerHTML = '';
  };

  const buildDetailHead = (user, idx) => {
    // - Builds the top part of the detail view (avatar/name + actions).
    // - Wires delete button to deleteContact() while keeping EDIT_ID in sync.
    const head = document.createElement('div');
    head.className = 'contact_detail_item';
    const init = initials(user.name);
    const color = user.color || '#666';
    const name = titleCase(user.name);
    head.innerHTML = T.detailHead
      ? T.detailHead(init, name, color, idx)
      : name;
    const del = head.querySelector('.detail_delete');
    if (del) del.onclick = () => { EDIT_ID = user.id || null; deleteContact(); };
    return head;
  };

  const buildEmailElements = (user) => {
    // - Creates the email label + a clickable "mailto:" link.
    // - Keeps it empty if the user has no email (so layout stays stable).
    const label = document.createElement('div');
    label.className = 'contact_detail_item font_weight_700';
    label.textContent = 'E-Mail';
    const mail = document.createElement('a');
    mail.className = 'contact_detail_item contact_detail_email';
    if (user.email) {
      mail.href = 'mailto:' + user.email;
      mail.textContent = user.email;
    } else mail.textContent = '';
    return { label, mail };
  };

  const buildPhoneElements = (user) => {
    // - Creates the phone label + value container.
    // - Phone stays plain text (no click-to-call), so it works everywhere.
    const label = document.createElement('div');
    label.className = 'contact_detail_item font_weight_700';
    label.textContent = 'Phone';
    const phone = document.createElement('div');
    phone.className = 'contact_detail_item';
    phone.textContent = user.phone || '';
    return { label, phone };
  };

  const createContactInfoSection = () => {
    // - Builds the "Contact Information" section title.
    // - Makes the detail view feel structured instead of just dumping fields.
    const section = document.createElement('div');
    section.className = 'contact_detail_item detail_section_label';
    section.textContent = 'Contact Information';
    return section;
  };

  const appendProfileElements = (root, elements) => {
    // - Appends detail elements with an animation class.
    // - Keeps the animation logic in one place instead of repeating it everywhere.
    elements.forEach(el => {
      el.classList.add('slide_in_right');
      root.appendChild(el);
    });
  };

  const fillProfile = (user, idx) => {
    // - Renders the full detail profile for the selected user.
    // - Repositions the detail panel first so it still lines up after resizing.
    const root = ensureDetailRoot();
    if (!window.matchMedia("(max-width: 1024px)").matches) positionDetailRoot();
    root.innerHTML = '';
    const head = buildDetailHead(user, idx);
    const section = createContactInfoSection();
    const { label: mailLabel, mail } = buildEmailElements(user);
    const { label: phoneLabel, phone } = buildPhoneElements(user);
    appendProfileElements(root, [head, section, mailLabel, mail, phoneLabel, phone]);
  };

  const selectUserAt = (idx) => {
    // - Selects a user by sidebar index and renders their profile.
    // - Adds a visual "is-selected" class so the clicked row stays highlighted.
    clearSelection();
    const row = document.querySelector('.contacts_name_row[data-idx="' + idx + '"]');
    if (row) row.classList.add('is-selected');
    const user = ORDER[idx];
    if (user) {
      SELECTED_ID = user.id || null;
      fillProfile(user, idx);
    }
  };

  const sidebarClick = (e) => {
    // - If you click anywhere in the sidebar that is NOT a row, selection is cleared.
    // - Makes the UI feel natural (clicking empty space deselects).
    if (!e.target.closest('.contacts_name_row')) clearSelection();
  };

  const configureEditMode = (layer) => {
    // - Switches the dialog UI into "edit" mode (labels + buttons + styling).
    // - Uses CSS flags so the modal separator line / visuals can change.
    // mode flag for CSS (blue separator line under title)
    if (layer) {
      layer.classList.add('mode-edit');
      layer.classList.remove('mode-create');
    }
    const title = document.getElementById('contacts_modal_title');
    const sub = document.getElementById('contacts_modal_subtitle');
    if (title) {
      title.textContent = 'Edit contact';
      // Wrap title in a container div if not already wrapped
      if (!title.parentElement.classList.contains('contacts_modal_title_container')) {
        const container = document.createElement('div');
        container.className = 'contacts_modal_title_container';
        title.parentElement.insertBefore(container, title);
        container.appendChild(title);
      }
    }
    if (sub) sub.textContent = '';
    if (sub) {
      sub.textContent = '';
      sub.className = 'contacts_modal_subtitle edit-subtitle';
    }
    const createBtn = layer.querySelector('#contacts_create_btn');
    const saveBtn = layer.querySelector('#contacts_save_btn');
    if (createBtn) createBtn.style.display = 'none';
    if (saveBtn) {
      saveBtn.style.display = 'block';
      saveBtn.innerHTML = 'Save <span class="contacts-checkmark"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.288 8.775L13.763 0.3C13.963 0.1 14.2005 0 14.4755 0C14.7505 0 14.988 0.1 15.188 0.3C15.388 0.5 15.488 0.7375 15.488 1.0125C15.488 1.2875 15.388 1.525 15.188 1.725L5.988 10.925C5.788 11.125 5.55467 11.225 5.288 11.225C5.02133 11.225 4.788 11.125 4.588 10.925L0.288 6.625C0.088 6.425 -0.00783333 6.1875 0.0005 5.9125C0.00883333 5.6375 0.113 5.4 0.313 5.2C0.513 5 0.7505 4.9 1.0255 4.9C1.3005 4.9 1.538 5 1.738 5.2L5.288 8.775Z" fill="white"/></svg></span>';
    }
    const del = layer.querySelector('#contacts_delete_btn');
    if (del) del.innerHTML = 'Delete <span class="contacts-x"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.243 6.243L11.486 11.486M1 11.486L6.243 6.243L1 11.486ZM11.486 1L6.242 6.243L11.486 1ZM6.242 6.243L1 1L6.242 6.243Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  };

  const updateEditAvatar = (layer, user) => {
    // - Updates the avatar preview inside the edit modal.
    // - Uses the template if present, otherwise just dumps initials into the slot.
    const slot = layer.querySelector('#contacts_modal_avatar_slot');
    if (!slot) return;
    const bg = user.color || '#666';
    const init = initials(user.name || '');
    if (T.editDialogAvatar) slot.innerHTML = T.editDialogAvatar(bg, init);
    else slot.textContent = init;
  };

  const fillEditInputs = (user) => {
    // - Fills the modal inputs with the selected user's data.
    // - Lets you edit without manually re-typing name/email/phone.
    const N = document.getElementById('c_name');
    const E = document.getElementById('c_email');
    const P = document.getElementById('c_phone');
    if (N) N.value = user.name || '';
    if (E) E.value = user.email || '';
    if (P) P.value = user.phone || '';
  };

  const openEdit = (idx) => {
    // - Opens the modal in edit mode for the selected sidebar user.
    // - Stores EDIT_ID so save/delete knows which Firebase record to touch.
    const user = ORDER[idx];
    if (!user) return;
    EDIT_ID = user.id || null;
    const layer = ensureDialog();
    if (!layer) return;
    layer.classList.add('is-open');
    fillEditInputs(user);
    hideContactsOverlay('userfeedback_email');
    wireContactsOverlayHiders();
    configureEditMode(layer);
    updateEditAvatar(layer, user);
  };

  const removeUserFromTasks = async (id) => {
    // - Scans the task board and removes the user id from assigned arrays.
    // - Prevents "ghost assignees" after a contact is deleted.
    if (!id) return;
    const r = await fetch(BOARD + ".json");
    const data = await r.json();
    if (!data) return;
    const body = {};
    Object.keys(data).forEach(k => {
      const t = data[k];
      const a = t && Array.isArray(t.assigned) ? t.assigned : null;
      if (a && a.includes(id)) body[k + "/assigned"] = a.filter(x => x !== id);
    });
    if (Object.keys(body).length) {
      await fetch(BOARD + ".json", {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
  };

  function resetErrorBorders() {
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('input-error');
    });
  }

  const deleteContact = async () => {
    // - Deletes the currently edited contact from Firebase.
    // - Also removes the contact from task assignments so the board stays consistent.
    if (!EDIT_ID) { closeDialog(); return; }
    await removeUserFromTasks(EDIT_ID);
    await fetch(DB + '/' + EDIT_ID + '.json', { method: 'DELETE' });
    if (SELECTED_ID === EDIT_ID) SELECTED_ID = null;
    await refreshContactsUI();
    EDIT_ID = null;
    closeDialog();
    // deleted userfeedback should be visible max 2s
    showContactsOverlay('userfeedback_contact_deleted', 2000);
  };

  const init = async () => {
    hideAllContactsOverlays();

    // - Bootstraps the contacts UI: sidebar, list render, detail layout, positioning.
    // - Runs once on DOM ready (or immediately if the DOM is already loaded).
    const sidebar = ensureSidebar();
    if (!sidebar) return;
    const list = sidebar.querySelector('.contacts_sidebar_list');
    renderContacts(list, await fetchContacts());
    ensureDetailHeader();
    ensureDetailRoot();
    if (!window.matchMedia("(max-width: 1024px)").matches) positionDetailRoot();
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();

  window.openDialog = openDialog;
  window.closeDialog = closeDialog;
  window.saveContact = saveContact;
  window.deleteContact = deleteContact;
  window.selectUserAt = selectUserAt;
  window.sidebarClick = sidebarClick;
  window.openEdit = openEdit;
  window.positionDetailRoot = positionDetailRoot;
  window.clearSelection = clearSelection;
  window.fillProfile = fillProfile;
  window.ensureDetailRoot = ensureDetailRoot;
  window.ensureSidebar = ensureSidebar;
  window.handleNameBlur = handleNameBlur;
  window.handleEmailBlur = handleEmailBlur;
  window.handlePhoneBlur = handlePhoneBlur;
  window.resetFieldOnInput = resetFieldOnInput;
  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 1024px)").matches) positionDetailRoot();
  });
}());