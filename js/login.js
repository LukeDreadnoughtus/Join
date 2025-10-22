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
     for (let i = 1; i< Object.keys(userData).length; i++) {
        let userKey = "user" + i;
        let user = userData[userKey]

        if (!user) continue;

        if (username === user.name && password === user.password) {
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


async function registration (event) {
    event.preventDefault();
    const name = document.getElementById("name_registration").value.trim();
    const email = document.getElementById("email_registration").value.trim()
    const password = document.getElementById("password_registration").value.trim()
    const passwordConfirmation = document.getElementById("password_confirm").value.trim()

    if (password !== passwordConfirmation) {
        alert("Die beiden Passwörter stimmen nicht überein – bitte erneut eingeben.");
        return;
    }

    const userData = {
        name: name,
        email: email,
        password: password,
        color: getUserColor()
    };

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
        alert("Registrierung erfolgreich!");
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

 