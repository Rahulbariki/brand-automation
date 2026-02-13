/**
 * BIZFORGE UI MODULE
 * Handles all visual components (Toasts, Skeletons, Loading States).
 * @module UI
 */

class UIController {
    constructor() {
        this.toastContainer = null;
        this.initToastContainer();
    }

    initToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container); // Ensure global styles handle positioning
        }
        this.toastContainer = document.querySelector('.toast-container');
    }

    /**
     * Shows a toast notification
     * @param {string} message 
     * @param {'success'|'error'|'info'|'warning'} type 
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in-up`;

        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        toast.innerHTML = `
            <i class="fas ${iconMap[type]}"></i>
            <span>${message}</span>
        `;

        this.toastContainer.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, 4000);
    }

    /**
     * Sets a container to loading state with skeleton
     * @param {string} elementId 
     * @param {boolean} isLoading 
     */
    setLoading(elementId, isLoading) {
        const el = document.getElementById(elementId);
        if (!el) return;

        if (isLoading) {
            el.innerHTML = `
                <div class="skeleton-wrapper">
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line text"></div>
                    <div class="skeleton-line text"></div>
                    <div class="skeleton-rect image"></div>
                </div>
            `;
            el.classList.add('has-content');
        } else {
            // Content will be replaced by result, no action needed here
        }
    }

    renderCard(title, content, type = 'default') {
        let specializedContent = content;

        // Brand Names -> Chips
        if (type === 'brand_names' && Array.isArray(content)) {
            specializedContent = `<div class="brand-grid">` +
                content.map(name => {
                    const esc = name.replace(/'/g, "\\'");
                    return `<div class="brand-chip" onclick="navigator.clipboard.writeText('${esc}'); ui.showToast('Copied: ${esc}', 'success')">${name}</div>`;
                }).join('') +
                `</div>`;
        }

        // Design System -> Swatch Grid
        if (type === 'design_system' && Array.isArray(content)) {
            specializedContent = `<div class="swatch-grid">` +
                content.map(color => `
                    <div class="swatch-item">
                        <div class="swatch-color" style="background-color: ${color}"></div>
                        <div class="swatch-hex">${color}</div>
                    </div>
                `).join('') +
                `</div>`;
        }

        // Marketing -> Preview
        if (type === 'marketing') {
            specializedContent = `<div class="marketing-preview">${content}</div>`;
        }

        // Sentiment -> Mood Meter
        if (type === 'sentiment') {
            const score = content.score || 0;
            const label = content.label || 'Neutral';
            const color = label === 'Positive' ? '#10b981' : (label === 'Negative' ? '#ef4444' : '#6366f1');
            specializedContent = `
                <div class="sentiment-result">
                    <h3 style="color: ${color}">${label}</h3>
                    <div class="mood-meter">
                        <div class="mood-bar" style="width: ${score * 100}%; background: ${color}"></div>
                    </div>
                    <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-muted)">Confidence: ${(score * 100).toFixed(1)}%</p>
                </div>
            `;
        }

        // Logo -> Frame
        if (type === 'logo') {
            specializedContent = `<div class="logo-frame"><img src="${content}" alt="Generated Logo"></div>`;
        }

        return `
            <div class="result-card fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h4 style="margin:0">${title}</h4>
                    <div class="result-actions" style="margin:0; padding:0; border:0;">
                        <button class="action-btn" onclick="copyToClipboard(this)">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="result-content">${specializedContent}</div>
            </div>
        `;
    }
}

export const ui = new UIController();
