// Страница управления магазинами

async function loadPageData() {
    try {
        await loadShopsStats();
        await loadShopsList();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadShopsStats() {
    try {
        const dashboard = await apiRequest('/api/v1/admin/dashboard');
        document.getElementById('totalShops').textContent = dashboard.total_shops;
        document.getElementById('totalShopBalance').textContent = `$${dashboard.total_shop_balances.toFixed(2)}`;
        
        // Approximations (можно добавить эти данные в API)
        document.getElementById('activeShops').textContent = dashboard.total_shops;
        document.getElementById('shopsWithProducts').textContent = dashboard.total_shops;
    } catch (error) {
    }
}

async function loadShopsList() {
    try {
        const shops = await apiRequest('/api/v1/admin/shops');
        const container = document.getElementById('shopsList');

        if (shops.length === 0) {
            container.innerHTML = '<p style="color: #999;">Магазинов нет</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 10px; text-align: left;">Название</th>
                        <th style="padding: 10px; text-align: left;">Email</th>
                        <th style="padding: 10px; text-align: right;">Баланс</th>
                        <th style="padding: 10px; text-align: left;">Дата регистрации</th>
                    </tr>
                </thead>
                <tbody>
                    ${shops.map(shop => {
            const date = new Date(shop.created_at).toLocaleDateString('ru-RU');
            return `
                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 10px; font-weight: 600;">${shop.shop_name}</td>
                                <td style="padding: 10px;">${shop.email}</td>
                                <td style="padding: 10px; text-align: right; font-weight: 600; color: #10b981;">
                                    $${shop.balance.toFixed(2)}
                                </td>
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
    loadShopsStats();
    loadShopsList();
}

function onTransactionUpdate(data) {
    loadShopsStats();
    loadShopsList();
}
