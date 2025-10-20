// Страница настроек платформы

// Инициализировать platform перед любыми запросами
if (!localStorage.getItem('platform')) {
    localStorage.setItem('platform', 'web');
}

async function loadPageData() {
    try {
        // Initialize WebSocket for admin
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'settings.updated': () => { loadSettings(); }
            });
        }
        
        await loadSettings();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadSettings() {
    try {
        const settings = await apiRequest('/api/v1/admin/settings');
        const container = document.getElementById('settingsList');

        container.innerHTML = settings.map(setting => `
            <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200" id="setting_group_${setting.key}">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    ${setting.description || setting.key}
                </label>
                <div class="flex gap-3">
                    <input 
                        type="text" 
                        value="${setting.value}" 
                        id="setting_${setting.key}"
                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                    <button 
                        class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md" 
                        onclick="updateSetting('${setting.key}')"
                    >
                        <i class="fas fa-save mr-2"></i>Сохранить
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showAlert('Ошибка загрузки настроек: ' + error.message, 'error');
    }
}

async function updateSetting(key) {
    try {
        const value = document.getElementById(`setting_${key}`).value;
        await apiRequest(`/api/v1/admin/settings/${key}`, 'PUT', { key, value });
        showAlert('Настройка обновлена', 'success');
    } catch (error) {
        showAlert('Ошибка обновления настройки: ' + error.message, 'error');
    }
}

// WebSocket handlers
function onSettingsUpdate(data) {
    if (data.data && data.data.key) {
        const inputElement = document.getElementById(`setting_${data.data.key}`);
        if (inputElement && data.data.new_value !== undefined) {
            inputElement.value = data.data.new_value;
        }
    }
}

// Make functions globally accessible
window.updateSetting = updateSetting;

// Автоматическая загрузка данных при инициализации страницы
loadPageData();
