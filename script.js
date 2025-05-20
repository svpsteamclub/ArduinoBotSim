document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.nav-button');
    const sections = document.querySelectorAll('.section');

    // Function to handle section switching
    const switchSection = (targetId) => {
        // Update buttons
        buttons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.section === targetId) {
                button.classList.add('active');
            }
        });

        // Update sections
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });
    };

    // Add click event listeners to buttons
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.dataset.section;
            switchSection(targetSection);
        });
    });

    // Handle initial state
    const initialSection = window.location.hash.slice(1) || 'home';
    switchSection(initialSection);

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const currentSection = window.location.hash.slice(1) || 'home';
        switchSection(currentSection);
    });

    // Update URL when section changes
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            window.history.pushState({}, '', `#${section}`);
        });
    });
}); 