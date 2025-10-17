// Инициализировать platform перед любыми запросами
if (!localStorage.getItem('platform')) {
    localStorage.setItem('platform', 'web');
}

let token = localStorage.getItem('token');
let accountType = localStorage.getItem('accountType');


let shopCurrentPage = 1;
const shopItemsPerPage = 12;
let shopAllProducts = [];
let shopSearchQuery = '';
let shopSortBy = 'newest';
let shopStatusFilter = 'all';


window.onload = async function () {

    if (token && accountType) {
        if (accountType === 'shop') {
            await loadShopDashboard();
        } else if (accountType === 'admin') {
            window.location.href = `${window.location.origin}/admin/index.html`;
        } else if (accountType === 'user') {
            window.location.href = `${window.location.origin}/user/dashboard.html`;
        } else {
            window.location.href = `${window.location.origin}/public/index.html`;
        }
    } else {
        window.location.href = `${window.location.origin}/public/index.html`;
    }
};


async function loginWithGoogle(accountType = 'user') {
    try {

        const params = new URLSearchParams({
            account_type: accountType,
            platform: 'web'
        });

        const response = await fetch(`${API_URL}/api/v1/auth/google/url?${params.toString()}`);
        const data = await response.json();


        localStorage.setItem('requestedAccountType', accountType);
        window.location.href = data.authorization_url;
    } catch (error) {
        alert('Ошибка при получении URL авторизации: ' + error.message);
    }
}

function formatImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
        const fullUrl = `${API_URL}${imageUrl}`;
        return fullUrl;
    }

    const fullUrl = `${API_URL}/${imageUrl}`;
    return fullUrl;
}




async function loadShopDashboard() {

    if (window.location.pathname.includes('/admin/')) {
        window.location.href = `${window.location.origin}/public/index.html`;
        return;
    }
    

    const dashboardEl = document.getElementById('shopDashboard');
    if (dashboardEl) {
        dashboardEl.style.display = 'block';
    }

    try {

        CommonUtils.initWebSocket('shop', {
            'product.created': loadShopProducts,
            'product.updated': loadShopProducts,
            'product.deleted': loadShopProducts,
            'product.approved': () => { loadShopProducts(); loadShopDashboard(); },
            'product.rejected': loadShopProducts,
            'balance.updated': (data) => {
                const balanceElement = document.getElementById('shopBalance');
                if (balanceElement && data.data && data.data.new_balance !== undefined) {
                    balanceElement.textContent = `$${data.data.new_balance.toFixed(2)}`;
                }
                loadShopTransactions();
            },
            'transaction.completed': loadShopTransactions,
            'order.completed': loadShopDashboard
        });
        

        const shopInfo = await apiRequest('/api/v1/shops/me');
        document.getElementById('shopName').textContent = shopInfo.shop_name;
        document.getElementById('shopAvatar').textContent = shopInfo.shop_name[0].toUpperCase();


        const profileShopNameEl = document.getElementById('profileShopName');
        const profileEmailEl = document.getElementById('profileEmail');
        const profileDescriptionEl = document.getElementById('profileDescription');
        if (profileShopNameEl) profileShopNameEl.value = shopInfo.shop_name;
        if (profileEmailEl) profileEmailEl.value = shopInfo.email;
        if (profileDescriptionEl) profileDescriptionEl.value = shopInfo.description || '';


        const analytics = await apiRequest('/api/v1/shops/me/analytics');
        document.getElementById('totalProducts').textContent = analytics.total_products;
        document.getElementById('activeProducts').textContent = analytics.active_products;
        document.getElementById('totalViews').textContent = analytics.total_views;
        document.getElementById('totalTryOns').textContent = analytics.total_try_ons;


        const shopBalanceEl = document.getElementById('shopBalance');
        const shopTotalEarningsEl = document.getElementById('shopTotalEarnings');
        if (shopBalanceEl) shopBalanceEl.textContent = `$${shopInfo.balance.toFixed(2)}`;
        if (shopTotalEarningsEl) shopTotalEarningsEl.textContent = `$${analytics.total_revenue || 0}`;


        await loadShopTransactions();


        await loadActiveRents();


        await loadShopProducts();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadShopProducts() {


    const container = document.getElementById('productsList');
    if (!container) {
        return;
    }

    try {
        const products = await apiRequest('/api/v1/shops/me/products');
        
        if (!Array.isArray(products)) {
            shopAllProducts = [];
        } else {
            shopAllProducts = products;
        }
        

        if (shopAllProducts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>У вас пока нет товаров</p></div>';
            const paginationContainer = document.getElementById('shopPaginationContainer');
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            return;
        }

        renderShopProductsPage();
    } catch (error) {
        showAlert('Ошибка загрузки товаров: ' + error.message, 'error');
    }
}

function renderShopProductsPage() {
    const container = document.getElementById('productsList');


    if (!container) {
        return;
    }



    let filteredProducts = [...shopAllProducts];
    

    if (shopStatusFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
            const status = p.moderation_status || p.status || 'pending';
            return status === shopStatusFilter;
        });
    }
    

    if (shopSearchQuery.trim()) {
        const query = shopSearchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }
    

    filteredProducts = [...filteredProducts].sort((a, b) => {
        switch(shopSortBy) {
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

    const startIndex = (shopCurrentPage - 1) * shopItemsPerPage;
    const endIndex = startIndex + shopItemsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredProducts.length / shopItemsPerPage);

    if (productsToShow.length === 0) {
        const message = shopSearchQuery.trim() 
            ? `Не найдено товаров по запросу "${shopSearchQuery}"` 
            : 'У вас пока нет товаров';
        container.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
        const paginationContainer = document.getElementById('shopPaginationContainer');
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }

    container.innerHTML = productsToShow.map(product => {

        let imageUrl = null;
        if (product.images && product.images.length > 0) {
            imageUrl = formatImageUrl(product.images[0]);
        }
        
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
                ? `<img data-src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div style=&quot;color: #999; padding: 40px; text-align: center;&quot;>Ошибка загрузки</div>'">`
                : '<div style="color: #999; padding: 40px; text-align: center;">Нет изображения</div>'}
                </div>
                
                <!-- Секция 2: Информация о товаре -->
                <div class="product-info">
                    <div class="product-detail-row">
                        <span class="product-detail-label">Наименование</span>
                        <div class="product-detail-value product-name">${product.name || 'Без названия'}</div>
                    </div>
                    
                    <div class="product-detail-row">
                        <span class="product-detail-label">Цена</span>
                        <div class="product-detail-value product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    </div>
                    
                    <div class="product-details">
                        <div class="product-detail-row">
                            <span class="product-detail-label">Описание</span>
                            <div class="product-detail-value product-description">
                                ${product.description || 'Нет описания'}
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
                    <span class="product-status ${product.moderation_status === 'approved' ? 'status-approved' : product.moderation_status === 'rejected' ? 'status-rejected' : 'status-pending'}">
                        ${product.moderation_status === 'pending' ? 'На модерации' :
                product.moderation_status === 'approved' ? 'Одобрен' : 'Отклонен'}
                    </span>
                </div>
                
                <!-- Секция 4: Действия -->
                <div class="product-actions">
                    <button class="btn btn-secondary" onclick="openEditProduct(${product.id})">Изменить</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Удалить</button>
                </div>
            </div>
        `;
    }).join('');

    if (typeof window.lazyLoader !== 'undefined') {
        setTimeout(() => window.lazyLoader.observeAll('img[data-src]'), 0);
    }

    const paginationContainer = document.getElementById('shopPaginationContainer');
    if (paginationContainer) {
        if (totalPages > 1) {
            paginationContainer.style.display = 'flex';
            const pageInfo = document.getElementById('shopPageInfo');
            const prevBtn = document.getElementById('shopPrevPageBtn');
            const nextBtn = document.getElementById('shopNextPageBtn');

            if (pageInfo) pageInfo.textContent = `Страница ${shopCurrentPage} из ${totalPages} (${filteredProducts.length} товаров)`;
            if (prevBtn) prevBtn.disabled = shopCurrentPage === 1;
            if (nextBtn) nextBtn.disabled = shopCurrentPage === totalPages;
        } else {
            paginationContainer.style.display = 'none';
        }
    }

}

function changeShopPage(direction) {
    shopCurrentPage += direction;
    renderShopProductsPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updateShopProfile() {
    try {
        const profileShopNameEl = document.getElementById('profileShopName');
        const profileDescriptionEl = document.getElementById('profileDescription');

        if (!profileShopNameEl || !profileDescriptionEl) {
            return;
        }

        const data = {
            shop_name: profileShopNameEl.value,
            description: profileDescriptionEl.value
        };

        await apiRequest('/api/v1/shops/me', 'PUT', data);
        showAlert('Профиль успешно обновлен', 'success');


        const shopInfo = await apiRequest('/api/v1/shops/me');
        document.getElementById('shopName').textContent = shopInfo.shop_name;
        document.getElementById('shopAvatar').textContent = shopInfo.shop_name[0].toUpperCase();
    } catch (error) {
        showAlert('Ошибка обновления профиля: ' + error.message, 'error');
    }
}

function openAddProductModal() {
    document.getElementById('addProductModal').classList.add('active');
}

function closeAddProductModal() {
    document.getElementById('addProductModal').classList.remove('active');
    document.getElementById('productName').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productImages').value = '';
}

async function createProduct() {
    try {
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);

        if (!name || !price) {
            showAlert('Заполните название и цену', 'error');
            return;
        }


        let imageUrls = null;
        const fileInput = document.getElementById('productImages');

        if (fileInput.files.length > 0) {
            const formData = new FormData();
            for (let file of fileInput.files) {
                formData.append('files', file);
            }

            const uploadResponse = await fetch(`${API_URL}/api/v1/products/upload-images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Client-Platform': localStorage.getItem('platform') || 'web'
                },
                body: formData
            });


            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error('Ошибка загрузки изображений: ' + errorText);
            }

            const uploadData = await uploadResponse.json();
            imageUrls = uploadData.urls.join(',');
        }


        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        const description = document.getElementById('productDescription').value;
        if (description) {
            formData.append('description', description);
        }
        if (imageUrls) {
            formData.append('image_urls', imageUrls);
        }


        const response = await fetch(`${API_URL}/api/v1/products/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Client-Platform': localStorage.getItem('platform') || 'web'
            },
            body: formData
        });


        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Ошибка создания товара: ' + errorText);
        }

        const createdProduct = await response.json();

        showAlert('Товар успешно создан и отправлен на модерацию', 'success');
        closeAddProductModal();
        await loadShopProducts();
    } catch (error) {
        showAlert('Ошибка создания товара: ' + error.message, 'error');
    }
}

async function openEditProduct(productId) {
    try {
        const product = await apiRequest(`/api/v1/products/${productId}`);

        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description || '';
        document.getElementById('editProductPrice').value = product.price;


        window.currentProductImages = product.images || [];
        updateCurrentImagesDisplay();

        document.getElementById('editProductModal').classList.add('active');
    } catch (error) {
        showAlert('Ошибка загрузки товара: ' + error.message, 'error');
    }
}

function closeEditProductModal() {
    document.getElementById('editProductModal').classList.remove('active');
}

async function updateProduct() {
    try {
        const productId = document.getElementById('editProductId').value;


        let newImageUrls = [];
        const fileInput = document.getElementById('editProductImages');
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            for (let file of fileInput.files) {
                formData.append('files', file);
            }

            const uploadResponse = await fetch(`${API_URL}/api/v1/products/upload-images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Client-Platform': localStorage.getItem('platform') || 'web'
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Ошибка загрузки изображений');
            }

            const uploadData = await uploadResponse.json();
            newImageUrls = uploadData.urls;
        }


        const allImages = [...(window.currentProductImages || []), ...newImageUrls];



        const data = {
            name: document.getElementById('editProductName').value,
            description: document.getElementById('editProductDescription').value || null,
            price: parseFloat(document.getElementById('editProductPrice').value),
            images: allImages
        };


        await apiRequest(`/api/v1/products/${productId}`, 'PUT', data);
        showAlert('Товар успешно обновлен', 'success');
        closeEditProductModal();
        await loadShopProducts();
    } catch (error) {
        showAlert('Ошибка обновления товара: ' + error.message, 'error');
    }
}

function removeProductImage(index) {
    if (!window.currentProductImages) {
        return;
    }



    window.currentProductImages.splice(index, 1);



    updateCurrentImagesDisplay();

    showAlert('Изображение удалено. Не забудьте нажать "Сохранить"!', 'success');
}

function updateCurrentImagesDisplay() {
    const currentImagesDiv = document.getElementById('currentImages');
    if (!currentImagesDiv) return;

    if (!window.currentProductImages || window.currentProductImages.length === 0) {
        currentImagesDiv.innerHTML = '<p style="color: #999; font-size: 14px;">Изображений нет</p>';
        return;
    }


    const imagesHTML = window.currentProductImages.map((img, idx) => {
        const imageUrl = formatImageUrl(img);

        return `
            <div style="display: inline-block; position: relative; margin: 5px;">
                <button type="button" onclick="removeProductImage(${idx})" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; cursor: pointer; padding: 4px 8px; font-size: 14px; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="Удалить это изображение">×</button>
            </div>
        `;
    }).join('');

    currentImagesDiv.innerHTML = '<strong>Текущие изображения:</strong><br>' + imagesHTML;
}

let confirmCallback = null;

window.showConfirmDialog = function(message) {
    return new Promise((resolve) => {
        const messageEl = document.getElementById('confirmMessage');
        const dialogEl = document.getElementById('confirmDialog');

        messageEl.textContent = message;
        dialogEl.classList.add('active');
        confirmCallback = resolve;
    });
};

window.closeConfirmDialog = function(result) {
    const dialogEl = document.getElementById('confirmDialog');
    dialogEl.classList.remove('active');
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    } else {
    }
};

window.deleteProduct = async function(productId) {
    const confirmed = await window.showConfirmDialog('Вы уверены, что хотите удалить этот товар?');

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`/api/v1/products/${productId}`, 'DELETE');
        showAlert('Товар успешно удален', 'success');
        await loadShopProducts();
    } catch (error) {
        showAlert('Ошибка удаления товара: ' + error.message, 'error');
    }
};

async function loadShopTransactions() {
    try {
        const container = document.getElementById('shopTransactions');
        if (!container) {
            return;
        }

        const transactions = await apiRequest('/api/v1/shops/me/transactions');

        if (transactions.length === 0) {
            container.innerHTML = '<p style="color: #999;">Транзакций пока нет</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 10px; text-align: left;">Дата</th>
                        <th style="padding: 10px; text-align: left;">Тип</th>
                        <th style="padding: 10px; text-align: right;">Сумма</th>
                        <th style="padding: 10px; text-align: center;">Статус</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => {
            const typeNames = {
                product_rent: 'Аренда товара',
                product_purchase: 'Продажа товара',
                shop_payout: 'Выплата',
                top_up: 'Пополнение'
            };
            const statusNames = {
                pending: 'Ожидает',
                completed: 'Завершена',
                failed: 'Ошибка',
                refunded: 'Возврат'
            };
            const date = new Date(t.created_at).toLocaleDateString('ru-RU');
            return `
                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 10px;">${date}</td>
                                <td style="padding: 10px;">${typeNames[t.type] || t.type}</td>
                                <td style="padding: 10px; text-align: right; font-weight: 600; color: ${t.amount > 0 ? '#10b981' : '#ef4444'};">
                                    ${t.amount > 0 ? '+' : ''}$${t.amount.toFixed(2)}
                                </td>
                                <td style="padding: 10px; text-align: center;">
                                    <span style="padding: 4px 12px; background: ${t.status === 'completed' ? '#d1fae5' : '#fee2e2'}; color: ${t.status === 'completed' ? '#065f46' : '#991b1b'}; border-radius: 12px; font-size: 12px;">
                                        ${statusNames[t.status] || t.status}
                                    </span>
                                </td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
    }
}

async function loadActiveRents() {
    try {
        const container = document.getElementById('activeRents');
        if (!container) {
            return;
        }

        const products = await apiRequest('/api/v1/shops/me/products');
        const activeRented = products.filter(p => p.is_active && p.rent_expires_at);

        if (activeRented.length === 0) {
            container.innerHTML = '<p style="color: #999;">Нет активных подписок на товары</p>';
            return;
        }

        container.innerHTML = activeRented.map(product => {
            const expiresAt = new Date(product.rent_expires_at);
            const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysLeft <= 3;

            return `
                <div style="padding: 15px; border: 1px solid ${isExpiringSoon ? '#fbbf24' : '#e0e0e0'}; border-radius: 10px; margin-bottom: 10px; background: ${isExpiringSoon ? '#fffbeb' : 'white'};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${product.name}</strong>
                            <div style="color: ${isExpiringSoon ? '#d97706' : '#666'}; font-size: 14px; margin-top: 5px;">
                                ${isExpiringSoon ? '⚠️ ' : ''}Истекает через ${daysLeft} дн. (${expiresAt.toLocaleDateString('ru-RU')})
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="payRent(${product.id})">Продлить</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
    }
}

async function payRent(productId) {
    try {

        const settings = await apiRequest('/api/v1/admin/settings');
        const rentPrice = settings.find(s => s.key === 'product_rent_price_monthly')?.value || 10;

        const months = prompt(`Оплата аренды товара\n\nСтоимость: $${rentPrice}/месяц\n\nНа сколько месяцев продлить?`, '1');
        if (!months || isNaN(months) || months < 1) return;

        const payment = await apiRequest('/api/v1/payments/shop/rent-product', 'POST', {
            payment_type: 'product_rent',
            amount: rentPrice * parseInt(months),
            extra_data: {
                product_id: productId,
                months: parseInt(months)
            }
        });

        if (payment.approval_url) {
            window.location.href = payment.approval_url;

        }
    } catch (error) {
        showAlert('Ошибка создания платежа: ' + error.message, 'error');
    }
}

async function topUpShopBalance() {
    try {
        const amount = prompt('Введите сумму пополнения (USD):', '50');
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

        const payment = await apiRequest('/api/v1/payments/shop/top-up', 'POST', {
            payment_type: 'top_up',
            amount: parseFloat(amount)
        });

        if (payment.approval_url) {
            window.location.href = payment.approval_url;

        }
    } catch (error) {
        showAlert('Ошибка создания платежа: ' + error.message, 'error');
    }
}



let wsInitialized = false;

function initShopWebSocket() {
    if (wsInitialized) {
        console.log('[SHOP] WebSocket already initialized');
        return;
    }

    if (window.wsManager && token) {
        // Проверяем состояние WebSocket - отключаем только если уже открыт
        if (window.wsManager.ws) {
            const state = window.wsManager.ws.readyState;
            // CONNECTING = 0, OPEN = 1, CLOSING = 2, CLOSED = 3
            if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
                console.log('[SHOP] WebSocket already active, skipping init');
                return;
            }
        }

        console.log('[SHOP] Initializing WebSocket connection');
        window.wsManager.connect(token, 'shop');

        setupShopWebSocketHandlers();

        // Добавить индикатор статуса WebSocket (если доступен CommonUtils)
        if (typeof CommonUtils !== 'undefined' && CommonUtils.addConnectionStatusIndicator) {
            CommonUtils.addConnectionStatusIndicator();
        }

        wsInitialized = true;
    } else {
        console.log('[SHOP] WebSocket manager or token not available');
    }
}

function setupShopWebSocketHandlers() {
    

    if (window.wsManager.eventHandlers) {

        Object.keys(window.wsManager.eventHandlers).forEach(key => {
            window.wsManager.eventHandlers[key] = [];
        });
    } else {
        window.wsManager.eventHandlers = {};
    }
    

    window.wsManager.on('product.created', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        loadShopProducts();
    });

    window.wsManager.on('product.updated', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        loadShopProducts();
    });

    window.wsManager.on('product.deleted', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        loadShopProducts();
    });

    window.wsManager.on('product.approved', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        loadShopProducts();
        loadShopDashboard();
    });

    window.wsManager.on('product.rejected', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        loadShopProducts();
    });


    window.wsManager.on('balance.updated', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        const balanceElement = document.getElementById('shopBalance');
        if (balanceElement && data.data && data.data.new_balance !== undefined) {
            balanceElement.textContent = `$${data.data.new_balance.toFixed(2)}`;
        }
        loadShopTransactions();
    });


    window.wsManager.on('transaction.completed', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        loadShopTransactions();
    });

    window.wsManager.on('transaction.failed', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });


    window.wsManager.on('order.created', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });

    window.wsManager.on('order.completed', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        loadShopDashboard();
    });


    window.wsManager.on('review.created', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });


    window.wsManager.on('settings.updated', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });


    window.wsManager.onConnectionStateChange((state) => {
        updateConnectionStatus(state);
    });
    
}



function updateConnectionStatus(state) {
    const indicator = document.getElementById('wsConnectionStatus');
    if (!indicator) return;


    indicator.className = 'ws-status';


    switch (state) {
        case 'connected':
            indicator.classList.add('ws-status-connected');
            indicator.title = 'WebSocket подключен';
            break;
        case 'connecting':
        case 'reconnecting':
            indicator.classList.add('ws-status-connecting');
            indicator.title = 'WebSocket подключается...';
            break;
        case 'disconnected':
        case 'error':
            indicator.classList.add('ws-status-disconnected');
            indicator.title = 'WebSocket отключен';
            break;
    }
}


const originalLogout = logout;
logout = function() {
    if (window.wsManager) {
        window.wsManager.disconnect();
    }
    originalLogout();
};


function handleShopSearch() {
    const input = document.getElementById('shopSearchInput');
    if (input) {
        shopSearchQuery = input.value;
        shopCurrentPage = 1;
        renderShopProductsPage();
    }
}

function handleShopSort() {
    const select = document.getElementById('shopSortSelect');
    if (select) {
        shopSortBy = select.value;
        shopCurrentPage = 1;
        renderShopProductsPage();
    }
}

function handleShopStatusFilter() {
    const select = document.getElementById('shopStatusFilter');
    if (select) {
        shopStatusFilter = select.value;
        shopCurrentPage = 1;
        renderShopProductsPage();
    }
}


window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.openAddProductModal = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;
window.createProduct = createProduct;
window.openEditProduct = openEditProduct;
window.closeEditProductModal = closeEditProductModal;
window.updateProduct = updateProduct;
window.removeProductImage = removeProductImage;
window.updateShopProfile = updateShopProfile;
window.payRent = payRent;
window.topUpShopBalance = topUpShopBalance;
window.changeShopPage = changeShopPage;
window.handleShopSearch = handleShopSearch;
window.handleShopSort = handleShopSort;
window.handleShopStatusFilter = handleShopStatusFilter;
