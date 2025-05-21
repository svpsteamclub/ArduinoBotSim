class TrackEditor {
    constructor() {
        this.canvas = document.getElementById('trackCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 4; // Default 4x4
        this.cellSize = 350; // 350px per cell
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
        const parts = [
            { name: 'C0.00-BCS', image: 'C0.00-BCS.png', description: 'Base Cross Section', connections: { N: true, E: true, S: true, W: true } },
            { name: 'C1.01-RCS', image: 'C1.01-RCS.png', description: 'Right Cross Section', connections: { N: true, E: true, S: true, W: false } },
            { name: 'C1.02-MCS', image: 'C1.02-MCS.png', description: 'Middle Cross Section 1', connections: { N: true, E: true, S: true, W: true } },
            { name: 'C1.03-CCS', image: 'C1.03-CCS.png', description: 'Center Cross Section', connections: { N: true, E: true, S: true, W: true } },
            { name: 'C1.04-MCS', image: 'C1.04-MCS.png', description: 'Middle Cross Section 2', connections: { N: true, E: true, S: true, W: true } },
            { name: 'C1.05-RCS', image: 'C1.05-RCS.png', description: 'Right Cross Section 2', connections: { N: true, E: true, S: true, W: false } },
            { name: 'C1.06-MCS', image: 'C1.06-MCS.png', description: 'Middle Cross Section 3', connections: { N: true, E: true, S: true, W: true } },
            { name: 'C2.07-RCI', image: 'C2.07-RCI.png', description: 'Right Curve In', connections: { N: false, E: true, S: true, W: false } },
            { name: 'C2.08-MCS', image: 'C2.08-MCS.png', description: 'Middle Cross Section 4', connections: { N: true, E: true, S: true, W: true } }
        ];

        parts.forEach(part => {
            const partElement = document.createElement('div');
            partElement.className = 'track-part';
            partElement.innerHTML = `
                <img src="assets/track-parts/${part.image}" alt="${part.description}">
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
        const partTypes = [
            'C0.00-BCS',
            'C1.01-RCS',
            'C1.02-MCS',
            'C1.03-CCS',
            'C1.04-MCS',
            'C1.05-RCS',
            'C1.06-MCS',
            'C2.07-RCI',
            'C2.08-MCS'
        ];

        // Start with a base cross section in the center
        const centerRow = Math.floor(this.gridSize / 2);
        const centerCol = Math.floor(this.gridSize / 2);
        this.placePart(centerRow, centerCol);

        // Generate the rest of the track
        for (let i = 0; i < numParts - 1; i++) {
            const row = Math.floor(i / this.gridSize);
            const col = i % this.gridSize;
            if (row === centerRow && col === centerCol) continue;
            
            const type = partTypes[Math.floor(Math.random() * partTypes.length)];
            const rotation = Math.floor(Math.random() * 4) * 90;
            
            this.trackParts.push({
                type,
                row,
                col,
                rotation
            });
        }

        this.drawTrack();
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