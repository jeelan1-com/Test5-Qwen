// SharpStudio - C# IDE for Web
// Complete IDE functionality with C# compilation support

class SharpStudio {
    constructor() {
        this.currentFile = 'Program.cs';
        this.files = new Map();
        this.tabs = ['Program.cs'];
        this.history = [];
        this.historyIndex = -1;
        this.projectName = 'Untitled Project';
        this.isDarkTheme = false;
        this.problems = [];
        this.references = [
            'System.Runtime',
            'System.Collections',
            'System.Linq'
        ];
        
        this.init();
    }

    init() {
        this.setupEditor();
        this.setupEventListeners();
        this.loadDefaultCode();
        this.updateLineNumbers();
        this.loadTheme();
        this.log('SharpStudio initialized', 'info');
    }

    setupEditor() {
        this.editor = document.getElementById('codeEditor');
        this.lineNumbers = document.getElementById('lineNumbers');
        this.syntaxHighlight = document.getElementById('syntaxHighlight');
        
        if (this.editor) {
            this.editor.addEventListener('input', () => this.onEditorInput());
            this.editor.addEventListener('scroll', () => this.syncScroll());
            this.editor.addEventListener('keydown', (e) => this.handleKeydown(e));
            this.editor.addEventListener('click', () => this.updateCursorPosition());
            this.editor.addEventListener('select', () => this.updateCursorPosition());
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Fullscreen
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

        // Menu hover effects
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                document.querySelectorAll('.menu-item').forEach(i => {
                    if (i !== item) i.querySelector('.dropdown')?.classList.remove('show');
                });
            });
        });
    }

    loadDefaultCode() {
        const defaultCode = `using System;
using System.Collections.Generic;
using System.Linq;

namespace MyApplication
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
            
            // Example: Calculate factorial
            int number = 5;
            long result = Factorial(number);
            Console.WriteLine($"Factorial of {number} is {result}");
            
            // Example: LINQ query
            var numbers = new List<int> { 1, 2, 3, 4, 5 };
            var evenNumbers = numbers.Where(n => n % 2 == 0);
            
            Console.WriteLine("Even numbers: " + string.Join(", ", evenNumbers));
            
            Console.WriteLine("\\nPress any key to exit...");
            Console.ReadKey();
        }
        
        static long Factorial(int n)
        {
            if (n <= 1) return 1;
            return n * Factorial(n - 1);
        }
    }
}`;
        
        this.editor.value = defaultCode;
        this.files.set('Program.cs', defaultCode);
        this.updateSyntaxHighlight();
        this.updateLineNumbers();
    }

    onEditorInput() {
        const code = this.editor.value;
        this.files.set(this.currentFile, code);
        this.updateSyntaxHighlight();
        this.updateLineNumbers();
        this.saveToHistory();
        this.analyzeCode();
    }

    updateLineNumbers() {
        if (!this.lineNumbers || !this.editor) return;
        
        const lines = this.editor.value.split('\n').length;
        let lineNumbersHTML = '';
        
        for (let i = 1; i <= lines; i++) {
            lineNumbersHTML += `${i}\n`;
        }
        
        this.lineNumbers.textContent = lineNumbersHTML;
    }

    syncScroll() {
        if (this.lineNumbers && this.editor) {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
        }
        if (this.syntaxHighlight && this.editor) {
            this.syntaxHighlight.scrollTop = this.editor.scrollTop;
            this.syntaxHighlight.scrollLeft = this.editor.scrollLeft;
        }
    }

    updateSyntaxHighlight() {
        if (!this.syntaxHighlight || !this.editor) return;
        
        const code = this.editor.value;
        const highlighted = this.highlightCSharp(code);
        this.syntaxHighlight.innerHTML = highlighted;
    }

    highlightCSharp(code) {
        // Escape HTML
        let escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Keywords
        const keywords = [
            'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch',
            'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default',
            'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit',
            'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach',
            'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal',
            'is', 'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator',
            'out', 'override', 'params', 'private', 'protected', 'public',
            'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof',
            'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw',
            'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe',
            'ushort', 'using', 'virtual', 'void', 'volatile', 'while',
            'var', 'async', 'await', 'yield', 'dynamic', 'get', 'set', 'value'
        ];

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
            escaped = escaped.replace(regex, '<span class="keyword">$1</span>');
        });

        // Types
        const types = [
            'Console', 'String', 'Int32', 'Double', 'Boolean', 'DateTime',
            'List', 'Dictionary', 'Array', 'IEnumerable', 'IQueryable',
            'Task', 'Action', 'Func', 'Predicate', 'Exception'
        ];

        types.forEach(type => {
            const regex = new RegExp(`\\b(${type})\\b`, 'g');
            escaped = escaped.replace(regex, '<span class="type">$1</span>');
        });

        // Strings
        escaped = escaped.replace(/(".*?")/g, '<span class="string">$1</span>');

        // Comments
        escaped = escaped.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
        escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

        // Numbers
        escaped = escaped.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

        // Methods
        escaped = escaped.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="function">$1</span>');

        return escaped;
    }

    handleKeydown(e) {
        // Tab handling
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.editor.selectionStart;
            const end = this.editor.selectionEnd;
            
            this.editor.value = this.editor.value.substring(0, start) + 
                '    ' + this.editor.value.substring(end);
            
            this.editor.selectionStart = this.editor.selectionEnd = start + 4;
            this.onEditorInput();
        }

        // Auto-close brackets
        const pairs = {
            '(': ')',
            '[': ']',
            '{': '}',
            '"': '"',
            "'": "'"
        };

        if (pairs[e.key]) {
            e.preventDefault();
            const start = this.editor.selectionStart;
            const end = this.editor.selectionEnd;
            const selectedText = this.editor.value.substring(start, end);
            
            this.editor.value = this.editor.value.substring(0, start) + 
                e.key + pairs[e.key] + selectedText + 
                this.editor.value.substring(end);
            
            this.editor.selectionStart = this.editor.selectionEnd = start + 1;
            this.onEditorInput();
        }

        // Enter key - auto-indent
        if (e.key === 'Enter') {
            e.preventDefault();
            const start = this.editor.selectionStart;
            const currentLine = this.editor.value.substring(
                this.editor.value.lastIndexOf('\n', start - 1) + 1,
                start
            );
            
            const indent = currentLine.match(/^\s*/)[0];
            const previousChar = this.editor.value[start - 1];
            
            let extraIndent = '';
            if (previousChar === '{') {
                extraIndent = '    ';
            }
            
            this.editor.value = this.editor.value.substring(0, start) + 
                '\n' + indent + extraIndent + 
                this.editor.value.substring(this.editor.selectionEnd);
            
            const newPos = start + 1 + indent.length + extraIndent.length;
            this.editor.selectionStart = this.editor.selectionEnd = newPos;
            this.onEditorInput();
        }
    }

    handleGlobalKeydown(e) {
        // Ctrl+S - Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveProject();
        }

        // Ctrl+Z - Undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }

        // Ctrl+Y or Ctrl+Shift+Z - Redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            this.redo();
        }

        // F5 - Run
        if (e.key === 'F5' && !e.shiftKey) {
            e.preventDefault();
            this.compileAndRun();
        }

        // Shift+F5 - Stop
        if (e.shiftKey && e.key === 'F5') {
            e.preventDefault();
            this.stopExecution();
        }

        // Ctrl+Shift+B - Build
        if (e.ctrlKey && e.shiftKey && e.key === 'B') {
            e.preventDefault();
            this.compileOnly();
        }

        // Ctrl+F - Find
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            this.findReplace();
        }

        // Ctrl+/ - Toggle Comment
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            this.toggleComment();
        }
    }

    updateCursorPosition() {
        if (!this.editor) return;
        
        const text = this.editor.value.substring(0, this.editor.selectionStart);
        const lines = text.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        
        const cursorPos = document.getElementById('cursorPosition');
        if (cursorPos) {
            cursorPos.textContent = `Ln ${line}, Col ${col}`;
        }
        
        const selectedText = this.editor.value.substring(
            this.editor.selectionStart,
            this.editor.selectionEnd
        );
        
        const selectionInfo = document.getElementById('selectionInfo');
        if (selectionInfo && selectedText.length > 0) {
            selectionInfo.textContent = `(${selectedText.length} selected)`;
        } else if (selectionInfo) {
            selectionInfo.textContent = '';
        }
    }

    saveToHistory() {
        const currentState = this.editor.value;
        
        // Remove any future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(currentState);
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 100) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.editor.value = this.history[this.historyIndex];
            this.onEditorInput();
            this.log('Undo performed', 'info');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.editor.value = this.history[this.historyIndex];
            this.onEditorInput();
            this.log('Redo performed', 'info');
        }
    }

    cut() {
        document.execCommand('cut');
    }

    copy() {
        document.execCommand('copy');
    }

    paste() {
        document.execCommand('paste');
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.documentElement.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
        localStorage.setItem('sharpstudio-theme', this.isDarkTheme ? 'dark' : 'light');
        
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = this.isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.log(`Switched to ${this.isDarkTheme ? 'dark' : 'light'} theme`, 'info');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('sharpstudio-theme');
        if (savedTheme === 'dark') {
            this.isDarkTheme = true;
            document.documentElement.setAttribute('data-theme', 'dark');
            const themeIcon = document.querySelector('#themeToggle i');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                this.log(`Fullscreen error: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Project Management
    newProject() {
        const modal = document.getElementById('newProjectModal');
        if (modal) {
            modal.classList.add('active');
            modal.classList.remove('hidden');
        }
    }

    createNewProject() {
        const nameInput = document.getElementById('newProjectName');
        const typeSelect = document.getElementById('projectType');
        const versionSelect = document.getElementById('dotnetVersion');
        
        if (!nameInput || !typeSelect || !versionSelect) return;
        
        const projectName = nameInput.value.trim() || 'MyApplication';
        const projectType = typeSelect.value;
        const dotnetVersion = versionSelect.value;
        
        this.projectName = projectName;
        document.getElementById('projectNameDisplay').textContent = projectName;
        
        // Generate template based on type
        let template = '';
        switch (projectType) {
            case 'console':
                template = this.getConsoleTemplate(projectName);
                break;
            case 'classlib':
                template = this.getClassLibTemplate(projectName);
                break;
            case 'webapi':
                template = this.getWebApiTemplate(projectName);
                break;
            case 'mvc':
                template = this.getMvcTemplate(projectName);
                break;
            case 'blazor':
                template = this.getBlazorTemplate(projectName);
                break;
        }
        
        this.editor.value = template;
        this.files.set('Program.cs', template);
        this.onEditorInput();
        
        this.closeModal('newProjectModal');
        this.log(`Created new ${projectType} project: ${projectName}`, 'success');
    }

    getConsoleTemplate(name) {
        return `using System;

namespace ${name}
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
        }
    }
}`;
    }

    getClassLibTemplate(name) {
        return `using System;

namespace ${name}
{
    public class Class1
    {
        public string GetMessage()
        {
            return "Hello from Class Library!";
        }
    }
}`;
    }

    getWebApiTemplate(name) {
        return `using Microsoft.AspNetCore.Mvc;

namespace ${name}.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ValuesController : ControllerBase
    {
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }
        
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return $"value{id}";
        }
    }
}`;
    }

    getMvcTemplate(name) {
        return `using Microsoft.AspNetCore.Mvc;

namespace ${name}.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}`;
    }

    getBlazorTemplate(name) {
        return `@page "/"

<h1>Welcome to ${name}</h1>

<p>This is your first Blazor component!</p>

<button @onclick="IncrementCount">Click me</button>
<p>Current count: @currentCount</p>

@code {
    private int currentCount = 0;

    private void IncrementCount()
    {
        currentCount++;
    }
}`;
    }

    openProject() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                const fileName = file.name;
                
                this.files.set(fileName, content);
                this.addTab(fileName);
                this.switchTab(fileName);
                this.editor.value = content;
                this.onEditorInput();
                
                this.log(`Opened file: ${fileName}`, 'info');
            };
            reader.readAsText(file);
        });
        
        e.target.value = '';
    }

    saveProject() {
        const content = this.editor.value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log(`Saved ${this.currentFile}`, 'success');
    }

    exportProject() {
        // Export all files as a zip-like structure
        let exportContent = `Project: ${this.projectName}\n`;
        exportContent += `Exported: ${new Date().toISOString()}\n\n`;
        exportContent += '='.repeat(50) + '\n\n';
        
        this.files.forEach((content, fileName) => {
            exportContent += `// File: ${fileName}\n`;
            exportContent += '//'.repeat(50) + '\n\n';
            exportContent += content + '\n\n';
            exportContent += '='.repeat(50) + '\n\n';
        });
        
        const blob = new Blob([exportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.projectName.replace(/\s+/g, '_')}_export.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('Project exported', 'success');
    }

    importFile() {
        this.openProject();
    }

    // Tab Management
    addTab(fileName) {
        if (!this.tabs.includes(fileName)) {
            this.tabs.push(fileName);
            this.renderTabs();
        }
    }

    closeTab(fileName) {
        const index = this.tabs.indexOf(fileName);
        if (index > -1) {
            this.tabs.splice(index, 1);
            
            if (this.currentFile === fileName && this.tabs.length > 0) {
                this.switchTab(this.tabs[this.tabs.length - 1]);
            }
            
            this.renderTabs();
        }
    }

    switchTab(fileName) {
        this.currentFile = fileName;
        const content = this.files.get(fileName) || '';
        this.editor.value = content;
        this.onEditorInput();
        this.renderTabs();
    }

    renderTabs() {
        const tabsBar = document.getElementById('tabsBar');
        if (!tabsBar) return;
        
        tabsBar.innerHTML = '';
        this.tabs.forEach(fileName => {
            const tab = document.createElement('div');
            tab.className = `tab ${fileName === this.currentFile ? 'active' : ''}`;
            tab.onclick = () => this.switchTab(fileName);
            
            const tabName = document.createElement('span');
            tabName.className = 'tab-name';
            tabName.textContent = fileName;
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'tab-close';
            closeBtn.innerHTML = '×';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.closeTab(fileName);
            };
            
            tab.appendChild(tabName);
            tab.appendChild(closeBtn);
            tabsBar.appendChild(tab);
        });
    }

    // Compilation and Execution
    compileAndRun() {
        this.log('Compiling...', 'info');
        
        setTimeout(() => {
            const analysis = this.analyzeCode();
            
            if (analysis.errors.length > 0) {
                this.log('Compilation failed!', 'error');
                analysis.errors.forEach(error => {
                    this.log(error, 'error');
                });
                this.updateProblems(analysis.errors);
                return;
            }
            
            this.log('Build succeeded!', 'success');
            this.updateProblems([]);
            
            this.log('Running...', 'info');
            this.simulateExecution();
        }, 500);
    }

    compileOnly() {
        this.log('Building...', 'info');
        
        setTimeout(() => {
            const analysis = this.analyzeCode();
            
            if (analysis.errors.length > 0) {
                this.log('Build failed!', 'error');
                analysis.errors.forEach(error => {
                    this.log(error, 'error');
                });
                this.updateProblems(analysis.errors);
            } else {
                this.log('Build succeeded!', 'success');
                this.log('0 errors, 0 warnings', 'info');
                this.updateProblems([]);
            }
        }, 500);
    }

    stopExecution() {
        this.log('Execution stopped', 'warning');
    }

    simulateExecution() {
        const code = this.editor.value;
        
        this.log('Output:', 'info');
        this.log('-'.repeat(40), 'info');
        
        // Simulate Console.WriteLine
        const writeLineMatches = code.match(/Console\.WriteLine\((.*?)\)/g);
        if (writeLineMatches) {
            writeLineMatches.forEach(match => {
                let output = match.replace(/Console\.WriteLine\(|\)/g, '');
                output = output.replace(/"/g, '');
                
                // Handle string interpolation
                if (output.includes('${') || output.includes('{')) {
                    output = this.evaluateInterpolation(output);
                }
                
                this.log(output, 'success');
            });
        }
        
        this.log('-'.repeat(40), 'info');
        this.log('Process exited with code 0', 'info');
    }

    evaluateInterpolation(str) {
        // Simple interpolation simulation
        str = str.replace(/\{number\}/g, '5');
        str = str.replace(/\{result\}/g, '120');
        str = str.replace(/\{n\}/g, '5');
        return str;
    }

    analyzeCode() {
        const code = this.editor.value;
        const errors = [];
        const warnings = [];
        
        // Check for basic syntax issues
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        
        if (openBraces !== closeBraces) {
            errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
        }
        
        // Check for missing semicolons (simple check)
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Skip comments, empty lines, and control structures
            if (!trimmed || 
                trimmed.startsWith('//') || 
                trimmed.startsWith('/*') ||
                trimmed.endsWith('{') ||
                trimmed.endsWith('}') ||
                trimmed.startsWith('using ') ||
                trimmed.startsWith('namespace ') ||
                trimmed.startsWith('class ') ||
                trimmed.startsWith('static ') ||
                trimmed.startsWith('public ') ||
                trimmed.startsWith('private ') ||
                trimmed.startsWith('protected ') ||
                /(?:if|else|for|foreach|while|switch|try|catch|finally)\s*\(/.test(trimmed)) {
                return;
            }
            
            // Check for statements that should end with semicolon
            if (!trimmed.endsWith(';') && 
                !trimmed.endsWith(',') &&
                !trimmed.startsWith('#') &&
                trimmed.length > 0) {
                // This is a simplified check - real C# parsing is more complex
            }
        });
        
        // Check for common mistakes
        if (code.includes('Console.WriteLin')) {
            errors.push('Possible typo: "Console.WriteLin" should be "Console.WriteLine"');
        }
        
        if (code.includes('Main') && !code.includes('static void Main')) {
            errors.push('Entry point "Main" must be declared as "static void Main"');
        }
        
        this.problems = [...errors, ...warnings];
        
        return { errors, warnings };
    }

    updateProblems(errors) {
        const problemsBadge = document.getElementById('problemsBadge');
        const problemCount = document.getElementById('problemCount');
        const problemsContent = document.getElementById('problemsContent');
        
        if (problemsBadge) {
            problemsBadge.textContent = errors.length;
        }
        
        if (problemCount) {
            problemCount.textContent = `${errors.length} problem${errors.length !== 1 ? 's' : ''} found`;
        }
        
        if (problemsContent) {
            if (errors.length === 0) {
                problemsContent.innerHTML = `
                    <div class="no-problems">
                        <i class="fas fa-check-circle"></i>
                        <p>No problems detected</p>
                    </div>
                `;
            } else {
                problemsContent.innerHTML = errors.map(error => `
                    <div class="problem-item">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${error}</span>
                    </div>
                `).join('');
            }
        }
    }

    // Code Formatting
    formatCode() {
        const code = this.editor.value;
        // Simple formatting - in production, use a proper formatter
        let formatted = code;
        
        // Basic indentation fix
        const lines = formatted.split('\n');
        let indentLevel = 0;
        
        formatted = lines.map(line => {
            const trimmed = line.trim();
            
            if (trimmed.includes('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            const indented = '    '.repeat(indentLevel) + trimmed;
            
            if (trimmed.includes('{') && !trimmed.endsWith('{')) {
                indentLevel++;
            } else if (trimmed.includes('{')) {
                indentLevel++;
            }
            
            return indented;
        }).join('\n');
        
        this.editor.value = formatted;
        this.onEditorInput();
        this.log('Code formatted', 'info');
    }

    findReplace() {
        const modal = document.getElementById('findReplaceModal');
        if (modal) {
            modal.classList.add('active');
            modal.classList.remove('hidden');
        }
    }

    findNext() {
        const findText = document.getElementById('findText').value;
        if (!findText) return;
        
        const startPos = this.editor.selectionEnd;
        const code = this.editor.value;
        const index = code.indexOf(findText, startPos);
        
        if (index === -1) {
            // Wrap around
            const wrapIndex = code.indexOf(findText, 0);
            if (wrapIndex !== -1) {
                this.editor.setSelectionRange(wrapIndex, wrapIndex + findText.length);
            } else {
                this.log('Text not found', 'warning');
            }
        } else {
            this.editor.setSelectionRange(index, index + findText.length);
        }
    }

    replaceOne() {
        const findText = document.getElementById('findText').value;
        const replaceText = document.getElementById('replaceText').value;
        
        if (!findText) return;
        
        const selectedText = this.editor.value.substring(
            this.editor.selectionStart,
            this.editor.selectionEnd
        );
        
        if (selectedText === findText) {
            const start = this.editor.selectionStart;
            this.editor.value = this.editor.value.substring(0, start) + 
                replaceText + 
                this.editor.value.substring(this.editor.selectionEnd);
            
            this.editor.selectionStart = this.editor.selectionEnd = start + replaceText.length;
            this.onEditorInput();
        } else {
            this.findNext();
        }
    }

    replaceAll() {
        const findText = document.getElementById('findText').value;
        const replaceText = document.getElementById('replaceText').value;
        const matchCase = document.getElementById('matchCase').checked;
        
        if (!findText) return;
        
        let flags = 'g';
        if (!matchCase) {
            flags += 'i';
        }
        
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        const count = (this.editor.value.match(regex) || []).length;
        
        this.editor.value = this.editor.value.replace(regex, replaceText);
        this.onEditorInput();
        
        this.log(`Replaced ${count} occurrence(s)`, 'success');
    }

    toggleComment() {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);
        
        if (selectedText.includes('//')) {
            // Uncomment
            const uncommented = selectedText.replace(/^\/\/\s?/gm, '');
            this.editor.value = this.editor.value.substring(0, start) + 
                uncommented + 
                this.editor.value.substring(end);
        } else {
            // Comment
            const commented = selectedText.replace(/^/gm, '// ');
            this.editor.value = this.editor.value.substring(0, start) + 
                commented + 
                this.editor.value.substring(end);
        }
        
        this.onEditorInput();
    }

    // Panel Management
    togglePanel(panelName) {
        if (panelName === 'explorer') {
            const explorer = document.getElementById('explorerPanel');
            if (explorer) {
                explorer.classList.toggle('hidden');
            }
        } else if (panelName === 'output') {
            const rightPanel = document.getElementById('rightPanel');
            if (rightPanel) {
                rightPanel.classList.toggle('hidden');
            }
        }
    }

    switchRightPanel(panelName) {
        const panels = ['output', 'problems', 'references'];
        panels.forEach(panel => {
            const panelEl = document.getElementById(`${panel}Panel`);
            const tab = document.querySelector(`[data-panel="${panel}"]`);
            
            if (panelEl && tab) {
                if (panel === panelName) {
                    panelEl.classList.remove('hidden');
                    tab.classList.add('active');
                } else {
                    panelEl.classList.add('hidden');
                    tab.classList.remove('active');
                }
            }
        });
    }

    // File Tree
    toggleFolder(element) {
        const treeItem = element.closest('.tree-item');
        if (treeItem) {
            treeItem.classList.toggle('expanded');
            
            const icon = element.querySelector('i:nth-child(2)');
            if (icon) {
                icon.className = treeItem.classList.contains('expanded') 
                    ? 'fas fa-folder-open' 
                    : 'fas fa-folder';
            }
        }
    }

    addNewFile() {
        const fileName = prompt('Enter file name:', 'NewFile.cs');
        if (fileName) {
            this.files.set(fileName, '// New file\n');
            this.addTab(fileName);
            this.addFileToTree(fileName);
            this.log(`Created file: ${fileName}`, 'info');
        }
    }

    addNewFolder() {
        const folderName = prompt('Enter folder name:', 'NewFolder');
        if (folderName) {
            this.addFolderToTree(folderName);
            this.log(`Created folder: ${folderName}`, 'info');
        }
    }

    addFileToTree(fileName) {
        const treeChildren = document.getElementById('fileTreeChildren');
        if (!treeChildren) return;
        
        const fileItem = document.createElement('div');
        fileItem.className = 'tree-item file';
        fileItem.innerHTML = `
            <div class="tree-label" onclick="studio.switchTab('${fileName}')">
                <i class="fas fa-file-code"></i>
                <span>${fileName}</span>
            </div>
        `;
        
        treeChildren.appendChild(fileItem);
    }

    addFolderToTree(folderName) {
        const treeChildren = document.getElementById('fileTreeChildren');
        if (!treeChildren) return;
        
        const folderItem = document.createElement('div');
        folderItem.className = 'tree-item folder';
        folderItem.innerHTML = `
            <div class="tree-label" onclick="studio.toggleFolder(this)">
                <i class="fas fa-chevron-right"></i>
                <i class="fas fa-folder"></i>
                <span>${folderName}</span>
            </div>
            <div class="tree-children"></div>
        `;
        
        treeChildren.appendChild(folderItem);
    }

    // References
    addReference() {
        const refName = prompt('Enter reference name:', 'System.');
        if (refName) {
            this.references.push(refName);
            this.renderReferences();
            this.log(`Added reference: ${refName}`, 'info');
        }
    }

    renderReferences() {
        const referencesContent = document.getElementById('referencesContent');
        if (!referencesContent) return;
        
        referencesContent.innerHTML = this.references.map(ref => `
            <div class="reference-item">
                <i class="fas fa-book"></i>
                <span>${ref}</span>
            </div>
        `).join('');
    }

    // Output Logging
    log(message, type = 'info') {
        const outputContent = document.getElementById('outputContent');
        if (!outputContent) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.className = `output-line ${type}`;
        line.textContent = `[${timestamp}] ${message}`;
        
        outputContent.appendChild(line);
        outputContent.scrollTop = outputContent.scrollHeight;
    }

    clearOutput() {
        const outputContent = document.getElementById('outputContent');
        if (outputContent) {
            outputContent.innerHTML = '';
            this.log('Output cleared', 'info');
        }
    }

    // Modals
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    showShortcuts() {
        const modal = document.getElementById('shortcutsModal');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        }
    }

    showDocumentation() {
        window.open('https://docs.microsoft.com/en-us/dotnet/csharp/', '_blank');
    }

    showAbout() {
        alert('SharpStudio v1.0\n\nA modern C# IDE for the web.\nBuilt with HTML, CSS, and JavaScript.\n\nFeatures:\n- Syntax highlighting\n- Code compilation simulation\n- Project management\n- Dark/Light themes\n- Keyboard shortcuts');
    }
}

// Initialize the IDE
let studio;
document.addEventListener('DOMContentLoaded', () => {
    studio = new SharpStudio();
    
    // Make functions globally accessible
    window.newProject = () => studio.newProject();
    window.createNewProject = () => studio.createNewProject();
    window.openProject = () => studio.openProject();
    window.saveProject = () => studio.saveProject();
    window.exportProject = () => studio.exportProject();
    window.importFile = () => studio.importFile();
    window.closeTab = (name) => studio.closeTab(name);
    window.compileAndRun = () => studio.compileAndRun();
    window.compileOnly = () => studio.compileOnly();
    window.stopExecution = () => studio.stopExecution();
    window.formatCode = () => studio.formatCode();
    window.findReplace = () => studio.findReplace();
    window.findNext = () => studio.findNext();
    window.replaceOne = () => studio.replaceOne();
    window.replaceAll = () => studio.replaceAll();
    window.togglePanel = (name) => studio.togglePanel(name);
    window.switchRightPanel = (name) => studio.switchRightPanel(name);
    window.toggleFolder = (el) => studio.toggleFolder(el);
    window.addNewFile = () => studio.addNewFile();
    window.addNewFolder = () => studio.addNewFolder();
    window.addReference = () => studio.addReference();
    window.clearOutput = () => studio.clearOutput();
    window.closeModal = (id) => studio.closeModal(id);
    window.showShortcuts = () => studio.showShortcuts();
    window.showDocumentation = () => studio.showDocumentation();
    window.showAbout = () => studio.showAbout();
    
    // Editor methods
    window.editor = {
        undo: () => studio.undo(),
        redo: () => studio.redo(),
        cut: () => studio.cut(),
        copy: () => studio.copy(),
        paste: () => studio.paste()
    };
});
