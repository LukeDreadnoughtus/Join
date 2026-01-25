(function(){
  const sidebarAddButton = () => (
    // Creates the "Add new contact" label + icon markup for the sidebar button.
    // Returns a small HTML snippet that can be injected directly into the sidebar UI.
    '<span class="contacts_add_label">Add new contact</span>' +
    '<img src="assets/img/person_add.svg" class="contacts_add_icon">'
  );

  const dialog = () => (
    // Builds the full HTML structure for the contact modal (left panel, avatar slot, form inputs, action buttons).
    // Used as the base template for opening the "Edit contact" dialog and wiring up the close/delete/save actions.
    '<div class="contacts_modal_content">' +
      '<div class="contacts_modal_left_panel">' +
        '<img src="assets/img/join-logo-vector.svg" class="contacts_modal_logo">' +
        '<div id="contacts_modal_title" class="contacts_modal_title">Edit contact</div>' +
        '<div id="contacts_modal_subtitle" class="contacts_modal_subtitle"></div>' +
      '</div>' +
      '<div class="contacts_modal_avatar_col">' +
        '<div id="contacts_modal_avatar_slot" class="contacts_modal_avatar_slot"></div>' +
      '</div>' +
      '<div class="contacts_modal_right_panel">' +
        '<div class="contacts_modal_header">' +
          '<button class="contacts_modal_close" onclick="closeDialog()">×</button>' +
        '</div>' +
        '<div class="contacts_modal_body">' +
          '<input id="c_name" placeholder="Name">' +
          '<input id="c_email" placeholder="E-Mail">' +
          '<input id="c_phone" placeholder="Phone">' +
          '<div class="contacts_modal_actions">' +
            '<button class="contacts_delete_btn" onclick="deleteContact()">Delete</button>' +
            '<button class="contacts_create_btn" onclick="saveContact()">create contact ✓</button>' +
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
