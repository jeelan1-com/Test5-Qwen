/**
 * Web VM - x86 Virtual Machine in Browser
 * Uses v86 library for x86 emulation
 */

class WebVM {
    constructor() {
        this.vm = null;
        this.isRunning = false;
        this.selectedOS = 'tinycore';
        this.canvas = document.getElementById('vmCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.terminalContent = document.getElementById('terminalContent');
        this.overlay = document.getElementById('vmOverlay');
        this.overlayText = document.getElementById('overlayText');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupVirtualKeyboard();
        this.resizeCanvas();
        this.log('Web VM initialized', 'info');
        this.log('Ready to boot virtual machine', 'info');
    }

    setupEventListeners() {
        // Power button
        document.getElementById('powerBtn').addEventListener('click', () => this.togglePower());
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        // Fullscreen button
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        // OS selection
        document.querySelectorAll('.os-card').forEach(card => {
            card.addEventListener('click', () => this.selectOS(card));
        });
        
        // Memory slider
        const memorySlider = document.getElementById('memorySlider');
        memorySlider.addEventListener('input', (e) => {
            document.getElementById('memoryValue').textContent = e.target.value;
        });
        
        // Load disk button
        document.getElementById('loadDiskBtn').addEventListener('click', () => {
            document.getElementById('diskInput').click();
        });
        
        document.getElementById('diskInput').addEventListener('change', (e) => {
            this.loadDiskImage(e.target.files[0]);
        });
        
        // Clear terminal
        document.getElementById('clearTerminal').addEventListener('click', () => {
            this.terminalContent.innerHTML = '';
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupVirtualKeyboard() {
        const keyboard = document.getElementById('virtualKeyboard');
        const rows = [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
            ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
            ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', 'Enter'],
            ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
            ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl']
        ];

        rows.forEach(row => {
            row.forEach(key => {
                const keyElement = document.createElement('div');
                keyElement.className = 'key';
                if (key === 'Space') keyElement.classList.add('space');
                if (['Backspace', 'Tab', 'Caps', 'Enter', 'Shift', 'Ctrl', 'Alt'].includes(key)) {
                    keyElement.classList.add('wide');
                }
                keyElement.textContent = key;
                keyElement.addEventListener('click', () => this.simulateKeyPress(key));
                keyboard.appendChild(keyElement);
            });
        });
    }

    selectOS(card) {
        document.querySelectorAll('.os-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedOS = card.dataset.os;
        this.log(`Selected OS: ${card.querySelector('h4').textContent}`, 'info');
        
        if (this.selectedOS === 'custom') {
            document.getElementById('diskInput').click();
        }
    }

    togglePower() {
        if (this.isRunning) {
            this.powerOff();
        } else {
            this.powerOn();
        }
    }

    async powerOn() {
        this.log('Starting virtual machine...', 'info');
        this.overlayText.textContent = 'Booting...';
        this.overlay.classList.remove('hidden');
        
        try {
            // Check if v86 is loaded
            if (typeof window.X86Machine === 'undefined') {
                this.log('v86 library not loaded. Using simulation mode.', 'warning');
                this.startSimulation();
                return;
            }

            // Get OS image URL based on selection
            const imageUrl = this.getOSImageUrl();
            
            if (!imageUrl && this.selectedOS !== 'custom') {
                throw new Error('No disk image available for selected OS');
            }

            // Initialize v86
            const memorySize = parseInt(document.getElementById('memorySlider').value) * 1024 * 1024;
            
            this.vm = new window.X86Machine({
                wasm_path: 'v86.wasm',
                memory_size: memorySize,
                vga_memory_size: 8 * 1024 * 1024,
                screen_container: this.canvas,
                bios: { url: 'seabios.bin' },
                vga_bios: { url: 'vgabios.bin' },
                cdrom: { url: imageUrl },
                autostart: true,
            });

            this.vm.add_listener('screen-set-mode', (mode) => {
                this.log(`Screen mode changed: ${mode}`, 'info');
            });

            this.isRunning = true;
            this.updatePowerButton();
            this.overlay.classList.add('hidden');
            this.log('Virtual machine started successfully', 'success');
            
        } catch (error) {
            this.log(`Error starting VM: ${error.message}`, 'error');
            this.overlayText.textContent = 'Boot failed';
            this.startSimulation();
        }
    }

    startSimulation() {
        // Fallback simulation when v86 is not available
        this.log('Starting VM simulation mode...', 'warning');
        this.isRunning = true;
        this.updatePowerButton();
        this.overlay.classList.add('hidden');
        
        // Simulate boot sequence
        const bootMessages = [
            'BIOS Date 01/01/24 15:30:00 Ver: 1.0.0',
            'CPU: Intel(R) Core(TM) i7 CPU @ 2.80GHz',
            'Memory: ' + document.getElementById('memoryValue').textContent + ' MB',
            'Detecting primary master ... QEMU HARDDISK',
            'Booting from CD-ROM...',
            'Loading kernel...',
            'Initializing hardware...',
            'Starting system services...',
            'Welcome to Tiny Core Linux',
            'tc@box:~$ '
        ];

        let index = 0;
        const simulateBoot = () => {
            if (index < bootMessages.length && this.isRunning) {
                this.log(bootMessages[index], index < bootMessages.length - 1 ? 'info' : 'success');
                index++;
                setTimeout(simulateBoot, 500 + Math.random() * 500);
            }
        };

        simulateBoot();
        
        // Draw a simple terminal on canvas
        this.drawSimulationScreen();
    }

    drawSimulationScreen() {
        if (!this.isRunning) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw terminal text
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px "Courier New", monospace';
        
        const lines = [
            'Tiny Core Linux 14.0',
            'Kernel 5.15.10-tinycore64',
            '',
            'Memory: ' + document.getElementById('memoryValue').textContent + 'MB',
            'CPU Cores: ' + document.getElementById('cpuSelect').value,
            '',
            'tc@box:~$ _'
        ];

        lines.forEach((line, i) => {
            this.ctx.fillText(line, 20, 40 + i * 24);
        });
        
        // Blink cursor
        setInterval(() => {
            if (this.isRunning) {
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(130, 28, 10, 18);
                setTimeout(() => {
                    if (this.isRunning) {
                        this.ctx.fillStyle = '#00ff00';
                        this.ctx.fillRect(130, 28, 10, 18);
                    }
                }, 500);
            }
        }, 1000);
    }

    powerOff() {
        this.log('Shutting down virtual machine...', 'warning');
        
        if (this.vm) {
            try {
                this.vm.stop();
            } catch (e) {
                // Ignore errors
            }
            this.vm = null;
        }
        
        this.isRunning = false;
        this.updatePowerButton();
        this.overlayText.textContent = 'VM powered off';
        this.overlay.classList.remove('hidden');
        this.log('Virtual machine stopped', 'info');
        
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    reset() {
        this.log('Resetting virtual machine...', 'warning');
        if (this.isRunning) {
            this.powerOff();
            setTimeout(() => this.powerOn(), 500);
        } else {
            this.powerOn();
        }
    }

    toggleFullscreen() {
        const container = document.querySelector('.vm-screen-container');
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                this.log(`Fullscreen error: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    updatePowerButton() {
        const powerBtn = document.getElementById('powerBtn');
        if (this.isRunning) {
            powerBtn.classList.add('active');
            powerBtn.querySelector('.icon').textContent = '⏻';
        } else {
            powerBtn.classList.remove('active');
        }
    }

    getOSImageUrl() {
        // In a real implementation, these would be actual URLs to disk images
        const images = {
            tinycore: 'https://dl.tinycore-linux.net/14.x/x86_64/release/Core-x86_64.iso',
            kolibrios: 'https://kolibrios.org/floppy.img',
            freebsd: null // Would require larger image
        };
        return images[this.selectedOS] || null;
    }

    loadDiskImage(file) {
        if (!file) return;
        
        this.log(`Loading disk image: ${file.name}`, 'info');
        document.getElementById('diskStatus').textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.log('Disk image loaded successfully', 'success');
            this.selectedOS = 'custom';
            document.querySelectorAll('.os-card').forEach(c => c.classList.remove('active'));
            document.querySelector('[data-os="custom"]').classList.add('active');
        };
        reader.onerror = () => {
            this.log('Failed to load disk image', 'error');
        };
        reader.readAsArrayBuffer(file);
    }

    handleKeyDown(e) {
        if (!this.isRunning) return;
        
        // Prevent default for certain keys when VM is active
        if (e.ctrlKey && e.altKey) {
            // Release mouse capture hint
            this.log('Press Ctrl+Alt to release mouse capture', 'info');
        }
        
        if (this.vm) {
            this.vm.keyboard_send_scancodes([this.keyToScancode(e.keyCode)]);
        }
    }

    handleKeyUp(e) {
        if (!this.isRunning) return;
        
        if (this.vm) {
            this.vm.keyboard_send_scancodes([this.keyToScancode(e.keyCode) | 0x80]);
        }
    }

    simulateKeyPress(key) {
        if (!this.isRunning) return;
        
        this.log(`Key pressed: ${key}`, 'info');
        
        if (this.vm) {
            // Send key to VM
            this.vm.keyboard_send_scancodes([this.keyToScancodeByName(key)]);
        }
    }

    keyToScancode(keyCode) {
        // Simplified scancode mapping
        const scancodes = {
            65: 0x1E, // A
            66: 0x30, // B
            67: 0x2E, // C
            68: 0x20, // D
            69: 0x12, // E
            70: 0x21, // F
            71: 0x22, // G
            72: 0x23, // H
            73: 0x17, // I
            74: 0x24, // J
            75: 0x25, // K
            76: 0x26, // L
            77: 0x32, // M
            78: 0x31, // N
            79: 0x18, // O
            80: 0x19, // P
            81: 0x10, // Q
            82: 0x13, // R
            83: 0x1F, // S
            84: 0x14, // T
            85: 0x16, // U
            86: 0x2F, // V
            87: 0x11, // W
            88: 0x2D, // X
            89: 0x15, // Y
            90: 0x2C, // Z
            48: 0x0B, // 0
            49: 0x02, // 1
            50: 0x03, // 2
            51: 0x04, // 3
            52: 0x05, // 4
            53: 0x06, // 5
            54: 0x07, // 6
            55: 0x08, // 7
            56: 0x09, // 8
            57: 0x0A, // 9
            13: 0x1C, // Enter
            32: 0x39, // Space
            8: 0x0E,  // Backspace
            9: 0x0F,  // Tab
            27: 0x01, // Escape
        };
        return scancodes[keyCode] || 0;
    }

    keyToScancodeByName(keyName) {
        const scancodes = {
            'A': 0x1E, 'B': 0x30, 'C': 0x2E, 'D': 0x20, 'E': 0x12,
            'F': 0x21, 'G': 0x22, 'H': 0x23, 'I': 0x17, 'J': 0x24,
            'K': 0x25, 'L': 0x26, 'M': 0x32, 'N': 0x31, 'O': 0x18,
            'P': 0x19, 'Q': 0x10, 'R': 0x13, 'S': 0x1F, 'T': 0x14,
            'U': 0x16, 'V': 0x2F, 'W': 0x11, 'X': 0x2D, 'Y': 0x15,
            'Z': 0x2C,
            '1': 0x02, '2': 0x03, '3': 0x04, '4': 0x05, '5': 0x06,
            '6': 0x07, '7': 0x08, '8': 0x09, '9': 0x0A, '0': 0x0B,
            'Enter': 0x1C, 'Space': 0x39, 'Backspace': 0x0E, 'Tab': 0x0F,
            'Caps': 0x3A, 'Shift': 0x2A, 'Ctrl': 0x1D, 'Alt': 0x38,
            '`': 0x29, '-': 0x0C, '=': 0x0D, '[': 0x1A, ']': 0x1B,
            '\\': 0x2B, ';': 0x27, '\'': 0x28, ',': 0x33, '.': 0x34,
            '/': 0x35
        };
        return scancodes[keyName] || 0;
    }

    resizeCanvas() {
        const container = document.querySelector('.vm-screen-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Redraw if running
        if (this.isRunning && !this.vm) {
            this.drawSimulationScreen();
        }
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${timestamp}] ${message}`;
        this.terminalContent.appendChild(entry);
        this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.webVM = new WebVM();
});
