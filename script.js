document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.nav-button');
    const sections = document.querySelectorAll('.section');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navButtons = document.querySelector('.nav-buttons');

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

        // Close mobile menu after selection
        if (window.innerWidth <= 768) {
            navButtons.classList.remove('active');
            mobileMenuButton.classList.remove('active');
        }
    };

    // Add click event listeners to buttons
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.dataset.section;
            switchSection(targetSection);
        });
    });

    // Mobile menu toggle
    mobileMenuButton.addEventListener('click', () => {
        navButtons.classList.toggle('active');
        mobileMenuButton.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !e.target.closest('.nav-buttons') && 
            !e.target.closest('.mobile-menu-button') &&
            navButtons.classList.contains('active')) {
            navButtons.classList.remove('active');
            mobileMenuButton.classList.remove('active');
        }
    });

    // Handle initial state
    const initialSection = window.location.hash.slice(1) || 'simulador';
    switchSection(initialSection);

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const currentSection = window.location.hash.slice(1) || 'simulador';
        switchSection(currentSection);
    });

    // Update URL when section changes
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            window.history.pushState({}, '', `#${section}`);
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navButtons.classList.remove('active');
            mobileMenuButton.classList.remove('active');
        }
    });
});

// Canvas setup
const canvas = document.getElementById('pistaCanvas');
const ctx = canvas.getContext('2d');
const CELL_SIZE = 350; // Size of each cell in pixels
let currentSize = 3; // Default size
let scale = 1; // Scale factor for the canvas

// Function to calculate the appropriate scale
function calculateScale(size) {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasSize = size * CELL_SIZE;
    
    // Calculate scale based on both width and height
    const scaleX = containerWidth / canvasSize;
    const scaleY = containerHeight / canvasSize;
    
    // Use the smaller scale to ensure the canvas fits both dimensions
    return Math.min(scaleX, scaleY);
}

// Function to resize canvas based on selected size
function resizeCanvas(size) {
    const canvasSize = size * CELL_SIZE;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    scale = calculateScale(size);
    drawGrid(size);
    createCanvasCells(size);
}

// Function to draw the grid
function drawGrid(size) {
    const canvasSize = size * CELL_SIZE;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    
    // Set grid line style
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Draw vertical lines
    for (let i = 1; i < size; i++) {
        const x = i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 1; i < size; i++) {
        const y = i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize, y);
        ctx.stroke();
    }
}

// Handle size selection
document.querySelectorAll('.dropdown-content a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const size = parseInt(e.target.dataset.size);
        currentSize = size;
        resizeCanvas(size);
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas(currentSize);
});

// Track parts handling
const partsList = document.querySelector('.parts-list');
let trackParts = [];
let selectedPart = null;
let selectedCell = null;
let canvasCells = [];
let placedParts = new Map(); // Map to store placed parts: cellIndex -> partName

// Static list of track parts
const TRACK_PARTS = [
    'C0.00-BCS.png',
    'C1.01-RCS.png',
    'C1.02-MCS.png',
    'C1.03-CCS.png',
    'C1.04-MCS.png',
    'C1.05-RCS.png',
    'C1.06-MCS.png',
    'C2.07-RCI.png',
    'C2.08-MCS.png'
];

// Function to load track parts
function loadTrackParts() {
    TRACK_PARTS.forEach(fileName => {
        const part = document.createElement('div');
        part.className = 'track-part';
        part.dataset.part = fileName;
        part.style.backgroundImage = `url('assets/track-parts/${fileName}')`;
        
        // Add click event for selection
        part.addEventListener('click', () => {
            // Only set selectedPart, do not highlight
            selectedPart = fileName;
        });
        
        partsList.appendChild(part);
        trackParts.push(part);
    });
}

// Function to create canvas cells
function createCanvasCells(size) {
    // Clear existing cells
    canvasCells.forEach(cell => cell.remove());
    canvasCells = [];
    placedParts.clear();
    
    const cellSize = canvas.width / size;
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = document.createElement('div');
            cell.className = 'canvas-cell';
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.left = `${x * cellSize}px`;
            cell.style.top = `${y * cellSize}px`;
            
            const cellIndex = y * size + x;
            
            // Add click event for part placement
            cell.addEventListener('click', () => {
                if (selectedPart) {
                    // Place part
                    placePart(cellIndex, selectedPart);
                } else if (placedParts.has(cellIndex)) {
                    // Select placed part
                    selectCell(cellIndex);
                }
            });
            
            // FIX: Append to canvas container, not canvas
            canvas.parentElement.appendChild(cell);
            canvasCells.push(cell);
        }
    }
}

// Function to place a part
function placePart(cellIndex, partName) {
    const cell = canvasCells[cellIndex];
    const cellSize = canvas.width / currentSize;
    const x = (cellIndex % currentSize) * cellSize;
    const y = Math.floor(cellIndex / currentSize) * cellSize;
    
    // Draw part on canvas
    const img = new Image();
    img.src = `assets/track-parts/${partName}`;
    img.onload = () => {
        ctx.drawImage(img, x, y, cellSize, cellSize);
        placedParts.set(cellIndex, partName);
        selectCell(cellIndex);
    };
}

// Function to select a cell
function selectCell(cellIndex) {
    // Only update selectedCell, do not highlight
    selectedCell = cellIndex;
}

// Function to erase selected part
function eraseSelectedPart() {
    if (selectedCell !== null && placedParts.has(selectedCell)) {
        const cellSize = canvas.width / currentSize;
        const x = (selectedCell % currentSize) * cellSize;
        const y = Math.floor(selectedCell / currentSize) * cellSize;
        
        // Clear the cell
        ctx.clearRect(x, y, cellSize, cellSize);
        placedParts.delete(selectedCell);
        // Do not remove 'selected' class
        selectedCell = null;
        
        // Redraw grid lines
        drawGrid(currentSize);
    }
}

// Add erase button
const eraseButton = document.createElement('button');
eraseButton.className = 'pista-button';
eraseButton.textContent = 'Borrar';
eraseButton.addEventListener('click', eraseSelectedPart);
document.querySelector('.pista-buttons').appendChild(eraseButton);

// Handle keyboard events
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        eraseSelectedPart();
    }
});

// Initialize canvas with default size
resizeCanvas(currentSize);
loadTrackParts(); 