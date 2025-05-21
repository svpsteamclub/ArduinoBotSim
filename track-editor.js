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
            this.generateRandomTrack();
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
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
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
        this.trackParts = [];
        const numParts = this.gridSize * this.gridSize;
        const centerRow = Math.floor(this.gridSize / 2);
        const centerCol = Math.floor(this.gridSize / 2);

        // First, generate a random loop path
        const path = this.generateRandomLoop(centerRow, centerCol);
        if (!path) {
            console.error("Could not generate a valid loop path");
            return;
        }

        // Then, fill each position with an appropriate part
        for (const position of path) {
            const { row, col, connections } = position;
            
            // Find all parts that could match these connections
            const compatibleParts = AVAILABLE_TRACK_PARTS.filter(part => {
                // Check if the part has all the required connections
                return Object.entries(connections).every(([dir, hasConnection]) => {
                    if (!hasConnection) return true; // If no connection needed, any part is fine
                    return part.connections[dir];
                });
            });

            if (compatibleParts.length > 0) {
                // Select a random compatible part
                const selectedPart = compatibleParts[Math.floor(Math.random() * compatibleParts.length)];
                
                // Try different rotations until we find one that matches
                let validRotation = false;
                let rotation = 0;
                
                while (!validRotation && rotation < 360) {
                    const rotatedConnections = this.getRotatedConnections({
                        connections: selectedPart.connections,
                        rotation
                    });
                    
                    // Check if this rotation matches our required connections
                    validRotation = Object.entries(connections).every(([dir, hasConnection]) => {
                        if (!hasConnection) return true;
                        return rotatedConnections[dir];
                    });
                    
                    if (!validRotation) {
                        rotation += 90;
                    }
                }

                if (validRotation) {
                    this.trackParts.push({
                        type: selectedPart.name,
                        row,
                        col,
                        rotation,
                        connections: selectedPart.connections
                    });
                }
            }
        }

        this.drawTrack();
    }

    generateRandomLoop(startRow, startCol) {
        const path = [];
        const visited = new Set();
        const grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        
        // Helper function to get valid moves from a position
        const getValidMoves = (row, col) => {
            const moves = [];
            const directions = [
                { dir: 'N', row: -1, col: 0 },
                { dir: 'E', row: 0, col: 1 },
                { dir: 'S', row: 1, col: 0 },
                { dir: 'W', row: 0, col: -1 }
            ];
            
            for (const { dir, row: dRow, col: dCol } of directions) {
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                if (newRow >= 0 && newRow < this.gridSize && 
                    newCol >= 0 && newCol < this.gridSize && 
                    !grid[newRow][newCol]) {
                    moves.push({ dir, row: newRow, col: newCol });
                }
            }
            
            return moves;
        };

        // Helper function to check if we can return to start
        const canReturnToStart = (row, col) => {
            const directions = [
                { dir: 'N', row: -1, col: 0 },
                { dir: 'E', row: 0, col: 1 },
                { dir: 'S', row: 1, col: 0 },
                { dir: 'W', row: 0, col: -1 }
            ];
            
            for (const { dir, row: dRow, col: dCol } of directions) {
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                if (newRow === startRow && newCol === startCol) {
                    return true;
                }
            }
            
            return false;
        };

        // Recursive function to generate the path
        const generatePath = (row, col, connections = {}) => {
            if (row === startRow && col === startCol && path.length > 0) {
                return true;
            }

            grid[row][col] = true;
            path.push({ row, col, connections: { ...connections } });

            const moves = getValidMoves(row, col);
            while (moves.length > 0) {
                const moveIndex = Math.floor(Math.random() * moves.length);
                const move = moves.splice(moveIndex, 1)[0];
                
                // Update connections for current position
                const currentPos = path[path.length - 1];
                currentPos.connections[move.dir] = true;
                
                // Create new connections object for next position
                const nextConnections = { ...currentPos.connections };
                const oppositeDir = {
                    'N': 'S',
                    'E': 'W',
                    'S': 'N',
                    'W': 'E'
                }[move.dir];
                nextConnections[oppositeDir] = true;
                
                if (generatePath(move.row, move.col, nextConnections)) {
                    return true;
                }
            }

            // If we can't continue and we're not at the start, backtrack
            if (row !== startRow || col !== startCol) {
                grid[row][col] = false;
                path.pop();
                return false;
            }

            return false;
        };

        // Start the path generation
        if (generatePath(startRow, startCol)) {
            return path;
        }

        return null;
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