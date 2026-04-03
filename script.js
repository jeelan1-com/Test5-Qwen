/* ========================================
   🎨 NEXUS HUB - MODERN MACOS INTERACTIONS
   ======================================== */

// Theme Management
const ThemeManager = {
    init() {
        this.loadTheme();
        this.bindEvents();
    },
    
    loadTheme() {
        const saved = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
    },
    
    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    },
    
    bindEvents() {
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.addEventListener('click', () => this.toggle());
        });
    }
};

// Scroll Animations
const ScrollAnimations = {
    init() {
        this.observer = new IntersectionObserver(
            entries => entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            }),
            { threshold: 0.1, rootMargin: '50px' }
        );
        
        document.querySelectorAll('.fade-in, .glass-card, .feature-card').forEach(el => {
            el.classList.add('fade-in');
            this.observer.observe(el);
        });
    }
};

// Navigation
const Navigation = {
    init() {
        this.setActiveLink();
        this.handleScroll();
    },
    
    setActiveLink() {
        const path = window.location.pathname;
        document.querySelectorAll('.nav-item').forEach(link => {
            if (link.getAttribute('href') === path || 
                (path === '/' && link.getAttribute('href') === '/index.html')) {
                link.classList.add('active');
            }
        });
    },
    
    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'var(--bg-glass-strong)';
                navbar.style.boxShadow = 'var(--shadow-md)';
            } else {
                navbar.style.background = 'var(--bg-glass)';
                navbar.style.boxShadow = 'none';
            }
        });
    }
};

// Smooth Scroll
const SmoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
};

// Initialize All Modules
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    ScrollAnimations.init();
    Navigation.init();
    SmoothScroll.init();
    
    console.log('✨ Nexus Hub initialized with macOS design system');
});
