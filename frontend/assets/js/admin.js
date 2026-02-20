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

// === VIEW: DASHBOARD ===
async function loadDashboard() {
    setActiveNav('nav-dashboard');
    document.getElementById('page-title').innerText = "Dashboard Overview";
    document.getElementById('page-subtitle').innerText = "Live metrics and system performance.";
    document.getElementById('contentArea').style.display = 'none'; // Hide table container
    document.getElementById('kpi-grid').style.display = 'grid';
    document.getElementById('charts-grid').style.display = 'grid';

    const stats = await api("/dashboard");
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
    usersChartInstance = new Chart(ctx2, {
        type: "bar",
        data: {
            labels: stats.user_labels,
            datasets: [{
                label: "New Users",
                data: stats.user_data,
                backgroundColor: "#3b82f6",
                borderRadius: 4
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

// === VIEW: USERS ===
async function loadUsers() {
    setActiveNav('nav-users');
    document.getElementById('page-title').innerText = "User Management";
    document.getElementById('page-subtitle').innerText = "Manage access, roles, and subscriptions.";
    document.getElementById('kpi-grid').style.display = 'none';
    document.getElementById('charts-grid').style.display = 'none';
    const contentArea = document.getElementById('contentArea');
    contentArea.style.display = 'block';

    const users = await api("/users");
    if (!users) return;

    contentArea.innerHTML = `
        <div class="overflow-x-auto">
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
                    ${users.map(u => `
                        <tr class="hover:bg-white/5 transition">
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
                            <td class="px-6 py-4 uppercase">${u.subscription_plan}</td>
                            <td class="px-6 py-4 text-right space-x-2">
                                <button onclick="toggleAdmin(${u.id})" class="text-xs font-medium ${u.is_admin ? 'text-red-400 hover:text-red-300' : 'text-purple-400 hover:text-purple-300'}">
                                    ${u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                </button>
                                <button onclick="toggleActive(${u.id})" class="text-xs font-medium ${u.is_active ? 'text-yellow-500 hover:text-yellow-400' : 'text-green-400 hover:text-green-300'}">
                                    ${u.is_active ? 'Ban' : 'Unban'}
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

// === ACTIONS ===
async function toggleAdmin(id) {
    if (!confirm("Are you sure you want to modify admin privileges?")) return;
    await api(`/users/${id}/toggle-admin`, "PUT");
    loadUsers(); // Refresh
}

async function toggleActive(id) {
    if (!confirm("Are you sure you want to change active status?")) return;
    await api(`/users/${id}/toggle-active`, "PUT");
    loadUsers(); // Refresh
}

// === VIEW: USAGE (Placeholder) ===
async function loadUsage() {
    setActiveNav('nav-usage');
    document.getElementById('page-title').innerText = "Usage Logs";
    document.getElementById('contentArea').innerHTML = '<div class="p-10 text-center text-gray-500">Log viewer loading implementation...</div>';
    // Implementation same as Users but simpler table
    const logs = await api("/usage");
    if (!logs) return;
    document.getElementById('contentArea').innerHTML = `
        <table class="w-full text-left text-sm text-gray-400">
            <thead class="bg-white/5 text-gray-200"><tr><th class="px-6 py-4">Date</th><th class="px-6 py-4">User</th><th class="px-6 py-4">Feature</th><th class="px-6 py-4">Tokens</th></tr></thead>
            <tbody class="divide-y divide-white/10">
                ${logs.map(l => `<tr><td class="px-6 py-4">${new Date(l.created_at).toLocaleString()}</td><td class="px-6 py-4">${l.user_id}</td><td class="px-6 py-4">${l.feature}</td><td class="px-6 py-4">${l.tokens_used}</td></tr>`).join("")}
            </tbody>
        </table>`;
}

async function loadContent() {
    setActiveNav('nav-content');
    document.getElementById('page-title').innerText = "Generated Content";
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
