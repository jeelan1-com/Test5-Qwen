// Whiteboard App - GoodNotes Style
// Fully offline, works in browser with macOS design

class Whiteboard {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        
        // State
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#1d1d1f';
        this.currentSize = 3;
        this.lastX = 0;
        this.lastY = 0;
        
        // Pages
        this.pages = [];
        this.currentPageIndex = 0;
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        
        // PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        // Initialize
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.addPage(); // Start with first page
        this.loadTheme();
        
        // Set initial canvas background
        this.clearCanvas(false);
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('wb-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }
    
    updateThemeIcon(theme) {
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.querySelector('span').textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    resizeCanvas() {
        if (!this.canvasWrapper) return;
        
        const rect = this.canvasWrapper.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Redraw current page content if exists
        if (this.pages[this.currentPageIndex]) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
                this.saveState(false);
            };
            img.src = this.pages[this.currentPageIndex];
        }
    }
    
    setupEventListeners() {
        // Canvas events - Mouse
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Canvas events - Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
        
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
        
        // Custom color picker
        const customColor = document.getElementById('customColor');
        if (customColor) {
            customColor.addEventListener('input', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                this.currentColor = e.target.value;
            });
        }
        
        // Stroke size slider
        const strokeSizeInput = document.getElementById('strokeSize');
        const strokeSizeValue = document.getElementById('strokeSizeValue');
        if (strokeSizeInput) {
            strokeSizeInput.addEventListener('input', (e) => {
                this.currentSize = parseInt(e.target.value);
                if (strokeSizeValue) {
                    strokeSizeValue.textContent = this.currentSize;
                }
            });
        }
        
        // Action buttons
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearCanvas(true));
        
        // Export buttons
        document.getElementById('exportPng')?.addEventListener('click', () => this.exportAsPng());
        document.getElementById('exportPdf')?.addEventListener('click', () => this.exportAsPdf());
        
        // Import PDF button
        document.getElementById('importPdfBtn')?.addEventListener('click', () => {
            document.getElementById('pdfInput')?.click();
        });
        
        // File input change
        document.getElementById('pdfInput')?.addEventListener('change', (e) => {
            this.importFile(e);
        });
        
        // Add page button
        document.getElementById('addPageBtn')?.addEventListener('click', () => this.addPage());
        
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('wb-theme', newTheme);
            this.updateThemeIcon(newTheme);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT') return;
            
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                } else if (e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                } else if (e.key === 's') {
                    e.preventDefault();
                    this.exportAsPng();
                }
            }
            
            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'p': this.selectTool('pen'); break;
                    case 'h': this.selectTool('highlighter'); break;
                    case 'e': this.selectTool('eraser'); break;
                }
            }
        });
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }
    
    getPointerPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX || e.touches?.[0]?.clientX) - rect.left,
            y: (e.clientY || e.touches?.[0]?.clientY) - rect.top
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getPointerPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Draw a dot for single clicks
        this.ctx.beginPath();
        this.ctx.arc(this.lastX, this.lastY, this.currentSize / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = this.currentTool === 'eraser' ? 
            (getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#ffffff') : 
            this.currentColor;
        this.ctx.fill();
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getPointerPos(e);
        const x = pos.x;
        const y = pos.y;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        
        if (this.currentTool === 'pen') {
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        } else if (this.currentTool === 'highlighter') {
            this.ctx.strokeStyle = this.currentColor + '60'; // 38% opacity
            this.ctx.lineWidth = this.currentSize * 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.globalAlpha = 0.4;
        } else if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#ffffff';
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
    
    saveState(saveToPages = true) {
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
        if (saveToPages) {
            this.pages[this.currentPageIndex] = this.canvas.toDataURL();
        }
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
        if (this.pages[this.currentPageIndex]) {
            this.pages[this.currentPageIndex] = dataUrl;
        }
        this.updateThumbnail();
    }
    
    clearCanvas(showConfirm = true) {
        if (showConfirm && !confirm('Are you sure you want to clear the entire canvas?')) {
            return;
        }
        
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#ffffff';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
        this.updateThumbnail();
    }
    
    addPage() {
        // Save current page before adding new one
        if (this.pages[this.currentPageIndex]) {
            this.pages[this.currentPageIndex] = this.canvas.toDataURL();
        }
        
        this.currentPageIndex = this.pages.length;
        this.pages.push(null);
        
        // Clear canvas for new page
        this.clearCanvas(false);
        
        // Reset history for new page
        this.history = [this.canvas.toDataURL()];
        this.historyIndex = 0;
        
        this.addThumbnail(this.currentPageIndex);
        this.updateActivePage();
    }
    
    updateThumbnail() {
        const thumbCanvas = document.getElementById(`thumb${this.currentPageIndex}`);
        if (thumbCanvas) {
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCanvas.width = 60;
            thumbCanvas.height = 80;
            
            // Fill with background
            const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#ffffff';
            thumbCtx.fillStyle = bgColor;
            thumbCtx.fillRect(0, 0, 60, 80);
            
            // Scale down the main canvas
            const scale = Math.min(60 / this.canvas.width, 80 / this.canvas.height);
            const x = (60 - this.canvas.width * scale) / 2;
            const y = (80 - this.canvas.height * scale) / 2;
            
            thumbCtx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, x, y, this.canvas.width * scale, this.canvas.height * scale);
        }
    }
    
    addThumbnail(pageIndex) {
        const pagesPanel = document.getElementById('pagesPanel');
        if (!pagesPanel) return;
        
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'page-thumbnail';
        thumbDiv.dataset.page = pageIndex;
        thumbDiv.innerHTML = `<canvas id="thumb${pageIndex}"></canvas><button class="delete-page" title="Delete Page">×</button>`;
        
        thumbDiv.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-page')) {
                this.switchPage(pageIndex);
            }
        });
        
        // Delete page button
        const deleteBtn = thumbDiv.querySelector('.delete-page');
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePage(pageIndex);
        });
        
        pagesPanel.appendChild(thumbDiv);
        
        // Update thumbnail after a short delay
        setTimeout(() => this.updateThumbnail(), 100);
    }
    
    updateActivePage() {
        document.querySelectorAll('.page-thumbnail').forEach(t => {
            t.classList.toggle('active', parseInt(t.dataset.page) === this.currentPageIndex);
        });
    }
    
    switchPage(pageIndex) {
        if (pageIndex === this.currentPageIndex) return;
        
        // Save current page
        this.pages[this.currentPageIndex] = this.canvas.toDataURL();
        
        // Switch to new page
        this.currentPageIndex = pageIndex;
        
        // Clear canvas
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#ffffff';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Load page content if exists
        if (this.pages[pageIndex]) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
                this.saveState(false);
            };
            img.src = this.pages[pageIndex];
        } else {
            this.saveState(false);
        }
        
        // Update active state
        this.updateActivePage();
        
        // Reset history for the switched page
        this.history = [this.canvas.toDataURL()];
        this.historyIndex = 0;
    }
    
    deletePage(pageIndex) {
        if (this.pages.length <= 1) {
            alert('You must have at least one page.');
            return;
        }
        
        if (!confirm('Delete this page?')) return;
        
        // Remove page from array
        this.pages.splice(pageIndex, 1);
        
        // If deleting current page, switch to previous or first page
        if (pageIndex === this.currentPageIndex) {
            this.currentPageIndex = Math.max(0, pageIndex - 1);
        } else if (pageIndex < this.currentPageIndex) {
            this.currentPageIndex--;
        }
        
        // Rebuild thumbnails
        const pagesPanel = document.getElementById('pagesPanel');
        pagesPanel.innerHTML = '';
        this.pages.forEach((_, idx) => this.addThumbnail(idx));
        
        // Switch to the adjusted page index
        this.switchPage(this.currentPageIndex);
    }
    
    exportAsPng() {
        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    
    async exportAsPdf() {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: this.canvas.width > this.canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [this.canvas.width, this.canvas.height]
            });
            
            const imgData = this.canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, this.canvas.width, this.canvas.height);
            pdf.save(`whiteboard-${Date.now()}.pdf`);
        } catch (error) {
            console.error('PDF export error:', error);
            // Fallback: download as image
            alert('PDF library not loaded. Downloading as PNG instead.');
            this.exportAsPng();
        }
    }
    
    async importFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        try {
            if (file.type === 'application/pdf') {
                // Show loading
                loadingOverlay?.classList.add('show');
                
                // Read PDF
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                
                // Render first page
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1 });
                
                // Create temporary canvas for rendering
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = viewport.width;
                tempCanvas.height = viewport.height;
                
                await page.render({
                    canvasContext: tempCtx,
                    viewport: viewport
                }).promise;
                
                // Resize main canvas to match PDF
                this.canvas.width = tempCanvas.width;
                this.canvas.height = tempCanvas.height;
                
                // Draw PDF on main canvas
                this.ctx.drawImage(tempCanvas, 0, 0);
                
                this.saveState();
                this.updateThumbnail();
                
                loadingOverlay?.classList.remove('show');
            } else if (file.type.startsWith('image/')) {
                // Import image
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Resize canvas to fit image
                        this.canvas.width = img.width;
                        this.canvas.height = img.height;
                        
                        this.ctx.drawImage(img, 0, 0);
                        this.saveState();
                        this.updateThumbnail();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select a PDF or image file.');
            }
        } catch (error) {
            console.error('Import error:', error);
            loadingOverlay?.classList.remove('show');
            alert('Error importing file. Please try again.');
        }
        
        // Reset input
        e.target.value = '';
    }
}

// Initialize whiteboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.whiteboard = new Whiteboard();
});
