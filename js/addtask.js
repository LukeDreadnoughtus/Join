const buttons = document.querySelectorAll('.priority-btn');
const hiddenInput = document.getElementById('task-priority');

buttons.forEach(button => {
    button.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        hiddenInput.value = button.dataset.value;
    });
});