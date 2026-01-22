/**
 * Redirects to the registration page.
 *
 * @returns {void}
 */
function toRegistration() {
    window.location.href = "registration.html";
}

/**
 * Redirects back to the login page.
 *
 * @returns {void}
 */
function backToLogIn() {
    window.location.href = "index.html";
}

/**
 * Checks if the privacy policy checkbox is checked.
 * If so, hides related feedback and triggers field validation.
 *
 * @returns {void}
 */
function checkAllInputs() {
    const checkBox= document.getElementById("termsCheckbox")
    if (checkBox.checked) {
        document.getElementById("userfeedback_checkbox").classList.add("d_none")
        document.getElementById("checkboxhightlight").classList.remove("custom_check_highlight")
        checkAllFieldsFilled()
    } 
}

/**
 * Validates that all registration fields are filled and correctly formatted.
 *
 * @returns {boolean} True if all fields are valid, otherwise false
 */
function checkAllFieldsFilled() {
    const name = document.getElementById("name_registration").value.trim();
    const email = document.getElementById("email_registration").value.trim();
    const password = document.getElementById("password_registration").value.trim();
    const passwordConfirm = document.getElementById("password_confirm").value.trim();
    let allFilled = true;
    allFilled = checkName(name) && allFilled;
    allFilled = checkEmail(email) && allFilled;
    allFilled = checkPasswordregistration(password) && allFilled;
    allFilled = checkPasswordConfirm(passwordConfirm) && allFilled;
    allFilled = checkTwoPasswords(passwordConfirm, password) && allFilled;
    console.log("Ergebnis ALL:", allFilled);
    return allFilled;
}

function checkTwoPasswords (passwordConfirm, password) {
    if ( passwordConfirm !== password ) {
    showUserfeedback()
    return false;
    }
    return true
}

/**
 * Validates the name field; highlights in red if empty.
 *
 * @param {string} name - The entered name
 * @returns {boolean} True if valid, false otherwise
 */
function checkName (name) {
     if(!name) {
    document.getElementById("name_registration").classList.add("input_style_red")
    document.getElementById("name_registration").classList.remove("input_style")
    return false;
    }
    else return true;
}

/**
 * Validates the email field; highlights in red if empty.
 *
 * @param {string} email - The entered email
 * @returns {boolean} True if valid, false otherwise
 */
function checkEmail (email) {
    if(!email) {
    document.getElementById("email_registration").classList.add("input_style_red")
    document.getElementById("email_registration").classList.remove("input_style")
    return false;
    }
    else return true;
}

/**
 * Validates the password field; highlights in red if empty.
 *
 * @param {string} password - The entered password
 * @returns {boolean} True if valid, false otherwise
 */
function checkPasswordregistration(password) {
    if(!password) {
    document.getElementById("password_registration").classList.add("input_style_red")
    document.getElementById("password_registration").classList.remove("input_style")
    return false;
    }
    else return true;
}

/**
 * Validates the password confirmation field; highlights in red if empty.
 *
 * @param {string} passwordConfirm - The entered confirmation password
 * @returns {boolean} True if valid, false otherwise
 */
function checkPasswordConfirm(passwordConfirm) {
    if(!passwordConfirm) {
    document.getElementById("password_confirm").classList.add("input_style_red")
    document.getElementById("password_confirm").classList.remove("input_style")
    return false;
    }
    else return true;
}

/**
 * Removes the red highlight from the email input when the user starts typing,
 * and hides the "email already exists" feedback if it is shown.
 *
 * @param {Event} event - The input or keyup event
 * @returns {void}
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

/**
 * Removes the red highlight from the name input when the user starts typing.
 *
 * @param {Event} event - The input or keyup event
 * @returns {void}
 */
function checkNameField(event) {
    event.stopPropagation();
    let emailInput = document.getElementById("name_registration")
    if (emailInput.classList.contains("input_style_red")) {
    document.getElementById("name_registration").classList.add("input_style")
    document.getElementById("name_registration").classList.remove("input_style_red") }
    removeUserFeedbackCheckAllFields()
}

/**
 * Handles input events for password fields in the registration form.
 * 1) Updates visibility icons based on which field is typed in
 * 2) Removes any general user feedback
 * 3) Checks for password match and displays feedback if needed
 *
 * @param {Event} event - The input or keyup event
 * @returns {void}
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

/**
 * Shows the visibility icon for the first password field when typing.
 *
 * @param {Event} event - The input or keyup event
 * @returns {void}
 */
function showVisibilityIcon(event) {
    event.stopPropagation();
    const input = event.target
    if (!input.dataset.iconShown && input.value.length > 0) {
    document.getElementById("lock").classList.add("d_none")
    document.getElementById("visibilitynot").classList.remove("d_none")
    input.dataset.iconShown = "true";
  }
}

/**
 * Shows the visibility icon for the password confirmation field when typing.
 *
 * @param {Event} event - The input or keyup event
 * @returns {void}
 */
function showVisibilityIcon2(event) {
    event.stopPropagation();
   const input = event.target
    if (!input.dataset.iconShown && input.value.length > 0) {
    document.getElementById("lock2").classList.add("d_none")
    document.getElementById("visibilitynot2").classList.remove("d_none")
    input.dataset.iconShown = "true";
  }
}

/**
 * Removes any user feedback related to password mismatch or red borders.
 *
 * @returns {void}
 */
function checkInputUserfeedback () {
    removesAlert ()
    removesRedBorderInput()
}

/**
 * Hides the "passwords do not match" alert and restores input borders.
 *
 * @returns {void}
 */
function removesAlert () {
    let alert = document.getElementById("passwordmatch");
    if (!alert.classList.contains("d_none")) {
    document.getElementById("password_confirm").classList.add("input_style")
    document.getElementById("password_confirm").classList.remove("input_style_red")
    document.getElementById("passwordmatch").classList.add("d_none")
    }
}

/**
 * Removes red borders from password and confirmation inputs.
 *
 * @returns {void}
 */
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

/**
 * Checks if the password and confirmation match.
 * Shows feedback if they do not.
 *
 * @returns {void}
 */
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

/**
 * Displays user feedback for mismatched passwords.
 *
 * @returns {void}
 */
function showUserfeedback() {
    document.getElementById("password_confirm").classList.add("input_style_red")
    document.getElementById("password_confirm").classList.remove("input_style")
    document.getElementById("passwordmatch").classList.remove("d_none")
}

/**
 * Toggles the visibility of the first password field on icon click.
 *
 * @param {Event} event - The click event
 * @returns {void}
 */
function showPassword(event) {
    event.stopPropagation();
    document.getElementById("visibilitynot").classList.toggle("d_none")
    document.getElementById("visibility").classList.toggle("d_none")
    const input = document.getElementById("password_registration")
    input.type = input.type === "password" ? "text" : "password";
}

/**
 * Toggles the visibility of the confirmation password field on icon click.
 *
 * @param {Event} event - The click event
 * @returns {void}
 */
function showPassword2(event) {
    event.stopPropagation();
    document.getElementById("visibilitynot2").classList.toggle("d_none")
    document.getElementById("visibility2").classList.toggle("d_none")
    const input = document.getElementById("password_confirm")
    input.type = input.type === "password" ? "text" : "password";
}

/**
 * Handles user registration.
 * Steps:
 * 1) Remove previous user feedback
 * 2) Check privacy policy checkbox
 * 3) Check that all registration fields are filled
 * 4) Create user data object
 * 5) Verify email uniqueness
 * 6) Post user data to the database
 * 7) Redirect to login page
 *
 * @async
 * @param {Event} event - The form submission event
 * @returns {Promise<void>}
 */
async function registration (event) {
    event.preventDefault();
    if(checkBoxProof() === false) 
        {return}
    if (!checkAllFieldsFilled()) {
        document.getElementById("userfeedback_allFields").classList.remove("d_none")
        return}
    removeUserFeedbackCheckAllFields() 
    let userData = createUserDataObject() 
    if(await proofEmail (userData) === true) return
    await postUserData (event, userData)
    toLogIn()
}

/**
 * Removes the "all fields required" user feedback if shown.
 *
 * @returns {void}
 */
function removeUserFeedbackCheckAllFields() {
 if(!document.getElementById("userfeedback_allFields").classList.contains("d_none")) {
    document.getElementById("userfeedback_allFields").classList.add("d_none")}
}

/**
 * Checks if the privacy policy checkbox is checked.
 * Shows feedback if not.
 *
 * @returns {boolean} True if checked, false otherwise
 */
function checkBoxProof() {
    const checkBox= document.getElementById("termsCheckbox")
    if(!checkBox.checked) {
        document.getElementById("userfeedback_checkbox").classList.remove("d_none")
        document.getElementById("checkboxhightlight").classList.add("custom_check_highlight")
        return false}
    return true
}

/**
 * Creates a user data object for registration.
 *
 * @returns {{name: string, email: string, password: string, color: string}}
 */
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

/**
 * Verifies if the entered email already exists in the database.
 * Shows feedback if it exists.
 *
 * @async
 * @param {Object} userData - The registration user data
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
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

    /**
 * Posts the user data to the database.
 *
 * @async
 * @param {Event} event - The form submission event
 * @param {Object} userData - The registration user data
 * @returns {Promise<void>}
 */
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

/**
 * Returns a random color from a predefined set of colors.
 *
 * @returns {string} A hex color string
 */
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

/**
 * Redirects the new user to the login page after successful registration.
 *
 * @returns {void}
 */
function toLogIn() {
    document.getElementById("userfeedback_sign_up").classList.remove("d_none")
    setTimeout(() => {
    window.location.href = "index.html";
},  1000);
}
