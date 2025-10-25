const AdminProductsModule = (function() {
    if (!localStorage.getItem('platform')) {
        localStorage.setItem('platform', 'web');
    }

    let state = {
        currentPage: 1,
        itemsPerPage: APP_CONSTANTS.PAGINATION.ITEMS_PER_PAGE,
        allProducts: [],
        currentFilter: APP_CONSTANTS.PRODUCT.STATUS.PENDING,
        searchQuery: '',
        sortBy: 'newest'
    };

    const DOM = {
        get totalProducts() { return document.getElementById('totalProducts'); },
        get pendingModeration() { return document.getElementById('pendingModeration'); },
        get approvedProducts() { return document.getElementById('approvedProducts'); },
        get rejectedProducts() { return document.getElementById('rejectedProducts'); },
        get moderationQueue() { return document.getElementById('moderationQueue'); },
        get paginationContainer() { return document.getElementById('paginationContainer'); },
        get pageInfo() { return document.getElementById('pageInfo'); },
        get prevPageBtn() { return document.getElementById('prevPageBtn'); },
        get nextPageBtn() { return document.getElementById('nextPageBtn'); },
        get searchInput() { return document.getElementById('searchInput'); },
        get sortSelect() { return document.getElementById('sortSelect'); }
    };

    const FILTER_BUTTONS = {
        all: 'filterAll',
        pending: 'filterPending',
        approved: 'filterApproved',
        rejected: 'filterRejected'
    };

    const STATUS_CONFIG = {
        approved: {
            class: 'product-status-approved',
            text: 'Approved',
            icon: 'fa-check-circle',
            badge: '✓ Product approved'
        },
        rejected: {
            class: 'product-status-rejected',
            text: 'Rejected',
            icon: 'fa-times-circle',
            badge: '✗ Product rejected'
        },
        pending: {
            class: 'product-status-pending',
            text: 'Under review',
            icon: 'fa-clock',
            badge: 'Pending review'
        }
    };

    function initializeWebSocket() {
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'moderation.queue_updated': () => { loadModerationQueue(); },
                'product.created': () => { loadModerationQueue(); loadProductsStats(); },
                'product.updated': () => { loadModerationQueue(); loadProductsStats(); },
                'product.approved': () => { loadModerationQueue(); loadProductsStats(); },
                'product.rejected': () => { loadModerationQueue(); loadProductsStats(); }
            });
        }
    }

    function updateStatsDisplay(dashboard) {
        if (DOM.totalProducts) {
            DOM.totalProducts.textContent = dashboard.total_products;
        }
        if (DOM.pendingModeration) {
            DOM.pendingModeration.textContent = dashboard.pending_moderation;
        }
        if (DOM.approvedProducts) {
            DOM.approvedProducts.textContent = Math.max(0, dashboard.total_products - dashboard.pending_moderation);
        }
        if (DOM.rejectedProducts) {
            DOM.rejectedProducts.textContent = '0';
        }
    }

    function updateFilterButtons() {
        Object.values(FILTER_BUTTONS).forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.classList.remove('bg-purple-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });
        
        const activeBtn = document.getElementById(FILTER_BUTTONS[state.currentFilter]);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
            activeBtn.classList.add('bg-purple-600', 'text-white');
        }
    }

    function applyProductsFilter(products) {
        return state.currentFilter === 'all' 
            ? products 
            : products.filter(p => p.moderation_status === state.currentFilter);
    }

    function applySearchFilter(products) {
        if (!state.searchQuery.trim()) return products;
        
        const query = state.searchQuery.toLowerCase();
        return products.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.shop_name && p.shop_name.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }

    function applySorting(products) {
        return [...products].sort((a, b) => {
            switch(state.sortBy) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'price_low':
                    return (a.price || 0) - (b.price || 0);
                case 'price_high':
                    return (b.price || 0) - (a.price || 0);
                case 'name_az':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name_za':
                    return (b.name || '').localeCompare(a.name || '');
                default:
                    return 0;
            }
        });
    }

    function createProductCard(product) {
        const imageUrl = product.images && product.images.length > 0 ? formatImageUrl(product.images[0]) : null;
        const config = STATUS_CONFIG[product.moderation_status] || STATUS_CONFIG.pending;
        const actionButtons = createActionButtons(product);

        return `
            <div class="product-card">
                <div class="product-image-container">
                    <div class="product-status ${config.class}">
                        <i class="fas ${config.icon} mr-1"></i>${config.text}
                    </div>
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=&quot;product-image-placeholder&quot;><i class=&quot;fas fa-image&quot;></i></div>'">` : 
                        '<div class="product-image-placeholder"><i class="fas fa-image"></i></div>'
                    }
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${product.name || 'Untitled'}</h3>
                    <p class="product-description">${product.description || 'No description'}</p>
                    <div class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-store mr-1"></i>${product.shop_name || 'Unknown'}
                    </div>
                    <div class="mt-auto">
                        <div class="product-price">₸${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    </div>
                </div>
                
                <div class="product-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }

    function createActionButtons(product) {
        if (product.moderation_status === 'pending') {
            return `
                <button class="product-action-btn product-action-btn-primary" onclick="AdminProductsModule.moderateProduct(${product.id}, 'approve')" style="background: #10b981;">
                    <i class="fas fa-check mr-1"></i>Approve
                </button>
                <button class="product-action-btn product-action-btn-danger" onclick="AdminProductsModule.moderateProduct(${product.id}, 'reject')">
                    <i class="fas fa-times mr-1"></i>Reject
                </button>
            `;
        }
        
        const config = STATUS_CONFIG[product.moderation_status] || STATUS_CONFIG.pending;
        return `
            <div class="text-center text-xs text-gray-500 py-2 w-full">
                ${config.badge}
            </div>
        `;
    }

    function updatePagination(totalPages, filteredCount) {
        if (!DOM.paginationContainer) return;

        if (totalPages > 1) {
            DOM.paginationContainer.style.display = 'flex';
            if (DOM.pageInfo) {
                DOM.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages} (${filteredCount} products)`;
            }
            if (DOM.prevPageBtn) {
                DOM.prevPageBtn.disabled = state.currentPage === 1;
            }
            if (DOM.nextPageBtn) {
                DOM.nextPageBtn.disabled = state.currentPage === totalPages;
            }
        } else {
            DOM.paginationContainer.style.display = 'none';
        }
    }

    async function loadProductsStats() {
        try {
            const dashboard = await apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD);
            updateStatsDisplay(dashboard);
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_STATS + ': ' + error.message, 'error');
        }
    }

    async function loadModerationQueue() {
        try {
            const response = await apiRequest(API_ENDPOINTS.ADMIN.PRODUCTS_ALL);
            state.allProducts = response.products || response || [];
            
            if (!DOM.moderationQueue) return;

            if (state.allProducts.length === 0) {
                DOM.moderationQueue.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><i class="fas fa-box-open text-5xl mb-4 opacity-50"></i><p class="text-lg">No products</p></div>';
                if (DOM.paginationContainer) {
                    DOM.paginationContainer.style.display = 'none';
                }
                return;
            }

            renderProductsPage();
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_PRODUCTS + ': ' + error.message, 'error');
        }
    }

    function renderProductsPage() {
        if (!DOM.moderationQueue) return;
        
        let filteredProducts = applyProductsFilter(state.allProducts);
        filteredProducts = applySearchFilter(filteredProducts);
        filteredProducts = applySorting(filteredProducts);
        
        updateFilterButtons();
        
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const productsToShow = filteredProducts.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredProducts.length / state.itemsPerPage);

        if (productsToShow.length === 0) {
            const message = state.searchQuery.trim() 
                ? `No products found for "${state.searchQuery}"` 
                : 'No products with selected status';
            DOM.moderationQueue.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500"><i class="fas fa-search text-5xl mb-4 opacity-50"></i><p class="text-lg">${message}</p></div>`;
            if (DOM.paginationContainer) {
                DOM.paginationContainer.style.display = 'none';
            }
            return;
        }

        DOM.moderationQueue.innerHTML = productsToShow.map(product => createProductCard(product)).join('');

        if (typeof window.lazyLoader !== 'undefined') {
            setTimeout(() => window.lazyLoader.observeAll('img[data-src]'), 0);
        }

        updatePagination(totalPages, filteredProducts.length);
    }

    async function init() {
        try {
            initializeWebSocket();
            await loadProductsStats();
            await loadModerationQueue();
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_DATA + ': ' + error.message, 'error');
        }
    }

    return {
        init,
        
        changePage(direction) {
            state.currentPage += direction;
            renderProductsPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        filterByStatus(status) {
            state.currentFilter = status;
            state.currentPage = 1;
            renderProductsPage();
        },

        handleSearch() {
            state.searchQuery = DOM.searchInput?.value || '';
            state.currentPage = 1;
            renderProductsPage();
        },

        handleSort() {
            state.sortBy = DOM.sortSelect?.value || 'newest';
            state.currentPage = 1;
            renderProductsPage();
        },

        async moderateProduct(productId, action) {
            try {
                if (action === 'reject') {
                    await apiRequest(`/api/v1/admin/moderation/${productId}/reject`, 'POST', { notes: '' });
                } else {
                    await apiRequest(`/api/v1/admin/moderation/${productId}/approve`, 'POST', { action: 'approve' });
                }
                
                const productIndex = state.allProducts.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    state.allProducts[productIndex].moderation_status = action === 'approve' ? 'approved' : 'rejected';
                    renderProductsPage();
                }
                
                await loadProductsStats();
            } catch (error) {
                showAlert(MESSAGES.ERROR.MODERATION_ERROR + ': ' + error.message, 'error');
            }
        }
    };
})();

window.AdminProductsModule = AdminProductsModule;
window.moderateProduct = (id, action) => AdminProductsModule.moderateProduct(id, action);
window.changePage = (direction) => AdminProductsModule.changePage(direction);
window.filterByStatus = (status) => AdminProductsModule.filterByStatus(status);
window.handleSearch = () => AdminProductsModule.handleSearch();
window.handleSort = () => AdminProductsModule.handleSort();

AdminProductsModule.init();
