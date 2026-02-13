// ============================================
// CINEMATIC LANDING PAGE EFFECTS
// ============================================

// ============================================
// Scroll Reveal Animation
// ============================================
const revealElements = document.querySelectorAll('[data-scroll-reveal]');

const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 100;

    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < windowHeight - revealPoint) {
            element.classList.add('revealed');
        }
    });
};

// Initial reveal check
revealOnScroll();

// Reveal on scroll
window.addEventListener('scroll', revealOnScroll);

// ============================================
// Parallax Effect for Floating Cards
// ============================================
const parallaxElements = document.querySelectorAll('[data-parallax]');

window.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    parallaxElements.forEach(element => {
        const speed = element.getAttribute('data-parallax') || 0.5;
        const x = (mouseX - 0.5) * 50 * speed;
        const y = (mouseY - 0.5) * 50 * speed;

        element.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// ============================================
// Smooth Scroll for Navigation Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// Add Glow Effect to Feature Cards
// ============================================
const featureCards = document.querySelectorAll('.feature-card');

featureCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// ============================================
// Animated Counter for Stats
// ============================================
const animateCounter = (element, target, duration = 2000) => {
    let current = 0;
    const increment = target / (duration / 16);

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString();
        }
    };

    updateCounter();
};

// Trigger counter animation when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statValues = entry.target.querySelectorAll('.stat-value');
            statValues.forEach(stat => {
                const target = parseInt(stat.textContent.replace(/,/g, ''));
                if (!isNaN(target) && !stat.classList.contains('animated')) {
                    stat.classList.add('animated');
                    animateCounter(stat, target);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const previewStats = document.querySelectorAll('.preview-stat');
previewStats.forEach(stat => statsObserver.observe(stat));

// ============================================
// Cursor Glow Effect (Optional Enhancement)
// ============================================
const cursor = document.createElement('div');
cursor.className = 'cursor-glow';
document.body.appendChild(cursor);

// Add cursor styles dynamically
const style = document.createElement('style');
style.textContent = `
    .cursor-glow {
        position: fixed;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        pointer-events: none;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent 70%);
        transform: translate(-50%, -50%);
        transition: opacity 0.3s ease;
        z-index: 9999;
        opacity: 0;
    }
    
    body:hover .cursor-glow {
        opacity: 1;
    }
`;
document.head.appendChild(style);

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// ============================================
// Performance Optimization
// ============================================
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            revealOnScroll();
            ticking = false;
        });
        ticking = true;
    }
});

// ============================================
// Console Easter Egg
// ============================================
console.log(
    '%c🚀 BizForge Landing Page',
    'color: #667eea; font-size: 20px; font-weight: bold;'
);
console.log(
    '%cBuilt with cinematic effects and modern web technologies',
    'color: #a8a8ae; font-size: 12px;'
);
