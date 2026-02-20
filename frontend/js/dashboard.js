import './auth.js'; // Assuming Module setup or global loading

// We might not be using modules directly in HTML without type="module"
// So standard globals are safer for this simple setup.
// If using type="module", verify imports.

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await window.fetchWithRetry('/api/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response || !response.ok) {
            throw new Error('Failed to fetch user profile'); // Likely expired token
        }

        const user = await response.json();

        // Display User Info
        const welcomeEl = document.querySelector('.page-title');
        if (welcomeEl) {
            welcomeEl.textContent = `Welcome back, ${user.fullname || user.email}!`;
        }

        // Role check
        if (user.is_admin) {
            // Add Admin Link to Sidebar if not present
            const nav = document.querySelector('.nav-menu');
            if (nav && !document.querySelector('a[href="admin.html"]')) {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.className = 'nav-item';
                adminLink.innerHTML = '<i class="fas fa-shield-alt"></i> Admin Panel';
                nav.insertBefore(adminLink, nav.firstChild);
            }
        }

        // Setup Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('access_token');
                window.location.href = 'login.html';
            });
        }

    } catch (error) {
        console.error("Auth Error:", error);
        localStorage.removeItem('access_token');
        window.location.href = 'login.html';
    }
});
