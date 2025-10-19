async function logIn() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value
    let resultUserName = await fetch ()
    let resultPassword = await fetch ()
    let currentUserName = await response.json()
    let currentPassword = await response.json()
if (username === currentUserName && password === currentPassword) {
    window.location.href = "summary.html";
    }
    else {
      alert("Dein Passwort und/oder dein eingegebener Benutzername stimmen nicht.");
    }
}


function toRegistration() {
    window.location.href = "registration.html";
}