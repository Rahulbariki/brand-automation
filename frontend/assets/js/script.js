// Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.feature-view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');

            // Update Active State
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show Target View
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) {
                    view.classList.add('active');
                }
            });
        });
    });
});

const API_URL = "http://localhost:8000/api";

// Helper to handle loading state
function setLoading(elementId, isLoading) {
    const el = document.getElementById(elementId);
    if (isLoading) {
        el.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i><p style="margin-top: 1rem; color: var(--text-muted);">AI is working magic...</p></div>';
        el.classList.add('has-content');
    }
}

// 1. Brand Names
async function generateBrandNames() {
    const industry = document.getElementById('brandIndustry').value;
    const keywords = document.getElementById('brandKeywords').value.split(',').map(s => s.trim());
    const tone = document.getElementById('brandTone').value;
    const resultDiv = document.getElementById('brandResult');

    if (!industry || keywords.length === 0) {
        alert("Please enter industry and keywords.");
        return;
    }

    setLoading('brandResult', true);

    try {
        const response = await fetch(`${API_URL}/generate-brand`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ industry, keywords, tone })
        });
        const data = await response.json();

        resultDiv.innerHTML = '<ul>' + data.names.map(name => `<li><strong>${name}</strong></li>`).join('') + '</ul>';
    } catch (error) {
        resultDiv.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
    }
}

// 2. Logo Generation
async function generateLogo() {
    const brand_name = document.getElementById('logoName').value;
    const industry = document.getElementById('logoIndustry').value;
    const style = document.getElementById('logoStyle').value;
    const resultDiv = document.getElementById('logoResult');

    if (!brand_name) {
        alert("Please enter a brand name.");
        return;
    }

    setLoading('logoResult', true);

    try {
        const response = await fetch(`${API_URL}/generate-logo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand_name, industry, keywords: [style, industry], style })
        });
        const data = await response.json();

        resultDiv.innerHTML = `
            <p><strong>Prompt Used:</strong> ${data.prompt}</p>
            <br>
            <img src="${data.image_url}" alt="Generated Logo" style="max-width: 100%; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        `;
    } catch (error) {
        resultDiv.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
    }
}

// 3. Marketing Content
async function generateContent() {
    const brand_name = document.getElementById('contentBrand').value;
    const content_type = document.getElementById('contentType').value;
    const description = document.getElementById('contentDesc').value;
    const resultDiv = document.getElementById('contentResult');

    if (!brand_name || !description) {
        alert("Please enter brand name and description.");
        return;
    }

    setLoading('contentResult', true);

    try {
        const response = await fetch(`${API_URL}/generate-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand_name, description, tone: "professional", content_type })
        });
        const data = await response.json();
        resultDiv.textContent = data.content;
    } catch (error) {
        resultDiv.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
    }
}

// 4. Design System
async function generateDesign() {
    const industry = document.getElementById('designIndustry').value;
    const tone = document.getElementById('designTone').value;
    const resultDiv = document.getElementById('designResult');

    if (!industry) {
        alert("Please enter an industry.");
        return;
    }

    setLoading('designResult', true);

    try {
        const response = await fetch(`${API_URL}/get-colors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ industry, tone })
        });
        const data = await response.json();

        const colorsHtml = data.colors.map(color => `
            <div style="display: inline-block; margin: 10px; text-align: center;">
                <div style="width: 80px; height: 80px; background-color: ${color}; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                <div style="margin-top: 5px; font-family: monospace;">${color}</div>
            </div>
        `).join('');

        resultDiv.innerHTML = `<div style="text-align:center">${colorsHtml}</div>`;
    } catch (error) {
        resultDiv.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
    }
}

// 5. Sentiment Analysis
async function analyzeSentiment() {
    const text = document.getElementById('sentimentText').value;
    const resultDiv = document.getElementById('sentimentResult');

    if (!text) return;

    setLoading('sentimentResult', true);

    try {
        const response = await fetch(`${API_URL}/analyze-sentiment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, brand_tone: "professional" })
        });
        const data = await response.json();

        let color = '#666';
        if (data.sentiment === 'Positive') color = 'green';
        if (data.sentiment === 'Negative') color = 'red';

        resultDiv.innerHTML = `
            <h3>Sentiment: <span style="color: ${color}">${data.sentiment}</span></h3>
            <p><strong>Confidence:</strong> ${(data.confidence * 100).toFixed(1)}%</p>
            <p><strong>Analysis:</strong> ${data.tone_alignment}</p>
        `;
    } catch (error) {
        resultDiv.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
    }
}

// 6. Chatbot
async function sendChat() {
    const input = document.getElementById('chatInput');
    const history = document.getElementById('chatHistory');
    const message = input.value;

    if (!message) return;

    // Add User Message
    const userDiv = document.createElement('div');
    userDiv.style.cssText = "background: #f1f1f1; padding: 0.5rem 1rem; border-radius: 10px; margin-bottom: 0.5rem; align-self: flex-end; margin-left: auto; max-width: 80%;";
    userDiv.textContent = message;
    history.appendChild(userDiv);

    input.value = '';
    history.scrollTop = history.scrollHeight;

    // Add AI Placeholder
    const aiDiv = document.createElement('div');
    aiDiv.style.cssText = "background: #eef; padding: 0.5rem 1rem; border-radius: 10px; margin-bottom: 0.5rem; max-width: 80%;";
    aiDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
    history.appendChild(aiDiv);

    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();

        aiDiv.textContent = data.response;
    } catch (error) {
        aiDiv.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
    }

    history.scrollTop = history.scrollHeight;
}
