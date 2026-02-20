const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : ''; // Empty string for production means relative path or handled by proxy/Vercel

// --- Config (To be populated or fetched) ---
// Ideally, these are fetched from an endpoint like /api/config
// For now, we use placeholders or global window vars if injected
const SUPABASE_URL = "https://eswlocdooykyaxqyphwu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzd2xvY2Rvb3lreWF4cXlwaHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjI3MjYsImV4cCI6MjA4Njk5ODcyNn0.BfvrsARoriYR_jKMvdzYA3CNY7fG9Tl6cTknTLvUJ8o";

// --- Initialize Supabase ---
function initSupabase() {
    if (window.supabaseClient) return window.supabaseClient;

    if (window.supabase) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase Client Initialized");
    } else {
        console.warn("Supabase library not yet loaded");
    }
    return window.supabaseClient;
}

// Global initialization
initSupabase();

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

// --- Auth Functions ---

window.login = async function (email, password) {
    const client = initSupabase();
    if (!client) throw new Error("Supabase client not initialized.");

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw new Error(error.message);
    }

    await window.loginSuccessHandler();
}

window.signup = async function (email, password, fullname) {
    const client = initSupabase();
    if (!client) throw new Error("Supabase client not initialized.");

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullname
            }
        }
    });

    if (error) {
        throw new Error(error.message);
    }

    // Auto-login or redirect typically happens 
    // Wait for the auth state changes logic to resolve
    return true;
}

window.googleLogin = async function () {
    const client = initSupabase();
    if (!client) {
        throw new Error("Supabase client not initialized. Refresh page and try again.");
    }

    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });

    if (error) {
        throw error;
    }
}

// --- Session Handling ---
async function logout() {
    const client = initSupabase();
    if (client) {
        await client.auth.signOut();
    }
    localStorage.removeItem('impersonated_user'); // Clear impersonation if any
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

window.fetchWithRetry = async function (url, options = {}, retries = 3) {
    const impUser = localStorage.getItem('impersonated_user');
    if (impUser && (url.includes('/api/me') || url.includes('/api/auth/me') || url.includes('/api/session-check'))) {
        return {
            ok: true,
            json: async () => JSON.parse(impUser)
        };
    }

    options.credentials = 'include';
    const delays = [200, 500, 1000];
    let lastResponse = null;

    for (let i = 0; i < retries; i++) {
        // Fetch token natively on each retry attempt in case it was refreshed
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

            // If response guarantees auth rejection, surface it after retries
            if (i === retries - 1) {
                if (response.status === 401 || response.status === 403) {
                    // Only show session failure after all retries successfully exhaust.
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

window.loginSuccessHandler = async function () {
    let sessionValid = false;
    let token = null;

    const delays = [200, 500, 1000];

    for (let delay of delays) {
        await new Promise(r => setTimeout(r, delay));
        if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            if (data && data.session && data.session.access_token) {
                token = data.session.access_token;
                break;
            }
        }
    }

    if (!token) {
        localStorage.removeItem('access_token');
        throw new Error("Authentication session validation failed against Supabase identity provider. Please try again.");
    }

    // Now securely pass to FastAPI layer via Auth Header
    try {
        const response = await window.fetchWithRetry(`${API_URL}/api/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, 3);

        if (response.ok) {
            sessionValid = true;
        }
    } catch (e) {
        console.warn('Session check polling error', e);
    }

    if (sessionValid) {
        // Smooth transition out
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        setTimeout(() => window.location.href = 'dashboard.html', 500);
    } else {
        localStorage.removeItem('access_token');
        throw new Error("Authentication session validation failed against FastAPI backend. Please check configuration.");
    }
};

// Impersonation Banner Logic
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
