(function(){
  // Firebase Realtime Database URL
  const DB="https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";
  const BOARD="https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

  // Predefined color palette for random color assignment
  const COLOR=[
    '#FF0000','#00FF00','#0000FF','#FFFF00','#00FFFF','#FF00FF',
    '#8A2BE2','#ff8800','#0f8558','#00afff','#cd6839','#f9c20cff'
  ];

  // In-memory array of contacts in render order
  let ORDER=[];
  let EDIT_ID=null;

  const T=window.contactsTemplates||{};

  const normalizeInitial=(name)=>{
    if(!name) return '#';
    const first=name.trim().charAt(0).toUpperCase();
    if('ÄÖÜ'.includes(first)) return first;
    if(first>='A'&&first<='Z') return first;
    return '#';
  };

  const titleCase=(fullName)=>{
    if(!fullName) return "";
    return fullName
      .split(/\s+/)
      .map(w=>w?w[0].toUpperCase()+w.slice(1).toLowerCase():"")
      .join(" ");
  };

  const initials=(fullName)=>{
    if(!fullName) return "";
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0,2)
      .map(p=>p[0].toUpperCase())
      .join("");
  };

  const pickColor=()=>{
    const idx=ORDER.length%COLOR.length;
    return COLOR[idx];
  };

  const createSidebarAddButton=()=>{
    const btn=document.createElement('button');
    btn.className='contacts_sidebar_add';
    btn.setAttribute('onclick','openDialog()');
    btn.innerHTML=T.sidebarAddButton?T.sidebarAddButton():'Add contact';
    return btn;
  };

  const createSidebarSkeleton=(content)=>{
    const sidebar=document.createElement('div');
    sidebar.className='contacts_sidebar';
    sidebar.setAttribute('onclick','sidebarClick(event)');
    const addBtn=createSidebarAddButton();
    const list=document.createElement('div');
    list.className='contacts_sidebar_list';
    sidebar.append(addBtn,list);
    content.insertBefore(sidebar,content.firstChild);
    return sidebar;
  };

  const ensureSidebar=()=>{
    const content=document.querySelector('main.content');
    if(!content) return null;
    let sidebar=content.querySelector('.contacts_sidebar');
    if(!sidebar) sidebar=createSidebarSkeleton(content);
    const btn=sidebar.querySelector('.contacts_sidebar_add');
    if(btn){
      btn.setAttribute('onclick','openDialog()');
      if(!btn.querySelector('img')&&T.sidebarAddButton)
        btn.innerHTML=T.sidebarAddButton();
    }
    return sidebar;
  };

  const mapContact=(key,u)=>{
    if(!u||!u.name) return null;
    return {
      id:key,
      name:String(u.name),
      email:u.email||"",
      phone:u.phone||"",
      color:u.color||u.colors||null
    };
  };

  const fetchContacts=async()=>{
    const response=await fetch(DB+".json");
    const data=await response.json();
    if(!data) return [];
    return Object.keys(data)
      .map(k=>mapContact(k,data[k]))
      .filter(Boolean);
  };

  const createNameAvatar=(user)=>{
    const avatar=document.createElement('div');
    avatar.className='contacts_avatar';
    avatar.textContent=initials(user.name);
    avatar.style.background=user.color||'#666';
    return avatar;
  };

  const createNameTexts=(user)=>{
    const texts=document.createElement('div');
    texts.className='contacts_texts';
    const label=document.createElement('div');
    label.className='contacts_name';
    label.textContent=titleCase(user.name);
    const email=document.createElement('div');
    email.className='contacts_email';
    email.textContent=user.email||'';
    texts.append(label,email);
    return texts;
  };

  const createNameRow=(user,idx)=>{
    const row=document.createElement('div');
    row.className='contacts_name_row';
    row.dataset.idx=idx;
    row.setAttribute('onclick','selectUserAt('+idx+')');
    row.append(createNameAvatar(user),createNameTexts(user));
    return row;
  };

  const groupContactsByInitial=(users)=>{
    const groups={};
    users.slice()
      .sort((a,b)=>a.name.localeCompare(b.name,'de',{sensitivity:'base'}))
      .forEach(u=>{
        const letter=normalizeInitial(u.name);
        (groups[letter]||(groups[letter]=[])).push(u);
      });
    return groups;
  };

  const createGroupHeader=(letter)=>{
    const section=document.createElement('div');
    section.className='contacts_group';
    const head=document.createElement('div');
    head.className='contacts_group_label';
    head.textContent=letter;
    const divider=document.createElement('div');
    divider.className='contacts_divider';
    section.append(head,divider);
    return section;
  };

  const appendUsersToGroup=(section,users)=>{
    users.forEach(u=>{
      const idx=ORDER.push(u)-1;
      section.appendChild(createNameRow(u,idx));
    });
  };

  const appendGroupToRoot=(root,letter,users)=>{
    const section=createGroupHeader(letter);
    appendUsersToGroup(section,users);
    root.appendChild(section);
  };

  const renderContacts=(root,users)=>{
    root.innerHTML='';
    ORDER=[];
    const groups=groupContactsByInitial(users);
    Object.keys(groups).sort().forEach(letter=>{
      appendGroupToRoot(root,letter,groups[letter]);
    });
  };

  const ensureDialog=()=>{
    let backdrop=document.querySelector('.contacts_modal_backdrop');
    if(backdrop) return backdrop;
    backdrop=document.createElement('div');
    backdrop.className='contacts_modal_backdrop';
    backdrop.setAttribute('onclick','closeDialog()');
    const modal=document.createElement('div');
    modal.className='contacts_modal';
    modal.setAttribute('onclick','event.stopPropagation()');
    modal.innerHTML=T.dialog?T.dialog():"";
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    return backdrop;
  };

  const resetDialogInputs=()=>{
    ['c_name','c_email','c_phone'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.value='';
    });
  };

  const configureCreateMode=(layer)=>{
    // mode flag for CSS (blue separator line under subtitle)
    if(layer){
      layer.classList.add('mode-create');
      layer.classList.remove('mode-edit');
    }
    const title=document.getElementById('contacts_modal_title');
    const sub=document.getElementById('contacts_modal_subtitle');
    if(title) title.textContent='Add contact';
    if(sub) sub.textContent='Tasks are better with a team!';
    const avatarSlot=layer.querySelector('#contacts_modal_avatar_slot');
    if(avatarSlot&&T.createDialogAvatar)
      avatarSlot.innerHTML=T.createDialogAvatar();
    const btn=layer.querySelector('.contacts_create_btn');
    if(btn) btn.textContent='create contact ✓';
    const del=layer.querySelector('.contacts_delete_btn');
    if(del) del.textContent='cancel x';
  };

  const openDialog=()=>{
    EDIT_ID=null;
    const layer=ensureDialog();
    if(!layer) return;
    layer.classList.add('is-open');
    resetDialogInputs();
    configureCreateMode(layer);
  };

  const closeDialog=()=>{
    const layer=document.querySelector('.contacts_modal_backdrop');
    if(layer) layer.classList.remove('is-open');
  };

  const readContactForm=()=>({
    name:document.getElementById('c_name')?.value.trim(),
    email:document.getElementById('c_email')?.value.trim(),
    phone:document.getElementById('c_phone')?.value.trim()
  });

  const hasRequiredFields=(f)=>!!(f.name&&f.email);

  const findEmailConflict=(all,email,id)=>{
    const lower=email.toLowerCase();
    return all.find(u=>(u.email||'').toLowerCase()===lower&&u.id!==id);
  };

  const isEditMode=(layer)=>{
    const btn=layer?.querySelector('.contacts_create_btn');
    const label=btn?.textContent?.trim().toLowerCase()||'';
    return label.startsWith('save');
  };

  const saveExistingContact=async(all,form)=>{
    const current=all.find(u=>u.id===EDIT_ID);
    const color=current?.color||pickColor();
    const body={name:form.name,email:form.email,phone:form.phone||'',colors:color};
    await fetch(DB+'/'+EDIT_ID+'.json',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
  };

  const createNewContact=async(form)=>{
    const body={
      name:form.name,
      email:form.email,
      phone:form.phone||'',
      colors:pickColor()
    };
    await fetch(DB+'.json',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
  };

  const refreshContactsUI=async()=>{
    const sidebar=ensureSidebar();
    if(!sidebar) return;
    const list=sidebar.querySelector('.contacts_sidebar_list');
    renderContacts(list,await fetchContacts());
  };

  const saveContact=async()=>{
    const form=readContactForm();
    if(!hasRequiredFields(form)) return;
    const all=await fetchContacts();
    if(findEmailConflict(all,form.email,EDIT_ID)){
      alert('E-Mail already exists.');
      return;
    }
    const layer=document.querySelector('.contacts_modal_backdrop');
    if(isEditMode(layer)&&EDIT_ID) await saveExistingContact(all,form);
    else await createNewContact(form);
    await refreshContactsUI();
    EDIT_ID=null;
    closeDialog();
  };

  const createDetailHeader=()=>{
    const h=document.createElement('div');
    h.className='contact_detail_header';
    const t=document.createElement('div');
    t.className='cdh_title';
    t.textContent='Contacts';
    const line=document.createElement('div');
    line.className='cdh_line';
    const sub=document.createElement('div');
    sub.className='cdh_sub';
    sub.textContent='better with a team';
    h.append(t,line,sub);
    document.body.appendChild(h);
    return h;
  };

  const ensureDetailHeader=()=>{
    let h=document.querySelector('.contact_detail_header');
    if(h) return h;
    return createDetailHeader();
  };

  const ensureDetailRoot=()=>{
    let root=document.querySelector('.contact_detail_root');
    if(root) return root;
    ensureDetailHeader();
    root=document.createElement('div');
    root.className='contact_detail_root';
    document.body.appendChild(root);
    return root;
  };

  const positionDetailRoot=()=>{
    const root=document.querySelector('.contact_detail_root');
    const sidebar=document.querySelector('.contacts_sidebar');
    const head=document.querySelector('.contact_detail_header');
    if(!root||!sidebar) return;
    const rect=sidebar.getBoundingClientRect();
    const left=(rect.right+20)+'px';
    root.style.left=left;
    if(head) head.style.left=left;
  };

  const clearSelection=()=>{
    document.querySelectorAll('.contacts_name_row.is-selected')
      .forEach(el=>el.classList.remove('is-selected'));
    const root=document.querySelector('.contact_detail_root');
    if(root) root.innerHTML='';
  };

  const buildDetailHead=(user,idx)=>{
    const head=document.createElement('div');
    head.className='contact_detail_item';
    const init=initials(user.name);
    const color=user.color||'#666';
    const name=titleCase(user.name);
    head.innerHTML=T.detailHead
      ? T.detailHead(init,name,color,idx)
      : name;
    const del=head.querySelector('.detail_delete');
    if(del) del.onclick=()=>{EDIT_ID=user.id||null;deleteContact();};
    return head;
  };

  const buildEmailElements=(user)=>{
    const label=document.createElement('h4');
    label.className='contact_detail_item font_weight_700';
    label.textContent='E-Mail';
    const mail=document.createElement('a');
    mail.className='contact_detail_item contact_detail_email';
    if(user.email){
      mail.href='mailto:'+user.email;
      mail.textContent=user.email;
    }else mail.textContent='';
    return {label,mail};
  };

  const buildPhoneElements=(user)=>{
    const label=document.createElement('h4');
    label.className='contact_detail_item font_weight_700';
    label.textContent='Phone';
    const phone=document.createElement('div');
    phone.className='contact_detail_item';
    phone.textContent=user.phone||'';
    return {label,phone};
  };

  const createContactInfoSection=()=>{
    const section=document.createElement('div');
    section.className='contact_detail_item detail_section_label';
    section.textContent='Contact Information';
    return section;
  };

  const appendProfileElements=(root,elements)=>{
    elements.forEach(el=>{
      el.classList.add('slide_in_right');
      root.appendChild(el);
    });
  };

  const fillProfile=(user,idx)=>{
    const root=ensureDetailRoot();
    positionDetailRoot();
    root.innerHTML='';
    const head=buildDetailHead(user,idx);
    const section=createContactInfoSection();
    const {label:mailLabel,mail}=buildEmailElements(user);
    const {label:phoneLabel,phone}=buildPhoneElements(user);
    appendProfileElements(root,[head,section,mailLabel,mail,phoneLabel,phone]);
  };

  const selectUserAt=(idx)=>{
    clearSelection();
    const row=document.querySelector('.contacts_name_row[data-idx="'+idx+'"]');
    if(row) row.classList.add('is-selected');
    const user=ORDER[idx];
    if(user) fillProfile(user,idx);
  };

  const sidebarClick=(e)=>{
    if(!e.target.closest('.contacts_name_row')) clearSelection();
  };

  const configureEditMode=(layer)=>{
    // mode flag for CSS (blue separator line under title)
    if(layer){
      layer.classList.add('mode-edit');
      layer.classList.remove('mode-create');
    }
    const title=document.getElementById('contacts_modal_title');
    const sub=document.getElementById('contacts_modal_subtitle');
    if(title) title.textContent='Edit contact';
    if(sub) sub.textContent='';
    const btn=layer.querySelector('.contacts_create_btn');
    if(btn) btn.textContent='save ✓';
    const del=layer.querySelector('.contacts_delete_btn');
    if(del) del.textContent='Delete';
  };

  const updateEditAvatar=(layer,user)=>{
    const slot=layer.querySelector('#contacts_modal_avatar_slot');
    if(!slot) return;
    const bg=user.color||'#666';
    const init=initials(user.name||'');
    if(T.editDialogAvatar) slot.innerHTML=T.editDialogAvatar(bg,init);
    else slot.textContent=init;
  };

  const fillEditInputs=(user)=>{
    const N=document.getElementById('c_name');
    const E=document.getElementById('c_email');
    const P=document.getElementById('c_phone');
    if(N) N.value=user.name||'';
    if(E) E.value=user.email||'';
    if(P) P.value=user.phone||'';
  };

  const openEdit=(idx)=>{
    const user=ORDER[idx];
    if(!user) return;
    EDIT_ID=user.id||null;
    const layer=ensureDialog();
    if(!layer) return;
    layer.classList.add('is-open');
    fillEditInputs(user);
    configureEditMode(layer);
    updateEditAvatar(layer,user);
  };

  const removeUserFromTasks=async(id)=>{
    if(!id) return;
    const r=await fetch(BOARD+".json");
    const data=await r.json();
    if(!data) return;
    const body={};
    Object.keys(data).forEach(k=>{
      const t=data[k];
      const a=t&&Array.isArray(t.assigned)?t.assigned:null;
      if(a&&a.includes(id)) body[k+"/assigned"]=a.filter(x=>x!==id);
    });
    if(Object.keys(body).length){
      await fetch(BOARD+".json",{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
    }
  };

  const deleteContact=async()=>{
    if(!EDIT_ID){closeDialog();return;}
    await removeUserFromTasks(EDIT_ID);
    await fetch(DB+'/'+EDIT_ID+'.json',{method:'DELETE'});
    await refreshContactsUI();
    EDIT_ID=null;
    closeDialog();
  };

  const init=async()=>{
    const sidebar=ensureSidebar();
    if(!sidebar) return;
    const list=sidebar.querySelector('.contacts_sidebar_list');
    renderContacts(list,await fetchContacts());
    ensureDetailHeader();
    ensureDetailRoot();
    positionDetailRoot();
  };

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',init);
  else init();

  window.openDialog=openDialog;
  window.closeDialog=closeDialog;
  window.saveContact=saveContact;
  window.deleteContact=deleteContact;
  window.selectUserAt=selectUserAt;
  window.sidebarClick=sidebarClick;
  window.openEdit=openEdit;
  window.positionDetailRoot=positionDetailRoot;
  window.clearSelection=clearSelection;
  window.fillProfile=fillProfile;
  window.ensureDetailRoot=ensureDetailRoot;
  window.ensureSidebar=ensureSidebar;
  window.onresize=positionDetailRoot;
}());
