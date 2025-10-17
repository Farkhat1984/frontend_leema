// Страница управления пользователями

// Инициализировать platform перед любыми запросами
if (!localStorage.getItem('platform')) {
    localStorage.setItem('platform', 'web');
}

async function loadPageData() {
    try {
        // Initialize WebSocket for admin
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'balance.updated': () => { loadUsersStats(); loadUsersList(); }
            });
        }
        
        await loadUsersStats();
        await loadUsersList();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadUsersStats() {
    try {
        const dashboard = await apiRequest('/api/v1/admin/dashboard');
        document.getElementById('totalUsers').textContent = dashboard.total_users;
        document.getElementById('totalUserBalance').textContent = `$${dashboard.total_user_balances.toFixed(2)}`;
        
        // Approximations (можно добавить эти данные в API)
        document.getElementById('activeUsers').textContent = dashboard.total_users;
        document.getElementById('newUsers').textContent = '0';
    } catch (error) {
    }
}

async function loadUsersList() {
    try {
        const users = await apiRequest('/api/v1/admin/users');
        const container = document.getElementById('usersList');

        if (users.length === 0) {
            container.innerHTML = '<p style="color: #999;">Пользователей нет</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 10px; text-align: left;">Email</th>
                        <th style="padding: 10px; text-align: left;">Имя</th>
                        <th style="padding: 10px; text-align: right;">Баланс</th>
                        <th style="padding: 10px; text-align: center;">Бесплатно генераций</th>
                        <th style="padding: 10px; text-align: center;">Бесплатно примерок</th>
                        <th style="padding: 10px; text-align: left;">Дата регистрации</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => {
            const date = new Date(user.created_at).toLocaleDateString('ru-RU');
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
        }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
    }
}

// WebSocket handlers
function onBalanceUpdate(data) {
    loadUsersStats();
    loadUsersList();
}

function onTransactionUpdate(data) {
    loadUsersStats();
    loadUsersList();
}

// Автоматическая загрузка данных при инициализации страницы
loadPageData();
