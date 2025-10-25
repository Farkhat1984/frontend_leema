const AdminShopsModule = (function() {
    if (!localStorage.getItem('platform')) {
        localStorage.setItem('platform', 'web');
    }

    let state = {
        currentFilter: 'all'
    };

    const DOM = {
        get totalShops() { return document.getElementById('totalShops'); },
        get totalShopBalance() { return document.getElementById('totalShopBalance'); },
        get activeShops() { return document.getElementById('activeShops'); },
        get pendingShops() { return document.getElementById('pendingShops'); },
        get shopsList() { return document.getElementById('shopsList'); }
    };

    const FILTER_BUTTONS = {
        all: 'filterAll',
        pending: 'filterPending',
        approved: 'filterApproved',
        active: 'filterActive'
    };

    const BUTTON_CLASSES = {
        active: 'px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white',
        inactive: 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300'
    };

    function initializeWebSocket() {
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'balance.updated': () => {
                    loadShopsStats();
                    loadShopsList();
                },
                'transaction.completed': () => {
                    loadShopsStats();
                    loadShopsList();
                }
            });
        }
    }

    function updateStatsDisplay(dashboard, shops) {
        if (DOM.totalShops) {
            DOM.totalShops.textContent = dashboard.total_shops;
        }
        if (DOM.totalShopBalance) {
            DOM.totalShopBalance.textContent = `$${dashboard.total_shop_balances.toFixed(2)}`;
        }
        
        const activeCount = shops.filter(s => s.is_active && s.is_approved).length;
        const pendingCount = shops.filter(s => !s.is_approved).length;
        
        if (DOM.activeShops) {
            DOM.activeShops.textContent = activeCount;
        }
        if (DOM.pendingShops) {
            DOM.pendingShops.textContent = pendingCount;
        }
    }

    function updateFilterButtons(filter) {
        Object.entries(FILTER_BUTTONS).forEach(([filterType, btnId]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.className = filterType === filter 
                    ? BUTTON_CLASSES.active 
                    : BUTTON_CLASSES.inactive;
            }
        });
    }

    function applyShopsFilter(shops, filter) {
        switch (filter) {
            case 'pending':
                return shops.filter(s => !s.is_approved);
            case 'approved':
                return shops.filter(s => s.is_approved);
            case 'active':
                return shops.filter(s => s.is_active && s.is_approved);
            default:
                return shops;
        }
    }

    function createStatusBadge(shop) {
        const approvalStatus = shop.is_approved 
            ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Approved</span>'
            : '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Pending</span>';
        
        const activeStatus = shop.is_active
            ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Active</span>'
            : '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">Inactive</span>';
        
        return { approvalStatus, activeStatus };
    }

    function createActionButtons(shop) {
        if (!shop.is_approved) {
            return `
                <button onclick="AdminShopsModule.approveShop(${shop.id})" 
                    class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors">
                    <i class="fas fa-check mr-1"></i>Approve
                </button>
                <button onclick="AdminShopsModule.rejectShop(${shop.id})" 
                    class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors">
                    <i class="fas fa-times mr-1"></i>Reject
                </button>
            `;
        }
        
        return `
            <button onclick="AdminShopsModule.toggleShopStatus(${shop.id}, ${shop.is_active})" 
                class="px-3 py-1 ${shop.is_active ? 'bg-gray-600' : 'bg-blue-600'} text-white rounded hover:opacity-80 text-sm transition-colors">
                <i class="fas fa-${shop.is_active ? 'ban' : 'check'} mr-1"></i>
                ${shop.is_active ? 'Deactivate' : 'Activate'}
            </button>
        `;
    }

    function createShopRow(shop) {
        const date = new Date(shop.created_at).toLocaleDateString('en-US');
        const { approvalStatus, activeStatus } = createStatusBadge(shop);
        const actionButtons = createActionButtons(shop);
        
        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                    <div class="font-semibold text-gray-900">${shop.shop_name}</div>
                    <div class="text-xs text-gray-500">${date}</div>
                </td>
                <td class="px-4 py-3 text-gray-600">${shop.email}</td>
                <td class="px-4 py-3 text-right">
                    <span class="font-semibold text-green-600">$${shop.balance.toFixed(2)}</span>
                </td>
                <td class="px-4 py-3 text-center">${approvalStatus}</td>
                <td class="px-4 py-3 text-center">${activeStatus}</td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }

    function createShopsTable(shops) {
        return `
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="border-b-2 border-gray-200 bg-gray-50">
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Balance</th>
                            <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Approval Status</th>
                            <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Activity</th>
                            <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shops.map(shop => createShopRow(shop)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function loadShopsStats() {
        try {
            const dashboard = await apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD);
            const response = await apiRequest(API_ENDPOINTS.ADMIN.SHOPS_ALL);
            const shops = response.shops || [];
            
            updateStatsDisplay(dashboard, shops);
        } catch (error) {
            CommonUtils.logError('loadShopsStats', error);
        }
    }

    async function loadShopsList() {
        try {
            const response = await apiRequest(API_ENDPOINTS.ADMIN.SHOPS_ALL);
            let shops = response.shops || [];
            
            if (!DOM.shopsList) return;

            shops = applyShopsFilter(shops, state.currentFilter);

            if (shops.length === 0) {
                DOM.shopsList.innerHTML = '<p class="text-center text-gray-500 py-8">No shops found</p>';
                return;
            }

            DOM.shopsList.innerHTML = createShopsTable(shops);
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_SHOPS + ': ' + error.message, 'error');
        }
    }

    async function init() {
        try {
            initializeWebSocket();
            await loadShopsStats();
            await loadShopsList();
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_DATA + ': ' + error.message, 'error');
        }
    }

    return {
        init,
        
        filterShops(filter) {
            state.currentFilter = filter;
            updateFilterButtons(filter);
            loadShopsList();
        },

        async approveShop(shopId) {
            if (!confirm(MESSAGES.CONFIRMATION.APPROVE_SHOP)) {
                return;
            }
            
            try {
                await apiRequest(`/api/v1/admin/shops/${shopId}/approve`, 'POST', 
                    { notes: 'Approved by administrator' }
                );
                
                showAlert('Shop approved successfully', 'success');
                await loadShopsStats();
                await loadShopsList();
            } catch (error) {
                showAlert(MESSAGES.ERROR.APPROVING_SHOP + ': ' + error.message, 'error');
            }
        },

        async rejectShop(shopId) {
            const reason = prompt('Enter rejection reason (minimum 10 characters):');
            if (!reason || reason.length < 10) {
                showAlert('Rejection reason must be at least 10 characters', 'error');
                return;
            }
            
            try {
                await apiRequest(`/api/v1/admin/shops/${shopId}/reject`, 'POST', 
                    JSON.stringify({ reason })
                );
                
                showAlert('Shop rejected', 'success');
                await loadShopsStats();
                await loadShopsList();
            } catch (error) {
                showAlert(MESSAGES.ERROR.REJECTING_SHOP + ': ' + error.message, 'error');
            }
        },

        async toggleShopStatus(shopId, currentStatus) {
            const action = currentStatus ? 'block' : 'activate';
            const actionText = currentStatus ? 'deactivated' : 'activated';
            
            if (!confirm(MESSAGES.CONFIRMATION.CHANGE_SHOP_STATUS(action))) {
                return;
            }
            
            try {
                await apiRequest(API_ENDPOINTS.ADMIN.SHOPS_BULK_ACTION, 'POST',
                    JSON.stringify({
                        shop_ids: [shopId],
                        action: currentStatus ? 'block' : 'approve'
                    })
                );
                
                showAlert(`Shop ${actionText} successfully`, 'success');
                await loadShopsStats();
                await loadShopsList();
            } catch (error) {
                showAlert(MESSAGES.ERROR.CHANGING_SHOP_STATUS + ': ' + error.message, 'error');
            }
        }
    };
})();

window.AdminShopsModule = AdminShopsModule;
AdminShopsModule.init();
