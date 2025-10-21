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