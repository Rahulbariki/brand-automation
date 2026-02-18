const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : ''; // Empty string for production means relative path or handled by proxy/Vercel

// --- Config (To be populated or fetched) ---
// Ideally, these are fetched from an endpoint like /api/config
// For now, we use placeholders or global window vars if injected
const SUPABASE_URL = "https://eswlocdooykyaxqyphwu.supabase.co";
const SUPABASE_KEY = "sb_publishable_cim3tSJLeK14tYV7PhEU0A_Gak6VS9a";

// --- Initialize Supabase ---
let supabase = null;
if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// --- Auth Functions ---

async function login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
    }

    const data = await response.json();
    setToken(data.access_token);
    window.location.href = 'dashboard.html';
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
        const data = await response.json();
        throw new Error(data.detail || 'Signup failed');
    }

    // Auto-login or redirect
    return true;
}

async function googleLogin() {
    if (!supabase) {
        console.error("Supabase client not initialized");
        return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/auth.html' // Intermediate page to handle token exchange
        }
    });

    if (error) {
        throw error;
    }
}

function logout() {
    localStorage.removeItem('access_token');
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
