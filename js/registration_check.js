/**
 * Checks if the password and confirmation match.
 * Shows feedback if they do not.
 *
 * @returns {void}
 */

function checkPassword() {
    const passwordInput = document.getElementById("password_registration");
    const passwordConfirm = document.getElementById("password_confirm");
    const passwordValue = passwordInput.value.trim();
    const confirmValue = passwordConfirm.value.trim();
    resetInputState(passwordConfirm, "passwordmatch");
    if (passwordValue && confirmValue) {
        if (passwordValue !== confirmValue) {
            setInputError(passwordConfirm, "passwordmatch"); 
        }
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
async function registration(event) {
    event.preventDefault();
    if (checkBoxProof() === false) { return }
    if (!checkAllFieldsFilled()) {
        document.getElementById("userfeedback_allFields").classList.remove("d_none")
        return
    }
    removeUserFeedbackCheckAllFields()
    let userData = createUserDataObject()
    if (await proofEmail(userData) === true) return
    await postUserData(event, userData)
    toLogIn()
}

/**
 * Removes the "all fields required" user feedback if shown.
 *
 * @returns {void}
 */
function removeUserFeedbackCheckAllFields() {
    if (!document.getElementById("userfeedback_allFields").classList.contains("d_none")) {
        document.getElementById("userfeedback_allFields").classList.add("d_none")
    }
}

/**
 * Checks if the privacy policy checkbox is checked.
 * Shows feedback if not.
 *
 * @returns {boolean} True if checked, false otherwise
 */
function checkBoxProof() {
    const checkBox = document.getElementById("termsCheckbox")
    if (!checkBox.checked) {
        document.getElementById("userfeedback_checkbox").classList.remove("d_none")
        document.getElementById("checkboxhightlight").classList.add("custom_check_highlight")
        return false
    }
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
async function proofEmail(userData) {
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
        document.getElementById("userfeedback_email_prooffail").classList.remove("d_none")
        return true;
    }
}

/**
* Posts the user data to the database.
*
* @async
* @param {Event} event - The form submission event
* @param {Object} userData - The registration user data
* @returns {Promise<void>}
*/
async function postUserData(event, userData) {
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
    } catch (error) {
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
        '#251d53', // darkblue
        '#124343', // darkgreen
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
    }, 1000);
}
