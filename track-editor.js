import { 
    TRACK_PART_SIZE_PX, 
    PIXELS_PER_METER, 
    AVAILABLE_TRACK_PARTS,
    DEFAULT_ROBOT_CONFIG,
    SIMULATION_CONFIG
} from './config.js';

class TrackEditor {
    constructor() {
        this.canvas = document.getElementById('trackCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 4; // Default 4x4
        this.cellSize = TRACK_PART_SIZE_PX;
        this.selectedPart = null;
        this.isEraseMode = false;
        this.trackParts = [];
        this.lastGeneratedTrackStartPosition = null;
        this.initializeCanvas();
        this.setupEventListeners();
        this.loadTrackParts();
    }

    initializeCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.drawGrid();
    }

    setupEventListeners() {
        // Size buttons
        document.querySelectorAll('.size-button').forEach(button => {
            button.addEventListener('click', () => {
                this.gridSize = parseInt(button.dataset.size);
                this.lastGeneratedTrackStartPosition = null;
                this.resizeCanvas();
            });
        });

        // Generate random track
        document.querySelector('.generate-button').addEventListener('click', () => {
            if (this.isEraseMode) this.toggleEraseMode();
            this.generateRandomTrackWithRetry();
        });

        // Export track
        document.querySelector('.export-button').addEventListener('click', () => {
            if (this.isEraseMode) this.toggleEraseMode();
            if (!this.validateTrack()) {
                if (!confirm("La pista puede tener problemas (desconexiones o callejones sin salida). ¿Exportar de todos modos?")) {
                    return;
                }
            }
            this.exportTrack();
        });

        // Clear mode
        document.querySelector('.clear-button').addEventListener('click', () => {
            this.toggleEraseMode();
        });

        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));
    }

    toggleEraseMode() {
        this.isEraseMode = !this.isEraseMode;
        const button = document.querySelector('.clear-button');
        if (this.isEraseMode) {
            button.textContent = "Desactivar Modo Borrar";
            button.style.backgroundColor = "#d9534f";
            button.style.borderColor = "#d43f3a";
            this.selectedPart = null;
            document.querySelectorAll('.track-part').forEach(part => part.classList.remove('selected'));
            this.canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"%23cc0000\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><line x1=\\"18\\" y1=\\"6\\" x2=\\"6\\" y2=\\"18\\"></line><line x1=\\"6\\" y1=\\"6\\" x2=\\"18\\" y2=\\"18\\"></line></svg>") 12 12, auto';
        } else {
            button.textContent = "Activar Modo Borrar";
            button.style.backgroundColor = "";
            button.style.borderColor = "";
            this.canvas.style.cursor = 'default';
        }
    }

    loadTrackParts() {
        const trackPartsContainer = document.querySelector('.track-parts');
        trackPartsContainer.innerHTML = '';

        AVAILABLE_TRACK_PARTS.forEach(part => {
            const partElement = document.createElement('div');
            partElement.className = 'track-part';
            partElement.innerHTML = `
                <img src="assets/track-parts/${part.file}" alt="${part.description}">
                <span>${part.description}</span>
            `;
            partElement.addEventListener('click', () => {
                if (this.isEraseMode) this.toggleEraseMode();
                document.querySelectorAll('.track-part').forEach(p => p.classList.remove('selected'));
                partElement.classList.add('selected');
                this.selectedPart = part;
            });
            trackPartsContainer.appendChild(partElement);
        });
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;

        const cellSize = Math.min(
            this.canvas.width / this.gridSize,
            this.canvas.height / this.gridSize
        );

        for (let i = 0; i <= this.gridSize; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * cellSize, 0);
            this.ctx.lineTo(i * cellSize, this.canvas.height);
            this.ctx.stroke();

            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * cellSize);
            this.ctx.lineTo(this.canvas.width, i * cellSize);
            this.ctx.stroke();
        }
    }

    handleCanvasClick(e) {
        if (this.isEraseMode) {
            this.handleErase(e);
        } else {
            this.handlePlace(e);
        }
    }

    handleCanvasDoubleClick(e) {
        if (!this.isEraseMode) {
            this.handleRotate(e);
        }
    }

    handleErase(e) {
        const { row, col } = this.getGridPosition(e);
        this.trackParts = this.trackParts.filter(part => 
            !(part.row === row && part.col === col)
        );
        this.drawTrack();
    }

    handlePlace(e) {
        if (!this.selectedPart) return;
        const { row, col } = this.getGridPosition(e);
        this.placePart(row, col);
    }

    handleRotate(e) {
        const { row, col } = this.getGridPosition(e);
        const partIndex = this.trackParts.findIndex(part => 
            part.row === row && part.col === col
        );
        if (partIndex !== -1) {
            this.trackParts[partIndex].rotation = (this.trackParts[partIndex].rotation || 0 + 90) % 360;
            this.drawTrack();
        }
    }

    getGridPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellSize = Math.min(
            this.canvas.width / this.gridSize,
            this.canvas.height / this.gridSize
        );
        return {
            row: Math.floor(y / cellSize),
            col: Math.floor(x / cellSize)
        };
    }

    placePart(row, col) {
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            // Remove any existing part at this position
            this.trackParts = this.trackParts.filter(part => 
                !(part.row === row && part.col === col)
            );
            
            this.trackParts.push({
                type: this.selectedPart.name,
                row,
                col,
                rotation: 0,
                connections: this.selectedPart.connections
            });
            this.drawTrack();
        }
    }

    drawTrack() {
        this.drawGrid();
        const cellSize = Math.min(
            this.canvas.width / this.gridSize,
            this.canvas.height / this.gridSize
        );

        this.trackParts.forEach(part => {
            const img = new Image();
            img.src = `assets/track-parts/${part.type}.png`;
            img.onload = () => {
                const x = part.col * cellSize;
                const y = part.row * cellSize;
                
                this.ctx.save();
                this.ctx.translate(x + cellSize/2, y + cellSize/2);
                this.ctx.rotate((part.rotation || 0) * Math.PI / 180);
                this.ctx.drawImage(img, -cellSize/2, -cellSize/2, cellSize, cellSize);
                this.ctx.restore();

                // Draw connection indicators
                this.drawConnectionIndicators(part, x, y, cellSize);
            };
        });
    }

    drawConnectionIndicators(part, x, y, cellSize) {
        const indicatorSize = 8;
        const offset = 3;
        const centerX = x + cellSize/2;
        const centerY = y + cellSize/2;

        const connections = this.getRotatedConnections(part);
        
        // North
        this.ctx.fillStyle = connections.N ? '#00ff00' : 'rgba(180,0,0,0.5)';
        this.ctx.fillRect(centerX - indicatorSize/2, y + offset, indicatorSize, indicatorSize);
        
        // East
        this.ctx.fillStyle = connections.E ? '#00ff00' : 'rgba(180,0,0,0.5)';
        this.ctx.fillRect(x + cellSize - offset - indicatorSize, centerY - indicatorSize/2, indicatorSize, indicatorSize);
        
        // South
        this.ctx.fillStyle = connections.S ? '#00ff00' : 'rgba(180,0,0,0.5)';
        this.ctx.fillRect(centerX - indicatorSize/2, y + cellSize - offset - indicatorSize, indicatorSize, indicatorSize);
        
        // West
        this.ctx.fillStyle = connections.W ? '#00ff00' : 'rgba(180,0,0,0.5)';
        this.ctx.fillRect(x + offset, centerY - indicatorSize/2, indicatorSize, indicatorSize);
    }

    getRotatedConnections(part) {
        const rotation = part.rotation || 0;
        const connections = { ...part.connections };
        
        // Rotate connections based on part rotation
        for (let i = 0; i < rotation / 90; i++) {
            const temp = connections.N;
            connections.N = connections.W;
            connections.W = connections.S;
            connections.S = connections.E;
            connections.E = temp;
        }
        
        return connections;
    }

    validateTrack() {
        // Check for disconnected parts
        for (const part of this.trackParts) {
            const connections = this.getRotatedConnections(part);
            let hasConnection = false;
            
            // Check each direction
            if (connections.N && this.hasConnectedPart(part.row - 1, part.col, 'S')) hasConnection = true;
            if (connections.E && this.hasConnectedPart(part.row, part.col + 1, 'W')) hasConnection = true;
            if (connections.S && this.hasConnectedPart(part.row + 1, part.col, 'N')) hasConnection = true;
            if (connections.W && this.hasConnectedPart(part.row, part.col - 1, 'E')) hasConnection = true;
            
            if (!hasConnection) return false;
        }
        
        return true;
    }

    hasConnectedPart(row, col, direction) {
        const part = this.trackParts.find(p => p.row === row && p.col === col);
        if (!part) return false;
        
        const connections = this.getRotatedConnections(part);
        return connections[direction];
    }

    generateRandomTrack() {
        // Step 1: Generate a random loop path with required connections
        const gridRows = this.gridSize;
        const gridCols = this.gridSize;
        const minPathLength = Math.max(4, Math.floor((gridRows * gridCols) * 0.40));
        const maxPathLength = Math.floor((gridRows * gridCols) * 0.90);
        let grid = Array(gridRows).fill(null).map(() => Array(gridCols).fill(null));

        // --- Generate random loop path ---
        function getRandomInt(max) { return Math.floor(Math.random() * max); }
        const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };
        const DIRS = [
            { name: 'N', dr: -1, dc: 0 },
            { name: 'E', dr: 0, dc: 1 },
            { name: 'S', dr: 1, dc: 0 },
            { name: 'W', dr: 0, dc: -1 }
        ];
        let path = [];
        let visited = new Set();
        let startR = getRandomInt(gridRows);
        let startC = getRandomInt(gridCols);
        let currentR = startR, currentC = startC;
        path.push({ r: currentR, c: currentC });
        visited.add(`${currentR},${currentC}`);
        let stuckCounter = 0;
        for (let k = 0; k < maxPathLength * 2 && path.length < maxPathLength; k++) {
            let dirs = [...DIRS].sort(() => 0.5 - Math.random());
            let moved = false;
            for (const dir of dirs) {
                let nr = currentR + dir.dr, nc = currentC + dir.dc;
                if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols && !visited.has(`${nr},${nc}`)) {
                    if (path.length < minPathLength / 2) {
                        let isEdge = (nr === 0 || nr === gridRows - 1 || nc === 0 || nc === gridCols - 1);
                        if (isEdge && dirs.length > 1 && Math.random() < 0.6) continue;
                    }
                    currentR = nr; currentC = nc;
                    path.push({ r: currentR, c: currentC });
                    visited.add(`${currentR},${currentC}`);
                    moved = true; stuckCounter = 0; break;
                }
            }
            if (!moved) {
                stuckCounter++;
                if (stuckCounter > 5 && path.length >= minPathLength) break;
                if (stuckCounter > 10) break;
                if (path.length > 1) {
                    visited.delete(`${currentR},${currentC}`); path.pop();
                    currentR = path[path.length - 1].r; currentC = path[path.length - 1].c;
                } else { break; }
            }
            if (path.length >= maxPathLength) break;
        }
        // Debug: Show the cells selected by the path generator
        console.log('Generated path cells:', path.map(cell => `(${cell.r},${cell.c})`).join(' -> '));
        // Try to close the loop
        let loopClosed = false;
        for (const dir of DIRS) {
            if (currentR + dir.dr === startR && currentC + dir.dc === startC) {
                path.push({ r: startR, c: startC });
                loopClosed = true; break;
            }
        }
        if (!loopClosed || path.length < minPathLength) {
            console.warn('Could not generate a valid loop path');
            return;
        }
        // Step 2: For each cell, determine required connections
        let pathWithConnections = [];
        for (let i = 0; i < path.length - 1; i++) {
            const cell = path[i];
            const prevCell = (i === 0) ? path[path.length - 2] : path[i - 1];
            const nextCell = path[i + 1];
            function getDir(from, to) {
                if (to.r === from.r - 1 && to.c === from.c) return 'N';
                if (to.r === from.r + 1 && to.c === from.c) return 'S';
                if (to.r === from.r && to.c === from.c - 1) return 'W';
                if (to.r === from.r && to.c === from.c + 1) return 'E';
                return null;
            }
            const dirFromPrev = getDir(prevCell, cell);
            const dirToNext = getDir(cell, nextCell);
            if (!dirFromPrev || !dirToNext) {
                console.error('Error determining directions for path connections.');
                return;
            }
            pathWithConnections.push({
                r: cell.r, c: cell.c,
                connections: { [OPPOSITE[dirFromPrev]]: true, [dirToNext]: true }
            });
        }
        // Step 3: Place parts with matching connections
        // Only use parts with exactly 2 connections
        const loopParts = AVAILABLE_TRACK_PARTS.filter(p => {
            if (!p.connections) return false;
            return Object.values(p.connections).filter(conn => conn === true).length === 2;
        });
        if (loopParts.length === 0) {
            alert('No hay partes de pista adecuadas (con exactamente 2 conexiones) en config.js para generar un bucle.');
            return;
        }
        let allPartsPlaced = true;
        this.trackParts = [];
        for (const cellInfo of pathWithConnections) {
            const { r, c, connections } = cellInfo;
            let placed = false;
            const shuffledParts = [...loopParts].sort(() => 0.5 - Math.random());
            for (const part of shuffledParts) {
                const rotations = [0, 90, 180, 270].sort(() => 0.5 - Math.random());
                for (const rot of rotations) {
                    const rotatedConnections = this.getRotatedConnections({ connections: part.connections, rotation: rot });
                    let match = true;
                    if (Object.keys(rotatedConnections).length !== 2 || Object.keys(connections).length !== 2) { match = false; }
                    else {
                        for (const dir in connections) {
                            if (!rotatedConnections[dir]) { match = false; break; }
                        }
                    }
                    if (match) {
                        this.trackParts.push({
                            type: part.name,
                            row: r,
                            col: c,
                            rotation: rot,
                            connections: part.connections
                        });
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }
            if (!placed) {
                allPartsPlaced = false;
                console.error(`Could not find suitable part for cell [${r},${c}] with connections ${JSON.stringify(connections)}`);
            }
        }
        this.drawTrack();
    }

    generateRandomTrackWithRetry(maxRetries = 30) {
        for (let i = 0; i < maxRetries; i++) {
            this.generateRandomTrack();
            if (this.trackParts.length > 0) return;
        }
        alert('No se pudo generar una pista válida tras varios intentos.');
    }

    exportTrack() {
        const trackData = {
            gridSize: this.gridSize,
            parts: this.trackParts
        };

        const blob = new Blob([JSON.stringify(trackData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'track.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize track editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TrackEditor();
}); 