// Страница дашбордов и аналитики
console.log('admin-dashboard.js loaded');

async function loadPageData() {
    try {
        await loadFinanceStats();
        await loadRefunds();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadFinanceStats() {
    try {
        const dashboard = await apiRequest('/api/v1/admin/dashboard');
        document.getElementById('userBalances').textContent = `$${dashboard.total_user_balances.toFixed(2)}`;
        document.getElementById('shopBalances').textContent = `$${dashboard.total_shop_balances.toFixed(2)}`;
        
        // Approximations (можно добавить эти данные в API)
        document.getElementById('totalTransactions').textContent = '0';
        const turnover = dashboard.total_user_balances + dashboard.total_shop_balances;
        document.getElementById('platformTurnover').textContent = `$${turnover.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading finance stats:', error);
    }
}

async function loadRefunds() {
    try {
        const status = document.getElementById('refundStatusFilter').value;
        const refunds = await apiRequest(`/api/v1/admin/refunds${status ? '?status=' + status : ''}`);
        const container = document.getElementById('refundsList');

        if (refunds.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет запросов на возврат</p></div>';
            return;
        }

        container.innerHTML = refunds.map(refund => `
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <p><strong>ID:</strong> ${refund.id}</p>
                <p><strong>Причина:</strong> ${refund.reason}</p>
                <p><strong>Статус:</strong> ${refund.status}</p>
                ${refund.status === 'pending' ? `
                    <div style="margin-top: 10px;">
                        <button class="btn btn-success" onclick="processRefund(${refund.id}, 'approve')">Одобрить</button>
                        <button class="btn btn-danger" onclick="processRefund(${refund.id}, 'reject')">Отклонить</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        showAlert('Ошибка загрузки возвратов: ' + error.message, 'error');
    }
}

async function processRefund(refundId, action) {
    try {
        await apiRequest(`/api/v1/admin/refunds/${refundId}/process`, 'POST', { action });
        showAlert(`Возврат ${action === 'approve' ? 'одобрен' : 'отклонен'}`, 'success');
        await loadRefunds();
        await loadFinanceStats();
    } catch (error) {
        showAlert('Ошибка обработки возврата: ' + error.message, 'error');
    }
}

// WebSocket handlers
function onBalanceUpdate(data) {
    loadFinanceStats();
}

function onTransactionUpdate(data) {
    loadFinanceStats();
}

// Make functions globally accessible
window.loadRefunds = loadRefunds;
window.processRefund = processRefund;
