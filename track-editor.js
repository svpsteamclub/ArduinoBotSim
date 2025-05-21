class TrackEditor {
    constructor() {
        this.canvas = document.getElementById('trackCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 4; // Default 4x4
        this.cellSize = 350; // 350px per cell
        this.selectedPart = null;
        this.isEraseMode = false;
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
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.drawGrid();
    }

    setupEventListeners() {
        // Size buttons
        document.querySelectorAll('.size-button').forEach(button => {
            button.addEventListener('click', () => {
                this.gridSize = parseInt(button.dataset.size);
                this.resizeCanvas();
            });
        });

        // Generate random track
        document.querySelector('.generate-button').addEventListener('click', () => {
            this.generateRandomTrack();
        });

        // Export track
        document.querySelector('.export-button').addEventListener('click', () => {
            this.exportTrack();
        });

        // Clear mode
        document.querySelector('.clear-button').addEventListener('click', () => {
            this.isEraseMode = !this.isEraseMode;
            document.querySelector('.clear-button').classList.toggle('active');
        });

        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
    }

    loadTrackParts() {
        // Add track parts to the palette
        const trackPartsContainer = document.querySelector('.track-parts');
        const parts = [
            { name: 'C0.00-BCS', image: 'C0.00-BCS.png', description: 'Base Cross Section' },
            { name: 'C1.01-RCS', image: 'C1.01-RCS.png', description: 'Right Cross Section' },
            { name: 'C1.02-MCS', image: 'C1.02-MCS.png', description: 'Middle Cross Section 1' },
            { name: 'C1.03-CCS', image: 'C1.03-CCS.png', description: 'Center Cross Section' },
            { name: 'C1.04-MCS', image: 'C1.04-MCS.png', description: 'Middle Cross Section 2' },
            { name: 'C1.05-RCS', image: 'C1.05-RCS.png', description: 'Right Cross Section 2' },
            { name: 'C1.06-MCS', image: 'C1.06-MCS.png', description: 'Middle Cross Section 3' },
            { name: 'C2.07-RCI', image: 'C2.07-RCI.png', description: 'Right Curve In' },
            { name: 'C2.08-MCS', image: 'C2.08-MCS.png', description: 'Middle Cross Section 4' }
        ];

        parts.forEach(part => {
            const partElement = document.createElement('div');
            partElement.className = 'track-part';
            partElement.innerHTML = `
                <img src="assets/track-parts/${part.image}" alt="${part.description}">
                <span>${part.description}</span>
            `;
            partElement.addEventListener('click', () => {
                this.selectedPart = part;
                this.isEraseMode = false;
                document.querySelector('.clear-button').classList.remove('active');
            });
            trackPartsContainer.appendChild(partElement);
        });
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellSize = Math.min(
            this.canvas.width / this.gridSize,
            this.canvas.height / this.gridSize
        );

        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (this.isEraseMode) {
            this.erasePart(row, col);
        } else if (this.selectedPart) {
            this.placePart(row, col);
        }
    }

    handleCanvasHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellSize = Math.min(
            this.canvas.width / this.gridSize,
            this.canvas.height / this.gridSize
        );

        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        // Draw hover effect
        this.drawGrid();
        this.ctx.fillStyle = 'rgba(91, 155, 213, 0.1)';
        this.ctx.fillRect(
            col * cellSize,
            row * cellSize,
            cellSize,
            cellSize
        );
    }

    placePart(row, col) {
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            this.trackParts.push({
                type: this.selectedPart.name,
                row,
                col
            });
            this.drawTrack();
        }
    }

    erasePart(row, col) {
        this.trackParts = this.trackParts.filter(part => 
            !(part.row === row && part.col === col)
        );
        this.drawTrack();
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
                this.ctx.drawImage(
                    img,
                    part.col * cellSize,
                    part.row * cellSize,
                    cellSize,
                    cellSize
                );
            };
        });
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

        for (let i = 0; i < numParts; i++) {
            const row = Math.floor(i / this.gridSize);
            const col = i % this.gridSize;
            const type = partTypes[Math.floor(Math.random() * partTypes.length)];
            
            this.trackParts.push({ type, row, col });
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