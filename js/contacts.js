(function(){
// Firebase Realtime Database URL
const DB="https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";

// Predefined color palette for random color assignment
const COLORS=[
  '#FF0000','#00FF00','#0000FF','#FFFF00','#00FFFF','#FF00FF',
  '#8A2BE2','#ff8800','#0f8558','#00afff','#cd6839','#f9c20cff'
];


// Creates the sidebar and "Add new contact" button if missing
// Ensures onclick works even if sidebar already exists
const ensureSidebar=()=>{
  const content=document.querySelector('main.content');
  if(!content) return null;
  let sidebar=content.querySelector('.contacts_sidebar');
  if(!sidebar){
    sidebar=document.createElement('div');
    sidebar.className='contacts_sidebar';
    const addBtn=document.createElement('button');
    addBtn.className='contacts_sidebar_add';
    addBtn.textContent='Add new contact';
    addBtn.setAttribute('onclick','openDialog()');
    const list=document.createElement('div');
    list.className='contacts_sidebar_list';
    sidebar.append(addBtn,list);
    content.insertBefore(sidebar,content.firstChild);
  }
  const btn=sidebar.querySelector('.contacts_sidebar_add');
  if(btn) btn.setAttribute('onclick','openDialog()');
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
  const parts=String(fullName||'').trim().split(/\s+/);
  const first=(parts[0]||'').charAt(0).toUpperCase();
  const second=(parts[1]||'').charAt(0).toUpperCase();
  return first+(second||'');
};


// Picks a random color from the COLORS array
// Uses getUserColor() from login.js 
const pickColor=()=>{
  if(typeof window.getUserColor==='function'){
    const chosen=window.getUserColor();
    if(chosen) return chosen;
  }
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
        name:String(u.name),
        email:u.email||'',
        phone:u.phone||'',
        color:u.color||u.colors||null
      });
    }
  });
  return list;
};


// Creates one visible contact row (circle + name)
const createNameRow=(user)=>{
  const row=document.createElement('div');
  row.className='contacts_name_row';
  const avatar=document.createElement('div');
  avatar.className='contacts_avatar';
  avatar.textContent=initials(user.name);
  avatar.style.background=(user.color||'#666');
  const label=document.createElement('div');
  label.className='contacts_name';
  label.textContent=titleCase(user.name);
  row.append(avatar,label);
  return row;
};


// Groups contacts by first letter
// Creates letter headers with a divider below each
const renderContacts=(root,users)=>{
  root.innerHTML='';
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
    groups[letter].forEach(u=>section.appendChild(createNameRow(u)));
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
    '<div class="contacts_modal_header">New Contact'+
    '<button class="contacts_modal_close" onclick="closeDialog()">×</button>'+
    '</div><div class="contacts_modal_body">'+
    '<input id="c_name" placeholder="Name">'+
    '<input id="c_email" placeholder="E-Mail">'+
    '<input id="c_phone" placeholder="Phone">'+
    '<button class="contacts_create_btn" onclick="saveContact()">create contact ✓</button>'+
    '</div></div>';
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  return backdrop;
};


// Opens modal dialog and clears old input fields
const openDialog=()=>{
  const layer=ensureDialog();
  layer.classList.add('is-open');
  ['c_name','c_email','c_phone'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value='';
  });
};


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
  const color=pickColor();
  const body={name,email,phone:phone||'',colors:color};
  await fetch(DB+'.json',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  const sidebar=ensureSidebar();
  const list=sidebar.querySelector('.contacts_sidebar_list');
  renderContacts(list,await fetchContacts());
  closeDialog();
};


// Initializes sidebar and loads contact list on page load
const init=async()=>{
  const sidebar=ensureSidebar();
  if(!sidebar) return;
  const list=sidebar.querySelector('.contacts_sidebar_list');
  renderContacts(list,await fetchContacts());
};


// Auto-initialize when page is ready
if(document.readyState!=='complete'&&document.readyState!=='interactive') window.onload=init;
else init();

// Make dialog functions 
window.openDialog=openDialog;
window.closeDialog=closeDialog;
window.saveContact=saveContact;
}());
