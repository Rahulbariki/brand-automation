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

async function login(email, password) {
    const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const text = await response.text();
        // If it's HTML, we'll see "The page cannot be found" in the error now
        throw new Error(text.length > 100 ? text.substring(0, 100) + '...' : text);
    }

    const data = await response.json();
    setToken(data.access_token);
    await loginSuccessHandler();
}

async function signup(email, password, fullname) {
    const response = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullname })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text.length > 100 ? text.substring(0, 100) + '...' : text);
    }

    const data = await response.json();
    // For signup, we might want to auto-login here or redirect to login
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
            redirectTo: window.location.origin + '/login.html'
        }
    });

    if (error) {
        throw error;
    }
}

// --- Session Handling ---
// --- Session Handling ---
window.checkSession = function () {
    return new Promise((resolve, reject) => {
        // Wait for Supabase to initialize if needed
        if (!window.supabaseClient) {
            initSupabase();
        }

        // Check local storage first for speed
        const localToken = localStorage.getItem('access_token');
        if (localToken) {
            resolve(localToken);
            return;
        }

        // Helper to perform the token exchange
        const exchangeToken = async (session) => {
            try {
                const res = await fetch(`${API_URL}/api/google-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: session.access_token })
                });

                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('access_token', data.access_token);
                    return data.access_token;
                } else {
                    const errText = await res.text();
                    console.error("Token exchange failed", errText);
                    // Throw to be caught by checkSession promise
                    throw new Error(`Auth Failed: ${res.status} ${res.statusText} - ${errText}`);
                }
            } catch (err) {
                console.error("Token exchange error:", err);
                throw err;
            }
        };

        // Subscribe to auth state changes
        const { data: { subscription } } = window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                try {
                    const token = await exchangeToken(session);
                    resolve(token);
                } catch (e) {
                    reject(e);
                }
            } else if (event === 'SIGNED_OUT') {
                resolve(null);
            }
        });

        // Fallback: Check getSession directly
        setTimeout(() => {
            window.supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
                if (session) {
                    try {
                        const token = await exchangeToken(session);
                        resolve(token);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    resolve(null);
                }
            });
        }, 1000);
    });
};

function logout() {
    localStorage.removeItem('access_token');
    if (window.supabaseClient) window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

function getToken() {
    return localStorage.getItem('access_token');
}

function setToken(token) {
    localStorage.setItem('access_token', token);
}

function isLoggedIn() {
    return !!getToken();
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

window.fetchWithRetry = async function (url, options = {}, retries = 3) {
    options.credentials = 'include';
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
        const response = await window.fetchWithRetry(`${API_URL}/api/me`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
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
        throw new Error("Authentication session validation failed. Please try again.");
    }
};
