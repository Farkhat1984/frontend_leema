const AdminDashboardModule = (function() {
    const DOM = {
        get loginPage() { return document.getElementById('loginPage'); },
        get adminDashboard() { return document.getElementById('adminDashboard'); },
        get totalUsers() { return document.getElementById('adminTotalUsers'); },
        get totalShops() { return document.getElementById('adminTotalShops'); },
        get totalProducts() { return document.getElementById('adminTotalProducts'); },
        get totalOrders() { return document.getElementById('adminTotalOrders'); },
        get pendingModeration() { return document.getElementById('adminPendingModeration'); },
        get userBalances() { return document.getElementById('adminUserBalances'); },
        get shopBalances() { return document.getElementById('adminShopBalances'); },
        get usersList() { return document.getElementById('usersList'); },
        get shopsList() { return document.getElementById('shopsList'); },
        get moderationQueue() { return document.getElementById('moderationQueue'); },
        get refundsList() { return document.getElementById('refundsList'); },
        get settingsList() { return document.getElementById('settingsList'); }
    };

    function initializeWebSocket() {
        CommonUtils.initWebSocket('admin', {
            'moderation.queue_updated': (data) => { if (typeof onModerationUpdate === 'function') onModerationUpdate(data); },
            'product.created': (data) => { if (typeof onProductUpdate === 'function') onProductUpdate(data); },
            'settings.updated': (data) => { if (typeof onSettingsUpdate === 'function') onSettingsUpdate(data); },
            'balance.updated': (data) => { if (typeof onBalanceUpdate === 'function') onBalanceUpdate(data); },
            'transaction.completed': (data) => { if (typeof onTransactionUpdate === 'function') onTransactionUpdate(data); }
        });
    }

    function updateDashboardStats(dashboard) {
        if (DOM.totalUsers) DOM.totalUsers.textContent = dashboard.total_users || 0;
        if (DOM.totalShops) DOM.totalShops.textContent = dashboard.total_shops || 0;
        if (DOM.totalProducts) DOM.totalProducts.textContent = dashboard.total_products || 0;
        if (DOM.totalOrders) DOM.totalOrders.textContent = dashboard.total_orders || 0;
        if (DOM.pendingModeration) DOM.pendingModeration.textContent = dashboard.pending_moderation || 0;
        if (DOM.userBalances) DOM.userBalances.textContent = `₸${(dashboard.total_user_balances || 0).toFixed(2)}`;
        if (DOM.shopBalances) DOM.shopBalances.textContent = `₸${(dashboard.total_shop_balances || 0).toFixed(2)}`;
    }

    function createUserRow(user) {
        const date = new Date(user.created_at).toLocaleDateString('en-US');
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.name || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600">
                    ₸${user.balance.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">${user.free_generations}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">${user.free_try_ons}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
            </tr>
        `;
    }

    function createUsersTable(users) {
        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Generations</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Try-ons</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${users.map(user => createUserRow(user)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function createShopRow(shop) {
        const date = new Date(shop.created_at).toLocaleDateString('en-US');
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${shop.shop_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${shop.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                    ₸${shop.balance.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
            </tr>
        `;
    }

    function createShopsTable(shops) {
        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${shops.map(shop => createShopRow(shop)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function createProductCard(product) {
        const imageUrl = product.images && product.images.length > 0 ? formatImageUrl(product.images[0]) : null;
        const createdDate = new Date(product.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div class="aspect-square bg-gray-100">
                    ${imageUrl
                ? `<img data-src="${imageUrl}" alt="${product.name}" loading="lazy" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=&quot;flex items-center justify-center h-full text-gray-400&quot;>MESSAGES.ERROR.LOADING_IMAGE</div>'">`
                : '<div class="flex items-center justify-center h-full text-gray-400">No image</div>'}
                </div>
                
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${product.name || 'Untitled'}</h3>
                    <div class="text-2xl font-bold text-purple-600 mb-4">₸${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    
                    <div class="space-y-3 mb-4">
                        <div>
                            <span class="text-xs font-medium text-gray-500 uppercase">Description</span>
                            <p class="text-sm text-gray-700 mt-1 line-clamp-2">${product.description || 'No description'}</p>
                        </div>
                        
                        <div>
                            <span class="text-xs font-medium text-gray-500 uppercase">Shop</span>
                            <p class="text-sm font-medium text-gray-900 mt-1">${product.shop_name || 'Unknown'}</p>
                        </div>
                        
                        <div>
                            <span class="text-xs font-medium text-gray-500 uppercase">Date Added</span>
                            <p class="text-sm text-gray-700 mt-1">${createdDate}</p>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="AdminDashboardModule.moderateProduct(${product.id}, 'approve')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                            Approve
                        </button>
                        <button onclick="AdminDashboardModule.moderateProduct(${product.id}, 'reject')" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async function loadUsersList() {
        try {
            if (!DOM.usersList) return;
            
            const users = await apiRequest(API_ENDPOINTS.ADMIN.USERS);

            if (users.length === 0) {
                DOM.usersList.innerHTML = '<div class="p-4 text-gray-500 text-center">No users found</div>';
                return;
            }

            DOM.usersList.innerHTML = createUsersTable(users);
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_USERS + ': ' + error.message, 'error', 'adminAlertContainer');
        }
    }

    async function loadShopsList() {
        try {
            if (!DOM.shopsList) return;
            
            const shops = await apiRequest(API_ENDPOINTS.ADMIN.SHOPS);

            if (shops.length === 0) {
                DOM.shopsList.innerHTML = '<div class="p-4 text-gray-500 text-center">No shops found</div>';
                return;
            }

            DOM.shopsList.innerHTML = createShopsTable(shops);
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_SHOPS + ': ' + error.message, 'error', 'adminAlertContainer');
        }
    }

    async function loadModerationQueue() {
        try {
            if (!DOM.moderationQueue) return;
            
            const products = await apiRequest(API_ENDPOINTS.ADMIN.MODERATION_QUEUE);

            if (products.length === 0) {
                DOM.moderationQueue.innerHTML = '<div class="p-8 text-center text-gray-500">No products under review</div>';
                return;
            }

            DOM.moderationQueue.innerHTML = products.map(product => createProductCard(product)).join('');
            
            if (typeof window.lazyLoader !== 'undefined') {
                setTimeout(() => window.lazyLoader.observeAll('img[data-src]'), 0);
            }
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_PRODUCTS + ': ' + error.message, 'error', 'adminAlertContainer');
        }
    }

    async function loadRefunds() {
        try {
            const statusFilter = document.getElementById('refundStatusFilter');
            if (!statusFilter || !DOM.refundsList) return;
            
            const status = statusFilter.value;
            const refunds = await apiRequest(`/api/v1/admin/refunds${status ? '?status=' + status : ''}`);

            if (refunds.length === 0) {
                DOM.refundsList.innerHTML = '<div class="p-8 text-center text-gray-500">No refund requests</div>';
                return;
            }

            DOM.refundsList.innerHTML = refunds.map(refund => `
                <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="space-y-3">
                        <div><span class="font-semibold text-gray-700">ID:</span> <span class="text-gray-900">${refund.id}</span></div>
                        <div><span class="font-semibold text-gray-700">Reason:</span> <span class="text-gray-900">${refund.reason}</span></div>
                        <div><span class="font-semibold text-gray-700">Status:</span> <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : refund.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${refund.status}</span></div>
                    </div>
                    ${refund.status === 'pending' ? `
                        <div class="flex gap-3 mt-4">
                            <button onclick="AdminDashboardModule.processRefund(${refund.id}, 'approve')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Approve</button>
                            <button onclick="AdminDashboardModule.processRefund(${refund.id}, 'reject')" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Reject</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_REFUNDS + ': ' + error.message, 'error', 'adminAlertContainer');
        }
    }

    async function loadSettings() {
        try {
            if (!DOM.settingsList) return;
            
            const settings = await apiRequest(API_ENDPOINTS.ADMIN.SETTINGS);

            DOM.settingsList.innerHTML = settings.map(setting => `
                <div class="bg-white border border-gray-200 rounded-lg p-6" id="setting_group_${setting.key}">
                    <label class="block text-sm font-medium text-gray-700 mb-2">${setting.description || setting.key}</label>
                    <div class="flex gap-3">
                        <input type="text" value="${setting.value}" id="setting_${setting.key}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <button onclick="AdminDashboardModule.updateSetting('${setting.key}')" class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Save</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_SETTINGS + ': ' + error.message, 'error', 'adminAlertContainer');
        }
    }

    async function loadDashboard() {
        if (DOM.loginPage) DOM.loginPage.style.display = 'none';
        if (DOM.adminDashboard) DOM.adminDashboard.style.display = 'block';

        try {
            initializeWebSocket();
            const dashboard = await apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD);
            updateDashboardStats(dashboard);
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_DATA + ': ' + error.message, 'error', 'adminAlertContainer');
        }
    }

    async function init() {
        if (!Router.protectPage('admin')) {
            return;
        }
        await loadDashboard();
    }

    return {
        init,

        switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

            event.target.classList.add('active');
            document.getElementById(tab + 'Tab')?.classList.add('active');

            if (tab === 'moderation') loadModerationQueue();
            if (tab === 'refunds') loadRefunds();
            if (tab === 'users') loadUsersList();
            if (tab === 'shops') loadShopsList();
            if (tab === 'settings') loadSettings();
        },

        async moderateProduct(productId, action) {
            try {
                if (action === 'reject') {
                    await apiRequest(`/api/v1/admin/moderation/${productId}/reject`, 'POST', { notes: '' });
                } else {
                    await apiRequest(`/api/v1/admin/moderation/${productId}/approve`, 'POST', { action: 'approve' });
                }
                await loadModerationQueue();
            } catch (error) {
                showAlert(MESSAGES.ERROR.MODERATION_ERROR + ': ' + error.message, 'error', 'adminAlertContainer');
            }
        },

        async processRefund(refundId, action) {
            try {
                await apiRequest(`/api/v1/admin/refunds/${refundId}/process`, 'POST', { action });
                const actionText = action === 'approve' ? 'approved' : 'rejected';
                showAlert(`Refund ${actionText}`, 'success', 'adminAlertContainer');
                await loadRefunds();
            } catch (error) {
                showAlert(MESSAGES.ERROR.PROCESSING_REFUND + ': ' + error.message, 'error', 'adminAlertContainer');
            }
        },

        async updateSetting(key) {
            try {
                const value = document.getElementById(`setting_${key}`)?.value;
                await apiRequest(`/api/v1/admin/settings/${key}`, 'PUT', { key, value });
            } catch (error) {
                showAlert(MESSAGES.ERROR.UPDATING_SETTINGS + ': ' + error.message, 'error', 'adminAlertContainer');
            }
        },

        loginWithGoogle() {
            try {
                const params = new URLSearchParams({
                    account_type: 'user',
                    platform: 'web'
                });
                const response = fetch(`${API_URL}/api/v1/auth/google/url?${params.toString()}`);
                response.then(r => r.json()).then(data => {
                    localStorage.setItem('requestedAccountType', 'user');
                    window.location.href = data.authorization_url;
                });
            } catch (error) {
                alert('Error getting authorization URL: ' + error.message);
            }
        }
    };
})();

window.AdminDashboardModule = AdminDashboardModule;
window.switchAdminTab = (tab) => AdminDashboardModule.switchTab(tab);
window.moderateProduct = (id, action) => AdminDashboardModule.moderateProduct(id, action);
window.processRefund = (id, action) => AdminDashboardModule.processRefund(id, action);
window.updateSetting = (key) => AdminDashboardModule.updateSetting(key);
window.loginWithGoogle = () => AdminDashboardModule.loginWithGoogle();

window.onload = () => AdminDashboardModule.init();
