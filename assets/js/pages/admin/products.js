// Страница управления товарами
console.log('admin-products.js loaded');

// Переменные для пагинации
let currentPage = 1;
const itemsPerPage = 12;
let allProducts = [];
let currentFilter = 'pending'; // По умолчанию показываем только товары на модерации

async function loadPageData() {
    try {
        await loadProductsStats();
        await loadModerationQueue();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadProductsStats() {
    try {
        const dashboard = await apiRequest('/api/v1/admin/dashboard');
        document.getElementById('totalProducts').textContent = dashboard.total_products;
        document.getElementById('pendingModeration').textContent = dashboard.pending_moderation;
        
        // Approximations for approved/rejected (можно добавить эти данные в API)
        document.getElementById('approvedProducts').textContent = Math.max(0, dashboard.total_products - dashboard.pending_moderation);
        document.getElementById('rejectedProducts').textContent = '0';
    } catch (error) {
        console.error('Error loading products stats:', error);
    }
}

async function loadModerationQueue() {
    try {
        // Загружаем все товары, не только pending
        const products = await apiRequest('/api/v1/admin/products');
        allProducts = products;
        const container = document.getElementById('moderationQueue');

        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет товаров</p></div>';
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
    
    // Фильтруем товары по статусу
    const filteredProducts = currentFilter === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.status === currentFilter);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Обновляем активную кнопку фильтра
    ['filterAll', 'filterPending', 'filterApproved', 'filterRejected'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
    const activeFilterMap = {
        'all': 'filterAll',
        'pending': 'filterPending',
        'approved': 'filterApproved',
        'rejected': 'filterRejected'
    };
    const activeBtn = document.getElementById(activeFilterMap[currentFilter]);
    if (activeBtn) activeBtn.classList.add('active');

    if (productsToShow.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Нет товаров с выбранным статусом</p></div>';
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
            <div class="product-card">
                <!-- Секция 1: Изображение -->
                <div class="product-image">
                    ${imageUrl
                ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div style=&quot;color: #999; padding: 40px; text-align: center;&quot;>Ошибка загрузки</div>'">`
                : '<div style="color: #999; padding: 40px; text-align: center;">Нет изображения</div>'}
                </div>
                
                <!-- Секция 2: Информация о товаре -->
                <div class="product-info">
                    <div class="product-header">
                        <div class="product-name">${product.name || 'Без названия'}</div>
                    </div>
                    
                    <div class="product-price-container">
                        <span class="product-price-label">Цена</span>
                        <div class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    </div>
                    
                    <div class="product-details">
                        <div class="product-detail-row">
                            <span class="product-detail-label">Описание</span>
                            <div class="product-detail-value product-description">
                                ${product.description || 'Нет описания'}
                            </div>
                        </div>
                        
                        <div class="product-detail-row">
                            <span class="product-detail-label">Магазин</span>
                            <div class="product-detail-value product-shop-name">
                                ${product.shop_name || 'Неизвестно'}
                            </div>
                        </div>
                        
                        <div class="product-detail-row">
                            <span class="product-detail-label">Дата добавления</span>
                            <div class="product-detail-value product-date">
                                ${createdDate}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Секция 3: Статус -->
                <div class="product-status-section">
                    <span class="product-status ${product.status === 'approved' ? 'status-approved' : product.status === 'rejected' ? 'status-rejected' : 'status-pending'}">
                        ${product.status === 'approved' ? 'Одобрен' : product.status === 'rejected' ? 'Отклонен' : 'На рассмотрении'}
                    </span>
                </div>
                
                <!-- Секция 4: Действия -->
                <div class="product-actions">
                    ${product.status === 'pending' ? `
                        <button class="btn btn-success" onclick="moderateProduct(${product.id}, 'approve')">
                            Одобрить
                        </button>
                        <button class="btn btn-danger" onclick="moderateProduct(${product.id}, 'reject')">
                            Отклонить
                        </button>
                    ` : `
                        <div style="color: #666; font-size: 14px; text-align: center;">
                            ${product.status === 'approved' ? 'Товар одобрен' : 'Товар отклонен'}
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');

    // Обновляем пагинацию
    if (totalPages > 1) {
        document.getElementById('paginationContainer').style.display = 'flex';
        document.getElementById('pageInfo').textContent = `Страница ${currentPage} из ${totalPages} (${filteredProducts.length} товаров)`;
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
    currentPage = 1; // Сбрасываем на первую страницу при смене фильтра
    renderProductsPage();
}

async function moderateProduct(productId, action) {
    try {
        let notes = null;

        if (action === 'reject') {
            notes = prompt('Укажите причину отклонения товара:');
            if (!notes || notes.trim().length === 0) {
                showAlert('Необходимо указать причину отклонения', 'error');
                return;
            }
        }

        const endpoint = action === 'approve'
            ? `/api/v1/admin/moderation/${productId}/approve`
            : `/api/v1/admin/moderation/${productId}/reject`;

        await apiRequest(endpoint, 'POST', { action, notes });
        showAlert(`Товар успешно ${action === 'approve' ? 'одобрен' : 'отклонен'}`, 'success');
        
        // Обновляем статус товара на странице без перезагрузки всего списка
        const productIndex = allProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            allProducts[productIndex].status = action === 'approve' ? 'approved' : 'rejected';
            renderProductsPage();
        }
        
        // Обновляем статистику
        await loadProductsStats();
    } catch (error) {
        showAlert('Ошибка модерации: ' + error.message, 'error');
    }
}

// WebSocket handlers
function onModerationUpdate(data) {
    if (data.data && data.data.pending_count !== undefined) {
        document.getElementById('pendingModeration').textContent = data.data.pending_count;
    }
    loadModerationQueue();
}

function onProductUpdate(data) {
    loadProductsStats();
    loadModerationQueue();
}

// Make functions globally accessible
window.moderateProduct = moderateProduct;
window.changePage = changePage;
window.filterByStatus = filterByStatus;
