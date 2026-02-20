const API_URL = "https://brandnova-brand-automation.vercel.app/api"; // Production

// Auth Check & Redirect
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html";
}

// Helper: Fetch with Auth
async function api(path, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const res = await window.fetchWithRetry(`${API_URL}/admin${path}`, options, 3);

        // Handle Auth Errors
        if (res.status === 403 || res.status === 401) {
            alert("⛔ Admin Access Required. Please log in with an admin account.");
            window.location.href = "dashboard.html";
            return null;
        }

        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Non-JSON Response:", text);
            // alert("Server Error: " + text.substring(0, 100));
            throw new Error(text);
        }
    } catch (err) {
        console.error("API Error:", err);
        return null;
    }
}

// Helper: Set Active Nav
function setActiveNav(id) {
    document.querySelectorAll('nav button').forEach(b => {
        b.classList.remove('bg-white/10', 'text-purple-400', 'font-semibold');
        b.classList.add('hover:bg-white/5');
    });
    const active = document.getElementById(id);
    if (active) {
        active.classList.add('bg-white/10', 'text-purple-400', 'font-semibold');
        active.classList.remove('hover:bg-white/5');
    }
}

// Global Chart References
let usageChartInstance = null;
let usersChartInstance = null;
let liveUsageInterval = null;
let liveUsersInterval = null;
let currentDashboardTimeframe = 'hourly';

// === VIEW: DASHBOARD ===
async function loadDashboard() {
    setActiveNav('nav-dashboard');
    document.getElementById('page-title').innerText = "Dashboard Overview";
    document.getElementById('page-subtitle').innerText = "Live metrics and system performance.";
    document.getElementById('contentArea').style.display = 'none'; // Hide table container
    document.getElementById('kpi-grid').style.display = 'grid';
    document.getElementById('charts-grid').style.display = 'grid';

    // Timeframe toggle block
    const toggleContainer = document.getElementById('timeframe-toggle');
    if (toggleContainer) toggleContainer.style.display = 'flex';

    const reqTimeframe = currentDashboardTimeframe === 'hourly' ? '24h' : '30d';
    const stats = await api(`/dashboard?timeframe=${reqTimeframe}`);
    if (!stats) return;

    // Render KPIs
    document.getElementById("kpi-grid").innerHTML = `
      <div class="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition duration-300 group">
        <div class="flex justify-between items-start">
            <div>
                <p class="text-sm font-medium text-gray-400 mb-1">Total Users</p>
                <h3 class="text-3xl font-bold text-white group-hover:text-purple-400 transition">${stats.total_users}</h3>
            </div>
            <div class="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
        </div>
      </div>

      <div class="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-lg shadow-purple-500/10 hover:shadow-green-500/20 transition duration-300 group">
        <div class="flex justify-between items-start">
            <div>
                <p class="text-sm font-medium text-gray-400 mb-1">Active Users</p>
                <h3 class="text-3xl font-bold text-white group-hover:text-green-400 transition">${stats.active_users}</h3>
            </div>
            <div class="p-2 bg-green-500/20 rounded-lg text-green-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
        </div>
      </div>

      <div class="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-lg shadow-purple-500/10 hover:shadow-blue-500/20 transition duration-300 group">
        <div class="flex justify-between items-start">
            <div>
                <p class="text-sm font-medium text-gray-400 mb-1">Total Tokens</p>
                <h3 class="text-3xl font-bold text-white group-hover:text-blue-400 transition">${stats.total_tokens.toLocaleString()}</h3>
            </div>
            <div class="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
        </div>
      </div>

      <div class="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-lg shadow-purple-500/10 hover:shadow-pink-500/20 transition duration-300 group">
        <div class="flex justify-between items-start">
            <div>
                <p class="text-sm font-medium text-gray-400 mb-1">Content Gen</p>
                <h3 class="text-3xl font-bold text-white group-hover:text-pink-400 transition">${stats.total_content.toLocaleString()}</h3>
            </div>
            <div class="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
        </div>
      </div>
    `;

    renderCharts(stats);

    // Global Loading State Manager - Remove skeleton
    const loader = document.getElementById('authLoader');
    if (loader) {
        loader.style.opacity = '0';

        // Trigger Motion Rendering
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('sidebar-animate')) {
            sidebar.classList.add('sidebar-animate');
        }

        const kpiCards = document.querySelectorAll('#kpi-grid > .group');
        kpiCards.forEach((card, i) => {
            card.classList.add('kpi-animate');
            card.style.animationDelay = `${i * 0.1}s`;
        });

        const chartsGrid = document.getElementById('charts-grid');
        if (chartsGrid) {
            chartsGrid.classList.add('main-animate');
            chartsGrid.style.animationDelay = '0.3s';
        }

        setTimeout(() => loader.remove(), 500);

        // Start Live Polling Engine
        startLiveUsage();
        startLiveUsers();
    }
}

window.switchTimeframe = async function (frame) {
    if (currentDashboardTimeframe === frame) return;
    currentDashboardTimeframe = frame;

    // Update active button classes safely
    const btnHourly = document.getElementById('btn-hourly');
    const btnDaily = document.getElementById('btn-daily');
    if (btnHourly && btnDaily) {
        if (frame === 'hourly') {
            btnHourly.className = 'px-3 py-1 text-xs font-medium rounded-md bg-purple-500 text-white shadow transition';
            btnDaily.className = 'px-3 py-1 text-xs font-medium rounded-md text-gray-400 hover:text-white transition';
        } else {
            btnDaily.className = 'px-3 py-1 text-xs font-medium rounded-md bg-purple-500 text-white shadow transition';
            btnHourly.className = 'px-3 py-1 text-xs font-medium rounded-md text-gray-400 hover:text-white transition';
        }
    }

    // Refresh charts data natively without unmounting
    const reqTimeframe = currentDashboardTimeframe === 'hourly' ? '24h' : '30d';
    const data = await api(`/dashboard?timeframe=${reqTimeframe}`);
    if (data) {
        if (usageChartInstance) {
            usageChartInstance.data.labels = data.usage_labels;
            usageChartInstance.data.datasets[0].data = data.usage_data;
            usageChartInstance.update();
        }
        if (usersChartInstance) {
            usersChartInstance.data.labels = data.user_labels;
            usersChartInstance.data.datasets[0].data = data.user_data;
            usersChartInstance.update();
        }
    }
}

function renderCharts(stats) {
    // If charts already exist, destroy them to update
    if (usageChartInstance) usageChartInstance.destroy();
    if (usersChartInstance) usersChartInstance.destroy();

    // Usage Chart
    const ctx1 = document.getElementById("usageChart").getContext('2d');
    usageChartInstance = new Chart(ctx1, {
        type: "line",
        data: {
            labels: stats.usage_labels,
            datasets: [{
                label: "Token Usage",
                data: stats.usage_data,
                borderColor: "#a855f7",
                backgroundColor: "rgba(168, 85, 247, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#a855f7"
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // User Chart
    const ctx2 = document.getElementById("usersChart").getContext('2d');

    // Add smooth animation delay on initial load
    document.getElementById("usersChart").parentElement.classList.add('opacity-0', 'animate-[fadeInMain_0.6s_forwards]');

    usersChartInstance = new Chart(ctx2, {
        type: "line",
        data: {
            labels: stats.user_labels,
            datasets: [{
                label: "New Users",
                data: stats.user_data,
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: "#3b82f6"
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// === LIVE KPI ENGINE ===
function startLiveUsage() {
    if (liveUsageInterval) clearInterval(liveUsageInterval);

    liveUsageInterval = setInterval(async () => {
        // Stop polling if we navigated away from dashboard
        if (document.getElementById('charts-grid').style.display === 'none') {
            clearInterval(liveUsageInterval);
            return;
        }

        try {
            const data = await api("/live-usage", "GET");
            if (data && usageChartInstance) {
                // Update just the datasets (avoids flash & layout shift)
                usageChartInstance.data.labels = data.usage_labels;
                usageChartInstance.data.datasets[0].data = data.usage_data;
                usageChartInstance.update('none'); // Update without full structural re-render
            }
        } catch (e) {
            console.error("Live usage sync failed:", e);
        }
    }, 5000);
}

function startLiveUsers() {
    if (liveUsersInterval) clearInterval(liveUsersInterval);

    liveUsersInterval = setInterval(async () => {
        if (document.getElementById('charts-grid').style.display === 'none') {
            clearInterval(liveUsersInterval);
            return;
        }

        try {
            const reqTimeframe = currentDashboardTimeframe === 'hourly' ? '24h' : '30d';
            const data = await api(`/dashboard?timeframe=${reqTimeframe}`);
            if (data && usersChartInstance) {
                // Update specific datasets array avoiding reflows
                usersChartInstance.data.labels = data.user_labels;
                usersChartInstance.data.datasets[0].data = data.user_data;
                usersChartInstance.update('none');
            }
        } catch (e) {
            console.error("Live user polling sync failed:", e);
        }
    }, 10000);
}

// === VIEW: USERS ===
let allUsers = [];

async function loadUsers() {
    setActiveNav('nav-users');
    document.getElementById('page-title').innerText = "User Management";
    document.getElementById('page-subtitle').innerText = "Manage access, roles, and subscriptions.";
    document.getElementById('kpi-grid').style.display = 'none';
    document.getElementById('charts-grid').style.display = 'none';
    const toggleContainer = document.getElementById('timeframe-toggle');
    if (toggleContainer) toggleContainer.style.display = 'none';
    const contentArea = document.getElementById('contentArea');
    contentArea.style.display = 'block';

    const users = await api("/users");
    if (!users) return;
    allUsers = users;

    contentArea.innerHTML = `
        <div class="p-6 border-b border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5">
            <div class="relative w-full md:w-1/3">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input type="text" id="searchUser" placeholder="Search by email or ID..." class="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg text-sm border border-gray-700 w-full focus:outline-none focus:border-purple-500 transition shadow-sm">
            </div>
            
            <div class="flex flex-wrap gap-2 w-full md:w-auto">
                <select id="filterRole" class="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-purple-500 shadow-sm transition cursor-pointer">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
                <select id="filterPlan" class="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-purple-500 shadow-sm transition cursor-pointer">
                    <option value="all">All Plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                </select>
                <select id="filterStatus" class="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-purple-500 shadow-sm transition cursor-pointer">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
            </div>
        </div>
        <div id="usersTableContainer" class="overflow-x-auto min-h-[300px]"></div>
    `;

    document.getElementById('searchUser').addEventListener('input', renderUsersTable);
    document.getElementById('filterRole').addEventListener('change', renderUsersTable);
    document.getElementById('filterPlan').addEventListener('change', renderUsersTable);
    document.getElementById('filterStatus').addEventListener('change', renderUsersTable);

    renderUsersTable();
}

function renderUsersTable() {
    const search = document.getElementById('searchUser').value.toLowerCase();
    const role = document.getElementById('filterRole').value;
    const plan = document.getElementById('filterPlan').value;
    const status = document.getElementById('filterStatus').value;

    const filtered = allUsers.filter(u => {
        if (search && !u.email.toLowerCase().includes(search) && String(u.id) !== search) return false;
        if (role === 'admin' && !u.is_admin) return false;
        if (role === 'user' && u.is_admin) return false;
        if (plan !== 'all' && u.subscription_plan?.toLowerCase() !== plan) return false;
        if (status === 'active' && !u.is_active) return false;
        if (status === 'banned' && u.is_active) return false;
        return true;
    });

    let currentUserId = null;
    try {
        currentUserId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).sub;
    } catch (e) { }

    const container = document.getElementById('usersTableContainer');
    container.innerHTML = `
        <table class="w-full text-left text-sm text-gray-400">
            <thead class="bg-white/5 text-gray-200 uppercase font-medium">
                <tr>
                    <th class="px-6 py-4">User</th>
                    <th class="px-6 py-4">Role</th>
                    <th class="px-6 py-4">Status</th>
                    <th class="px-6 py-4">Plan</th>
                    <th class="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
                ${filtered.length === 0 ? `<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">No users found matching filters.</td></tr>` :
            filtered.map(u => {
                const isSelf = String(u.id) === String(currentUserId);
                return `
                    <tr class="hover:bg-white/5 transition opacity-0 animate-[fadeInMain_0.3s_forwards]">
                        <td class="px-6 py-4">
                            <p class="text-white font-medium">${u.email}</p>
                            <p class="text-xs text-gray-500">ID: ${u.id}</p>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded-full text-xs font-semibold ${u.is_admin ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}">
                                ${u.is_admin ? 'ADMIN' : 'USER'}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                                ${u.is_active ? 'Active' : 'Banned'}
                            </span>
                        </td>
                        <td class="px-6 py-4 uppercase font-medium text-gray-300">${u.subscription_plan}</td>
                        <td class="px-6 py-4 text-right space-x-3 flex justify-end items-center">
                            <select onchange="changeRole(${u.id}, this)" ${isSelf ? 'disabled title="Cannot change your own role"' : ''} class="${isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} bg-gray-900 text-white px-2 py-1.5 rounded text-xs border border-gray-700 outline-none hover:border-purple-500 transition shadow-sm">
                                <option value="user" ${!u.is_admin ? 'selected' : ''}>User</option>
                                <option value="admin" ${u.is_admin ? 'selected' : ''}>Admin</option>
                            </select>
                            
                            <button onclick="toggleActive(${u.id})" class="text-xs font-medium px-3 py-1.5 rounded border shadow-sm ${u.is_active ? 'text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10' : 'text-green-400 border-green-500/30 hover:bg-green-500/10'} transition cursor-pointer">
                                ${u.is_active ? 'Ban' : 'Unban'}
                            </button>
                            <button onclick="impersonateUser(${u.id}, '${u.email}', '${u.subscription_plan}', ${u.is_admin})" ${u.is_admin ? 'disabled title="Cannot impersonate administrators"' : ''} class="text-xs font-medium px-3 py-1.5 rounded border shadow-sm ml-2 transition ${u.is_admin ? 'text-gray-500 border-gray-600 opacity-50 cursor-not-allowed' : 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10 cursor-pointer'}">
                                Login As
                            </button>
                        </td>
                    </tr>
                `}).join("")}
            </tbody>
        </table>
    `;
}

// === ACTIONS ===
window.changeRole = async function (id, selectEl) {
    if (!confirm("Are you sure you want to modify this user's role?")) {
        // Revert select choice
        selectEl.value = selectEl.value === 'admin' ? 'user' : 'admin';
        return;
    }
    const res = await api(`/users/${id}/toggle-admin`, "PUT");
    if (res) {
        // Optimistic UI Update
        const u = allUsers.find(user => user.id === id);
        if (u) u.is_admin = !u.is_admin;
        renderUsersTable();
    } else {
        loadUsers(); // refresh network
    }
}

window.toggleActive = async function (id) {
    if (!confirm("Are you sure you want to change active status?")) return;
    const res = await api(`/users/${id}/toggle-active`, "PUT");
    if (res) {
        // Optimistic UI Update
        const u = allUsers.find(user => user.id === id);
        if (u) u.is_active = !u.is_active;
        renderUsersTable();
    } else {
        loadUsers(); // refresh network
    }
}

window.impersonateUser = function (id, email, plan, isAdmin) {
    if (isAdmin) {
        alert("Security Error: Cannot impersonate other administrators.");
        return;
    }
    if (!confirm(`Are you sure you want to impersonate ${email}?`)) return;

    // Original admin session is securely stored via physical JWT. We execute client-side override.
    const fakeData = { id, email, fullname: email.split('@')[0], is_admin: false, subscription_plan: plan || 'free' };
    localStorage.setItem('impersonated_user', JSON.stringify(fakeData));

    window.location.href = 'dashboard.html';
}

// === VIEW: USAGE (Audit Log Panel) ===
async function loadUsage() {
    setActiveNav('nav-usage');
    document.getElementById('page-title').innerText = "System Audit Logs";
    document.getElementById('page-subtitle').innerText = "Live tracking of platform events and token usage.";
    document.getElementById('kpi-grid').style.display = 'none';
    document.getElementById('charts-grid').style.display = 'none';
    const toggleContainer = document.getElementById('timeframe-toggle');
    if (toggleContainer) toggleContainer.style.display = 'none';
    const contentArea = document.getElementById('contentArea');
    contentArea.style.display = 'block';

    contentArea.innerHTML = '<div class="p-10 text-center text-gray-500"><div class="animate-pulse">Loading audit logs...</div></div>';

    const logs = await api("/usage");
    if (!logs) return;

    contentArea.innerHTML = `
        <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table class="w-full text-left text-sm text-gray-400 relative">
                <thead class="bg-gray-800/80 backdrop-blur-md text-gray-200 sticky top-0 z-10">
                    <tr>
                        <th class="px-6 py-4">Timestamp</th>
                        <th class="px-6 py-4">User</th>
                        <th class="px-6 py-4">Action Type</th>
                        <th class="px-6 py-4 text-right">Details / Tokens</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/10">
                    ${logs.length === 0 ? `<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">No logs found.</td></tr>` :
            logs.map((l, i) => `
                        <tr class="hover:bg-white/5 transition opacity-0 animate-[fadeInMain_0.4s_forwards]" style="animation-delay: ${Math.min(i * 0.05, 1)}s">
                            <td class="px-6 py-4 text-xs font-mono text-gray-500 whitespace-nowrap">${new Date(l.created_at).toLocaleString()}</td>
                            <td class="px-6 py-4 font-medium text-gray-300">${l.user_email || l.user_id}</td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 rounded text-xs font-semibold ${l.feature.includes('chat') || l.feature.includes('generate') ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}">
                                    ${l.feature.toUpperCase()}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right font-mono text-green-400">${l.tokens_used > 0 ? `+${l.tokens_used} tokens` : '-'}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function loadContent() {
    setActiveNav('nav-content');
    document.getElementById('page-title').innerText = "Generated Content";
    document.getElementById('kpi-grid').style.display = 'none';
    document.getElementById('charts-grid').style.display = 'none';
    const toggleContainer = document.getElementById('timeframe-toggle');
    if (toggleContainer) toggleContainer.style.display = 'none';
    const contentArea = document.getElementById('contentArea');
    contentArea.style.display = 'block';

    const content = await api("/generated");
    if (!content) return;
    document.getElementById('contentArea').innerHTML = `
        <table class="w-full text-left text-sm text-gray-400">
            <thead class="bg-white/5 text-gray-200"><tr><th class="px-6 py-4">Date</th><th class="px-6 py-4">Type</th><th class="px-6 py-4">Preview</th></tr></thead>
            <tbody class="divide-y divide-white/10">
                ${content.map(c => `<tr><td class="px-6 py-4">${new Date(c.created_at).toLocaleString()}</td><td class="px-6 py-4">${c.content_type}</td><td class="px-6 py-4 font-mono text-xs">${c.content.substring(0, 60)}...</td></tr>`).join("")}
            </tbody>
        </table>`;
}

// Initial Load
document.addEventListener("DOMContentLoaded", loadDashboard);
