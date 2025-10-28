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

function removeHighlight() {
    const checkBox= document.getElementById("checkboxhightlight")
    if (checkBox.classList.contains("custom_check_highlight")) {
        document.getElementById("userfeedback_checkbox").classList.add("d_none")
        document.getElementById("checkboxhightlight").classList.remove("custom_check_highlight")
    }
}

function CheckPasswordConfirmation () {
 // if(passwordProof() === false) {
    //     return
    // }
    // function passwordProof () {
//     const password = document.getElementById("password_registration").value.trim()
//     const passwordConfirmation = document.getElementById("password_confirm").value.trim()
//     if (password !== passwordConfirmation) {
//         alert("Die beiden Passwörter stimmen nicht überein – bitte erneut eingeben.");
//         return false;
//     }
// }

}

//Proofemail überprüfen
//JS Doku
//Userfeedback PasswortConfirmation
//Überprüfen ob alle Felder ausgefüllt wurden + Userfeedback

async function registration (event) {
     if( checkBoxProof() === false) {
        return
    }
    let userData = userData() 
    if(await proofEmail (userData) ===true) return
    await postUserData (event, userData)
    toSummary()
}

function checkBoxProof() {
    const checkBox= document.getElementById("termsCheckbox")
    if(checkBox.checked === false) {
        document.getElementById("userfeedback_checkbox").classList.remove("d_none")
        document.getElementById("checkboxhightlight").classList.add("custom_check_highlight")
        return false}
}

function userData() {
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
    const getResponse = await fetch(path + ".json");
    const users = await getResponse.json()
    if (Object.values(users ?? {}).find(u => u.email === userData.email)) {
    document.getElementById("userfeedback_email").classList.remove("d_none")
    return true}
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

 