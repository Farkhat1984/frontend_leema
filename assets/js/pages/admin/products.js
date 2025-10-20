// Инициализировать platform перед любыми запросами
if (!localStorage.getItem('platform')) {
    localStorage.setItem('platform', 'web');
}

let currentPage = 1;
const itemsPerPage = 12;
let allProducts = [];
let currentFilter = 'pending';
let searchQuery = '';
let sortBy = 'newest';

async function loadPageData() {
    try {
        // Initialize WebSocket for admin
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'moderation.queue_updated': () => { loadModerationQueue(); },
                'product.created': () => { loadModerationQueue(); loadProductsStats(); },
                'product.updated': () => { loadModerationQueue(); loadProductsStats(); },
                'product.approved': () => { loadModerationQueue(); loadProductsStats(); },
                'product.rejected': () => { loadModerationQueue(); loadProductsStats(); }
            });
        }
        
        await loadProductsStats();
        await loadModerationQueue();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadProductsStats() {
    try {
        const dashboard = await apiRequest('/api/v1/admin/dashboard');
        const totalProductsEl = document.getElementById('totalProducts');
        const pendingModerationEl = document.getElementById('pendingModeration');
        const approvedProductsEl = document.getElementById('approvedProducts');
        const rejectedProductsEl = document.getElementById('rejectedProducts');
        if (totalProductsEl) totalProductsEl.textContent = dashboard.total_products;
        if (pendingModerationEl) pendingModerationEl.textContent = dashboard.pending_moderation;
        

        if (approvedProductsEl) approvedProductsEl.textContent = Math.max(0, dashboard.total_products - dashboard.pending_moderation);
        if (rejectedProductsEl) rejectedProductsEl.textContent = '0';
    } catch (error) {
    }
}

async function loadModerationQueue() {
    try {

        const response = await apiRequest('/api/v1/admin/products/all');

        allProducts = response.products || response || [];
        const container = document.getElementById('moderationQueue');

        if (allProducts.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><i class="fas fa-box-open text-5xl mb-4 opacity-50"></i><p class="text-lg">Нет товаров</p></div>';
            document.getElementById('paginationContainer').style.display = 'none';
            return;
        }

        renderProductsPage();
    } catch (error) {
        showAlert('Ошибка загрузки товаров: ' + error.message, 'error');
    }
}

function renderProductsPage() {
    const container = document.getElementById('moderationQueue');
    

    let filteredProducts = currentFilter === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.moderation_status === currentFilter);
    

    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.shop_name && p.shop_name.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }
    

    filteredProducts = [...filteredProducts].sort((a, b) => {
        switch(sortBy) {
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
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    ['filterAll', 'filterPending', 'filterApproved', 'filterRejected'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('bg-purple-600', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        }
    });
    const activeFilterMap = {
        'all': 'filterAll',
        'pending': 'filterPending',
        'approved': 'filterApproved',
        'rejected': 'filterRejected'
    };
    const activeBtn = document.getElementById(activeFilterMap[currentFilter]);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
        activeBtn.classList.add('bg-purple-600', 'text-white');
    }

    if (productsToShow.length === 0) {
        const message = searchQuery.trim() 
            ? `Не найдено товаров по запросу "${searchQuery}"` 
            : 'Нет товаров с выбранным статусом';
        container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500"><i class="fas fa-search text-5xl mb-4 opacity-50"></i><p class="text-lg">${message}</p></div>`;
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }

    container.innerHTML = productsToShow.map(product => {
        const imageUrl = product.images && product.images.length > 0 ? formatImageUrl(product.images[0]) : null;
        const createdDate = new Date(product.created_at).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col" style="max-height: 280px; max-width: 80%;">
                <!-- Секция 1: Изображение -->
                <div class="relative w-full bg-gray-100 overflow-hidden flex items-center justify-center" style="height: 120px;">
                    ${imageUrl
                ? `<img data-src="${imageUrl}" alt="${product.name}" loading="lazy" class="w-full h-full object-contain" onerror="this.parentElement.innerHTML='<div class=&quot;flex items-center justify-center h-full text-gray-400&quot;><i class=&quot;fas fa-image text-2xl&quot;></i></div>'">`
                : '<div class="flex items-center justify-center h-full text-gray-400"><i class="fas fa-image text-2xl"></i></div>'}
                </div>
                
                <!-- Секция 2: Информация о товаре -->
                <div class="p-2 space-y-1 flex-1 flex flex-col" style="min-height: 0;">
                    <h3 class="text-xs font-semibold text-gray-900 line-clamp-1">${product.name || 'Без названия'}</h3>
                    
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">Цена</span>
                        <div class="text-sm font-bold text-purple-600">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    </div>
                    
                    <div class="flex-1 overflow-hidden">
                        <div class="text-xs text-gray-700 line-clamp-1">
                            ${product.description || 'Нет описания'}
                        </div>
                        
                        <div class="text-xs text-gray-500 truncate">
                            ${product.shop_name || 'Неизвестно'}
                        </div>
                    </div>
                </div>
                
                <!-- Секция 3: Статус -->
                <div class="px-2 pb-1">
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        product.moderation_status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : product.moderation_status === 'rejected' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                    }">
                        <i class="fas ${
                            product.moderation_status === 'approved' 
                                ? 'fa-check-circle' 
                                : product.moderation_status === 'rejected' 
                                ? 'fa-times-circle' 
                                : 'fa-clock'
                        } mr-1"></i>
                        ${product.moderation_status === 'approved' ? 'Одобрен' : product.moderation_status === 'rejected' ? 'Отклонен' : 'На модерации'}
                    </span>
                </div>
                
                <!-- Секция 4: Действия -->
                <div class="px-2 pb-2 flex gap-1">
                    ${product.moderation_status === 'pending' ? `
                        <button class="flex-1 px-1.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium text-xs" onclick="moderateProduct(${product.id}, 'approve')">
                            <i class="fas fa-check mr-1"></i>Одобрить
                        </button>
                        <button class="flex-1 px-1.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-medium text-xs" onclick="moderateProduct(${product.id}, 'reject')">
                            <i class="fas fa-times mr-1"></i>Отклонить
                        </button>
                    ` : `
                        <div class="w-full text-center text-xs text-gray-500 py-1">
                            ${product.moderation_status === 'approved' ? '✓ Товар одобрен' : '✗ Товар отклонен'}
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');

    if (typeof window.lazyLoader !== 'undefined') {
        setTimeout(() => window.lazyLoader.observeAll('img[data-src]'), 0);
    }

    if (totalPages > 1) {
        document.getElementById('paginationContainer').style.display = 'flex';
        const pageInfoEl = document.getElementById('pageInfo');
        if (pageInfoEl) pageInfoEl.textContent = `Страница ${currentPage} из ${totalPages} (${filteredProducts.length} товаров)`;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
    } else {
        document.getElementById('paginationContainer').style.display = 'none';
    }
}

function changePage(direction) {
    currentPage += direction;
    renderProductsPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterByStatus(status) {
    currentFilter = status;
    currentPage = 1;
    renderProductsPage();
}

function handleSearch() {
    searchQuery = document.getElementById('searchInput').value;
    currentPage = 1;
    renderProductsPage();
}

function handleSort() {
    sortBy = document.getElementById('sortSelect').value;
    currentPage = 1;
    renderProductsPage();
}

async function moderateProduct(productId, action) {
    try {
        const endpoint = action === 'approve'
            ? `/api/v1/admin/moderation/${productId}/approve`
            : `/api/v1/admin/moderation/${productId}/reject`;

        await apiRequest(endpoint, 'POST', { action });
        showAlert(`Товар успешно ${action === 'approve' ? 'одобрен' : 'отклонен'}`, 'success');
        

        const productIndex = allProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            allProducts[productIndex].moderation_status = action === 'approve' ? 'approved' : 'rejected';
            renderProductsPage();
        }
        

        await loadProductsStats();
    } catch (error) {
        showAlert('Ошибка модерации: ' + error.message, 'error');
    }
}

function onModerationUpdate(data) {
    if (data.data && data.data.pending_count !== undefined) {
        const pendingModerationEl = document.getElementById('pendingModeration');
        if (pendingModerationEl) pendingModerationEl.textContent = data.data.pending_count;
    }
    loadModerationQueue();
}

function onProductUpdate(data) {
    loadProductsStats();
    loadModerationQueue();
}

window.moderateProduct = moderateProduct;
window.changePage = changePage;
window.filterByStatus = filterByStatus;
window.handleSearch = handleSearch;
window.handleSort = handleSort;

// Автоматическая загрузка данных при инициализации страницы
loadPageData();
