// ============================================
// BIZFORGE — CINEMATIC EFFECTS ENGINE
// ============================================

// ---- STARFIELD CANVAS ---------------------
(function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let stars = [];
    const STAR_COUNT = 200;
    const SPEED = 0.15;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.2 + 0.3,
                alpha: Math.random() * 0.6 + 0.2,
                drift: (Math.random() - 0.5) * SPEED
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const color = isDark ? '255,255,255' : '0,0,0';

        stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color},${s.alpha * (isDark ? 1 : 0.15)})`;
            ctx.fill();

            // Twinkle
            s.alpha += (Math.random() - 0.5) * 0.01;
            s.alpha = Math.max(0.15, Math.min(0.7, s.alpha));

            // Drift
            s.y += s.drift;
            s.x += s.drift * 0.3;

            if (s.y > canvas.height + 5) s.y = -5;
            if (s.y < -5) s.y = canvas.height + 5;
            if (s.x > canvas.width + 5) s.x = -5;
            if (s.x < -5) s.x = canvas.width + 5;
        });

        requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();
    window.addEventListener('resize', () => { resize(); createStars(); });
})();

// ---- TYPEWRITER ---------------------------
(function initTypewriter() {
    const el = document.getElementById('heroTyped');
    if (!el) return;

    const words = ['with AI.', 'in Seconds.', 'Like a Pro.', 'That Scales.'];
    let wordIdx = 0;
    let charIdx = 0;
    let deleting = false;

    function type() {
        const word = words[wordIdx];

        if (!deleting) {
            el.textContent = word.substring(0, charIdx + 1);
            charIdx++;
            if (charIdx === word.length) {
                deleting = true;
                setTimeout(type, 2000); // pause at full word
                return;
            }
            setTimeout(type, 90);
        } else {
            el.textContent = word.substring(0, charIdx - 1);
            charIdx--;
            if (charIdx === 0) {
                deleting = false;
                wordIdx = (wordIdx + 1) % words.length;
                setTimeout(type, 400);
                return;
            }
            setTimeout(type, 50);
        }
    }

    setTimeout(type, 800);
})();

// ---- SCROLL REVEAL ------------------------
(function initScrollReveal() {
    const items = document.querySelectorAll('[data-reveal]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    items.forEach(item => observer.observe(item));
})();

// ---- COUNTER ANIMATION --------------------
(function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    const format = (n) => {
        if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
        return n.toLocaleString();
    };

    const animate = (el, target) => {
        const duration = 2200;
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = format(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                animate(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
})();

// ---- PARALLAX FLOATING CARDS --------------
(function initParallax() {
    const cards = document.querySelectorAll('[data-tilt]');
    if (!cards.length) return;

    document.addEventListener('mousemove', (e) => {
        const mx = e.clientX / window.innerWidth - 0.5;
        const my = e.clientY / window.innerHeight - 0.5;

        cards.forEach((card, i) => {
            const speed = [0.6, 0.4, 0.5][i] || 0.5;
            const x = mx * 60 * speed;
            const y = my * 60 * speed;
            card.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
})();

// ---- SMOOTH ANCHOR SCROLL -----------------
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ---- CURSOR GLOW --------------------------
(function initCursorGlow() {
    const glow = document.createElement('div');
    Object.assign(glow.style, {
        position: 'fixed', width: '350px', height: '350px',
        borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)',
        transform: 'translate(-50%,-50%)',
        zIndex: '9998', opacity: '0', transition: 'opacity 0.4s'
    });
    document.body.appendChild(glow);

    document.addEventListener('mousemove', e => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
        glow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
})();
