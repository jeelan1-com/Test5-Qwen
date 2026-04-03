# Web VM - x86 Virtual Machine in Browser

A fully functional web-based x86 virtual machine that runs directly in your browser using WebAssembly.

## Features

- **x86 Emulation**: Full x86 CPU emulation using the v86 library
- **Multiple OS Support**: 
  - Tiny Core Linux (lightweight, fast boot)
  - KolibriOS (ultra-fast 1.4MB OS)
  - FreeBSD (advanced Unix-like system)
  - Custom ISO support
- **Configurable Resources**:
  - Adjustable RAM (32MB - 512MB)
  - CPU core selection (1-4 cores)
  - Disk image loading
- **Full Keyboard Input**: Physical and virtual keyboard support
- **Terminal Output**: Real-time boot logs and system messages
- **Fullscreen Mode**: Immersive VM experience
- **macOS-inspired UI**: Beautiful glassmorphism design

## Quick Start

1. Click on an OS card to select your operating system
2. Adjust memory and CPU settings if needed
3. Click the **Power** button to start the VM
4. Use your keyboard or the virtual keyboard to interact

## How It Works

This app uses the [v86 library](https://github.com/copy/v86) which emulates an x86-compatible CPU using WebAssembly. The emulator can run real operating systems directly in the browser without any backend server.

### Architecture

```
┌─────────────────────────────────────┐
│         Browser (Your PC)           │
│  ┌───────────────────────────────┐  │
│  │    Web VM Application         │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   v86 Emulator (WASM)   │  │  │
│  │  │  ┌───────────────────┐  │  │  │
│  │  │  │  Guest OS (Linux) │  │  │  │
│  │  │  └───────────────────┘  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Current Limitations

### Simulation Mode
Currently, the VM runs in **simulation mode** because the full v86 library files are not included. To enable full emulation:

1. Download v86 from https://github.com/copy/v86
2. Place these files in the `/apps/web-vm/` directory:
   - `v86.min.js` (replace the stub)
   - `v86.wasm`
   - `seabios.bin`
   - `vgabios.bin`

### Performance
- Emulation speed depends on your device's CPU
- Larger OS images take longer to boot
- Network access is limited in browser environment

## File Structure

```
/apps/web-vm/
├── index.html      # Main HTML structure
├── vm.css          # macOS-inspired styles
├── vm.js           # VM logic and controls
├── x86.min.js      # v86 emulator (stub currently)
└── README.md       # This file
```

## Supported Operating Systems

### Tiny Core Linux
- Size: ~15MB
- Boot time: ~10 seconds
- Perfect for quick testing
- Includes basic command-line tools

### KolibriOS
- Size: ~1.4MB
- Boot time: ~3 seconds
- Fastest booting OS
- Graphical interface included

### FreeBSD
- Size: ~600MB
- Boot time: ~30+ seconds
- Full Unix-like system
- Advanced networking capabilities

### Custom ISO
- Upload any x86 bootable ISO
- Supports .img, .iso, .vdi formats
- Limited by browser memory

## Controls

| Button | Action |
|--------|--------|
| ⏻ Power | Turn VM on/off |
| ↻ Reset | Restart the VM |
| ⛶ Fullscreen | Toggle fullscreen mode |
| Load Disk | Upload custom disk image |

### Keyboard Shortcuts

- **Ctrl+Alt**: Release mouse capture
- **Any key**: Send to VM when active

## Technical Details

### Memory Management
- Minimum: 32MB
- Maximum: 512MB
- Default: 128MB
- Allocated from browser's available memory

### Display
- Canvas-based VGA output
- Resolution: 640x480 (emulated)
- Scales to fit container
- 16-bit color depth

### Input
- PS/2 keyboard emulation
- Scancode translation
- Virtual keyboard fallback
- Mouse support (in development)

## Future Enhancements

- [ ] Full v86 integration with WASM
- [ ] Save states and snapshots
- [ ] Network bridging
- [ ] USB passthrough
- [ ] Multi-VM support
- [ ] Shared folders
- [ ] Audio emulation
- [ ] Mouse integration

## Credits

- **v86 Library**: https://github.com/copy/v86
- **Tiny Core Linux**: http://tinycorelinux.net
- **KolibriOS**: https://kolibrios.org
- **FreeBSD**: https://www.freebsd.org

## License

This project is part of NexusHub. The v86 emulator is licensed under BSD-3-Clause.

---

**Note**: This is a demonstration app. For production use, ensure you have the proper licenses for any operating systems you run in the VM.
