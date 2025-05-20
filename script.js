document.addEventListener('DOMContentLoaded', () => {
    const environmentCards = document.querySelectorAll('.environment-card');

    environmentCards.forEach(card => {
        card.addEventListener('click', () => {
            const environment = card.dataset.environment;
            console.log(`Selected environment: ${environment}`);
            // TODO: Implement environment switching logic
        });
    });
}); 