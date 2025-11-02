let path = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/"


async function logIn(event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value
    try {
        const response = await fetch(path + ".json");
        const userData = await response.json();
        proofUserData(userData, username, password)

     } catch (error) {
        console.error("Fehler beim Login:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
    }
}

function proofUserData(userData, username, password) {
     for (const userKey in userData) {
        const user = userData[userKey];
        if (!user) continue;

        if (username === user.name && password === user.password) {
            localStorage.setItem("username", `${username}`)
            localStorage.setItem("userid", `${userKey}`); //hier speichern wir auch die id für die tasks - Bei Logout dann am besten wieder rauslöschen
            window.location.href = "summary.html";
            return
        }
    }
    alert("Dein Passwort und/oder dein eingegebener Benutzername stimmen nicht.");
}


function toRegistration() {
    window.location.href = "registration.html";
}

//registration

function backToLogIn() {
    window.location.href = "index.html";
}

function checkAllInputs() {
    const checkBox= document.getElementById("checkboxhightlight")
    if (checkBox.classList.contains("custom_check_highlight")) {
        document.getElementById("userfeedback_checkbox").classList.add("d_none")
        document.getElementById("checkboxhightlight").classList.remove("custom_check_highlight")
    } 
    checkAllFieldsFilled()
}

function checkAllFieldsFilled() {
    const name = document.getElementById("name_registration").value.trim();
    const email = document.getElementById("email_registration").value.trim();
    const password = document.getElementById("password_registration").value.trim();
    const passwordConfirm = document.getElementById("password_confirm").value.trim();

    if(!name) {
    document.getElementById("name_registration").classList.add("input_style_red")
    document.getElementById("name_registration").classList.remove("input_style")
    }
    
    if(!email) {
    document.getElementById("email_registration").classList.add("input_style_red")
    document.getElementById("email_registration").classList.remove("input_style")
    }

    if(!password) {
    document.getElementById("password_registration").classList.add("input_style_red")
    document.getElementById("password_registration").classList.remove("input_style")
    }

    if(!passwordConfirm) {
    document.getElementById("password_confirm").classList.add("input_style_red")
    document.getElementById("password_confirm").classList.remove("input_style")
    }
}

function checkEmailField (event) {
    event.stopPropagation();
    let emailInput = document.getElementById("email_registration")
    if (emailInput.classList.contains("input_style_red")) {
    document.getElementById("email_registration").classList.add("input_style")
    document.getElementById("email_registration").classList.remove("input_style_red") }
}

//JS Doku
//Überprüfen ob alle Felder ausgefüllt wurden + Userfeedback

function handlePasswordInput (event) {
    event.stopPropagation();
    const input = event.target;
    if (input.id === "password_registration") {
    showVisibilityIcon(event); 
    } else if (input.id === "password_confirm") {
    showVisibilityIcon2(event); 
    }
    checkInputUserfeedback();
    checkPassword ();
}

function showVisibilityIcon(event) {
    event.stopPropagation();
    const input = event.target
    if (!input.dataset.iconShown && input.value.length > 0) {
    document.getElementById("lock").classList.add("d_none")
    document.getElementById("visibilitynot").classList.remove("d_none")
    input.dataset.iconShown = "true";
  }
}

function showVisibilityIcon2(event) {
    event.stopPropagation();
   const input = event.target
    if (!input.dataset.iconShown && input.value.length > 0) {
    document.getElementById("lock2").classList.add("d_none")
    document.getElementById("visibilitynot2").classList.remove("d_none")
    input.dataset.iconShown = "true";
  }
}

function checkInputUserfeedback () {
    let alert = document.getElementById("passwordmatch");
    let redinput = document.getElementById("password_confirm")
    if (!alert.classList.contains("d_none")) {
    document.getElementById("password_confirm").classList.add("input_style")
    document.getElementById("password_confirm").classList.remove("input_style_red")
    document.getElementById("passwordmatch").classList.add("d_none")
    }
    if (redinput.classList.contains("input_style_red")) {
    document.getElementById("password_confirm").classList.add("input_style")
    document.getElementById("password_confirm").classList.remove("input_style_red")
    }
}

function checkPassword () {
     const passwordInput = document.getElementById("password_registration");
    const passwordLength = passwordInput.value.length;
    const passwordInputConfirm = document.getElementById("password_confirm");
    const passwordConfirmLength = passwordInputConfirm.value.length;

    if (passwordLength <= passwordConfirmLength) {
         if (passwordInput.value === passwordInputConfirm.value) {
            console.log("Passwörter stimmen überein");
            } else {showUserfeedback();}
    }
}

function showUserfeedback() {
    document.getElementById("password_confirm").classList.add("input_style_red")
    document.getElementById("password_confirm").classList.remove("input_style")
    document.getElementById("passwordmatch").classList.remove("d_none")
}

function showPassword(event) {
    event.stopPropagation();
    document.getElementById("visibilitynot").classList.toggle("d_none")
    document.getElementById("visibility").classList.toggle("d_none")
    const input = document.getElementById("password_registration")
    input.type = input.type === "password" ? "text" : "password";
}

function showPassword2(event) {
    event.stopPropagation();
    document.getElementById("visibilitynot2").classList.toggle("d_none")
    document.getElementById("visibility2").classList.toggle("d_none")
    const input = document.getElementById("password_confirm")
    input.type = input.type === "password" ? "text" : "password";
}

async function registration (event) {
    event.preventDefault();
    if( checkBoxProof() === false) {
        return
    }
    let userData = createUserDataObject() 
    if(await proofEmail (userData) === true) return
    await postUserData (event, userData)
    toSummary()
}

function checkBoxProof() {
    const checkBox= document.getElementById("termsCheckbox")
    if(!checkBox.checked) {
        document.getElementById("userfeedback_checkbox").classList.remove("d_none")
        document.getElementById("checkboxhightlight").classList.add("custom_check_highlight")
        return false}
    return true
}

function createUserDataObject() {
    const name = document.getElementById("name_registration").value.trim();
    const email = document.getElementById("email_registration").value.trim()
    const password = document.getElementById("password_registration").value.trim()
    const userData = {
    name: name,
    email: email,
    password: password,
    color: getUserColor()
    };
   return userData 
}

async function proofEmail (userData) {
    try {
        console.log(path)
    const getResponse = await fetch(path + ".json");
    const users = await getResponse.json();
     if (!users) return false;
     for (const key in users) {
      const user = users[key];
      if (user.email === userData.email) {
        document.getElementById("userfeedback_email").classList.remove("d_none");
        return true;
      }
    } 
    return false;
    } catch (error) {
    console.error("Fehler beim Prüfen der E-Mail:", error);
    document.getElementById("userfeedback_email_prooffail").classList.remove("d_none")
    return true; }
    }


async function postUserData (event, userData) {
     event.preventDefault();
     try {
        const response = await fetch(path + ".json", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });
        const responseToJson = await response.json();
        console.log("Benutzer gespeichert:", responseToJson);
    } catch (error) {
        console.error("Fehler bei der Registrierung:", error.message, error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    }
}

function getUserColor() {
    const basicColors = [
    '#FF0000', // red
    '#00FF00', // light-green
    '#0000FF', // blue
    '#FFFF00', // yellow
    '#00FFFF', // cyan
    '#FF00FF',  // magenta
    '#8A2BE2',  // blue-violet
    '#ff8800',  // orange
    '#0f8558',  // green
    '#00afff',  // skyblue
    '#cd6839',  // sienna
    '#f9c20cff',  //darkyellow
  ];
  const randomIndex = Math.floor(Math.random() * basicColors.length);
  return basicColors[randomIndex];
}

function toSummary() {
    document.getElementById("userfeedback_sign_up").classList.remove("d_none")
    setTimeout(() => {
    window.location.href = "summary.html";
},  2000);
}

 