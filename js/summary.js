let currentTasks = []; 
// - Stores the current user's task board slots (e.g., "todo", "progress", "done") so the summary can count them fast.
// - Basically my local “snapshot” of where each of my tasks sits on the board right now.

let prios = []; 
// - Keeps the priority values for the tasks I loaded, even if I’m not displaying them on the summary yet.
// - Handy for later features (sorting, badges, filters) without needing another Firebase request.

let dueDates = []; 
// - Collects only due dates from tasks that aren’t finished, so “urgent” numbers make sense.
// - Avoids counting deadlines from completed tasks (otherwise the KPI would be misleading).

const FIREBASE_PATH = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

async function init(event) {
  // - Entry point for the summary page: loads user info, fetches tasks, then updates the UI.
  // - Runs the whole “boot sequence” so everything is ready before the user clicks around.
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
  // - Finds all KPI buttons and wires them so a click always goes to the board page.
  // - Makes the summary act like a dashboard: every tile is basically a shortcut.
  const buttons = document.querySelectorAll('.summary-grid .summary-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'board.html';
    });
  });
}

function getUserFromLocalStorage() {
  // - Reads the saved username from localStorage so I don’t need to ask Firebase for it.
  // - Simple helper to keep init() clean and avoid repeating localStorage logic.
  return localStorage.getItem("username");
}

function getUserIdFromLocalStorage() {
  // - Grabs the logged-in user's id from localStorage (used for filtering assigned tasks).
  // - I keep it separate from username because the ID is the real unique key.
  return localStorage.getItem("userid");
}

function setUsername(username) {
  // - Writes the username into the UI (if it exists) so the summary feels personalized.
  // - Also runs formatting so names look clean (capitalized parts, trimmed spaces).
  if (!username) return;
  const el = document.getElementById("username");
  if (el) el.textContent = formatDisplayName(username);
}

async function getTasksOfCurrentUser(userId, event) {
  // - Loads the full tasks object from Firebase, then filters down to tasks assigned to the current user.
  // - Resets the summary state first so I don’t accidentally mix old data with fresh data.
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
  // - Stops default browser behavior only if this was triggered by a real event object.
  // - Prevents crashes if init() is called without an event (so it’s “safe” to call anytime).
  if (event && typeof event.preventDefault === "function") event.preventDefault();
}

function resetSummaryState() {
  // - Clears the arrays so the summary always starts from a clean slate.
  // - Prevents duplicate counting if I reload or re-run init().
  currentTasks = [];
  prios = [];
  dueDates = [];
}

async function loadTasksFromFirebase() {
  // - Fetches all tasks from Firebase in one request (Realtime Database JSON endpoint).
  // - Returns the parsed JSON so other functions can decide how to filter/use it.
  const response = await fetch(`${FIREBASE_PATH}.json`);
  return response.json();
}

function handleTaskLoadError(error) {
  // - Central error handler so I don’t repeat console + alert logic everywhere.
  // - Shows a user-friendly message but still logs the technical error for debugging.
  console.error("Error while loading tasks from Firebase:", error);
  alert("Something went wrong. I couldn't load your tasks.");
}

function searchTasksForCurrentUser(userTasks, userId) {
  // - Loops over every task and keeps only the ones where the current userId is in assigned[].
  // - Builds the summary arrays (slots, priorities, due dates) while scanning the tasks once.
  const tasks = Object.values(userTasks || {});
  tasks.forEach(task => {
    if (!task || !task.assigned) return;
    const assigned = toAssignedArray(task.assigned);
    if (!assigned.includes(userId)) return;
    addTaskMetaToSummary(task);
  });
}

function toAssignedArray(assigned) {
  // - Normalizes assigned data into a real array (because Firebase can store arrays or objects).
  // - Makes the rest of the code consistent so I can always use includes().
  return Array.isArray(assigned) ? assigned : Object.values(assigned || {});
}

function addTaskMetaToSummary(task) {
  // - Extracts only what the summary needs (board slot, priority, due date) and stores it locally.
  // - Skips due dates for "done" tasks so urgency stats don’t get polluted.
  const slot = normalizeSlot(task.boardslot);
  currentTasks.push(slot);
  prios.push(String(task.priority || ""));
  if (slot !== "done") dueDates.push(String(task.duedate || ""));
}

function normalizeSlot(slot) {
  // - Forces slot values into a predictable lowercase string ("ToDo" -> "todo", null -> "").
  // - Prevents summary counters from failing due to inconsistent casing.
  return String(slot || "").toLowerCase();
}

function renderTasksToSummary() {
  // - Updates all KPI numbers on the summary page based on the local arrays.
  // - One function to render everything so I don’t spread UI updates all over the code.
  setText("tasks_in_board", currentTasks.length);
  setText("to_do", countBoardSlot(currentTasks, "todo"));
  setText("done", countBoardSlot(currentTasks, "done"));
  setText("tasks_in_progress", countBoardSlot(currentTasks, "progress"));
  setText("awaiting_feedback", countBoardSlot(currentTasks, "feedback"));
  setText("urgent", countDueWithinNext14Days(dueDates));
  renderUpcomingDeadline(dueDates);
}

function setText(id, value) {
  // - Tiny helper to set an element’s content without repeating getElementById checks.
  // - Keeps the render functions clean and avoids errors if an element is missing.
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function renderUpcomingDeadline(dateArr) {
  // - Finds the nearest upcoming deadline (within 14 days) and prints it in the UI.
  // - Shows a dash if nothing is due soon, so the user doesn’t see junk/empty strings.
  const nearest = getNearestDueDateWithinNext14Days(dateArr);
  const el = document.getElementById("upcoming_duedate");
  if (!el) return;
  el.textContent = nearest ? formatDateDE(nearest) : "—";
}

// Nearest due date within the next 14 days (including today)
function getNearestDueDateWithinNext14Days(dateArr) {
  // - Filters due dates to the next 14 days and returns the earliest one.
  // - Useful for a quick “what’s next” deadline without listing everything.
  const win = getDateWindow(14);
  const dates = getDatesInWindow(dateArr, win);
  dates.sort((a, b) => a - b);
  return dates[0] || null;
}

function countDueWithinNext14Days(dateArr) {
  // - Counts how many due dates fall inside the next 14-day window.
  // - Powers the “urgent” KPI so it’s literally just “due soon” tasks.
  const win = getDateWindow(14);
  const dates = getDatesInWindow(dateArr, win);
  return dates.length;
}

function getDateWindow(days) {
  // - Builds a clean date range starting today at 00:00 up to N days ahead.
  // - Using midnight dates avoids weird time-zone/time-of-day edge cases.
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return { start, end };
}

function getDatesInWindow(dateArr, win) {
  // - Converts raw date strings into Date objects and keeps only valid ones inside the window.
  // - It’s basically: parse -> remove invalid -> filter by range.
  return (dateArr || [])
    .map(parseDateOnly)
    .filter(Boolean)
    .filter(d => isWithinWindow(d, win));
}

function parseDateOnly(raw) {
  // - Parses a date string (expected from <input type="date">) into a Date at midnight.
  // - Returns null if the value is missing or invalid so the caller can filter it out.
  if (!raw) return null;
  const d = new Date(raw); // expected format from <input type="date">: YYYY-MM-DD
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isWithinWindow(d, win) {
  // - Checks if a date is inside the window (start inclusive, end exclusive).
  // - End-exclusive avoids double counting if I chain windows later.
  return d >= win.start && d < win.end;
}

function formatDateDE(dateObj) {
  // - Formats a Date in German format (dd.mm.yyyy), using Intl if possible.
  // - Falls back to manual formatting if Intl isn’t available for some reason.
  const intl = tryFormatDateIntl(dateObj);
  if (intl) return intl;
  return formatDateFallbackDE(dateObj);
}

function tryFormatDateIntl(dateObj) {
  // - Tries the proper Intl formatter first (cleaner + locale-aware).
  // - If Intl fails (old browser / weird environment), returns an empty string to trigger fallback.
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
  // - Manual dd.mm.yyyy formatting, just in case Intl.DateTimeFormat isn’t working.
  // - Pads day/month to two digits so it always looks consistent.
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = String(dateObj.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

function countBoardSlot(arr, slotName) {
  // - Counts how often a specific slot string appears in the array.
  // - Simple loop on purpose: fast + no extra allocations like filter().
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === slotName) count++;
  }
  return count;
}

function formatDisplayName(name) {
  // - Splits the name into parts and capitalizes each part (e.g., "max mustermann" -> "Max Mustermann").
  // - Keeps hyphenated names intact because I only split by spaces.
  return splitNameParts(name)
    .map(capitalizeFirstLetter)
    .join(" ");
}

function splitNameParts(name) {
  // - Turns a name string into clean parts by trimming and splitting by whitespace.
  // - Filters empty chunks so multiple spaces don’t create weird blank “words”.
  if (!name) return [];
  return String(name).trim().split(/\s+/).filter(Boolean);
}

function capitalizeFirstLetter(part) {
  // - Uppercases the first character and keeps the rest as-is.
  // - Quick and readable, and good enough for typical display names.
  return part.charAt(0).toUpperCase() + part.slice(1);
}
