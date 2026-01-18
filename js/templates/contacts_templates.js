(function(){
  const sidebarAddButton = () => (
    '<span class="contacts_add_label">Add new contact</span>' +
    '<img src="assets/img/person_add.svg" class="contacts_add_icon">'
  );

  const dialog = () => (
    '<div class="contacts_modal_content">' +
      '<div class="contacts_modal_left_panel">' +
        '<img src="../assets/img/join-logo-vector.svg" class="contacts_modal_logo">' +
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
    '<img src="assets/img/Group 13.svg" alt="" class="contacts_modal_avatar_image">'
  );

  const detailHead = (initials, name, color, idx) => (
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
