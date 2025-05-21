import { 
    TRACK_PART_SIZE_PX, 
    AVAILABLE_TRACK_PARTS
} from './config.js';

class TrackEditor {
    constructor() {
        this.canvas = document.getElementById('trackCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 4; // Default 4x4 grid
        this.selectedPart = null;
        this.trackParts = [];
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
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.drawTrack();
    }

    setupEventListeners() {
        // Size buttons
        document.querySelectorAll('.size-button').forEach(button => {
            button.addEventListener('click', () => {
                this.gridSize = parseInt(button.dataset.size);
                this.resizeCanvas();
            });
        });

        // Clear button
        document.querySelector('.clear-button').addEventListener('click', () => {
            this.trackParts = [];
            this.drawTrack();
        });

        // Export button
        document.querySelector('.export-button').addEventListener('click', () => {
            this.exportTrack();
        });

        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));
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
                document.querySelectorAll('.track-part').forEach(p => p.classList.remove('selected'));
                partElement.classList.add('selected');
                this.selectedPart = part;
            });
            trackPartsContainer.appendChild(partElement);
        });
    }

    drawTrack() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw track parts
        const cellSize = this.canvas.width / this.gridSize;
        
        this.trackParts.forEach(part => {
            const x = part.col * cellSize;
            const y = part.row * cellSize;
            
            // Load and draw the track part image
            const img = new Image();
            img.onload = () => {
                this.ctx.save();
                this.ctx.translate(x + cellSize/2, y + cellSize/2);
                this.ctx.rotate(part.rotation_deg * Math.PI / 180);
                this.ctx.drawImage(img, -cellSize/2, -cellSize/2, cellSize, cellSize);
                this.ctx.restore();
                
                // Draw connection indicators
                this.drawConnectionIndicators(part, x, y, cellSize);
            };
            img.src = `assets/track-parts/${part.type}`;
        });
    }

    drawGrid() {
        const cellSize = this.canvas.width / this.gridSize;
        
        // Draw grid lines
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
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

    drawConnectionIndicators(part, x, y, cellSize) {
        const indicatorSize = 8;
        const offset = 3;
        const centerX = x + cellSize/2;
        const centerY = y + cellSize/2;

        const connections = this.getRotatedConnections(part);
        
        // Draw connection indicators for each direction
        const directions = {
            N: { x: centerX - indicatorSize/2, y: y + offset },
            E: { x: x + cellSize - offset - indicatorSize, y: centerY - indicatorSize/2 },
            S: { x: centerX - indicatorSize/2, y: y + cellSize - offset - indicatorSize },
            W: { x: x + offset, y: centerY - indicatorSize/2 }
        };

        for (const [dir, pos] of Object.entries(directions)) {
            this.ctx.fillStyle = connections[dir] ? '#00ff00' : 'rgba(180,0,0,0.5)';
            this.ctx.fillRect(pos.x, pos.y, indicatorSize, indicatorSize);
        }
    }

    getRotatedConnections(part) {
        const rotation_deg = part.rotation_deg || 0;
        if (!part || !part.connections) return {};
        
        const DIRECTIONS = ['N', 'E', 'S', 'W'];
        const rotated = {};
        const numRotations = Math.floor(rotation_deg / 90);
        
        for (const dirKey in part.connections) {
            if (part.connections[dirKey]) {
                const currentIndex = DIRECTIONS.indexOf(dirKey);
                const newIndex = (currentIndex + numRotations) % 4;
                rotated[DIRECTIONS[newIndex]] = true;
            }
        }
        
        return rotated;
    }

    handleCanvasClick(e) {
        if (!this.selectedPart) return;
        
        const { row, col } = this.getGridPosition(e);
        this.placePart(row, col);
    }

    handleCanvasDoubleClick(e) {
        const { row, col } = this.getGridPosition(e);
        const partIndex = this.trackParts.findIndex(part => 
            part.row === row && part.col === col
        );
        
        if (partIndex !== -1) {
            // Rotate 90 degrees clockwise
            this.trackParts[partIndex].rotation_deg = 
                ((this.trackParts[partIndex].rotation_deg || 0) + 90) % 360;
            this.drawTrack();
        }
    }

    getGridPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellSize = this.canvas.width / this.gridSize;
        
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
            
            // Add the new part
            this.trackParts.push({
                type: this.selectedPart.file,
                row,
                col,
                rotation_deg: 0,
                connections: this.selectedPart.connections
            });
            
            this.drawTrack();
        }
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