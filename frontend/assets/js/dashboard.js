// BIZFORGE DASHBOARD CONTROLLER
import { api } from './api.js';
import { ui } from './ui.js';
import { state } from './stateManager.js';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Auth Check (Bypassed)
    // 2. Load Profile
    loadProfile();

    // 3. Setup Navigation
    setupNavigation();

    // 4. Setup Global Event Listeners
    setupGlobalEvents();
});

function loadProfile() {
    const userName = localStorage.getItem('remember_user') || 'User';
    const userDisplay = document.getElementById('userNameDisplay');
    if (userDisplay) userDisplay.textContent = userName.split('@')[0];

    const avatar = document.querySelector('.avatar');
    if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();

    // Theme Toggle
    const toggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const icon = toggle.querySelector('i');

    // Init Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(icon, savedTheme);

    toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(icon, newTheme);
    });
}

function updateThemeIcon(icon, theme) {
    if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.feature-view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');

            if (targetId === 'logout') {
                api.logout();
                return;
            }

            // Update UI
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) {
                    view.classList.add('active');
                }
            });

            state.setCurrentView(targetId);
        });
    });
}

function setupGlobalEvents() {
    // Expose functions globally for HTML onclick handlers (legacy support)
    // Ideally, we attaches these via JS, but refactoring HTML is next step.
    window.generateBrandNames = generateBrandNames;
    window.generateLogo = generateLogo;
    window.generateContent = generateContent;
    window.generateDesign = generateDesign;
    window.analyzeSentiment = analyzeSentiment;
    window.sendChat = sendChat;
    window.copyToClipboard = copyToClipboard;
    window.saveToHistory = saveToHistory;
    window.logout = () => api.logout();

    // Mock functions for now
    window.copyToClipboard = (btn) => {
        ui.showToast('Copied to clipboard!', 'success');
    };

    window.saveToHistory = (title, btn) => {
        state.addToHistory({ title, type: 'saved' });
        ui.showToast('Saved to history', 'success');
    };

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const currentView = state.currentView || 'overview';

            // Map views to actions
            const actions = {
                'brand': generateBrandNames,
                'logo': generateLogo,
                'content': generateContent,
                'design': generateDesign,
                'sentiment': analyzeSentiment,
                'chat': sendChat
            };

            if (actions[currentView]) {
                ui.showToast(`Generating ${currentView}...`, 'info');
                actions[currentView]();
            }
        }
    });
}

// --- Feature Handlers ---

async function generateBrandNames() {
    const industry = document.getElementById('brandIndustry').value;
    const keywords = document.getElementById('brandKeywords').value.split(',').map(s => s.trim());
    const tone = document.getElementById('brandTone').value;
    const resultDiv = document.getElementById('brandResult');

    if (!industry || keywords.length === 0) {
        ui.showToast("Please enter industry and keywords.", 'warning');
        return;
    }

    ui.setLoading('brandResult', true);

    try {
        const data = await api.generateBrandNames(industry, keywords, tone);
        if (data && data.names) {
            resultDiv.innerHTML = ui.renderCard('Generated Names', data.names, 'brand_names');
            ui.showToast('Brand names generated!', 'success');
            state.addToHistory({ type: 'brand_names', content: data.names });
        }
    } catch (error) {
        ui.showToast(error.message, 'error');
        resultDiv.innerHTML = ''; // Clear loading
    }
}

async function generateLogo() {
    const brandName = document.getElementById('logoName').value;
    const industry = document.getElementById('logoIndustry').value;
    const style = document.getElementById('logoStyle').value;
    const resultDiv = document.getElementById('logoResult');

    if (!brandName) {
        ui.showToast("Please enter a brand name.", 'warning');
        return;
    }

    ui.setLoading('logoResult', true);

    try {
        const data = await api.generateLogo(brandName, industry, style);
        if (data) {
            resultDiv.innerHTML = ui.renderCard('Logo Result', data.image_url, 'logo');
            ui.showToast('Logo generated successfully!', 'success');
            state.addToHistory({ type: 'logo', image: data.image_url });
        }
    } catch (error) {
        ui.showToast(error.message, 'error');
        resultDiv.innerHTML = '';
    }
}

async function generateContent() {
    const brandName = document.getElementById('contentBrand').value;
    const contentType = document.getElementById('contentType').value;
    const description = document.getElementById('contentDesc').value;
    const resultDiv = document.getElementById('contentResult');

    if (!brandName || !description) {
        ui.showToast("Please enter brand name and description.", 'warning');
        return;
    }

    ui.setLoading('contentResult', true);

    try {
        const data = await api.generateContent(brandName, description, contentType);
        if (data) {
            resultDiv.innerHTML = ui.renderCard('Marketing Content', data.content, 'marketing');
            ui.showToast('Content generated!', 'success');
            state.addToHistory({ type: 'content', content: data.content });
        }
    } catch (error) {
        ui.showToast(error.message, 'error');
        resultDiv.innerHTML = '';
    }
}

async function generateDesign() {
    const industry = document.getElementById('designIndustry').value;
    const tone = document.getElementById('designTone').value;
    const resultDiv = document.getElementById('designResult');

    if (!industry) {
        ui.showToast("Please enter an industry.", 'warning');
        return;
    }

    ui.setLoading('designResult', true);

    try {
        const data = await api.generateDesignSystem(industry, tone);
        if (data && data.colors) {
            resultDiv.innerHTML = ui.renderCard('Color Palette', data.colors, 'design_system');
            ui.showToast('Design system generated!', 'success');
        }
    } catch (error) {
        ui.showToast(error.message, 'error');
        resultDiv.innerHTML = '';
    }
}

async function analyzeSentiment() {
    const text = document.getElementById('sentimentText').value;
    const resultDiv = document.getElementById('sentimentResult');

    if (!text) {
        ui.showToast("Please enter text to analyze.", 'warning');
        return;
    }

    ui.setLoading('sentimentResult', true);

    try {
        const data = await api.analyzeSentiment(text);
        if (data) {
            const content = {
                score: data.confidence || 0,
                label: data.sentiment || 'Neutral'
            };
            resultDiv.innerHTML = ui.renderCard('Sentiment Analysis', content, 'sentiment');
            ui.showToast('Analysis complete!', 'success');
        }
    } catch (error) {
        ui.showToast(error.message, 'error');
        resultDiv.innerHTML = '';
    }
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const history = document.getElementById('chatHistory');
    const message = input.value;

    if (!message) return;

    // User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user-msg';
    userDiv.textContent = message;
    history.appendChild(userDiv);

    input.value = '';
    history.scrollTop = history.scrollHeight;

    // AI Placeholder
    const aiDiv = document.createElement('div');
    aiDiv.className = 'chat-msg ai-msg loading-msg';
    aiDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
    history.appendChild(aiDiv);

    try {
        const data = await api.chatWithAI(message);
        aiDiv.classList.remove('loading-msg');
        aiDiv.innerHTML = `<strong>BizForge AI:</strong><br>${data.response || "No response."}`;
    } catch (error) {
        aiDiv.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
    }

    history.scrollTop = history.scrollHeight;
}
