let path = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/"

/**
 * Animates the splash logo on the login page.
 * 
 * The splash logo starts centered in the viewport with a larger scale,
 * then smoothly flies to the login logo's position while scaling down to match its size.
 * After the animation completes, the splash overlay is hidden.
 *
 * This function is responsive: it reads the login logo's current size and position
 * using getBoundingClientRect(), so the animation works correctly on all screen sizes
 * including responsive breakpoints (e.g., below 540px).
 *
 * @listens DOMContentLoaded
 * @returns {void}
 */

window.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash_screen');
    const logo = document.getElementById('splash_logo');
    const loginLogo = document.querySelector('.login_icon');
    
       if (!splash || !logo || !loginLogo) {
        return;
    }
    const rect = loginLogo.getBoundingClientRect();
    const loginWidth = rect.width;
    const loginHeight = rect.height;
    const startX = window.innerWidth / 2 - loginWidth / 2;
    const startY = window.innerHeight / 2 - loginHeight / 2;
    const startScale = 1.5;
    logo.style.transform = `translate(${startX}px, ${startY}px) scale(${startScale})`;
    logo.style.width = `${loginWidth}px`;
    logo.style.height = `${loginHeight}px`;
    logo.style.transition = 'transform 1s ease-in-out';
    setTimeout(() => {
        logo.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(1)`;
    }, 200);
    setTimeout(() => {
        splash.classList.add('hidden');
    }, 1200);
});

/**
 * Handles the login process by verifying user email and password.
 * Prevents the default form submission and fetches user data from the database.
 *
 * @async
 * @param {Event} event - The form submission event
 * @returns {Promise<void>}
 */

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

function logInGuest(event) {
    event.preventDefault();
    localStorage.setItem("username", `Guest`)
    localStorage.setItem("userid", `Guest`)
    rememberUserForCombinedSummary('Guest');
    sessionStorage.setItem("summary_greeting_overlay", "1");
    window.location.href = "summary.html";
}

/**
 * Verifies the entered user credentials against the fetched user data.
 * If successful, stores the username, user ID, and color in localStorage
 * and redirects to the summary page. Otherwise, shows a failed login feedback.
 *
 * @param {Object} userData - The fetched user data from the database
 * @returns {void}
 */
function proofUserData(userData) {
    const useremail = document.getElementById("useremail").value.trim();
    const password = document.getElementById("password").value
     for (const userKey in userData) {
        const user = userData[userKey];
        if (!user) continue;
        if (useremail === user.email && password === user.password) {
            let username = user.name
            localStorage.setItem("username", `${username}`)
            localStorage.setItem("userid", `${userKey}`)
            localStorage.setItem("usercolor", `${user.color}`)
            rememberUserForCombinedSummary(String(userKey));
            // Flag for summary greeting overlay: show it only once, right after login.
            sessionStorage.setItem("summary_greeting_overlay", "1");
            window.location.href = "summary.html";
            return
        }
    }
   setUserFeedbackFailedLogIn() 
}

function rememberUserForCombinedSummary(userId) {
    //hier ausblenden
    // ich pack hier einfach alle userIds rein, damit die summary später die kombi anzeigen kann
    // falls das mal nervt: key ist 'known_userids' im localStorage
    if (!userId) return;
    const KEY = 'known_userids';
    const existing = safeParseJSON(localStorage.getItem(KEY), []);
    const list = Array.isArray(existing) ? existing : [];
    if (!list.includes(userId)) list.push(userId);
    localStorage.setItem(KEY, JSON.stringify(list));
}

function safeParseJSON(raw, fallback) {
    //hier ausblenden
    // kleine absicherung, weil ich kein bock auf JSON crashes hab
    try {
        return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
        return fallback;
    }
}

/**
 * Displays the "failed login" feedback and highlights email/password inputs in red.
 *
 * @returns {void}
 */
function setUserFeedbackFailedLogIn() {
    document.getElementById("userfeedback_failedlogin").classList.remove("d_none");
    document.getElementById("useremail").classList.add("input_style_red")
    document.getElementById("password").classList.add("input_style_red")
    document.getElementById("useremail").classList.remove("input_style")
    document.getElementById("password").classList.remove("input_style")
}


/**
 * Removes the "failed login" feedback and restores the input styles to normal.
 *
 * @returns {void}
 */
function removeUserFeedbackFailedLogIn () {
    if (!document.getElementById("userfeedback_failedlogin").classList.contains("d_none")) {
        document.getElementById("userfeedback_failedlogin").classList.add("d_none");
        document.getElementById("useremail").classList.remove("input_style_red")
        document.getElementById("password").classList.remove("input_style_red")
        document.getElementById("useremail").classList.add("input_style")
        document.getElementById("password").classList.add("input_style") }
    }

/**
 * Handles input events for the login form.
 * Shows visibility icon and removes any failed login feedback.
 *
 * @param {Event} event - The input or keyup event
 * @returns {void}
 */
function handleLogin(event) {
    showVisibilityIcon3(event)
    removeUserFeedbackFailedLogIn ()
}

/**
 * Shows the visibility icon on the password input after typing.
 *
 * @param {Event} event - The keyup event on the password input
 * @returns {void}
 */
function showVisibilityIcon3(event) {
    event.stopPropagation();
   const input = event.target
    if (!input.dataset.iconShown && input.value.length > 0) {
    document.getElementById("lock3").classList.add("d_none")
    document.getElementById("visibilitynot3").classList.remove("d_none")
    input.dataset.iconShown = "true";
  }
}

/**
 * Toggles password visibility when clicking the visibility icon.
 *
 * @param {Event} event - The click event on the visibility icon
 * @returns {void}
 */
function showPassword3(event) {
    event.stopPropagation();
    document.getElementById("visibilitynot3").classList.toggle("d_none")
    document.getElementById("visibility3").classList.toggle("d_none")
    const input = document.getElementById("password")
    input.type = input.type === "password" ? "text" : "password";
}

/**
 * Handles live validation for the login email input field.
 *
 * - Resets error styling while the user is typing
 * - Hides generic "required field" feedback
 * - Validates the email format once input is present
 * - Applies error styling if the email format is invalid
 *
 * @param {Event} event - The input or keyup event triggered by the login email field
 * @returns {void}
 */

function checkLoginEmailField(event) {
    const emailInput = event.target;                
    const emailValue = emailInput.value.trim();
    resetInputState(emailInput, "emailcheck");
    if (emailValue.length > 0 && !isValidEmail(emailValue)) {
        setInputError(emailInput, "emailcheck"); 
    }
}

 