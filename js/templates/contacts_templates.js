(function () {
  const sidebarAddButton = () => (
    // Creates the "Add new contact" label + icon markup for the sidebar button.
    // Returns a small HTML snippet that can be injected directly into the sidebar UI.
    '<span class="contacts_add_label">Add new contact</span>' +
    '<img src="assets/img/person_add.svg" class="contacts_add_icon">'
  );

  const dialog = () => (
    '<div class="contacts_modal_content">' +
    '<div class="contacts_modal_left_panel">' +
    '<img src="assets/img/join-logo-vector.svg" class="contacts_modal_logo">' +
    '<span id="contacts_modal_title" class="contacts_modal_title">Edit contact</span>' +
    '<div class="contacts_modal_subtitle_container">' +
    '<span id="contacts_modal_subtitle" class="contacts_modal_subtitle"></span>' +
    '</div>' +
    '</div>' +
    '<div class="contacts_modal_avatar_col">' +
    '<div id="contacts_modal_avatar_slot" class="contacts_modal_avatar_slot"></div>' +
    '</div>' +
    '<div class="contacts_modal_right_panel">' +
    '<div class="contacts_modal_header">' +
    '<button class="contacts_modal_close" onclick="closeDialog()">×</button>' +
    '</div>' +
    '<div class="contacts_modal_body">' +
    '<div class="contacts_modal_inputs">' +
    '<div class="input-wrapper">' +
    '<input id="c_name" placeholder="Name"' +
    ' onblur="handleNameBlur(event)"' +
    ' oninput="resetFieldOnInput(this)">' +
    '<p class="field-error d_none" id="error-c_name"></p>' +
    '</div>' +
    '<div class="input-wrapper">' +
    '<input id="c_email" placeholder="E-Mail"' +
    ' onblur="handleEmailBlur(event)"' +
    ' oninput="resetFieldOnInput(this)">' +
    '<p class="field-error d_none" id="error-c_email"></p>' +
    '</div>' +
    '<div class="input-wrapper">' +
    '<input id="c_phone" placeholder="Phone"' +
    ' onblur="handlePhoneBlur(event)"' +
    ' oninput="resetFieldOnInput(this)">' +
    '<p class="field-error d_none" id="error-c_phone"></p>' +
    '</div>' +
    '</div>' +
    '<div class="contacts_modal_actions">' +
    '<button id="contacts_delete_btn" class="contacts_delete_btn" onclick="deleteContact()">Delete</button>' +
    '<button id="contacts_create_btn" class="contacts_create_btn" onclick="saveContact()">Create contact ✓</button>' +
    '<button id="contacts_save_btn" class="contacts_save_btn" onclick="saveContact()" style="display:none;">Save ✓</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>'
  );

  const createDialogAvatar = () => (
    // Provides the default avatar image markup shown in the dialog when creating a new contact.
    // Keeps the dialog consistent by returning a ready-to-use <img> element with the correct class.
    '<img src="assets/img/Group 13.svg" alt="" class="contacts_modal_avatar_image">'
  );

  const detailHead = (initials, name, color, idx) => (
    // Renders the header section for the contact detail view (avatar, name, and action buttons).
    // Uses initials + background color for the avatar and binds the edit action to the correct contact index.
    '<div class="detail_row">' +
    '<div class="detail_avatar" style="background:' + color + '">' +
    initials +
    '</div>' +
    '<div>' +
    '<div class="detail_name">' + name + '</div>' +
    '<div class="detail_actions">' +
    '<div class="detail_edit" onclick="openEdit(' + idx + ')">' +
    '<img src="assets/img/edit.svg" class="detail_action_icon">Edit' +
    '</div>' +
    '<div class="detail_delete">' +
    '<img src="assets/img/delete.svg" class="detail_action_icon">delete' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>'
  );

  const editDialogAvatar = (bg, initials) => (
    // Creates the avatar block for the edit dialog using the contact's initials and saved background color.
    // Handy for reusing the same avatar style in different places without duplicating the HTML.
    '<div class="detail_avatar" style="background:' + bg + '">' +
    initials +
    '</div>'
  );

  window.contactsTemplates = {
    sidebarAddButton,
    dialog,
    createDialogAvatar,
    detailHead,
    editDialogAvatar
  };
}());
