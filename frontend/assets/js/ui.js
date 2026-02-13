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

    renderCard(title, content) {
        return `
            <div class="result-card fade-in">
                <h4>${title}</h4>
                <div class="result-content">${content}</div>
                <div class="result-actions">
                    <button class="action-btn" onclick="copyToClipboard(this)">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="action-btn" onclick="saveToHistory('${title}', this)">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
        `;
    }
}

export const ui = new UIController();
