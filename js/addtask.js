"use strict";
const ADD_TASK_PATH = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";
const ADD_TASK_PATH_REGISTER = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";

let subtaskUid = 0;

const REQUIRED_FIELD_IDS = [
  "task-title",
  "task-due-date",
  "task-priority",
  "board-slot",
  "task-category-native",
];

const MAX_SUBTASKS = 3;
const COLORS = [
  "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF",
  "#8A2BE2", "#ff8800", "#0f8558", "#00afff", "#cd6839", "#f9c20cff",
];

const HIDDEN_CLASS = "overlay_hidden";
const ACTIVE_CLASS = "overlay_active";
const editIcon = `
<svg width="19" height="19" viewBox="0 0 19 19" fill="none">
  <path d="M2 16.25H3.4L12.025 7.625L10.625 6.225L2 14.85V16.25ZM16.3 6.175L12.05 1.975L13.45 0.575C13.8333 0.191667 14.3042 0 14.8625 0C15.4208 0 15.8917 0.191667 16.275 0.575L17.675 1.975C18.0583 2.35833 18.2583 2.82083 18.275 3.3625C18.2917 3.90417 18.1083 4.36667 17.725 4.75L16.3 6.175ZM14.85 7.65L4.25 18.25H0V14L10.6 3.4L14.85 7.65Z" fill="#2A3647"/>
</svg>`;
const deleteIcon = `
<svg width="16" height="18" viewBox="0 0 16 18" fill="none">
  <path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.47917 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3Z" fill="#2A3647"/>
</svg>`;
