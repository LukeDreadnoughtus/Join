"use strict";

function initials(user) {
  const parts = String(user || "").trim().split(/\s+/);
  const first = (parts[0] || "").charAt(0).toUpperCase();
  const second = (parts[1] || "").charAt(0).toUpperCase();
  return first + (second || "");
}

function createDot() {
  const dot = document.createElement("div");
  dot.className = "subtask-dot";
  return dot;
}

function createSpan(text) {
  const span = document.createElement("span");
  span.className = "subtask-text";
  span.textContent = text;
  return span;
}

function createButton(html, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.innerHTML = html;
  btn.onclick = onClick;
  return btn;
}

function cloneSvgIcon(sourceId, className) {
  const src = document.getElementById(sourceId);
  if (!src) return document.createElement("span");
  const node = src.cloneNode(true);
  node.removeAttribute("id");
  node.setAttribute("class", className);
  node.classList.remove("hidden", "overlay_hidden");
  return node;
}

function getSubtaskCount() {
  const ul = document.getElementById("subtask-list");
  if (!ul) return 0;
  let count = 0;
  for (const child of ul.children) {
    if (child.classList && child.classList.contains("subtask-item")) count++;
  }
  return count;
}

function rebuildLeft(left, dot, contentElement) {
  left.innerHTML = "";
  left.append(dot, contentElement);
}

function clearDivider() {
  const divider = document.getElementById("dividerSubtasks");
  if (divider) divider.classList.add("hidden");
}

function showMessage(message, type = "info") {
  const container = document.getElementById("notification-container");
  if (!container) return;
  const note = document.createElement("div");
  note.className = `notification ${type}`;
  note.textContent = message;
  container.appendChild(note);
  setTimeout(() => (note.style.animation = "fadeOut 0.3s forwards"), 2500);
  setTimeout(() => note.remove(), 3000);
}
