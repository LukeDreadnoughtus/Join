let currentDraggedTask;

/**
 * Starts the drag process for a task card.
 * Stores the dragged task ID, marks the element as dragging
 * and sets a custom drag image.
 *
 * @param {DragEvent} event - The drag start event
 * @param {string|number} id - ID of the dragged task
 */
function startDragging(event, id) {
    currentDraggedTask = id;

    const original = event.currentTarget;
    markAsDragging(original);

    const wrapper = createDragImageWrapper(original);
    const clone = createDragImageClone(original);

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    setCustomDragImage(event, wrapper);
    cleanupDragImage(wrapper);
}

/**
 * Adds the visual dragging state to an element.
 *
 * @param {HTMLElement} element - The element being dragged
 */
function markAsDragging(element) {
    element.classList.add("dragging");
}

/**
 * Creates an invisible wrapper used as a custom drag image.
 *
 * @param {HTMLElement} original - The original dragged element
 * @returns {HTMLDivElement} Wrapper element for the drag image
 */
function createDragImageWrapper(original) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = "-9999px";
    wrapper.style.left = "-9999px";
    wrapper.style.width = `${original.offsetWidth}px`;
    wrapper.style.height = `${original.offsetHeight}px`;
    wrapper.style.borderRadius = "24px";
    wrapper.style.overflow = "hidden"; // 🔥 important fix
    wrapper.style.backgroundColor = "#FFFFFF";
    return wrapper;
}

/**
 * Creates a visual clone of the dragged element
 * used inside the custom drag image.
 *
 * @param {HTMLElement} original - The original dragged element
 * @returns {HTMLElement} Cloned element
 */
function createDragImageClone(original) {
    const clone = original.cloneNode(true);
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.opacity = "1";
    clone.style.boxShadow = "0px 8px 20px rgba(0,0,0,0.25)";
    clone.style.backgroundColor = "#FFFFFF";
    return clone;
}

/**
 * Sets a custom drag image for the drag event.
 *
 * @param {DragEvent} event - The drag event
 * @param {HTMLElement} wrapper - Wrapper containing the drag image
 */
function setCustomDragImage(event, wrapper) {
    event.dataTransfer.setDragImage(
        wrapper,
        wrapper.offsetWidth / 2,
        wrapper.offsetHeight / 2
    );
}

/**
 * Removes the temporary drag image wrapper
 * after the drag image has been set.
 *
 * @param {HTMLElement} wrapper - Wrapper to be removed
 */
function cleanupDragImage(wrapper) {
    setTimeout(() => wrapper.remove(), 0);
}

/**
 * Handles drag-over behavior for a board column
 * and enables dropping.
 *
 * @param {DragEvent} event - The drag over event
 * @param {string} slot - Target board slot ID
 */
function onDragOverColumn(event, slot) {
    event.preventDefault();
    highlightDragArea(slot);
}

/**
 * Moves the currently dragged task to a new board slot,
 * updates Firebase and re-renders the board.
 *
 * @param {string} slot - Target board slot
 * @param {Event} event - Triggering event
 */
async function moveTo (slot, event) {
const taskId = currentDraggedTask;
allTasks[taskId].boardSlot = slot
removeHighlight(slot);
await updateBoardSlotInFirebase(taskId, slot) 
renderBoardBasics()
await init(event)
}

/**
 * Updates the board slot of a task in Firebase.
 *
 * @param {string|number} taskId - Task ID
 * @param {string} slot - New board slot
 */
async function updateBoardSlotInFirebase(taskId, slot) {
    const url = `${path}/${taskId}.json`;
    await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({boardslot: slot})
    });
}

/**
 * Handles drag leave behavior for a column
 * and removes highlight if the pointer leaves the column.
 *
 * @param {DragEvent} event - The drag leave event
 * @param {string} slot - Board slot ID
 */
function onDragLeaveColumn(event, slot) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
        removeHighlight(slot);
    }
}

/**
 * Highlights a board column as a valid drop target.
 *
 * @param {string} slot - Board slot ID
 */
function highlightDragArea(slot) { //idslot
document.getElementById(slot).classList.add("drag_area_hightlight")
}

/**
 * Removes the drag highlight from a board column.
 *
 * @param {string} slot - Board slot ID
 */
function removeHighlight(slot) { //idslot
document.getElementById(slot).classList.remove("drag_area_hightlight")
}

/**
 * Removes the dragging state from the dragged element.
 *
 * @param {DragEvent} event - The drag end event
 */
function stopDragging(event) {
    event.currentTarget.classList.remove("dragging");
}

