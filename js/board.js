function openAddTaskOverlay() {
    document.getElementById("taskCreateButton").addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        overlay.classList.remove("hidden");
    });
    document.getElementById("overlay").addEventListener("click", (e) => {
        if (e.target.id === "overlay") e.target.classList.add("hidden");
    });
}



openAddTaskOverlay();