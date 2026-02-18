document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) window.location.href = 'login.html';

    // Verify Admin Access
    try {
        const meRes = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await meRes.json();
        if (!user.is_admin) {
            window.location.href = 'dashboard.html'; // Redirect non-admins
            return;
        }
    } catch (e) {
        window.location.href = 'login.html';
        return;
    }

    // Load Stats
    loadStats(token);
    // Load Users
    loadUsers(token);
});

async function loadStats(token) {
    const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await res.json();

    // Example: Update DOM elements with IDs like 'total-users'
    const statsContainer = document.getElementById('adminStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="card stat-card"><h3>Total Users</h3><div class="value">${stats.total_users}</div></div>
            <div class="card stat-card"><h3>Active Users</h3><div class="value">${stats.active_users}</div></div>
            <div class="card stat-card"><h3>Pro Users</h3><div class="value">${stats.pro_users || 0}</div></div>
            <div class="card stat-card"><h3>Generations</h3><div class="value">${stats.total_generations}</div></div>
        `;
    }
}

async function loadUsers(token) {
    const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await res.json();

    const tbody = document.getElementById('userTableBody');
    if (tbody) {
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>${u.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                    <button onclick="toggleRole(${u.id}, '${u.role === 'admin' ? 'user' : 'admin'}')">
                        Make ${u.role === 'admin' ? 'User' : 'Admin'}
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// Make globally available for onclick events
window.toggleRole = async (userId, newRole) => {
    const token = localStorage.getItem('access_token');
    await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
    });
    location.reload();
};
