// Determine the API base URL based on environment
// - On Vercel: frontend and API are same-origin (empty string works)
// - On localhost with Vite proxy: empty string works (proxy handles /api/* -> localhost:8000)
// - Fallback: use VITE_API_URL env var if set
const API_BASE = import.meta.env.VITE_API_URL || "";

function getHeaders() {
    const token = localStorage.getItem("access_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function handleAuthError(res) {
    // If we get a 401, the token is invalid/expired — redirect to login
    if (res.status === 401) {
        localStorage.removeItem("access_token");
        // Only redirect if we're not already on login/signup
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/signup" && path !== "/") {
            window.location.href = "/login";
        }
    }
}

async function handleResponse(res) {
    handleAuthError(res);

    if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data.detail?.includes("Upgrade") || data.detail?.includes("limit") || data.detail?.includes("subscription")) {
            throw { upgrade: true, message: data.detail };
        }
        throw new Error(data.detail || "Access denied");
    }

    if (!res.ok) {
        let data = {};
        try {
            data = await res.json();
        } catch {
            // Response might not be JSON (e.g. Vercel 500 pages)
        }
        throw new Error(data.detail || data.message || `Request failed (${res.status})`);
    }
    return res.json();
}

export async function apiPost(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiGet(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers: getHeaders() });
    return handleResponse(res);
}

export async function apiPut(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiDelete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: "DELETE", headers: getHeaders() });
    return handleResponse(res);
}

export function login(email, password) {
    return apiPost("/api/login", { email, password });
}

export function signup(fullname, email, password) {
    return apiPost("/api/signup", { fullname, email, password });
}

export function googleLogin(token) {
    return apiPost("/api/google-login", { token });
}
