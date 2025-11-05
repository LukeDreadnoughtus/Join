let path = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/"

/** login-function proofs usermail and password */

async function logIn(event) {
    event.preventDefault();
    try {
        const response = await fetch(path + ".json");
        const userData = await response.json();
        proofUserData(userData)
     } catch (error) {
        console.error("Fehler beim Login:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
    }
}

/** proofUserData and save username and userid to local storage to show information in the application */

function proofUserData(userData) {
    const useremail = document.getElementById("useremail").value.trim();
    const password = document.getElementById("password").value
     for (const userKey in userData) {
        const user = userData[userKey];
        if (!user) continue;
        if (useremail === user.email && password === user.password) {
            putUserDataToLocalStorage()
            window.location.href = "summary.html";
            return
        }
    }
   setUserFeedbackFailedLogIn() 
}


function putUserDataToLocalStorage() {
    let username = user.name
    localStorage.setItem("username", `${username}`)
    localStorage.setItem("userid", `${userKey}`); //hier speichern wir auch die id für die tasks - Bei Logout dann am besten wieder rauslöschen
}

/** show userfeedback "password/username is false" and highlights input borders red */

function setUserFeedbackFailedLogIn() {
    document.getElementById("userfeedback_failedlogin").classList.remove("d_none");
    document.getElementById("useremail").classList.add("input_style_red")
    document.getElementById("password").classList.add("input_style_red")
    document.getElementById("useremail").classList.remove("input_style")
    document.getElementById("password").classList.remove("input_style")
}

/** removes shown userfeedback */

function removeUserFeedbackFailedLogIn () {
    if (!document.getElementById("userfeedback_failedlogin").classList.contains("d_none")) {
        document.getElementById("userfeedback_failedlogin").classList.add("d_none");
        document.getElementById("useremail").classList.remove("input_style_red")
        document.getElementById("password").classList.remove("input_style_red")
        document.getElementById("useremail").classList.add("input_style")
        document.getElementById("password").classList.add("input_style") }
    }

/** handles the input of password and useremail */

function handleLogin(event) {
    showVisibilityIcon3(event)
    removeUserFeedbackFailedLogIn ()
}

/** show the visibilitynot icon on a keyup-event at the passwordinput, the lockicon is hidden */

function showVisibilityIcon3(event) {
    event.stopPropagation();
   const input = event.target
    if (!input.dataset.iconShown && input.value.length > 0) {
    document.getElementById("lock3").classList.add("d_none")
    document.getElementById("visibilitynot3").classList.remove("d_none")
    input.dataset.iconShown = "true";
  }
}

/** this function shows and hides the password per clickevent on the icon visibilitynot/visibility */

function showPassword3(event) {
    event.stopPropagation();
    document.getElementById("visibilitynot3").classList.toggle("d_none")
    document.getElementById("visibility3").classList.toggle("d_none")
    const input = document.getElementById("password")
    input.type = input.type === "password" ? "text" : "password";
}

/** these functions lead to registration and also back to login */

function toRegistration() {
    window.location.href = "registration.html";
}


function backToLogIn() {
    window.location.href = "index.html";
}


/** these next functions check if the inputs are filled when die checkbox for privacy policy is checked */
function checkAllInputs() {
    const checkBox= document.getElementById("termsCheckbox")
    if (checkBox.checked) {
        document.getElementById("userfeedback_checkbox").classList.add("d_none")
        document.getElementById("checkboxhightlight").classList.remove("custom_check_highlight")
        checkAllFieldsFilled()
    } 
}


function checkAllFieldsFilled() {
    const name = document.getElementById("name_registration").value.trim();
    const email = document.getElementById("email_registration").value.trim();
    const password = document.getElementById("password_registration").value.trim();
    const passwordConfirm = document.getElementById("password_confirm").value.trim();
    let allFilled = true;
    allFilled = checkName(name) && allFilled;
    allFilled = checkEmail(email) && allFilled;
    allFilled = checkPassword(password) && allFilled;
    allFilled = checkPasswordConfirm(passwordConfirm) && allFilled;
    return allFilled;
}


function checkName (name) {
     if(!name) {
    document.getElementById("name_registration").classList.add("input_style_red")
    document.getElementById("name_registration").classList.remove("input_style")
    return false;
    }
    else return true;
}


function checkEmail (email) {
    if(!email) {
    document.getElementById("email_registration").classList.add("input_style_red")
    document.getElementById("email_registration").classList.remove("input_style")
    return false;
    }
    else return true;
}


function checkPassword(password) {
    if(!password) {
    document.getElementById("password_registration").classList.add("input_style_red")
    document.getElementById("password_registration").classList.remove("input_style")
    return false;
    }
    else return true;
}


function checkPasswordConfirm(passwordConfirm) {
    if(!passwordConfirm) {
    document.getElementById("password_confirm").classList.add("input_style_red")
    document.getElementById("password_confirm").classList.remove("input_style")
    return false;
    }
    else return true;
}

/** these functions remove (after the checkAllFieldsFilled()-function) the red-highlighted input border in case when the user starts to type in the email field and the name field
 * also the user feedback "email already exists" is removed.
*/

function checkEmailField (event) {
    event.stopPropagation();
    let emailInput = document.getElementById("email_registration")
    if (emailInput.classList.contains("input_style_red")) {
    document.getElementById("email_registration").classList.add("input_style")
    document.getElementById("email_registration").classList.remove("input_style_red") }
    if(!document.getElementById("userfeedback_email").classList.contains("d_none")) {
    document.getElementById("userfeedback_email").classList.add("d_none") }
    removeUserFeedbackCheckAllFields()
} 

function checkNameField(event) {
    event.stopPropagation();
    let emailInput = document.getElementById("name_registration")
    if (emailInput.classList.contains("input_style_red")) {
    document.getElementById("name_registration").classList.add("input_style")
    document.getElementById("name_registration").classList.remove("input_style_red") }
    removeUserFeedbackCheckAllFields()
}

/** These following functions in handlePasswordInput (event) handle the password input - while tiping into the password field - 1) it changes the icons
 *  with showVisibilityIcon(event) and showVisibilityIcon2(event), 2) also it removes userfeedback "Check all fields", if it is shown; 
 *  3)function checkInputUserfeedback() checks if there is userfeedback "passwords dont match" and red inputstyles and removes it
 *  4)checkPassword - checks if the passwords match and are the same; if not it shows userfeedback
 */


function handlePasswordInput (event) {
    event.stopPropagation();
    const input = event.target;
    if (input.id === "password_registration") {
    showVisibilityIcon(event); 
    } else if (input.id === "password_confirm") {
    showVisibilityIcon2(event); 
    }
    removeUserFeedbackCheckAllFields() 
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
    removesAlert ()
    removesRedBorderInput()
}


function removesAlert () {
    let alert = document.getElementById("passwordmatch");
    if (!alert.classList.contains("d_none")) {
    document.getElementById("password_confirm").classList.add("input_style")
    document.getElementById("password_confirm").classList.remove("input_style_red")
    document.getElementById("passwordmatch").classList.add("d_none")
    }
}


function removesRedBorderInput() {
    let redinput = document.getElementById("password_confirm")
    let userAlert = document.getElementById("password_registration")
    if (redinput.classList.contains("input_style_red")) {
    document.getElementById("password_confirm").classList.add("input_style")
    document.getElementById("password_confirm").classList.remove("input_style_red")
    }
    if (userAlert.classList.contains("input_style_red")) {
    document.getElementById("password_registration").classList.add("input_style")
    document.getElementById("password_registration").classList.remove("input_style_red")
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

/** These two functions toggle an icon on each click to show or hide the entered password in plain text. */

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

/** This function leads the registration process and is conducted when the sign up button is pressed
 * 1) removeUserFeedbackCheckAllFields() removes all userfeedback if it is shown
 * 2) checkBoxProof() checks if private policy is checked; if not there is userfeedback and the highlighted checkbox
 * 3) checkAllFieldsFilled() all fields are checked, if they are filled
 * 4) createUserDataObject() creates an object with all necessary userdata and chooses also a random color for the user
 * 5) proofEmail (userData) proofs, if this email already exists; every email can be used only once, if there exists the same email already
 * registration wont be continued and there is shown a userfeedback "Mail already exists"
 * 6) postUserData posts the userData into the database 
 * 7) toSummary() leads the new user to the dashboard
 */

async function registration (event) {
    event.preventDefault();
    removeUserFeedbackCheckAllFields() 
    if( checkBoxProof() === false) 
        {return}
    if (!checkAllFieldsFilled()) {
        document.getElementById("userfeedback_allFields").classList.remove("d_none")
        return}
    let userData = createUserDataObject() 
    if(await proofEmail (userData) === true) return
    await postUserData (event, userData)
    toSummary()
}

function removeUserFeedbackCheckAllFields() {
 if(!document.getElementById("userfeedback_allFields").classList.contains("d_none")) {
    document.getElementById("userfeedback_allFields").classList.add("d_none")}
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

 