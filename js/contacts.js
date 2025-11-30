(function(){
// Firebase Realtime Database URL
const DB="https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";
const BOARD="https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

// Predefined color palette for random color assignment
const COLORS=[
  '#FF0000','#00FF00','#0000FF','#FFFF00','#00FFFF','#FF00FF',
  '#8A2BE2','#ff8800','#0f8558','#00afff','#cd6839','#f9c20cff'
];// In-memory array of contacts in render order
let ORDER=[];
let EDIT_ID=null;

// Creates the sidebar and "Add new contact" button if missing
// Ensures onclick works even if sidebar already exists
const ensureSidebar=()=>{
  const content=document.querySelector('main.content');
  if(!content) return null;
  let sidebar=content.querySelector('.contacts_sidebar');
  if(!sidebar){
    sidebar=document.createElement('div');
    sidebar.className='contacts_sidebar';
    sidebar.setAttribute('onclick','sidebarClick(event)');
    const addBtn=document.createElement('button');
    addBtn.className='contacts_sidebar_add';
    addBtn.setAttribute('onclick','openDialog()');
        addBtn.innerHTML='<span class="contacts_add_label">Add new contact</span><img src="assets/img/person_add.svg" class="contacts_add_icon">';
    const list=document.createElement('div');
    list.className='contacts_sidebar_list';
    sidebar.append(addBtn,list);
    content.insertBefore(sidebar,content.firstChild);
  }else sidebar.setAttribute('onclick','sidebarClick(event)');
  const btn=sidebar.querySelector('.contacts_sidebar_add');
  if(btn){
    btn.setAttribute('onclick','openDialog()');
    if(!btn.querySelector('img')){
                  btn.innerHTML='<span class="contacts_add_label">Add new contact</span><img src="assets/img/person_add.svg" class="contacts_add_icon">';
    }
  }
  return sidebar;
};


// Normalizes first letter for group indexing (A–Z)
// Removes diacritics and converts to uppercase
const normalizeInitial=(name)=>{
  let first=String(name||'').trim().charAt(0).toUpperCase();
  try{
    first=first.normalize('NFD').replace(/\p{Diacritic}+/gu,'');
  }catch(e){}
  return /^[A-Z]$/.test(first)?first:'#';
};


// Converts each word of a name to Title Case
// Example: "Johanna flock" - "Johanna Flock"
const titleCase=(fullName)=>{
  return String(fullName||'')
    .trim()
    .split(/\s+/)
    .map(word=>{
      const first=word.charAt(0).toUpperCase();
      const rest=word.slice(1).toLowerCase();
      return first+rest;
    })
    .join(' ');
};


// Extracts initials from first and last name
// Example: "Luke Heller" - "LH"
const initials=(fullName)=>{
  return String(fullName||'')
    .trim()
    .split(/\s+/)
    .map(part=>part.charAt(0).toUpperCase())
    .join('');
};


// Picks a random color from the COLORS array
// Uses getUserColor() from login.js if defined
const pickColor=()=>{
  const idx=Math.floor(Math.random()*COLORS.length);
  return COLORS[idx];
};


// Fetches all contacts from Firebase Realtime Database
// Returns array with name, email, phone, and color
const fetchContacts=async()=>{
  const response=await fetch(DB+".json");
  const data=await response.json();
  if(!data) return [];
  const list=[];
  Object.keys(data).forEach(key=>{
    const u=data[key];
    if(u&&u.name){
      list.push({
        id:key,
        name:String(u.name),
        email:u.email||'',
        phone:u.phone||'',
        color:u.color||u.colors||null
      });
    }
  });
  return list;
};


// Creates one visible contact row (circle + name + email)
const createNameRow=(user,idx)=>{
  const row=document.createElement('div');
  row.className='contacts_name_row';
  row.dataset.idx=idx;
  row.setAttribute('onclick','selectUserAt('+idx+')');
  const avatar=document.createElement('div');
  avatar.className='contacts_avatar';
  avatar.textContent=initials(user.name);
  avatar.style.background=(user.color||'#666');
  const texts=document.createElement('div');
  texts.className='contacts_texts';
  const label=document.createElement('div');
  label.className='contacts_name';
  label.textContent=titleCase(user.name);
  const email=document.createElement('div');
  email.className='contacts_email';
  email.textContent=user.email||'';
  texts.append(label,email);
  row.append(avatar,texts);
  return row;
};


// Groups contacts by first letter
// Creates letter headers with a divider below each
const renderContacts=(root,users)=>{
  root.innerHTML='';
  ORDER=[];
  const groups={};
  users.slice()
    .sort((a,b)=>a.name.localeCompare(b.name,'de',{sensitivity:'base'}))
    .forEach(user=>{
      const letter=normalizeInitial(user.name);
      (groups[letter]||(groups[letter]=[])).push(user);
    });
  Object.keys(groups).sort().forEach(letter=>{
    const section=document.createElement('div');
    section.className='contacts_group';
    const head=document.createElement('div');
    head.className='contacts_group_label';
    head.textContent=letter;
    section.appendChild(head);
    const divider=document.createElement('div');
    divider.className='contacts_divider';
    section.appendChild(divider);
    groups[letter].forEach(u=>{
      const idx=ORDER.push(u)-1;
      section.appendChild(createNameRow(u,idx));
    });
    root.appendChild(section);
  });
};


// Builds the modal dialog (only once)
// Includes name/email/phone fields and create button
const ensureDialog=()=>{
  let backdrop=document.querySelector('.contacts_modal_backdrop');
  if(backdrop) return backdrop;
  backdrop=document.createElement('div');
  backdrop.className='contacts_modal_backdrop';
  backdrop.setAttribute('onclick','closeDialog()');
  const modal=document.createElement('div');
  modal.className='contacts_modal';
  modal.setAttribute('onclick','event.stopPropagation()');
  modal.innerHTML=
    '<div class="contacts_modal_content">'+
      '<div class="contacts_modal_left_panel">'+
        '<img src="../assets/img/join-logo-vector.svg" class="contacts_modal_logo">'+
        '<div id="contacts_modal_title" class="contacts_modal_title">Edit contact</div>'+
        '<div id="contacts_modal_subtitle" class="contacts_modal_subtitle"></div>'+
      '</div>'+
      '<div class="contacts_modal_avatar_col">'+
        '<div id="contacts_modal_avatar_slot" class="contacts_modal_avatar_slot"></div>'+
      '</div>'+
      '<div class="contacts_modal_right_panel">'+
        '<div class="contacts_modal_header">'+
          '<button class="contacts_modal_close" onclick="closeDialog()">×</button>'+
        '</div>'+
        '<div class="contacts_modal_body">'+
          '<input id="c_name" placeholder="Name">'+
          '<input id="c_email" placeholder="E-Mail">'+
          '<input id="c_phone" placeholder="Phone">'+
          '<div class="contacts_modal_actions">'+
            '<button class="contacts_delete_btn" onclick="deleteContact()">Delete</button>'+
            '<button class="contacts_create_btn" onclick="saveContact()">create contact ✓</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  return backdrop;
};


// Opens modal dialog and clears old input fields
const openDialog=()=>{
  EDIT_ID=null;
  const layer=ensureDialog();
  layer.classList.add('is-open');
  ['c_name','c_email','c_phone'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value='';
  });
  const title=document.getElementById('contacts_modal_title');
  const sub=document.getElementById('contacts_modal_subtitle');
  if(title) title.textContent='Add contact';
  if(sub) sub.textContent='Tasks are better with a team!';
  // Avatar: show default Group 13 icon when adding a new contact
  const avatarSlot=layer.querySelector('#contacts_modal_avatar_slot');
  if(avatarSlot){
    avatarSlot.innerHTML=
      '<img src="assets/img/Group 13.svg" alt="" class="contacts_modal_avatar_image">';
  }
  const btn=layer.querySelector('.contacts_create_btn');
  if(btn) btn.textContent='create contact ✓';
  const del=layer.querySelector('.contacts_delete_btn');
  if(del) del.textContent='cancel x';
};;


// Closes the modal dialog
const closeDialog=()=>{
  const layer=document.querySelector('.contacts_modal_backdrop');
  if(layer) layer.classList.remove('is-open');
};


// Saves new contact to Firebase 
// Generates a random color and re-renders list
const saveContact=async()=>{
  const name=document.getElementById('c_name')?.value.trim();
  const email=document.getElementById('c_email')?.value.trim();
  const phone=document.getElementById('c_phone')?.value.trim();
  if(!name||!email) return;
  const all=await fetchContacts();
  const lower=email.toLowerCase();
  const conflict=all.find(u=>(u.email||'').toLowerCase()===lower&&u.id!==EDIT_ID);
  if(conflict){alert('E-Mail already exists.');return;}
  const layer=document.querySelector('.contacts_modal_backdrop');
  const btn=layer?.querySelector('.contacts_create_btn');
  const isEdit=btn&&btn.textContent.trim().toLowerCase().startsWith('save');
  if(isEdit&&EDIT_ID){
    const current=all.find(u=>u.id===EDIT_ID);
    const color=current?.color||pickColor();
    const body={name,email,phone:phone||'',colors:color};
    await fetch(DB+'/'+EDIT_ID+'.json',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
  }else{
    const body={name,email,phone:phone||'',colors:pickColor()};
    await fetch(DB+'.json',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
  }
  const sidebar=ensureSidebar();
  const list=sidebar.querySelector('.contacts_sidebar_list');
  renderContacts(list,await fetchContacts());
  EDIT_ID=null;
  closeDialog();
};


// Ensures container for detail elements on the right

const ensureDetailHeader=()=>{
  let h=document.querySelector('.contact_detail_header');
  if(h) return h;
  h=document.createElement('div');
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

const ensureDetailRoot=()=>{
  let root=document.querySelector('.contact_detail_root');
  if(root) return root;
  ensureDetailHeader();
  root=document.createElement('div');
  root.className='contact_detail_root';
  document.body.appendChild(root);
  return root;
};

 
// Positions detail root 20px to the right of sidebar
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


// Clears selection and removes detail elements
const clearSelection=()=>{
  document.querySelectorAll('.contacts_name_row.is-selected')
    .forEach(el=>el.classList.remove('is-selected'));
  const root=document.querySelector('.contact_detail_root');
  if(root) root.innerHTML='';
};


// Fills detail area with avatar, name, edit, email, phone
const fillProfile=(user,idx)=>{
  const root=ensureDetailRoot();
  positionDetailRoot();
  root.innerHTML='';
  const head=document.createElement('div');
  head.className='contact_detail_item';
  head.innerHTML=
    '<div class="detail_row">'+
    '<div class="detail_avatar" style="background:'+(user.color||'#666')+'">'+
    initials(user.name)+'</div>'+
    '<div><div class="detail_name">'+titleCase(user.name)+'</div>'+
    '<div class="detail_actions"><div class="detail_edit" onclick="openEdit('+idx+')"><img src="assets/img/edit.svg" class="detail_action_icon">edit</div><div class="detail_delete"><img src="assets/img/delete.svg" class="detail_action_icon">delete</div></div></div>'+
    '</div>';
  const del=head.querySelector('.detail_delete');
  if(del) del.onclick=()=>{EDIT_ID=user.id||null;deleteContact();};
  const section=document.createElement('div');
  section.className='contact_detail_item detail_section_label';
  section.textContent='Contact Information';
  const mailLabel=document.createElement('h4');
  mailLabel.className='contact_detail_item';
  mailLabel.textContent='E-Mail';
  const mail=document.createElement('a');
  mail.className='contact_detail_item contact_detail_email';
  if(user.email){
    mail.href='mailto:'+user.email;
    mail.textContent=user.email;
  }else{
    mail.textContent='';
  }
  const phoneLabel=document.createElement('h4');
  phoneLabel.className='contact_detail_item';
  phoneLabel.textContent='Phone';
  const phone=document.createElement('div');
  phone.className='contact_detail_item';
  if(user.phone){
    phone.textContent=user.phone;
  }else{
    phone.textContent='';
  }
  [head,section,mailLabel,mail,phoneLabel,phone].forEach(el=>{
    el.classList.add('slide_in_right');
    root.appendChild(el);
  });
};


// Selects a user row, highlights it and shows profile
const selectUserAt=(idx)=>{
  clearSelection();
  const row=document.querySelector('.contacts_name_row[data-idx="'+idx+'"]');
  if(!row) return;
  row.classList.add('is-selected');
  const user=ORDER[idx];
  if(user) fillProfile(user,idx);
};


// Handles clicks in sidebar to clear selection on empty area
const sidebarClick=(e)=>{
  if(!e.target.closest('.contacts_name_row')) clearSelection();
};


// Opens dialog prefilled for editing, changes button to "save"
const openEdit=(idx)=>{
  const user=ORDER[idx];
  if(!user) return;
  EDIT_ID=user.id||null;
  const layer=ensureDialog();
  layer.classList.add('is-open');
  const N=document.getElementById('c_name');
  const E=document.getElementById('c_email');
  const P=document.getElementById('c_phone');
  if(N) N.value=user.name||'';
  if(E) E.value=user.email||'';
  if(P) P.value=user.phone||'';
  const title=document.getElementById('contacts_modal_title');
  const sub=document.getElementById('contacts_modal_subtitle');
  if(title) title.textContent='Edit contact';
  if(sub) sub.textContent='';
  // Avatar: use detail_avatar only when editing
  const avatarSlot=layer.querySelector('#contacts_modal_avatar_slot');
  if(avatarSlot){
    const bg=user.color||'#666';
    const name=user.name||'';
    avatarSlot.innerHTML=
      '<div class="detail_avatar" style="background:'+bg+'">'+
      initials(name)+'</div>';
  }
  const btn=layer.querySelector('.contacts_create_btn');
  if(btn) btn.textContent='save ✓';
  const del=layer.querySelector('.contacts_delete_btn');
  if(del) del.textContent='Delete';
};;


// Initializes sidebar and loads contact list on page load

const removeUserFromTasks=async(id)=>{
  if(!id) return;
  const r=await fetch(BOARD+".json"),data=await r.json();
  if(!data) return;
  const body={};
  Object.keys(data).forEach(k=>{
    const t=data[k],a=t&&Array.isArray(t.assigned)?t.assigned:null;
    if(a&&a.includes(id)) body[k+"/assigned"]=a.filter(x=>x!==id);
  });
  if(Object.keys(body).length)
    await fetch(BOARD+".json",{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
};

const deleteContact=async()=>{
  const id=EDIT_ID;
  if(!id){closeDialog();return;}
  await fetch(DB+'/'+id+'.json',{method:'DELETE'});
  await removeUserFromTasks(id);
  const sidebar=ensureSidebar(),list=sidebar&&sidebar.querySelector('.contacts_sidebar_list');
  if(list) renderContacts(list,await fetchContacts());
  clearSelection();
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

 
// Auto-initialize when page is ready
if(document.readyState!=='complete'&&document.readyState!=='interactive') window.onload=init;
else init();

// Make dialog functions available globally
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