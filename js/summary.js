/**
 * - Stores the current task board slots for the loaded summary data.
 * - Acts as a local snapshot for fast KPI counting on the summary page.
 */
let currentTasks = [];

/**
 * - Stores priority values for the loaded tasks.
 * - Keeps the data available for future sorting, filtering, or badge features.
 */
let prios = [];

/**
 * - Stores due dates from tasks that are not marked as done.
 * - Keeps urgency calculations focused on still-relevant deadlines.
 */
let dueDates = [];

/**
 * - Defines the Firebase Realtime Database base path for task loading.
 * - Centralizes the endpoint so fetch logic stays easy to maintain.
 */
const FIREBASE_PATH =
  "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

/**
 * - Serves as the entry point for the summary page setup.
 * - Loads user-related task data, then updates all summary UI elements.
 * - Connects interactive summary buttons after the page state is ready.
 */
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
 * - Finds all KPI buttons on the summary page.
 * - Attaches click handlers so each button navigates to the board page.
 */
function setupSummaryButtons() {
  const buttons = document.querySelectorAll(".summary-grid .summary-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = "board.html";
    });
  });
}

/**
 * - Reads the saved username from localStorage.
 * - Keeps user lookup logic separate from the init flow for cleaner code.
 */
function getUserFromLocalStorage() {
  return localStorage.getItem("username");
}

/**
 * - Reads the saved user id from localStorage.
 * - Returns the unique identifier used for task-related logic.
 */
function getUserIdFromLocalStorage() {
  return localStorage.getItem("userid");
}

/**
 * - Writes the current username into the summary UI.
 * - Applies display-name formatting before rendering the value.
 */
function setUsername(username) {
  if (!username) return;
  const el = document.getElementById("username");
  if (el) el.textContent = formatDisplayName(username);
}

/**
 * - Prevents default browser behavior when a valid event object exists.
 * - Allows the init flow to run safely even when no event was passed in.
 */
function safePreventDefault(event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
}

/**
 * - Clears all local summary arrays before fresh task data is processed.
 * - Prevents duplicated counts when the summary is reloaded.
 */
function resetSummaryState() {
  currentTasks = [];
  prios = [];
  dueDates = [];
}

/**
 * - Loads all tasks from Firebase for the current summary refresh.
 * - Resets summary state before scanning the returned task data.
 * - Passes any loading errors to the shared error handler.
 */
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

/**
 * - Fetches the full task dataset from Firebase.
 * - Returns the parsed JSON response for later filtering and processing.
 */
async function loadTasksFromFirebase() {
  const response = await fetch(`${FIREBASE_PATH}.json`);
  return response.json();
}

/**
 * - Handles Firebase loading errors in one central place.
 * - Logs the technical error and shows a user-friendly alert message.
 */
function handleTaskLoadError(error) {
  console.error("Error while loading tasks from Firebase:", error);
  alert("Something went wrong. I couldn't load your tasks.");
}

/**
 * - Scans all loaded tasks and adds each one to the summary data.
 * - Ignores the passed userId so the summary always shows all tasks.
 * - Keeps board slot logic intact while removing user-based filtering.
 */
function searchTasksForCurrentUser(userTasks, userId) {
  const tasks = Object.values(userTasks || {});
  tasks.forEach((task) => {
    if (!task) return;
    addTaskMetaToSummary(task);
  });
}

/**
 * - Combines previously known user ids from localStorage with the current one.
 * - Ensures the active user id is always included in the returned list.
 * - Removes duplicates and empty values before returning the final array.
 */
function getCombinedSummaryUserIds(currentUserId) {
  const KEY = "known_userids";
  const raw = localStorage.getItem(KEY);
  const list = safeParseJSON(raw, []);
  const ids = Array.isArray(list) ? list.slice() : [];

  if (currentUserId && !ids.includes(currentUserId)) ids.push(currentUserId);
  if (currentUserId === "Guest" && !ids.includes("Guest")) ids.push("Guest");

  return Array.from(new Set(ids.filter(Boolean)));
}

/**
 * - Checks whether any user id from one array exists in the assigned array.
 * - Returns early as soon as a matching id is found.
 */
function hasAnyUserId(assignedArr, userIds) {
  for (let i = 0; i < userIds.length; i++) {
    if (assignedArr.includes(userIds[i])) return true;
  }
  return false;
}

/**
 * - Safely parses JSON input from storage or other string sources.
 * - Returns the provided fallback value when parsing fails.
 */
function safeParseJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

/**
 * - Normalizes assigned task data into a plain array.
 * - Supports both array-based and object-based Firebase structures.
 */
function toAssignedArray(assigned) {
  return Array.isArray(assigned) ? assigned : Object.values(assigned || {});
}

/**
 * - Extracts the slot, priority, and due date from a single task.
 * - Stores only the summary-relevant data in local arrays.
 * - Skips due dates for done tasks to keep urgency metrics accurate.
 */
function addTaskMetaToSummary(task) {
  const slot = normalizeSlot(task.boardslot);
  currentTasks.push(slot);
  prios.push(String(task.priority || ""));
  if (slot !== "done") dueDates.push(String(task.duedate || ""));
}

/**
 * - Converts a board slot value into a normalized lowercase string.
 * - Protects summary logic from null values and inconsistent casing.
 */
function normalizeSlot(slot) {
  return String(slot || "").toLowerCase();
}

/**
 * - Renders all KPI values for the summary page in one place.
 * - Updates counters for board slots, urgency, and upcoming deadlines.
 */
function renderTasksToSummary() {
  setText("tasks_in_board", currentTasks.length);
  setText("to_do", countBoardSlot(currentTasks, "todo"));
  setText("done", countBoardSlot(currentTasks, "done"));
  setText("tasks_in_progress", countBoardSlot(currentTasks, "progress"));
  setText("awaiting_feedback", countBoardSlot(currentTasks, "feedback"));
  setText("urgent", countDueWithinNext14Days(dueDates));
  renderUpcomingDeadline(dueDates);
}

/**
 * - Writes a value into an element identified by its id.
 * - Skips the update safely when the target element does not exist.
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

/**
 * - Finds the nearest due date inside the next 14-day window.
 * - Renders a formatted date or a dash when nothing is due soon.
 */
function renderUpcomingDeadline(dateArr) {
  const nearest = getNearestDueDateWithinNext14Days(dateArr);
  const el = document.getElementById("upcoming_duedate");
  if (!el) return;
  el.textContent = nearest ? formatDateDE(nearest) : "—";
}

/**
 * - Returns the earliest valid due date inside the next 14 days.
 * - Sorts matching dates so the closest upcoming one can be selected.
 */
function getNearestDueDateWithinNext14Days(dateArr) {
  const win = getDateWindow(14);
  const dates = getDatesInWindow(dateArr, win);
  dates.sort((a, b) => a - b);
  return dates[0] || null;
}

/**
 * - Counts how many valid due dates fall inside the next 14 days.
 * - Powers the urgent KPI on the summary page.
 */
function countDueWithinNext14Days(dateArr) {
  const win = getDateWindow(14);
  const dates = getDatesInWindow(dateArr, win);
  return dates.length;
}

/**
 * - Creates a clean date window starting today at midnight.
 * - Returns start and end boundaries for date-based filtering.
 */
function getDateWindow(days) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return { start, end };
}

/**
 * - Parses raw date strings into Date objects.
 * - Removes invalid values and keeps only dates inside the given window.
 */
function getDatesInWindow(dateArr, win) {
  return (dateArr || [])
    .map(parseDateOnly)
    .filter(Boolean)
    .filter((d) => isWithinWindow(d, win));
}

/**
 * - Parses a raw date string into a Date object at midnight.
 * - Returns null for missing or invalid input values.
 */
function parseDateOnly(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * - Checks whether a date is inside the provided date window.
 * - Uses an inclusive start and exclusive end boundary.
 */
function isWithinWindow(d, win) {
  return d >= win.start && d < win.end;
}

/**
 * - Formats a Date object in German date format.
 * - Uses Intl first and falls back to manual formatting when needed.
 */
function formatDateDE(dateObj) {
  const intl = tryFormatDateIntl(dateObj);
  if (intl) return intl;
  return formatDateFallbackDE(dateObj);
}

/**
 * - Attempts locale-aware date formatting with Intl.DateTimeFormat.
 * - Returns an empty string when the formatter is unavailable or fails.
 */
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

/**
 * - Formats a Date object manually as dd.mm.yyyy.
 * - Pads day and month values so the output stays consistent.
 */
function formatDateFallbackDE(dateObj) {
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = String(dateObj.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * - Counts how often a specific board slot appears in an array.
 * - Uses a simple loop for predictable and lightweight counting.
 */
function countBoardSlot(arr, slotName) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === slotName) count++;
  }
  return count;
}

/**
 * - Formats a display name by capitalizing each name part.
 * - Rebuilds the final string with normalized spacing.
 */
function formatDisplayName(name) {
  return splitNameParts(name).map(capitalizeFirstLetter).join(" ");
}

/**
 * - Splits a name string into clean whitespace-separated parts.
 * - Removes empty segments caused by leading, trailing, or repeated spaces.
 */
function splitNameParts(name) {
  if (!name) return [];
  return String(name).trim().split(/\s+/).filter(Boolean);
}

/**
 * - Capitalizes the first character of a single name part.
 * - Leaves the remaining characters unchanged.
 */
function capitalizeFirstLetter(part) {
  return part.charAt(0).toUpperCase() + part.slice(1);
}