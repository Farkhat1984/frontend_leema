/**
 * Admin Wardrobes Page
 * View and manage all user wardrobes
 */

// State
let currentPage = 1;
let currentFilters = {
    search: '',
    user_id: '',
    source: '',
    folder: '',
    is_favorite: ''
};
let stats = null;
let allUsers = []; // Store all users for filter

// Configuration
const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 300;
let searchDebounceTimer = null;

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Admin Wardrobes page loaded');
    
    // Load initial data
    loadStats();
    loadUsers(); // Load users for filter
    loadWardrobes();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                currentFilters.search = e.target.value;
                currentPage = 1;
                loadWardrobes();
            }, DEBOUNCE_DELAY);
        });
    }
    
    // Filter dropdowns
    const userFilter = document.getElementById('userFilter');
    if (userFilter) {
        userFilter.addEventListener('change', (e) => {
            currentFilters.user_id = e.target.value;
            currentPage = 1;
            loadWardrobes();
        });
    }
    
    const sourceFilter = document.getElementById('sourceFilter');
    if (sourceFilter) {
        sourceFilter.addEventListener('change', (e) => {
            currentFilters.source = e.target.value;
            currentPage = 1;
            loadWardrobes();
        });
    }
    
    const folderFilter = document.getElementById('folderFilter');
    if (folderFilter) {
        folderFilter.addEventListener('change', (e) => {
            currentFilters.folder = e.target.value;
            currentPage = 1;
            loadWardrobes();
        });
    }
    
    const favoriteFilter = document.getElementById('favoriteFilter');
    if (favoriteFilter) {
        favoriteFilter.addEventListener('change', (e) => {
            currentFilters.is_favorite = e.target.value;
            currentPage = 1;
            loadWardrobes();
        });
    }
    
    // Reset filters button
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    // Pagination buttons
    const prevBtn = document.getElementById('prevPageBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadWardrobes();
            }
        });
    }
    
    const nextBtn = document.getElementById('nextPageBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            loadWardrobes();
        });
    }
}

/**
 * Load statistics
 */
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/public';
            return;
        }
        
        const response = await fetch(`${API_URL}${window.API_ENDPOINTS.ADMIN.WARDROBES_STATS}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load stats');
        }
        
        stats = await response.json();
        renderStats(stats);
        populateFolderFilter(stats.top_folders);
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        showAlert('Ошибка загрузки статистики', 'error');
    }
}

/**
 * Load users for filter
 */
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/public';
            return;
        }
        
        const response = await fetch(`${API_URL}${window.API_ENDPOINTS.ADMIN.USERS}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        allUsers = await response.json();
        populateUserFilter(allUsers);
        
    } catch (error) {
        console.error('❌ Error loading users:', error);
        // Don't show alert - not critical if user filter doesn't load
    }
}

/**
 * Render statistics
 */
function renderStats(stats) {
    // Total items
    const totalItems = document.getElementById('totalItems');
    if (totalItems) {
        totalItems.innerHTML = stats.total_items.toLocaleString('ru-RU');
    }
    
    // Total users with items
    const totalUsersWithItems = document.getElementById('totalUsersWithItems');
    if (totalUsersWithItems) {
        totalUsersWithItems.innerHTML = stats.total_users_with_items.toLocaleString('ru-RU');
    }
    
    // Average items per user
    const avgItemsPerUser = document.getElementById('avgItemsPerUser');
    if (avgItemsPerUser) {
        avgItemsPerUser.innerHTML = stats.avg_items_per_user.toFixed(1);
    }
    
    // Favorites count
    const favoritesCount = document.getElementById('favoritesCount');
    if (favoritesCount) {
        favoritesCount.innerHTML = stats.favorites_count.toLocaleString('ru-RU');
    }
    
    // Source distribution
    renderSourceDistribution(stats.by_source);
}

/**
 * Render source distribution
 */
function renderSourceDistribution(bySource) {
    const container = document.getElementById('sourceDistribution');
    if (!container) return;
    
    const sourceIcons = {
        'shop_product': { icon: 'fa-store', color: 'green', label: 'Из магазина' },
        'generated': { icon: 'fa-wand-magic-sparkles', color: 'purple', label: 'AI генерация' },
        'uploaded': { icon: 'fa-upload', color: 'blue', label: 'Загружено' },
        'purchased': { icon: 'fa-shopping-bag', color: 'orange', label: 'Куплено' }
    };
    
    container.innerHTML = Object.entries(bySource).map(([source, count]) => {
        const info = sourceIcons[source] || { icon: 'fa-shirt', color: 'gray', label: source };
        return `
            <div class="p-4 bg-${info.color}-50 rounded-lg border border-${info.color}-100">
                <div class="flex items-center justify-between mb-2">
                    <i class="fas ${info.icon} text-${info.color}-600 text-xl"></i>
                    <span class="text-2xl font-bold text-${info.color}-600">${count}</span>
                </div>
                <div class="text-sm text-gray-600">${info.label}</div>
            </div>
        `;
    }).join('');
}

/**
 * Populate folder filter dropdown
 */
function populateFolderFilter(topFolders) {
    const folderFilter = document.getElementById('folderFilter');
    if (!folderFilter) return;
    
    // Keep the "All folders" option
    const currentValue = folderFilter.value;
    folderFilter.innerHTML = '<option value="">Все папки</option>';
    
    topFolders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.folder;
        option.textContent = `${folder.folder} (${folder.item_count})`;
        folderFilter.appendChild(option);
    });
    
    // Restore selected value if it still exists
    if (currentValue) {
        folderFilter.value = currentValue;
    }
}

/**
 * Populate user filter dropdown
 */
function populateUserFilter(users) {
    const userFilter = document.getElementById('userFilter');
    if (!userFilter) return;
    
    // Keep the "All users" option
    const currentValue = userFilter.value;
    userFilter.innerHTML = '<option value="">Все пользователи</option>';
    
    // Sort users by name
    const sortedUsers = users.sort((a, b) => {
        const nameA = (a.name || a.email).toLowerCase();
        const nameB = (b.name || b.email).toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    sortedUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name || 'Unnamed'} (${user.email})`;
        userFilter.appendChild(option);
    });
    
    // Restore selected value if it still exists
    if (currentValue) {
        userFilter.value = currentValue;
    }
}

/**
 * Load wardrobes with filters
 */
async function loadWardrobes() {
    try {
        showLoading();
        
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/public';
            return;
        }
        
        // Build query params
        const skip = (currentPage - 1) * ITEMS_PER_PAGE;
        const params = new URLSearchParams({
            skip: skip,
            limit: ITEMS_PER_PAGE,
            sort_by: 'created_at',
            sort_order: 'desc'
        });
        
        // Add filters if set
        if (currentFilters.search) params.append('search', currentFilters.search);
        if (currentFilters.user_id) params.append('user_id', currentFilters.user_id);
        if (currentFilters.source) params.append('source', currentFilters.source);
        if (currentFilters.folder) params.append('folder', currentFilters.folder);
        if (currentFilters.is_favorite) params.append('is_favorite', currentFilters.is_favorite);
        
        const response = await fetch(`${API_URL}${window.API_ENDPOINTS.ADMIN.WARDROBES}?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load wardrobes');
        }
        
        const data = await response.json();
        renderWardrobes(data);
        updatePagination(data);
        
    } catch (error) {
        console.error('❌ Error loading wardrobes:', error);
        showAlert('Ошибка загрузки гардеробов', 'error');
        hideLoading();
        showEmpty();
    }
}

/**
 * Render wardrobes list
 */
function renderWardrobes(data) {
    const container = document.getElementById('wardrobesList');
    const itemsCount = document.getElementById('itemsCount');
    
    if (!container) return;
    
    hideLoading();
    
    if (!data.items || data.items.length === 0) {
        showEmpty();
        if (itemsCount) itemsCount.textContent = '0';
        return;
    }
    
    hideEmpty();
    if (itemsCount) itemsCount.textContent = data.total.toLocaleString('ru-RU');
    
    container.innerHTML = data.items.map(item => renderWardrobeItem(item)).join('');
}

/**
 * Render single wardrobe item
 */
function renderWardrobeItem(item) {
    const sourceInfo = getSourceInfo(item.source);
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
    // Simple SVG placeholder - no 404 errors
    const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="40" fill="%239ca3af"%3E👕%3C/text%3E%3C/svg%3E';
    // Prepend API_URL to relative image paths
    const imageUrl = firstImage ? (firstImage.startsWith('http') ? firstImage : `${API_URL}${firstImage}`) : placeholderSvg;
    
    // Format date
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    
    return `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" 
             onclick="openItemModal(${item.id})">
            <div class="flex items-start space-x-4">
                <!-- Image -->
                <div class="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <img src="${imageUrl}" alt="${item.name}" 
                         class="w-full h-full object-cover">
                </div>
                
                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 truncate">
                                ${item.name}
                                ${item.is_favorite ? '<i class="fas fa-star text-yellow-500 ml-2"></i>' : ''}
                            </h3>
                            <p class="text-sm text-gray-600 mt-1">
                                <i class="fas fa-user mr-1"></i>
                                ${item.user_name || 'Unknown'} 
                                <span class="text-gray-400">(${item.user_email})</span>
                            </p>
                        </div>
                        <div class="flex-shrink-0 ml-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${sourceInfo.color}-100 text-${sourceInfo.color}-800">
                                <i class="fas ${sourceInfo.icon} mr-1"></i>
                                ${sourceInfo.label}
                            </span>
                        </div>
                    </div>
                    
                    ${item.description ? `
                        <p class="text-sm text-gray-500 mt-2 line-clamp-2">${item.description}</p>
                    ` : ''}
                    
                    <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span>
                            <i class="fas fa-calendar mr-1"></i>
                            ${formattedDate}
                        </span>
                        ${item.folder ? `
                            <span>
                                <i class="fas fa-folder mr-1"></i>
                                ${item.folder}
                            </span>
                        ` : ''}
                        ${item.images && item.images.length > 1 ? `
                            <span>
                                <i class="fas fa-images mr-1"></i>
                                ${item.images.length} фото
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get source info (icon, color, label)
 */
function getSourceInfo(source) {
    const sourceMap = {
        'shop_product': { icon: 'fa-store', color: 'green', label: 'Из магазина' },
        'generated': { icon: 'fa-wand-magic-sparkles', color: 'purple', label: 'AI' },
        'uploaded': { icon: 'fa-upload', color: 'blue', label: 'Загружено' },
        'purchased': { icon: 'fa-shopping-bag', color: 'orange', label: 'Куплено' }
    };
    return sourceMap[source] || { icon: 'fa-shirt', color: 'gray', label: source };
}

/**
 * Update pagination controls
 */
function updatePagination(data) {
    const currentPageEl = document.getElementById('currentPage');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (currentPageEl) {
        currentPageEl.textContent = data.page;
    }
    
    // Previous button
    if (prevBtn) {
        if (data.page > 1) {
            prevBtn.disabled = false;
            prevBtn.classList.remove('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
            prevBtn.classList.add('bg-purple-600', 'text-white', 'hover:bg-purple-700', 'cursor-pointer');
        } else {
            prevBtn.disabled = true;
            prevBtn.classList.add('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
            prevBtn.classList.remove('bg-purple-600', 'text-white', 'hover:bg-purple-700', 'cursor-pointer');
        }
    }
    
    // Next button
    if (nextBtn) {
        if (data.has_more) {
            nextBtn.disabled = false;
            nextBtn.classList.remove('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
            nextBtn.classList.add('bg-purple-600', 'text-white', 'hover:bg-purple-700', 'cursor-pointer');
        } else {
            nextBtn.disabled = true;
            nextBtn.classList.add('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
            nextBtn.classList.remove('bg-purple-600', 'text-white', 'hover:bg-purple-700', 'cursor-pointer');
        }
    }
}

/**
 * Open item modal with details
 */
async function openItemModal(itemId) {
    const modal = document.getElementById('itemModal');
    if (!modal) return;
    
    try {
        // Show modal with loading state
        modal.classList.remove('hidden');
        const modalContent = document.getElementById('modalContent');
        if (modalContent) {
            modalContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-purple-600"></i></div>';
        }
        
        // Fetch item details
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${window.API_ENDPOINTS.ADMIN.WARDROBES}/${itemId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Failed to load item');
        
        const item = await response.json();
        
        if (!item) throw new Error('Item not found');
        
        renderModalContent(item);
        
    } catch (error) {
        console.error('❌ Error loading item details:', error);
        closeModal();
        showAlert('Ошибка загрузки деталей вещи', 'error');
    }
}

/**
 * Render modal content
 */
function renderModalContent(item) {
    const modalName = document.getElementById('modalItemName');
    const modalContent = document.getElementById('modalContent');
    
    if (modalName) {
        modalName.textContent = item.name;
    }
    
    if (!modalContent) return;
    
    const sourceInfo = getSourceInfo(item.source);
    const date = new Date(item.created_at);
    const updatedDate = new Date(item.updated_at);
    
    modalContent.innerHTML = `
        <div class="space-y-6">
            <!-- Images Gallery -->
            ${item.images && item.images.length > 0 ? `
                <div>
                    <h4 class="text-sm font-semibold text-gray-900 mb-3">Изображения</h4>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        ${item.images.map(img => {
                            // Prepend API_URL to relative image paths
                            const imgUrl = img.startsWith('http') ? img : `${API_URL}${img}`;
                            return `
                            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img src="${imgUrl}" alt="${item.name}" 
                                     class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                     onerror="this.style.display='none'"
                                     onclick="window.open('${imgUrl}', '_blank')">
                            </div>
                        `}).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- User Info -->
            <div>
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Пользователь</h4>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-sm">
                        <span class="font-medium">Имя:</span> ${item.user_name || 'N/A'}
                    </p>
                    <p class="text-sm mt-1">
                        <span class="font-medium">Email:</span> ${item.user_email}
                    </p>
                    <p class="text-sm mt-1">
                        <span class="font-medium">ID:</span> ${item.user_id}
                    </p>
                </div>
            </div>
            
            <!-- Item Details -->
            <div>
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Детали вещи</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p class="text-sm">
                        <span class="font-medium">Источник:</span>
                        <span class="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${sourceInfo.color}-100 text-${sourceInfo.color}-800">
                            <i class="fas ${sourceInfo.icon} mr-1"></i>
                            ${sourceInfo.label}
                        </span>
                    </p>
                    ${item.description ? `
                        <p class="text-sm">
                            <span class="font-medium">Описание:</span><br>
                            ${item.description}
                        </p>
                    ` : ''}
                    ${item.folder ? `
                        <p class="text-sm">
                            <span class="font-medium">Папка:</span> ${item.folder}
                        </p>
                    ` : ''}
                    ${item.shop_name ? `
                        <p class="text-sm">
                            <span class="font-medium">Магазин:</span> ${item.shop_name}
                        </p>
                    ` : ''}
                    ${item.price ? `
                        <p class="text-sm">
                            <span class="font-medium">Цена:</span> ₸${item.price.toFixed(2)}
                        </p>
                    ` : ''}
                    <p class="text-sm">
                        <span class="font-medium">Избранное:</span> 
                        ${item.is_favorite ? '<i class="fas fa-star text-yellow-500"></i> Да' : 'Нет'}
                    </p>
                </div>
            </div>
            
            <!-- Characteristics -->
            ${item.characteristics && Object.keys(item.characteristics).length > 0 ? `
                <div>
                    <h4 class="text-sm font-semibold text-gray-900 mb-3">Характеристики</h4>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <pre class="text-sm text-gray-700 overflow-x-auto">${JSON.stringify(item.characteristics, null, 2)}</pre>
                    </div>
                </div>
            ` : ''}
            
            <!-- References -->
            ${item.original_product_id || item.generation_id ? `
                <div>
                    <h4 class="text-sm font-semibold text-gray-900 mb-3">Ссылки</h4>
                    <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                        ${item.original_product_id ? `
                            <p class="text-sm">
                                <span class="font-medium">ID продукта:</span> ${item.original_product_id}
                            </p>
                        ` : ''}
                        ${item.generation_id ? `
                            <p class="text-sm">
                                <span class="font-medium">ID генерации:</span> ${item.generation_id}
                            </p>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            <!-- Timestamps -->
            <div>
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Временные метки</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p class="text-sm">
                        <span class="font-medium">Создано:</span> ${date.toLocaleString('ru-RU')}
                    </p>
                    <p class="text-sm">
                        <span class="font-medium">Обновлено:</span> ${updatedDate.toLocaleString('ru-RU')}
                    </p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('itemModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Reset all filters
 */
function resetFilters() {
    currentFilters = {
        search: '',
        user_id: '',
        source: '',
        folder: '',
        is_favorite: ''
    };
    
    // Reset form inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const userFilter = document.getElementById('userFilter');
    if (userFilter) userFilter.value = '';
    
    const sourceFilter = document.getElementById('sourceFilter');
    if (sourceFilter) sourceFilter.value = '';
    
    const folderFilter = document.getElementById('folderFilter');
    if (folderFilter) folderFilter.value = '';
    
    const favoriteFilter = document.getElementById('favoriteFilter');
    if (favoriteFilter) favoriteFilter.value = '';
    
    currentPage = 1;
    loadWardrobes();
}

/**
 * Show loading state
 */
function showLoading() {
    const loading = document.getElementById('loadingState');
    const list = document.getElementById('wardrobesList');
    const empty = document.getElementById('emptyState');
    
    if (loading) loading.classList.remove('hidden');
    if (list) list.innerHTML = '';
    if (empty) empty.classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
    const loading = document.getElementById('loadingState');
    if (loading) loading.classList.add('hidden');
}

/**
 * Show empty state
 */
function showEmpty() {
    const empty = document.getElementById('emptyState');
    const list = document.getElementById('wardrobesList');
    
    if (empty) empty.classList.remove('hidden');
    if (list) list.innerHTML = '';
}

/**
 * Hide empty state
 */
function hideEmpty() {
    const empty = document.getElementById('emptyState');
    if (empty) empty.classList.add('hidden');
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const container = document.getElementById('adminAlertContainer');
    if (!container) return;
    
    const colors = {
        success: 'bg-green-100 text-green-800 border-green-200',
        error: 'bg-red-100 text-red-800 border-red-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    const alert = document.createElement('div');
    alert.className = `${colors[type]} border rounded-lg p-4 mb-4`;
    alert.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => alert.remove(), 5000);
}

// Make closeModal available globally
window.closeModal = closeModal;
window.openItemModal = openItemModal;
