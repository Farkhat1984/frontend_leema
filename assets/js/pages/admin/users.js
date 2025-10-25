const AdminUsersModule = (function() {
    if (!localStorage.getItem('platform')) {
        localStorage.setItem('platform', 'web');
    }

    const DOM = {
        get totalUsers() { return document.getElementById('totalUsers'); },
        get totalUserBalance() { return document.getElementById('totalUserBalance'); },
        get activeUsers() { return document.getElementById('activeUsers'); },
        get newUsers() { return document.getElementById('newUsers'); },
        get usersList() { return document.getElementById('usersList'); }
    };

    function initializeWebSocket() {
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'balance.updated': () => { 
                    loadUsersStats(); 
                    loadUsersList(); 
                }
            });
        }
    }

    function updateStatsDisplay(dashboard) {
        if (DOM.totalUsers) {
            DOM.totalUsers.textContent = dashboard.total_users;
        }
        if (DOM.totalUserBalance) {
            DOM.totalUserBalance.textContent = `$${dashboard.total_user_balances.toFixed(2)}`;
        }
        if (DOM.activeUsers) {
            DOM.activeUsers.textContent = dashboard.total_users;
        }
        if (DOM.newUsers) {
            DOM.newUsers.textContent = '0';
        }
    }

    function createUsersTable(users) {
        return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 10px; text-align: left;">Email</th>
                        <th style="padding: 10px; text-align: left;">Name</th>
                        <th style="padding: 10px; text-align: right;">Balance</th>
                        <th style="padding: 10px; text-align: center;">Free Generations</th>
                        <th style="padding: 10px; text-align: center;">Free Try-ons</th>
                        <th style="padding: 10px; text-align: left;">Registration Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => createUserRow(user)).join('')}
                </tbody>
            </table>
        `;
    }

    function createUserRow(user) {
        const date = new Date(user.created_at).toLocaleDateString('en-US');
        return `
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px;">${user.email}</td>
                <td style="padding: 10px;">${user.name || 'N/A'}</td>
                <td style="padding: 10px; text-align: right; font-weight: 600; color: #667eea;">
                    $${user.balance.toFixed(2)}
                </td>
                <td style="padding: 10px; text-align: center;">${user.free_generations}</td>
                <td style="padding: 10px; text-align: center;">${user.free_try_ons}</td>
                <td style="padding: 10px;">${date}</td>
            </tr>
        `;
    }

    async function loadUsersStats() {
        try {
            const dashboard = await apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD);
            updateStatsDisplay(dashboard);
        } catch (error) {
            CommonUtils.logError('loadUsersStats', error);
        }
    }

    async function loadUsersList() {
        try {
            const users = await apiRequest(API_ENDPOINTS.ADMIN.USERS);
            
            if (!DOM.usersList) return;

            if (users.length === 0) {
                DOM.usersList.innerHTML = '<p style="color: #999;">No users found</p>';
                return;
            }

            DOM.usersList.innerHTML = createUsersTable(users);
        } catch (error) {
            CommonUtils.logError('loadUsersList', error);
        }
    }

    async function init() {
        try {
            initializeWebSocket();
            await loadUsersStats();
            await loadUsersList();
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_DATA + ': ' + error.message, 'error');
        }
    }

    return {
        init,
        loadUsersStats,
        loadUsersList
    };
})();

AdminUsersModule.init();
