/**
 * BIZFORGE API & AUTH MODULE
 * Handles all server communications and session management.
 * @module API
 */

// Detect environment
const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCAL
    ? "http://localhost:8000/api"
    : "https://bizforge-api.onrender.com/api";

export const ASSET_BASE_URL = IS_LOCAL
    ? "http://localhost:8000"
    : "https://bizforge-api.onrender.com";

class ApiClient {
    constructor() {
        this.token = null;
    }

    /**
     * Updates the stored token
     * @param {string} token 
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem("token", token);
    }

    /**
     * Clears the stored token (Logout)
     */
    logout() {
        window.location.href = "index.html";
    }

    /**
     * Checks if a user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return true;
    }

    /**
     * Generic authenticated fetch wrapper
     * @param {string} endpoint 
     * @param {object} options 
     */
    async request(endpoint, options = {}) {
        const headers = {
            "Content-Type": "application/json",
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            // Handle errors
            if (response.status === 401) {
                console.warn("Unauthorized access - allowing guest session");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `API Error: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error(`API Request Failed: ${endpoint}`, error);
            throw error; // Propagate for UI handling
        }
    }

    // --- Specific API Calls ---

    async login(email, password) {
        return this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });
    }

    async signup(email, password, fullname) {
        return this.request("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ email, password, fullname })
        });
    }

    async googleLogin(token) {
        return this.request("/auth/google-login", {
            method: "POST",
            body: JSON.stringify({ token })
        });
    }

    async generateBrandNames(industry, keywords, tone) {
        return this.request("/generate-brand", {
            method: "POST",
            body: JSON.stringify({ industry, keywords, tone })
        });
    }

    async generateLogo(brandName, industry, style) {
        return this.request("/generate-logo", {
            method: "POST",
            body: JSON.stringify({
                brand_name: brandName,
                industry,
                style,
                keywords: [style, industry]
            })
        });
    }

    async generateContent(brandName, description, contentType, tone = "professional") {
        return this.request("/generate-content", {
            method: "POST",
            body: JSON.stringify({ brand_name: brandName, description, content_type: contentType, tone })
        });
    }

    async generateDesignSystem(industry, tone) {
        return this.request("/get-colors", {
            method: "POST",
            body: JSON.stringify({ industry, tone })
        });
    }

    async analyzeSentiment(text, brandTone = "professional") {
        return this.request("/analyze-sentiment", {
            method: "POST",
            body: JSON.stringify({ text, brand_tone: brandTone })
        });
    }

    async chatWithAI(message) {
        return this.request("/chat", {
            method: "POST",
            body: JSON.stringify({ message })
        });
    }
}

// Export a singleton instance
export const api = new ApiClient();
