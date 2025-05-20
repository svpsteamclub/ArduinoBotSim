document.addEventListener('DOMContentLoaded', () => {
    const environmentButtons = document.querySelectorAll('.env-btn');

    environmentButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const environment = btn.dataset.environment;
            console.log(`Selected environment: ${environment}`);
            // TODO: Implement environment switching logic
        });
    });
}); 