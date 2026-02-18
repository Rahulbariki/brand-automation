/* ╔══════════════════════════════════════════════════════════════╗
   ║  BrandNova Universe Engine — JS                             ║
   ║  Theme Engine • Particles • Animations • Interactions       ║
   ╚══════════════════════════════════════════════════════════════╝ */

// ─── Theme Engine ──────────────────────────────────────────
const THEMES = [
    { id: 'cosmic', name: '🌌 Cosmic', swatch: 'linear-gradient(135deg,#7c3aed,#ec4899)' },
    { id: 'aurora', name: '🌌 Aurora', swatch: 'linear-gradient(135deg,#10b981,#06b6d4)' },
    { id: 'sunset', name: '🌅 Sunset', swatch: 'linear-gradient(135deg,#f43f5e,#f59e0b)' },
    { id: 'glass', name: '🔮 Glass Light', swatch: 'linear-gradient(135deg,#6366f1,#a855f7)' },
    { id: 'cyberpunk', name: '⚡ Cyberpunk', swatch: 'linear-gradient(135deg,#00fff5,#ff00ff)' },
    { id: 'minimal', name: '⬛ Minimal', swatch: 'linear-gradient(135deg,#fff,#555)' },
];

function getTheme() {
    return localStorage.getItem('bn-theme') || 'cosmic';
}

function setTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('bn-theme', themeId);
    // Re-init particles with new theme color
    if (window._particleSystem) window._particleSystem.updateColor();
    // Update active state in menu
    document.querySelectorAll('.theme-option').forEach(el => {
        el.classList.toggle('active', el.dataset.theme === themeId);
    });
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    setTheme(getTheme());
});


// ─── Theme Menu Component ──────────────────────────────────
function initThemeMenu() {
    const wrap = document.querySelector('.theme-toggle-wrap');
    if (!wrap) return;
    const btn = wrap.querySelector('.theme-toggle-btn');
    const menu = wrap.querySelector('.theme-menu');
    if (!btn || !menu) return;

    // Populate
    menu.innerHTML = THEMES.map(t =>
        `<div class="theme-option ${t.id === getTheme() ? 'active' : ''}" data-theme="${t.id}">
       <span class="theme-swatch" style="background:${t.swatch}"></span>
       ${t.name}
     </div>`
    ).join('');

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));

    menu.addEventListener('click', (e) => {
        const opt = e.target.closest('.theme-option');
        if (opt) setTheme(opt.dataset.theme);
    });
}


// ─── Particle System ───────────────────────────────────────
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.count = Math.min(80, Math.floor(window.innerWidth / 20));
        this.resize();
        this.init();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window._particleSystem = this;
    }

    resize() {
        this.w = this.canvas.width = window.innerWidth;
        this.h = this.canvas.height = window.innerHeight;
    }

    getColor() {
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue('--particle-color').trim() || 'rgba(124,58,237,0.3)';
    }

    updateColor() {
        const c = this.getColor();
        this.particles.forEach(p => p.color = c);
    }

    init() {
        const c = this.getColor();
        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                r: Math.random() * 2 + 0.5,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                color: c
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = this.w;
            if (p.x > this.w) p.x = 0;
            if (p.y < 0) p.y = this.h;
            if (p.y > this.h) p.y = 0;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        });

        // Connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = this.particles[i].color.replace(/[\d.]+\)$/, (120 - dist) / 300 + ')');
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
        requestAnimationFrame(() => this.animate());
    }
}


// ─── Cursor Glow Follow ────────────────────────────────────
function initCursorGlow() {
    const glow = document.querySelector('.cursor-glow');
    if (!glow) return;
    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
}


// ─── Glass Card 3D Tilt + Inner Glow ───────────────────────
function initCardEffects() {
    document.querySelectorAll('.glass-card').forEach(card => {
        // Add glow div if not present
        if (!card.querySelector('.card-glow')) {
            const g = document.createElement('div');
            g.className = 'card-glow';
            card.appendChild(g);
        }
        const glow = card.querySelector('.card-glow');

        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            // 3D Tilt
            card.style.transform =
                `perspective(800px) rotateX(${(y - 0.5) * 6}deg) rotateY(${(x - 0.5) * -6}deg) translateY(-4px)`;
            // Glow follow
            glow.style.left = (e.clientX - r.left) + 'px';
            glow.style.top = (e.clientY - r.top) + 'px';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}


// ─── Button Ripple Effect ──────────────────────────────────
function initRippleButtons() {
    document.querySelectorAll('.glow-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const r = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = (e.clientX - r.left) + 'px';
            ripple.style.top = (e.clientY - r.top) + 'px';
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}


// ─── Navbar Scroll Effect ──────────────────────────────────
function initNavScroll() {
    const nav = document.querySelector('.universe-nav');
    if (!nav) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                nav.classList.toggle('scrolled', window.scrollY > 30);
                ticking = false;
            });
            ticking = true;
        }
    });
}


// ─── Magnetic Sidebar Links ────────────────────────────────
function initMagneticLinks() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('mousemove', (e) => {
            const r = link.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            link.style.transform = `translateX(${x * 0.08 + 3}px)`;
        });
        link.addEventListener('mouseleave', () => { link.style.transform = ''; });
    });
}


// ─── Typewriter Effect ─────────────────────────────────────
function typeWriter(element, words, speed = 100, deleteSpeed = 50, pause = 2000) {
    if (!element) return;
    let wordIdx = 0, charIdx = 0, deleting = false;

    function tick() {
        const current = words[wordIdx];
        if (deleting) {
            element.textContent = current.substring(0, charIdx--);
            if (charIdx < 0) {
                deleting = false;
                wordIdx = (wordIdx + 1) % words.length;
                setTimeout(tick, 400);
                return;
            }
        } else {
            element.textContent = current.substring(0, charIdx++);
            if (charIdx > current.length) {
                deleting = true;
                setTimeout(tick, pause);
                return;
            }
        }
        setTimeout(tick, deleting ? deleteSpeed : speed);
    }
    tick();
}


// ─── AI Result Typewriter Reveal ───────────────────────────
function typewriterReveal(container, text, speed = 15) {
    container.innerHTML = '';
    let i = 0;
    function add() {
        if (i < text.length) {
            container.textContent += text[i];
            i++;
            setTimeout(add, speed);
        }
    }
    add();
}


// ─── Animated Counter ──────────────────────────────────────
function animateCounter(element, target, duration = 1500) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.floor(start + (target - start) * ease);
        element.textContent = prefix + current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}


// ─── Scroll Reveal (Intersection Observer) ─────────────────
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
}


// ─── Master Init ───────────────────────────────────────────
function initUniverse() {
    setTheme(getTheme());
    new ParticleSystem('universe-particles');
    initCursorGlow();
    initThemeMenu();
    initCardEffects();
    initRippleButtons();
    initNavScroll();
    initMagneticLinks();
    initScrollReveal();
}

document.addEventListener('DOMContentLoaded', initUniverse);
