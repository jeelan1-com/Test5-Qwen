# SharpStudio - C# IDE for Web

A professional C# Integrated Development Environment (IDE) that runs entirely in your browser. Built with HTML, CSS, and JavaScript, SharpStudio provides a Visual Studio-like experience for writing, compiling, and running C# code without any server requirements.

## Features

### Core Features
- **Syntax Highlighting** - Full C# syntax highlighting with keywords, types, strings, comments, and methods
- **Code Editor** - Advanced editor with line numbers, auto-indentation, and bracket matching
- **Project Management** - Create, open, save, and export C# projects
- **Compilation** - Build and run C# code with error detection and problem reporting
- **Output Console** - Real-time output display with timestamped logs

### Project Templates
- Console Application
- Class Library
- ASP.NET Core Web API
- ASP.NET Core MVC
- Blazor WebAssembly

### Editor Features
- **Smart Editing**
  - Tab indentation (4 spaces)
  - Auto-close brackets and quotes
  - Auto-indent on Enter
  - Toggle comments (Ctrl+/)

- **Navigation**
  - Multiple tabs for different files
  - File explorer panel
  - Line and column tracking
  - Selection info

- **Editing Tools**
  - Undo/Redo (Ctrl+Z, Ctrl+Y)
  - Cut/Copy/Paste
  - Find & Replace (Ctrl+F, Ctrl+H)
  - Code formatting

### Compilation & Execution
- Syntax validation
- Brace matching check
- Error detection and reporting
- Simulated execution output
- Problem panel with issue tracking

### User Interface
- **macOS-Inspired Design**
  - Glassmorphism effects
  - Smooth animations
  - Rounded corners
  - Modern typography

- **Theme Support**
  - Light theme
  - Dark theme
  - Persistent theme preference
  - Quick toggle button

- **Panels**
  - File Explorer
  - Output Console
  - Problems Panel
  - References Manager

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save Project |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `F5` | Run |
| `Shift+F5` | Stop |
| `Ctrl+Shift+B` | Build |
| `Ctrl+F` | Find |
| `Ctrl+H` | Replace |
| `Ctrl+/` | Toggle Comment |
| `Tab` | Insert Indentation |

### File Management
- Create new files
- Create folders
- Open existing files
- Save files to disk
- Export entire project
- Import files from disk

## Usage

### Getting Started
1. Open `index.html` in any modern web browser
2. Start coding immediately with the default template
3. Use the toolbar or menu to access features

### Creating a New Project
1. Click **File → New Project** or press the New button
2. Enter project name
3. Select project type (Console, ClassLib, WebAPI, MVC, Blazor)
4. Choose .NET version
5. Click **Create**

### Writing Code
- Type C# code in the editor
- Enjoy syntax highlighting as you type
- Use keyboard shortcuts for efficiency
- Access the file explorer to manage multiple files

### Building and Running
1. Click the **Run** button or press `F5`
2. View compilation results in the Output panel
3. Check the Problems panel for any errors
4. See simulated output in the console

### Managing Files
- **New File**: Click the + icon in Explorer or use File menu
- **New Folder**: Click the folder+ icon in Explorer
- **Open File**: File → Open Project or drag and drop
- **Save**: File → Save or press `Ctrl+S`
- **Export**: File → Export to download all files

## Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **No Backend**: Everything runs client-side
- **Storage**: Uses browser localStorage for preferences
- **Emulation**: Simulates C# compilation and execution

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Dependencies
- Font Awesome 6.4.0 (icons)
- No other external dependencies

## File Structure

```
sharp-studio/
├── index.html          # Main application page
├── sharp-studio.css    # Styles (macOS-inspired)
├── sharp-studio.js     # Application logic
└── README.md           # This file
```

## Limitations

Since SharpStudio runs entirely in the browser without a backend:

1. **Compilation**: Uses simulation rather than actual .NET compiler
2. **Execution**: Output is simulated based on code analysis
3. **IntelliSense**: Basic syntax highlighting only
4. **Debugging**: No step-through debugging capabilities
5. **NuGet**: Package manager not available

For production C# development, consider using:
- Visual Studio 2022
- Visual Studio Code with C# extension
- JetBrains Rider
- Online compilers like .NET Fiddle

## Future Enhancements

Planned features for future versions:

- [ ] WebAssembly-based Roslyn compiler integration
- [ ] Real code execution via WebAssembly
- [ ] IntelliSense and code completion
- [ ] Debugging support
- [ ] Git integration
- [ ] Plugin system
- [ ] Theme customization
- [ ] Multi-language support
- [ ] Cloud sync integration
- [ ] Collaborative editing

## License

This project is part of NexusHub and is provided as-is for educational and demonstration purposes.

## Credits

- Designed and developed for NexusHub platform
- Inspired by Visual Studio and VS Code
- macOS design language influence

---

**SharpStudio** - Professional C# Development in Your Browser 🚀
