function openAddTaskOverlay() {
    document.getElementById("taskCreateButton").addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        overlay.classList.remove("overlay_hidden");
    });
    document.getElementById("overlay").addEventListener("click", (e) => {
        if (e.target.id === "overlay") e.target.classList.add("overlay_hidden");
    });
}

openAddTaskOverlay();