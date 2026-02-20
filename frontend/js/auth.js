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
    if (impUser && (url.includes('/api/me') || url.includes('/api/auth/me'))) {
        return {
            ok: true,
            json: async () => JSON.parse(impUser)
        };
    }

    // Attach Supabase token to Authorization header if available
    const token = await window.getSupabaseToken();
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    options.credentials = 'include'; // Keep this if your API uses cookies/sessions alongside Bearer token
    const delays = [200, 500, 1000];
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            // If response is not OK, we might want to retry
            if (i === retries - 1) return response;
        } catch (err) {
            if (i === retries - 1) throw err;
        }
        const waitTime = i < delays.length ? delays[i] : 1000;
        await new Promise(r => setTimeout(r, waitTime));
    }
};

window.loginSuccessHandler = async function () {
    let sessionValid = false;

    try {
        const token = await window.getSupabaseToken();
        if (!token) throw new Error("No token returned by Supabase");

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
