const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocal ? "http://127.0.0.1:8000" : "";

function getHeaders() {
    const token = localStorage.getItem("access_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export async function apiPost(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });

    if (res.status === 403) {
        const data = await res.json();
        if (data.detail?.includes("Upgrade") || data.detail?.includes("limit")) {
            throw { upgrade: true, message: data.detail };
        }
        throw new Error(data.detail || "Access denied");
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${res.status})`);
    }
    return res.json();
}

export async function apiGet(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers: getHeaders() });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${res.status})`);
    }
    return res.json();
}

export function login(email, password) {
    return apiPost("/api/login", { email, password });
}

export function signup(fullname, email, password) {
    return apiPost("/api/signup", { fullname, email, password });
}
