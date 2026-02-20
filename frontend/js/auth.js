const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : ''; // Empty string for production means relative path

// --- Config ---
const SUPABASE_URL = "https://eswlocdooykyaxqyphwu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzd2xvY2Rvb3lreWF4cXlwaHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjI3MjYsImV4cCI6MjA4Njk5ODcyNn0.BfvrsARoriYR_jKMvdzYA3CNY7fG9Tl6cTknTLvUJ8o";

// --- Initialize Supabase ---
function initSupabase() {
    if (window.supabaseClient) return window.supabaseClient;

    if (window.supabase) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                detectSessionInUrl: true,   // Auto-detect OAuth tokens/code in URL
                persistSession: true,       // Persist session in localStorage
                autoRefreshToken: true      // Auto-refresh expiring tokens
            }
        });
        console.log("Supabase Client Initialized");
    } else {
        console.warn("Supabase library not yet loaded");
    }
    return window.supabaseClient;
}

// Global initialization
initSupabase();

// ──────────────────────────────────────────────────
//  Core: Wait for Supabase to fully establish a session
//  This handles OAuth callbacks, token refresh, etc.
// ──────────────────────────────────────────────────
window.waitForSupabaseSession = function (timeoutMs = 5000) {
    return new Promise((resolve) => {
        const client = initSupabase();
        if (!client) { resolve(null); return; }

        // Check if we already have a session
        client.auth.getSession().then(({ data }) => {
            if (data?.session) {
                resolve(data.session);
                return;
            }

            // No session yet — might be processing an OAuth redirect.
            // Listen for auth state changes (fires when code exchange completes).
            const { data: listener } = client.auth.onAuthStateChange((event, session) => {
                if (session) {
                    listener.subscription.unsubscribe();
                    resolve(session);
                }
            });

            // Timeout fallback — don't hang forever
            setTimeout(() => {
                listener.subscription.unsubscribe();
                resolve(null);
            }, timeoutMs);
        });
    });
};

window.getSupabaseToken = async function () {
    const client = initSupabase();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session?.access_token || null;
};

window.checkSession = async function () {
    const token = await window.getSupabaseToken();
    if (token) {
        localStorage.setItem('access_token', token);
    } else {
        localStorage.removeItem('access_token');
    }
    return token;
};

// ──────────────────────────────────────────────────
//  Login: Email/Password (Supabase-first with local fallback)
// ──────────────────────────────────────────────────
window.login = async function (email, password) {
    const client = initSupabase();
    if (!client) throw new Error("Supabase client not initialized.");

    // 1. Try Supabase auth first
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (!error && data?.session) {
        await window.loginSuccessHandler();
        return;
    }

    // 2. Fallback: Try local backend auth
    console.log("Supabase login failed, trying local backend auth...");
    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const detail = await res.json().catch(() => ({}));
            throw new Error(detail.detail || "Invalid login credentials");
        }

        const tokenData = await res.json();

        // 3. Try to register in Supabase so future logins are unified
        try { await client.auth.signUp({ email, password }); } catch (_) { }

        // 4. Retry Supabase sign-in
        const { data: retryData, error: retryError } = await client.auth.signInWithPassword({ email, password });

        if (!retryError && retryData?.session) {
            await window.loginSuccessHandler();
            return;
        }

        // 5. Last resort — use local JWT
        localStorage.setItem('access_token', tokenData.access_token);
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        setTimeout(() => window.location.href = 'dashboard.html', 500);
    } catch (backendErr) {
        throw new Error(backendErr.message || "Invalid login credentials");
    }
};

// ──────────────────────────────────────────────────
//  Signup
// ──────────────────────────────────────────────────
window.signup = async function (email, password, fullname) {
    const client = initSupabase();
    if (!client) throw new Error("Supabase client not initialized.");

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullname } }
    });

    if (error) throw new Error(error.message);
    return true;
};

// ──────────────────────────────────────────────────
//  Google OAuth Login
// ──────────────────────────────────────────────────
window.googleLogin = async function () {
    const client = initSupabase();
    if (!client) throw new Error("Supabase client not initialized. Refresh page and try again.");

    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });

    if (error) throw error;
};

// ──────────────────────────────────────────────────
//  Session Handling
// ──────────────────────────────────────────────────
async function logout() {
    const client = initSupabase();
    if (client) await client.auth.signOut();
    localStorage.removeItem('access_token');
    localStorage.removeItem('impersonated_user');
    window.location.href = 'login.html';
}

async function isLoggedIn() {
    return !!(await window.getSupabaseToken());
}

async function requireAuth() {
    if (!(await isLoggedIn())) {
        window.location.href = 'login.html';
    }
}

// ──────────────────────────────────────────────────
//  fetchWithRetry — auto-attaches Supabase token
// ──────────────────────────────────────────────────
window.fetchWithRetry = async function (url, options = {}, retries = 3) {
    const impUser = localStorage.getItem('impersonated_user');
    if (impUser && (url.includes('/api/me') || url.includes('/api/auth/me') || url.includes('/api/session-check'))) {
        return { ok: true, json: async () => JSON.parse(impUser) };
    }

    options.credentials = 'include';
    const delays = [200, 500, 1000];
    let lastResponse = null;

    for (let i = 0; i < retries; i++) {
        const token = await window.getSupabaseToken();
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }

        try {
            const response = await fetch(url, options);
            lastResponse = response;
            if (response.ok) return response;

            if (i === retries - 1) {
                if (response.status === 401 || response.status === 403) {
                    if (window.showToast) window.showToast("Session expired. Please log in again.", "error");
                }
                return response;
            }
        } catch (err) {
            if (i === retries - 1) {
                if (window.showToast) window.showToast("Network failure. Please verify connection.", "error");
                throw err;
            }
        }

        const waitTime = i < delays.length ? delays[i] : 1000;
        await new Promise(r => setTimeout(r, waitTime));
    }

    return lastResponse;
};

// ──────────────────────────────────────────────────
//  loginSuccessHandler — validates against backend
// ──────────────────────────────────────────────────
window.loginSuccessHandler = async function () {
    let sessionValid = false;
    let token = null;

    // Poll for Supabase session (handles async token exchange)
    const delays = [200, 500, 1000];
    for (let delay of delays) {
        await new Promise(r => setTimeout(r, delay));
        if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            if (data?.session?.access_token) {
                token = data.session.access_token;
                break;
            }
        }
    }

    if (!token) {
        localStorage.removeItem('access_token');
        throw new Error("Authentication failed. Could not establish session with Supabase.");
    }

    // Validate against FastAPI backend
    try {
        const response = await window.fetchWithRetry(`${API_URL}/api/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, 3);

        if (response.ok) {
            sessionValid = true;
        }
    } catch (e) {
        console.warn('Session check error:', e);
    }

    if (sessionValid) {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        setTimeout(() => window.location.href = 'dashboard.html', 500);
    } else {
        localStorage.removeItem('access_token');
        throw new Error("Backend session validation failed. Please check server configuration.");
    }
};

// ──────────────────────────────────────────────────
//  Impersonation Banner
// ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const impUserStr = localStorage.getItem('impersonated_user');
    if (impUserStr && !window.location.pathname.includes('admin.html')) {
        const impUser = JSON.parse(impUserStr);
        const banner = document.createElement('div');
        banner.style = "position:fixed; top:0; left:0; width:100%; z-index:100000; background-color:#ef4444; color:white; text-align:center; padding:10px; font-weight:bold; display:flex; justify-content:center; align-items:center; box-shadow:0 4px 6px rgba(0,0,0,0.1);";
        banner.innerHTML = `⚠️ IMPERSONATION MODE: Viewing dashboard as ${impUser.email} &nbsp; <button onclick="exitImpersonation()" style="margin-left:15px; background:white; color:#ef4444; padding:4px 12px; border-radius:4px; font-size:12px; cursor:pointer;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='white'">Exit Impersonation</button>`;
        document.body.prepend(banner);
        document.body.style.paddingTop = '40px';
    }
});

window.exitImpersonation = function () {
    localStorage.removeItem('impersonated_user');
    window.location.href = 'admin.html';
};
