// Whiteboard App - GoodNotes Style
// Fully offline, works in browser

class Whiteboard {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        
        // State
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentSize = 3;
        this.lastX = 0;
        this.lastY = 0;
        
        // Pages
        this.pages = [];
        this.currentPageIndex = 0;
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        
        // Initialize
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.saveState();
        this.updateThumbnail();
        
        // Set initial canvas background
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg') || '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    resizeCanvas() {
        const rect = this.canvasWrapper.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Redraw current page content if exists
        if (this.pages[this.currentPageIndex]) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = this.pages[this.currentPageIndex];
        }
    }
    
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', () => {
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Tool buttons
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentTool = e.currentTarget.dataset.tool;
            });
        });
        
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentColor = e.currentTarget.dataset.color;
            });
        });
        
        // Size slider
        document.getElementById('sizeSlider').addEventListener('input', (e) => {
            this.currentSize = parseInt(e.target.value);
        });
        
        // Action buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            document.getElementById('exportModal').classList.add('active');
        });
        
        // Export modal buttons
        document.getElementById('exportPng').addEventListener('click', () => this.exportAsPng());
        document.getElementById('exportPdf').addEventListener('click', () => this.exportAsPdf());
        
        // Close modal on overlay click
        document.getElementById('exportModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('exportModal')) {
                document.getElementById('exportModal').classList.remove('active');
            }
        });
        
        // Import PDF
        document.getElementById('importPdfBtn').addEventListener('click', () => {
            document.getElementById('pdfInput').click();
        });
        
        document.getElementById('pdfInput').addEventListener('change', (e) => {
            this.importPdf(e);
        });
        
        // Add page
        document.getElementById('addPageBtn').addEventListener('click', () => this.addPage());
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('wb-theme', newTheme);
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('wb-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                }
            }
        });
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        
        if (this.currentTool === 'pen') {
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        } else if (this.currentTool === 'highlighter') {
            this.ctx.strokeStyle = this.currentColor + '40'; // 25% opacity
            this.ctx.lineWidth = this.currentSize * 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.globalAlpha = 0.3;
        } else if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg') || '#ffffff';
            this.ctx.lineWidth = this.currentSize * 2;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        }
        
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        
        this.lastX = x;
        this.lastY = y;
    }
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
            this.updateThumbnail();
        }
    }
    
    saveState() {
        // Remove any redo states
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Save current state
        this.history.push(this.canvas.toDataURL());
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
        
        // Save to pages array
        this.pages[this.currentPageIndex] = this.canvas.toDataURL();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadState(this.history[this.historyIndex]);
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadState(this.history[this.historyIndex]);
        }
    }
    
    loadState(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
        this.pages[this.currentPageIndex] = dataUrl;
        this.updateThumbnail();
    }
    
    clearCanvas() {
        if (confirm('Are you sure you want to clear the entire canvas?')) {
            this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg') || '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
            this.updateThumbnail();
        }
    }
    
    addPage() {
        this.currentPageIndex++;
        this.pages[this.currentPageIndex] = null;
        
        // Clear canvas for new page
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg') || '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.saveState();
        this.addThumbnail(this.currentPageIndex);
    }
    
    updateThumbnail() {
        const thumbCanvas = document.getElementById(`thumb${this.currentPageIndex}`);
        if (thumbCanvas) {
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCanvas.width = 60;
            thumbCanvas.height = 80;
            
            // Scale down the main canvas
            const scale = Math.min(60 / this.canvas.width, 80 / this.canvas.height);
            const x = (60 - this.canvas.width * scale) / 2;
            const y = (80 - this.canvas.height * scale) / 2;
            
            thumbCtx.fillStyle = '#ffffff';
            thumbCtx.fillRect(0, 0, 60, 80);
            thumbCtx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, x, y, this.canvas.width * scale, this.canvas.height * scale);
        }
    }
    
    addThumbnail(pageIndex) {
        const pagesPanel = document.getElementById('pagesPanel');
        const addBtn = document.getElementById('addPageBtn');
        
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'page-thumbnail';
        thumbDiv.dataset.page = pageIndex;
        thumbDiv.innerHTML = `<canvas id="thumb${pageIndex}"></canvas>`;
        
        thumbDiv.addEventListener('click', () => this.switchPage(pageIndex));
        
        pagesPanel.insertBefore(thumbDiv, addBtn);
        
        // Update thumbnail
        setTimeout(() => this.updateThumbnail(), 100);
    }
    
    switchPage(pageIndex) {
        // Save current page
        this.pages[this.currentPageIndex] = this.canvas.toDataURL();
        
        // Switch to new page
        this.currentPageIndex = pageIndex;
        
        // Clear canvas
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg') || '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Load page content if exists
        if (this.pages[pageIndex]) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = this.pages[pageIndex];
        }
        
        // Update active state
        document.querySelectorAll('.page-thumbnail').forEach(t => t.classList.remove('active'));
        document.querySelector(`.page-thumbnail[data-page="${pageIndex}"]`).classList.add('active');
        
        // Reset history for new page
        this.history = [this.canvas.toDataURL()];
        this.historyIndex = 0;
    }
    
    exportAsPng() {
        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        document.getElementById('exportModal').classList.remove('active');
    }
    
    exportAsPdf() {
        // Simple PDF export using canvas data
        const imgData = this.canvas.toDataURL('image/jpeg', 0.9);
        
        // Create a simple PDF using jsPDF CDN or download as image
        // For simplicity, we'll download as image with PDF extension
        // In production, you'd use jsPDF library
        
        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.pdf`;
        link.href = imgData;
        link.click();
        
        document.getElementById('exportModal').classList.remove('active');
        
        // Show note about PDF export
        alert('Note: For full PDF support with multiple pages, consider using a PDF library like jsPDF. This exports the current page as an image.');
    }
    
    importPdf(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file');
            return;
        }
        
        // Read PDF as data URL and display first page as image
        const reader = new FileReader();
        reader.onload = (event) => {
            // For PDF import, we need pdf.js library
            // For now, show a message
            alert('PDF import requires pdf.js library. In production, include pdf.js from CDN to render PDF pages on the canvas.');
            
            // Simple image fallback
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, Math.min(img.width, this.canvas.width), Math.min(img.height, this.canvas.height));
                this.saveState();
                this.updateThumbnail();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        
        // Reset input
        e.target.value = '';
    }
}

// Initialize whiteboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.whiteboard = new Whiteboard();
});
