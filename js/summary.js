let currentTasks = []; // I keep the board slots of the current user's tasks in here
let prios = []; // I store priorities too (not shown on the summary right now, but still useful)
let dueDates = []; // I collect due dates (only for tasks that are NOT done)

const FIREBASE_PATH = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

async function init(event) {
    const username = getUserFromLocalStorage();
    const userId = getUserIdFromLocalStorage();
    setUsername(username);
    await getTasksOfCurrentUser(userId, event);
    renderTasksToSummary();
    renderUserIcon();
    setupSummaryButtons();
}

/**
 * On the Summary page, every KPI button should take the user to the Board.
 */
function setupSummaryButtons() {
    const buttons = document.querySelectorAll('.summary-grid .summary-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'board.html';
        });
    });
}

function getUserFromLocalStorage() {
    return localStorage.getItem("username");
}

function getUserIdFromLocalStorage() {
    return localStorage.getItem("userid");
}

function setUsername(username) {
    if (!username) return;
    const el = document.getElementById("username");
    if (el) el.textContent = formatDisplayName(username);
}

// I load tasks for the logged-in user from Firebase and store everything in my local arrays
async function getTasksOfCurrentUser(userId, event) {
    safePreventDefault(event);
    resetSummaryState();
    try {
        const userTasks = await loadTasksFromFirebase();
        if (!userTasks) return;
        searchTasksForCurrentUser(userTasks, userId);
    } catch (error) {
        handleTaskLoadError(error);
    }
}

function safePreventDefault(event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
}

function resetSummaryState() {
    currentTasks = [];
    prios = [];
    dueDates = [];
}

async function loadTasksFromFirebase() {
    const response = await fetch(`${FIREBASE_PATH}.json`);
    return response.json();
}

function handleTaskLoadError(error) {
    console.error("Error while loading tasks from Firebase:", error);
    alert("Something went wrong. I couldn't load your tasks.");
}

// Here I pick the tasks where the current user is assigned
function searchTasksForCurrentUser(userTasks, userId) {
    const tasks = Object.values(userTasks || {});
    tasks.forEach(task => {
        if (!task || !task.assigned) return;
        const assigned = toAssignedArray(task.assigned);
        if (!assigned.includes(userId)) return;
        addTaskMetaToSummary(task);
    });
}

function toAssignedArray(assigned) {
    return Array.isArray(assigned) ? assigned : Object.values(assigned || {});
}

function addTaskMetaToSummary(task) {
    const slot = normalizeSlot(task.boardslot);
    currentTasks.push(slot);
    prios.push(String(task.priority || ""));
    if (slot !== "done") dueDates.push(String(task.duedate || ""));
}

function normalizeSlot(slot) {
    return String(slot || "").toLowerCase();
}

function renderTasksToSummary() {
    setText("tasks_in_board", currentTasks.length);
    setText("to_do", countBoardSlot(currentTasks, "todo"));
    setText("done", countBoardSlot(currentTasks, "done"));
    setText("tasks_in_progress", countBoardSlot(currentTasks, "progress"));
    setText("awaiting_feedback", countBoardSlot(currentTasks, "feedback"));
    setText("urgent", countDueWithinNext14Days(dueDates));
    renderUpcomingDeadline(dueDates);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function renderUpcomingDeadline(dateArr) {
    const nearest = getNearestDueDateWithinNext14Days(dateArr);
    const el = document.getElementById("upcoming_duedate");
    if (!el) return;
    el.textContent = nearest ? formatDateDE(nearest) : "—";
}

// Nearest due date within the next 14 days (including today)
function getNearestDueDateWithinNext14Days(dateArr) {
    const win = getDateWindow(14);
    const dates = getDatesInWindow(dateArr, win);
    dates.sort((a, b) => a - b);
    return dates[0] || null;
}

function countDueWithinNext14Days(dateArr) {
    const win = getDateWindow(14);
    const dates = getDatesInWindow(dateArr, win);
    return dates.length;
}

function getDateWindow(days) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    return { start, end };
}

function getDatesInWindow(dateArr, win) {
    return (dateArr || [])
        .map(parseDateOnly)
        .filter(Boolean)
        .filter(d => isWithinWindow(d, win));
}

function parseDateOnly(raw) {
    if (!raw) return null;
    const d = new Date(raw); // expected format from <input type="date">: YYYY-MM-DD
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isWithinWindow(d, win) {
    return d >= win.start && d < win.end;
}

function formatDateDE(dateObj) {
    const intl = tryFormatDateIntl(dateObj);
    if (intl) return intl;
    return formatDateFallbackDE(dateObj);
}

function tryFormatDateIntl(dateObj) {
    try {
        return new Intl.DateTimeFormat("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(dateObj);
    } catch (_) {
        return "";
    }
}

function formatDateFallbackDE(dateObj) {
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = String(dateObj.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
}

function countBoardSlot(arr, slotName) {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === slotName) count++;
    }
    return count;
}

// I capitalize each name part split by spaces (hyphens stay as-is on purpose)
function formatDisplayName(name) {
    return splitNameParts(name)
        .map(capitalizeFirstLetter)
        .join(" ");
}

function splitNameParts(name) {
    if (!name) return [];
    return String(name).trim().split(/\s+/).filter(Boolean);
}

function capitalizeFirstLetter(part) {
    return part.charAt(0).toUpperCase() + part.slice(1);
}
