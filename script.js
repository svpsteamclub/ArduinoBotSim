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
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
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

    // Initialize canvas and parts after DOM is ready
    resizeCanvas(currentSize);
    preloadPartImages(loadTrackParts);
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

// Function to draw connection indicators on the canvas
function drawConnectionIndicators(partKey, x, y, cellSize, rotation = 0) {
    const conn = trackConnections[partKey];
    if (!conn) return;
    const size = 7; // smaller indicator size
    // Helper to rotate a direction
    function rotateDir(dir, rot) {
        const dirs = ['north', 'east', 'south', 'west'];
        let idx = dirs.indexOf(dir);
        return dirs[(idx + rot) % 4];
    }
    const rot = ((rotation % 360) + 360) % 360;
    const steps = Math.round(rot / 90) % 4;
    const dirs = ['north', 'east', 'south', 'west'];
    const rotated = {};
    dirs.forEach((dir, i) => {
        rotated[dirs[(i + steps) % 4]] = conn[dir];
    });
    ctx.fillStyle = rotated.north ? '#2ecc40' : '#ff4136';
    ctx.fillRect(x + cellSize/2 - size/2, y + 2, size, size);
    ctx.fillStyle = rotated.east ? '#2ecc40' : '#ff4136';
    ctx.fillRect(x + cellSize - size - 2, y + cellSize/2 - size/2, size, size);
    ctx.fillStyle = rotated.south ? '#2ecc40' : '#ff4136';
    ctx.fillRect(x + cellSize/2 - size/2, y + cellSize - size - 2, size, size);
    ctx.fillStyle = rotated.west ? '#2ecc40' : '#ff4136';
    ctx.fillRect(x + 2, y + cellSize/2 - size/2, size, size);
}

// Dropdown open/close logic for Tamaño
const tamanoDropdown = document.querySelector('.dropdown');
const tamanoButton = document.getElementById('tamano');
const tamanoDropdownContent = tamanoDropdown.querySelector('.dropdown-content');

tamanoButton.addEventListener('click', (e) => {
    e.stopPropagation();
    tamanoDropdown.classList.toggle('open');
});

tamanoDropdownContent.addEventListener('click', (e) => {
    e.stopPropagation();
});

document.addEventListener('click', (e) => {
    if (tamanoDropdown.classList.contains('open')) {
        if (!tamanoDropdown.contains(e.target)) {
            tamanoDropdown.classList.remove('open');
        }
    }
});

// When a size is picked, close the dropdown
tamanoDropdownContent.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        tamanoDropdown.classList.remove('open');
    });
});

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
let placedParts = new Map(); // Map: cellIndex -> { name, rotation }

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

// Track part connection states
const trackConnections = {
  "C0.00-BCS": { north: false, east: false, south: false, west: false },
  "C1.01-RCS": { north: true,  east: false, south: true,  west: false },
  "C1.02-MCS": { north: false, east: true,  south: true,  west: false },
  "C1.03-CCS": { north: false, east: false, south: true,  west: true  },
  "C1.04-MCS": { north: false, east: true,  south: true,  west: false },
  "C1.05-RCS": { north: false, east: true,  south: true,  west: false },
  "C1.06-MCS": { north: false, east: true,  south: true,  west: false },
  "C2.07-RCI": { north: false, east: true,  south: true,  west: false },
  "C2.08-MCS": { north: true,  east: false, south: true,  west: false }
};

// --- Image cache for track parts ---
const partImages = {};
let partImagesLoaded = 0;
let partImagesToLoad = TRACK_PARTS.length;

// Preload all part images at startup
function preloadPartImages(callback) {
    partImagesLoaded = 0;
    partImagesToLoad = TRACK_PARTS.length;
    TRACK_PARTS.forEach(fileName => {
        const img = new window.Image();
        img.src = `assets/track-parts/${fileName}`;
        img.onload = () => {
            partImagesLoaded++;
            if (partImagesLoaded === partImagesToLoad && typeof callback === 'function') {
                callback();
            } else {
                // Redraw grid as images load
                drawGrid(currentSize);
            }
        };
        partImages[fileName] = img;
    });
}

// Function to load track parts
function loadTrackParts() {
    TRACK_PARTS.forEach(fileName => {
        const part = document.createElement('div');
        part.className = 'track-part';
        part.dataset.part = fileName;
        part.style.backgroundImage = `url('assets/track-parts/${fileName}')`;
        // Add click event for selection
        part.addEventListener('click', () => {
            if (selectedPart === fileName) {
                part.classList.remove('selected');
                selectedPart = null;
            } else {
                trackParts.forEach(p => p.classList.remove('selected'));
                part.classList.add('selected');
                selectedPart = fileName;
            }
        });
        partsList.appendChild(part);
        trackParts.push(part);
    });
}

// Add erase mode state
let eraseMode = false;

// Function to create canvas cells
function createCanvasCells(size) {
    const container = canvas.parentElement;
    container.querySelectorAll('.canvas-cell').forEach(cell => cell.remove());
    canvasCells = [];
    const rect = canvas.getBoundingClientRect();
    const cellWidth = rect.width / size;
    const cellHeight = rect.height / size;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = document.createElement('div');
            cell.className = 'canvas-cell';
            cell.style.width = `${cellWidth}px`;
            cell.style.height = `${cellHeight}px`;
            cell.style.left = `${x * cellWidth}px`;
            cell.style.top = `${y * cellHeight}px`;
            const cellIndex = y * size + x;
            cell.addEventListener('click', () => {
                if (eraseMode) {
                    if (placedParts.has(cellIndex)) {
                        placedParts.delete(cellIndex);
                        drawGrid(currentSize);
                    }
                } else if (selectedPart) {
                    placePart(cellIndex, selectedPart);
                } else if (placedParts.has(cellIndex)) {
                    selectCell(cellIndex);
                }
            });
            // Double-click to rotate (only if not in erase mode)
            cell.addEventListener('dblclick', (e) => {
                e.preventDefault();
                if (!eraseMode && placedParts.has(cellIndex)) {
                    const partObj = placedParts.get(cellIndex);
                    const currentRot = (typeof partObj.rotation === 'number') ? partObj.rotation : 0;
                    const newRot = (currentRot + 90) % 360;
                    console.log('cellIndex:', cellIndex, 'currentRot:', currentRot, 'newRot:', newRot, 'partObj:', partObj);
                    placedParts.set(cellIndex, { name: partObj.name, rotation: newRot });
                    drawGrid(currentSize);
                }
            });
            container.appendChild(cell);
            canvasCells.push(cell);
        }
    }
}

// Function to place a part
function placePart(cellIndex, partName) {
    placedParts.set(cellIndex, { name: partName, rotation: 0 });
    drawGrid(currentSize);
    selectCell(cellIndex);
    // Unselect part in the part list after placing
    trackParts.forEach(p => p.classList.remove('selected'));
    selectedPart = null;
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

// Update erase button to toggle erase mode
const eraseButton = document.createElement('button');
eraseButton.className = 'pista-button';
eraseButton.textContent = 'Borrar';
eraseButton.style.transition = 'background 0.2s, color 0.2s';
eraseButton.addEventListener('click', () => {
    eraseMode = !eraseMode;
    if (eraseMode) {
        eraseButton.style.background = '#d9534f';
        eraseButton.style.color = 'white';
    } else {
        eraseButton.style.background = '';
        eraseButton.style.color = '';
    }
});
document.querySelector('.pista-buttons').appendChild(eraseButton);

// Handle keyboard events
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        eraseSelectedPart();
    }
});

// Function to draw the grid
function drawGrid(size) {
    const canvasSize = size * CELL_SIZE;
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    // Set grid line style
    ctx.strokeStyle = '#eeeeee'; // very light grey
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
    // Redraw all placed parts
    placedParts.forEach((partObj, cellIndex) => {
        const { name, rotation = 0 } = typeof partObj === 'string' ? { name: partObj, rotation: 0 } : partObj;
        const cellSize = canvas.width / size;
        const x = (cellIndex % size) * cellSize;
        const y = Math.floor(cellIndex / size) * cellSize;
        const img = partImages[name];
        if (img && img.complete) {
            ctx.save();
            ctx.translate(x + cellSize/2, y + cellSize/2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(img, -cellSize/2, -cellSize/2, cellSize, cellSize);
            ctx.restore();
            const partKey = name.replace('.png', '');
            drawConnectionIndicators(partKey, x, y, cellSize, rotation);
        }
        // If image not loaded yet, skip drawing (will be drawn on load)
    });
}

// Initialize canvas with default size
resizeCanvas(currentSize);
loadTrackParts();

// --- Minimalist Random Loop Track Generation ---
function generateRandomLoopTrackScriptJS() {
    placedParts.clear();
    const size = currentSize;
    const DIRS = [
        { name: 'north', dr: -1, dc: 0 },
        { name: 'east', dr: 0, dc: 1 },
        { name: 'south', dr: 1, dc: 0 },
        { name: 'west', dr: 0, dc: -1 }
    ];
    let found = false;
    let path = [];
    for (let attempt = 0; attempt < 20 && !found; attempt++) {
        path = [];
        let visited = new Set();
        let r = Math.floor(Math.random() * size);
        let c = Math.floor(Math.random() * size);
        path.push([r, c]);
        visited.add(`${r},${c}`);
        let currR = r, currC = c;
        let minLen = Math.max(4, Math.floor(size * size * 0.5));
        let maxLen = Math.floor(size * size * 0.9);
        let stuck = 0;
        for (let i = 0; i < maxLen * 2 && path.length < maxLen; i++) {
            let dirs = DIRS.slice().sort(() => Math.random() - 0.5);
            let moved = false;
            for (let dir of dirs) {
                let nr = currR + dir.dr, nc = currC + dir.dc;
                if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
                if (visited.has(`${nr},${nc}`)) continue;
                currR = nr; currC = nc;
                path.push([currR, currC]);
                visited.add(`${currR},${currC}`);
                moved = true; stuck = 0;
                break;
            }
            if (!moved) {
                stuck++;
                if (stuck > 5 && path.length >= minLen) break;
                if (stuck > 10) break;
                if (path.length > 1) {
                    let [pr, pc] = path.pop();
                    visited.delete(`${pr},${pc}`);
                    [currR, currC] = path[path.length - 1];
                } else break;
            }
        }
        let [sr, sc] = path[0];
        let [er, ec] = path[path.length - 1];
        let canClose = DIRS.some(dir => er + dir.dr === sr && ec + dir.dc === sc);
        if (canClose && path.length >= minLen) {
            path.push([sr, sc]);
            found = true;
        }
    }
    if (!found) return alert('No se pudo generar un bucle después de varios intentos.');

    // Clear canvas and draw grid
    drawGrid(currentSize);

    // Draw the path line
    ctx.save();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
        let [r, c] = path[i];
        let cellSize = canvas.width / size;
        let x = c * cellSize + cellSize / 2;
        let y = r * cellSize + cellSize / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // --- Accumulate required connections for each cell ---
    const OPP = { north: 'south', east: 'west', south: 'north', west: 'east' };
    let cellConnections = {}; // key: "r,c", value: { north, east, south, west }
    for (let i = 0; i < path.length - 1; i++) {
        let [r, c] = path[i];
        let [nr, nc] = path[i + 1];
        let key = `${r},${c}`;
        if (!cellConnections[key]) cellConnections[key] = { north: false, east: false, south: false, west: false };
        // Find direction to next
        let toNext = DIRS.find(d => nr === r + d.dr && nc === c + d.dc);
        if (toNext) cellConnections[key][toNext.name] = true;
        // For the next cell, mark the opposite direction
        let nextKey = `${nr},${nc}`;
        if (!cellConnections[nextKey]) cellConnections[nextKey] = { north: false, east: false, south: false, west: false };
        if (toNext) cellConnections[nextKey][OPP[toNext.name]] = true;
    }

    // --- Draw blue squares for each required connection per cell ---
    ctx.save();
    ctx.fillStyle = '#3498db';
    const cellSize = canvas.width / size;
    const squareSize = cellSize * 0.18;
    const offset = cellSize * 0.38;
    for (const key in cellConnections) {
        const [r, c] = key.split(',').map(Number);
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;
        const conn = cellConnections[key];
        if (conn.north) ctx.fillRect(x - squareSize/2, y - offset, squareSize, squareSize);
        if (conn.east)  ctx.fillRect(x + offset - squareSize, y - squareSize/2, squareSize, squareSize);
        if (conn.south) ctx.fillRect(x - squareSize/2, y + offset - squareSize, squareSize, squareSize);
        if (conn.west)  ctx.fillRect(x - offset, y - squareSize/2, squareSize, squareSize);
    }
    ctx.restore();
}

// Add Aleatoria button event
const aleatoriaBtn = document.getElementById('crear-aleatoria');
if (aleatoriaBtn) {
    aleatoriaBtn.addEventListener('click', generateRandomLoopTrackScriptJS);
} 