# NexusHub - Your All-in-One Web Platform

![NexusHub](https://img.shields.io/badge/NexusHub-Web%20Platform-6366f1)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-success)

## 🌐 Overview

**NexusHub** is a modern, beautiful web platform that brings together essential productivity tools, apps, services, AI tools, utilities, and creative tools in one cohesive interface. Built with a macOS-inspired design language featuring glassmorphism, rounded corners, and smooth animations, NexusHub provides a premium user experience across all devices.

### What is NexusHub?

NexusHub is designed to be your go-to destination for:
- **Apps**: Productivity and creativity applications that run entirely in your browser
- **Services**: Cloud-based tools and utilities
- **AI Tools**: Cutting-edge artificial intelligence solutions
- **Utilities**: Everyday tools for common tasks
- **Creative Tools**: Applications for designers, artists, and creators

All applications are:
- ✅ Fully offline-capable (no backend required for most apps)
- ✅ Privacy-first (your data stays on your device)
- ✅ Free to use (no account required)
- ✅ Beautifully designed (macOS-inspired UI)
- ✅ Responsive (works on desktop and mobile)

---

## 📁 Project Structure

```
/workspace
├── index.html              # Main homepage
├── styles.css              # Global styles (dark/light themes)
├── script.js               # Global JavaScript (theme toggle, etc.)
├── pages/
│   ├── news.html           # News & updates timeline
│   ├── apps.html           # Apps listing page
│   ├── about.html          # About page
│   ├── docs.html           # Documentation page
│   └── contact.html        # Contact page
├── apps/
│   └── whiteboard/
│       ├── index.html      # Whiteboard app
│       └── whiteboard.js   # Whiteboard functionality
└── README.md               # This file
```

---

## 🎨 Design Philosophy

NexusHub follows a **macOS-inspired design language**:
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Rounded Corners**: Smooth, friendly UI elements
- **Smooth Animations**: Subtle transitions and hover effects
- **Dark & Light Themes**: Automatic theme switching with persistence
- **Gradient Accents**: Beautiful purple/indigo gradient highlights
- **Clean Typography**: Inter font family for optimal readability

---

## 🚀 Already Built

### ✅ Homepage
Modern landing page introducing the platform with:
- Hero section with animated gradient orbs
- Features showcase
- Category cards (Apps, Services, AI Tools)
- Call-to-action sections
- Responsive navigation with theme toggle

### ✅ News Page
Timeline-style page for updates and announcements:
- Clean vertical timeline layout
- Version update sections
- Example updates to get started

### ✅ Apps Page
Gallery of all available apps:
- App cards with icons and descriptions
- Status badges (Available, Coming Soon, Planned)
- Direct links to launch apps

### ✅ About Page
Information about NexusHub:
- Mission statement
- Company story
- Core values
- Statistics

### ✅ Documentation Page
Comprehensive documentation:
- Getting started guide
- Feature overview
- App-specific documentation
- FAQ and troubleshooting

### ✅ Contact Page
Contact form and information:
- Contact cards with info
- Working contact form
- Social media links

### ✅ Whiteboard App (GoodNotes-Style)
Our first fully functional app!

**Features:**
- 🎨 Multiple drawing tools (Pen, Highlighter, Eraser)
- 🌈 6 color options
- 📏 Adjustable stroke size
- ↩️ Undo/Redo functionality (Ctrl+Z / Ctrl+Shift+Z)
- 📄 Multiple pages support with thumbnails
- 📥 PDF import capability
- 📤 Export as PNG or PDF
- 🌓 Dark/Light theme support
- ✋ Touch support for tablets
- 💾 Fully offline - no backend required

**Location:** `/apps/whiteboard/index.html`

---

## 📋 Planned Apps

Here are the apps we plan to build:

| App | Status | Description |
|-----|--------|-------------|
| Whiteboard | ✅ Built | GoodNotes-style digital whiteboard |
| AI Chat Room | 🔜 Upcoming | Real-time chat with Firebase |
| Cloud Notes | 📅 Planned | Sync notes across devices |
| Password Manager | 📅 Planned | Secure password storage |
| To-Do App | 📅 Planned | Task management |
| Calendar | 📅 Planned | Event management & reminders |
| Code Editor | 📅 Planned | Browser-based code editor |
| Music Player | 📅 Planned | Audio player with playlists |
| PDF Tools | 📅 Planned | Merge, split, compress PDFs |
| Image Editor | 📅 Planned | Basic image editing |
| File Manager | 📅 Planned | Organize and manage files |
| Mini OS Dashboard | 📅 Planned | Desktop-like experience |
| Simple Multiplayer Game | 📅 Planned | Browser-based gaming |
| Video Editor | 📅 Planned | Basic video editing |

---

## 🔀 Branch Workflow

**IMPORTANT:** This repository uses a strict two-branch workflow:

### `main` Branch
- **Purpose**: Hosted version (production-ready)
- **Deployment**: Automatically deployed to GitHub Pages
- **Stability**: Always stable and working

### `Edit1` Branch  
- **Purpose**: Development branch
- **Usage**: ALL coding and development happens here
- **Merge Process**: Changes are manually merged into `main` when ready

### Workflow Rules:
1. Never commit directly to `main`
2. All new features and fixes go to `Edit1` first
3. Test thoroughly on `Edit1`
4. Manually merge `Edit1` → `main` when ready to deploy
5. Keep only these two branches - no feature branches

```
Edit1 (Development)  ──merge──>  main (Production)
     ↑                                    ↓
  Code here                         GitHub Pages
```

---

## 🛠️ Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required!

### Running Locally
1. Clone or download this repository
2. Open `index.html` in your browser
3. That's it!

### Deploying to GitHub Pages
1. Make sure you're on the `main` branch
2. Go to Repository Settings > Pages
3. Set source to `main` branch
4. Your site will be live at `https://yourusername.github.io/repo-name`

---

## 📱 Browser Support

NexusHub works best on modern browsers:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🎯 Future Roadmap

### Phase 1 (Current)
- [x] Homepage with modern design
- [x] Basic pages (News, Apps, About, Docs, Contact)
- [x] Whiteboard app
- [ ] Theme customization options

### Phase 2 (Next)
- [ ] AI Chat Room with Firebase
- [ ] Cloud Notes app
- [ ] Local storage for saving drawings
- [ ] PWA support (install as app)

### Phase 3 (Future)
- [ ] More productivity apps
- [ ] User accounts (optional)
- [ ] Collaboration features
- [ ] Mobile apps

---

## 🤖 Upcoming Apps

### AI CHAT ROOM APP (UPCOMING)

**Full specification for our next app:**

I want to build a full chat room system using only GitHub Pages + Firebase.

**Requirements:**
1. Firebase Authentication (email + password)
2. Firebase Firestore for storing chat messages
3. A global chat room where all logged-in users can talk
4. A simple UI with:
   - Login page
   - Signup page
   - Chat page
5. Realtime updates: new messages appear instantly
6. Store username in Firebase Auth profile
7. Messages should show:
   - Username
   - Message text
   - Timestamp
8. Provide:
   - `index.html`
   - `login.html`
   - `signup.html`
   - `chat.html`
   - `firebase.js`
   - `chat.js`
   - `auth.js`
9. Use only vanilla HTML/CSS/JS
10. Must work on GitHub Pages

*Note: This app is planned but not yet built.*

---

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

- Design inspired by macOS Big Sur and later
- Font: Inter by Rasmus Andersson
- Icons: Font Awesome

---

## 📬 Contact

Have questions or suggestions? Visit our [Contact Page](pages/contact.html) or open an issue on GitHub.

---

**Built with ❤️ using HTML, CSS, and JavaScript**