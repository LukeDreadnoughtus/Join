const lowBtn = document.getElementById('low');
const mediumBtn = document.getElementById('medium');
const urgentBtn = document.getElementById('urgent');

lowBtn.addEventListener('click', () => {
  setActivePriority(lowBtn);
});

mediumBtn.addEventListener('click', () => {
  setActivePriority(mediumBtn);
});

urgentBtn.addEventListener('click', () => {
  setActivePriority(urgentBtn);
});

function setActivePriority(activeBtn) {
  const priorityButtons = [lowBtn, mediumBtn, urgentBtn];
  priorityButtons.forEach(btn => {
    if (btn !== activeBtn) {
      btn.classList.remove('active');
    }
  });
  activeBtn.classList.toggle('active');
}